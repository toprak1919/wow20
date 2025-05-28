// EnemyBehaviorSystem.js - Modular AI behaviors for enemies
class EnemyBehaviorSystem {
    constructor() {
        // Registry of behavior modules
        this.behaviors = new Map();
        
        // Initialize core behaviors
        this.registerCoreBehaviors();
    }
    
    registerCoreBehaviors() {
        // Basic behaviors
        this.registerBehavior('idle', new IdleBehavior());
        this.registerBehavior('patrol', new PatrolBehavior());
        this.registerBehavior('chase', new ChaseBehavior());
        this.registerBehavior('attack', new AttackBehavior());
        this.registerBehavior('flee', new FleeBehavior());
        this.registerBehavior('guard', new GuardBehavior());
        
        // Advanced behaviors
        this.registerBehavior('ambush', new AmbushBehavior());
        this.registerBehavior('pack_hunt', new PackHuntBehavior());
        this.registerBehavior('kite', new KiteBehavior());
        this.registerBehavior('berserk', new BerserkBehavior());
        this.registerBehavior('defensive', new DefensiveBehavior());
        this.registerBehavior('support', new SupportBehavior());
        
        // Special behaviors
        this.registerBehavior('taunt', new TauntBehavior());
        this.registerBehavior('summon', new SummonBehavior());
        this.registerBehavior('teleport', new TeleportBehavior());
    }
    
    registerBehavior(name, behavior) {
        this.behaviors.set(name, behavior);
    }
    
    getBehavior(name) {
        return this.behaviors.get(name);
    }
    
    // Create enhanced AI for an enemy
    createEnhancedAI(enemy, config = {}) {
        return new EnhancedEnemyAI(enemy, this, config);
    }
}

// Enhanced Enemy AI that uses behavior modules
class EnhancedEnemyAI {
    constructor(enemy, behaviorSystem, config = {}) {
        this.enemy = enemy;
        this.behaviorSystem = behaviorSystem;
        
        // Current behavior state
        this.currentBehavior = null;
        this.behaviorStack = [];
        
        // AI configuration
        this.config = {
            primaryBehavior: config.primaryBehavior || 'idle',
            combatBehavior: config.combatBehavior || 'attack',
            fleeHealthPercent: config.fleeHealthPercent || 0.2,
            aggroRange: config.aggroRange || enemy.aggroRange || 10,
            leashRange: config.leashRange || 30,
            ...config
        };
        
        // State data
        this.stateData = {
            target: null,
            lastTargetPosition: null,
            homePosition: enemy.position.clone(),
            combatStartTime: 0,
            lastAbilityTime: 0,
            allies: [],
            threats: new Map()
        };
        
        // Initialize with primary behavior
        this.setBehavior(this.config.primaryBehavior);
    }
    
    update(deltaTime) {
        // Update current behavior
        if (this.currentBehavior) {
            const result = this.currentBehavior.update(this, deltaTime);
            
            // Handle behavior transitions
            if (result && result.transition) {
                this.setBehavior(result.transition);
            }
        }
        
        // Check for behavior interrupts
        this.checkInterrupts();
    }
    
    setBehavior(behaviorName, data = {}) {
        const behavior = this.behaviorSystem.getBehavior(behaviorName);
        if (!behavior) {
            console.warn(`Behavior not found: ${behaviorName}`);
            return;
        }
        
        // Exit current behavior
        if (this.currentBehavior) {
            this.currentBehavior.exit(this);
        }
        
        // Enter new behavior
        this.currentBehavior = behavior;
        this.currentBehavior.enter(this, data);
    }
    
    pushBehavior(behaviorName, data = {}) {
        // Save current behavior to stack
        if (this.currentBehavior) {
            this.behaviorStack.push({
                behavior: this.currentBehavior,
                data: this.stateData
            });
        }
        
        // Set new behavior
        this.setBehavior(behaviorName, data);
    }
    
    popBehavior() {
        if (this.behaviorStack.length > 0) {
            const previous = this.behaviorStack.pop();
            this.currentBehavior = previous.behavior;
            this.stateData = previous.data;
            
            if (this.currentBehavior) {
                this.currentBehavior.enter(this, this.stateData);
            }
        }
    }
    
    checkInterrupts() {
        // Check for death
        if (!this.enemy.alive) {
            this.setBehavior('idle');
            return;
        }
        
        // Check for low health flee
        if (this.enemy.health / this.enemy.maxHealth <= this.config.fleeHealthPercent) {
            if (this.currentBehavior.constructor.name !== 'FleeBehavior') {
                this.setBehavior('flee');
            }
            return;
        }
        
        // Check for combat
        const nearbyThreats = this.detectThreats();
        if (nearbyThreats.length > 0 && !this.stateData.target) {
            this.stateData.target = nearbyThreats[0];
            this.setBehavior(this.config.combatBehavior);
        }
        
        // Check leash range
        if (this.stateData.target) {
            const distanceFromHome = this.enemy.position.distanceTo(this.stateData.homePosition);
            if (distanceFromHome > this.config.leashRange) {
                this.setBehavior('return_home');
            }
        }
    }
    
