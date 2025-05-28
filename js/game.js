// Game.js - Core game engine and systems
class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.world = null;
        this.ui = null;
        this.combat = null;
        this.inventory = null;
        this.quests = null;
        this.skills = null;
        this.social = null;
        this.adminPanel = null;
        
        this.entities = new Map();
        this.npcs = new Map();
        this.lootables = new Map();
        this.projectiles = [];
        
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.settings = {
            renderDistance: 500,
            shadowQuality: 'medium',
            antialiasing: true,
            viewDistance: 300,
            soundEnabled: true,
            musicVolume: 0.5,
            effectsVolume: 0.7
        };
        
        this.gameState = {
            loading: true,
            paused: false,
            inCombat: false,
            pvpEnabled: false,
            currentZone: 'Elwynn Forest',
            subZone: 'Goldshire',
            timeOfDay: 12,
            weather: 'clear'
        };
        
        this.stats = {
            monstersKilled: 0,
            questsCompleted: 0,
            achievementsEarned: 0,
            goldEarned: 0,
            deathCount: 0,
            pvpKills: 0,
            pvpDeaths: 0,
            playTime: 0,
            distanceTraveled: 0,
            itemsLooted: 0,
            dungeonRuns: 0,
            raidsCompleted: 0
        };
    }
    
    async init() {
        console.log('Initializing Game Engine...');
        
        await this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        this.setupControls();
        this.setupPhysics();
        this.setupAudio();
        this.setupNetworking();
        
        // Initialize subsystems
        this.world = new World(this);
        this.player = new Player(this);
        this.ui = new UI(this);
        this.combat = new Combat(this);
        this.inventory = new Inventory(this);
        this.quests = new Quests(this);
        this.skills = new Skills(this);
        this.social = new Social(this);
        
        // Initialize admin panel
        this.adminPanel = new AdminPanel(this);
        
        // Debug settings
        this.debugSettings = {
            showFPS: true,
            showCoords: false,
            showHitboxes: false,
            showPaths: false,
            showSpawns: false,
            showGrid: false
        };
        
        // FPS counter
        this.fps = 0;
        this.fpsCounter = 0;
        this.fpsTime = 0;
        
        await this.loadAssets();
        this.setupEventListeners();
        
        // Initialize world system (now modular)
        await this.world.init();
        
        // Initialize player
        await this.player.init();
        
        // Mark as ready
        this.gameState.loading = false;
        
        console.log('Game Engine initialized successfully');
        
        // Start game loop
        this.animate();
    }
    
    async setupRenderer() {
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas,
            antialias: this.settings.antialiasing,
            alpha: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        console.log('Renderer initialized');
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, this.settings.renderDistance);
        
        // Skybox
        const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        console.log('Scene initialized');
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);
        
        // Hemisphere light
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 200, 0);
        this.scene.add(hemiLight);
        
        console.log('Lighting initialized');
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            this.settings.renderDistance
        );
        this.camera.position.set(0, 10, 20);
        
        console.log('Camera initialized');
    }
    
    setupControls() {
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            shift: false,
            autoRun: false,
            cameraRotation: { x: 0, y: 0 },
            mouseDown: false,
            rightMouseDown: false
        };
        
        console.log('Controls initialized');
    }
    
    setupPhysics() {
        // Simple physics simulation
        this.physics = {
            gravity: -9.81,
            groundLevel: 0,
            collisionRadius: 0.5
        };
        
        console.log('Physics initialized');
    }
    
    setupAudio() {
        this.audio = {
            listener: new THREE.AudioListener(),
            sounds: new Map(),
            music: null,
            ambientSounds: [],
            currentMusic: null
        };
        
        this.camera.add(this.audio.listener);
        
        console.log('Audio initialized');
    }
    
    setupNetworking() {
        // Simulated networking for multiplayer features
        this.network = {
            connected: true,
            latency: 50,
            players: new Map(),
            messages: []
        };
        
        console.log('Networking initialized');
    }
    
    async loadAssets() {
        console.log('Loading game assets...');
        
        const loader = new THREE.TextureLoader();
        
        // Load textures with placeholder data URLs for now
        this.textures = {
            grass: await this.loadPlaceholderTexture(0x228B22),
            stone: await this.loadPlaceholderTexture(0x808080),
            water: await this.loadPlaceholderTexture(0x4682B4),
            dirt: await this.loadPlaceholderTexture(0x8B4513),
            sand: await this.loadPlaceholderTexture(0xF4A460)
        };
        
        // Configure texture properties
        Object.values(this.textures).forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10, 10);
        });
        
        console.log('Assets loaded');
    }
    
    loadPlaceholderTexture(color) {
        // Create a simple colored texture
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Convert hex color to CSS
        const hexColor = '#' + color.toString(16).padStart(6, '0');
        ctx.fillStyle = hexColor;
        ctx.fillRect(0, 0, 32, 32);
        
        // Add some noise for texture
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 32;
            const y = Math.random() * 32;
            const brightness = 0.8 + Math.random() * 0.4;
            ctx.fillStyle = `rgba(255,255,255,${brightness * 0.1})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse controls
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('wheel', (e) => this.onMouseWheel(e));
        
        // Touch controls for mobile
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e));
        window.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        console.log('Event listeners initialized');
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onKeyDown(event) {
        switch(event.key.toLowerCase()) {
            case 'w': this.controls.forward = true; break;
            case 's': this.controls.backward = true; break;
            case 'a': this.controls.left = true; break;
            case 'd': this.controls.right = true; break;
            case ' ': this.controls.jump = true; break;
            case 'shift': this.controls.shift = true; break;
            case 'r': this.controls.autoRun = !this.controls.autoRun; break;
            case 'tab': 
                event.preventDefault();
                this.targetNearestEnemy();
                break;
            case 'escape':
                this.ui?.toggleGameMenu();
                break;
        }
        
        // Ability hotkeys
        if (event.key >= '0' && event.key <= '9') {
            this.player?.useAbility(parseInt(event.key));
        }
        
        // UI hotkeys
        this.ui?.handleKeyPress(event.key);
    }
    
    onKeyUp(event) {
        switch(event.key.toLowerCase()) {
            case 'w': this.controls.forward = false; break;
            case 's': this.controls.backward = false; break;
            case 'a': this.controls.left = false; break;
            case 'd': this.controls.right = false; break;
            case ' ': this.controls.jump = false; break;
            case 'shift': this.controls.shift = false; break;
        }
    }
    
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        if (this.controls.rightMouseDown) {
            const deltaX = event.movementX * 0.002;
            const deltaY = event.movementY * 0.002;
            
            this.controls.cameraRotation.y -= deltaX;
            this.controls.cameraRotation.x -= deltaY;
            
            // Clamp vertical rotation
            this.controls.cameraRotation.x = Math.max(-Math.PI / 2, 
                Math.min(Math.PI / 2, this.controls.cameraRotation.x));
        }
        
        this.ui?.handleMouseMove(event);
    }
    
    onMouseDown(event) {
        if (event.button === 0) { // Left click
            this.controls.mouseDown = true;
            this.handleClick(event);
        } else if (event.button === 2) { // Right click
            this.controls.rightMouseDown = true;
            event.preventDefault();
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) {
            this.controls.mouseDown = false;
        } else if (event.button === 2) {
            this.controls.rightMouseDown = false;
        }
    }
    
    onMouseWheel(event) {
        // Camera zoom
        const zoomSpeed = 2;
        const currentDistance = this.camera.position.length();
        const newDistance = currentDistance + event.deltaY * 0.01 * zoomSpeed;
        
        // Clamp zoom distance
        if (newDistance >= 5 && newDistance <= 50) {
            const scale = newDistance / currentDistance;
            this.camera.position.multiplyScalar(scale);
        }
    }
    
    onTouchStart(event) {
        // Mobile touch controls - placeholder
    }
    
    onTouchMove(event) {
        // Mobile touch controls - placeholder
    }
    
    onTouchEnd(event) {
        // Mobile touch controls - placeholder
    }
    
    handleClick(event) {
        // Cast ray from camera
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for entity clicks using the new world system (if available)
        if (this.world && this.world.worldManager && this.world.worldManager.activeEntities) {
            const worldEntities = Array.from(this.world.worldManager.activeEntities.values());
            const entityMeshes = worldEntities.map(e => e.mesh).filter(mesh => mesh);
            
            if (entityMeshes.length > 0) {
                const intersects = this.raycaster.intersectObjects(entityMeshes);
                
                if (intersects.length > 0) {
                    const clickedEntity = this.getEntityByMesh(intersects[0].object);
                    if (clickedEntity) {
                        this.player?.setTarget(clickedEntity);
                        return;
                    }
                }
            }
        }
        
        // Click on terrain for movement
        let terrain = null;
        if (this.world && this.world.worldManager && this.world.worldManager.terrainManager) {
            terrain = this.world.worldManager.terrainManager.terrain;
        } else if (this.world && this.world.terrain) {
            // Fallback for minimal world
            terrain = this.world.terrain;
        }
        
        if (terrain) {
            const terrainIntersects = this.raycaster.intersectObject(terrain);
            if (terrainIntersects.length > 0) {
                if (this.player && this.player.moveToPosition) {
                    this.player.moveToPosition(terrainIntersects[0].point);
                }
            }
        }
    }
    
    getEntityByMesh(mesh) {
        if (this.world && this.world.worldManager && this.world.worldManager.activeEntities) {
            for (const entity of this.world.worldManager.activeEntities.values()) {
                if (entity.mesh === mesh) {
                    return entity;
                }
            }
        }
        
        // Fallback to game.entities for minimal world
        if (this.entities) {
            for (const entity of this.entities.values()) {
                if (entity.mesh === mesh) {
                    return entity;
                }
            }
        }
        
        return null;
    }
    
    targetNearestEnemy() {
        if (!this.player) return;
        
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        let entities = [];
        
        // Get entities from world system if available
        if (this.world && this.world.worldManager && this.world.worldManager.activeEntities) {
            entities = Array.from(this.world.worldManager.activeEntities.values());
        } else if (this.entities) {
            // Fallback to game.entities for minimal world
            entities = Array.from(this.entities.values());
        }
        
        for (const entity of entities) {
            if (entity.type === 'enemy' && entity.alive) {
                const distance = this.player.position.distanceTo(entity.position);
                if (distance < nearestDistance && distance < 50) {
                    nearestDistance = distance;
                    nearestEnemy = entity;
                }
            }
        }
        
        if (nearestEnemy) {
            this.player.setTarget(nearestEnemy);
        }
    }
    
    updateDayNightCycle(deltaTime) {
        // Update time of day
        this.gameState.timeOfDay += deltaTime * 0.01; // 1 game hour = 100 seconds
        if (this.gameState.timeOfDay >= 24) {
            this.gameState.timeOfDay -= 24;
        }
        
        // Update sun position and lighting
        const angle = (this.gameState.timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
        this.sunLight.position.x = Math.cos(angle) * 100;
        this.sunLight.position.y = Math.sin(angle) * 100;
        
        // Adjust light intensity based on time
        const intensity = Math.max(0, Math.sin(angle));
        this.sunLight.intensity = intensity;
        
        // Update fog and sky colors based on time
        if (this.gameState.timeOfDay >= 6 && this.gameState.timeOfDay < 18) {
            // Day time
            this.scene.fog.color.setHex(0x87CEEB);
        } else {
            // Night time
            this.scene.fog.color.setHex(0x000033);
        }
    }
    
    checkAchievements() {
        // Check for various achievement conditions
        const achievements = [
            { id: 'first_kill', name: 'First Blood', condition: () => this.stats.monstersKilled >= 1 },
            { id: 'monster_hunter', name: 'Monster Hunter', condition: () => this.stats.monstersKilled >= 100 },
            { id: 'quest_complete', name: 'Quest Complete', condition: () => this.stats.questsCompleted >= 1 },
            { id: 'rich', name: 'Show Me The Money', condition: () => this.player?.currency?.gold >= 100 },
            { id: 'explorer', name: 'Explorer', condition: () => this.stats.distanceTraveled >= 10000 },
            { id: 'pvp_victor', name: 'PvP Victor', condition: () => this.stats.pvpKills >= 1 },
            { id: 'dungeon_delver', name: 'Dungeon Delver', condition: () => this.stats.dungeonRuns >= 1 }
        ];
        
        for (const achievement of achievements) {
            if (!this.player?.achievements?.has(achievement.id) && achievement.condition()) {
                this.player.achievements.add(achievement.id);
                this.ui?.showAchievement(achievement.name);
                this.stats.achievementsEarned++;
            }
        }
    }
    
    update(deltaTime) {
        if (this.gameState.loading) return;
        
        // Update core systems
        if (this.world) this.world.update(deltaTime);
        if (this.player) this.player.update(deltaTime);
        if (this.combat) this.combat.update(deltaTime);
        if (this.ui) this.ui.update(deltaTime);
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            if (projectile.lifetime <= 0) {
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update environment
        this.updateDayNightCycle(deltaTime);
        
        // Update stats
        this.stats.playTime += deltaTime;
        
        // Check achievements
        this.checkAchievements();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        try {
            const deltaTime = this.clock.getDelta();
            
            // Update FPS counter
            this.fpsCounter++;
            this.fpsTime += deltaTime;
            if (this.fpsTime >= 1.0) {
                this.fps = Math.round(this.fpsCounter / this.fpsTime);
                this.fpsCounter = 0;
                this.fpsTime = 0;
            }
            
            if (!this.gameState.paused) {
                this.update(deltaTime);
            }
            
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Game loop error:', error);
            // Continue running even if there's an error to prevent complete lockup
        }
    }
    
    // Utility methods
    playSound(soundName, volume = 1.0) {
        if (!this.settings.soundEnabled) return;
        
        // Placeholder for sound system
        console.log(`Playing sound: ${soundName} at volume ${volume}`);
    }
    
    playMusic(musicName) {
        if (!this.settings.soundEnabled) return;
        
        if (this.audio.currentMusic === musicName) return;
        
        this.audio.currentMusic = musicName;
        console.log(`Playing music: ${musicName}`);
    }
    
    showNotification(message, type = 'info') {
        this.ui?.showNotification(message, type);
    }
    
    // Save/Load system placeholders
    saveGame() {
        const saveData = {
            player: this.player?.getSaveData(),
            world: this.world?.getSaveData(),
            stats: this.stats,
            gameState: this.gameState,
            timestamp: Date.now()
        };
        
        localStorage.setItem('wow_clone_save', JSON.stringify(saveData));
        this.showNotification('Game saved successfully!');
    }
    
    loadGame() {
        const saveData = localStorage.getItem('wow_clone_save');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.player?.loadSaveData(data.player);
                this.world?.loadSaveData(data.world);
                this.stats = { ...this.stats, ...data.stats };
                this.gameState = { ...this.gameState, ...data.gameState };
                
                this.showNotification('Game loaded successfully!');
                return true;
            } catch (error) {
                console.error('Failed to load save data:', error);
                this.showNotification('Failed to load save data', 'error');
                return false;
            }
        }
        return false;
    }
}
