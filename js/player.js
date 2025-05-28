// Player.js - Player character system
class Player {
    constructor(game) {
        this.game = game;
        
        // Character data
        this.name = 'Player';
        this.class = 'warrior';
        this.race = 'human';
        this.faction = 'alliance';
        this.gender = 'male';
        
        // Position and movement
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.moveSpeed = 7;
        this.runSpeed = 14;
        this.jumpHeight = 10; // Renamed from jumpVelocity for clarity
        this.currentJumpVelocity = 0; // Used for applying jump force
        this.isGrounded = true;
        this.isMoving = false;
        this.isCasting = false;
        this.isStunned = false;
        this.moveTarget = null;
        this.acceleration = 50; // Units per second^2
        this.deceleration = 30; // Units per second^2
        this.maxSpeed = this.runSpeed; // Will be set dynamically
        this.collisionRadius = 0.5; // Player's collision radius
        
        // Stats
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 1000;
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 100;
        this.maxMana = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.rage = 0;
        this.maxRage = 100;
        
        // Attributes
        this.attributes = {
            strength: 10,
            agility: 10,
            intellect: 10,
            stamina: 10,
            spirit: 10
        };
        
        // Combat stats
        this.attackPower = 50;
        this.spellPower = 30;
        this.critChance = 0.05;
        this.hitChance = 0.95;
        this.armor = 100;
        this.resistance = {
            fire: 0,
            frost: 0,
            shadow: 0,
            nature: 0,
            arcane: 0,
            holy: 0
        };
        
        // Currency
        this.currency = {
            gold: 0,
            silver: 0,
            copper: 0
        };
        
        // Equipment
        this.equipment = {
            head: null,
            neck: null,
            shoulders: null,
            chest: null,
            waist: null,
            legs: null,
            feet: null,
            wrists: null,
            hands: null,
            finger1: null,
            finger2: null,
            trinket1: null,
            trinket2: null,
            mainhand: null,
            offhand: null,
            ranged: null,
            ammo: null
        };
        
        // Action bars
        this.actionBars = {
            1: null,
            2: null,
            3: null,
            4: null,
            5: null,
            6: null,
            7: null,
            8: null,
            9: null,
            0: null
        };
        
        // Abilities
        this.abilities = new Map();
        this.globalCooldown = 0;
        this.castingSpell = null;
        this.castTime = 0;
        this.channeling = false;
        
        // Buffs and debuffs
        this.buffs = new Map();
        this.debuffs = new Map();
        
        // Target
        this.target = null;
        this.focus = null;
        
        // Pets
        this.pet = null;
        this.mounts = [];
        this.currentMount = null;
        
        // Collections
        this.achievements = new Set();
        this.titles = new Set();
        this.currentTitle = null;
        this.recipes = new Set();
        this.discoveredLocations = new Set();
        
        // Reputation
        this.reputation = new Map([
            ['Stormwind', 0],
            ['Ironforge', 0],
            ['Darnassus', 0],
            ['Exodar', 0],
            ['Orgrimmar', 0],
            ['Thunder Bluff', 0],
            ['Undercity', 0],
            ['Silvermoon', 0]
        ]);
        
        // Professions
        this.professions = {
            primary1: null,
            primary2: null,
            cooking: { skill: 0, maxSkill: 300 },
            fishing: { skill: 0, maxSkill: 300 },
            firstAid: { skill: 0, maxSkill: 300 }
        };
        
        // PvP
        this.pvpStats = {
            honorPoints: 0,
            arenaPoints: 0,
            kills: 0,
            deaths: 0,
            honorKills: 0,
            rank: 'Private'
        };
        
        // Create player mesh
        this.createMesh();
        this.setupClassAbilities();
    }
    