    detectThreats() {
        const threats = [];
        
        // Check for player
        if (this.enemy.game && this.enemy.game.player) {
            const player = this.enemy.game.player;
            const distance = this.enemy.distanceTo(player);
            
            if (distance <= this.config.aggroRange && player.alive) {
                threats.push(player);
            }
        }
        
        // Could check for other hostile entities here
        
        return threats;
    }
    
    findAllies(radius = 20) {
        const allies = [];
        
        if (!this.enemy.game) return allies;
        
        for (const entity of this.enemy.game.entities.values()) {
            if (entity.type === 'enemy' && 
                entity !== this.enemy && 
                entity.alive &&
                entity.faction === this.enemy.faction) {
                
                const distance = this.enemy.distanceTo(entity);
                if (distance <= radius) {
                    allies.push(entity);
                }
            }
        }
        
        return allies;
    }
    
    updateThreat(target, amount) {
        const current = this.stateData.threats.get(target) || 0;
        this.stateData.threats.set(target, current + amount);
        
        // Update target based on highest threat
        let highestThreat = 0;
        let newTarget = null;
        
        for (const [entity, threat] of this.stateData.threats) {
            if (threat > highestThreat && entity.alive) {
                highestThreat = threat;
                newTarget = entity;
            }
        }
        
        if (newTarget && newTarget !== this.stateData.target) {
            this.stateData.target = newTarget;
        }
    }
}

// Base Behavior Class
class BaseBehavior {
    enter(ai, data) {
        // Override in subclasses
    }
    
    update(ai, deltaTime) {
        // Override in subclasses
        return null;
    }
    
    exit(ai) {
        // Override in subclasses
    }
}

// Idle Behavior
class IdleBehavior extends BaseBehavior {
    enter(ai) {
        ai.enemy.stopMoving();
        this.idleTime = 0;
        this.nextLookTime = Math.random() * 3 + 2;
    }
    
    update(ai, deltaTime) {
        this.idleTime += deltaTime;
        
        // Occasional look around
        if (this.idleTime >= this.nextLookTime) {
            this.lookAround(ai);
            this.nextLookTime = this.idleTime + Math.random() * 3 + 2;
        }
        
        // Check for patrol path
        if (ai.enemy.patrolPath && this.idleTime > 5) {
            return { transition: 'patrol' };
        }
        
        return null;
    }
    
    lookAround(ai) {
        if (ai.enemy.mesh) {
            const randomRotation = Math.random() * Math.PI * 2;
            ai.enemy.rotation.y = randomRotation;
            ai.enemy.mesh.rotation.y = randomRotation;
        }
    }
}

// Patrol Behavior
class PatrolBehavior extends BaseBehavior {
    enter(ai) {
        this.patrolIndex = 0;
        this.waitTime = 0;
        this.isWaiting = false;
        
        if (!ai.enemy.patrolPath || ai.enemy.patrolPath.length === 0) {
            // Generate default patrol path
            this.generatePatrolPath(ai);
        }
    }
    
    update(ai, deltaTime) {
        if (!ai.enemy.patrolPath || ai.enemy.patrolPath.length === 0) {
            return { transition: 'idle' };
        }
        
        if (this.isWaiting) {
            this.waitTime -= deltaTime;
            if (this.waitTime <= 0) {
                this.isWaiting = false;
            }
            return null;
        }
        
        const target = ai.enemy.patrolPath[this.patrolIndex];
        const distance = ai.enemy.position.distanceTo(target);
        
        if (distance > 1) {
            ai.enemy.moveTo(target);
        } else {
            // Reached patrol point
            ai.enemy.stopMoving();
            this.patrolIndex = (this.patrolIndex + 1) % ai.enemy.patrolPath.length;
            this.isWaiting = true;
            this.waitTime = Math.random() * 2 + 1;
        }
        
        return null;
    }
    
    generatePatrolPath(ai) {
        const basePos = ai.stateData.homePosition;
        const points = [];
        const radius = 20;
        
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4;
            const point = new THREE.Vector3(
                basePos.x + Math.cos(angle) * radius,
                basePos.y,
                basePos.z + Math.sin(angle) * radius
            );
            points.push(point);
        }
        
        ai.enemy.patrolPath = points;
    }
}

// Chase Behavior
class ChaseBehavior extends BaseBehavior {
    enter(ai) {
        this.lostTargetTime = 0;
        this.maxLostTime = 5;
    }
    
