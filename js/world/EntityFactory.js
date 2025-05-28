// EntityFactory.js - Factory for creating different types of entities
class EntityFactory {
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.game = worldManager.game;
        
        // Initialize systems
        this.behaviorSystem = null;
        this.interactionSystem = null;
    }
    
    init() {
        // Initialize behavior system
        this.behaviorSystem = new EnemyBehaviorSystem();
        
        // Initialize interaction system if game has one
        if (this.game.enemyInteractionSystem) {
            this.interactionSystem = this.game.enemyInteractionSystem;
        }
        
        console.log('EntityFactory initialized with enhanced systems');
    }
    
    async createEntity(type, spawnData) {
        switch (type) {
            case 'enemy':
                return await this.createEnemy(spawnData);
            case 'npc':
                return await this.createNPC(spawnData);
            case 'resource':
                return await this.createResource(spawnData);
            case 'structure':
                return await this.createStructure(spawnData);
            default:
                console.warn(`Unknown entity type: ${type}`);
                return null;
        }
    }
    
    createEnemy(enemyType, position, config = {}) {
        // Handle both old and new call signatures
        let level = config.level;
        
        // If config is actually a number, it's the old level parameter
        if (typeof config === 'number') {
            level = config;
            config = { level: level };
        }
        
        // Get enemy definition from global EnemyDefinitions
        const enemyDef = window.EnemyDefinitions && window.EnemyDefinitions[enemyType];
        
        if (!enemyDef) {
            console.warn(`Enemy type not found: ${enemyType}`);
            return null;
        }
        
        // Create enemy data
        const enemyData = {
            ...enemyDef,
            ...config,
            enemyType: enemyType,
            level: level || enemyDef.level || 1,
            respawnTime: config.respawnTime || 60
        };
        
        // Scale stats by level
        if (level && level !== enemyDef.level) {
            const levelDiff = level - (enemyDef.level || 1);
            enemyData.health = Math.floor(enemyDef.baseHealth * (1 + levelDiff * 0.2));
            enemyData.maxHealth = enemyData.health;
            enemyData.attackPower = Math.floor(enemyDef.baseAttackPower * (1 + levelDiff * 0.15));
            enemyData.armor = Math.floor(enemyDef.baseArmor * (1 + levelDiff * 0.1));
        }
        
        // Create enemy using the Enemy class from entity.js
        const enemy = new window.Enemy(
            `enemy_${Date.now()}_${Math.random()}`,
            position,
            enemyData
        );
        
        // Set game reference
        enemy.game = this.game;
        
        // Create enhanced AI if behavior system is available
        if (this.behaviorSystem && config.aiConfig) {
            // Replace basic AI with enhanced AI
            enemy.ai = this.behaviorSystem.createEnhancedAI(enemy, {
                primaryBehavior: config.aiConfig.primaryBehavior || 'idle',
                combatBehavior: config.aiConfig.combatBehavior || enemyDef.aiType || 'attack',
                ...config.aiConfig
            });
        } else if (this.behaviorSystem && enemyDef.aiType) {
            // Use AI type from definition
            const aiConfig = this.getAIConfigForType(enemyDef.aiType);
            enemy.ai = this.behaviorSystem.createEnhancedAI(enemy, aiConfig);
        }
        
        // Add abilities from definition
        if (enemyDef.abilities) {
            enemy.abilities = enemyDef.abilities;
        }
        
        return enemy;
    }
    
    getAIConfigForType(aiType) {
        const aiConfigs = {
            'aggressive': {
                primaryBehavior: 'patrol',
                combatBehavior: 'attack',
                aggroRange: 15,
                fleeHealthPercent: 0.1
            },
            'territorial': {
                primaryBehavior: 'guard',
                combatBehavior: 'attack',
                aggroRange: 10,
                fleeHealthPercent: 0.2
            },
            'ambush': {
                primaryBehavior: 'ambush',
                combatBehavior: 'attack',
                aggroRange: 20
            },
            'cowardly': {
                primaryBehavior: 'idle',
                combatBehavior: 'attack',
                fleeHealthPercent: 0.5,
                aggroRange: 8
            },
            'pack_hunter': {
                primaryBehavior: 'patrol',
                combatBehavior: 'pack_hunt',
                aggroRange: 12
            },
            'guardian': {
                primaryBehavior: 'guard',
                combatBehavior: 'defensive',
                aggroRange: 15,
                leashRange: 20
            },
            'feral': {
                primaryBehavior: 'patrol',
                combatBehavior: 'berserk',
                aggroRange: 20,
                fleeHealthPercent: 0
            },
            'skittish': {
                primaryBehavior: 'idle',
                combatBehavior: 'flee',
                fleeHealthPercent: 0.8,
                aggroRange: 15
            },
            'stalker': {
                primaryBehavior: 'ambush',
                combatBehavior: 'attack',
                aggroRange: 25
            },
            'tribal': {
                primaryBehavior: 'patrol',
                combatBehavior: 'coordinate_attack',
                aggroRange: 15
            },
            'relentless': {
                primaryBehavior: 'patrol',
                combatBehavior: 'attack',
                fleeHealthPercent: 0,
                leashRange: 50
            }
        };
        
        return aiConfigs[aiType] || aiConfigs['aggressive'];
    }
    
    createNPC(npcType, position, options = {}) {
        // Create basic NPC object
        const npc = {
            id: `npc_${Date.now()}_${Math.random()}`,
            type: 'npc',
            npcType: npcType,
            position: position,
            mesh: this.createNPCMesh(npcType),
            options: options,
            update: function(deltaTime) {
                // Basic NPC behavior can be added here
            }
        };
        
        return npc;
    }
    
    createResource(resourceType, position, options = {}) {
        // Create basic resource object
        const resource = {
            id: `resource_${Date.now()}_${Math.random()}`,
            type: 'resource',
            resourceType: resourceType,
            position: position,
            mesh: this.createResourceMesh(resourceType),
            options: options,
            update: function(deltaTime) {
                // Resource behavior (respawning, etc.)
            }
        };
        
        return resource;
    }
    
    createStructure(structureType, position, options = {}) {
        // Create basic structure object
        const structure = {
            id: `structure_${Date.now()}_${Math.random()}`,
            type: 'structure',
            structureType: structureType,
            position: position,
            mesh: this.createStructureMesh(structureType),
            options: options,
            update: function(deltaTime) {
                // Structure behavior if needed
            }
        };
        
        return structure;
    }
    
    createEnemyMesh(enemyData) {
        // Create a basic colored cube for the enemy
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
        const mesh = new THREE.Mesh(geometry, material);
        
        return mesh;
    }
    
    createNPCMesh(npcType) {
        // Create a basic colored cube for the NPC
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x44ff44 });
        const mesh = new THREE.Mesh(geometry, material);
        
        return mesh;
    }
    
    createResourceMesh(resourceType) {
        // Create a basic colored sphere for resources
        const geometry = new THREE.SphereGeometry(0.5, 8, 6);
        const material = new THREE.MeshLambertMaterial({ color: 0x4444ff });
        const mesh = new THREE.Mesh(geometry, material);
        
        return mesh;
    }
    
    createStructureMesh(structureType) {
        // Create a basic colored box for structures
        const geometry = new THREE.BoxGeometry(2, 3, 2);
        const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const mesh = new THREE.Mesh(geometry, material);
        
        return mesh;
    }
    
    dispose() {
        console.log('EntityFactory disposed');
    }
}
