// AreaManager.js - Manages game areas and their content
// Updated with init method
class AreaManager {
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.areas = new Map();
        this.areaDefinitions = new Map();
    }
    
    async init() {
        console.log('Initializing Area Manager...');
        await this.loadAreaDefinitions();
        console.log('Area Manager initialized');
    }
    
    async loadAreaDefinitions() {
        console.log('Loading area definitions...');
        
        // Register areas that are loaded via script tags
        const areaClasses = [
            'ElwynnForest',
            'Westfall',
            'Goldshire'
        ];
        
        for (const areaClassName of areaClasses) {
            try {
                // Get the area class from global scope
                const areaClass = window[areaClassName];
                if (areaClass) {
                    const area = new areaClass();
                    this.registerArea(area);
                    console.log(`Loaded area: ${area.name}`);
                } else {
                    console.warn(`Area class not found in global scope: ${areaClassName}`);
                }
            } catch (error) {
                console.warn(`Failed to load area ${areaClassName}:`, error);
            }
        }
    }
    
    registerArea(area) {
        area.worldManager = this.worldManager;
        this.areas.set(area.id, area);
        console.log(`Registered area: ${area.name}`);
    }
    
    unregisterArea(areaId) {
        const area = this.areas.get(areaId);
        if (area) {
            area.unload();
            this.areas.delete(areaId);
            console.log(`Unregistered area: ${area.name}`);
        }
    }
    
    getAreaAtPosition(position) {
        for (const area of this.areas.values()) {
            if (area.containsPosition(position)) {
                return area;
            }
        }
        return null;
    }
    
    getAreasInChunk(chunkX, chunkZ) {
        const chunkSize = this.worldManager.chunkSize;
        const chunkBounds = {
            minX: chunkX * chunkSize,
            maxX: (chunkX + 1) * chunkSize,
            minZ: chunkZ * chunkSize,
            maxZ: (chunkZ + 1) * chunkSize
        };
        
        const areasInChunk = [];
        for (const area of this.areas.values()) {
            if (area.intersectsChunk(chunkBounds)) {
                areasInChunk.push(area);
            }
        }
        
        return areasInChunk;
    }
    
    getAreaById(id) {
        return this.areas.get(id);
    }
    
    // Alias for compatibility with WorldManager
    getArea(id) {
        return this.getAreaById(id);
    }
    
    getAllAreas() {
        return Array.from(this.areas.values());
    }
    
    update(deltaTime) {
        // Update all loaded areas
        for (const area of this.areas.values()) {
            if (area.loaded) {
                area.update(deltaTime);
            }
        }
    }
    
    dispose() {
        for (const area of this.areas.values()) {
            area.unload();
        }
        this.areas.clear();
    }
}
