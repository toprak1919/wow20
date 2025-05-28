// WorldManager.js - Main world orchestrator for the modular world system
class WorldManager {
    constructor(game) {
        this.game = game;
        
        // Core managers
        this.terrainManager = null;
        this.areaManager = null;
        this.weatherManager = null;
        this.environmentManager = null;
        this.mapManager = null;
        this.entityFactory = null;
        this.enemySpawnManager = null;
        this.enemyInteractionSystem = null;
        
        // World properties
        this.worldSize = 1000;
        this.chunkSize = 100;
        this.viewDistance = 300;
        
        // Active content
        this.activeEntities = new Map();
        this.activeChunks = new Set();
        this.currentArea = null;
        
        // Performance settings
        this.maxEntitiesPerChunk = 50;
        this.entityUpdateRadius = 150;
        this.chunkLoadRadius = 200;
        
        // World state
        this.initialized = false;
        this.loading = false;
    }
    
    async init() {
        console.log('Initializing World Manager...');
        this.loading = true;
        
        try {
            // Initialize core managers in dependency order
            this.terrainManager = new TerrainManager(this);
            await this.terrainManager.init();
            
            this.weatherManager = new WeatherManager(this);
            this.weatherManager.init();
            
            this.environmentManager = new EnvironmentManager(this);
            this.environmentManager.init();
            
            this.entityFactory = new EntityFactory(this);
            this.entityFactory.init();
            
            // Initialize enemy systems
            this.enemySpawnManager = new EnemySpawnManager(this);
            this.enemyInteractionSystem = new EnemyInteractionSystem(this.game);
            
            // Make interaction system available to game
            this.game.enemyInteractionSystem = this.enemyInteractionSystem;
            
            this.areaManager = new AreaManager(this);
            await this.areaManager.init();
            
            this.mapManager = new MapManager(this);
            this.mapManager.init();
            
            // Load initial content
            await this.loadInitialContent();
            
            this.initialized = true;
            this.loading = false;
            
            console.log('World Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize World Manager:', error);
            this.loading = false;
            throw error;
        }
    }
    
    async loadInitialContent() {
        console.log('Loading initial world content...');
        
        // Load starting area (Goldshire)
        const goldshire = this.areaManager.getArea('goldshire');
        if (goldshire) {
            await this.loadArea(goldshire);
            this.currentArea = goldshire;
        }
        
        // Set initial weather
        this.setWeather('clear', 0.8);
        
        console.log('Initial content loaded');
    }
    
    async loadArea(area) {
        console.log(`Loading area: ${area.name}`);
        
        try {
            // Set worldManager reference for the area
            area.worldManager = this;
            
            // Initialize area content if not already done
            if (!area.initialized) {
                await area.initialize();
            }
            
            // Load area chunks
            const chunks = this.getAreaChunks(area);
            for (const chunk of chunks) {
                this.loadChunk(chunk);
            }
            
            // Spawn area entities
            this.spawnAreaEntities(area);
            
            console.log(`Area loaded: ${area.name}`);
            
        } catch (error) {
            console.error(`Failed to load area ${area.name}:`, error);
        }
    }
    
    unloadArea(area) {
        console.log(`Unloading area: ${area.name}`);
        
        // Remove area entities
        this.removeAreaEntities(area);
        
        // Unload area chunks
        const chunks = this.getAreaChunks(area);
        for (const chunk of chunks) {
            this.unloadChunk(chunk);
        }
        
        console.log(`Area unloaded: ${area.name}`);
    }
    
    getAreaChunks(area) {
        const chunks = [];
        const chunkRadius = Math.ceil(area.radius / this.chunkSize);
        const centerChunkX = Math.floor(area.position.x / this.chunkSize);
        const centerChunkZ = Math.floor(area.position.z / this.chunkSize);
        
        for (let x = -chunkRadius; x <= chunkRadius; x++) {
            for (let z = -chunkRadius; z <= chunkRadius; z++) {
                chunks.push({
                    x: centerChunkX + x,
                    z: centerChunkZ + z,
                    id: `${centerChunkX + x},${centerChunkZ + z}`
                });
            }
        }
        
        return chunks;
    }
    
    loadChunk(chunk) {
        if (this.activeChunks.has(chunk.id)) return;
        
        this.activeChunks.add(chunk.id);
    }
    
    unloadChunk(chunk) {
        if (!this.activeChunks.has(chunk.id)) return;
        
        this.activeChunks.delete(chunk.id);
    }
    
