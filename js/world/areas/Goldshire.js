// Goldshire.js - Goldshire town area definition
class Goldshire extends BaseArea {
    constructor() {
        super({
            id: 'goldshire',
            name: 'Goldshire',
            description: 'A peaceful town in the heart of Elwynn Forest',
            position: { x: 50, z: 50 },
            radius: 40,
            levelRange: { min: 1, max: 5 },
            faction: 'alliance',
            type: 'town',
            subType: 'safe_zone',
            pvpEnabled: false,
            biome: 'temperate_forest',
            weather: 'clear',
            music: 'goldshire_theme',
            ambientSounds: ['birds', 'wind_light', 'town_chatter']
        });
    }
    
    initializeContent() {
        console.log('Initializing Goldshire content...');
    }
    
    generateEnemySpawns() {
        // No enemies in safe town area
        console.log('Goldshire is a safe zone - no enemy spawns');
    }
    
    generateNPCSpawns() {
        // Lion's Pride Inn NPCs
        this.addNPCSpawn('innkeeper_farley', 
            { x: 48, y: 1, z: 52 }, 
            { 
                vendor: true, 
                innkeeper: true,
                inventory: [
                    { name: 'Fresh Bread', type: 'consumable', price: 25 },
                    { name: 'Dalaran Sharp', type: 'consumable', price: 40 },
                    { name: 'Sweet Roll', type: 'consumable', price: 50 }
                ]
            }
        );
        
        this.addNPCSpawn('barkeep_dobbins', 
            { x: 46, y: 1, z: 54 }, 
            { 
                vendor: true,
                inventory: [
                    { name: 'Refreshing Spring Water', type: 'consumable', price: 15 },
                    { name: 'Stormwind Brie', type: 'consumable', price: 35 }
                ]
            }
        );
        
        // Marshal Dughan - quest giver
        this.addNPCSpawn('marshal_dughan', 
            { x: 50, y: 1, z: 50 }, 
            { 
                questGiver: true, 
                questIds: ['protect_goldshire', 'kobold_menace', 'wolves_elwynn']
            }
        );
        
        // Blacksmith
        this.addNPCSpawn('smith_argus', 
            { x: 55, y: 1, z: 55 }, 
            { 
                vendor: true,
                trainer: true,
                profession: 'blacksmithing',
                inventory: [
                    { name: 'Apprentice Blacksmith Hammer', type: 'tool', price: 100 },
                    { name: 'Rough Grinding Stone', type: 'consumable', price: 50 },
                    { name: 'Copper Rod', type: 'material', price: 75 }
                ]
            }
        );
        
        // General Goods Vendor
        this.addNPCSpawn('corina_steele', 
            { x: 45, y: 1, z: 48 }, 
            { 
                vendor: true,
                inventory: [
                    { name: 'Simple Wood', type: 'material', price: 10 },
                    { name: 'Coarse Thread', type: 'material', price: 20 },
                    { name: 'Small Pouch', type: 'bag', price: 150, slots: 6 }
                ]
            }
        );
        
        // Guards
        this.addNPCSpawn('stormwind_guard', 
            { x: 40, y: 1, z: 45 }, 
            { guard: true, patrol: false }
        );
        
        this.addNPCSpawn('stormwind_guard', 
            { x: 60, y: 1, z: 55 }, 
            { guard: true, patrol: false }
        );
        
        // Stable Master
        this.addNPCSpawn('garrick_padfoot', 
            { x: 35, y: 1, z: 55 }, 
            { 
                stableMaster: true,
                flightMaster: true
            }
        );
        
        // Random townsfolk
        this.addNPCSpawn('townsperson', 
            { x: 52, y: 1, z: 48 }, 
            { name: 'William Pestle', dialogue: ['Beautiful day, isn\'t it?', 'Stay safe out there!'] }
        );
        
        this.addNPCSpawn('townsperson', 
            { x: 47, y: 1, z: 57 }, 
            { name: 'Maybell Maclure', dialogue: ['Hello there!', 'Welcome to Goldshire!'] }
        );
    }
    
