// Main.js - Game initialization and loading sequence
let game = null;

// Loading progress tracking
const loadingSteps = [
    'Initializing renderer...',
    'Loading world data...',
    'Setting up physics...',
    'Loading textures...',
    'Initializing player...',
    'Setting up UI...',
    'Loading complete!'
];

let currentStep = 0;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Starting game initialization...');
    
    // Wait for THREE.js to load
    await waitForTHREE();
    
    try {
        await initializeGame();
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showLoadingError(error.message);
    }
});

// Wait for THREE.js to be available
function waitForTHREE() {
    return new Promise((resolve) => {
        if (typeof THREE !== 'undefined') {
            console.log('THREE.js is already loaded');
            console.log('THREE.js version:', THREE.REVISION);
            checkCapsuleGeometry();
            resolve();
            return;
        }
        
        console.log('Waiting for THREE.js to load...');
        const checkTHREE = () => {
            if (typeof THREE !== 'undefined') {
                console.log('THREE.js loaded successfully');
                console.log('THREE.js version:', THREE.REVISION);
                checkCapsuleGeometry();
                resolve();
            } else {
                setTimeout(checkTHREE, 100);
            }
        };
        checkTHREE();
    });
}

// Check if CapsuleGeometry is available and add fallback if not
function checkCapsuleGeometry() {
    if (typeof THREE.CapsuleGeometry === 'undefined') {
        console.warn('CapsuleGeometry not available, creating fallback...');
        
        // Create a simple fallback using CylinderGeometry (works in all THREE.js versions)
        THREE.CapsuleGeometry = function(radius, height, capSegments, radialSegments) {
            // Just return a cylinder geometry as a simple fallback
            return new THREE.CylinderGeometry(radius || 0.5, radius || 0.5, height || 1.5, radialSegments || 8);
        };
        
        console.log('CapsuleGeometry fallback created successfully');
    } else {
        console.log('CapsuleGeometry is available natively');
    }
}

async function initializeGame() {
    // Show loading screen
    const loadingScreen = document.getElementById('loading-screen');
    const loadingProgress = document.querySelector('.loading-progress');
    const loadingText = document.querySelector('.loading-text');
    
    // Update loading progress
    function updateProgress(step) {
        currentStep = step;
        const progress = (step / loadingSteps.length) * 100;
        loadingProgress.style.width = progress + '%';
        loadingText.textContent = loadingSteps[step] || 'Loading...';
        console.log(`Loading step ${step + 1}/${loadingSteps.length}: ${loadingSteps[step]}`);
    }
    
    // Step 1: Initialize Game class
    updateProgress(0);
    game = new Game();
    await delay(500); // Allow UI to update
    
    // Step 2: Initialize renderer and scene
    updateProgress(1);
    await game.setupRenderer();
    game.setupScene();
    game.setupLighting();
    game.setupCamera();
    await delay(300);
    
    // Step 3: Setup physics and controls
    updateProgress(2);
    game.setupControls();
    game.setupPhysics();
    game.setupAudio();
    game.setupNetworking();
    await delay(300);
    
    // Step 4: Load assets
    updateProgress(3);
    await game.loadAssets();
    await delay(500);
    
    // Step 5: Initialize subsystems
    updateProgress(4);
    await initializeSubsystems();
    await delay(300);
    
    // Step 6: Setup UI
    updateProgress(5);
    game.ui = new UI(game);
    game.setupEventListeners();
    await delay(300);
    
    // Step 7: Complete loading
    updateProgress(6);
    await delay(500);
    
    // Start the game
    startGame();
}

