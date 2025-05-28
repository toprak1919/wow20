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
                
                this.heightMap[i][j] = height;
            }
        }
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
        
        // Add vertex colors based on height
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
            let r, g, b;
            
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
                // Grass
                r = 0.3; g = 0.6; b = 0.2;
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
        
        // Return height at position
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
    }
}
