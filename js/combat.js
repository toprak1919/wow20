// Combat.js - Combat mechanics and damage calculation
class Combat {
    constructor(game) {
        this.game = game;
        
        // Combat constants
        this.globalCooldown = 1.5;
        this.baseMissChance = 0.05;
        this.baseCritChance = 0.05;
        this.baseBlockChance = 0.05;
        this.baseDodgeChance = 0.05;
        this.baseParryChance = 0.05;
        
        // Threat system
        this.threatTable = new Map();
        
        // Combat log
        this.combatLog = [];
        this.maxLogEntries = 100;
    }
    
    dealDamage(attacker, target, baseDamage, source = 'Attack', damageType = 'physical') {
        if (!target || !target.alive) return 0;
        
        // Calculate hit chance
        if (!this.rollHit(attacker, target)) {
            this.onMiss(attacker, target, source);
            return 0;
        }
        
        // Calculate actual damage
        let damage = baseDamage;
        
        // Apply critical strike
        const critRoll = Math.random();
        let isCrit = false;
        if (critRoll < this.getCritChance(attacker)) {
            damage *= 2;
            isCrit = true;
        }
        
        // Apply armor mitigation for physical damage
        if (damageType === 'physical') {
            damage = this.applyArmorMitigation(damage, target);
        } else if (damageType === 'magical') {
            damage = this.applyResistance(damage, target, damageType);
        }
        
        // Check for blocks, dodges, parries
        if (damageType === 'physical') {
            if (this.rollBlock(target)) {
                damage *= 0.5;
                this.onBlock(attacker, target, damage, source);
                return damage;
            }
            
            if (this.rollDodge(target)) {
                this.onDodge(attacker, target, source);
                return 0;
            }
            
            if (this.rollParry(target)) {
                this.onParry(attacker, target, source);
                return 0;
            }
        }
        
        // Apply damage
        damage = Math.floor(damage);
        target.takeDamage(damage, attacker);
        
        // Generate threat
        this.generateThreat(attacker, target, damage);
        
        // Combat log and floating text
        this.logCombat(attacker, target, damage, source, isCrit);
        this.showDamageText(target, damage, isCrit, damageType);
        
        // Check for procs and triggers
        this.checkCombatTriggers(attacker, target, damage, 'damage');
        
        // Award experience if target dies
        if (target.health <= 0 && attacker === this.game.player) {
            this.onEnemyKilled(target);
        }
        
        return damage;
    }
    
    heal(healer, target, baseHealing, source = 'Heal', isCrit = false) {
        if (!target || !target.alive) return 0;
        
        let healing = baseHealing;
        
        // Apply healing modifiers
        if (healer.healingPower) {
            healing += healer.healingPower * 0.5;
        }
        
        // Critical healing
        const critRoll = Math.random();
        if (critRoll < this.getCritChance(healer)) {
            healing *= 1.5;
            isCrit = true;
        }
        
        // Apply healing
        const actualHealing = Math.min(healing, target.maxHealth - target.health);
        target.heal(actualHealing);
        
        // Generate threat (healing generates threat)
        if (healer !== target) {
            const enemies = this.getEnemiesInCombat();
            enemies.forEach(enemy => {
                this.generateThreat(healer, enemy, actualHealing * 0.5);
            });
        }
        
        // Combat log and floating text
        this.logHealing(healer, target, actualHealing, source, isCrit);
        this.showHealingText(target, actualHealing, isCrit);
        
        // Check for procs and triggers
        this.checkCombatTriggers(healer, target, actualHealing, 'heal');
        
        return actualHealing;
    }
    
    rollHit(attacker, target) {
        const hitChance = this.getHitChance(attacker, target);
        return Math.random() < hitChance;
    }
    
    rollBlock(target) {
        if (!target.equipment || !target.equipment.offhand || 
            target.equipment.offhand.type !== 'shield') {
            return false;
        }
        return Math.random() < this.getBlockChance(target);
    }
    
