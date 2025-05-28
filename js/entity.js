// Entity.js - Base entity class and entity types
class Entity {
    constructor(id, type, position) {
        this.id = id;
        this.type = type;
        this.position = position.clone();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3();
        
        // Status
        this.alive = true;
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 100;
        this.maxMana = 100;
        this.level = 1;
        
        // Combat stats
        this.attackPower = 10;
        this.armor = 0;
        this.attackSpeed = 2.0;
        this.attackRange = 2;
        this.lastAttackTime = 0;
        
        // Movement
        this.moveSpeed = 5;
        this.isMoving = false;
        this.destination = null;
        this.pathfinding = null;
        
        // Targeting
        this.target = null;
        this.targetable = true;
        this.collidable = true; // New property for collision detection
        this.collisionRadius = 0.5; // Default collision radius
        
        // Mesh
        this.mesh = null;
        this.nameplate = null;
        this.healthBar = null;
        
        // Animation
        this.animations = new Map();
        this.currentAnimation = null;
        this.animationMixer = null;
    }
    
    update(deltaTime) {
        // Update position
        if (this.velocity.length() > 0) {
            const movement = this.velocity.clone().multiplyScalar(deltaTime);
            this.position.add(movement);
            
            if (this.mesh) {
                this.mesh.position.copy(this.position);
            }
        }
        
        // Update animations
        if (this.animationMixer) {
            this.animationMixer.update(deltaTime);
        }
        
        // Update UI elements
        this.updateNameplate();
        this.updateHealthBar();
    }
    
    takeDamage(amount, source) {
        if (!this.alive) return;
        
        this.health = Math.max(0, this.health - amount);
        
        // Play hurt animation
        this.playAnimation('hurt');
        
        // Check death
        if (this.health <= 0) {
            this.die(source);
        }
    }
    
