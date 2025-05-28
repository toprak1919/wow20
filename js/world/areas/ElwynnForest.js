// ElwynnForest.js - Elwynn Forest area definition
class ElwynnForest extends BaseArea {
    constructor() {
        super({
            id: 'elwynn_forest',
            name: 'Elwynn Forest',
            description: 'A peaceful forest perfect for new adventurers',
            position: { x: 0, z: 0 },
            radius: 200,
            levelRange: { min: 1, max: 10 },
            faction: 'alliance',
            biome: 'temperate_forest',
            weather: 'clear',
            music: 'elwynn_theme',
            ambientSounds: ['birds', 'wind_light', 'leaves_rustling']
        });
    }
    
    initializeContent() {
        // This area contains Goldshire and surrounding forests
        console.log('Initializing Elwynn Forest content...');
    }
    
    generateEnemySpawns() {
        // Wolf pack near the forest edge
        this.addEnemySpawn('wolf', 
            { x: -30, y: 1, z: -40 }, 
            { 
                level: 2,
                spawnType: 'pack_spawn',
                maxCount: 4,
                respawnTime: 120
            }
        );
        
        // Kobold ambush point
        this.addEnemySpawn('kobold',
            { x: 15, y: 1, z: -60 },
            {
                level: 1,
                spawnType: 'ambush_spawn',
                maxCount: 3,
                respawnTime: 90
            }
        );
        
        // Defias patrol route
        const patrolPath = [
            { x: 70, y: 1, z: 20 },
            { x: 80, y: 1, z: 40 },
            { x: 60, y: 1, z: 60 },
            { x: 40, y: 1, z: 40 }
        ];
        
        this.addEnemySpawn('defias_thug',
            { x: 70, y: 1, z: 20 },
            {
                level: 3,
                spawnType: 'patrol_spawn',
                maxCount: 2,
                respawnTime: 180,
                patrolPoints: patrolPath
            }
        );
        
        // Rare spawn - Elite Bear
        this.addEnemySpawn('bear',
            { x: -50, y: 1, z: 70 },
            {
                level: 5,
                spawnType: 'rare_spawn',
                maxCount: 1,
                respawnTime: 600,
                eliteModifier: true
            }
        );
        
        // Spider nest
        this.addEnemySpawn('spider',
            { x: 30, y: 1, z: -30 },
            {
                level: 1,
                spawnType: 'pack_spawn',
                maxCount: 6,
                respawnTime: 60,
                formation: 'random'
            }
        );
        
        // Bandit camp guards
        this.addEnemySpawn('bandit',
            { x: 90, y: 1, z: 80 },
            {
                level: 2,
                spawnType: 'guard',
                maxCount: 3,
                respawnTime: 120,
                guardRadius: 15
            }
        );
        
        // Random forest creatures
        const randomSpawnCount = 10;
        const randomEnemyTypes = ['wolf', 'spider', 'kobold', 'bear'];
        
        for (let i = 0; i < randomSpawnCount; i++) {
            const position = this.getValidSpawnPosition();
            const enemyType = randomEnemyTypes[Math.floor(Math.random() * randomEnemyTypes.length)];
            const level = this.getRandomLevel();
            
            this.addEnemySpawn(enemyType, position, {
                level: level,
                maxCount: 1,
                respawnTime: 90 + Math.random() * 60
            });
        }
    }
    
    addEnemySpawn(enemyType, position, config = {}) {
        // Enhanced spawn configuration
        const spawn = {
            type: 'enemy',
            enemyType: enemyType,
            position: position,
            level: config.level || this.getRandomLevel(),
            respawnTime: config.respawnTime || 60,
            maxCount: config.maxCount || 1,
            spawnType: config.spawnType || 'normal',
            ...config
        };
        
        this.enemySpawns.push(spawn);
    }
    
    generateNPCSpawns() {
        // Goldshire NPCs
        this.addNPCSpawn('marshal_dughan', 
            { x: 50, y: 1, z: 50 }, 
            { questGiver: true, questId: 'protect_goldshire' }
        );
        
        this.addNPCSpawn('innkeeper_farley', 
            { x: 48, y: 1, z: 52 }, 
            { vendor: true, innkeeper: true }
        );
        
        this.addNPCSpawn('guard_thomas', 
            { x: 45, y: 1, z: 48 }, 
            { guard: true }
        );
        
        // Patrol guards
        for (let i = 0; i < 3; i++) {
            const position = this.getValidSpawnPosition();
            this.addNPCSpawn('stormwind_guard', position, { 
                patrol: true,
                patrolRadius: 50
            });
        }
    }
    
    generateResourceSpawns() {
        const resourceTypes = this.getAreaResourceTypes();
        const resourceCount = 20;
        
        for (let i = 0; i < resourceCount; i++) {
            const position = this.getValidSpawnPosition();
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            
            this.addResourceSpawn(resourceType, position, {
                respawnTime: 300, // 5 minutes
                skillRequired: Math.floor(Math.random() * 50) + 1
            });
        }
    }
    
    generateStructureSpawns() {
        // Goldshire buildings
        this.addStructureSpawn('inn', 
            { x: 48, y: 0, z: 52 }, 
            { name: "Lion's Pride Inn" }
        );
        
        this.addStructureSpawn('blacksmith', 
            { x: 55, y: 0, z: 55 }, 
            { name: "Smith Argus's Shop" }
        );
        
        this.addStructureSpawn('house', 
            { x: 40, y: 0, z: 45 }, 
            { name: "Maclure Vineyards" }
        );
        
        this.addStructureSpawn('house', 
            { x: 60, y: 0, z: 40 }, 
            { name: "Stonefield Farm" }
        );
        
        // Watch towers
        this.addStructureSpawn('watchtower', 
            { x: 20, y: 0, z: 80 }, 
            { name: "East Watchtower" }
        );
        
        this.addStructureSpawn('watchtower', 
            { x: -20, y: 0, z: 20 }, 
            { name: "West Watchtower" }
        );
    }
    
    getAreaEnemyTypes() {
        return [
            'wolf',
            'kobold',
            'defias_thug',
            'bear',
            'spider',
            'bandit'
        ];
    }
    
    getAreaResourceTypes() {
        return [
            'copper_vein',
            'peacebloom',
            'silverleaf',
            'earthroot',
            'oak_tree',
            'berry_bush'
        ];
    }
    
    onEnter(player) {
        console.log(`${player.name} entered Elwynn Forest`);
        
        // Show welcome message for new players
        if (player.level <= 5) {
            player.game.ui.showNotification(
                'Welcome to Elwynn Forest! A safe haven for new adventurers.',
                'zone_enter'
            );
        }
        
        // Set appropriate music
        if (player.game.audio) {
            player.game.audio.playMusic('elwynn_forest_theme');
        }
    }
    
    onExit(player) {
        console.log(`${player.name} left Elwynn Forest`);
    }
    
    update(deltaTime) {
        // Area-specific updates
        // Could include time-based events, weather changes, etc.
    }
}

// Make available globally
window.ElwynnForest = ElwynnForest;
