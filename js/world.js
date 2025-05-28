// World.js - Main world system using modular architecture
// This file now serves as a compatibility layer for the new modular world system

class World {
    constructor(game) {
        this.game = game;
        
        // Initialize the new modular world manager
        this.worldManager = new WorldManager(game);
        
        // Maintain compatibility with existing code
        this.terrain = null;
        this.zones = new Map();
        this.currentZone = null;
        
        // Legacy properties for backward compatibility
        this.worldSize = this.worldManager.worldSize;
        this.chunkSize = this.worldManager.chunkSize;
        this.viewDistance = this.worldManager.viewDistance;
    }
    
    async init() {
        console.log('Initializing World (Legacy Compatibility Layer)...');
        
        // Initialize the new modular system
        await this.worldManager.init();
        
        // Set up compatibility references
        this.terrain = this.worldManager.terrainManager.terrain;
        this.zones = this.worldManager.areaManager.areas;
        
        console.log('World system initialized with modular architecture');
    }
    
    update(deltaTime) {
        // Delegate to the world manager
        this.worldManager.update(deltaTime);
        
        // Update legacy references
        this.currentZone = this.worldManager.currentArea;
    }
    
    getHeightAtPosition(x, z) {
        return this.worldManager.getHeightAtPosition(x, z);
    }
    
    // Legacy methods for backward compatibility
    spawnCreatures() {
        console.log('Legacy spawnCreatures() called - entities are now managed by areas');
    }
    
    createZones() {
        console.log('Legacy createZones() called - zones are now loaded as areas');
    }
    
    populateWorld() {
        console.log('Legacy populateWorld() called - world population is now handled by area system');
    }
    
    // Weather compatibility
    setWeather(weatherType, intensity) {
        this.worldManager.setWeather(weatherType, intensity);
    }
    
    getWeather() {
        return this.worldManager.weatherManager.getWeatherInfo();
    }
    
    // Environment compatibility
    getEnvironmentAtPosition(position) {
        return this.worldManager.getEnvironmentAtPosition(position);
    }
    
    // Area management compatibility
    registerArea(area) {
        this.worldManager.registerArea(area);
    }
    
    unregisterArea(areaId) {
        this.worldManager.unregisterArea(areaId);
    }
    
    getCurrentArea() {
        return this.worldManager.currentArea;
    }
    
    // Utility methods
    raycastTerrain(origin, direction) {
        return this.worldManager.raycastTerrain(origin, direction);
    }
    
    dispose() {
        if (this.worldManager) {
            this.worldManager.dispose();
        }
    }
}

// Expose World class globally for compatibility
window.World = World;

// Zone compatibility class
class Zone {
    constructor(data) {
        console.warn('Zone class is deprecated. Use BaseArea-based area classes instead.');
        
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.level = data.level;
        this.position = data.position;
        this.radius = data.radius;
        this.faction = data.faction;
        this.music = data.music;
        this.discovered = false;
    }
}
