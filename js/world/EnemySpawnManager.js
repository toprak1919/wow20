// EnemySpawnManager.js - Modular enemy spawning system
class EnemySpawnManager {
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.game = worldManager.game;
        
        // Spawn pools organized by area
        this.spawnPools = new Map();
        
        // Active spawns
        this.activeSpawns = new Map();
        
        // Spawn configurations
        this.spawnConfigs = new Map();
        
        // Spawn timers
        this.spawnTimers = new Map();
        
        // Global spawn settings
        this.settings = {
            maxEnemiesPerArea: 50,
            spawnCheckInterval: 5, // seconds
            despawnDistance: 200,
            respawnTimeMultiplier: 1.0
        };
        
        // Events
        this.onEnemySpawned = null;
        this.onEnemyDespawned = null;
        
        // Initialize spawn configurations
        this.initializeSpawnConfigs();
    }
    
    initializeSpawnConfigs() {
        // Define spawn configurations for different enemy types
        // These can be loaded from JSON files in the future
        
        this.spawnConfigs.set('pack_spawn', {
            spawnType: 'pack',
            minCount: 2,
            maxCount: 5,
            radius: 10,
            formation: 'circle'
        });
        
        this.spawnConfigs.set('patrol_spawn', {
            spawnType: 'patrol',
            patrolPoints: [],
            patrolRadius: 30,
            patrolSpeed: 0.5
        });
        
        this.spawnConfigs.set('ambush_spawn', {
            spawnType: 'ambush',
            triggerRadius: 15,
            hideRadius: 5,
            ambushDelay: 1
        });
        
        this.spawnConfigs.set('elite_spawn', {
            spawnType: 'elite',
            escorts: 2,
            escortType: 'wolf',
            escortRadius: 5
        });
        
        this.spawnConfigs.set('rare_spawn', {
            spawnType: 'rare',
            spawnChance: 0.1,
            announcementRadius: 100,
            bonusLoot: true
        });
    }
    
    registerAreaSpawns(areaId, spawns) {
        if (!this.spawnPools.has(areaId)) {
            this.spawnPools.set(areaId, []);
        }
        
        const areaSpawns = this.spawnPools.get(areaId);
        
        spawns.forEach(spawn => {
            // Enhance spawn data with additional properties
            const enhancedSpawn = {
                ...spawn,
                id: `spawn_${areaId}_${Date.now()}_${Math.random()}`,
                areaId: areaId,
                active: false,
                currentEnemies: [],
                lastSpawnTime: 0,
                spawnConfig: this.spawnConfigs.get(spawn.spawnType) || {}
            };
            
            areaSpawns.push(enhancedSpawn);
            this.spawnTimers.set(enhancedSpawn.id, 0);
        });
    }
    
    update(deltaTime) {
        // Update spawn timers
        for (const [spawnId, timer] of this.spawnTimers) {
            if (timer > 0) {
                this.spawnTimers.set(spawnId, timer - deltaTime);
            }
        }
        
        // Check spawns for active areas
        const activeAreas = this.worldManager.getActiveAreas();
        
        activeAreas.forEach(area => {
            this.updateAreaSpawns(area.id, deltaTime);
        });
        
        // Clean up distant enemies
        this.cleanupDistantEnemies();
    }
    
    updateAreaSpawns(areaId, deltaTime) {
        const spawns = this.spawnPools.get(areaId);
        if (!spawns) return;
        
        const activeCount = this.getActiveEnemyCount(areaId);
        if (activeCount >= this.settings.maxEnemiesPerArea) return;
        
        spawns.forEach(spawn => {
            // Check if spawn should activate
            if (!spawn.active && this.shouldActivateSpawn(spawn)) {
                this.activateSpawn(spawn);
            }
            
            // Check if spawn needs to respawn enemies
            if (spawn.active && this.shouldRespawn(spawn)) {
                this.spawnEnemies(spawn);
            }
        });
    }
    
    shouldActivateSpawn(spawn) {
        // Check distance to player
        const playerDistance = this.game.player.position.distanceTo(
            new THREE.Vector3(spawn.position.x, spawn.position.y, spawn.position.z)
        );
        
        // Activate if player is within reasonable distance
        return playerDistance < 100;
    }
    
    shouldRespawn(spawn) {
        // Check respawn timer
        const timer = this.spawnTimers.get(spawn.id) || 0;
        if (timer > 0) return false;
        
        // Check current enemy count
        const aliveEnemies = spawn.currentEnemies.filter(enemy => 
            this.game.entities.has(enemy) && 
            this.game.entities.get(enemy).alive
        );
        
        spawn.currentEnemies = aliveEnemies;
        
        return aliveEnemies.length < (spawn.maxCount || 1);
    }
    
    activateSpawn(spawn) {
        spawn.active = true;
        this.activeSpawns.set(spawn.id, spawn);
        
        // Initial spawn
        this.spawnEnemies(spawn);
    }
    
    spawnEnemies(spawn) {
        const spawnCount = this.calculateSpawnCount(spawn);
        const positions = this.generateSpawnPositions(spawn, spawnCount);
        
        positions.forEach((pos, index) => {
            // Delay spawning for dramatic effect
            setTimeout(() => {
                const enemy = this.createEnemy(spawn, pos);
                if (enemy) {
                    spawn.currentEnemies.push(enemy.id);
                    
                    // Apply spawn configuration
                    this.applySpawnConfig(enemy, spawn);
                    
                    // Trigger spawn event
                    if (this.onEnemySpawned) {
                        this.onEnemySpawned(enemy, spawn);
                    }
                    
                    // Visual spawn effect
                    this.createSpawnEffect(pos);
                }
            }, index * 200);
        });
        
        // Set respawn timer
        const respawnTime = (spawn.respawnTime || 60) * this.settings.respawnTimeMultiplier;
        this.spawnTimers.set(spawn.id, respawnTime);
    }
    
    calculateSpawnCount(spawn) {
        if (spawn.spawnConfig.spawnType === 'pack') {
            const config = spawn.spawnConfig;
            return Math.floor(Math.random() * 
                (config.maxCount - config.minCount + 1)) + config.minCount;
        }
        
        return spawn.maxCount || 1;
    }
    
    generateSpawnPositions(spawn, count) {
        const positions = [];
        const basePos = new THREE.Vector3(
            spawn.position.x,
            spawn.position.y,
            spawn.position.z
        );
        
        if (count === 1) {
            positions.push(basePos.clone());
        } else {
            const config = spawn.spawnConfig;
            
            switch (config.formation) {
                case 'circle':
                    for (let i = 0; i < count; i++) {
                        const angle = (Math.PI * 2 * i) / count;
                        const radius = config.radius || 5;
                        const pos = basePos.clone();
                        pos.x += Math.cos(angle) * radius;
                        pos.z += Math.sin(angle) * radius;
                        positions.push(pos);
                    }
                    break;
                    
                case 'line':
                    for (let i = 0; i < count; i++) {
                        const pos = basePos.clone();
                        pos.x += (i - count / 2) * 3;
                        positions.push(pos);
                    }
                    break;
                    
                default:
                    // Random positions
                    for (let i = 0; i < count; i++) {
                        const pos = basePos.clone();
                        const offset = new THREE.Vector3(
                            (Math.random() - 0.5) * 10,
                            0,
                            (Math.random() - 0.5) * 10
                        );
                        pos.add(offset);
                        positions.push(pos);
                    }
            }
        }
        
        return positions;
    }
    
    createEnemy(spawn, position) {
        // Get enemy data
        const enemyData = window.EnemyDefinitions[spawn.enemyType];
        if (!enemyData) {
            console.warn(`Enemy type not found: ${spawn.enemyType}`);
            return null;
        }
        
        // Create enemy using EntityFactory
        const enemy = this.worldManager.entityFactory.createEnemy(
            spawn.enemyType,
            position,
            {
                level: spawn.level || enemyData.level,
                respawnTime: spawn.respawnTime || 60
            }
        );
        
        return enemy;
    }
    
    applySpawnConfig(enemy, spawn) {
        const config = spawn.spawnConfig;
        
        switch (config.spawnType) {
            case 'patrol':
                this.setupPatrolBehavior(enemy, spawn);
                break;
                
            case 'ambush':
                this.setupAmbushBehavior(enemy, spawn);
                break;
                
            case 'elite':
                this.setupEliteBehavior(enemy, spawn);
                break;
                
            case 'rare':
                this.setupRareBehavior(enemy, spawn);
                break;
                
            case 'pack':
                this.setupPackBehavior(enemy, spawn);
                break;
        }
    }
    
    setupPatrolBehavior(enemy, spawn) {
        const config = spawn.spawnConfig;
        
        // Generate patrol points if not provided
        if (!config.patrolPoints || config.patrolPoints.length === 0) {
            const basePos = enemy.position.clone();
            const points = [];
            
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                const radius = config.patrolRadius || 30;
                const point = new THREE.Vector3(
                    basePos.x + Math.cos(angle) * radius,
                    basePos.y,
                    basePos.z + Math.sin(angle) * radius
                );
                points.push(point);
            }
            
            enemy.patrolPath = points;
        } else {
            enemy.patrolPath = config.patrolPoints.map(p => 
                new THREE.Vector3(p.x, p.y, p.z)
            );
        }
        
        // Set patrol speed
        if (config.patrolSpeed) {
            enemy.moveSpeed *= config.patrolSpeed;
        }
        
        // Start patrolling
        if (enemy.ai) {
            enemy.ai.setState('patrol');
        }
    }
    
    setupAmbushBehavior(enemy, spawn) {
        const config = spawn.spawnConfig;
        
        // Make enemy hidden initially
        if (enemy.mesh) {
            enemy.mesh.visible = false;
        }
        
        // Enhanced AI for ambush
        if (enemy.ai) {
            enemy.ai.ambushConfig = {
                triggerRadius: config.triggerRadius || 15,
                originalPosition: enemy.position.clone(),
                isHidden: true,
                ambushDelay: config.ambushDelay || 1
            };
            
            // Override AI update for ambush behavior
            const originalUpdate = enemy.ai.update.bind(enemy.ai);
            enemy.ai.update = function(deltaTime) {
                if (this.ambushConfig.isHidden) {
                    const playerDistance = this.enemy.distanceTo(this.enemy.game.player);
                    
                    if (playerDistance <= this.ambushConfig.triggerRadius) {
                        // Trigger ambush
                        setTimeout(() => {
                            this.enemy.mesh.visible = true;
                            this.ambushConfig.isHidden = false;
                            this.enterCombat(this.enemy.game.player);
                            
                            // Ambush shout
                            this.enemy.game.ui.showCombatText(
                                'Ambush!', 
                                'special', 
                                this.enemy.position
                            );
                        }, this.ambushConfig.ambushDelay * 1000);
                    }
                } else {
                    originalUpdate(deltaTime);
                }
            }.bind(enemy.ai);
        }
    }
    
    setupEliteBehavior(enemy, spawn) {
        const config = spawn.spawnConfig;
        
        // Buff elite stats
        enemy.maxHealth *= 3;
        enemy.health = enemy.maxHealth;
        enemy.attackPower *= 2;
        enemy.armor *= 2;
        
        // Add elite marker
        enemy.name = `Elite ${enemy.name}`;
        if (enemy.nameplate) {
            enemy.createNameplate(enemy.name);
        }
        
        // Spawn escorts
        if (config.escorts > 0) {
            const escortPositions = this.generateSpawnPositions(
                { ...spawn, spawnConfig: { formation: 'circle', radius: config.escortRadius } },
                config.escorts
            );
            
            escortPositions.forEach(pos => {
                const escort = this.createEnemy(
                    { ...spawn, enemyType: config.escortType || 'wolf' },
                    pos
                );
                
                if (escort && escort.ai) {
                    // Make escorts follow the elite
                    escort.ai.followTarget = enemy;
                }
            });
        }
    }
    
    setupRareBehavior(enemy, spawn) {
        const config = spawn.spawnConfig;
        
        // Rare spawn chance
        if (Math.random() > config.spawnChance) {
            // Don't spawn this time
            this.game.entities.delete(enemy.id);
            if (enemy.mesh && enemy.mesh.parent) {
                enemy.mesh.parent.remove(enemy.mesh);
            }
            enemy.dispose();
            return;
        }
        
        // Buff rare stats
        enemy.maxHealth *= 5;
        enemy.health = enemy.maxHealth;
        enemy.attackPower *= 3;
        enemy.armor *= 3;
        
        // Special name and color
        enemy.name = `Rare ${enemy.name}`;
        if (enemy.mesh && enemy.mesh.material) {
            enemy.mesh.material.color.setHex(0x9932CC); // Purple for rare
        }
        
        // Announce rare spawn
        if (config.announcementRadius) {
            const playerDistance = enemy.distanceTo(this.game.player);
            if (playerDistance <= config.announcementRadius) {
                this.game.ui.showNotification(
                    `A rare enemy has appeared: ${enemy.name}!`,
                    'rare_spawn'
                );
            }
        }
        
        // Enhanced loot
        if (config.bonusLoot && enemy.dropTable) {
            enemy.dropTable.forEach(drop => {
                drop.chance *= 2; // Double drop chances
            });
            
            // Add guaranteed rare drop
            enemy.dropTable.push({
                chance: 1.0,
                item: {
                    name: 'Rare Trophy',
                    type: 'rare_material',
                    quality: 'rare',
                    stackable: true
                }
            });
        }
    }
    
    setupPackBehavior(enemy, spawn) {
        const packLeader = spawn.currentEnemies[0];
        
        if (packLeader && packLeader !== enemy.id) {
            // Make pack members assist the leader
            if (enemy.ai) {
                enemy.ai.packLeader = packLeader;
                
                // Override combat behavior for pack coordination
                const originalEnterCombat = enemy.ai.enterCombat.bind(enemy.ai);
                enemy.ai.enterCombat = function(target) {
                    originalEnterCombat(target);
                    
                    // Alert pack members
                    const pack = spawn.currentEnemies
                        .map(id => this.enemy.game.entities.get(id))
                        .filter(e => e && e.alive && e !== this.enemy);
                    
                    pack.forEach(member => {
                        if (member.ai && member.ai.state === 'idle') {
                            member.ai.enterCombat(target);
                        }
                    });
                }.bind(enemy.ai);
            }
        }
    }
    
    createSpawnEffect(position) {
        // Create visual effect for spawning
        if (!this.game.scene) return;
        
        const geometry = new THREE.RingGeometry(0.5, 2, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const effect = new THREE.Mesh(geometry, material);
        effect.position.copy(position);
        effect.position.y += 0.1;
        effect.rotation.x = -Math.PI / 2;
        
        this.game.scene.add(effect);
        
        // Animate and remove
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed < 1) {
                effect.scale.setScalar(1 + elapsed * 2);
                effect.material.opacity = 0.5 * (1 - elapsed);
                requestAnimationFrame(animate);
            } else {
                this.game.scene.remove(effect);
                effect.geometry.dispose();
                effect.material.dispose();
            }
        };
        
        animate();
    }
    
    cleanupDistantEnemies() {
        const despawnDistance = this.settings.despawnDistance;
        
        for (const [spawnId, spawn] of this.activeSpawns) {
            const playerDistance = this.game.player.position.distanceTo(
                new THREE.Vector3(spawn.position.x, spawn.position.y, spawn.position.z)
            );
            
            if (playerDistance > despawnDistance) {
                // Despawn enemies
                spawn.currentEnemies.forEach(enemyId => {
                    const enemy = this.game.entities.get(enemyId);
                    if (enemy) {
                        this.despawnEnemy(enemy);
                    }
                });
                
                spawn.currentEnemies = [];
                spawn.active = false;
                this.activeSpawns.delete(spawnId);
            }
        }
    }
    
    despawnEnemy(enemy) {
        // Remove from game
        this.game.entities.delete(enemy.id);
        
        // Remove from scene
        if (enemy.mesh && enemy.mesh.parent) {
            enemy.mesh.parent.remove(enemy.mesh);
        }
        
        // Cleanup
        enemy.dispose();
        
        // Trigger event
        if (this.onEnemyDespawned) {
            this.onEnemyDespawned(enemy);
        }
    }
    
    getActiveEnemyCount(areaId) {
        const spawns = this.spawnPools.get(areaId);
        if (!spawns) return 0;
        
        let count = 0;
        spawns.forEach(spawn => {
            count += spawn.currentEnemies.filter(id => 
                this.game.entities.has(id) && 
                this.game.entities.get(id).alive
            ).length;
        });
        
        return count;
    }
    
    // Debug visualization
    visualizeSpawns(areaId) {
        const spawns = this.spawnPools.get(areaId);
        if (!spawns || !this.game.scene) return;
        
        spawns.forEach(spawn => {
            const geometry = new THREE.SphereGeometry(1, 8, 6);
            const material = new THREE.MeshBasicMaterial({
                color: spawn.active ? 0x00ff00 : 0xff0000,
                transparent: true,
                opacity: 0.3
            });
            
            const marker = new THREE.Mesh(geometry, material);
            marker.position.set(
                spawn.position.x,
                spawn.position.y + 1,
                spawn.position.z
            );
            
            this.game.scene.add(marker);
        });
    }
    
    dispose() {
        // Clean up all spawns
        for (const [spawnId, spawn] of this.activeSpawns) {
            spawn.currentEnemies.forEach(enemyId => {
                const enemy = this.game.entities.get(enemyId);
                if (enemy) {
                    this.despawnEnemy(enemy);
                }
            });
        }
        
        this.spawnPools.clear();
        this.activeSpawns.clear();
        this.spawnConfigs.clear();
        this.spawnTimers.clear();
    }
}

// Make available globally
window.EnemySpawnManager = EnemySpawnManager;
