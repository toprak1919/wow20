// Controls.js - Input handling and control system
class Controls {
    constructor(game) {
        this.game = game;
        
        // Keyboard state
        this.keys = {};
        this.keyBindings = this.getDefaultKeyBindings();
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDownX = 0;
        this.mouseDownY = 0;
        this.leftMouseDown = false;
        this.rightMouseDown = false;
        this.middleMouseDown = false;
        
        // Camera controls
        this.cameraRotation = { x: 0, y: 0 };
        this.cameraDistance = 15;
        this.cameraHeight = 5;
        this.cameraSensitivity = 0.005;
        this.cameraZoomSpeed = 1;
        
        // Movement state
        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;
        this.jump = false;
        this.shift = false;
        this.ctrl = false;
        this.alt = false;
        this.autoRun = false;
        
        // Target selection
        this.targetLock = false;
        this.tabTargeting = true;
        
        // Initialize controls
        this.init();
    }
    
    init() {
        this.setupKeyboardControls();
        this.setupMouseControls();
        this.setupTouchControls();
        this.loadKeyBindings();
    }
    
    getDefaultKeyBindings() {
        return {
            // Movement
            moveForward: ['w', 'arrowup'],
            moveBackward: ['s', 'arrowdown'],
            moveLeft: ['a', 'arrowleft'],
            moveRight: ['d', 'arrowright'],
            jump: [' '],
            autoRun: ['numlock'],
            walk: ['shift'],
            
            // Camera
            turnLeft: ['q'],
            turnRight: ['e'],
            flipCamera: ['v'],
            
            // Targeting
            targetNearest: ['tab'],
            targetNext: ['tab'],
            targetPrevious: ['shift+tab'],
            targetSelf: ['f1'],
            targetParty1: ['f2'],
            targetParty2: ['f3'],
            targetParty3: ['f4'],
            targetParty4: ['f5'],
            clearTarget: ['escape'],
            
            // Actions
            interact: ['f'],
            attack: ['t'],
            
            // Abilities (1-0, -, =)
            ability1: ['1'],
            ability2: ['2'],
            ability3: ['3'],
            ability4: ['4'],
            ability5: ['5'],
            ability6: ['6'],
            ability7: ['7'],
            ability8: ['8'],
            ability9: ['9'],
            ability0: ['0'],
            ability11: ['-'],
            ability12: ['='],
            
            // UI Windows
            character: ['c'],
            inventory: ['i'],
            questLog: ['l'],
            spellbook: ['p'],
            talents: ['n'],
            worldMap: ['m'],
            social: ['o'],
            guild: ['g'],
            pvp: ['h'],
            achievements: ['y'],
            
            // Chat
            openChat: ['enter'],
            reply: ['r'],
            chatGeneral: ['/'],
            
            // System
            screenshot: ['print'],
            toggleUI: ['alt+z'],
            gameMenu: ['escape'],
            help: ['f1']
        };
    }
    