    createMesh() {
        // Create player character mesh using cylinder (compatible with Three.js r128)
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.faction === 'alliance' ? 0x0066ff : 0xff0000 
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.copy(this.position);
        
        // Add name tag
        const nameTagGeometry = new THREE.PlaneGeometry(2, 0.5);
        const nameTagMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.8,
            color: 0x000000
        });
        this.nameTag = new THREE.Mesh(nameTagGeometry, nameTagMaterial);
        this.nameTag.position.y = 2.5;
        this.mesh.add(this.nameTag);
        
        this.game.scene.add(this.mesh);
        
        // Camera follow
        this.cameraOffset = new THREE.Vector3(0, 5, 10);
    }
    
    setupClassAbilities() {
        // Setup abilities based on class
        switch(this.class) {
            case 'warrior':
                this.setupWarriorAbilities();
                break;
            case 'mage':
                this.setupMageAbilities();
                break;
            case 'priest':
                this.setupPriestAbilities();
                break;
            case 'rogue':
                this.setupRogueAbilities();
                break;
        }
        
        // Common abilities
        this.abilities.set('attack', {
            name: 'Auto Attack',
            icon: '⚔️',
            cooldown: 0,
            cost: 0,
            range: 5,
            castTime: 0,
            gcd: false
        });
    }
    
    setupWarriorAbilities() {
        this.abilities.set('heroicStrike', {
            name: 'Heroic Strike',
            icon: '🗡️',
            cooldown: 0,
            cost: 15,
            costType: 'rage',
            range: 5,
            damage: 50,
            castTime: 0,
            gcd: true
        });
        
        this.abilities.set('charge', {
            name: 'Charge',
            icon: '🏃',
            cooldown: 15,
            cost: 0,
            range: 25,
            castTime: 0,
            gcd: false,
            effect: () => this.chargeToTarget()
        });
        
        this.abilities.set('thunderClap', {
            name: 'Thunder Clap',
            icon: '⚡',
            cooldown: 6,
            cost: 20,
            costType: 'rage',
            range: 0,
            radius: 8,
            damage: 30,
            castTime: 0,
            gcd: true
        });
        
        this.abilities.set('shieldBlock', {
            name: 'Shield Block',
            icon: '🛡️',
            cooldown: 5,
            cost: 10,
            costType: 'rage',
            duration: 5,
            castTime: 0,
            gcd: false
        });
        
        // Set default action bar
        this.actionBars[1] = 'heroicStrike';
        this.actionBars[2] = 'charge';
        this.actionBars[3] = 'thunderClap';
        this.actionBars[4] = 'shieldBlock';
    }
    
    setupMageAbilities() {
        this.abilities.set('fireball', {
            name: 'Fireball',
            icon: '🔥',
            cooldown: 0,
            cost: 30,
            costType: 'mana',
            range: 35,
            damage: 80,
            castTime: 3,
            gcd: true
        });
        
        this.abilities.set('frostbolt', {
            name: 'Frostbolt',
            icon: '❄️',
            cooldown: 0,
            cost: 25,
            costType: 'mana',
            range: 35,
            damage: 60,
            castTime: 2.5,
            gcd: true,
            slow: 0.5
        });
        
        this.abilities.set('arcaneIntellect', {
            name: 'Arcane Intellect',
            icon: '🧠',
            cooldown: 0,
            cost: 60,
            costType: 'mana',
            range: 30,
            castTime: 0,
            gcd: true,
            buff: true
        });
        
        this.abilities.set('blink', {
            name: 'Blink',
            icon: '✨',
            cooldown: 15,
            cost: 50,
            costType: 'mana',
            range: 20,
            castTime: 0,
            gcd: true
        });
        
        // Set default action bar
        this.actionBars[1] = 'fireball';
        this.actionBars[2] = 'frostbolt';
        this.actionBars[3] = 'arcaneIntellect';
        this.actionBars[4] = 'blink';
    }
    
    setupPriestAbilities() {
        this.abilities.set('heal', {
            name: 'Heal',
            icon: '💚',
            cooldown: 0,
            cost: 40,
            costType: 'mana',
            range: 40,
            healing: 100,
            castTime: 2.5,
            gcd: true
        });
        
        this.abilities.set('holySmite', {
            name: 'Holy Smite',
            icon: '✝️',
            cooldown: 0,
            cost: 25,
            costType: 'mana',
            range: 30,
            damage: 50,
            castTime: 2,
            gcd: true
        });
        
        this.abilities.set('powerWordShield', {
            name: 'Power Word: Shield',
            icon: '🛡️',
            cooldown: 4,
            cost: 50,
            costType: 'mana',
            range: 40,
            shield: 150,
            duration: 30,
            castTime: 0,
            gcd: true
        });
        
        this.abilities.set('renew', {
            name: 'Renew',
            icon: '🌿',
            cooldown: 0,
            cost: 30,
            costType: 'mana',
            range: 40,
            healingPerTick: 20,
            duration: 15,
            castTime: 0,
            gcd: true
        });
        
        // Set default action bar
        this.actionBars[1] = 'holySmite';
        this.actionBars[2] = 'heal';
        this.actionBars[3] = 'powerWordShield';
        this.actionBars[4] = 'renew';
    }
    
    setupRogueAbilities() {
        this.abilities.set('sinisterStrike', {
            name: 'Sinister Strike',
            icon: '🗡️',
            cooldown: 0,
            cost: 40,
            costType: 'energy',
            range: 5,
            damage: 60,
            comboPoints: 1,
            castTime: 0,
            gcd: true
        });
        
        this.abilities.set('eviscerate', {
            name: 'Eviscerate',
            icon: '💀',
            cooldown: 0,
            cost: 35,
            costType: 'energy',
            range: 5,
            damagePerCombo: 30,
            castTime: 0,
            gcd: true
        });
        
        this.abilities.set('stealth', {
            name: 'Stealth',
            icon: '👤',
            cooldown: 10,
            cost: 0,
            duration: 10,
            castTime: 0,
            gcd: false
        });
        
        this.abilities.set('cheapShot', {
            name: 'Cheap Shot',
            icon: '💫',
            cooldown: 0,
            cost: 60,
            costType: 'energy',
            range: 5,
            stun: 2,
            requiresStealth: true,
            castTime: 0,
            gcd: true
        });
        
        // Set default action bar
        this.actionBars[1] = 'sinisterStrike';
        this.actionBars[2] = 'eviscerate';
        this.actionBars[3] = 'stealth';
        this.actionBars[4] = 'cheapShot';
    }
    
    update(deltaTime) {
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update combat
        this.updateCombat(deltaTime);
        
        // Update buffs/debuffs
        this.updateBuffsDebuffs(deltaTime);
        
        // Update camera
        this.updateCamera();
        
        // Update UI
        this.updateUI();
        
        // Regeneration
        this.regenerate(deltaTime);
        
        // Update pet
        if (this.pet) {
            this.pet.update(deltaTime);
        }
    }
    
    updateMovement(deltaTime) {
        const controls = this.game.controls;
        this.maxSpeed = controls.shift ? this.runSpeed : this.moveSpeed;

        // Desired movement direction based on input
        let desiredMoveDirection = new THREE.Vector3();
        if (controls.forward || controls.autoRun) desiredMoveDirection.z = -1;
        if (controls.backward) desiredMoveDirection.z = 1;
        if (controls.left) desiredMoveDirection.x = -1;
        if (controls.right) desiredMoveDirection.x = 1;

        // Click to move
        if (this.moveTarget) {
            const directionToTarget = new THREE.Vector3()
                .subVectors(this.moveTarget, this.position);
            const distanceToTarget = directionToTarget.length();

            if (distanceToTarget < 0.5) {
                this.moveTarget = null;
                desiredMoveDirection.set(0, 0, 0); // Stop when target is reached
            } else {
                desiredMoveDirection = directionToTarget.normalize();
            }
        }

        // Rotate movement direction based on camera
        if (desiredMoveDirection.lengthSq() > 0) { // Only apply camera rotation if there's input
            desiredMoveDirection.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                controls.cameraRotation.y
            );
            desiredMoveDirection.normalize(); // Ensure it's a unit vector after rotation
        }
        
        const targetVelocity = desiredMoveDirection.multiplyScalar(this.maxSpeed);

        // Acceleration / Deceleration
        if (desiredMoveDirection.lengthSq() > 0) { // If there's input
            this.isMoving = true;
            // Accelerate towards target velocity
            let accelerationVector = new THREE.Vector3().subVectors(targetVelocity, this.velocity);
            if (accelerationVector.lengthSq() > (this.acceleration * deltaTime) * (this.acceleration * deltaTime)) {
                accelerationVector.normalize().multiplyScalar(this.acceleration * deltaTime);
            }
            this.velocity.add(accelerationVector);

            // Face movement direction (or camera direction if right mouse button is held)
            if (!controls.rightMouseDown && this.velocity.lengthSq() > 0.01) {
                 this.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
            } else if (controls.rightMouseDown) {
                this.rotation.y = controls.cameraRotation.y;
            }

        } else { // No input, decelerate
            this.isMoving = false;
            let speed = this.velocity.length();
            if (speed > 0) {
                let decel = this.deceleration * deltaTime;
                if (speed <= decel) {
                    this.velocity.set(0, 0, 0);
                } else {
                    this.velocity.multiplyScalar(1 - (decel / speed));
                }
            }
        }
        
        // Clamp velocity to maxSpeed
        if (this.velocity.lengthSq() > this.maxSpeed * this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }

        // Jumping
        if (controls.jump && this.isGrounded && !this.isStunned) {
            this.currentJumpVelocity = this.jumpHeight;
            this.isGrounded = false;
        }

        // Apply gravity
        if (!this.isGrounded) {
            this.currentJumpVelocity += this.game.physics.gravity * deltaTime; // gravity is negative
        } else {
            this.currentJumpVelocity = 0; // Reset jump velocity if grounded and not jumping
        }
        this.velocity.y = this.currentJumpVelocity;


        // Calculate potential new position
        let potentialPosition = this.position.clone().add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // --- Collision Detection and Response ---
        // Ground collision (simplified)
        const groundHeight = this.game.world.getHeightAtPosition(potentialPosition.x, potentialPosition.z);
        if (potentialPosition.y < groundHeight) {
            potentialPosition.y = groundHeight;
            this.velocity.y = 0;
            this.currentJumpVelocity = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false; // Player is in the air if not colliding with ground
        }

        // Entity/Object Collision (Placeholder - to be expanded)
        const nearbyEntities = this.game.world.worldManager?.getEntitiesInRadius(this.position, this.collisionRadius + 5) || []; // Get entities in a slightly larger radius for checking
        
        for (const entity of nearbyEntities) {
            if (entity === this || !entity.collidable) continue; // Skip self and non-collidable entities

            const entityRadius = entity.collisionRadius || 0.5; // Assume other entities also have a radius
            const distance = potentialPosition.distanceTo(entity.position);
            const penetration = this.collisionRadius + entityRadius - distance;

            if (penetration > 0) {
                // Basic push-back response
                const pushDirection = new THREE.Vector3().subVectors(potentialPosition, entity.position).normalize();
                potentialPosition.add(pushDirection.multiplyScalar(penetration));
                
                // Dampen velocity in the direction of collision
                const relativeVelocity = this.velocity.clone().sub(entity.velocity || new THREE.Vector3());
                const dotProduct = relativeVelocity.dot(pushDirection);
                if (dotProduct < 0) { // Moving towards each other
                    this.velocity.sub(pushDirection.multiplyScalar(dotProduct * 0.5)); // Reduce velocity component along pushDirection
                }
                
                // If colliding with something solid, and trying to jump into it from below, stop vertical movement.
                if (this.velocity.y > 0 && potentialPosition.y < entity.position.y + entityRadius) {
                     // this.velocity.y = 0;
                     // potentialPosition.y = this.position.y; // Revert Y to prevent "sticking" to ceilings
                }
            }
        }
        
        // Update position
        this.position.copy(potentialPosition);

        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation.y;
        
        // Update distance traveled stat
        const horizontalVelocity = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        this.game.stats.distanceTraveled += horizontalVelocity.length() * deltaTime;
    }
    
    updateCombat(deltaTime) {
        // Update global cooldown
        if (this.globalCooldown > 0) {
            this.globalCooldown -= deltaTime;
        }
        
        // Update ability cooldowns
        for (const ability of this.abilities.values()) {
            if (ability.currentCooldown > 0) {
                ability.currentCooldown -= deltaTime;
            }
        }
        
        // Update casting
        if (this.castingSpell) {
            this.castTime -= deltaTime;
            
            if (this.castTime <= 0) {
                this.completeCast();
            }
            
            // Update cast bar
            const progress = 1 - (this.castTime / this.castingSpell.castTime);
            this.game.ui.updateCastBar(progress, this.castingSpell.name);
        }
        
        // Auto attack
        if (this.target && this.target.alive) {
            const distance = this.position.distanceTo(this.target.position);
            if (distance <= 5) {
                // Perform auto attack
                this.autoAttack(deltaTime);
            }
        }
        
        // Resource regeneration
        switch(this.class) {
            case 'warrior':
                // Rage decays out of combat
                if (!this.game.gameState.inCombat) {
                    this.rage = Math.max(0, this.rage - 10 * deltaTime);
                }
                break;
            case 'rogue':
                // Energy regenerates
                this.energy = Math.min(this.maxEnergy, this.energy + 10 * deltaTime);
                break;
        }
    }
    
    updateBuffsDebuffs(deltaTime) {
        // Update buffs
        for (const [id, buff] of this.buffs) {
            buff.duration -= deltaTime;
            
            if (buff.duration <= 0) {
                this.removeBuff(id);
            } else if (buff.tick) {
                buff.tickTimer -= deltaTime;
                if (buff.tickTimer <= 0) {
                    buff.onTick(this);
                    buff.tickTimer = buff.tickInterval;
                }
            }
        }
        
        // Update debuffs
        for (const [id, debuff] of this.debuffs) {
            debuff.duration -= deltaTime;
            
            if (debuff.duration <= 0) {
                this.removeDebuff(id);
            } else if (debuff.tick) {
                debuff.tickTimer -= deltaTime;
                if (debuff.tickTimer <= 0) {
                    debuff.onTick(this);
                    debuff.tickTimer = debuff.tickInterval;
                }
            }
        }
    }
    
    updateCamera() {
        const controls = this.game.controls;
        
        // Calculate camera position
        const cameraDistance = 15;
        const cameraHeight = 5;
        
        const cameraX = this.position.x + 
            Math.sin(controls.cameraRotation.y) * cameraDistance;
        const cameraY = this.position.y + cameraHeight + 
            Math.sin(controls.cameraRotation.x) * cameraDistance;
        const cameraZ = this.position.z + 
            Math.cos(controls.cameraRotation.y) * cameraDistance;
        
        this.game.camera.position.set(cameraX, cameraY, cameraZ);
        this.game.camera.lookAt(
            this.position.x,
            this.position.y + 1,
            this.position.z
        );
    }
    
    updateUI() {
        // Update player frame
        const healthPercent = (this.health / this.maxHealth) * 100;
        const manaPercent = (this.mana / this.maxMana) * 100;
        
        document.querySelector('#player-frame .health').style.width = healthPercent + '%';
        document.querySelector('#player-frame .mana').style.width = manaPercent + '%';
        document.querySelector('#player-frame .health-bar .bar-text').textContent = 
            `${Math.floor(this.health)}/${this.maxHealth}`;
        document.querySelector('#player-frame .mana-bar .bar-text').textContent = 
            `${Math.floor(this.mana)}/${this.maxMana}`;
        document.querySelector('#player-frame .level').textContent = this.level;
        document.querySelector('#player-frame .name').textContent = this.name;
        
        // Update experience bar
        const xpPercent = (this.experience / this.experienceToNext) * 100;
        document.querySelector('.xp-fill').style.width = xpPercent + '%';
        document.querySelector('.xp-text').textContent = 
            `${this.experience} / ${this.experienceToNext} XP`;
    }
    
    regenerate(deltaTime) {
        if (!this.game.gameState.inCombat) {
            // Out of combat regeneration
            this.health = Math.min(this.maxHealth, this.health + 5 * deltaTime);
            this.mana = Math.min(this.maxMana, this.mana + 10 * deltaTime);
        } else {
            // In combat regeneration (spirit-based)
            const spiritRegen = this.attributes.spirit * 0.1;
            this.mana = Math.min(this.maxMana, this.mana + spiritRegen * deltaTime);
        }
    }
    
    useAbility(slot) {
        const abilityName = this.actionBars[slot];
        if (!abilityName) return;
        
        const ability = this.abilities.get(abilityName);
        if (!ability) return;
        
        // Check if can cast
        if (!this.canCastAbility(ability)) return;
        
        // Start casting
        if (ability.castTime > 0) {
            this.startCasting(ability);
        } else {
            this.instantCast(ability);
        }
    }
    
    canCastAbility(ability) {
        // Check cooldown
        if (ability.currentCooldown > 0) {
            this.game.ui.showError('Ability is on cooldown');
            return false;
        }
        
        // Check global cooldown
        if (ability.gcd && this.globalCooldown > 0) {
            this.game.ui.showError('Global cooldown active');
            return false;
        }
        
        // Check resource cost
        if (ability.cost > 0) {
            switch(ability.costType) {
                case 'mana':
                    if (this.mana < ability.cost) {
                        this.game.ui.showError('Not enough mana');
                        return false;
                    }
                    break;
                case 'rage':
                    if (this.rage < ability.cost) {
                        this.game.ui.showError('Not enough rage');
                        return false;
                    }
                    break;
                case 'energy':
                    if (this.energy < ability.cost) {
                        this.game.ui.showError('Not enough energy');
                        return false;
                    }
                    break;
            }
        }
        
        // Check if casting
        if (this.isCasting) {
            this.game.ui.showError('Already casting');
            return false;
        }
        
        // Check if stunned
        if (this.isStunned) {
            this.game.ui.showError('Cannot cast while stunned');
            return false;
        }
        
        // Check range
        if (ability.range > 0 && this.target) {
            const distance = this.position.distanceTo(this.target.position);
            if (distance > ability.range) {
                this.game.ui.showError('Target out of range');
                return false;
            }
        }
        
        return true;
    }
    
    startCasting(ability) {
        this.isCasting = true;
        this.castingSpell = ability;
        this.castTime = ability.castTime;
        
        // Show cast bar
        this.game.ui.showCastBar(ability.name);
    }
    
    instantCast(ability) {
        // Consume resources
        this.consumeResources(ability);
        
        // Apply ability effects
        this.applyAbilityEffects(ability);
        
        // Set cooldowns
        ability.currentCooldown = ability.cooldown;
        if (ability.gcd) {
            this.globalCooldown = 1.5;
        }
    }
    
    completeCast() {
        const ability = this.castingSpell;
        
        // Consume resources
        this.consumeResources(ability);
        
        // Apply ability effects
        this.applyAbilityEffects(ability);
        
        // Set cooldowns
        ability.currentCooldown = ability.cooldown;
        if (ability.gcd) {
            this.globalCooldown = 1.5;
        }
        
        // Clear casting state
        this.isCasting = false;
        this.castingSpell = null;
        this.castTime = 0;
        
        // Hide cast bar
        this.game.ui.hideCastBar();
    }
    
    consumeResources(ability) {
        if (ability.cost > 0) {
            switch(ability.costType) {
                case 'mana':
                    this.mana -= ability.cost;
                    break;
                case 'rage':
                    this.rage -= ability.cost;
                    break;
                case 'energy':
                    this.energy -= ability.cost;
                    break;
            }
        }
    }
    
    applyAbilityEffects(ability) {
        // Custom effect function
        if (ability.effect) {
            ability.effect();
            return;
        }
        
        // Damage abilities
        if (ability.damage && this.target) {
            const damage = this.calculateDamage(ability.damage);
            this.game.combat.dealDamage(this, this.target, damage, ability.name);
            
            // Generate rage for warriors
            if (this.class === 'warrior') {
                this.rage = Math.min(this.maxRage, this.rage + damage * 0.1);
            }
        }
        
        // Healing abilities
        if (ability.healing) {
            const target = this.target && this.target.faction === this.faction ? 
                this.target : this;
            const healing = this.calculateHealing(ability.healing);
            this.game.combat.heal(this, target, healing, ability.name);
        }
        
        // Buff abilities
        if (ability.buff) {
            const target = this.target && this.target.faction === this.faction ? 
                this.target : this;
            this.applyBuff(ability.name, {
                name: ability.name,
                icon: ability.icon,
                duration: ability.duration || 3600,
                effect: ability.buffEffect
            });
        }
        
        // Area effects
        if (ability.radius) {
            const nearbyEnemies = this.game.combat.getEnemiesInRadius(
                this.position, 
                ability.radius
            );
            nearbyEnemies.forEach(enemy => {
                const damage = this.calculateDamage(ability.damage);
                this.game.combat.dealDamage(this, enemy, damage, ability.name);
            });
        }
        
        // Special effects
        this.createAbilityVisual(ability);
    }
    
    calculateDamage(baseDamage) {
        let damage = baseDamage + this.attackPower * 0.5;
        
        // Apply crit
        if (Math.random() < this.critChance) {
            damage *= 2;
        }
        
        return Math.floor(damage);
    }
    
    calculateHealing(baseHealing) {
        let healing = baseHealing + this.spellPower * 0.8;
        
        // Apply crit
        if (Math.random() < this.critChance) {
            healing *= 1.5;
        }
        
        return Math.floor(healing);
    }
    
    createAbilityVisual(ability) {
        // Create visual effects for abilities
        switch(ability.name) {
            case 'Fireball':
                this.createFireballProjectile();
                break;
            case 'Frostbolt':
                this.createFrostboltProjectile();
                break;
            case 'Thunder Clap':
                this.createThunderClapEffect();
                break;
        }
    }
    
    createFireballProjectile() {
        if (!this.target) return;
        
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff6600,
            emissive: 0xff0000
        });
        
        const projectile = {
            mesh: new THREE.Mesh(geometry, material),
            velocity: new THREE.Vector3(),
            target: this.target,
            damage: this.calculateDamage(80),
            lifetime: 2
        };
        
        projectile.mesh.position.copy(this.position);
        projectile.mesh.position.y += 1.5;
        
        this.game.scene.add(projectile.mesh);
        this.game.projectiles.push(projectile);
    }
    
    createFrostboltProjectile() {
        if (!this.target) return;
        
        const geometry = new THREE.ConeGeometry(0.2, 0.8, 6);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ccff,
            emissive: 0x0066ff
        });
        
        const projectile = {
            mesh: new THREE.Mesh(geometry, material),
            velocity: new THREE.Vector3(),
            target: this.target,
            damage: this.calculateDamage(60),
            slow: 0.5,
            lifetime: 2
        };
        
        projectile.mesh.position.copy(this.position);
        projectile.mesh.position.y += 1.5;
        
        this.game.scene.add(projectile.mesh);
        this.game.projectiles.push(projectile);
    }
    
    createThunderClapEffect() {
        // Create shockwave effect
        const geometry = new THREE.RingGeometry(0.1, 8, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const shockwave = new THREE.Mesh(geometry, material);
        shockwave.position.copy(this.position);
        shockwave.rotation.x = -Math.PI / 2;
        
        this.game.scene.add(shockwave);
        
        // Animate shockwave
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 0.5) {
                this.game.scene.remove(shockwave);
                return;
            }
            
            const scale = 1 + elapsed * 20;
            shockwave.scale.set(scale, scale, 1);
            shockwave.material.opacity = 0.8 * (1 - elapsed * 2);
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    autoAttack(deltaTime) {
        // Implement auto attack logic
        if (!this.autoAttackTimer) {
            this.autoAttackTimer = 0;
        }
        
        this.autoAttackTimer -= deltaTime;
        
        if (this.autoAttackTimer <= 0) {
            const damage = this.calculateDamage(this.attackPower * 0.5);
            this.game.combat.dealDamage(this, this.target, damage, 'Auto Attack');
            
            // Reset timer based on attack speed
            this.autoAttackTimer = 2.0; // Base attack speed
            
            // Generate rage for warriors
            if (this.class === 'warrior') {
                this.rage = Math.min(this.maxRage, this.rage + 10);
            }
        }
    }
    
    chargeToTarget() {
        if (!this.target) return;
        
        // Instantly move to target
        const direction = new THREE.Vector3()
            .subVectors(this.target.position, this.position)
            .normalize();
        
        const chargeDistance = Math.min(
            this.position.distanceTo(this.target.position) - 2,
            20
        );
        
        this.position.add(direction.multiplyScalar(chargeDistance));
        
        // Stun target
        if (this.target.applyDebuff) {
            this.target.applyDebuff('stun', {
                name: 'Charge Stun',
                duration: 1,
                stun: true
            });
        }
        
        // Generate rage
        this.rage = Math.min(this.maxRage, this.rage + 15);
    }
    
    setTarget(entity) {
        this.target = entity;
        
        // Update UI
        if (entity) {
            document.getElementById('target-frame').style.display = 'block';
            this.updateTargetFrame();
        } else {
            document.getElementById('target-frame').style.display = 'none';
        }
    }
    
    updateTargetFrame() {
        if (!this.target) return;
        
        const healthPercent = (this.target.health / this.target.maxHealth) * 100;
        
        document.querySelector('#target-frame .health').style.width = healthPercent + '%';
        document.querySelector('#target-frame .health-bar .bar-text').textContent = 
            `${Math.floor(this.target.health)}/${this.target.maxHealth}`;
        document.querySelector('#target-frame .level').textContent = this.target.level;
        document.querySelector('#target-frame .name').textContent = 
            this.target.name || this.target.type;
    }
    
    moveToPosition(position) {
        this.moveTarget = position.clone();
    }
    
    applyBuff(id, buff) {
        buff.startTime = Date.now();
        this.buffs.set(id, buff);
        this.game.ui.updateBuffs();
    }
    
    removeBuff(id) {
        this.buffs.delete(id);
        this.game.ui.updateBuffs();
    }
    
    applyDebuff(id, debuff) {
        debuff.startTime = Date.now();
        this.debuffs.set(id, debuff);
        
        if (debuff.stun) {
            this.isStunned = true;
        }
        
        this.game.ui.updateDebuffs();
    }
    
    removeDebuff(id) {
        const debuff = this.debuffs.get(id);
        if (debuff && debuff.stun) {
            this.isStunned = false;
        }
        
        this.debuffs.delete(id);
        this.game.ui.updateDebuffs();
    }
    
    takeDamage(amount, attacker) {
        this.health = Math.max(0, this.health - amount);
        
        // Enter combat
        this.game.gameState.inCombat = true;
        
        // Generate rage for warriors when taking damage
        if (this.class === 'warrior') {
            this.rage = Math.min(this.maxRage, this.rage + amount * 0.1);
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    die() {
        // Player death logic
        this.health = 0;
        this.game.stats.deathCount++;
        
        // Show death UI
        this.game.ui.showDeathScreen();
        
        // Drop a percentage of gold
        const goldLoss = Math.floor(this.currency.gold * 0.1);
        this.currency.gold -= goldLoss;
        
        // Release spirit or resurrect at graveyard
        setTimeout(() => {
            this.resurrect();
        }, 3000);
    }
    
    resurrect() {
        // Resurrect at nearest graveyard
        this.health = this.maxHealth * 0.5;
        this.mana = this.maxMana * 0.5;
        
        // Reset position to graveyard
        this.position.set(0, 0, 0);
        
        // Apply resurrection sickness
        this.applyDebuff('resSickness', {
            name: 'Resurrection Sickness',
            icon: '💀',
            duration: 600,
            statsReduction: 0.75
        });
        
        this.game.ui.hideDeathScreen();
    }
    
    gainExperience(amount) {
        this.experience += amount;
        
        // Check for level up
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
        
        // Show experience gain
        this.game.ui.showCombatText(`+${amount} XP`, 'experience');
    }
    
    levelUp() {
        this.level++;
        this.experience -= this.experienceToNext;
        this.experienceToNext = Math.floor(this.experienceToNext * 1.5);
        
        // Increase stats
        this.maxHealth += 10 + this.attributes.stamina * 2;
        this.maxMana += 15 + this.attributes.intellect;
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        
        // Increase attributes
        this.attributes.strength += 1;
        this.attributes.agility += 1;
        this.attributes.intellect += 1;
        this.attributes.stamina += 1;
        this.attributes.spirit += 1;
        
        // Show level up effects
        this.game.ui.showLevelUp(this.level);
        
        // Award talent point every 10 levels
        if (this.level % 10 === 0) {
            this.talentPoints++;
            this.game.ui.showNotification('New talent point available!');
        }
    }
    
    addCurrency(copper) {
        this.currency.copper += copper;
        
        // Convert copper to silver and gold
        while (this.currency.copper >= 100) {
            this.currency.copper -= 100;
            this.currency.silver += 1;
        }
        
        while (this.currency.silver >= 100) {
            this.currency.silver -= 100;
            this.currency.gold += 1;
        }
        
        this.game.stats.goldEarned += copper / 10000;
    }
    
    equipItem(item, slot) {
        // Unequip current item
        const currentItem = this.equipment[slot];
        if (currentItem) {
            this.unequipItem(slot);
        }
        
        // Equip new item
        this.equipment[slot] = item;
        
        // Apply item stats
        this.applyItemStats(item);
        
        // Update appearance
        this.updateAppearance();
    }
    
    unequipItem(slot) {
        const item = this.equipment[slot];
        if (!item) return;
        
        // Remove item stats
        this.removeItemStats(item);
        
        // Add to inventory
        this.game.inventory.addItem(item);
        
        this.equipment[slot] = null;
        this.updateAppearance();
    }
    
    applyItemStats(item) {
        // Apply stat bonuses from item
        if (item.stats) {
            if (item.stats.strength) this.attributes.strength += item.stats.strength;
            if (item.stats.agility) this.attributes.agility += item.stats.agility;
            if (item.stats.intellect) this.attributes.intellect += item.stats.intellect;
            if (item.stats.stamina) this.attributes.stamina += item.stats.stamina;
            if (item.stats.spirit) this.attributes.spirit += item.stats.spirit;
            
            if (item.stats.attackPower) this.attackPower += item.stats.attackPower;
            if (item.stats.spellPower) this.spellPower += item.stats.spellPower;
            if (item.stats.armor) this.armor += item.stats.armor;
        }
        
        // Recalculate derived stats
        this.recalculateStats();
    }
    
    removeItemStats(item) {
        // Remove stat bonuses from item
        if (item.stats) {
            if (item.stats.strength) this.attributes.strength -= item.stats.strength;
            if (item.stats.agility) this.attributes.agility -= item.stats.agility;
            if (item.stats.intellect) this.attributes.intellect -= item.stats.intellect;
            if (item.stats.stamina) this.attributes.stamina -= item.stats.stamina;
            if (item.stats.spirit) this.attributes.spirit -= item.stats.spirit;
            
            if (item.stats.attackPower) this.attackPower -= item.stats.attackPower;
            if (item.stats.spellPower) this.spellPower -= item.stats.spellPower;
            if (item.stats.armor) this.armor -= item.stats.armor;
        }
        
        // Recalculate derived stats
        this.recalculateStats();
    }
    
    recalculateStats() {
        // Recalculate health and mana based on attributes
        const oldMaxHealth = this.maxHealth;
        const oldMaxMana = this.maxMana;
        
        this.maxHealth = 100 + this.level * 10 + this.attributes.stamina * 10;
        this.maxMana = 100 + this.level * 15 + this.attributes.intellect * 15;
        
        // Adjust current values proportionally
        this.health = (this.health / oldMaxHealth) * this.maxHealth;
        this.mana = (this.mana / oldMaxMana) * this.maxMana;
        
        // Update other derived stats
        this.critChance = 0.05 + this.attributes.agility * 0.001;
    }
    
    updateAppearance() {
        // Update character appearance based on equipment
        // This would update the 3D model with equipped items
    }
}
