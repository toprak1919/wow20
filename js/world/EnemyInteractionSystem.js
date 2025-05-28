// EnemyInteractionSystem.js - Enhanced enemy interaction system
class EnemyInteractionSystem {
    constructor(game) {
        this.game = game;
        
        // Interaction types registry
        this.interactionTypes = new Map();
        
        // Active interactions
        this.activeInteractions = new Map();
        
        // Interaction history for context
        this.interactionHistory = new Map();
        
        // Initialize core interactions
        this.initializeInteractions();
    }
    
    initializeInteractions() {
        // Combat interactions
        this.registerInteraction('taunt', new TauntInteraction());
        this.registerInteraction('challenge', new ChallengeInteraction());
        this.registerInteraction('rally', new RallyInteraction());
        
        // Environmental interactions
        this.registerInteraction('alert', new AlertInteraction());
        this.registerInteraction('call_for_help', new CallForHelpInteraction());
        this.registerInteraction('coordinate_attack', new CoordinateAttackInteraction());
        
        // Special interactions
        this.registerInteraction('death_rattle', new DeathRattleInteraction());
        this.registerInteraction('flee_warning', new FleeWarningInteraction());
        this.registerInteraction('intimidate', new IntimidateInteraction());
        
        // Dialogue interactions
        this.registerInteraction('combat_dialogue', new CombatDialogueInteraction());
        this.registerInteraction('idle_chatter', new IdleChatterInteraction());
    }
    
    registerInteraction(name, interaction) {
        this.interactionTypes.set(name, interaction);
    }
    
    // Trigger an interaction between entities
    triggerInteraction(type, source, target, data = {}) {
        const interaction = this.interactionTypes.get(type);
        if (!interaction) {
            console.warn(`Interaction type not found: ${type}`);
            return;
        }
        
        // Check if interaction can trigger
        if (!interaction.canTrigger(source, target, data)) {
            return;
        }
        
        // Create interaction instance
        const instance = {
            id: `interaction_${Date.now()}_${Math.random()}`,
            type: type,
            source: source,
            target: target,
            data: data,
            startTime: Date.now(),
            interaction: interaction
        };
        
        // Execute interaction
        interaction.execute(source, target, data, this);
        
        // Track active interaction
        this.activeInteractions.set(instance.id, instance);
        
        // Add to history
        this.addToHistory(source, type, instance);
        
        // Schedule cleanup
        if (interaction.duration) {
            setTimeout(() => {
                this.cleanupInteraction(instance.id);
            }, interaction.duration);
        }
    }
    
    // Check for contextual interactions
    checkContextualInteractions(enemy) {
        // Check health-based interactions
        const healthPercent = enemy.health / enemy.maxHealth;
        
        if (healthPercent <= 0.2 && !this.hasRecentInteraction(enemy, 'flee_warning')) {
            this.triggerInteraction('flee_warning', enemy, null);
        }
        
        if (healthPercent <= 0.5 && !this.hasRecentInteraction(enemy, 'call_for_help')) {
            const allies = this.findNearbyAllies(enemy, 30);
            if (allies.length > 0) {
                this.triggerInteraction('call_for_help', enemy, allies);
            }
        }
        
        // Check combat state interactions
        if (enemy.ai && enemy.ai.stateData.target) {
            this.checkCombatInteractions(enemy);
        } else {
            this.checkIdleInteractions(enemy);
        }
    }
    
    checkCombatInteractions(enemy) {
        const target = enemy.ai.stateData.target;
        
        // Taunt chance
        if (Math.random() < 0.1 && !this.hasRecentInteraction(enemy, 'taunt', 10)) {
            this.triggerInteraction('taunt', enemy, target);
        }
        
        // Combat dialogue
        if (Math.random() < 0.05 && !this.hasRecentInteraction(enemy, 'combat_dialogue', 15)) {
            this.triggerInteraction('combat_dialogue', enemy, target);
        }
        
        // Rally allies if multiple enemies in combat
        const combatAllies = this.findCombatAllies(enemy, 20);
        if (combatAllies.length >= 2 && Math.random() < 0.2) {
            this.triggerInteraction('rally', enemy, combatAllies);
        }
    }
    