    spawnAreaEntities(area) {
        // Register area spawns with the spawn manager
        if (area.enemySpawns && this.enemySpawnManager) {
            this.enemySpawnManager.registerAreaSpawns(area.id, area.enemySpawns);
        }
        
        // Spawn NPCs
        if (area.npcSpawns) {
            area.npcSpawns.forEach(spawn => {
                const entity = this.entityFactory.createNPC(spawn.type, spawn.position, spawn.options);
                if (entity) {
                    this.addEntity(entity);
                }
            });
        }
        
        // Spawn resources
        if (area.resourceSpawns) {
            area.resourceSpawns.forEach(spawn => {
                const entity = this.entityFactory.createResource(spawn.type, spawn.position, spawn.options);
                if (entity) {
                    this.addEntity(entity);
                }
            });
        }
        
        // Spawn structures
        if (area.structureSpawns) {
            area.structureSpawns.forEach(spawn => {
                const entity = this.entityFactory.createStructure(spawn.type, spawn.position, spawn.options);
                if (entity) {
                    this.addEntity(entity);
                }
            });
        }
    }
    
    removeAreaEntities(area) {
        // Remove entities that belong to this area
        this.activeEntities.forEach((entity, id) => {
            if (this.isEntityInArea(entity, area)) {
                this.removeEntity(id);
            }
        });
    }
    
    isEntityInArea(entity, area) {
        const distance = Math.sqrt(
            Math.pow(entity.position.x - area.position.x, 2) +
            Math.pow(entity.position.z - area.position.z, 2)
        );
        return distance <= area.radius;
    }
    
    addEntity(entity) {
        if (!entity || !entity.id) return;
        
        this.activeEntities.set(entity.id, entity);
        
        // Add to scene if it has a mesh
        if (entity.mesh && this.game.scene) {
            this.game.scene.add(entity.mesh);
        }
        
        console.log(`Added entity: ${entity.id} (${entity.type})`);
    }
    
    removeEntity(entityId) {
        const entity = this.activeEntities.get(entityId);
        if (!entity) return;
        
        // Remove from scene
        if (entity.mesh && this.game.scene) {
            this.game.scene.remove(entity.mesh);
            
            // Clean up geometry and materials
            if (entity.mesh.geometry) entity.mesh.geometry.dispose();
            if (entity.mesh.material) {
                if (Array.isArray(entity.mesh.material)) {
                    entity.mesh.material.forEach(mat => mat.dispose());
                } else {
                    entity.mesh.material.dispose();
                }
            }
        }
        
        this.activeEntities.delete(entityId);
        console.log(`Removed entity: ${entityId}`);
    }
    
    update(deltaTime) {
        if (!this.initialized || this.loading) return;
        
        // Update player-based systems
        if (this.game.player) {
            this.updatePlayerBasedSystems(deltaTime);
        }
        
        // Update core managers
        this.terrainManager?.update(deltaTime);
        this.weatherManager?.update(deltaTime);
        this.environmentManager?.update(deltaTime);
        this.mapManager?.update(deltaTime);
        
        // Update enemy systems
        this.enemySpawnManager?.update(deltaTime);
        this.enemyInteractionSystem?.update(deltaTime);
        
        // Update entities
        this.updateEntities(deltaTime);
        
        // Update area transitions
        this.updateAreaTransitions();
        
        // Update chunk loading
        this.updateChunkLoading();
    }
    
    updatePlayerBasedSystems(deltaTime) {
        const player = this.game.player;
        
        // Update current area
        const newArea = this.areaManager.getAreaAtPosition(player.position);
        if (newArea && newArea !== this.currentArea) {
            this.transitionToArea(newArea);
        }
    }
    
    updateEntities(deltaTime) {
        const player = this.game.player;
        if (!player) return;
        
        this.activeEntities.forEach(entity => {
            // Only update entities within update radius
            const distance = Math.sqrt(
                Math.pow(entity.position.x - player.position.x, 2) +
                Math.pow(entity.position.z - player.position.z, 2)
            );
            
            if (distance <= this.entityUpdateRadius) {
                entity.update?.(deltaTime);
            }
        });
    }
    
    updateAreaTransitions() {
        // Handle smooth area transitions and loading
        // This could include fade effects, loading screens, etc.
    }
    
    updateChunkLoading() {
        if (!this.game.player) return;
        
        const playerChunk = this.getChunkAtPosition(this.game.player.position);
        const requiredChunks = this.getChunksAroundPosition(this.game.player.position, this.chunkLoadRadius);
        
        // Load required chunks
        requiredChunks.forEach(chunk => {
            if (!this.activeChunks.has(chunk.id)) {
                this.loadChunk(chunk);
            }
        });
        
        // Unload distant chunks
        this.activeChunks.forEach(chunkId => {
            const [x, z] = chunkId.split(',').map(Number);
            const chunkWorldX = x * this.chunkSize;
            const chunkWorldZ = z * this.chunkSize;
            
            const distance = Math.sqrt(
                Math.pow(chunkWorldX - this.game.player.position.x, 2) +
                Math.pow(chunkWorldZ - this.game.player.position.z, 2)
            );
            
            if (distance > this.chunkLoadRadius * 1.5) {
                this.unloadChunk({ id: chunkId, x, z });
            }
        });
    }
    
    getChunkAtPosition(position) {
        return {
            x: Math.floor(position.x / this.chunkSize),
            z: Math.floor(position.z / this.chunkSize),
            id: `${Math.floor(position.x / this.chunkSize)},${Math.floor(position.z / this.chunkSize)}`
        };
    }
    