async function initializeSubsystems() {
    // Initialize world system
    if (typeof World !== 'undefined') {
        game.world = new World(game);
    } else {
        console.warn('World class not found, creating minimal world');
        game.world = createMinimalWorld(game);
    }
    
    // Initialize player system
    if (typeof Player !== 'undefined') {
        game.player = new Player(game);
    } else {
        console.warn('Player class not found, creating minimal player');
        game.player = createMinimalPlayer(game);
    }
    
    // Initialize other systems
    if (typeof Combat !== 'undefined') {
        game.combat = new Combat(game);
    }
    
    if (typeof Inventory !== 'undefined') {
        game.inventory = new Inventory(game);
    }
    
    if (typeof Quests !== 'undefined') {
        game.quests = new Quests(game);
    }
    
    if (typeof Skills !== 'undefined') {
        game.skills = new Skills(game);
    }
    
    if (typeof Social !== 'undefined') {
        game.social = new Social(game);
    }
    
    // Initialize admin panel
    if (typeof AdminPanel !== 'undefined') {
        game.adminPanel = new AdminPanel(game);
        console.log('Admin panel initialized - Press F1 to open');
    }
    
    // Initialize debug settings
    game.debugSettings = {
        showFPS: true,
        showCoords: false,
        showHitboxes: false,
        showPaths: false,
        showSpawns: false,
        showGrid: false
    };
    
    // Initialize FPS counter
    game.fps = 0;
    game.fpsCounter = 0;
    game.fpsTime = 0;
}

function createMinimalWorld(game) {
    return {
        terrain: null,
        zones: [],
        init() {
            // Create a simple ground plane
            const geometry = new THREE.PlaneGeometry(100, 100);
            const material = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            this.terrain = new THREE.Mesh(geometry, material);
            this.terrain.rotation.x = -Math.PI / 2;
            this.terrain.receiveShadow = true;
            game.scene.add(this.terrain);
            
            console.log('Minimal world created');
        },
        update(deltaTime) {
            // Basic world update
        },
        getHeightAtPosition(x, z) {
            return 0; // Flat ground
        }
    };
}

function createMinimalPlayer(game) {
    return {
        position: new THREE.Vector3(0, 1, 0),
        rotation: new THREE.Euler(0, 0, 0),
        mesh: null,
        name: 'Player',
        level: 1,
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        target: null,
        currency: { gold: 0, silver: 0, copper: 0 },
        attributes: {
            strength: 10,
            agility: 10,
            intellect: 10,
            stamina: 10,
            spirit: 10
        },
        equipment: {},
        abilities: new Map(),
        actionBars: {},
        buffs: new Map(),
        debuffs: new Map(),
        achievements: new Set(),
        race: 'Human',
        class: 'Warrior',
        attackPower: 10,
        spellPower: 10,
        armor: 5,
        critChance: 0.05,
        
        init() {
            // Create player mesh using cylinder (compatible with Three.js r128)
            const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
            const material = new THREE.MeshLambertMaterial({ color: 0x0066ff });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.copy(this.position);
            this.mesh.castShadow = true;
            game.scene.add(this.mesh);
            
            // Setup camera to follow player
            game.camera.position.set(
                this.position.x,
                this.position.y + 10,
                this.position.z + 20
            );
            game.camera.lookAt(this.position);
            
            console.log('Minimal player created');
        },
        
        update(deltaTime) {
            // Basic movement
            const moveSpeed = 5;
            const controls = game.controls;
            
            if (controls.forward) {
                this.position.z -= moveSpeed * deltaTime;
            }
            if (controls.backward) {
                this.position.z += moveSpeed * deltaTime;
            }
            if (controls.left) {
                this.position.x -= moveSpeed * deltaTime;
            }
            if (controls.right) {
                this.position.x += moveSpeed * deltaTime;
            }
            
            // Update mesh position
            if (this.mesh) {
                this.mesh.position.copy(this.position);
            }
            
            // Update camera
            const cameraOffset = new THREE.Vector3(0, 10, 20);
            cameraOffset.applyEuler(new THREE.Euler(
                game.controls.cameraRotation.x,
                game.controls.cameraRotation.y,
                0
            ));
            
            game.camera.position.copy(this.position).add(cameraOffset);
            game.camera.lookAt(this.position);
        },
        
        setTarget(entity) {
            this.target = entity;
        },
        
        useAbility(slot) {
            console.log(`Using ability in slot ${slot}`);
        },
        
        equipItem(item, slot) {
            this.equipment[slot] = item;
        },
        
        addCurrency(amount) {
            // Convert to copper
            let totalCopper = this.currency.gold * 10000 + 
                            this.currency.silver * 100 + 
                            this.currency.copper + amount;
            
            this.currency.gold = Math.floor(totalCopper / 10000);
            this.currency.silver = Math.floor((totalCopper % 10000) / 100);
            this.currency.copper = totalCopper % 100;
        },
        
        updateTargetFrame() {
            // Update target UI
        }
    };
}