    update(ai, deltaTime) {
        const target = ai.stateData.target;
        
        if (!target || !target.alive) {
            return { transition: 'idle' };
        }
        
        const distance = ai.enemy.distanceTo(target);
        
        // Check if can see target
        if (this.canSeeTarget(ai, target)) {
            this.lostTargetTime = 0;
            ai.stateData.lastTargetPosition = target.position.clone();
            
            // Move towards target
            if (distance > ai.enemy.attackRange) {
                ai.enemy.moveTo(target.position);
            } else {
                // In range, switch to attack
                return { transition: 'attack' };
            }
        } else {
            // Lost sight of target
            this.lostTargetTime += deltaTime;
            
            if (this.lostTargetTime >= this.maxLostTime) {
                return { transition: 'idle' };
            }
            
            // Move to last known position
            if (ai.stateData.lastTargetPosition) {
                ai.enemy.moveTo(ai.stateData.lastTargetPosition);
            }
        }
        
        return null;
    }
    
    canSeeTarget(ai, target) {
        // Simple line of sight check
        const distance = ai.enemy.distanceTo(target);
        return distance <= ai.config.aggroRange * 1.5;
    }
}

// Attack Behavior
class AttackBehavior extends BaseBehavior {
    enter(ai) {
        ai.enemy.stopMoving();
        this.attackCooldown = 0;
    }
    
    update(ai, deltaTime) {
        const target = ai.stateData.target;
        
        if (!target || !target.alive) {
            return { transition: 'idle' };
        }
        
        const distance = ai.enemy.distanceTo(target);
        
        // Face target
        ai.enemy.faceTarget(target);
        
        // Check range
        if (distance > ai.enemy.attackRange) {
            return { transition: 'chase' };
        }
        
        // Attack if cooldown is ready
        this.attackCooldown -= deltaTime;
        if (this.attackCooldown <= 0) {
            this.performAttack(ai, target);
            this.attackCooldown = ai.enemy.attackSpeed;
        }
        
        // Check for special abilities
        if (ai.enemy.abilities && ai.enemy.abilities.length > 0) {
            this.checkAbilities(ai, target, deltaTime);
        }
        
        return null;
    }
    
    performAttack(ai, target) {
        // Play attack animation
        ai.enemy.playAnimation('attack', false);
        
        // Deal damage
        if (ai.enemy.game && ai.enemy.game.combat) {
            ai.enemy.game.combat.dealDamage(
                ai.enemy,
                target,
                ai.enemy.attackPower,
                'Attack'
            );
        }
        
        // Update threat
        ai.updateThreat(target, ai.enemy.attackPower);
    }
    
    checkAbilities(ai, target, deltaTime) {
        const now = Date.now();
        if (now - ai.stateData.lastAbilityTime < 3000) return;
        
        // Use abilities based on situation
        ai.enemy.abilities.forEach(abilityName => {
            const ability = this.getAbility(abilityName);
            if (ability && ability.shouldUse(ai, target)) {
                ability.use(ai, target);
                ai.stateData.lastAbilityTime = now;
            }
        });
    }
    
    getAbility(name) {
        // Define abilities
        const abilities = {
            'poison_bite': {
                shouldUse: (ai, target) => Math.random() < 0.3,
                use: (ai, target) => {
                    // Apply poison debuff
                    if (target.applyDebuff) {
                        target.applyDebuff('poison', {
                            damage: 5,
                            duration: 10,
                            tickRate: 2
                        });
                    }
                }
            },
            'howl': {
                shouldUse: (ai, target) => {
                    const allies = ai.findAllies(20);
                    return allies.length > 0 && Math.random() < 0.2;
                },
                use: (ai, target) => {
                    // Buff nearby allies
                    const allies = ai.findAllies(20);
                    allies.forEach(ally => {
                        if (ally.applyBuff) {
                            ally.applyBuff('enrage', {
                                attackPower: 1.5,
                                duration: 10
                            });
                        }
                    });
                }
            }
        };
        
        return abilities[name];
    }
}

// Flee Behavior
class FleeBehavior extends BaseBehavior {
    enter(ai) {
        this.fleeDirection = this.calculateFleeDirection(ai);
        this.fleeTime = 0;
        this.maxFleeTime = 5;
        
        // Speed boost when fleeing
        ai.enemy.moveSpeed *= 1.5;
    }
    
    update(ai, deltaTime) {
        this.fleeTime += deltaTime;
        
        if (this.fleeTime >= this.maxFleeTime) {
            return { transition: 'idle' };
        }
        
        // Update flee direction periodically
        if (Math.floor(this.fleeTime) % 1 === 0) {
            this.fleeDirection = this.calculateFleeDirection(ai);
        }
        
        // Move in flee direction
        const targetPos = ai.enemy.position.clone().add(
            this.fleeDirection.clone().multiplyScalar(10)
        );
        ai.enemy.moveTo(targetPos);
        
        // Check if healed enough to return to combat
        if (ai.enemy.health / ai.enemy.maxHealth > 0.5) {
            return { transition: ai.config.combatBehavior };
        }
        
        return null;
    }
    
    exit(ai) {
        // Reset speed
        ai.enemy.moveSpeed /= 1.5;
    }
    
