// UI.js - User Interface system
class UI {
    constructor(game) {
        this.game = game;
        
        // UI State
        this.windows = new Map();
        this.activeWindows = new Set();
        this.tooltipTarget = null;
        this.draggedItem = null;
        this.selectedChatTab = 'general';
        
        // UI Elements
        this.elements = {
            playerFrame: null,
            targetFrame: null,
            actionBars: null,
            chatBox: null,
            minimap: null,
            questLog: null,
            inventory: null,
            character: null,
            spellbook: null,
            talents: null,
            map: null,
            social: null,
            guild: null,
            pvp: null,
            achievements: null,
            collections: null,
            lootWindow: null,
            vendorWindow: null,
            tradeWindow: null,
            mailbox: null,
            auctionHouse: null,
            bank: null
        };
        
        // Chat channels
        this.chatChannels = {
            general: { name: 'General', color: '#ffffff', messages: [] },
            combat: { name: 'Combat', color: '#ff6666', messages: [] },
            whisper: { name: 'Whisper', color: '#ff66ff', messages: [] },
            party: { name: 'Party', color: '#66ccff', messages: [] },
            guild: { name: 'Guild', color: '#66ff66', messages: [] },
            trade: { name: 'Trade', color: '#ffcc66', messages: [] }
        };
        
        // Initialize UI
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createMinimapCanvas();
        this.initializeActionBars();
        this.createMobileControls();
        this.updateCurrency();
        this.setupChatTabs();
        this.hideAllWindows();
        
        // Add welcome message
        this.addChatMessage('general', 'System', 'Welcome to World of Warcraft Clone!', '#ffcc00');
        this.addChatMessage('general', 'System', 'Press M for map, I for inventory, C for character', '#ffcc00');
    }
    