    rollDodge(target) {
        return Math.random() < this.getDodgeChance(target);
    }
    
    rollParry(target) {
        if (!target.equipment || !target.equipment.mainhand) {
            return false;
        }
        return Math.random() < this.getParryChance(target);
    }
    
    getHitChance(attacker, target) {
        let hitChance = 0.95; // Base 95% hit chance
        
        // Level difference modifier
        const levelDiff = target.level - attacker.level;
        if (levelDiff > 0) {
            hitChance -= levelDiff * 0.02;
        }
        
        // Attacker hit rating
        if (attacker.hitRating) {
            hitChance += attacker.hitRating * 0.01;
        }
        
        return Math.max(0.01, Math.min(1, hitChance));
    }
    
    getCritChance(attacker) {
        let critChance = this.baseCritChance;
        
        if (attacker.critChance) {
            critChance = attacker.critChance;
        }
        
        // Agility increases crit chance
        if (attacker.attributes && attacker.attributes.agility) {
            critChance += attacker.attributes.agility * 0.0005;
        }
        
        return Math.min(1, critChance);
    }
    
    getBlockChance(target) {
        let blockChance = this.baseBlockChance;
        
        if (target.blockChance) {
            blockChance = target.blockChance;
        }
        
        // Strength increases block chance
        if (target.attributes && target.attributes.strength) {
            blockChance += target.attributes.strength * 0.0002;
        }
        
        return Math.min(0.75, blockChance);
    }
    
    getDodgeChance(target) {
        let dodgeChance = this.baseDodgeChance;
        
        if (target.dodgeChance) {
            dodgeChance = target.dodgeChance;
        }
        
        // Agility increases dodge chance
        if (target.attributes && target.attributes.agility) {
            dodgeChance += target.attributes.agility * 0.0004;
        }
        
        return Math.min(0.5, dodgeChance);
    }
    
    getParryChance(target) {
        let parryChance = this.baseParryChance;
        
        if (target.parryChance) {
            parryChance = target.parryChance;
        }
        
        // Strength increases parry chance
        if (target.attributes && target.attributes.strength) {
            parryChance += target.attributes.strength * 0.0003;
        }
        
        return Math.min(0.5, parryChance);
    }
    
    applyArmorMitigation(damage, target) {
        const armor = target.armor || 0;
        const reduction = armor / (armor + 400 + 85 * target.level);
        
        return damage * (1 - reduction);
    }
    
    applyResistance(damage, target, school) {
        const resistance = target.resistance ? (target.resistance[school] || 0) : 0;
        const reduction = resistance / (resistance + 100);
        
        return damage * (1 - reduction);
    }
    
    generateThreat(source, target, amount) {
        if (target.type !== 'enemy') return;
        
        // Initialize threat table for this enemy if needed
        if (!this.threatTable.has(target)) {
            this.threatTable.set(target, new Map());
        }
        
        const enemyThreat = this.threatTable.get(target);
        const currentThreat = enemyThreat.get(source) || 0;
        
        // Apply threat modifiers
        let threatAmount = amount;
        if (source.threatModifier) {
            threatAmount *= source.threatModifier;
        }
        
        enemyThreat.set(source, currentThreat + threatAmount);
        
        // Update enemy target based on threat
        this.updateEnemyTarget(target);
    }
    
    updateEnemyTarget(enemy) {
        const enemyThreat = this.threatTable.get(enemy);
        if (!enemyThreat || enemyThreat.size === 0) return;
        
        // Find highest threat target
        let highestThreat = 0;
        let newTarget = null;
        
        for (const [entity, threat] of enemyThreat) {
            if (threat > highestThreat && entity.alive) {
                highestThreat = threat;
                newTarget = entity;
            }
        }
        
        // Switch target if new target has 110% more threat (tank switching mechanic)
        if (newTarget && newTarget !== enemy.target) {
            const currentTargetThreat = enemyThreat.get(enemy.target) || 0;
            if (highestThreat > currentTargetThreat * 1.1) {
                enemy.target = newTarget;
                if (enemy.ai) {
                    enemy.ai.combatTarget = newTarget;
                }
            }
        }
    }
    