    calculateFleeDirection(ai) {
        const threats = ai.detectThreats();
        
        if (threats.length === 0) {
            // Flee towards home
            return new THREE.Vector3()
                .subVectors(ai.stateData.homePosition, ai.enemy.position)
                .normalize();
        }
        
        // Flee away from threats
        const avgThreatPos = new THREE.Vector3();
        threats.forEach(threat => {
            avgThreatPos.add(threat.position);
        });
        avgThreatPos.divideScalar(threats.length);
        
        return new THREE.Vector3()
            .subVectors(ai.enemy.position, avgThreatPos)
            .normalize();
    }
}

// Pack Hunt Behavior
class PackHuntBehavior extends BaseBehavior {
    enter(ai) {
        this.role = this.assignRole(ai);
        this.coordinationTimer = 0;
    }
    
    update(ai, deltaTime) {
        const target = ai.stateData.target;
        if (!target || !target.alive) {
            return { transition: 'idle' };
        }
        
        this.coordinationTimer += deltaTime;
        
        // Coordinate with pack every second
        if (this.coordinationTimer >= 1) {
            this.coordinateWithPack(ai);
            this.coordinationTimer = 0;
        }
        
        // Execute role-based behavior
        switch (this.role) {
            case 'alpha':
                return this.updateAlpha(ai, target, deltaTime);
            case 'flanker':
                return this.updateFlanker(ai, target, deltaTime);
            case 'support':
                return this.updateSupport(ai, target, deltaTime);
        }
        
        return null;
    }
    
    assignRole(ai) {
        const allies = ai.findAllies(30);
        
        if (allies.length === 0) {
            return 'alpha';
        }
        
        // Check if any ally is already alpha
        const hasAlpha = allies.some(ally => 
            ally.ai && ally.ai.currentBehavior && 
            ally.ai.currentBehavior.role === 'alpha'
        );
        
        if (!hasAlpha) {
            return 'alpha';
        }
        
        // Assign flanker or support
        return Math.random() < 0.6 ? 'flanker' : 'support';
    }
    
    coordinateWithPack(ai) {
        const allies = ai.findAllies(30);
        
        // Share target information
        allies.forEach(ally => {
            if (ally.ai && !ally.ai.stateData.target) {
                ally.ai.stateData.target = ai.stateData.target;
                ally.ai.setBehavior('pack_hunt');
            }
        });
    }
    
    updateAlpha(ai, target, deltaTime) {
        // Alpha leads the attack
        const distance = ai.enemy.distanceTo(target);
        
        if (distance > ai.enemy.attackRange) {
            ai.enemy.moveTo(target.position);
        } else {
            return { transition: 'attack' };
        }
        
        return null;
    }
    
    updateFlanker(ai, target, deltaTime) {
        // Flankers try to attack from sides
        const targetToEnemy = new THREE.Vector3()
            .subVectors(ai.enemy.position, target.position);
        
        const angle = Math.atan2(targetToEnemy.z, targetToEnemy.x);
        const flankAngle = angle + (Math.random() < 0.5 ? Math.PI/2 : -Math.PI/2);
        
        const flankPos = new THREE.Vector3(
            target.position.x + Math.cos(flankAngle) * ai.enemy.attackRange * 1.5,
            target.position.y,
            target.position.z + Math.sin(flankAngle) * ai.enemy.attackRange * 1.5
        );
        
        const distance = ai.enemy.position.distanceTo(flankPos);
        
        if (distance > 1) {
            ai.enemy.moveTo(flankPos);
        } else {
            return { transition: 'attack' };
        }
        
        return null;
    }
    
    updateSupport(ai, target, deltaTime) {
        // Support stays back and provides assistance
        const alpha = this.findAlpha(ai);
        
        if (alpha) {
            const distance = ai.enemy.distanceTo(alpha);
            
            if (distance > 10) {
                ai.enemy.moveTo(alpha.position);
            } else if (distance < 5) {
                // Too close, back up
                const awayDir = new THREE.Vector3()
                    .subVectors(ai.enemy.position, alpha.position)
                    .normalize();
                
                const backupPos = ai.enemy.position.clone()
                    .add(awayDir.multiplyScalar(5));
                    
                ai.enemy.moveTo(backupPos);
            } else {
                // Good position, attack if in range
                const targetDistance = ai.enemy.distanceTo(target);
                if (targetDistance <= ai.enemy.attackRange) {
                    return { transition: 'attack' };
                }
            }
        }
        
        return null;
    }
    
    findAlpha(ai) {
        const allies = ai.findAllies(30);
        
        return allies.find(ally => 
            ally.ai && ally.ai.currentBehavior && 
            ally.ai.currentBehavior.role === 'alpha'
        );
    }
}