    getChunksAroundPosition(position, radius) {
        const chunks = [];
        const chunkRadius = Math.ceil(radius / this.chunkSize);
        const centerChunk = this.getChunkAtPosition(position);
        
        for (let x = -chunkRadius; x <= chunkRadius; x++) {
            for (let z = -chunkRadius; z <= chunkRadius; z++) {
                chunks.push({
                    x: centerChunk.x + x,
                    z: centerChunk.z + z,
                    id: `${centerChunk.x + x},${centerChunk.z + z}`
                });
            }
        }
        
        return chunks;
    }
    
    transitionToArea(newArea) {
        const previousArea = this.currentArea;
        
        console.log(`Transitioning from ${previousArea?.name || 'nowhere'} to ${newArea.name}`);
        
        // Trigger area exit event
        if (previousArea && this.game.player) {
            previousArea.onExit?.(this.game.player);
        }
        
        // Load new area
        this.loadArea(newArea);
        this.currentArea = newArea;
        
        // Trigger area enter event
        if (this.game.player) {
            newArea.onEnter?.(this.game.player);
        }
        
        // Update game state
        this.game.gameState.currentZone = newArea.name;
        this.game.gameState.subZone = newArea.subZone || '';
        
        // Update weather based on area
        if (newArea.weather) {
            this.setWeather(newArea.weather, 0.7);
        }
    }
    
    // Utility methods
    getHeightAtPosition(x, z) {
        return this.terrainManager?.getHeightAtPosition(x, z) || 0;
    }
    
    setWeather(weatherType, intensity = 1.0) {
        this.weatherManager?.setWeather(weatherType, intensity);
    }
    
    getEnvironmentAtPosition(position) {
        return this.environmentManager?.getEnvironmentAtPosition(position) || {
            biome: 'temperate',
            temperature: 20,
            humidity: 0.5
        };
    }
    
    raycastTerrain(origin, direction) {
        // Simple terrain raycasting
        const raycaster = new THREE.Raycaster(origin, direction);
        const terrain = this.terrainManager?.terrain;
        
        if (terrain) {
            const intersects = raycaster.intersectObject(terrain);
            return intersects.length > 0 ? intersects[0] : null;
        }
        
        return null;
    }
    
    // Area management
    registerArea(area) {
        this.areaManager?.registerArea(area);
    }
    
    unregisterArea(areaId) {
        this.areaManager?.unregisterArea(areaId);
    }
    
    getArea(areaId) {
        return this.areaManager?.getArea(areaId);
    }
    
    getActiveAreas() {
        // Return currently loaded areas
        const activeAreas = [];
        if (this.currentArea) {
            activeAreas.push(this.currentArea);
        }
        // In the future, this could include neighboring areas
        return activeAreas;
    }
    
    // Entity management
    getEntity(entityId) {
        return this.activeEntities.get(entityId);
    }
    
    getEntitiesInRadius(position, radius) {
        const entities = [];
        
        this.activeEntities.forEach(entity => {
            const distance = Math.sqrt(
                Math.pow(entity.position.x - position.x, 2) +
                Math.pow(entity.position.z - position.z, 2)
            );
            
            if (distance <= radius) {
                entities.push(entity);
            }
        });
        
        return entities;
    }
    
    getEntitiesByType(type) {
        const entities = [];
        
        this.activeEntities.forEach(entity => {
            if (entity.type === type) {
                entities.push(entity);
            }
        });
        
        return entities;
    }
    
    // Save/Load system
    getSaveData() {
        return {
            currentArea: this.currentArea?.id,
            exploredAreas: Array.from(this.mapManager?.exploredAreas || []),
            discoveredPOIs: Array.from(this.mapManager?.discoveredPOIs || []),
            weather: this.weatherManager?.getWeatherInfo(),
            worldSize: this.worldSize,
            activeChunks: Array.from(this.activeChunks)
        };
    }
    
    loadSaveData(data) {
        if (data.currentArea) {
            const area = this.getArea(data.currentArea);
            if (area) {
                this.currentArea = area;
            }
        }
        
        if (data.exploredAreas && this.mapManager) {
            data.exploredAreas.forEach(areaId => {
                this.mapManager.revealArea(areaId);
            });
        }
        
        if (data.weather && this.weatherManager) {
            this.weatherManager.setWeather(data.weather.type, data.weather.intensity);
        }
    }
    
    dispose() {
        console.log('Disposing World Manager...');
        
        // Dispose of all managers
        this.terrainManager?.dispose();
        this.weatherManager?.dispose();
        this.environmentManager?.dispose();
        this.mapManager?.dispose();
        this.areaManager?.dispose();
        this.entityFactory?.dispose();
        
        // Clear active content
        this.activeEntities.clear();
        this.activeChunks.clear();
        
        this.initialized = false;
        
        console.log('World Manager disposed');
    }
}

// Make WorldManager available globally
window.WorldManager = WorldManager;