    getEnemiesInRadius(position, radius) {
        const enemies = [];
        
        for (const entity of this.game.entities.values()) {
            if (entity.type === 'enemy' && entity.alive) {
                const distance = position.distanceTo(entity.position);
                if (distance <= radius) {
                    enemies.push(entity);
                }
            }
        }
        
        return enemies;
    }
    
    getEnemiesInCombat() {
        const enemies = [];
        
        for (const entity of this.game.entities.values()) {
            if (entity.type === 'enemy' && entity.alive && 
                entity.target && entity.ai && entity.ai.state === 'combat') {
                enemies.push(entity);
            }
        }
        
        return enemies;
    }
    
    onMiss(attacker, target, source) {
        this.logCombat(attacker, target, 0, source, false, 'miss');
        this.showCombatText(target, 'Miss', 'miss');
    }
    
    onDodge(attacker, target, source) {
        this.logCombat(attacker, target, 0, source, false, 'dodge');
        this.showCombatText(target, 'Dodge', 'dodge');
    }
    
    onParry(attacker, target, source) {
        this.logCombat(attacker, target, 0, source, false, 'parry');
        this.showCombatText(target, 'Parry', 'parry');
    }
    
    onBlock(attacker, target, damage, source) {
        this.logCombat(attacker, target, damage, source, false, 'block');
        this.showCombatText(target, `Block (${damage})`, 'block');
    }
    
    onEnemyKilled(enemy) {
        // Award experience
        const xpAmount = this.calculateExperience(enemy);
        this.game.player.gainExperience(xpAmount);
        
        // Generate loot
        const loot = this.generateLoot(enemy);
        if (loot.length > 0) {
            enemy.loot = loot;
            enemy.lootable = true;
            
            // Auto-loot gold
            const gold = loot.find(item => item.type === 'currency');
            if (gold) {
                this.game.player.addCurrency(gold.value);
                enemy.loot = enemy.loot.filter(item => item !== gold);
            }
        }
        
        // Update kill statistics
        this.game.stats.enemiesKilled++;
        
        // Check quest objectives
        this.game.quests.checkKillObjective(enemy);
        
        // Clear threat
        this.threatTable.delete(enemy);
    }
    
    calculateExperience(enemy) {
        const baseXP = enemy.level * 45;
        const levelDiff = enemy.level - this.game.player.level;
        
        let xpModifier = 1;
        if (levelDiff >= 5) {
            xpModifier = 1.2;
        } else if (levelDiff <= -5) {
            xpModifier = 0.1;
        } else if (levelDiff < 0) {
            xpModifier = 1 + (levelDiff * 0.1);
        }
        
        return Math.floor(baseXP * xpModifier);
    }
    
    generateLoot(enemy) {
        const loot = [];
        
        if (enemy.lootTable) {
            enemy.lootTable.forEach(lootEntry => {
                if (Math.random() < lootEntry.chance) {
                    loot.push({...lootEntry.item});
                }
            });
        }
        
        return loot;
    }
    
    checkCombatTriggers(source, target, amount, type) {
        // Check for proc effects on equipment
        if (source.equipment) {
            Object.values(source.equipment).forEach(item => {
                if (item && item.procs) {
                    item.procs.forEach(proc => {
                        if (proc.trigger === type && Math.random() < proc.chance) {
                            this.triggerProc(proc, source, target);
                        }
                    });
                }
            });
        }
        
        // Check for buff/debuff triggers
        if (source.buffs) {
            for (const buff of source.buffs.values()) {
                if (buff.onDamage && type === 'damage') {
                    buff.onDamage(source, target, amount);
                }
            }
        }
    }
    