// Ambush Behavior
class AmbushBehavior extends BaseBehavior {
    enter(ai, data) {
        this.isHidden = true;
        this.triggered = false;
        this.triggerRadius = data.triggerRadius || 15;
        
        // Hide the enemy
        if (ai.enemy.mesh) {
            ai.enemy.mesh.visible = false;
        }
        
        // Store original position
        this.ambushPosition = ai.enemy.position.clone();
    }
    
    update(ai, deltaTime) {
        if (!this.isHidden) {
            return { transition: ai.config.combatBehavior };
        }
        
        // Check for nearby players
        const player = ai.enemy.game?.player;
        if (!player) return null;
        
        const distance = ai.enemy.distanceTo(player);
        
        if (distance <= this.triggerRadius && !this.triggered) {
            this.triggered = true;
            
            // Delay before appearing
            setTimeout(() => {
                this.spring(ai, player);
            }, 500);
        }
        
        return null;
    }
    
    spring(ai, target) {
        // Reveal enemy
        if (ai.enemy.mesh) {
            ai.enemy.mesh.visible = true;
        }
        this.isHidden = false;
        
        // Jump effect
        if (ai.enemy.mesh) {
            const jumpHeight = 5;
            const originalY = ai.enemy.position.y;
            
            // Animate jump
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                
                if (elapsed < 0.5) {
                    const progress = elapsed / 0.5;
                    const height = Math.sin(progress * Math.PI) * jumpHeight;
                    ai.enemy.position.y = originalY + height;
                    ai.enemy.mesh.position.y = ai.enemy.position.y;
                    
                    requestAnimationFrame(animate);
                } else {
                    ai.enemy.position.y = originalY;
                    ai.enemy.mesh.position.y = originalY;
                }
            };
            animate();
        }
        
        // Set target and shout
        ai.stateData.target = target;
        
        if (ai.enemy.game?.ui) {
            ai.enemy.game.ui.showCombatText(
                'Surprise Attack!',
                'special',
                ai.enemy.position
            );
        }
    }
}

// Guard Behavior
class GuardBehavior extends BaseBehavior {
    enter(ai, data) {
        this.guardPosition = data.guardPosition || ai.enemy.position.clone();
        this.guardRadius = data.guardRadius || 10;
        this.returnThreshold = this.guardRadius * 1.5;
    }
    
    update(ai, deltaTime) {
        const distanceFromPost = ai.enemy.position.distanceTo(this.guardPosition);
        
        // Check for threats within guard radius
        const threats = this.detectThreatsInRadius(ai, this.guardRadius);
        
        if (threats.length > 0) {
            // Engage closest threat
            ai.stateData.target = threats[0];
            
            // Only chase within return threshold
            if (distanceFromPost < this.returnThreshold) {
                return { transition: 'attack' };
            }
        }
        
        // Return to guard position if too far
        if (distanceFromPost > 2) {
            ai.enemy.moveTo(this.guardPosition);
        } else {
            ai.enemy.stopMoving();
            
            // Face random directions periodically
            if (Math.random() < 0.01) {
                ai.enemy.rotation.y = Math.random() * Math.PI * 2;
                if (ai.enemy.mesh) {
                    ai.enemy.mesh.rotation.y = ai.enemy.rotation.y;
                }
            }
        }
        
        return null;
    }
    
    detectThreatsInRadius(ai, radius) {
        const threats = [];
        const player = ai.enemy.game?.player;
        
        if (player && player.alive) {
            const distance = ai.enemy.distanceTo(player);
            if (distance <= radius) {
                threats.push(player);
            }
        }
        
        return threats;
    }
}

// Additional advanced behaviors...

class KiteBehavior extends BaseBehavior {
    // Ranged enemy behavior - maintain distance while attacking
    enter(ai) {
        this.idealDistance = ai.enemy.attackRange * 0.8;
        this.attackCooldown = 0;
    }
    
    update(ai, deltaTime) {
        const target = ai.stateData.target;
        if (!target || !target.alive) {
            return { transition: 'idle' };
        }
        
        const distance = ai.enemy.distanceTo(target);
        
        // Maintain ideal distance
        if (distance < this.idealDistance * 0.7) {
            // Too close, back away
            const awayDir = new THREE.Vector3()
                .subVectors(ai.enemy.position, target.position)
                .normalize();
            
            const retreatPos = ai.enemy.position.clone()
                .add(awayDir.multiplyScalar(5));
                
            ai.enemy.moveTo(retreatPos);
        } else if (distance > this.idealDistance * 1.3) {
            // Too far, move closer
            ai.enemy.moveTo(target.position);
        } else {
            // Good distance, stop and attack
            ai.enemy.stopMoving();
            ai.enemy.faceTarget(target);
            
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown <= 0) {
                this.performRangedAttack(ai, target);
                this.attackCooldown = ai.enemy.attackSpeed;
            }
        }
        