    setupEventListeners() {
        // Window dragging
        document.querySelectorAll('.window-header').forEach(header => {
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;
            
            const gameWindow = header.parentElement;
            
            header.addEventListener('mousedown', (e) => {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                
                if (e.target === header) {
                    isDragging = true;
                }
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    
                    xOffset = currentX;
                    yOffset = currentY;
                    
                    gameWindow.style.transform = `translate(${currentX}px, ${currentY}px)`;
                }
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        });
        
        // Close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const window = e.target.closest('.game-window');
                if (window) {
                    window.style.display = 'none';
                    this.activeWindows.delete(window.id);
                }
            });
        });
        
        // Chat input
        const chatInput = document.getElementById('chat-input');
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = chatInput.value.trim();
                if (message) {
                    this.sendChatMessage(message);
                    chatInput.value = '';
                }
            }
        });
        
        // Menu buttons with proper data attribute handling
        const menuButtons = document.querySelectorAll('.menu-btn');
        menuButtons.forEach(btn => {
            const windowId = btn.dataset.window;
            if (windowId) {
                btn.addEventListener('click', () => {
                    this.toggleWindow(windowId);
                });
            } else if (btn.id === 'menu-btn') {
                btn.addEventListener('click', () => {
                    this.toggleGameMenu();
                });
            }
        });
        
        // Bag bar
        document.querySelectorAll('.bag-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.toggleWindow('inventory-window');
            });
        });
        
        // Action bar slots
        document.querySelectorAll('.action-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => {
                const slotNumber = index === 9 ? 0 : index + 1;
                this.game.player.useAbility(slotNumber);
            });
            
            slot.addEventListener('mouseenter', (e) => {
                const slotNumber = index === 9 ? 0 : index + 1;
                const abilityName = this.game.player.actionBars[slotNumber];
                if (abilityName) {
                    const ability = this.game.player.abilities.get(abilityName);
                    if (ability) {
                        this.showTooltip(e.target, this.createAbilityTooltip(ability));
                    }
                }
            });
            
            slot.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
        
        // Minimap buttons (if they exist)
        const zoomInBtn = document.getElementById('zoom-in');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.minimapZoom = Math.max(0.5, this.minimapZoom - 0.1);
            });
        }
        
        const zoomOutBtn = document.getElementById('zoom-out');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.minimapZoom = Math.min(2, this.minimapZoom + 0.1);
            });
        }
        
        // Right-click context menu prevention
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('#game-container')) {
                e.preventDefault();
            }
        });
    }
    
    handleKeyPress(key) {
        switch(key.toLowerCase()) {
            case 'i':
                this.toggleWindow('inventory-window');
                break;
            case 'c':
                this.toggleWindow('character-window');
                break;
            case 'l':
                this.toggleWindow('quest-log');
                break;
            case 'm':
                this.toggleWindow('map-window');
                break;
            case 'k':
                this.toggleWindow('skills-window');
                break;
            case 'n':
                this.toggleWindow('talents-window');
                break;
            case 'o':
                this.toggleWindow('social-window');
                break;
            case 'g':
                this.toggleWindow('guild-window');
                break;
            case 'h':
                this.toggleWindow('pvp-window');
                break;
            case 'y':
                this.toggleWindow('achievements-window');
                break;
            case 'enter':
                document.getElementById('chat-input').focus();
                break;
        }
    }
    
    handleMouseMove(event) {
        // Update tooltip position if active
        if (this.tooltipTarget) {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.left = event.clientX + 10 + 'px';
            tooltip.style.top = event.clientY + 10 + 'px';
        }
    }
    
    toggleWindow(windowId) {
        const window = document.getElementById(windowId);
        if (!window) return;
        
        if (window.style.display === 'none' || !window.style.display) {
            window.style.display = 'block';
            this.activeWindows.add(windowId);
            
            // Bring to front
            const maxZ = Math.max(...Array.from(this.activeWindows).map(id => {
                const w = document.getElementById(id);
                return w ? parseInt(w.style.zIndex || 1000) : 1000;
            }));
            window.style.zIndex = maxZ + 1;
            
            // Update window content
            this.updateWindowContent(windowId);
        } else {
            window.style.display = 'none';
            this.activeWindows.delete(windowId);
        }
    }
    
    hideAllWindows() {
        document.querySelectorAll('.game-window').forEach(window => {
            window.style.display = 'none';
        });
        this.activeWindows.clear();
    }
    
    updateWindowContent(windowId) {
        switch(windowId) {
            case 'inventory-window':
                this.updateInventory();
                break;
            case 'character-window':
                this.updateCharacterStats();
                break;
            case 'quest-log':
                this.updateQuestLog();
                break;
            case 'map-window':
                this.updateMap();
                break;
            case 'social-window':
                this.updateSocialList();
                break;
        }
    }
    
    createMinimapCanvas() {
        const canvas = document.getElementById('minimap-canvas');
        this.minimapCtx = canvas.getContext('2d');
        this.minimapSize = 150;
        this.minimapZoom = 1;
        
        canvas.width = this.minimapSize;
        canvas.height = this.minimapSize;
    }
    
    updateMinimap() {
        const ctx = this.minimapCtx;
        const player = this.game.player;
        const size = this.minimapSize;
        const zoom = this.minimapZoom;
        
        // Clear minimap
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, size, size);
        
        // Draw terrain features
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.scale(zoom, zoom);
        
        // Draw terrain colors based on height
        const viewRange = 50 / zoom;
        const steps = 20;
        const stepSize = viewRange * 2 / steps;
        
        for (let x = -steps / 2; x < steps / 2; x++) {
            for (let z = -steps / 2; z < steps / 2; z++) {
                const worldX = player.position.x + x * stepSize;
                const worldZ = player.position.z + z * stepSize;
                const height = this.game.world.getHeightAtPosition(worldX, worldZ);
                
                // Color based on height
                if (height < 0) {
                    ctx.fillStyle = '#006994'; // Water
                } else if (height < 5) {
                    ctx.fillStyle = '#8B7355'; // Sand
                } else if (height < 20) {
                    ctx.fillStyle = '#228B22'; // Grass
                } else if (height < 30) {
                    ctx.fillStyle = '#696969'; // Rock
                } else {
                    ctx.fillStyle = '#F0F0F0'; // Snow
                }
                
                const pixelX = x * stepSize * zoom;
                const pixelZ = z * stepSize * zoom;
                ctx.fillRect(pixelX - stepSize * zoom / 2, pixelZ - stepSize * zoom / 2, 
                    stepSize * zoom, stepSize * zoom);
            }
        }
        
        // Draw entities
        for (const entity of this.game.entities.values()) {
            const relX = (entity.position.x - player.position.x) * zoom;
            const relZ = (entity.position.z - player.position.z) * zoom;
            
            if (Math.abs(relX) < size / 2 && Math.abs(relZ) < size / 2) {
                ctx.fillStyle = entity.type === 'enemy' ? '#ff0000' : '#00ff00';
                ctx.beginPath();
                ctx.arc(relX, relZ, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw player
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(player.rotation.y) * 10, Math.cos(player.rotation.y) * 10);
        ctx.stroke();
        
        ctx.restore();
        
        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    initializeActionBars() {
        const actionBar = document.querySelector('.action-bar');
        const player = this.game.player;
        
        // Update action bar slots with abilities
        for (let i = 1; i <= 10; i++) {
            const slot = i === 10 ? 0 : i;
            const slotElement = actionBar.children[i - 1];
            const abilityName = player.actionBars[slot];
            
            if (abilityName) {
                const ability = player.abilities.get(abilityName);
                if (ability) {
                    slotElement.innerHTML = `
                        <div class="ability-icon">${ability.icon}</div>
                        <span>${slot}</span>
                        <div class="cooldown-overlay"></div>
                    `;
                }
            }
        }
    }
    
    updateActionBarCooldowns() {
        const player = this.game.player;
        
        for (let i = 1; i <= 10; i++) {
            const slot = i === 10 ? 0 : i;
            const slotElement = document.querySelector(`.action-bar`).children[i - 1];
            const abilityName = player.actionBars[slot];
            
            if (abilityName) {
                const ability = player.abilities.get(abilityName);
                if (ability && ability.currentCooldown > 0) {
                    const cooldownOverlay = slotElement.querySelector('.cooldown-overlay');
                    if (cooldownOverlay) {
                        const cooldownPercent = ability.currentCooldown / ability.cooldown;
                        cooldownOverlay.style.height = (cooldownPercent * 100) + '%';
                        cooldownOverlay.style.display = 'block';
                    }
                } else {
                    const cooldownOverlay = slotElement.querySelector('.cooldown-overlay');
                    if (cooldownOverlay) {
                        cooldownOverlay.style.display = 'none';
                    }
                }
            }
        }
    }

    createMobileControls() {
        const container = document.createElement('div');
        container.id = 'mobile-controls';
        container.innerHTML = `
            <div id="joystick"><div class="stick"></div></div>
            <div class="mobile-buttons">
                <button class="mobile-action" data-ability="1">1</button>
                <button class="mobile-action" data-ability="2">2</button>
                <button class="mobile-action" data-ability="3">3</button>
                <button class="mobile-action" data-ability="4">4</button>
            </div>
        `;
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.appendChild(container);
        } else {
            console.error("UI overlay element not found. Mobile controls could not be created.");
        }

        const joystick = container.querySelector('#joystick');
        const stick = joystick.querySelector('.stick');
        let moving = false;
        const center = { x: 0, y: 0 };

        const reset = () => {
            stick.style.transform = 'translate(0px, 0px)';
            const ctrl = this.game.controls;
            ctrl.forward = ctrl.backward = ctrl.left = ctrl.right = false;
        };

        joystick.addEventListener('touchstart', (e) => {
            moving = true;
            const rect = joystick.getBoundingClientRect();
            center.x = rect.left + rect.width / 2;
            center.y = rect.top + rect.height / 2;
        });

        joystick.addEventListener('touchmove', (e) => {
            if (!moving) return;
            const touch = e.touches[0];
            const dx = touch.clientX - center.x;
            const dy = touch.clientY - center.y;
            const max = joystick.clientWidth / 2;
            const angle = Math.atan2(dy, dx);
            const dist = Math.min(max, Math.hypot(dx, dy));
            stick.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;

            const ctrl = this.game.controls;
            ctrl.forward = dy < -10;
            ctrl.backward = dy > 10;
            ctrl.left = dx < -10;
            ctrl.right = dx > 10;
        }, { passive: true });

        joystick.addEventListener('touchend', () => {
            moving = false;
            reset();
        });

        container.querySelectorAll('.mobile-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const slot = parseInt(btn.dataset.ability, 10);
                this.game.player.useAbility(slot);
            });
        });
    }
    
    updateBuffs() {
        const buffContainer = document.querySelector('.buff-container');
        buffContainer.innerHTML = '';
        
        for (const [id, buff] of this.game.player.buffs) {
            const buffElement = document.createElement('div');
            buffElement.className = 'buff';
            buffElement.innerHTML = buff.icon || '⭐';
            
            buffElement.addEventListener('mouseenter', () => {
                this.showTooltip(buffElement, this.createBuffTooltip(buff));
            });
            
            buffElement.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
            
            buffContainer.appendChild(buffElement);
        }
    }
    
    updateDebuffs() {
        const debuffContainer = document.querySelector('.debuff-container');
        debuffContainer.innerHTML = '';
        
        for (const [id, debuff] of this.game.player.debuffs) {
            const debuffElement = document.createElement('div');
            debuffElement.className = 'debuff';
            debuffElement.innerHTML = debuff.icon || '💀';
            
            debuffElement.addEventListener('mouseenter', () => {
                this.showTooltip(debuffElement, this.createDebuffTooltip(debuff));
            });
            
            debuffElement.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
            
            debuffContainer.appendChild(debuffElement);
        }
    }
    
    showCastBar(spellName) {
        const castBar = document.getElementById('cast-bar');
        castBar.style.display = 'block';
        
        const castText = castBar.querySelector('.cast-text');
        castText.textContent = spellName;
        
        const castProgress = castBar.querySelector('.cast-progress');
        castProgress.style.width = '0%';
    }
    
    updateCastBar(progress, spellName) {
        const castBar = document.getElementById('cast-bar');
        const castProgress = castBar.querySelector('.cast-progress');
        const castText = castBar.querySelector('.cast-text');
        
        castProgress.style.width = (progress * 100) + '%';
        castText.textContent = spellName;
    }
    
    hideCastBar() {
        const castBar = document.getElementById('cast-bar');
        castBar.style.display = 'none';
    }
    
    showZoneText(zoneName, subZone = '') {
        const zoneText = document.getElementById('zone-text');
        zoneText.innerHTML = `
            <div class="zone-name">${zoneName}</div>
            ${subZone ? `<div class="subzone-name">${subZone}</div>` : ''}
        `;
        zoneText.style.display = 'block';
        
        // Fade out after 5 seconds
        setTimeout(() => {
            zoneText.style.display = 'none';
        }, 5000);
    }
    
    showAchievement(achievementName) {
        const notification = document.getElementById('achievement-notification');
        notification.innerHTML = `
            <h2>Achievement Earned!</h2>
            <p>${achievementName}</p>
        `;
        notification.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
    
    showCombatText(text, type = 'damage', position = null) {
        const container = document.getElementById('combat-text-container');
        const combatText = document.createElement('div');
        combatText.className = `combat-text ${type}`;
        combatText.textContent = text;
        
        // Position relative to player or at mouse position
        if (position) {
            const screenPos = this.worldToScreen(position);
            combatText.style.left = screenPos.x + 'px';
            combatText.style.top = screenPos.y + 'px';
        } else {
            combatText.style.left = '50%';
            combatText.style.top = '40%';
        }
        
        container.appendChild(combatText);
        
        // Remove after animation
        setTimeout(() => {
            container.removeChild(combatText);
        }, 2000);
    }
    
    showError(message) {
        this.showCombatText(message, 'error');
        this.addChatMessage('combat', 'System', message, '#ff0000');
    }
    
    showLevelUp(level) {
        const notification = document.createElement('div');
        notification.id = 'level-up-notification';
        notification.innerHTML = `
            <h1>LEVEL UP!</h1>
            <p>You have reached level ${level}</p>
        `;
        notification.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 10000;
            animation: levelUpPulse 3s ease-out forwards;
        `;
        
        document.getElementById('ui-overlay').appendChild(notification);
        
        // Add level up sound and effects
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        // Add chat message
        this.addChatMessage('general', 'System', 
            `Congratulations! You have reached level ${level}!`, '#ffcc00');
    }
    
    showDeathScreen() {
        const deathScreen = document.createElement('div');
        deathScreen.id = 'death-screen';
        deathScreen.innerHTML = `
            <div class="death-content">
                <h1>You have died</h1>
                <p>Resurrecting at nearest graveyard...</p>
            </div>
        `;
        deathScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        document.body.appendChild(deathScreen);
    }
    
    hideDeathScreen() {
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.remove();
        }
    }
    
    updateInventory() {
        const inventoryGrid = document.querySelector('.inventory-grid');
        const inventory = this.game.inventory;
        
        // Clear existing items
        inventoryGrid.innerHTML = '';
        
        // Create inventory slots
        for (let i = 0; i < 20; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            
            const item = inventory.items.get(i);
            if (item) {
                slot.innerHTML = `
                    <div class="item-icon" style="color: ${this.getItemQualityColor(item.quality)}">
                        ${item.icon || '📦'}
                    </div>
                    ${item.stackSize > 1 ? `<span class="stack-count">${item.stackSize}</span>` : ''}
                `;
                
                slot.addEventListener('mouseenter', () => {
                    this.showTooltip(slot, this.createItemTooltip(item));
                });
                
                slot.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });
                
                slot.addEventListener('click', () => {
                    this.handleItemClick(item, i);
                });
            }
            
            inventoryGrid.appendChild(slot);
        }
        
        this.updateCurrency();
    }
    
    updateCurrency() {
        const currency = this.game.player.currency;
        const display = document.querySelector('.currency-display');
        display.innerHTML = `
            <span class="gold">${currency.gold}g</span>
            <span class="silver">${currency.silver}s</span>
            <span class="copper">${currency.copper}c</span>
        `;
    }
    
    updateCharacterStats() {
        const player = this.game.player;
        const statsPanel = document.querySelector('.stats-panel');
        
        statsPanel.innerHTML = `
            <h3>${player.name}</h3>
            <p>Level ${player.level} ${player.race} ${player.class}</p>
            <hr>
            <div class="stat-line">Health: ${Math.floor(player.health)}/${player.maxHealth}</div>
            <div class="stat-line">Mana: ${Math.floor(player.mana)}/${player.maxMana}</div>
            <hr>
            <div class="stat-line">Strength: ${player.attributes.strength}</div>
            <div class="stat-line">Agility: ${player.attributes.agility}</div>
            <div class="stat-line">Intellect: ${player.attributes.intellect}</div>
            <div class="stat-line">Stamina: ${player.attributes.stamina}</div>
            <div class="stat-line">Spirit: ${player.attributes.spirit}</div>
            <hr>
            <div class="stat-line">Attack Power: ${player.attackPower}</div>
            <div class="stat-line">Spell Power: ${player.spellPower}</div>
            <div class="stat-line">Armor: ${player.armor}</div>
            <div class="stat-line">Crit Chance: ${(player.critChance * 100).toFixed(1)}%</div>
        `;
        
        // Update equipment slots
        const equipmentSlots = document.querySelectorAll('.equip-slot');
        equipmentSlots.forEach(slot => {
            const slotName = slot.dataset.slot;
            const item = player.equipment[slotName];
            
            if (item) {
                slot.innerHTML = `
                    <div class="item-icon" style="color: ${this.getItemQualityColor(item.quality)}">
                        ${item.icon || '📦'}
                    </div>
                `;
                
                slot.addEventListener('mouseenter', () => {
                    this.showTooltip(slot, this.createItemTooltip(item));
                });
                
                slot.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });
            } else {
                slot.innerHTML = `<span style="font-size: 8px">${slotName}</span>`;
            }
        });
    }
    
    updateQuestLog() {
        const questList = document.querySelector('.quest-list');
        const questDetails = document.querySelector('.quest-details');
        const quests = this.game.quests.activeQuests;
        
        questList.innerHTML = '<h3>Active Quests</h3>';
        
        quests.forEach((quest, questId) => {
            const questItem = document.createElement('div');
            questItem.className = 'quest-item';
            questItem.innerHTML = `
                <span class="quest-level">[${quest.level}]</span>
                ${quest.name}
            `;
            
            questItem.addEventListener('click', () => {
                this.showQuestDetails(quest);
            });
            
            questList.appendChild(questItem);
        });
        
        // Show first quest by default
        if (quests.size > 0) {
            this.showQuestDetails(quests.values().next().value);
        }
    }
    
    showQuestDetails(quest) {
        const questDetails = document.querySelector('.quest-details');
        
        questDetails.innerHTML = `
            <h2>${quest.name}</h2>
            <p class="quest-description">${quest.description}</p>
            <h3>Objectives:</h3>
            <ul class="objectives-list">
                ${quest.objectives.map(obj => `
                    <li class="${obj.completed ? 'completed' : ''}">
                        ${obj.description} (${obj.current}/${obj.required})
                    </li>
                `).join('')}
            </ul>
            <h3>Rewards:</h3>
            <p>Experience: ${quest.rewards.experience} XP</p>
            <p>Gold: ${quest.rewards.gold}g</p>
            ${quest.rewards.items.length > 0 ? `
                <p>Items:</p>
                <ul>
                    ${quest.rewards.items.map(item => `<li>${item.name}</li>`).join('')}
                </ul>
            ` : ''}
        `;
    }
    
    updateMap() {
        const mapCanvas = document.getElementById('world-map-canvas');
        const ctx = mapCanvas.getContext('2d');
        const player = this.game.player;
        
        // Set canvas size
        mapCanvas.width = 500;
        mapCanvas.height = 400;
        
        // Clear map
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
        
        // Draw zones
        this.game.world.zones.forEach(zone => {
            const x = (zone.position.x + 500) / 1000 * mapCanvas.width;
            const z = (zone.position.z + 500) / 1000 * mapCanvas.height;
            const radius = zone.radius / 1000 * mapCanvas.width;
            
            // Zone area
            ctx.fillStyle = this.getZoneColor(zone.faction);
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(x, z, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // Zone name
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(zone.name, x, z);
            
            // Level range
            ctx.font = '10px Arial';
            ctx.fillText(`${zone.level.min}-${zone.level.max}`, x, z + 15);
        });
        
        // Draw player position
        const playerX = (player.position.x + 500) / 1000 * mapCanvas.width;
        const playerZ = (player.position.z + 500) / 1000 * mapCanvas.height;
        
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(playerX, playerZ, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playerX, playerZ);
        ctx.lineTo(
            playerX + Math.sin(player.rotation.y) * 15,
            playerZ + Math.cos(player.rotation.y) * 15
        );
        ctx.stroke();
    }
    
    getZoneColor(faction) {
        switch(faction) {
            case 'alliance': return '#0066ff';
            case 'horde': return '#ff0000';
            case 'contested': return '#ffff00';
            default: return '#808080';
        }
    }
    
    setupChatTabs() {
        const chatTabs = document.querySelectorAll('.chat-tab');
        chatTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                chatTabs.forEach(t => t.classList.remove('active'));
                // Add active to clicked tab
                tab.classList.add('active');
                // Update selected channel
                this.selectedChatTab = tab.dataset.channel;
                // Update messages display
                this.updateChatMessages();
            });
        });
    }
    
    addChatMessage(channel, sender, message, color = '#ffffff') {
        const chatChannel = this.chatChannels[channel];
        if (!chatChannel) return;
        
        const timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        chatChannel.messages.push({
            timestamp,
            sender,
            message,
            color
        });
        
        // Keep only last 100 messages
        if (chatChannel.messages.length > 100) {
            chatChannel.messages.shift();
        }
        
        // Update display if this channel is selected
        if (this.selectedChatTab === channel) {
            this.updateChatMessages();
        }
    }
    
    updateChatMessages() {
        const chatMessages = document.querySelector('.chat-messages');
        const channel = this.chatChannels[this.selectedChatTab];
        
        chatMessages.innerHTML = channel.messages.map(msg => `
            <div class="chat-message">
                <span class="timestamp">[${msg.timestamp}]</span>
                <span class="sender" style="color: ${msg.color}">[${msg.sender}]:</span>
                <span class="message">${msg.message}</span>
            </div>
        `).join('');
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    sendChatMessage(message) {
        // Parse chat commands
        if (message.startsWith('/')) {
            const parts = message.slice(1).split(' ');
            const command = parts[0];
            const args = parts.slice(1).join(' ');
            
            switch(command) {
                case 'say':
                case 's':
                    this.addChatMessage('general', this.game.player.name, args);
                    break;
                case 'party':
                case 'p':
                    this.addChatMessage('party', this.game.player.name, args);
                    break;
                case 'guild':
                case 'g':
                    this.addChatMessage('guild', this.game.player.name, args);
                    break;
                case 'whisper':
                case 'w':
                    const target = parts[1];
                    const whisperMsg = parts.slice(2).join(' ');
                    this.addChatMessage('whisper', `To ${target}`, whisperMsg, '#ff66ff');
                    break;
                case 'who':
                    this.showOnlinePlayers();
                    break;
                case 'played':
                    const playTime = Math.floor(this.game.stats.playTime / 60);
                    this.addChatMessage('general', 'System', 
                        `Total play time: ${playTime} minutes`, '#ffcc00');
                    break;
                default:
                    this.addChatMessage('general', 'System', 
                        `Unknown command: ${command}`, '#ff0000');
            }
        } else {
            // Regular say message
            this.addChatMessage('general', this.game.player.name, message);
        }
    }
    
    showOnlinePlayers() {
        // Simulate online players
        const players = [
            'Arthas', 'Thrall', 'Jaina', 'Sylvanas', 'Illidan',
            'Tyrande', 'Malfurion', 'Varian', 'Garrosh', 'Anduin'
        ];
        
        this.addChatMessage('general', 'System', 
            `Players online: ${players.length}`, '#ffcc00');
        players.forEach(player => {
            this.addChatMessage('general', 'System', 
                `  ${player} - Level ${Math.floor(Math.random() * 60) + 1}`, '#ffcc00');
        });
    }
    
    showTooltip(element, content) {
        let tooltip = document.getElementById('tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = content;
        tooltip.style.display = 'block';
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.right + 10 + 'px';
        tooltip.style.top = rect.top + 'px';
        
        this.tooltipTarget = element;
    }
    
    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        this.tooltipTarget = null;
    }
    
    createItemTooltip(item) {
        return `
            <div class="tooltip-header" style="color: ${this.getItemQualityColor(item.quality)}">
                ${item.name}
            </div>
            <div class="tooltip-body">
                ${item.slot ? `<p>${this.formatSlotName(item.slot)}</p>` : ''}
                ${item.stats ? this.formatItemStats(item.stats) : ''}
                ${item.description ? `<p class="flavor-text">${item.description}</p>` : ''}
                ${item.level ? `<p>Requires Level ${item.level}</p>` : ''}
                ${item.price ? `<p>Sell Price: ${this.formatPrice(item.price)}</p>` : ''}
            </div>
        `;
    }
    
    createAbilityTooltip(ability) {
        return `
            <div class="tooltip-header">${ability.name}</div>
            <div class="tooltip-body">
                ${ability.cost ? `<p>${ability.cost} ${ability.costType || 'Mana'}</p>` : ''}
                ${ability.range ? `<p>${ability.range} yd range</p>` : ''}
                ${ability.castTime ? `<p>${ability.castTime} sec cast</p>` : '<p>Instant</p>'}
                ${ability.cooldown ? `<p>${ability.cooldown} sec cooldown</p>` : ''}
                ${ability.description ? `<p>${ability.description}</p>` : ''}
            </div>
        `;
    }
    
    createBuffTooltip(buff) {
        const timeLeft = buff.duration - (Date.now() - buff.startTime) / 1000;
        return `
            <div class="tooltip-header">${buff.name}</div>
            <div class="tooltip-body">
                <p>${this.formatDuration(timeLeft)} remaining</p>
                ${buff.description ? `<p>${buff.description}</p>` : ''}
            </div>
        `;
    }
    
    createDebuffTooltip(debuff) {
        const timeLeft = debuff.duration - (Date.now() - debuff.startTime) / 1000;
        return `
            <div class="tooltip-header" style="color: #ff6666">${debuff.name}</div>
            <div class="tooltip-body">
                <p>${this.formatDuration(timeLeft)} remaining</p>
                ${debuff.description ? `<p>${debuff.description}</p>` : ''}
            </div>
        `;
    }
    
    formatItemStats(stats) {
        let html = '';
        if (stats.strength) html += `<p>+${stats.strength} Strength</p>`;
        if (stats.agility) html += `<p>+${stats.agility} Agility</p>`;
        if (stats.intellect) html += `<p>+${stats.intellect} Intellect</p>`;
        if (stats.stamina) html += `<p>+${stats.stamina} Stamina</p>`;
        if (stats.spirit) html += `<p>+${stats.spirit} Spirit</p>`;
        if (stats.attackPower) html += `<p>+${stats.attackPower} Attack Power</p>`;
        if (stats.spellPower) html += `<p>+${stats.spellPower} Spell Power</p>`;
        if (stats.armor) html += `<p>+${stats.armor} Armor</p>`;
        return html;
    }
    
    formatSlotName(slot) {
        const slotNames = {
            head: 'Head',
            neck: 'Neck',
            shoulders: 'Shoulders',
            chest: 'Chest',
            waist: 'Waist',
            legs: 'Legs',
            feet: 'Feet',
            wrists: 'Wrists',
            hands: 'Hands',
            finger1: 'Finger',
            finger2: 'Finger',
            trinket1: 'Trinket',
            trinket2: 'Trinket',
            mainhand: 'Main Hand',
            offhand: 'Off Hand',
            ranged: 'Ranged'
        };
        return slotNames[slot] || slot;
    }
    
    formatPrice(copper) {
        const gold = Math.floor(copper / 10000);
        const silver = Math.floor((copper % 10000) / 100);
        const remainingCopper = copper % 100;
        
        let price = '';
        if (gold > 0) price += `${gold}g `;
        if (silver > 0) price += `${silver}s `;
        if (remainingCopper > 0 || price === '') price += `${remainingCopper}c`;
        
        return price.trim();
    }
    
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${Math.floor(seconds)} sec`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)} min`;
        } else {
            return `${Math.floor(seconds / 3600)} hr`;
        }
    }
    
    getItemQualityColor(quality) {
        const colors = {
            poor: '#9d9d9d',
            common: '#ffffff',
            uncommon: '#1eff00',
            rare: '#0070dd',
            epic: '#a335ee',
            legendary: '#ff8000',
            artifact: '#e6cc80'
        };
        return colors[quality] || colors.common;
    }
    
    worldToScreen(position) {
        const vector = position.clone();
        vector.project(this.game.camera);
        
        const x = (vector.x + 1) / 2 * window.innerWidth;
        const y = -(vector.y - 1) / 2 * window.innerHeight;
        
        return { x, y };
    }
    
    handleItemClick(item, slot) {
        // Check if it's equipment
        if (item.slot) {
            // Try to equip
            this.game.player.equipItem(item, item.slot);
            this.game.inventory.removeItem(slot);
            this.updateInventory();
            this.updateCharacterStats();
        } else if (item.type === 'consumable') {
            // Use consumable
            this.game.inventory.useItem(slot);
            this.updateInventory();
        }
    }
    
    showVendorWindow(vendor) {
        // Create vendor window
        const vendorWindow = document.createElement('div');
        vendorWindow.className = 'game-window vendor-window';
        vendorWindow.innerHTML = `
            <div class="window-header">
                <span>${vendor.name}</span>
                <button class="close-btn">×</button>
            </div>
            <div class="vendor-items">
                ${vendor.inventory.map((item, index) => `
                    <div class="vendor-item" data-index="${index}">
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">${this.formatPrice(item.price)}</span>
                        <button class="buy-btn">Buy</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('ui-overlay').appendChild(vendorWindow);
        
        // Add event listeners
        vendorWindow.querySelector('.close-btn').addEventListener('click', () => {
            vendorWindow.remove();
        });
        
        vendorWindow.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.vendor-item').dataset.index);
                const item = vendor.inventory[index];
                this.buyItem(item);
            });
        });
    }
    
    buyItem(item) {
        const player = this.game.player;
        const totalCopper = player.currency.gold * 10000 + 
                          player.currency.silver * 100 + 
                          player.currency.copper;
        
        if (totalCopper >= item.price) {
            // Deduct price
            player.addCurrency(-item.price);
            // Add item to inventory
            this.game.inventory.addItem(item);
            this.updateInventory();
            this.addChatMessage('general', 'System', 
                `Purchased ${item.name}`, '#ffcc00');
        } else {
            this.showError('Not enough gold');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 25px;
            background: rgba(0, 0, 0, 0.8);
            border-left: 3px solid ${type === 'error' ? '#ff0000' : '#00d4ff'};
            color: white;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    toggleGameMenu() {
        const existingMenu = document.getElementById('game-menu');
        if (existingMenu) {
            existingMenu.remove();
            this.game.gameState.paused = false;
        } else {
            this.showGameMenu();
        }
    }
    
    showGameMenu() {
        this.game.gameState.paused = true;
        
        const gameMenu = document.createElement('div');
        gameMenu.id = 'game-menu';
        gameMenu.innerHTML = `
            <div class="menu-content">
                <h1>Game Menu</h1>
                <button onclick="game.ui.resumeGame()">Resume</button>
                <button onclick="game.ui.showOptions()">Options</button>
                <button onclick="game.ui.showHelp()">Help</button>
                <button onclick="game.ui.logout()">Logout</button>
            </div>
        `;
        gameMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        document.body.appendChild(gameMenu);
    }
    
    resumeGame() {
        const gameMenu = document.getElementById('game-menu');
        if (gameMenu) {
            gameMenu.remove();
        }
        this.game.gameState.paused = false;
    }
    
    update() {
        // Update minimap
        this.updateMinimap();
        
        // Update action bar cooldowns
        this.updateActionBarCooldowns();
        
        // Update target frame
        if (this.game.player.target) {
            this.game.player.updateTargetFrame();
        }
    }
}