function startGame() {
    console.log('Starting game...');
    
    // Initialize subsystems
    if (game.world && game.world.init) {
        game.world.init();
    }
    
    if (game.player && game.player.init) {
        game.player.init();
    }
    
    // Hide loading screen and show character selection
    const loadingScreen = document.getElementById('loading-screen');
    const characterSelection = document.getElementById('character-selection');
    
    loadingScreen.style.display = 'none';
    characterSelection.style.display = 'block';
    
    // Setup character selection
    setupCharacterSelection();
    
    // Update game state
    game.gameState.loading = false;
    
    console.log('Game initialization complete!');
}

function setupCharacterSelection() {
    const characterSlots = document.querySelectorAll('.character-slot');
    const enterWorldBtn = document.getElementById('enter-world');
    let selectedClass = null;
    
    characterSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            // Remove active class from all slots
            characterSlots.forEach(s => s.classList.remove('selected'));
            // Add active to clicked slot
            slot.classList.add('selected');
            
            selectedClass = slot.dataset.class;
            enterWorldBtn.disabled = false;
            
            // Update player class
            if (game.player) {
                game.player.class = selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1);
                console.log(`Selected class: ${game.player.class}`);
            }
        });
    });
    
    enterWorldBtn.addEventListener('click', () => {
        if (selectedClass) {
            enterWorld();
        }
    });
}

function enterWorld() {
    console.log('Entering world...');
    
    // Hide character selection and show game
    const characterSelection = document.getElementById('character-selection');
    const gameContainer = document.getElementById('game-container');
    
    characterSelection.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Start game loop
    game.animate();
    
    // Show welcome message
    if (game.ui) {
        game.ui.addChatMessage('general', 'System', 
            `Welcome to the world, ${game.player.name}!`, '#ffcc00');
        game.ui.addChatMessage('general', 'System', 
            'Use WASD to move, mouse to look around', '#ffcc00');
        game.ui.addChatMessage('general', 'System', 
            'Press F1 to open the Admin Panel', '#ffcc00');
    }
    
    console.log('Successfully entered the world!');
    
    // Test admin panel after a short delay
    setTimeout(() => {
        if (game.adminPanel) {
            console.log('Admin panel is ready! Press F1 to test.');
        } else {
            console.error('Admin panel failed to initialize!');
        }
    }, 1000);
}

function showLoadingError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingContent = document.querySelector('.loading-content');
    
    loadingContent.innerHTML = `
        <h1>Loading Error</h1>
        <p style="color: #ff6666; margin: 20px 0;">${message}</p>
        <button onclick="location.reload()" style="
            padding: 10px 20px;
            background: #ff6666;
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 4px;
        ">Reload Game</button>
    `;
}

// Utility function for delays
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Game error:', event.error);
    
    // Don't show errors for extension conflicts (already handled in HTML)
    if (event.filename && (
        event.filename.includes('extension://') ||
        event.filename.includes('chrome-extension://') ||
        event.filename.includes('moz-extension://')
    )) {
        return;
    }
    
    // Show user-friendly error for game errors
    if (game && game.ui) {
        game.ui.showError('A game error occurred. Check console for details.');
    }
});

// Expose game globally for debugging
window.game = game;
