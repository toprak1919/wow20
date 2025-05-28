// Westfall.js - Westfall area definition
class Westfall extends BaseArea {
    constructor() {
        super({
            id: 'westfall',
            name: 'Westfall',
            description: 'A farming region plagued by bandits and hostile creatures',
            position: { x: -200, z: 100 },
            radius: 180,
            levelRange: { min: 10, max: 20 },
            faction: 'alliance',
            biome: 'farmland',
            weather: 'clear',
            music: 'westfall_theme',
            ambientSounds: ['wind_moderate', 'distant_crows', 'farm_animals']
        });
    }
    
    initializeContent() {
        console.log('Initializing Westfall content...');
    }
    
    generateEnemySpawns() {
        const enemyTypes = this.getAreaEnemyTypes();
        const enemyCount = 25;
        
        for (let i = 0; i < enemyCount; i++) {
            const position = this.getValidSpawnPosition();
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const level = this.getRandomLevel();
            
            this.addEnemySpawn(enemyType, position, level);
        }
    }
    
    generateNPCSpawns() {
        // Sentinel Hill NPCs
        this.addNPCSpawn('gryan_stoutmantle', 
            { x: -180, y: 15, z: 120 }, 
            { questGiver: true, questId: 'westfall_cleanup' }
        );
        
        this.addNPCSpawn('farmer_furlbrow', 
            { x: -220, y: 8, z: 80 }, 
            { questGiver: true, questId: 'missing_wife' }
        );
        
        this.addNPCSpawn('verna_furlbrow', 
            { x: -215, y: 8, z: 85 }, 
            { vendor: true, type: 'food_vendor' }
        );
        
        // Patrol guards
        for (let i = 0; i < 4; i++) {
            const position = this.getValidSpawnPosition();
            this.addNPCSpawn('westfall_militia', position, { 
                patrol: true,
                patrolRadius: 60
            });
        }
    }
    
    generateResourceSpawns() {
        const resourceTypes = this.getAreaResourceTypes();
        const resourceCount = 30;
        
        for (let i = 0; i < resourceCount; i++) {
            const position = this.getValidSpawnPosition();
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            
            this.addResourceSpawn(resourceType, position, {
                respawnTime: 600, // 10 minutes
                skillRequired: Math.floor(Math.random() * 75) + 25
            });
        }
    }
    
    generateStructureSpawns() {
        // Sentinel Hill
        this.addStructureSpawn('watchtower', 
            { x: -180, y: 15, z: 120 }, 
            { name: "Sentinel Hill" }
        );
        
        // Furlbrow's Pumpkin Farm
        this.addStructureSpawn('farm', 
            { x: -220, y: 8, z: 80 }, 
            { name: "Furlbrow's Pumpkin Farm" }
        );
        
        // Saldean's Farm
        this.addStructureSpawn('farm', 
            { x: -160, y: 5, z: 60 }, 
            { name: "Saldean's Farm" }
        );
        
        // Jangolode Mine
        this.addStructureSpawn('mine_entrance', 
            { x: -240, y: 12, z: 140 }, 
            { name: "Jangolode Mine" }
        );
        
        // The Deadmines entrance
        this.addStructureSpawn('dungeon_entrance', 
            { x: -280, y: 10, z: 180 }, 
            { name: "The Deadmines", instanceId: 'deadmines', level: 18 }
        );
        
        // Scattered farmhouses
        for (let i = 0; i < 6; i++) {
            const position = this.getValidSpawnPosition();
            this.addStructureSpawn('farmhouse', position, { 
                name: `Abandoned Farmhouse ${i + 1}`,
                abandoned: true
            });
        }
    }
    
    getAreaEnemyTypes() {
        return [
            'gnoll',
            'harvest_golem',
            'defias_thug',
            'murloc',
            'raptor'
        ];
    }
    
    getAreaResourceTypes() {
        return [
            'tin_vein',
            'mageroyal',
            'briarthorn',
            'stranglekelp',
            'apple_tree',
            'pumpkin_patch'
        ];
    }
    
    onEnter(player) {
        console.log(`${player.name} entered Westfall`);
        
        // Show area message
        player.game.ui.showNotification(
            'Westfall: The breadbasket of Stormwind, now overrun with danger.',
            'zone_enter'
        );
        
        // Change music
        if (player.game.audio) {
            player.game.audio.playMusic('westfall_theme');
        }
        
        // Chance for random weather
        if (Math.random() < 0.3) {
            player.game.world.setWeather('fog', 0.5);
        }
    }
    
    onExit(player) {
        console.log(`${player.name} left Westfall`);
    }
    
    update(deltaTime) {
        // Westfall-specific updates
        // Could include Defias activity, harvest golem patrols, etc.
    }
}

// Make available globally
window.Westfall = Westfall;