    checkIdleInteractions(enemy) {
        // Idle chatter with nearby allies
        if (Math.random() < 0.02) {
            const allies = this.findNearbyAllies(enemy, 10);
            if (allies.length > 0) {
                this.triggerInteraction('idle_chatter', enemy, allies[0]);
            }
        }
    }
    
    // Utility methods
    findNearbyAllies(enemy, radius) {
        const allies = [];
        
        for (const entity of this.game.entities.values()) {
            if (entity.type === 'enemy' && 
                entity !== enemy && 
                entity.alive &&
                entity.faction === enemy.faction) {
                
                const distance = enemy.distanceTo(entity);
                if (distance <= radius) {
                    allies.push(entity);
                }
            }
        }
        
        return allies;
    }
    
    findCombatAllies(enemy, radius) {
        return this.findNearbyAllies(enemy, radius).filter(ally =>
            ally.ai && ally.ai.stateData.target
        );
    }
    
    hasRecentInteraction(entity, type, timeWindow = 5) {
        const history = this.interactionHistory.get(entity.id);
        if (!history) return false;
        
        const recent = history.filter(h => 
            h.type === type && 
            (Date.now() - h.startTime) < timeWindow * 1000
        );
        
        return recent.length > 0;
    }
    
    addToHistory(entity, type, instance) {
        if (!this.interactionHistory.has(entity.id)) {
            this.interactionHistory.set(entity.id, []);
        }
        
        const history = this.interactionHistory.get(entity.id);
        history.push(instance);
        
        // Keep history limited
        if (history.length > 20) {
            history.shift();
        }
    }
    
    cleanupInteraction(id) {
        this.activeInteractions.delete(id);
    }
    
    update(deltaTime) {
        // Update active interactions
        for (const [id, instance] of this.activeInteractions) {
            if (instance.interaction.update) {
                instance.interaction.update(instance, deltaTime);
            }
        }
        
        // Periodically check entities for contextual interactions
        for (const entity of this.game.entities.values()) {
            if (entity.type === 'enemy' && entity.alive) {
                // Random chance to check interactions (performance optimization)
                if (Math.random() < 0.1) {
                    this.checkContextualInteractions(entity);
                }
            }
        }
    }
}

// Base Interaction Class
class BaseInteraction {
    constructor() {
        this.duration = 0; // 0 means instant
    }
    
    canTrigger(source, target, data) {
        return source && source.alive;
    }
    
    execute(source, target, data, system) {
        // Override in subclasses
    }
    
    update(instance, deltaTime) {
        // Override if needed
    }
}

// Taunt Interaction
class TauntInteraction extends BaseInteraction {
    constructor() {
        super();
        this.taunts = [
            "You fight like a peasant!",
            "Is that the best you can do?",
            "My grandmother hits harder than you!",
            "You'll make a fine corpse!",
            "Prepare to meet your doom!",
            "You dare challenge me?"
        ];
    }
    
    canTrigger(source, target, data) {
        return super.canTrigger(source, target, data) && 
               target && target.alive &&
               source.distanceTo(target) <= 15;
    }
    
    execute(source, target, data, system) {
        const taunt = this.taunts[Math.floor(Math.random() * this.taunts.length)];
        
        // Show taunt above enemy
        system.game.ui.showCombatText(
            taunt,
            'taunt',
            source.position,
            '#ff9999'
        );
        
        // Add to chat
        system.game.ui.addChatMessage(
            'say',
            source.name,
            taunt,
            '#ff9999'
        );
        
        // Intimidation effect
        if (target.type === 'player' && Math.random() < 0.3) {
            // Could apply a debuff or effect
        }
    }
}

// Rally Interaction
class RallyInteraction extends BaseInteraction {
    constructor() {
        super();
        this.rallyCries = [
            "For the Horde!",
            "Attack together!",
            "Show no mercy!",
            "Fight as one!",
            "Victory or death!"
        ];
    }
    
    execute(source, target, data, system) {
        const cry = this.rallyCries[Math.floor(Math.random() * this.rallyCries.length)];
        
        // Show rally cry
        system.game.ui.showCombatText(
            cry,
            'rally',
            source.position,
            '#ffff00'
        );
        
        // Buff nearby allies
        const allies = Array.isArray(target) ? target : [target];
        allies.forEach(ally => {
            if (ally && ally.alive) {
                // Temporary buff
                const originalAttack = ally.attackPower;
                ally.attackPower *= 1.2;
                
                // Show buff effect
                system.game.ui.showCombatText(
                    'Rallied!',
                    'buff',
                    ally.position,
                    '#00ff00'
                );
                
                // Remove buff after duration
                setTimeout(() => {
                    if (ally.alive) {
                        ally.attackPower = originalAttack;
                    }
                }, 10000);
            }
        });
    }
}