    setupKeyboardControls() {
        // Keydown handler
        document.addEventListener('keydown', (event) => {
            if (this.isChatFocused()) return;
            
            const key = event.key.toLowerCase();
            this.keys[key] = true;
            
            // Update modifier keys
            this.shift = event.shiftKey;
            this.ctrl = event.ctrlKey;
            this.alt = event.altKey;
            
            // Handle key bindings
            this.handleKeyDown(key, event);
            
            // Prevent default for game keys
            if (this.isGameKey(key)) {
                event.preventDefault();
            }
        });
        
        // Keyup handler
        document.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = false;
            
            // Update modifier keys
            this.shift = event.shiftKey;
            this.ctrl = event.ctrlKey;
            this.alt = event.altKey;
            
            // Handle key up
            this.handleKeyUp(key, event);
        });
        
        // Prevent right-click context menu in game
        document.addEventListener('contextmenu', (event) => {
            if (event.target.closest('#game-container')) {
                event.preventDefault();
            }
        });
    }
    
    setupMouseControls() {
        const gameContainer = document.getElementById('game-container');
        
        // Mouse move
        gameContainer.addEventListener('mousemove', (event) => {
            const deltaX = event.clientX - this.mouseX;
            const deltaY = event.clientY - this.mouseY;
            
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
            
            // Camera rotation with right mouse button
            if (this.rightMouseDown) {
                this.cameraRotation.y += deltaX * this.cameraSensitivity;
                this.cameraRotation.x = Math.max(
                    -Math.PI / 3,
                    Math.min(Math.PI / 3, 
                        this.cameraRotation.x + deltaY * this.cameraSensitivity
                    )
                );
                
                // Turn character with camera when both mouse buttons down
                if (this.leftMouseDown) {
                    this.game.player.rotation.y = this.cameraRotation.y;
                }
            }
            
            // UI hover effects
            this.game.ui.handleMouseMove(event);
        });
        
        // Mouse down
        gameContainer.addEventListener('mousedown', (event) => {
            this.mouseDownX = event.clientX;
            this.mouseDownY = event.clientY;
            
            switch (event.button) {
                case 0: // Left button
                    this.leftMouseDown = true;
                    this.handleLeftClick(event);
                    break;
                case 1: // Middle button
                    this.middleMouseDown = true;
                    event.preventDefault();
                    break;
                case 2: // Right button
                    this.rightMouseDown = true;
                    event.preventDefault();
                    break;
            }
        });
        
        // Mouse up
        document.addEventListener('mouseup', (event) => {
            switch (event.button) {
                case 0: // Left button
                    this.leftMouseDown = false;
                    break;
                case 1: // Middle button
                    this.middleMouseDown = false;
                    break;
                case 2: // Right button
                    this.rightMouseDown = false;
                    break;
            }
        });
        
        // Mouse wheel
        gameContainer.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            // Camera zoom
            this.cameraDistance = Math.max(5, 
                Math.min(50, 
                    this.cameraDistance + event.deltaY * 0.01 * this.cameraZoomSpeed
                )
            );
        });
        
        // Double click
        gameContainer.addEventListener('dblclick', (event) => {
            this.handleDoubleClick(event);
        });
    }
    
    setupTouchControls() {
        const gameContainer = document.getElementById('game-container');
        
        let touchStartX = 0;
        let touchStartY = 0;
        let initialDistance = 0;
        
        // Touch start
        gameContainer.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
            } else if (event.touches.length === 2) {
                // Pinch zoom setup
                const dx = event.touches[0].clientX - event.touches[1].clientX;
                const dy = event.touches[0].clientY - event.touches[1].clientY;
                initialDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });
        
        // Touch move
        gameContainer.addEventListener('touchmove', (event) => {
            event.preventDefault();
            
            if (event.touches.length === 1) {
                // Single touch - camera rotation
                const deltaX = event.touches[0].clientX - touchStartX;
                const deltaY = event.touches[0].clientY - touchStartY;
                
                this.cameraRotation.y += deltaX * this.cameraSensitivity;
                this.cameraRotation.x = Math.max(
                    -Math.PI / 3,
                    Math.min(Math.PI / 3, 
                        this.cameraRotation.x + deltaY * this.cameraSensitivity
                    )
                );
                
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
            } else if (event.touches.length === 2) {
                // Pinch zoom
                const dx = event.touches[0].clientX - event.touches[1].clientX;
                const dy = event.touches[0].clientY - event.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const scale = distance / initialDistance;
                this.cameraDistance = Math.max(5, 
                    Math.min(50, this.cameraDistance / scale)
                );
                
                initialDistance = distance;
            }
        });
        
        // Touch end
        gameContainer.addEventListener('touchend', (event) => {
            if (event.touches.length === 0) {
                // All touches ended
            }
        });
    }
    
    handleKeyDown(key, event) {
        // Check for key combinations
        const combo = this.getKeyCombo(event);
        
        // Movement controls
        if (this.isKeyBound('moveForward', combo)) {
            this.forward = true;
        } else if (this.isKeyBound('moveBackward', combo)) {
            this.backward = true;
        } else if (this.isKeyBound('moveLeft', combo)) {
            this.left = true;
        } else if (this.isKeyBound('moveRight', combo)) {
            this.right = true;
        } else if (this.isKeyBound('jump', combo)) {
            this.jump = true;
        } else if (this.isKeyBound('autoRun', combo)) {
            this.autoRun = !this.autoRun;
        }
        
        // Camera controls
        else if (this.isKeyBound('turnLeft', combo)) {
            this.cameraRotation.y -= 0.1;
        } else if (this.isKeyBound('turnRight', combo)) {
            this.cameraRotation.y += 0.1;
        }
        
        // Targeting
        else if (this.isKeyBound('targetNearest', combo)) {
            this.targetNearestEnemy();
        } else if (this.isKeyBound('targetSelf', combo)) {
            this.game.player.setTarget(this.game.player);
        } else if (this.isKeyBound('clearTarget', combo)) {
            if (this.game.ui.activeWindows.size > 0) {
                this.game.ui.hideAllWindows();
            } else {
                this.game.player.setTarget(null);
            }
        }
        
        // Abilities
        for (let i = 0; i <= 9; i++) {
            if (key === i.toString()) {
                this.game.player.useAbility(i === 0 ? 10 : i);
            }
        }
        
        // UI Windows
        this.game.ui.handleKeyPress(key);
        
        // Interact
        if (this.isKeyBound('interact', combo)) {
            this.interact();
        }
    }
    
    handleKeyUp(key, event) {
        // Movement controls
        const combo = this.getKeyCombo(event);
        
        if (this.isKeyBound('moveForward', combo)) {
            this.forward = false;
        } else if (this.isKeyBound('moveBackward', combo)) {
            this.backward = false;
        } else if (this.isKeyBound('moveLeft', combo)) {
            this.left = false;
        } else if (this.isKeyBound('moveRight', combo)) {
            this.right = false;
        } else if (this.isKeyBound('jump', combo)) {
            this.jump = false;
        }
    }
    
    handleLeftClick(event) {
        // Check if clicking on UI
        if (event.target.closest('.ui-element')) {
            return;
        }
        
        // Get click position in 3D world
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.game.camera);
        
        // Check for entity selection
        const entities = Array.from(this.game.entities.values())
            .filter(e => e.mesh)
            .map(e => e.mesh);
        
        const intersects = raycaster.intersectObjects(entities);
        
        if (intersects.length > 0) {
            // Find the entity that owns this mesh
            const clickedMesh = intersects[0].object;
            const entity = Array.from(this.game.entities.values())
                .find(e => e.mesh === clickedMesh);
            
            if (entity) {
                this.selectEntity(entity);
            }
        } else {
            // Click on terrain - move to position
            const terrainIntersects = raycaster.intersectObject(this.game.world.terrain);
            if (terrainIntersects.length > 0) {
                const point = terrainIntersects[0].point;
                this.handleTerrainClick(point);
            }
        }
    }
    
    handleDoubleClick(event) {
        // Check if double-clicking an entity
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.game.camera);
        
        const entities = Array.from(this.game.entities.values())
            .filter(e => e.mesh)
            .map(e => e.mesh);
        
        const intersects = raycaster.intersectObjects(entities);
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const entity = Array.from(this.game.entities.values())
                .find(e => e.mesh === clickedMesh);
            
            if (entity) {
                // Auto-attack if enemy
                if (entity.type === 'enemy') {
                    this.game.player.setTarget(entity);
                    // Start auto-attack
                } else if (entity.type === 'npc') {
                    // Interact with NPC
                    this.interactWithEntity(entity);
                }
            }
        }
    }
    
    handleTerrainClick(point) {
        // Show click effect
        this.showClickEffect(point);
        
        // If both mouse buttons down, move character
        if (this.leftMouseDown && this.rightMouseDown) {
            this.game.player.moveToPosition(point);
        }
    }
    
    showClickEffect(position) {
        // Create a temporary click indicator
        const geometry = new THREE.RingGeometry(0.5, 1, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        ring.position.y += 0.1;
        ring.rotation.x = -Math.PI / 2;
        
        this.game.scene.add(ring);
        
        // Animate and remove
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 0.5) {
                this.game.scene.remove(ring);
                return;
            }
            
            ring.scale.set(1 + elapsed * 2, 1 + elapsed * 2, 1);
            ring.material.opacity = 0.5 * (1 - elapsed * 2);
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    selectEntity(entity) {
        // Set as target
        this.game.player.setTarget(entity);
        
        // Show selection effect
        this.showSelectionEffect(entity);
        
        // Play selection sound
        // this.game.audio.playSound('select');
    }
    
    showSelectionEffect(entity) {
        // Remove previous selection effect
        if (this.selectionEffect) {
            this.game.scene.remove(this.selectionEffect);
        }
        
        // Create selection circle
        const geometry = new THREE.RingGeometry(1, 1.2, 32);
        const material = new THREE.MeshBasicMaterial({
            color: entity.type === 'enemy' ? 0xff0000 : 0x00ff00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.selectionEffect = new THREE.Mesh(geometry, material);
        this.selectionEffect.rotation.x = -Math.PI / 2;
        
        // Attach to entity
        entity.mesh.add(this.selectionEffect);
    }
    
    targetNearestEnemy() {
        const player = this.game.player;
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        // Find nearest enemy
        for (const entity of this.game.entities.values()) {
            if (entity.type === 'enemy' && entity.alive) {
                const distance = player.position.distanceTo(entity.position);
                
                // Check if in front of player (optional)
                const toEntity = new THREE.Vector3()
                    .subVectors(entity.position, player.position)
                    .normalize();
                const forward = new THREE.Vector3(
                    Math.sin(player.rotation.y),
                    0,
                    Math.cos(player.rotation.y)
                );
                const dot = toEntity.dot(forward);
                
                if (distance < nearestDistance && dot > 0) {
                    nearestDistance = distance;
                    nearestEnemy = entity;
                }
            }
        }
        
        if (nearestEnemy) {
            this.selectEntity(nearestEnemy);
        }
    }
    
    interact() {
        const player = this.game.player;
        
        // Check for nearby interactable objects
        for (const entity of this.game.entities.values()) {
            if (entity.type === 'npc' || entity.type === 'object') {
                const distance = player.position.distanceTo(entity.position);
                
                if (distance < 5) { // Interaction range
                    this.interactWithEntity(entity);
                    return;
                }
            }
        }
        
        // Check for resource nodes
        const nearbyNodes = this.findNearbyResourceNodes();
        if (nearbyNodes.length > 0) {
            this.gatherResource(nearbyNodes[0]);
        }
    }
    
    interactWithEntity(entity) {
        if (entity.type === 'npc') {
            if (entity.vendor) {
                // Open vendor window
                this.game.ui.showVendorWindow(entity);
            } else if (entity.questGiver) {
                // Show quest dialog
                this.game.quests.showQuestDialog(entity);
            } else if (entity.flightMaster) {
                // Show flight map
                this.game.ui.showFlightMap(entity);
            } else {
                // Show NPC dialog
                this.showNPCDialog(entity);
            }
        } else if (entity.type === 'object') {
            // Interact with object (chest, door, etc.)
            if (entity.lootable) {
                this.game.loot.showLootWindow(entity);
            }
        }
    }
    
    showNPCDialog(npc) {
        if (npc.dialogue && npc.dialogue.length > 0) {
            const dialog = npc.dialogue[
                Math.floor(Math.random() * npc.dialogue.length)
            ];
            this.game.ui.addChatMessage('general', npc.name, dialog, '#ffcc00');
        }
    }
    
    findNearbyResourceNodes() {
        const player = this.game.player;
        const nodes = [];
        
        this.game.scene.traverse(child => {
            if (child.userData && child.userData.type) {
                const distance = player.position.distanceTo(child.position);
                
                if (distance < 5) {
                    nodes.push(child);
                }
            }
        });
        
        return nodes;
    }
    
    gatherResource(node) {
        const player = this.game.player;
        const nodeData = node.userData;
        
        // Check profession skill
        if (nodeData.type === 'mining') {
            if (!player.professions.mining || 
                player.professions.mining.skill < nodeData.skillRequired) {
                this.game.ui.showError('Mining skill too low');
                return;
            }
        } else if (nodeData.type === 'herbalism') {
            if (!player.professions.herbalism || 
                player.professions.herbalism.skill < nodeData.skillRequired) {
                this.game.ui.showError('Herbalism skill too low');
                return;
            }
        }
        
        // Start gathering
        this.game.ui.showCastBar(`Gathering ${nodeData.resource}`);
        player.isCasting = true;
        
        setTimeout(() => {
            // Give resource
            this.game.inventory.addItem({
                name: nodeData.resource,
                type: 'material',
                stackSize: 1 + Math.floor(Math.random() * 3)
            });
            
            // Increase skill
            if (nodeData.type === 'mining' && player.professions.mining) {
                player.professions.mining.skill += 1;
            } else if (nodeData.type === 'herbalism' && player.professions.herbalism) {
                player.professions.herbalism.skill += 1;
            }
            
            // Remove node
            this.game.scene.remove(node);
            
            player.isCasting = false;
            this.game.ui.hideCastBar();
        }, 3000);
    }
    
    isChatFocused() {
        const chatInput = document.getElementById('chat-input');
        return document.activeElement === chatInput;
    }
    
    isGameKey(key) {
        // List of keys that should be prevented in game
        const gameKeys = [
            'w', 'a', 's', 'd', 'q', 'e', ' ', 'tab', 'escape',
            '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
        ];
        return gameKeys.includes(key);
    }
    
    getKeyCombo(event) {
        let combo = event.key.toLowerCase();
        if (event.shiftKey && combo !== 'shift') combo = 'shift+' + combo;
        if (event.ctrlKey && combo !== 'control') combo = 'ctrl+' + combo;
        if (event.altKey && combo !== 'alt') combo = 'alt+' + combo;
        return combo;
    }
    
    isKeyBound(action, key) {
        const bindings = this.keyBindings[action];
        return bindings && bindings.includes(key);
    }
    
    loadKeyBindings() {
        // Load custom key bindings from localStorage
        const saved = localStorage.getItem('keyBindings');
        if (saved) {
            try {
                this.keyBindings = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load key bindings:', e);
            }
        }
    }
    
    saveKeyBindings() {
        localStorage.setItem('keyBindings', JSON.stringify(this.keyBindings));
    }
    
    rebindKey(action, newKey) {
        // Remove the key from any existing bindings
        for (const [act, keys] of Object.entries(this.keyBindings)) {
            const index = keys.indexOf(newKey);
            if (index > -1) {
                keys.splice(index, 1);
            }
        }
        
        // Add to new action
        if (!this.keyBindings[action]) {
            this.keyBindings[action] = [];
        }
        this.keyBindings[action].push(newKey);
        
        this.saveKeyBindings();
    }
    
    update(deltaTime) {
        // Update movement based on camera rotation when both mouse buttons are down
        if (this.leftMouseDown && this.rightMouseDown) {
            this.forward = true;
        } else if (!this.keys['w'] && !this.keys['arrowup']) {
            this.forward = false;
        }
        
        // Handle auto-run
        if (this.autoRun && !this.backward) {
            this.forward = true;
        }
    }
}
