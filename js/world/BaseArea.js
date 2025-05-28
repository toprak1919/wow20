// BaseArea.js - Base class for all game areas
class BaseArea {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description || '';
        
        // Area bounds
        this.position = config.position || { x: 0, z: 0 };
        this.radius = config.radius || 100;
        this.bounds = config.bounds || null; // For non-circular areas
        
        // Area properties
        this.type = config.type || 'zone';
        this.subType = config.subType || 'neutral';
        this.levelRange = config.levelRange || { min: 1, max: 10 };
        this.faction = config.faction || 'neutral';
        this.pvpEnabled = config.pvpEnabled || false;
        
        // Environment
        this.biome = config.biome || 'temperate';
        this.weather = config.weather || 'clear';
        this.ambientSounds = config.ambientSounds || [];
        this.music = config.music || null;
        
        // Terrain modifications
        this.terrainMods = config.terrainMods || [];
        
        // Content arrays
        this.enemySpawns = [];
        this.npcSpawns = [];
        this.resourceSpawns = [];
        this.structureSpawns = [];
        this.questSpawns = [];
        
        // State
        this.loaded = false;
        this.worldManager = null;
        
        // Events
        this.onEnter = config.onEnter || null;
        this.onExit = config.onExit || null;
        this.onLoad = config.onLoad || null;
        this.onUnload = config.onUnload || null;
        