// Alert Interaction
class AlertInteraction extends BaseInteraction {
    execute(source, target, data, system) {
        // Alert nearby allies
        const alertRadius = 30;
        const allies = system.findNearbyAllies(source, alertRadius);
        
        // Show alert
        system.game.ui.showCombatText(
            '!',
            'alert',
            source.position,
            '#ff0000'
        );
        
        // Make allies aware of threat
        allies.forEach(ally => {
            if (ally.ai && ally.ai.state === 'idle') {
                // Point allies toward the threat
                if (data.threatPosition) {
                    ally.faceTarget(data.threatPosition);
                }
                
                // Increase their awareness
                ally.ai.config.aggroRange *= 1.5;
                
                // Reset after some time
                setTimeout(() => {
                    ally.ai.config.aggroRange /= 1.5;
                }, 30000);
            }
        });
    }
}

// Call for Help Interaction
class CallForHelpInteraction extends BaseInteraction {
    constructor() {
        super();
        this.helpCries = [
            "Help me!",
            "I need assistance!",
            "To my aid!",
            "They're too strong!",
            "Backup needed!"
        ];
    }
    
    execute(source, target, data, system) {
        const cry = this.helpCries[Math.floor(Math.random() * this.helpCries.length)];
        
        // Show help cry
        system.game.ui.showCombatText(
            cry,
            'help',
            source.position,
            '#ffff00'
        );
        
        // Make nearby allies come to help
        const allies = Array.isArray(target) ? target : system.findNearbyAllies(source, 40);
        
        allies.forEach(ally => {
            if (ally.ai && ally.ai.state !== 'combat') {
                // Set the ally's target to source's target
                if (source.ai && source.ai.stateData.target) {
                    ally.ai.stateData.target = source.ai.stateData.target;
                    ally.ai.setBehavior('chase');
                    
                    // Show response
                    setTimeout(() => {
                        system.game.ui.showCombatText(
                            "On my way!",
                            'response',
                            ally.position,
                            '#00ffff'
                        );
                    }, 500 + Math.random() * 1000);
                }
            }
        });
    }
}

// Death Rattle Interaction
class DeathRattleInteraction extends BaseInteraction {
    constructor() {
        super();
        this.deathCries = [
            "Avenge... me...",
            "You'll pay for this...",
            "My brothers will destroy you...",
            "This isn't over...",
            "Curse you...",
            "Tell my family... I..."
        ];
    }
    
    canTrigger(source, target, data) {
        return source && source.health <= 0;
    }
    
    execute(source, target, data, system) {
        const cry = this.deathCries[Math.floor(Math.random() * this.deathCries.length)];
        
        // Show death cry
        system.game.ui.showCombatText(
            cry,
            'death',
            source.position,
            '#999999'
        );
        
        // Enrage nearby allies
        const allies = system.findNearbyAllies(source, 20);
        allies.forEach(ally => {
            if (ally.alive && Math.random() < 0.5) {
                system.triggerInteraction('rally', ally, null, {
                    reason: 'vengeance'
                });
            }
        });
    }
}

// Combat Dialogue Interaction
class CombatDialogueInteraction extends BaseInteraction {
    constructor() {
        super();
        this.dialogues = {
            wolf: [
                "*growls menacingly*",
                "*bares fangs*",
                "*howls*"
            ],
            bandit: [
                "Your gold or your life!",
                "Another victim!",
                "You picked the wrong fight!",
                "The Defias will rule!"
            ],
            kobold: [
                "You no take candle!",
                "Me smash you!",
                "This mine territory!"
            ],
            generic: [
                "Die!",
                "Attack!",
                "For glory!",
                "You won't escape!"
            ]
        };
    }
    