    triggerProc(proc, source, target) {
        switch (proc.type) {
            case 'damage':
                this.dealDamage(source, target, proc.damage, proc.name, proc.school || 'physical');
                break;
            case 'heal':
                this.heal(source, source, proc.healing, proc.name);
                break;
            case 'buff':
                source.applyBuff(proc.buffId, proc.buff);
                break;
            case 'debuff':
                target.applyDebuff(proc.debuffId, proc.debuff);
                break;
        }
        
        this.game.ui.showCombatText(`${proc.name} triggered!`, 'proc');
    }
    
    logCombat(attacker, target, damage, source, isCrit, result = 'hit') {
        const entry = {
            timestamp: Date.now(),
            attacker: attacker.name || attacker.type,
            target: target.name || target.type,
            damage: damage,
            source: source,
            isCrit: isCrit,
            result: result
        };
        
        this.combatLog.push(entry);
        
        // Keep log size limited
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog.shift();
        }
        
        // Add to chat combat log
        let message = '';
        switch (result) {
            case 'hit':
                message = `${entry.attacker}'s ${source} ${isCrit ? 'crits' : 'hits'} ${entry.target} for ${damage} damage`;
                break;
            case 'miss':
                message = `${entry.attacker}'s ${source} missed ${entry.target}`;
                break;
            case 'dodge':
                message = `${entry.target} dodged ${entry.attacker}'s ${source}`;
                break;
            case 'parry':
                message = `${entry.target} parried ${entry.attacker}'s ${source}`;
                break;
            case 'block':
                message = `${entry.target} blocked ${entry.attacker}'s ${source} (${damage} damage)`;
                break;
        }
        
        this.game.ui.addChatMessage('combat', 'Combat', message);
    }
    
    logHealing(healer, target, healing, source, isCrit) {
        const entry = {
            timestamp: Date.now(),
            healer: healer.name || healer.type,
            target: target.name || target.type,
            healing: healing,
            source: source,
            isCrit: isCrit
        };
        
        this.combatLog.push(entry);
        
        const message = `${entry.healer}'s ${source} heals ${entry.target} for ${healing}${isCrit ? ' (Critical)' : ''}`;
        this.game.ui.addChatMessage('combat', 'Combat', message);
    }
    
    showDamageText(target, damage, isCrit, damageType) {
        const color = damageType === 'physical' ? '#ffffff' : '#ffff00';
        const text = isCrit ? `${damage}!` : damage.toString();
        const type = isCrit ? 'crit' : 'damage';
        
        this.showCombatText(target, text, type, color);
    }
    
    showHealingText(target, healing, isCrit) {
        const text = isCrit ? `+${healing}!` : `+${healing}`;
        const type = isCrit ? 'crit-heal' : 'heal';
        
        this.showCombatText(target, text, type, '#00ff00');
    }
    
    showCombatText(target, text, type, color = '#ffffff') {
        const position = target.position.clone();
        position.y += 2;
        
        this.game.ui.showCombatText(text, type, position);
    }
    
    startCombat(attacker, target) {
        this.game.gameState.inCombat = true;
        
        // Initialize threat
        this.generateThreat(attacker, target, 1);
        
        // Start combat music
        // this.game.audio.playMusic('combat');
    }
    
    endCombat() {
        this.game.gameState.inCombat = false;
        
        // Clear threat tables
        this.threatTable.clear();
        
        // Stop combat music
        // this.game.audio.playMusic('ambient');
    }
    
    update(deltaTime) {
        // Check if still in combat
        const enemiesInCombat = this.getEnemiesInCombat();
        
        if (this.game.gameState.inCombat && enemiesInCombat.length === 0) {
            // No enemies in combat, end combat after delay
            if (!this.combatEndTimer) {
                this.combatEndTimer = 5;
            }
            
            this.combatEndTimer -= deltaTime;
            if (this.combatEndTimer <= 0) {
                this.endCombat();
                this.combatEndTimer = null;
            }
        } else if (enemiesInCombat.length > 0) {
            this.combatEndTimer = null;
            
            if (!this.game.gameState.inCombat) {
                this.startCombat(this.game.player, enemiesInCombat[0]);
            }
        }
    }
}
