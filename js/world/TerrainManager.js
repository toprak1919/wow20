// TerrainManager.js - Handles terrain generation and management
class TerrainManager {
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.terrain = null;
        this.heightMap = [];
        this.waterPlane = null;
        
        // Terrain settings
        this.worldSize = worldManager.worldSize;
        this.segments = 256;
        
        // Area-specific terrain modifications
        this.areaTerrainMods = new Map();
        this.biomeMap = new Map();
        this.terrainNeedsUpdate = false;
    }
    
    async init() {
        console.log('Initializing Terrain Manager...');
        
        this.generateHeightMap();
        this.createTerrain();
        this.createWater();
        
        console.log('Terrain Manager initialized');
    }
    
    generateHeightMap() {
        console.log('Generating height map...');
        
        this.heightMap = [];
        
        for (let i = 0; i <= this.segments; i++) {
            this.heightMap[i] = [];
            for (let j = 0; j <= this.segments; j++) {
                // Convert grid indices to world coordinates
                const worldX = (i / this.segments - 0.5) * this.worldSize;
                const worldZ = (j / this.segments - 0.5) * this.worldSize;
                
                // Multiple octaves of noise for realistic terrain
                const x = i / this.segments * 5;
                const y = j / this.segments * 5;
                
                let height = 0;
                height += this.noise(x, y) * 20;
                height += this.noise(x * 2, y * 2) * 10;
                height += this.noise(x * 4, y * 4) * 5;
                height += this.noise(x * 8, y * 8) * 2.5;
                
                // Create valleys and mountains
                const distance = Math.sqrt(
                    Math.pow(i - this.segments/2, 2) + 
                    Math.pow(j - this.segments/2, 2)
                ) / this.segments;
                
                height *= 1 - distance * 0.5;
                
                // Apply area-specific terrain modifications
                height = this.applyAreaTerrainMods(worldX, worldZ, height);
                
                this.heightMap[i][j] = height;
            }
        }
    }
    
    applyAreaTerrainMods(worldX, worldZ, baseHeight) {
        let finalHeight = baseHeight;
        
        // Check all area terrain modifications
        for (const [areaId, mod] of this.areaTerrainMods) {
            const distance = Math.sqrt(
                Math.pow(worldX - mod.position.x, 2) + 
                Math.pow(worldZ - mod.position.z, 2)
            );
            
            if (distance <= mod.radius) {
                // Calculate influence based on distance and falloff
                const influence = Math.max(0, 1 - (distance / mod.radius));
                const smoothInfluence = this.smoothstep(0, 1, influence);
                
                switch (mod.type) {
                    case 'flatten':
                        finalHeight = this.lerp(finalHeight, mod.targetHeight, smoothInfluence * mod.strength);
                        break;
                    case 'raise':
                        finalHeight += mod.amount * smoothInfluence * mod.strength;
                        break;
                    case 'lower':
                        finalHeight -= mod.amount * smoothInfluence * mod.strength;
                        break;
                    case 'noise':
                        const noiseValue = this.noise(worldX * mod.frequency, worldZ * mod.frequency);
                        finalHeight += noiseValue * mod.amplitude * smoothInfluence * mod.strength;
                        break;
                    case 'plateau':
                        if (finalHeight > mod.minHeight) {
                            const plateauHeight = mod.plateauHeight || mod.minHeight + 5;
                            finalHeight = this.lerp(finalHeight, plateauHeight, smoothInfluence * mod.strength);
                        }
                        break;
                }
            }
        }
        
        return finalHeight;
    }
    
    // Utility functions for smooth terrain modifications
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }
    
    registerAreaTerrainMod(areaId, modification) {
        this.areaTerrainMods.set(areaId, modification);
        this.terrainNeedsUpdate = true;
        console.log(`Registered terrain modification for area: ${areaId}`);
    }
    
    removeAreaTerrainMod(areaId) {
        if (this.areaTerrainMods.delete(areaId)) {
            this.terrainNeedsUpdate = true;
            console.log(`Removed terrain modification for area: ${areaId}`);
        }
    }
    
    setBiomeAtPosition(x, z, biome) {
        const key = `${Math.floor(x / 50)},${Math.floor(z / 50)}`;
        this.biomeMap.set(key, biome);
    }
    
    getBiomeAtPosition(x, z) {
        const key = `${Math.floor(x / 50)},${Math.floor(z / 50)}`;
        return this.biomeMap.get(key) || 'temperate';
    }
    
    noise(x, y) {
        // Simple noise function - could be replaced with proper Perlin noise
        return Math.sin(x * 1.2) * Math.cos(y * 1.3) * 
               Math.sin((x + y) * 0.8) * Math.cos((x - y) * 0.9);
    }
    
    createTerrain() {
        console.log('Creating terrain mesh...');
        
        const geometry = new THREE.PlaneGeometry(
            this.worldSize, 
            this.worldSize, 
            this.segments, 
            this.segments
        );
        
        // Apply height map to vertices
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i <= this.segments; i++) {
            for (let j = 0; j <= this.segments; j++) {
                const index = (i * (this.segments + 1) + j) * 3;
                vertices[index + 2] = this.heightMap[i][j];
            }
        }
        
        geometry.computeVertexNormals();
        
        // Create material with vertex colors
        const material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            side: THREE.DoubleSide
        });
        
        // Add vertex colors based on height and biome
        this.addVertexColors(geometry);
        
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        
        this.worldManager.game.scene.add(this.terrain);
    }
    
    addVertexColors(geometry) {
        const vertices = geometry.attributes.position.array;
        const colors = [];
        
        for (let i = 0; i < vertices.length; i += 3) {
            const height = vertices[i + 2];
            const worldX = vertices[i];
            const worldZ = vertices[i + 1];
            
            // Get biome at this position
            const biome = this.getBiomeAtPosition(worldX, worldZ);
            
            let r, g, b;
            
            // Base terrain colors
            if (height < -5) {
                // Deep water
                r = 0.1; g = 0.3; b = 0.6;
            } else if (height < 0) {
                // Shallow water
                r = 0.2; g = 0.5; b = 0.8;
            } else if (height < 5) {
                // Sand/Beach
                r = 0.9; g = 0.8; b = 0.6;
            } else if (height < 20) {
                // Grass - vary by biome
                switch (biome) {
                    case 'forest':
                        r = 0.2; g = 0.5; b = 0.1;
                        break;
                    case 'plains':
                        r = 0.4; g = 0.7; b = 0.2;
                        break;
                    case 'desert':
                        r = 0.8; g = 0.7; b = 0.4;
                        break;
                    default:
                        r = 0.3; g = 0.6; b = 0.2;
                }
            } else if (height < 30) {
                // Mountain
                r = 0.5; g = 0.4; b = 0.3;
            } else {
                // Snow
                r = 0.9; g = 0.9; b = 0.95;
            }
            
            colors.push(r, g, b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    
    updateTerrain() {
        if (!this.terrainNeedsUpdate || !this.terrain) return;
        
        console.log('Updating terrain with area modifications...');
        
        // Regenerate heightmap with current modifications
        this.generateHeightMap();
        
        // Update terrain geometry
        const vertices = this.terrain.geometry.attributes.position.array;
        for (let i = 0; i <= this.segments; i++) {
            for (let j = 0; j <= this.segments; j++) {
                const index = (i * (this.segments + 1) + j) * 3;
                vertices[index + 2] = this.heightMap[i][j];
            }
        }
        
        this.terrain.geometry.attributes.position.needsUpdate = true;
        this.terrain.geometry.computeVertexNormals();
        
        // Update vertex colors
        this.addVertexColors(this.terrain.geometry);
        
        this.terrainNeedsUpdate = false;
        console.log('Terrain updated successfully');
    }
    
    createWater() {
        console.log('Creating water plane...');
        
        const waterGeometry = new THREE.PlaneGeometry(
            this.worldSize * 2, 
            this.worldSize * 2
        );
        
        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x006994,
            transparent: true,
            opacity: 0.8,
            shininess: 100,
            reflectivity: 0.8
        });
        
        this.waterPlane = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterPlane.rotation.x = -Math.PI / 2;
        this.waterPlane.position.y = 0;
        
        this.worldManager.game.scene.add(this.waterPlane);
    }
    
    getHeightAtPosition(x, z) {
        // Convert world coordinates to heightmap indices
        const i = Math.floor((x / this.worldSize + 0.5) * this.segments);
        const j = Math.floor((z / this.worldSize + 0.5) * this.segments);
        
        // Clamp indices
        const ci = Math.max(0, Math.min(this.segments, i));
        const cj = Math.max(0, Math.min(this.segments, j));
        
        // Return height at position with area modifications applied
        if (this.heightMap[ci] && this.heightMap[ci][cj] !== undefined) {
            return this.heightMap[ci][cj];
        }
        
        return 0;
    }
    
    raycast(origin, direction) {
        if (!this.terrain) return null;
        
        const raycaster = new THREE.Raycaster(origin, direction);
        const intersects = raycaster.intersectObject(this.terrain);
        
        return intersects.length > 0 ? intersects[0] : null;
    }
    
    update(deltaTime) {
        // Update terrain if modifications were made
        if (this.terrainNeedsUpdate) {
            this.updateTerrain();
        }
        
        // Animate water if needed
        if (this.waterPlane) {
            // Simple water animation
            this.waterPlane.material.opacity = 0.8 + Math.sin(Date.now() * 0.001) * 0.1;
        }
    }
    
    dispose() {
        if (this.terrain) {
            this.terrain.geometry.dispose();
            this.terrain.material.dispose();
            this.worldManager.game.scene.remove(this.terrain);
        }
        
        if (this.waterPlane) {
            this.waterPlane.geometry.dispose();
            this.waterPlane.material.dispose();
            this.worldManager.game.scene.remove(this.waterPlane);
        }
        
        this.heightMap = [];
        this.areaTerrainMods.clear();
        this.biomeMap.clear();
    }
}