    execute(source, target, data, system) {
        // Get appropriate dialogue based on enemy type
        const enemyType = source.enemyType || 'generic';
        const dialogueSet = this.dialogues[enemyType] || this.dialogues.generic;
        
        const dialogue = dialogueSet[Math.floor(Math.random() * dialogueSet.length)];
        
        // Show dialogue
        system.game.ui.showCombatText(
            dialogue,
            'dialogue',
            source.position,
            '#ffffff'
        );
        
        // Add to chat if it's actual speech
        if (!dialogue.startsWith('*')) {
            system.game.ui.addChatMessage(
                'say',
                source.name,
                dialogue,
                '#ff9999'
            );
        }
    }
}

// Idle Chatter Interaction
class IdleChatterInteraction extends BaseInteraction {
    constructor() {
        super();
        this.chatter = {
            guard: [
                "Quiet night tonight.",
                "Did you hear about the troubles in Westfall?",
                "My shift ends soon.",
                "Stay alert."
            ],
            bandit: [
                "Boss says new shipment coming.",
                "Easy pickings around here.",
                "Split the loot fair and square.",
                "Keep watch for guards."
            ],
            generic: [
                "...",
                "*yawns*",
                "Nothing happening here.",
                "Same old, same old."
            ]
        };
    }
    
    execute(source, target, data, system) {
        const enemyType = source.enemyType || 'generic';
        const chatterSet = this.chatter[enemyType] || this.chatter.generic;
        
        const line = chatterSet[Math.floor(Math.random() * chatterSet.length)];
        
        // Show chatter
        system.game.ui.showCombatText(
            line,
            'chatter',
            source.position,
            '#cccccc'
        );
        
        // Target might respond
        if (target && Math.random() < 0.5) {
            setTimeout(() => {
                if (target.alive) {
                    system.triggerInteraction('idle_chatter', target, source);
                }
            }, 2000 + Math.random() * 2000);
        }
    }
}

// Coordinate Attack Interaction
class CoordinateAttackInteraction extends BaseInteraction {
    execute(source, target, data, system) {
        // Coordinate a group attack pattern
        const allies = system.findCombatAllies(source, 30);
        
        if (allies.length < 2) return;
        
        // Assign roles
        allies.forEach((ally, index) => {
            if (ally.ai) {
                // Create formation
                const angle = (Math.PI * 2 * index) / allies.length;
                const formationRadius = 5;
                
                const formationPos = new THREE.Vector3(
                    target.position.x + Math.cos(angle) * formationRadius,
                    target.position.y,
                    target.position.z + Math.sin(angle) * formationRadius
                );
                
                // Move to formation position
                ally.moveTo(formationPos);
                
                // Synchronized attack
                setTimeout(() => {
                    if (ally.alive && ally.ai) {
                        ally.ai.setBehavior('attack');
                    }
                }, 2000 + index * 500);
            }
        });
        
        // Show coordination effect
        system.game.ui.showCombatText(
            "Form up!",
            'coordinate',
            source.position,
            '#ff00ff'
        );
    }
}

// Flee Warning Interaction
class FleeWarningInteraction extends BaseInteraction {
    constructor() {
        super();
        this.warnings = [
            "I must retreat!",
            "Too strong!",
            "Fall back!",
            "I yield!",
            "Mercy!"
        ];
    }
    
    execute(source, target, data, system) {
        const warning = this.warnings[Math.floor(Math.random() * this.warnings.length)];
        
        // Show warning
        system.game.ui.showCombatText(
            warning,
            'flee',
            source.position,
            '#ffff00'
        );
        
        // Demoralize nearby allies slightly
        const allies = system.findNearbyAllies(source, 15);
        allies.forEach(ally => {
            if (ally.ai && Math.random() < 0.3) {
                // Reduce morale (could affect combat performance)
                ally.ai.config.fleeHealthPercent += 0.1;
                
                setTimeout(() => {
                    ally.ai.config.fleeHealthPercent -= 0.1;
                }, 30000);
            }
        });
    }
}

// Intimidate Interaction
class IntimidateInteraction extends BaseInteraction {
    constructor() {
        super();
        this.intimidations = [
            "*roars fiercely*",
            "*pounds chest*",
            "*brandishes weapon menacingly*",
            "RAAAAAHHH!",
            "*glares with burning eyes*"
        ];
    }
    
    canTrigger(source, target, data) {
        return super.canTrigger(source, target, data) &&
               source.level >= (target?.level || 1) + 3;
    }
    