        return null;
    }
    
    performRangedAttack(ai, target) {
        // Create projectile or ranged attack effect
        ai.enemy.playAnimation('cast', false);
        
        // Simple ranged damage for now
        setTimeout(() => {
            if (target.alive && ai.enemy.game?.combat) {
                ai.enemy.game.combat.dealDamage(
                    ai.enemy,
                    target,
                    ai.enemy.attackPower * 0.8,
                    'Ranged Attack'
                );
            }
        }, 500);
    }
}

class BerserkBehavior extends BaseBehavior {
    // Increased aggression at low health
    enter(ai) {
        // Buff stats when going berserk
        ai.enemy.attackPower *= 1.5;
        ai.enemy.attackSpeed *= 0.7; // Faster attacks
        ai.enemy.moveSpeed *= 1.3;
        
        // Visual effect
        if (ai.enemy.mesh?.material) {
            ai.enemy.mesh.material.emissive = new THREE.Color(0xff0000);
            ai.enemy.mesh.material.emissiveIntensity = 0.3;
        }
        
        // Announcement
        if (ai.enemy.game?.ui) {
            ai.enemy.game.ui.showCombatText(
                'ENRAGED!',
                'special',
                ai.enemy.position
            );
        }
    }
    
    update(ai, deltaTime) {
        // Always aggressive in berserk mode
        const target = ai.stateData.target;
        
        if (!target || !target.alive) {
            // Find new target immediately
            const threats = ai.detectThreats();
            if (threats.length > 0) {
                ai.stateData.target = threats[0];
            } else {
                return { transition: 'idle' };
            }
        }
        
        // Always chase and attack
        const distance = ai.enemy.distanceTo(ai.stateData.target);
        
        if (distance > ai.enemy.attackRange) {
            ai.enemy.moveTo(ai.stateData.target.position);
        } else {
            // Rapid attacks
            ai.enemy.faceTarget(ai.stateData.target);
            
            if (ai.enemy.game?.combat) {
                ai.enemy.game.combat.dealDamage(
                    ai.enemy,
                    ai.stateData.target,
                    ai.enemy.attackPower,
                    'Berserk Strike'
                );
            }
        }
        
        // Check if should exit berserk (healed above threshold)
        if (ai.enemy.health / ai.enemy.maxHealth > 0.5) {
            return { transition: ai.config.combatBehavior };
        }
        
        return null;
    }
    
    exit(ai) {
        // Remove buffs
        ai.enemy.attackPower /= 1.5;
        ai.enemy.attackSpeed /= 0.7;
        ai.enemy.moveSpeed /= 1.3;
        
        // Remove visual effect
        if (ai.enemy.mesh?.material) {
            ai.enemy.mesh.material.emissive = new THREE.Color(0x000000);
            ai.enemy.mesh.material.emissiveIntensity = 0;
        }
    }
}

// DefensiveBehavior - Focuses on defense and mitigation
class DefensiveBehavior extends BaseBehavior {
    enter(ai) {
        this.defensiveStance = true;
        
        // Increase defensive stats
        ai.enemy.armor = (ai.enemy.armor || 0) * 1.5;
        ai.enemy.moveSpeed *= 0.7; // Move slower but more defensively
        
        // Visual effect for defensive stance
        if (ai.enemy.mesh?.material) {
            ai.enemy.mesh.material.emissive = new THREE.Color(0x0066cc);
            ai.enemy.mesh.material.emissiveIntensity = 0.2;
        }
    }
    
    update(ai, deltaTime) {
        const target = ai.stateData.target;
        
        if (!target || !target.alive) {
            return { transition: 'idle' };
        }
        
        const distance = ai.enemy.distanceTo(target);
        const healthPercent = ai.enemy.health / ai.enemy.maxHealth;
        
        // Stay defensive until health improves
        if (healthPercent > 0.7) {
            return { transition: ai.config.combatBehavior };
        }
        
        // Maintain distance and block/dodge
        if (distance < ai.enemy.attackRange * 0.5) {
            // Too close, back away while facing target
            const awayDir = new THREE.Vector3()
                .subVectors(ai.enemy.position, target.position)
                .normalize();
            
            const retreatPos = ai.enemy.position.clone()
                .add(awayDir.multiplyScalar(3));
                
            ai.enemy.moveTo(retreatPos);
        } else if (distance > ai.enemy.attackRange) {
            return { transition: 'chase' };
        } else {
            // Good defensive distance, counter-attack occasionally
            ai.enemy.stopMoving();
            ai.enemy.faceTarget(target);
            
            if (Math.random() < 0.3) {
                this.performCounterAttack(ai, target);
            }
        }
        
        return null;
    }
    
    performCounterAttack(ai, target) {
        if (ai.enemy.game?.combat) {
            ai.enemy.game.combat.dealDamage(
                ai.enemy,
                target,
                ai.enemy.attackPower * 0.7,
                'Counter Attack'
            );
        }
    }
    