        // Initialize area-specific content
        this.initializeContent();
    }
    
    // Override this in subclasses to define area content
    initializeContent() {
        // To be implemented by subclasses
    }
    
    async load() {
        if (this.loaded) return;
        
        console.log(`Loading area: ${this.name}`);
        
        try {
            // Apply terrain modifications first
            this.applyTerrainMods();
            
            // Set biome for this area
            this.applyBiome();
            
            // Load area assets if needed
            await this.loadAssets();
            
            // Generate spawns
            this.generateEnemySpawns();
            this.generateNPCSpawns();
            this.generateResourceSpawns();
            this.generateStructureSpawns();
            this.generateQuestSpawns();
            
            // Call custom load logic
            if (this.onLoad) {
                await this.onLoad();
            }
            
            this.loaded = true;
            console.log(`Area loaded: ${this.name}`);
            
        } catch (error) {
            console.error(`Failed to load area ${this.name}:`, error);
            throw error;
        }
    }
    
    applyTerrainMods() {
        if (!this.worldManager || !this.worldManager.terrainManager) return;
        
        // Apply all terrain modifications for this area
        this.terrainMods.forEach(mod => {
            this.worldManager.terrainManager.registerAreaTerrainMod(this.id + '_' + mod.id, {
                position: mod.position || this.position,
                radius: mod.radius || this.radius * 0.8,
                type: mod.type,
                strength: mod.strength || 1.0,
                ...mod
            });
        });
    }
    
    applyBiome() {
        if (!this.worldManager || !this.worldManager.terrainManager) return;
        
        // Set biome for the entire area
        const biomeRadius = this.radius || 100;
        const gridSize = 50; // Biome grid size
        const steps = Math.ceil(biomeRadius * 2 / gridSize);
        
        for (let x = -steps; x <= steps; x++) {
            for (let z = -steps; z <= steps; z++) {
                const worldX = this.position.x + x * gridSize;
                const worldZ = this.position.z + z * gridSize;
                
                const distance = Math.sqrt(worldX * worldX + worldZ * worldZ);
                if (distance <= biomeRadius) {
                    this.worldManager.terrainManager.setBiomeAtPosition(worldX, worldZ, this.biome);
                }
            }
        }
    }
    
    async loadAssets() {
        // Override in subclasses to load specific assets
        return Promise.resolve();
    }
    
    unload() {
        if (!this.loaded) return;
        
        console.log(`Unloading area: ${this.name}`);
        
        // Remove terrain modifications
        this.removeTerrainMods();
        
        // Clear spawns
        this.enemySpawns = [];
        this.npcSpawns = [];
        this.resourceSpawns = [];
        this.structureSpawns = [];
        this.questSpawns = [];
        
        // Call custom unload logic
        if (this.onUnload) {
            this.onUnload();
        }
        
        this.loaded = false;
    }
    
    removeTerrainMods() {
        if (!this.worldManager || !this.worldManager.terrainManager) return;
        
        // Remove all terrain modifications for this area
        this.terrainMods.forEach(mod => {
            this.worldManager.terrainManager.removeAreaTerrainMod(this.id + '_' + mod.id);
        });
    }
    
    // Terrain modification helper methods
    addTerrainMod(modConfig) {
        const mod = {
            id: modConfig.id || `mod_${this.terrainMods.length}`,
            type: modConfig.type || 'flatten',
            position: modConfig.position || this.position,
            radius: modConfig.radius || this.radius * 0.5,
            strength: modConfig.strength || 1.0,
            ...modConfig
        };
        
        this.terrainMods.push(mod);
        
        // Apply immediately if area is loaded
        if (this.loaded && this.worldManager && this.worldManager.terrainManager) {
            this.worldManager.terrainManager.registerAreaTerrainMod(this.id + '_' + mod.id, mod);
        }
        
        return mod;
    }
    
    // Predefined terrain modification helpers
    flattenArea(position, radius, targetHeight = 5, strength = 1.0) {
        return this.addTerrainMod({
            id: `flatten_${position.x}_${position.z}`,
            type: 'flatten',
            position: position,
            radius: radius,
            targetHeight: targetHeight,
            strength: strength
        });
    }
    
    raiseArea(position, radius, amount = 10, strength = 1.0) {
        return this.addTerrainMod({
            id: `raise_${position.x}_${position.z}`,
            type: 'raise',
            position: position,
            radius: radius,
            amount: amount,
            strength: strength
        });
    }
    
    lowerArea(position, radius, amount = 10, strength = 1.0) {
        return this.addTerrainMod({
            id: `lower_${position.x}_${position.z}`,
            type: 'lower',
            position: position,
            radius: radius,
            amount: amount,
            strength: strength
        });
    }
    
    addNoiseToArea(position, radius, amplitude = 5, frequency = 0.1, strength = 1.0) {
        return this.addTerrainMod({
            id: `noise_${position.x}_${position.z}`,
            type: 'noise',
            position: position,
            radius: radius,
            amplitude: amplitude,
            frequency: frequency,
            strength: strength
        });
    }
    
    createPlateau(position, radius, minHeight = 10, plateauHeight = 15, strength = 1.0) {
        return this.addTerrainMod({
            id: `plateau_${position.x}_${position.z}`,
            type: 'plateau',
            position: position,
            radius: radius,
            minHeight: minHeight,
            plateauHeight: plateauHeight,
            strength: strength
        });
    }
    
    update(deltaTime) {
        // Override in subclasses for area-specific updates
    }
    
    containsPosition(position) {
        if (this.bounds) {
            // Use custom bounds
            return position.x >= this.bounds.minX && 
                   position.x <= this.bounds.maxX &&
                   position.z >= this.bounds.minZ && 
                   position.z <= this.bounds.maxZ;
        } else {
            // Use circular radius
            const distance = Math.sqrt(
                Math.pow(position.x - this.position.x, 2) +
                Math.pow(position.z - this.position.z, 2)
            );
            return distance <= this.radius;
        }
    }
    
    intersectsChunk(chunkBounds) {
        if (this.bounds) {
            // Rectangle intersection
            return !(this.bounds.maxX < chunkBounds.minX || 
                    this.bounds.minX > chunkBounds.maxX ||
                    this.bounds.maxZ < chunkBounds.minZ || 
                    this.bounds.minZ > chunkBounds.maxZ);
        } else {
            // Circle-rectangle intersection
            const centerX = this.position.x;
            const centerZ = this.position.z;
            
            const closestX = Math.max(chunkBounds.minX, Math.min(centerX, chunkBounds.maxX));
            const closestZ = Math.max(chunkBounds.minZ, Math.min(centerZ, chunkBounds.maxZ));
            
            const distance = Math.sqrt(
                Math.pow(centerX - closestX, 2) + 
                Math.pow(centerZ - closestZ, 2)
            );
            
            return distance <= this.radius;
        }
    }
    
    // Content generation methods - override in subclasses
    generateEnemySpawns() {
        // Override in subclasses
    }
    
    generateNPCSpawns() {
        // Override in subclasses
    }
    
    generateResourceSpawns() {
        // Override in subclasses
    }
    
    generateStructureSpawns() {
        // Override in subclasses
    }
    
    generateQuestSpawns() {
        // Override in subclasses
    }
    
    // Utility methods
    getRandomPositionInArea() {
        if (this.bounds) {
            return {
                x: this.bounds.minX + Math.random() * (this.bounds.maxX - this.bounds.minX),
                z: this.bounds.minZ + Math.random() * (this.bounds.maxZ - this.bounds.minZ)
            };
        } else {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.radius * 0.8; // 80% of radius to avoid edge spawning
            
            return {
                x: this.position.x + Math.cos(angle) * distance,
                z: this.position.z + Math.sin(angle) * distance
            };
        }
    }
    
    getValidSpawnPosition(avoidWater = true) {
        for (let attempts = 0; attempts < 10; attempts++) {
            const pos = this.getRandomPositionInArea();
            const height = this.worldManager?.getHeightAtPosition(pos.x, pos.z) || 0;
            
            // Check if position is valid
            if (!avoidWater || height > 1) {
                return {
                    x: pos.x,
                    y: height + 1,
                    z: pos.z
                };
            }
        }
        
        // Fallback to area center
        const height = this.worldManager?.getHeightAtPosition(this.position.x, this.position.z) || 0;
        return {
            x: this.position.x,
            y: height + 1,
            z: this.position.z
        };
    }
    
    addEnemySpawn(enemyType, position, level = null) {
        this.enemySpawns.push({
            type: 'enemy',
            enemyType: enemyType,
            position: position,
            level: level || this.getRandomLevel(),
            respawnTime: 60,
            maxCount: 1
        });
    }
    
    addNPCSpawn(npcType, position, config = {}) {
        this.npcSpawns.push({
            type: 'npc',
            npcType: npcType,
            position: position,
            config: config
        });
    }
    
    addResourceSpawn(resourceType, position, config = {}) {
        this.resourceSpawns.push({
            type: 'resource',
            resourceType: resourceType,
            position: position,
            config: config
        });
    }
    
    addStructureSpawn(structureType, position, config = {}) {
        this.structureSpawns.push({
            type: 'structure',
            structureType: structureType,
            position: position,
            config: config
        });
    }
    
    getRandomLevel() {
        return this.levelRange.min + 
               Math.floor(Math.random() * (this.levelRange.max - this.levelRange.min + 1));
    }
    
    // Area-specific enemy types - override in subclasses
    getAreaEnemyTypes() {
        return ['generic_enemy'];
    }
    
    // Area-specific resource types - override in subclasses
    getAreaResourceTypes() {
        return ['generic_resource'];
    }
    
    // Get area info for UI
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            levelRange: this.levelRange,
            faction: this.faction,
            type: this.type,
            subType: this.subType,
            pvpEnabled: this.pvpEnabled
        };
    }
    
    // Compatibility layer for WorldManager
    // WorldManager expects areas to expose `initialize()` and `initialized`
    async initialize() {
        await this.load();
    }
    
    get initialized() {
        return this.loaded;
    }
}