    heal(amount) {
        if (!this.alive) return;
        
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    die(killer) {
        this.alive = false;
        this.health = 0;
        
        // Play death animation
        this.playAnimation('death');
        
        // Remove from targetable
        this.targetable = false;
        
        // Clear velocity
        this.velocity.set(0, 0, 0);
        
        // Notify systems
        if (this.ai) {
            this.ai.onDeath();
        }
    }
    
    respawn(position) {
        this.alive = true;
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        this.targetable = true;
        
        if (position) {
            this.position.copy(position);
            if (this.mesh) {
                this.mesh.position.copy(position);
            }
        }
        
        // Reset animations
        this.playAnimation('idle');
    }
    
    moveTo(destination) {
        this.destination = destination.clone();
        this.isMoving = true;
        
        // Calculate direction
        const direction = new THREE.Vector3()
            .subVectors(destination, this.position)
            .normalize();
        
        // Set velocity
        this.velocity = direction.multiplyScalar(this.moveSpeed);
        
        // Face direction
        if (direction.length() > 0) {
            this.rotation.y = Math.atan2(direction.x, direction.z);
            if (this.mesh) {
                this.mesh.rotation.y = this.rotation.y;
            }
        }
        
        // Play walk animation
        this.playAnimation('walk');
    }
    
    stopMoving() {
        this.isMoving = false;
        this.velocity.set(0, 0, 0);
        this.destination = null;
        
        // Play idle animation
        this.playAnimation('idle');
    }
    
    setTarget(target) {
        this.target = target;
    }
    
    playAnimation(name, loop = true) {
        if (!this.animations.has(name)) return;
        if (this.currentAnimation === name) return;
        
        const animation = this.animations.get(name);
        
        // Stop current animation
        if (this.currentAnimation) {
            const current = this.animations.get(this.currentAnimation);
            current.stop();
        }
        
        // Play new animation
        animation.reset();
        animation.play();
        animation.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
        
        this.currentAnimation = name;
    }
    
    createNameplate(name) {
        // Create nameplate sprite
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        context.font = '24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(name, 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        
        this.nameplate = new THREE.Sprite(material);
        this.nameplate.scale.set(2, 0.5, 1);
        this.nameplate.position.y = 2.5;
        
        if (this.mesh) {
            this.mesh.add(this.nameplate);
        }
    }
    
    updateNameplate() {
        if (!this.nameplate) return;
        
        // Face camera
        if (this.mesh && this.mesh.parent) {
            const camera = this.mesh.parent.parent; // Assuming scene->camera structure
            if (camera) {
                this.nameplate.lookAt(camera.position);
            }
        }
    }
    
    createHealthBar() {
        const geometry = new THREE.PlaneGeometry(1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        
        this.healthBar = new THREE.Mesh(geometry, material);
        this.healthBar.position.y = 2;
        
        // Background bar
        const bgGeometry = new THREE.PlaneGeometry(1.1, 0.15);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const bgBar = new THREE.Mesh(bgGeometry, bgMaterial);
        bgBar.position.z = -0.01;
        
        this.healthBar.add(bgBar);
        
        if (this.mesh) {
            this.mesh.add(this.healthBar);
        }
    }
    
    updateHealthBar() {
        if (!this.healthBar) return;
        
        // Update health bar scale
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.scale.x = healthPercent;
        this.healthBar.position.x = (healthPercent - 1) * 0.5;
        
        // Update color based on health
        if (healthPercent > 0.5) {
            this.healthBar.material.color.setHex(0x00ff00); // Green
        } else if (healthPercent > 0.25) {
            this.healthBar.material.color.setHex(0xffff00); // Yellow
        } else {
            this.healthBar.material.color.setHex(0xff0000); // Red
        }
        
        // Face camera
        if (this.mesh && this.mesh.parent) {
            const camera = this.mesh.parent.parent;
            if (camera) {
                this.healthBar.lookAt(camera.position);
            }
        }
        
        // Hide if dead
        this.healthBar.visible = this.alive && this.health < this.maxHealth;
    }
    
    distanceTo(target) {
        if (target.position) {
            return this.position.distanceTo(target.position);
        }
        return this.position.distanceTo(target);
    }
    
    inRange(target, range) {
        return this.distanceTo(target) <= range;
    }
    
    faceTarget(target) {
        const direction = new THREE.Vector3()
            .subVectors(target.position || target, this.position)
            .normalize();
        
        this.rotation.y = Math.atan2(direction.x, direction.z);
        
        if (this.mesh) {
            this.mesh.rotation.y = this.rotation.y;
        }
    }
    
    dispose() {
        // Clean up Three.js objects
        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
        
        // Remove from scene
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        
        // Clear references
        this.mesh = null;
        this.nameplate = null;
        this.healthBar = null;
        this.animations.clear();
        this.animationMixer = null;
    }
}

// Enemy entity
class Enemy extends Entity {
    constructor(id, position, enemyData) {
        super(id, 'enemy', position);
        
        // Apply enemy data
        this.name = enemyData.name;
        this.level = enemyData.level;
        this.maxHealth = enemyData.health || 100;
        this.health = this.maxHealth;
        this.attackPower = enemyData.attackPower || 10;
        this.armor = enemyData.armor || 0;
        this.moveSpeed = enemyData.moveSpeed || 3;
        this.attackRange = enemyData.attackRange || 2;
        this.aggroRange = enemyData.aggroRange || 10;
        this.dropTable = enemyData.dropTable || [];
        this.collisionRadius = enemyData.collisionRadius || 0.7; // Enemies might be slightly larger
        
        // Enemy specific
        this.faction = enemyData.faction || 'hostile';
        this.respawnTime = enemyData.respawnTime || 60;
        this.patrolPath = enemyData.patrolPath || null;
        this.spawnPosition = position.clone();
        
        // Create mesh
        this.createMesh(enemyData);
        
        // Create AI
        this.ai = new EnemyAI(this);
        
        // Loot
        this.lootable = false;
        this.loot = [];
    }
    
    createMesh(enemyData) {
        // Create basic enemy mesh
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshPhongMaterial({
            color: enemyData.color || 0xff0000
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add reference to entity
        this.mesh.userData.entity = this;
        
        // Create nameplate
        this.createNameplate(this.name);
        
        // Create health bar
        this.createHealthBar();
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update AI
        if (this.ai && this.alive) {
            this.ai.update(deltaTime);
        }
        
        // Check if at destination
        if (this.isMoving && this.destination) {
            const distance = this.position.distanceTo(this.destination);
            if (distance < 0.5) {
                this.stopMoving();
            }
        }
    }
    
    die(killer) {
        super.die(killer);
        
        // Generate loot
        this.generateLoot();
        
        // Set respawn timer
        if (this.respawnTime > 0) {
            setTimeout(() => {
                this.respawn(this.spawnPosition);
            }, this.respawnTime * 1000);
        }
    }
    
    generateLoot() {
        this.loot = [];
        
        // Generate gold
        const goldAmount = Math.floor(
            (5 + Math.random() * 10) * this.level
        );
        
        this.loot.push({
            type: 'currency',
            value: goldAmount
        });
        
        // Roll for items from drop table
        if (this.dropTable) {
            this.dropTable.forEach(drop => {
                if (Math.random() < drop.chance) {
                    this.loot.push({...drop.item});
                }
            });
        }
        
        // Mark as lootable if has loot
        if (this.loot.length > 0) {
            this.lootable = true;
        }
    }
}

// NPC entity
class NPC extends Entity {
    constructor(id, position, npcData) {
        super(id, 'npc', position);
        
        this.name = npcData.name;
        this.title = npcData.title || '';
        this.faction = npcData.faction || 'friendly';
        
        // NPC functions
        this.vendor = npcData.vendor || false;
        this.questGiver = npcData.questGiver || false;
        this.trainer = npcData.trainer || false;
        this.flightMaster = npcData.flightMaster || false;
        this.innkeeper = npcData.innkeeper || false;
        
        // Dialogue
        this.dialogue = npcData.dialogue || [];
        this.greetings = npcData.greetings || ['Hello there!'];
        
        // Vendor inventory
        if (this.vendor) {
            this.inventory = npcData.inventory || [];
        }
        
        // Quest marker
        this.hasQuest = false;
        this.questId = null;
        this.collisionRadius = npcData.collisionRadius || 0.6; // NPCs collision radius
        
        // Create mesh
        this.createMesh(npcData);
    }
    
    createMesh(npcData) {
        // Create NPC mesh
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshPhongMaterial({
            color: npcData.color || 0x0066ff
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add reference to entity
        this.mesh.userData.entity = this;
        
        // Create nameplate with title
        const nameText = this.title ? `${this.name}\n<${this.title}>` : this.name;
        this.createNameplate(nameText);
        
        // Create quest marker if has quest
        if (this.questGiver) {
            this.createQuestMarker();
        }
    }
    
    createQuestMarker() {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        
        this.questMarker = new THREE.Mesh(geometry, material);
        this.questMarker.position.y = 2.5;
        
        if (this.mesh) {
            this.mesh.add(this.questMarker);
        }
        
        // Animate quest marker
        this.animateQuestMarker();
    }
    
    animateQuestMarker() {
        if (!this.questMarker) return;
        
        const animate = () => {
            if (!this.questMarker) return;
            
            this.questMarker.rotation.y += 0.05;
            this.questMarker.position.y = 2.5 + Math.sin(Date.now() * 0.003) * 0.1;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    updateQuestStatus(hasQuest, questComplete = false) {
        this.hasQuest = hasQuest;
        
        if (this.questMarker) {
            this.questMarker.visible = hasQuest;
            
            // Change color for quest complete
            if (questComplete) {
                this.questMarker.material.color.setHex(0x00ff00);
                this.questMarker.material.emissive.setHex(0x00ff00);
            } else {
                this.questMarker.material.color.setHex(0xffff00);
                this.questMarker.material.emissive.setHex(0xffff00);
            }
        }
    }
    
    interact(player) {
        // Face player
        this.faceTarget(player);
        
        // Greet player
        const greeting = this.greetings[
            Math.floor(Math.random() * this.greetings.length)
        ];
        player.game.ui.addChatMessage('general', this.name, greeting, '#00ff00');
        
        // Handle different NPC types
        if (this.questGiver && this.hasQuest) {
            player.game.quests.showQuestDialog(this);
        } else if (this.vendor) {
            player.game.ui.showVendorWindow(this);
        } else if (this.flightMaster) {
            player.game.ui.showFlightMap(this);
        } else if (this.innkeeper) {
            this.setHearthstone(player);
        } else if (this.trainer) {
            player.game.ui.showTrainerWindow(this);
        }
    }
    
    setHearthstone(player) {
        player.hearthstoneLocation = this.position.clone();
        player.game.ui.showNotification('Hearthstone location set!');
    }
}

// Basic Enemy AI
class EnemyAI {
    constructor(enemy) {
        this.enemy = enemy;
        this.state = 'idle';
        this.combatTarget = null;
        this.lastStateChange = Date.now();
        this.patrolIndex = 0;
        this.leashRange = 30;
    }
    
    update(deltaTime) {
        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime);
                break;
            case 'patrol':
                this.updatePatrol(deltaTime);
                break;
            case 'combat':
                this.updateCombat(deltaTime);
                break;
            case 'returning':
                this.updateReturning(deltaTime);
                break;
        }
    }
    
    updateIdle(deltaTime) {
        // Check for nearby threats
        const player = this.enemy.game.player;
        const distance = this.enemy.distanceTo(player);
        
        if (distance <= this.enemy.aggroRange && player.alive) {
            this.enterCombat(player);
        } else if (this.enemy.patrolPath && Date.now() - this.lastStateChange > 5000) {
            this.setState('patrol');
        }
    }
    
    updatePatrol(deltaTime) {
        // Move along patrol path
        if (this.enemy.patrolPath && this.enemy.patrolPath.length > 0) {
            const target = this.enemy.patrolPath[this.patrolIndex];
            
            if (!this.enemy.isMoving) {
                this.enemy.moveTo(target);
            }
            
            // Check if reached patrol point
            const distance = this.enemy.position.distanceTo(target);
            if (distance < 1) {
                this.patrolIndex = (this.patrolIndex + 1) % this.enemy.patrolPath.length;
                this.enemy.stopMoving();
                this.setState('idle');
            }
        }
        
        // Check for threats while patrolling
        const player = this.enemy.game.player;
        const distance = this.enemy.distanceTo(player);
        
        if (distance <= this.enemy.aggroRange && player.alive) {
            this.enterCombat(player);
        }
    }
    
    updateCombat(deltaTime) {
        if (!this.combatTarget || !this.combatTarget.alive) {
            this.exitCombat();
            return;
        }
        
        // Check leash range
        const distanceFromSpawn = this.enemy.position.distanceTo(this.enemy.spawnPosition);
        if (distanceFromSpawn > this.leashRange) {
            this.setState('returning');
            return;
        }
        
        const distance = this.enemy.distanceTo(this.combatTarget);
        
        // Move towards target if out of range
        if (distance > this.enemy.attackRange) {
            if (!this.enemy.isMoving) {
                this.enemy.moveTo(this.combatTarget.position);
            }
        } else {
            // In range - stop and attack
            if (this.enemy.isMoving) {
                this.enemy.stopMoving();
            }
            
            // Face target
            this.enemy.faceTarget(this.combatTarget);
            
            // Attack if off cooldown
            const now = Date.now();
            if (now - this.enemy.lastAttackTime > this.enemy.attackSpeed * 1000) {
                this.attack();
                this.enemy.lastAttackTime = now;
            }
        }
    }
    
    updateReturning(deltaTime) {
        // Return to spawn position
        if (!this.enemy.isMoving) {
            this.enemy.moveTo(this.enemy.spawnPosition);
        }
        
        // Check if reached spawn
        const distance = this.enemy.position.distanceTo(this.enemy.spawnPosition);
        if (distance < 1) {
            this.enemy.stopMoving();
            this.setState('idle');
            
            // Reset health
            this.enemy.health = this.enemy.maxHealth;
        }
    }
    
    enterCombat(target) {
        this.combatTarget = target;
        this.setState('combat');
        
        // Alert nearby allies
        const allies = this.enemy.game.combat.getEnemiesInRadius(
            this.enemy.position, 10
        );
        
        allies.forEach(ally => {
            if (ally !== this.enemy && ally.ai && ally.ai.state === 'idle') {
                ally.ai.enterCombat(target);
            }
        });
    }
    
    exitCombat() {
        this.combatTarget = null;
        
        // Check if need to return to spawn
        const distanceFromSpawn = this.enemy.position.distanceTo(this.enemy.spawnPosition);
        if (distanceFromSpawn > 5) {
            this.setState('returning');
        } else {
            this.setState('idle');
        }
    }
    
    attack() {
        if (!this.combatTarget || !this.combatTarget.alive) return;
        
        // Play attack animation
        this.enemy.playAnimation('attack', false);
        
        // Deal damage
        this.enemy.game.combat.dealDamage(
            this.enemy,
            this.combatTarget,
            this.enemy.attackPower,
            'Attack'
        );
    }
    
    onDeath() {
        this.setState('dead');
        this.combatTarget = null;
    }
    
    setState(newState) {
        this.state = newState;
        this.lastStateChange = Date.now();
    }
}

// Export entity types
const EntityTypes = {
    // Basic enemies
    kobold: {
        name: 'Kobold Vermin',
        level: 1,
        health: 50,
        attackPower: 5,
        armor: 0,
        moveSpeed: 3,
        attackRange: 2,
        aggroRange: 10,
        color: 0x8B4513,
        dropTable: [
            {
                chance: 0.3,
                item: {
                    name: 'Linen Cloth',
                    type: 'material',
                    stackable: true,
                    stackSize: 1
                }
            },
            {
                chance: 0.1,
                item: {
                    name: 'Broken Candle',
                    type: 'misc',
                    price: 5
                }
            }
        ]
    },
    
    wolf: {
        name: 'Gray Wolf',
        level: 2,
        health: 75,
        attackPower: 8,
        armor: 5,
        moveSpeed: 4,
        attackRange: 2,
        aggroRange: 12,
        color: 0x696969,
        dropTable: [
            {
                chance: 0.4,
                item: {
                    name: 'Wolf Pelt',
                    type: 'material',
                    stackable: true,
                    stackSize: 1
                }
            },
            {
                chance: 0.2,
                item: {
                    name: 'Sharp Claw',
                    type: 'material',
                    stackable: true,
                    stackSize: 1
                }
            }
        ]
    },
    
    bandit: {
        name: 'Defias Thug',
        level: 3,
        health: 100,
        attackPower: 12,
        armor: 10,
        moveSpeed: 3.5,
        attackRange: 2,
        aggroRange: 10,
        color: 0x800000,
        dropTable: [
            {
                chance: 0.8,
                item: {
                    name: 'Red Defias Bandana',
                    type: 'quest',
                    quality: 'common'
                }
            },
            {
                chance: 0.15,
                item: {
                    name: 'Worn Dagger',
                    type: 'weapon',
                    slot: 'mainhand',
                    quality: 'common',
                    stats: { attackPower: 3 }
                }
            }
        ]
    }
};

// NPC templates
const NPCTypes = {
    guard: {
        name: 'Stormwind Guard',
        title: 'City Guard',
        faction: 'alliance',
        color: 0x0066ff,
        dialogue: [
            'Move along, citizen.',
            'Keep the peace.',
            'For the Alliance!'
        ],
        greetings: ['Greetings, citizen.', 'How may I help you?']
    },
    
    vendor: {
        name: 'Thomas Miller',
        title: 'Baker',
        vendor: true,
        color: 0x00ff00,
        greetings: ['Fresh bread for sale!', 'Welcome to my shop!'],
        inventory: [
            {
                name: 'Fresh Bread',
                type: 'consumable',
                price: 25,
                effect: { heal: 30 },
                stackable: true
            },
            {
                name: 'Sweet Roll',
                type: 'consumable',
                price: 50,
                effect: { heal: 50 },
                stackable: true
            }
        ]
    },
    
    questgiver: {
        name: 'Marshal Dughan',
        title: 'Marshal of Goldshire',
        questGiver: true,
        color: 0xffcc00,
        greetings: ['Ah, a brave adventurer!', 'We need your help!']
    }
};

// Make classes available globally
window.Entity = Entity;
window.Enemy = Enemy;
window.NPC = NPC;
window.EnemyAI = EnemyAI;
window.EntityTypes = EntityTypes;
window.NPCTypes = NPCTypes;