    execute(source, target, data, system) {
        const intimidation = this.intimidations[Math.floor(Math.random() * this.intimidations.length)];
        
        // Show intimidation
        system.game.ui.showCombatText(
            intimidation,
            'intimidate',
            source.position,
            '#ff0000'
        );
        
        // Apply fear effect to target
        if (target && target.type === 'player') {
            // Could apply a fear debuff
            system.game.ui.showNotification(
                `You are intimidated by ${source.name}!`,
                'debuff'
            );
        }
    }
}

// Challenge Interaction
class ChallengeInteraction extends BaseInteraction {
    constructor() {
        super();
        this.challenges = [
            "Face me in single combat!",
            "I challenge you to a duel!",
            "Show me what you're made of!",
            "Let's settle this properly!",
            "You think you're tough? Prove it!",
            "One on one, no interference!"
        ];
        this.duration = 15000; // 15 second challenge duration
    }
    
    canTrigger(source, target, data) {
        return super.canTrigger(source, target, data) && 
               target && target.alive &&
               source.distanceTo(target) <= 20 &&
               source.level >= target.level - 2; // Only challenge if not too weak
    }
    
    execute(source, target, data, system) {
        const challenge = this.challenges[Math.floor(Math.random() * this.challenges.length)];
        
        // Show challenge
        system.game.ui.showCombatText(
            challenge,
            'challenge',
            source.position,
            '#ffaa00'
        );
        
        // Add to chat
        system.game.ui.addChatMessage(
            'say',
            source.name,
            challenge,
            '#ffaa00'
        );
        
        // Create challenge area effect
        this.createChallengeArena(source, target, system);
        
        // Buff the challenger
        this.applyChallengerBuff(source);
        
        // Prevent other enemies from interfering (temporarily)
        this.preventInterference(source, target, system);
    }
    
    createChallengeArena(source, target, system) {
        // Visual indicator of challenge area
        const midpoint = new THREE.Vector3()
            .addVectors(source.position, target.position)
            .divideScalar(2);
        
        // Show arena effect
        system.game.ui.showCombatText(
            "⚔️ DUEL ⚔️",
            'arena',
            midpoint,
            '#gold'
        );
        
        // Add particles or effects around the area if available
        if (system.game.effects) {
            system.game.effects.createChallengeArena(midpoint, 10);
        }
    }
    
    applyChallengerBuff(source) {
        // Temporary combat buff for the challenger
        const originalStats = {
            attackPower: source.attackPower,
            armor: source.armor || 0,
            moveSpeed: source.moveSpeed
        };
        
        // Apply buffs
        source.attackPower *= 1.2;
        source.armor = (source.armor || 0) * 1.3;
        source.moveSpeed *= 1.1;
        
        // Visual effect
        if (source.mesh?.material) {
            const originalEmissive = source.mesh.material.emissive.clone();
            source.mesh.material.emissive = new THREE.Color(0xffaa00);
            source.mesh.material.emissiveIntensity = 0.3;
            
            // Remove buffs after duration
            setTimeout(() => {
                if (source.alive) {
                    source.attackPower = originalStats.attackPower;
                    source.armor = originalStats.armor;
                    source.moveSpeed = originalStats.moveSpeed;
                    
                    // Restore visual
                    if (source.mesh?.material) {
                        source.mesh.material.emissive = originalEmissive;
                        source.mesh.material.emissiveIntensity = 0;
                    }
                }
            }, this.duration);
        }
        
        // Show buff effect
        if (source.game?.ui) {
            source.game.ui.showCombatText(
                'Challenger\'s Resolve!',
                'buff',
                source.position,
                '#ffaa00'
            );
        }
    }
    
