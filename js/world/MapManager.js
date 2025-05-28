// MapManager.js - Handles world map rendering and navigation
class MapManager {
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.game = worldManager.game;
        
        // Map properties
        this.worldMapCanvas = null;
        this.minimapCanvas = null;
        this.worldMapCtx = null;
        this.minimapCtx = null;
        
        // Map settings
        this.worldMapSize = { width: 800, height: 600 };
        this.minimapSize = { width: 150, height: 150 };
        this.mapScale = 0.1; // World units to map pixels
        this.minimapZoom = 50; // Minimap view radius in world units
        
        // Map data
        this.exploredAreas = new Set();
        this.discoveredPOIs = new Map();
        this.mapTexture = null;
        
        // Colors for different map elements
        this.colors = {
            background: '#2a2a2a',
            water: '#4682b4',
            grass: '#228b22',
            mountain: '#8b7355',
            sand: '#f4a460',
            forest: '#006400',
            town: '#ffd700',
            player: '#ff0000',
            poi: '#ffff00',
            enemy: '#cc0000',
            npc: '#00ff00',
            unexplored: '#1a1a1a',
            border: '#444444'
        };
        
        // POI types
        this.poiIcons = {
            town: '🏘️',
            inn: '🏠',
            shop: '🏪',
            blacksmith: '⚒️',
            mine: '⛏️',
            dungeon: '🏰',
            flight_point: '🦅',
            quest_giver: '❗',
            quest_turn_in: '❓',
            resource: '💎',
            vendor: '💰'
        };
    }
    
    init() {
        console.log('Initializing Map Manager...');
        
        this.setupCanvases();
        this.generateMapTexture();
        this.setupEventListeners();
        
        console.log('Map Manager initialized');
    }
    
    setupCanvases() {
        // World map canvas
        this.worldMapCanvas = document.getElementById('world-map-canvas');
        if (this.worldMapCanvas) {
            this.worldMapCanvas.width = this.worldMapSize.width;
            this.worldMapCanvas.height = this.worldMapSize.height;
            this.worldMapCtx = this.worldMapCanvas.getContext('2d');
        }
        
        // Minimap canvas
        this.minimapCanvas = document.getElementById('minimap-canvas');
        if (this.minimapCanvas) {
            this.minimapCanvas.width = this.minimapSize.width;
            this.minimapCanvas.height = this.minimapSize.height;
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }
    }
    
    generateMapTexture() {
        console.log('Generating map texture...');
        
        // Create off-screen canvas for map texture
        const canvas = document.createElement('canvas');
        canvas.width = this.worldMapSize.width;
        canvas.height = this.worldMapSize.height;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Generate terrain-based map
        this.generateTerrainMap(ctx);
        
        // Add area boundaries
        this.drawAreaBoundaries(ctx);
        
        // Store the texture
        this.mapTexture = canvas;
    }
    
    generateTerrainMap(ctx) {
        const terrainManager = this.worldManager.terrainManager;
        if (!terrainManager || !terrainManager.heightMap) return;
        
        const heightMap = terrainManager.heightMap;
        const segments = terrainManager.segments;
        const worldSize = this.worldManager.worldSize;
        
        // Convert heightmap to map colors
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const height = heightMap[i] && heightMap[i][j] ? heightMap[i][j] : 0;
                
                // Convert world coordinates to map coordinates
                const mapX = (i / segments) * this.worldMapSize.width;
                const mapY = (j / segments) * this.worldMapSize.height;
                
                // Determine color based on height
                let color = this.colors.grass;
                if (height < -5) {
                    color = this.colors.water;
                } else if (height < 5) {
                    color = this.colors.sand;
                } else if (height < 20) {
                    color = this.colors.grass;
                } else if (height < 30) {
                    color = this.colors.mountain;
                } else {
                    color = '#ffffff'; // Snow
                }
                
                ctx.fillStyle = color;
                ctx.fillRect(
                    Math.floor(mapX), 
                    Math.floor(mapY), 
                    Math.ceil(this.worldMapSize.width / segments) + 1, 
                    Math.ceil(this.worldMapSize.height / segments) + 1
                );
            }
        }
        
        // Add forest overlay
        this.addForestOverlay(ctx);
    }
    
    addForestOverlay(ctx) {
        const environmentManager = this.worldManager.environmentManager;
        if (!environmentManager) return;
        
        // Create forest density map
        const forestDensity = new Map();
        const gridSize = 20;
        
        environmentManager.trees.forEach(tree => {
            const gridX = Math.floor((tree.position.x + this.worldManager.worldSize / 2) / gridSize);
            const gridY = Math.floor((tree.position.z + this.worldManager.worldSize / 2) / gridSize);
            const key = `${gridX},${gridY}`;
            
            forestDensity.set(key, (forestDensity.get(key) || 0) + 1);
        });
        
        // Draw forest areas
        forestDensity.forEach((density, key) => {
            if (density > 3) { // Minimum trees for forest
                const [gridX, gridY] = key.split(',').map(Number);
                const mapX = (gridX * gridSize / this.worldManager.worldSize) * this.worldMapSize.width;
                const mapY = (gridY * gridSize / this.worldManager.worldSize) * this.worldMapSize.height;
                const size = (gridSize / this.worldManager.worldSize) * this.worldMapSize.width;
                
                ctx.fillStyle = this.colors.forest;
                ctx.globalAlpha = Math.min(density / 10, 0.7);
                ctx.fillRect(mapX, mapY, size, size);
                ctx.globalAlpha = 1.0;
            }
        });
    }
    
    drawAreaBoundaries(ctx) {
        if (!this.worldManager.areaManager) return;
        
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        this.worldManager.areaManager.areas.forEach(area => {
            const mapPos = this.worldToMapCoords(area.position.x, area.position.z);
            const radius = area.radius * this.mapScale;
            
            ctx.beginPath();
            ctx.arc(mapPos.x, mapPos.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Area label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(area.name, mapPos.x, mapPos.y - radius - 5);
        });
        
        ctx.setLineDash([]);
    }
    
    setupEventListeners() {
        // World map click handling
        if (this.worldMapCanvas) {
            this.worldMapCanvas.addEventListener('click', (event) => {
                this.handleWorldMapClick(event);
            });
            
            this.worldMapCanvas.addEventListener('mousemove', (event) => {
                this.handleWorldMapHover(event);
            });
        }
        
        // Minimap click handling
        if (this.minimapCanvas) {
            this.minimapCanvas.addEventListener('click', (event) => {
                this.handleMinimapClick(event);
            });
        }
    }
    
    handleWorldMapClick(event) {
        const rect = this.worldMapCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const worldPos = this.mapToWorldCoords(x, y);
        
        // Move player to clicked location (if accessible)
        if (this.game.player) {
            this.game.player.moveToPosition(new THREE.Vector3(worldPos.x, 0, worldPos.y));
            console.log(`Moving player to world position: ${worldPos.x}, ${worldPos.y}`);
        }
    }
    
    handleWorldMapHover(event) {
        const rect = this.worldMapCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const worldPos = this.mapToWorldCoords(x, y);
        
        // Check for POIs at this location
        const poi = this.getPOIAtLocation(worldPos.x, worldPos.y);
        if (poi) {
            this.showMapTooltip(event, poi);
        } else {
            this.hideMapTooltip();
        }
    }
    
    handleMinimapClick(event) {
        const rect = this.minimapCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert minimap coordinates to world coordinates
        const player = this.game.player;
        if (!player) return;
        
        const centerX = this.minimapSize.width / 2;
        const centerY = this.minimapSize.height / 2;
        
        const offsetX = (x - centerX) / this.minimapSize.width * this.minimapZoom * 2;
        const offsetY = (y - centerY) / this.minimapSize.height * this.minimapZoom * 2;
        
        const worldX = player.position.x + offsetX;
        const worldZ = player.position.z + offsetY;
        
        player.moveToPosition(new THREE.Vector3(worldX, 0, worldZ));
    }
    
    update(deltaTime) {
        this.updateMinimap();
        this.updateWorldMap();
        this.updatePOIs();
    }
    
    updateMinimap() {
        if (!this.minimapCtx || !this.game.player) return;
        
        const ctx = this.minimapCtx;
        const player = this.game.player;
        
        // Clear minimap
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.minimapSize.width, this.minimapSize.height);
        
        // Draw minimap content centered on player
        this.drawMinimapTerrain(ctx, player.position);
        this.drawMinimapEntities(ctx, player.position);
        this.drawMinimapPlayer(ctx);
        
        // Draw minimap border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.minimapSize.width, this.minimapSize.height);
    }
    
    drawMinimapTerrain(ctx, playerPos) {
        // Simplified terrain rendering for minimap
        const centerX = this.minimapSize.width / 2;
        const centerY = this.minimapSize.height / 2;
        const scale = this.minimapSize.width / (this.minimapZoom * 2);
        
        // Draw current area
        const currentArea = this.worldManager.currentArea;
        if (currentArea) {
            const areaX = centerX + (currentArea.position.x - playerPos.x) * scale;
            const areaY = centerY + (currentArea.position.z - playerPos.z) * scale;
            const areaRadius = currentArea.radius * scale;
            
            ctx.fillStyle = this.colors.grass;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(areaX, areaY, areaRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
    
    drawMinimapEntities(ctx, playerPos) {
        const centerX = this.minimapSize.width / 2;
        const centerY = this.minimapSize.height / 2;
        const scale = this.minimapSize.width / (this.minimapZoom * 2);
        
        // Draw nearby entities
        this.worldManager.activeEntities.forEach(entity => {
            const distance = Math.sqrt(
                Math.pow(entity.position.x - playerPos.x, 2) + 
                Math.pow(entity.position.z - playerPos.z, 2)
            );
            
            if (distance <= this.minimapZoom) {
                const entityX = centerX + (entity.position.x - playerPos.x) * scale;
                const entityY = centerY + (entity.position.z - playerPos.z) * scale;
                
                let color = this.colors.npc;
                if (entity.type === 'enemy') {
                    color = this.colors.enemy;
                } else if (entity.type === 'resource') {
                    color = this.colors.poi;
                }
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(entityX, entityY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    drawMinimapPlayer(ctx) {
        const centerX = this.minimapSize.width / 2;
        const centerY = this.minimapSize.height / 2;
        
        // Draw player dot
        ctx.fillStyle = this.colors.player;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction arrow
        if (this.game.player.rotation) {
            const arrowLength = 8;
            const angle = this.game.player.rotation.y;
            
            ctx.strokeStyle = this.colors.player;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.sin(angle) * arrowLength,
                centerY - Math.cos(angle) * arrowLength
            );
            ctx.stroke();
        }
    }
    
    updateWorldMap() {
        if (!this.worldMapCtx) return;
        
        const ctx = this.worldMapCtx;
        
        // Clear and redraw map
        if (this.mapTexture) {
            ctx.drawImage(this.mapTexture, 0, 0);
        }
        
        // Draw POIs
        this.drawPOIs(ctx);
        
        // Draw player position
        if (this.game.player) {
            const playerMapPos = this.worldToMapCoords(
                this.game.player.position.x, 
                this.game.player.position.z
            );
            
            ctx.fillStyle = this.colors.player;
            ctx.beginPath();
            ctx.arc(playerMapPos.x, playerMapPos.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw fog of war for unexplored areas
        this.drawFogOfWar(ctx);
    }
    
    drawPOIs(ctx) {
        this.discoveredPOIs.forEach((poi, id) => {
            const mapPos = this.worldToMapCoords(poi.x, poi.z);
            
            // Draw POI background
            ctx.fillStyle = this.colors.poi;
            ctx.beginPath();
            ctx.arc(mapPos.x, mapPos.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw POI icon
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const icon = this.poiIcons[poi.type] || '📍';
            ctx.fillText(icon, mapPos.x, mapPos.y);
            
            // Draw POI name
            if (poi.name) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px Arial';
                ctx.fillText(poi.name, mapPos.x, mapPos.y + 12);
            }
        });
    }
    
    drawFogOfWar(ctx) {
        if (!this.game.player) return;
        
        const playerMapPos = this.worldToMapCoords(
            this.game.player.position.x, 
            this.game.player.position.z
        );
        
        const explorationRadius = 100; // Map pixels
        
        // Create fog overlay
        ctx.fillStyle = this.colors.unexplored;
        ctx.globalAlpha = 0.7;
        
        // Draw fog everywhere except around explored areas
        ctx.fillRect(0, 0, this.worldMapSize.width, this.worldMapSize.height);
        
        // Clear fog around player and explored areas
        ctx.globalCompositeOperation = 'destination-out';
        
        // Player exploration circle
        ctx.beginPath();
        ctx.arc(playerMapPos.x, playerMapPos.y, explorationRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Explored areas
        this.exploredAreas.forEach(areaId => {
            const area = this.worldManager.areaManager.getArea(areaId);
            if (area) {
                const areaMapPos = this.worldToMapCoords(area.position.x, area.position.z);
                const areaRadius = area.radius * this.mapScale;
                
                ctx.beginPath();
                ctx.arc(areaMapPos.x, areaMapPos.y, areaRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
    }
    
    updatePOIs() {
        // Update POIs based on current area and discoveries
        const currentArea = this.worldManager.currentArea;
        if (currentArea && !this.exploredAreas.has(currentArea.id)) {
            this.exploreArea(currentArea);
        }
    }
    
    exploreArea(area) {
        this.exploredAreas.add(area.id);
        
        // Add area POIs
        this.addPOI(area.position.x, area.position.z, {
            name: area.name,
            type: area.type || 'area',
            description: area.description
        });
        
        // Add structure POIs
        if (area.structures) {
            area.structures.forEach(structure => {
                this.addPOI(structure.position.x, structure.position.z, {
                    name: structure.name,
                    type: structure.type,
                    description: structure.description
                });
            });
        }
    }
    
    addPOI(x, z, data) {
        const id = `${Math.floor(x)},${Math.floor(z)}`;
        this.discoveredPOIs.set(id, {
            x, z,
            name: data.name,
            type: data.type,
            description: data.description,
            discovered: Date.now()
        });
    }
    
    getPOIAtLocation(x, z, radius = 10) {
        for (const [id, poi] of this.discoveredPOIs) {
            const distance = Math.sqrt(Math.pow(poi.x - x, 2) + Math.pow(poi.z - z, 2));
            if (distance <= radius) {
                return poi;
            }
        }
        return null;
    }
    
    showMapTooltip(event, poi) {
        // Implementation for showing map tooltips
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.innerHTML = `
                <strong>${poi.name}</strong><br>
                Type: ${poi.type}<br>
                ${poi.description ? poi.description : ''}
            `;
            tooltip.style.display = 'block';
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY + 10 + 'px';
        }
    }
    
    hideMapTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    worldToMapCoords(worldX, worldZ) {
        const halfWorld = this.worldManager.worldSize / 2;
        return {
            x: ((worldX + halfWorld) / this.worldManager.worldSize) * this.worldMapSize.width,
            y: ((worldZ + halfWorld) / this.worldManager.worldSize) * this.worldMapSize.height
        };
    }
    
    mapToWorldCoords(mapX, mapY) {
        const halfWorld = this.worldManager.worldSize / 2;
        return {
            x: (mapX / this.worldMapSize.width) * this.worldManager.worldSize - halfWorld,
            y: (mapY / this.worldMapSize.height) * this.worldManager.worldSize - halfWorld
        };
    }
    
    // Public API methods
    revealArea(areaId) {
        this.exploredAreas.add(areaId);
    }
    
    isAreaExplored(areaId) {
        return this.exploredAreas.has(areaId);
    }
    
    getExploredPercentage() {
        const totalAreas = this.worldManager.areaManager.areas.size;
        const exploredAreas = this.exploredAreas.size;
        return totalAreas > 0 ? (exploredAreas / totalAreas) * 100 : 0;
    }
    
    dispose() {
        // Clean up event listeners and resources
        if (this.worldMapCanvas) {
            this.worldMapCanvas.removeEventListener('click', this.handleWorldMapClick);
            this.worldMapCanvas.removeEventListener('mousemove', this.handleWorldMapHover);
        }
        
        if (this.minimapCanvas) {
            this.minimapCanvas.removeEventListener('click', this.handleMinimapClick);
        }
        
        this.exploredAreas.clear();
        this.discoveredPOIs.clear();
    }
}