    generateResourceSpawns() {
        // Limited resources in town - mostly decorative
        const resourceCount = 5;
        
        for (let i = 0; i < resourceCount; i++) {
            const position = this.getValidSpawnPosition();
            this.addResourceSpawn('herb_garden', position, {
                respawnTime: 1800, // 30 minutes
                skillRequired: 1,
                yield: 'silverleaf'
            });
        }
    }
    
    generateStructureSpawns() {
        // Lion's Pride Inn
        this.addStructureSpawn('inn', 
            { x: 48, y: 0, z: 52 }, 
            { 
                name: "Lion's Pride Inn",
                hasRooms: true,
                hasStables: true,
                innkeeper: 'innkeeper_farley'
            }
        );
        
        // Blacksmith Shop
        this.addStructureSpawn('blacksmith', 
            { x: 55, y: 0, z: 55 }, 
            { 
                name: "The Forge",
                owner: 'smith_argus',
                services: ['repair', 'craft', 'train']
            }
        );
        
        // General Store
        this.addStructureSpawn('shop', 
            { x: 45, y: 0, z: 48 }, 
            { 
                name: "Corina's General Goods",
                owner: 'corina_steele'
            }
        );
        
        // Guard House
        this.addStructureSpawn('guard_house', 
            { x: 50, y: 0, z: 50 }, 
            { 
                name: "Goldshire Guard Post",
                commander: 'marshal_dughan'
            }
        );
        
        // Stable
        this.addStructureSpawn('stable', 
            { x: 35, y: 0, z: 55 }, 
            { 
                name: "Goldshire Stable",
                stableMaster: 'garrick_padfoot'
            }
        );
        
        // Well (center of town)
        this.addStructureSpawn('well', 
            { x: 50, y: 0, z: 52 }, 
            { name: "Town Well" }
        );
        
        // Notice Board
        this.addStructureSpawn('notice_board', 
            { x: 52, y: 0, z: 50 }, 
            { name: "Goldshire Notice Board" }
        );
    }
    
    getAreaEnemyTypes() {
        return []; // Safe zone
    }
    
    getAreaResourceTypes() {
        return [
            'herb_garden',
            'well_water'
        ];
    }
    
    onEnter(player) {
        console.log(`${player.name} entered Goldshire`);
        
        // Show welcome message
        if (player.level <= 10) {
            player.game.ui.showNotification(
                'Welcome to Goldshire! A safe haven for adventurers.',
                'zone_enter'
            );
        }
        
        // Set peaceful music
        if (player.game.audio) {
            player.game.audio.playMusic('goldshire_peaceful');
        }
        
        // Mark as discovered
        if (!player.discoveredAreas.has(this.id)) {
            player.discoveredAreas.add(this.id);
            player.game.ui.showNotification('Area Discovered: Goldshire');
        }
        
        // Heal player if very low health (safe zone effect)
        if (player.health < player.maxHealth * 0.2) {
            player.heal(player.maxHealth * 0.1);
            player.game.ui.showNotification('You feel refreshed in this peaceful town.');
        }
    }
    
    onExit(player) {
        console.log(`${player.name} left Goldshire`);
        
        // Farewell message for new players
        if (player.level <= 5) {
            player.game.ui.showNotification(
                'Be careful out there! Return to Goldshire if you need safety.',
                'zone_exit'
            );
        }
    }
    
    update(deltaTime) {
        // Town-specific updates
        // Could include market activity, guard patrols, day/night cycles
        
        // Simple day/night NPC behavior
        const timeOfDay = this.worldManager?.game.gameState.timeOfDay || 12;
        
        if (timeOfDay >= 22 || timeOfDay <= 6) {
            // Night time - some NPCs might go inside/sleep
            // For now, just a placeholder
        }
    }
    
    // Town-specific methods
    canPlayerRest(player) {
        // Players can always rest in safe zones
        return true;
    }
    
    getInnRoomCost() {
        return 50; // 50 copper for a room
    }
    
    hasService(serviceType) {
        const services = [
            'inn', 'blacksmith', 'vendor', 'stable', 
            'flight_master', 'guards', 'repair'
        ];
        return services.includes(serviceType);
    }
}

// Make available globally
window.Goldshire = Goldshire;