    exit(ai) {
        // Remove defensive buffs
        ai.enemy.armor = (ai.enemy.armor || 0) / 1.5;
        ai.enemy.moveSpeed /= 0.7;
        
        // Remove visual effect
        if (ai.enemy.mesh?.material) {
            ai.enemy.mesh.material.emissive = new THREE.Color(0x000000);
            ai.enemy.mesh.material.emissiveIntensity = 0;
        }
    }
}

// SupportBehavior - Helps allies with buffs and healing
class SupportBehavior extends BaseBehavior {
    enter(ai) {
        this.supportTimer = 0;
        this.supportCooldown = 3; // Support actions every 3 seconds
    }
    
    update(ai, deltaTime) {
        this.supportTimer += deltaTime;
        
        const allies = ai.findAllies(20);
        const target = ai.stateData.target;
        
        // Support allies if available
        if (allies.length > 0 && this.supportTimer >= this.supportCooldown) {
            this.performSupportAction(ai, allies);
            this.supportTimer = 0;
        }
        
        // Maintain distance from threats
        if (target && target.alive) {
            const distance = ai.enemy.distanceTo(target);
            
            if (distance < 15) {
                // Stay back and support from range
                const awayDir = new THREE.Vector3()
                    .subVectors(ai.enemy.position, target.position)
                    .normalize();
                
                const safePos = ai.enemy.position.clone()
                    .add(awayDir.multiplyScalar(5));
                    
                ai.enemy.moveTo(safePos);
            } else {
                ai.enemy.stopMoving();
            }
        } else if (allies.length > 0) {
            // Move towards allies
            const avgAllyPos = new THREE.Vector3();
            allies.forEach(ally => avgAllyPos.add(ally.position));
            avgAllyPos.divideScalar(allies.length);
            
            const distance = ai.enemy.position.distanceTo(avgAllyPos);
            if (distance > 10) {
                ai.enemy.moveTo(avgAllyPos);
            }
        } else {
            return { transition: 'idle' };
        }
        
        return null;
    }
    
    performSupportAction(ai, allies) {
        // Find ally that needs help most
        let needHelpAlly = null;
        let lowestHealthPercent = 1;
        
        allies.forEach(ally => {
            const healthPercent = ally.health / ally.maxHealth;
            if (healthPercent < lowestHealthPercent) {
                lowestHealthPercent = healthPercent;
                needHelpAlly = ally;
            }
        });
        
        if (needHelpAlly && lowestHealthPercent < 0.8) {
            // Heal ally
            this.healAlly(ai, needHelpAlly);
        } else {
            // Buff random ally
            const randomAlly = allies[Math.floor(Math.random() * allies.length)];
            this.buffAlly(ai, randomAlly);
        }
    }
    
    healAlly(ai, ally) {
        const healAmount = ai.enemy.attackPower * 0.5;
        ally.health = Math.min(ally.maxHealth, ally.health + healAmount);
        
        if (ai.enemy.game?.ui) {
            ai.enemy.game.ui.showCombatText(
                `+${Math.floor(healAmount)}`,
                'heal',
                ally.position
            );
        }
    }
    
    buffAlly(ai, ally) {
        if (ally.applyBuff) {
            ally.applyBuff('support_buff', {
                attackPower: 1.2,
                moveSpeed: 1.1,
                duration: 15
            });
        }
    }
}

// TauntBehavior - Draws attention and controls enemy positioning
class TauntBehavior extends BaseBehavior {
    enter(ai) {
        this.taunted = false;
        this.tauntDuration = 0;
        this.maxTauntDuration = 5;
    }
    
    update(ai, deltaTime) {
        if (!this.taunted) {
            this.performTaunt(ai);
            this.taunted = true;
        }
        
        this.tauntDuration += deltaTime;
        
        if (this.tauntDuration >= this.maxTauntDuration) {
            return { transition: ai.config.combatBehavior };
        }
        
        // Force aggressive behavior during taunt
        const target = ai.stateData.target;
        if (target && target.alive) {
            const distance = ai.enemy.distanceTo(target);
            
            if (distance > ai.enemy.attackRange) {
                ai.enemy.moveTo(target.position);
            } else {
                return { transition: 'attack' };
            }
        }
        
        return null;
    }
    
    performTaunt(ai) {
        // Increase threat significantly
        if (ai.stateData.target) {
            ai.updateThreat(ai.stateData.target, 100);
        }
        
        // Visual/audio effect
        if (ai.enemy.game?.ui) {
            ai.enemy.game.ui.showCombatText(
                'TAUNT!',
                'special',
                ai.enemy.position
            );
        }
        
        // Temporary stat boost
        ai.enemy.attackPower *= 1.3;
        ai.enemy.moveSpeed *= 1.2;
    }
    
    exit(ai) {
        // Remove taunt buffs
        ai.enemy.attackPower /= 1.3;
        ai.enemy.moveSpeed /= 1.2;
    }
}

// SummonBehavior - Calls reinforcements
class SummonBehavior extends BaseBehavior {
    enter(ai) {
        this.summoning = false;
        this.summonTime = 0;
        this.summonDuration = 2; // 2 second cast time
    }
    