    preventInterference(source, target, system) {
        // Mark entities as in duel
        source.inDuel = target;
        target.inDuel = source;
        
        // Find nearby allies and make them less likely to interfere
        const nearbyEnemies = system.findNearbyAllies(source, 25);
        const interferencePreventionTime = this.duration;
        
        nearbyEnemies.forEach(ally => {
            if (ally !== source && ally.ai) {
                // Store original aggro range
                const originalAggro = ally.ai.config.aggroRange;
                
                // Reduce aggro range significantly
                ally.ai.config.aggroRange *= 0.3;
                
                // Make them prefer not to target the duel participant
                if (ally.ai.stateData.target === target) {
                    // Only interfere if health gets very low
                    ally.ai.config.helpAllyHealthThreshold = 0.1;
                }
                
                // Restore after duel
                setTimeout(() => {
                    if (ally.alive && ally.ai) {
                        ally.ai.config.aggroRange = originalAggro;
                        delete ally.ai.config.helpAllyHealthThreshold;
                    }
                }, interferencePreventionTime);
            }
        });
        
        // Clear duel status after duration
        setTimeout(() => {
            if (source.alive) delete source.inDuel;
            if (target.alive) delete target.inDuel;
        }, interferencePreventionTime);
        
        // Show non-interference message
        system.game.ui.showCombatText(
            "Let them fight!",
            'duel_rule',
            source.position.clone().add(new THREE.Vector3(0, 5, 0)),
            '#cccccc'
        );
    }
    
    update(instance, deltaTime) {
        const source = instance.source;
        const target = instance.target;
        
        // Check if duel should end early
        if (!source.alive || !target.alive) {
            this.endChallenge(instance);
            return;
        }
        
        // Check if participants are too far apart
        if (source.distanceTo(target) > 30) {
            this.endChallenge(instance, "Duel ended - too far apart");
            return;
        }
        
        // Show periodic duel status
        const elapsed = Date.now() - instance.startTime;
        if (elapsed % 5000 < 100) { // Every 5 seconds
            const remaining = Math.ceil((this.duration - elapsed) / 1000);
            if (remaining > 0) {
                instance.interaction.showDuelStatus(source, target, remaining);
            }
        }
    }
    
    showDuelStatus(source, target, timeRemaining) {
        const midpoint = new THREE.Vector3()
            .addVectors(source.position, target.position)
            .divideScalar(2);
            
        if (source.game?.ui) {
            source.game.ui.showCombatText(
                `Duel: ${timeRemaining}s`,
                'duel_timer',
                midpoint.add(new THREE.Vector3(0, 8, 0)),
                '#ffaa00'
            );
        }
    }
    
    endChallenge(instance, reason = null) {
        const source = instance.source;
        const target = instance.target;
        
        // Clean up duel status
        if (source.alive) delete source.inDuel;
        if (target.alive) delete target.inDuel;
        
        // Show end message
        if (reason && source.game?.ui) {
            const midpoint = new THREE.Vector3()
                .addVectors(source.position, target.position)
                .divideScalar(2);
                
            source.game.ui.showCombatText(
                reason,
                'duel_end',
                midpoint,
                '#888888'
            );
        }
        
        // Determine winner if both still alive
        if (source.alive && target.alive) {
            const sourceHealthPercent = source.health / source.maxHealth;
            const targetHealthPercent = target.health / target.maxHealth;
            
            let winner, loser;
            if (sourceHealthPercent > targetHealthPercent) {
                winner = source;
                loser = target;
            } else {
                winner = target;
                loser = source;
            }
            
            // Show result
            if (winner.game?.ui) {
                winner.game.ui.showCombatText(
                    `${winner.name} wins the duel!`,
                    'duel_victory',
                    winner.position,
                    '#00ff00'
                );
                
                // Honor system - winner gets temporary prestige
                if (winner.type === 'enemy') {
                    this.grantDuelVictoryBuff(winner);
                }
            }
        }
    }
    
    grantDuelVictoryBuff(winner) {
        // Temporary prestige buff
        const originalAttack = winner.attackPower;
        winner.attackPower *= 1.15;
        
        // Visual effect
        if (winner.mesh?.material) {
            winner.mesh.material.emissive = new THREE.Color(0x00ff00);
            winner.mesh.material.emissiveIntensity = 0.2;
            
            setTimeout(() => {
                if (winner.alive) {
                    winner.attackPower = originalAttack;
                    if (winner.mesh?.material) {
                        winner.mesh.material.emissive = new THREE.Color(0x000000);
                        winner.mesh.material.emissiveIntensity = 0;
                    }
                }
            }, 30000); // 30 second victory buff
        }
        
        // Show buff
        if (winner.game?.ui) {
            winner.game.ui.showCombatText(
                'Victorious!',
                'victory_buff',
                winner.position,
                '#00ff00'
            );
        }
    }
}

// Make available globally
window.EnemyInteractionSystem = EnemyInteractionSystem;