    update(ai, deltaTime) {
        if (!this.summoning) {
            this.startSummoning(ai);
            this.summoning = true;
        }
        
        this.summonTime += deltaTime;
        
        // Channeling summon
        if (this.summonTime < this.summonDuration) {
            ai.enemy.stopMoving();
            
            // Face target while summoning
            if (ai.stateData.target) {
                ai.enemy.faceTarget(ai.stateData.target);
            }
            
            return null;
        } else {
            // Complete summon
            this.completeSummon(ai);
            return { transition: ai.config.combatBehavior };
        }
    }
    
    startSummoning(ai) {
        if (ai.enemy.game?.ui) {
            ai.enemy.game.ui.showCombatText(
                'Summoning reinforcements...',
                'special',
                ai.enemy.position
            );
        }
        
        // Play casting animation
        ai.enemy.playAnimation('cast', true);
    }
    
    completeSummon(ai) {
        // Summon 1-2 weaker allies
        const summonCount = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < summonCount; i++) {
            this.summonAlly(ai, i);
        }
        
        if (ai.enemy.game?.ui) {
            ai.enemy.game.ui.showCombatText(
                'Reinforcements arrive!',
                'special',
                ai.enemy.position
            );
        }
    }
    
    summonAlly(ai, index) {
        if (!ai.enemy.game?.entityFactory) return;
        
        // Position around summoner
        const angle = (Math.PI * 2 * index) / 2;
        const distance = 5;
        const summonPos = new THREE.Vector3(
            ai.enemy.position.x + Math.cos(angle) * distance,
            ai.enemy.position.y,
            ai.enemy.position.z + Math.sin(angle) * distance
        );
        
        // Create weaker version of summoner
        const allyData = {
            type: ai.enemy.type,
            level: Math.max(1, ai.enemy.level - 2),
            faction: ai.enemy.faction,
            summoned: true,
            lifespan: 30 // Disappear after 30 seconds
        };
        
        const ally = ai.enemy.game.entityFactory.createEnemy(allyData, summonPos);
        if (ally) {
            // Set same target
            if (ally.ai && ai.stateData.target) {
                ally.ai.stateData.target = ai.stateData.target;
                ally.ai.setBehavior(ai.config.combatBehavior);
            }
        }
    }
}

// TeleportBehavior - Tactical repositioning
class TeleportBehavior extends BaseBehavior {
    enter(ai) {
        this.teleporting = false;
        this.teleportTime = 0;
        this.teleportDuration = 1.5;
    }
    
    update(ai, deltaTime) {
        if (!this.teleporting) {
            this.startTeleport(ai);
            this.teleporting = true;
        }
        
        this.teleportTime += deltaTime;
        
        if (this.teleportTime < this.teleportDuration) {
            // Teleport preparation
            ai.enemy.stopMoving();
            
            // Fade effect
            if (ai.enemy.mesh?.material) {
                const fade = 1 - (this.teleportTime / this.teleportDuration);
                ai.enemy.mesh.material.opacity = fade;
                ai.enemy.mesh.material.transparent = true;
            }
            
            return null;
        } else {
            // Complete teleport
            this.completeTeleport(ai);
            return { transition: ai.config.combatBehavior };
        }
    }
    
    startTeleport(ai) {
        if (ai.enemy.game?.ui) {
            ai.enemy.game.ui.showCombatText(
                'Teleporting...',
                'special',
                ai.enemy.position
            );
        }
    }
    
    completeTeleport(ai) {
        // Choose teleport destination
        const target = ai.stateData.target;
        let teleportPos;
        
        if (target) {
            // Teleport behind or to side of target
            const angle = Math.random() * Math.PI * 2;
            const distance = ai.enemy.attackRange * 1.2;
            
            teleportPos = new THREE.Vector3(
                target.position.x + Math.cos(angle) * distance,
                target.position.y,
                target.position.z + Math.sin(angle) * distance
            );
        } else {
            // Random teleport within area
            const angle = Math.random() * Math.PI * 2;
            const distance = 10;
            
            teleportPos = ai.enemy.position.clone().add(
                new THREE.Vector3(
                    Math.cos(angle) * distance,
                    0,
                    Math.sin(angle) * distance
                )
            );
        }
        
        // Teleport
        ai.enemy.position.copy(teleportPos);
        if (ai.enemy.mesh) {
            ai.enemy.mesh.position.copy(teleportPos);
            
            // Restore opacity
            ai.enemy.mesh.material.opacity = 1;
            ai.enemy.mesh.material.transparent = false;
        }
        
        if (ai.enemy.game?.ui) {
            ai.enemy.game.ui.showCombatText(
                'Teleported!',
                'special',
                ai.enemy.position
            );
        }
    }
}

// Make available globally
window.EnemyBehaviorSystem = EnemyBehaviorSystem;
window.EnhancedEnemyAI = EnhancedEnemyAI;
