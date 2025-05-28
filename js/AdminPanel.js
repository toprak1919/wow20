// AdminPanel.js - Master admin/debug panel for testing and cheats
class AdminPanel {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.selectedTab = 'player';
        this.commandHistory = [];
        this.historyIndex = -1;
        
        // Create panel UI
        this.createPanel();
        this.setupKeyBindings();
        
        // Register global admin commands
        this.registerCommands();
    }
    
    createPanel() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'admin-panel';
        this.container.className = 'admin-panel hidden';
        this.container.innerHTML = `
            <div class="admin-header">
                <h2>Admin Panel</h2>
                <button class="admin-close" onclick="game.adminPanel.toggle()">×</button>
            </div>
            
            <div class="admin-tabs">
                <button class="tab-btn active" data-tab="player">Player</button>
                <button class="tab-btn" data-tab="world">World</button>
                <button class="tab-btn" data-tab="spawn">Spawn</button>
                <button class="tab-btn" data-tab="teleport">Teleport</button>
                <button class="tab-btn" data-tab="items">Items</button>
                <button class="tab-btn" data-tab="combat">Combat</button>
                <button class="tab-btn" data-tab="debug">Debug</button>
                <button class="tab-btn" data-tab="console">Console</button>
            </div>
            
            <div class="admin-content">
                <!-- Player Tab -->
                <div class="tab-content active" id="player-tab">
                    <h3>Player Cheats</h3>
                    <div class="admin-section">
                        <h4>Stats</h4>
                        <button onclick="game.adminPanel.setLevel(60)">Max Level (60)</button>
                        <button onclick="game.adminPanel.addExperience(10000)">Add 10k XP</button>
                        <button onclick="game.adminPanel.setHealth(9999, 9999)">God Mode HP</button>
                        <button onclick="game.adminPanel.setMana(9999, 9999)">Infinite Mana</button>
                        <button onclick="game.adminPanel.addGold(10000)">Add 10k Gold</button>
                        <button onclick="game.adminPanel.resetStats()">Reset Stats</button>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Movement</h4>
                        <label>Speed Multiplier: <input type="number" id="speed-mult" value="1" step="0.5" min="0.1" max="10"></label>
                        <button onclick="game.adminPanel.setSpeed()">Set Speed</button>
                        <button onclick="game.adminPanel.toggleFly()">Toggle Fly Mode</button>
                        <button onclick="game.adminPanel.toggleNoclip()">Toggle Noclip</button>
                        <button onclick="game.adminPanel.toggleInvisible()">Toggle Invisible</button>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Quick Actions</h4>
                        <button onclick="game.adminPanel.healFull()">Full Heal</button>
                        <button onclick="game.adminPanel.resurrect()">Resurrect</button>
                        <button onclick="game.adminPanel.clearDebuffs()">Clear Debuffs</button>
                        <button onclick="game.adminPanel.unlockAllSkills()">Unlock All Skills</button>
                    </div>
                </div>
                
                <!-- World Tab -->
                <div class="tab-content" id="world-tab">
                    <h3>World Control</h3>
                    <div class="admin-section">
                        <h4>Time & Weather</h4>
                        <label>Time of Day: <input type="range" id="time-slider" min="0" max="24" step="0.1" value="12"></label>
                        <span id="time-display">12:00</span>
                        <button onclick="game.adminPanel.setTimeOfDay()">Set Time</button>
                        
                        <div class="weather-controls">
                            <button onclick="game.adminPanel.setWeather('clear')">Clear</button>
                            <button onclick="game.adminPanel.setWeather('rain')">Rain</button>
                            <button onclick="game.adminPanel.setWeather('storm')">Storm</button>
                            <button onclick="game.adminPanel.setWeather('snow')">Snow</button>
                            <button onclick="game.adminPanel.setWeather('fog')">Fog</button>
                        </div>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Environment</h4>
                        <button onclick="game.adminPanel.reloadArea()">Reload Current Area</button>
                        <button onclick="game.adminPanel.respawnAllEnemies()">Respawn All Enemies</button>
                        <button onclick="game.adminPanel.killAllEnemies()">Kill All Enemies</button>
                        <button onclick="game.adminPanel.pauseAllEnemies()">Pause Enemy AI</button>
                        <button onclick="game.adminPanel.showAllSpawns()">Show Spawn Points</button>
                    </div>
                </div>
                
                <!-- Spawn Tab -->
                <div class="tab-content" id="spawn-tab">
                    <h3>Spawn Entities</h3>
                    <div class="admin-section">
                        <h4>Spawn Enemy</h4>
                        <select id="enemy-type">
                            <option value="wolf">Wolf</option>
                            <option value="kobold">Kobold</option>
                            <option value="bandit">Bandit</option>
                            <option value="defias_thug">Defias Thug</option>
                            <option value="spider">Spider</option>
                            <option value="bear">Bear</option>
                            <option value="murloc">Murloc</option>
                            <option value="gnoll">Gnoll</option>
                        </select>
                        <label>Level: <input type="number" id="enemy-level" value="1" min="1" max="60"></label>
                        <label>Elite: <input type="checkbox" id="enemy-elite"></label>
                        <button onclick="game.adminPanel.spawnEnemy()">Spawn at Cursor</button>
                        <button onclick="game.adminPanel.spawnEnemyGroup()">Spawn Group (5)</button>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Spawn NPC</h4>
                        <input type="text" id="npc-name" placeholder="NPC Name">
                        <button onclick="game.adminPanel.spawnNPC()">Spawn NPC</button>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Spawn Object</h4>
                        <select id="object-type">
                            <option value="chest">Treasure Chest</option>
                            <option value="campfire">Campfire</option>
                            <option value="portal">Portal</option>
                            <option value="banner">Banner</option>
                        </select>
                        <button onclick="game.adminPanel.spawnObject()">Spawn Object</button>
                    </div>
                </div>
                
                <!-- Teleport Tab -->
                <div class="tab-content" id="teleport-tab">
                    <h3>Teleportation</h3>
                    <div class="admin-section">
                        <h4>Quick Teleports</h4>
                        <button onclick="game.adminPanel.teleportTo('goldshire')">Goldshire</button>
                        <button onclick="game.adminPanel.teleportTo('elwynn_forest')">Elwynn Forest</button>
                        <button onclick="game.adminPanel.teleportTo('westfall')">Westfall</button>
                        <button onclick="game.adminPanel.teleportTo('stormwind')">Stormwind</button>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Coordinate Teleport</h4>
                        <label>X: <input type="number" id="tp-x" value="0"></label>
                        <label>Y: <input type="number" id="tp-y" value="0"></label>
                        <label>Z: <input type="number" id="tp-z" value="0"></label>
                        <button onclick="game.adminPanel.teleportToCoords()">Teleport</button>
                        <button onclick="game.adminPanel.saveLocation()">Save Current Location</button>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Saved Locations</h4>
                        <div id="saved-locations"></div>
                    </div>
                </div>
                
                <!-- Items Tab -->
                <div class="tab-content" id="items-tab">
                    <h3>Item Management</h3>
                    <div class="admin-section">
                        <h4>Add Items</h4>
                        <input type="text" id="item-search" placeholder="Search items...">
                        <div id="item-list" class="item-list"></div>
                        <button onclick="game.adminPanel.giveAllItems()">Give All Items</button>
                        <button onclick="game.adminPanel.clearInventory()">Clear Inventory</button>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Quick Sets</h4>
                        <button onclick="game.adminPanel.giveStarterSet()">Starter Set</button>
                        <button onclick="game.adminPanel.giveWarriorSet()">Warrior Set</button>
                        <button onclick="game.adminPanel.giveMageSet()">Mage Set</button>
                        <button onclick="game.adminPanel.giveRogueSet()">Rogue Set</button>
                        <button onclick="game.adminPanel.giveEpicSet()">Epic Set</button>
                    </div>
                </div>
                
                <!-- Combat Tab -->
                <div class="tab-content" id="combat-tab">
                    <h3>Combat Cheats</h3>
                    <div class="admin-section">
                        <h4>Damage & Defense</h4>
                        <button onclick="game.adminPanel.setDamageMultiplier(10)">10x Damage</button>
                        <button onclick="game.adminPanel.setDamageMultiplier(100)">100x Damage</button>
                        <button onclick="game.adminPanel.setDamageMultiplier(1)">Normal Damage</button>
                        <button onclick="game.adminPanel.toggleInvincible()">Toggle Invincible</button>
                        <button onclick="game.adminPanel.setDefense(9999)">Max Defense</button>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Abilities</h4>
                        <button onclick="game.adminPanel.resetCooldowns()">Reset All Cooldowns</button>
                        <button onclick="game.adminPanel.infiniteResources()">Infinite Resources</button>
                        <button onclick="game.adminPanel.instantCast()">Instant Cast</button>
                        <button onclick="game.adminPanel.aoeNuke()">AOE Nuke</button>
                    </div>
                </div>
                
                <!-- Debug Tab -->
                <div class="tab-content" id="debug-tab">
                    <h3>Debug Tools</h3>
                    <div class="admin-section">
                        <h4>Display Options</h4>
                        <label><input type="checkbox" id="show-fps" checked> Show FPS</label>
                        <label><input type="checkbox" id="show-coords"> Show Coordinates</label>
                        <label><input type="checkbox" id="show-hitboxes"> Show Hitboxes</label>
                        <label><input type="checkbox" id="show-paths"> Show AI Paths</label>
                        <label><input type="checkbox" id="show-spawns"> Show Spawn Points</label>
                        <label><input type="checkbox" id="show-grid"> Show Grid</label>
                    </div>
                    
                    <div class="admin-section">
                        <h4>Performance</h4>
                        <button onclick="game.adminPanel.showStats()">Show Stats</button>
                        <button onclick="game.adminPanel.profileFrame()">Profile Frame</button>
                        <button onclick="game.adminPanel.clearCache()">Clear Cache</button>
                        <button onclick="game.adminPanel.reloadShaders()">Reload Shaders</button>
                    </div>
                    
                    <div class="admin-section">
                        <h4>World Info</h4>
                        <div id="world-info"></div>
                    </div>
                </div>
                
                <!-- Console Tab -->
                <div class="tab-content" id="console-tab">
                    <h3>Command Console</h3>
                    <div class="console-output" id="console-output"></div>
                    <div class="console-input-wrapper">
                        <span class="console-prompt">></span>
                        <input type="text" id="console-input" placeholder="Enter command...">
                    </div>
                    <div class="console-help">
                        <small>Type 'help' for available commands. Use ↑/↓ for history.</small>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Add CSS if not already present
        if (!document.getElementById('admin-panel-styles')) {
            const style = document.createElement('style');
            style.id = 'admin-panel-styles';
            style.textContent = this.getStyles();
            document.head.appendChild(style);
        }
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    getStyles() {
        return `
            .admin-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                max-width: 90vw;
                height: 600px;
                max-height: 90vh;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #FFD700;
                border-radius: 8px;
                color: white;
                font-family: Arial, sans-serif;
                z-index: 10000;
                display: flex;
                flex-direction: column;
            }
            
            .admin-panel.hidden {
                display: none;
            }
            
            .admin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 20px;
                background: rgba(255, 215, 0, 0.2);
                border-bottom: 1px solid #FFD700;
            }
            
            .admin-header h2 {
                margin: 0;
                color: #FFD700;
            }
            
            .admin-close {
                background: none;
                border: none;
                color: #FFD700;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
            }
            
            .admin-tabs {
                display: flex;
                background: rgba(0, 0, 0, 0.5);
                border-bottom: 1px solid #333;
                overflow-x: auto;
            }
            
            .tab-btn {
                background: none;
                border: none;
                color: #999;
                padding: 10px 20px;
                cursor: pointer;
                transition: all 0.3s;
                white-space: nowrap;
            }
            
            .tab-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .tab-btn.active {
                color: #FFD700;
                border-bottom: 2px solid #FFD700;
            }
            
            .admin-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .admin-section {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 15px;
            }
            
            .admin-section h4 {
                margin-top: 0;
                color: #FFD700;
                font-size: 14px;
                text-transform: uppercase;
            }
            
            .admin-panel button {
                background: rgba(255, 215, 0, 0.2);
                border: 1px solid #FFD700;
                color: #FFD700;
                padding: 8px 16px;
                margin: 4px;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.3s;
            }
            
            .admin-panel button:hover {
                background: rgba(255, 215, 0, 0.3);
                transform: translateY(-1px);
            }
            
            .admin-panel input[type="text"],
            .admin-panel input[type="number"],
            .admin-panel select {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #333;
                color: white;
                padding: 6px 10px;
                margin: 4px;
                border-radius: 4px;
            }
            
            .admin-panel label {
                display: inline-block;
                margin: 4px;
                color: #ccc;
            }
            
            .admin-panel input[type="checkbox"] {
                margin-right: 8px;
            }
            
            .admin-panel input[type="range"] {
                width: 200px;
                vertical-align: middle;
            }
            
            .console-output {
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid #333;
                height: 400px;
                overflow-y: auto;
                padding: 10px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                margin-bottom: 10px;
            }
            
            .console-input-wrapper {
                display: flex;
                align-items: center;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid #333;
                padding: 5px 10px;
            }
            
            .console-prompt {
                color: #FFD700;
                margin-right: 10px;
                font-family: 'Courier New', monospace;
            }
            
            #console-input {
                flex: 1;
                background: none;
                border: none;
                color: white;
                font-family: 'Courier New', monospace;
                outline: none;
            }
            
            .console-help {
                text-align: center;
                margin-top: 10px;
                color: #666;
            }
            
            .item-list {
                max-height: 200px;
                overflow-y: auto;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #333;
                margin: 10px 0;
            }
            
            .weather-controls {
                margin-top: 10px;
            }
            
            #world-info {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                color: #0f0;
            }
        `;
    }
    
    setupEventListeners() {
        // Tab switching
        const tabButtons = this.container.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
        
        // Console input
        const consoleInput = document.getElementById('console-input');
        consoleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(consoleInput.value);
                consoleInput.value = '';
            } else if (e.key === 'ArrowUp') {
                this.navigateHistory(-1);
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                this.navigateHistory(1);
                e.preventDefault();
            }
        });
        
        // Time slider
        const timeSlider = document.getElementById('time-slider');
        timeSlider.addEventListener('input', (e) => {
            const hours = Math.floor(e.target.value);
            const minutes = Math.floor((e.target.value - hours) * 60);
            document.getElementById('time-display').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        });
        
        // Debug checkboxes
        const debugCheckboxes = this.container.querySelectorAll('#debug-tab input[type="checkbox"]');
        debugCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateDebugSettings();
            });
        });
    }
    
    setupKeyBindings() {
        document.addEventListener('keydown', (e) => {
            // F1 to toggle admin panel
            if (e.key === 'F1') {
                e.preventDefault();
                this.toggle();
            }
            
            // Additional shortcuts when panel is open
            if (this.isVisible) {
                // Ctrl+1-8 for quick tab switching
                if (e.ctrlKey && e.key >= '1' && e.key <= '8') {
                    const tabs = ['player', 'world', 'spawn', 'teleport', 'items', 'combat', 'debug', 'console'];
                    const tabIndex = parseInt(e.key) - 1;
                    if (tabs[tabIndex]) {
                        this.switchTab(tabs[tabIndex]);
                    }
                }
            }
        });
    }
    
    // UI Methods
    toggle() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle('hidden', !this.isVisible);
        
        if (this.isVisible) {
            this.updateWorldInfo();
        }
    }
    
    switchTab(tabName) {
        // Update buttons
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update content
        this.container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        this.selectedTab = tabName;
        
        // Update tab-specific content
        if (tabName === 'items') {
            this.updateItemList();
        } else if (tabName === 'teleport') {
            this.updateSavedLocations();
        } else if (tabName === 'debug') {
            this.updateWorldInfo();
        }
    }
    
    // Player Commands
    setLevel(level) {
        if (!this.game.player) return;
        
        this.game.player.level = level;
        this.game.player.experience = 0; // Reset XP for current level
        this.game.player.skillPoints = level * 2; // Give skill points
        
        // Update stats
        this.game.player.calculateStats();
        
        this.log(`Set player level to ${level}`);
        this.game.ui.showNotification(`Level set to ${level}!`, 'levelup');
    }
    
    addExperience(amount) {
        if (!this.game.player) return;
        
        this.game.player.gainExperience(amount);
        this.log(`Added ${amount} experience`);
    }
    
    setHealth(current, max) {
        if (!this.game.player) return;
        
        if (max) this.game.player.maxHealth = max;
        this.game.player.health = current;
        
        this.log(`Set health to ${current}/${this.game.player.maxHealth}`);
    }
    
    setMana(current, max) {
        if (!this.game.player) return;
        
        if (max) this.game.player.maxMana = max;
        this.game.player.mana = current;
        
        this.log(`Set mana to ${current}/${this.game.player.maxMana}`);
    }
    
    addGold(amount) {
        if (!this.game.player) return;
        
        this.game.player.gold += amount;
        this.log(`Added ${amount} gold`);
        this.game.ui.showNotification(`+${amount} gold!`, 'gold');
    }
    
    resetStats() {
        if (!this.game.player) return;
        
        this.game.player.strength = 10;
        this.game.player.agility = 10;
        this.game.player.intelligence = 10;
        this.game.player.stamina = 10;
        this.game.player.calculateStats();
        
        this.log('Reset all stats to 10');
    }
    
    setSpeed() {
        if (!this.game.player) return;
        
        const multiplier = parseFloat(document.getElementById('speed-mult').value);
        this.game.player.baseSpeed = 5 * multiplier;
        this.game.player.moveSpeed = this.game.player.baseSpeed;
        
        this.log(`Set speed multiplier to ${multiplier}x`);
    }
    
    toggleFly() {
        if (!this.game.player) return;
        
        this.game.player.canFly = !this.game.player.canFly;
        this.game.player.isFlying = this.game.player.canFly;
        
        this.log(`Fly mode ${this.game.player.canFly ? 'enabled' : 'disabled'}`);
        this.game.ui.showNotification(`Fly mode ${this.game.player.canFly ? 'ON' : 'OFF'}`, 'buff');
    }
    
    toggleNoclip() {
        if (!this.game.player) return;
        
        this.game.player.noclip = !this.game.player.noclip;
        
        this.log(`Noclip ${this.game.player.noclip ? 'enabled' : 'disabled'}`);
        this.game.ui.showNotification(`Noclip ${this.game.player.noclip ? 'ON' : 'OFF'}`, 'buff');
    }
    
    toggleInvisible() {
        if (!this.game.player) return;
        
        this.game.player.invisible = !this.game.player.invisible;
        
        if (this.game.player.mesh) {
            this.game.player.mesh.visible = !this.game.player.invisible;
        }
        
        this.log(`Invisible ${this.game.player.invisible ? 'enabled' : 'disabled'}`);
        this.game.ui.showNotification(`Invisible ${this.game.player.invisible ? 'ON' : 'OFF'}`, 'buff');
    }
    
    healFull() {
        if (!this.game.player) return;
        
        this.game.player.health = this.game.player.maxHealth;
        this.game.player.mana = this.game.player.maxMana;
        
        this.log('Fully healed player');
        this.game.ui.showNotification('Fully healed!', 'heal');
    }
    
    resurrect() {
        if (!this.game.player || this.game.player.alive) return;
        
        this.game.player.resurrect();
        this.log('Player resurrected');
    }
    
    clearDebuffs() {
        if (!this.game.player) return;
        
        // Clear all debuffs
        if (this.game.player.buffs) {
            this.game.player.buffs = this.game.player.buffs.filter(buff => !buff.isDebuff);
        }
        
        this.log('Cleared all debuffs');
        this.game.ui.showNotification('Debuffs cleared!', 'buff');
    }
    
    unlockAllSkills() {
        if (!this.game.skills) return;
        
        // Unlock all skills
        Object.values(this.game.skills.skillTrees).forEach(tree => {
            Object.values(tree.skills).forEach(skill => {
                skill.currentRank = skill.maxRank;
                skill.unlocked = true;
            });
        });
        
        this.log('Unlocked all skills');
        this.game.ui.showNotification('All skills unlocked!', 'levelup');
    }
    
    // World Commands
    setTimeOfDay() {
        const time = parseFloat(document.getElementById('time-slider').value);
        
        if (this.game.world && this.game.world.setTimeOfDay) {
            this.game.world.setTimeOfDay(time);
        }
        
        this.log(`Set time to ${Math.floor(time)}:${Math.floor((time % 1) * 60).toString().padStart(2, '0')}`);
    }
    
    setWeather(weatherType) {
        if (this.game.world && this.game.world.worldManager && this.game.world.worldManager.weatherManager) {
            this.game.world.worldManager.weatherManager.setWeather(weatherType, 1.0);
        }
        
        this.log(`Set weather to ${weatherType}`);
    }
    
    reloadArea() {
        if (this.game.world && this.game.world.worldManager && this.game.world.worldManager.currentArea) {
            const area = this.game.world.worldManager.currentArea;
            this.game.world.worldManager.unloadArea(area);
            this.game.world.worldManager.loadArea(area);
        }
        
        this.log('Reloaded current area');
    }
    
    respawnAllEnemies() {
        if (this.game.world && this.game.world.worldManager && this.game.world.worldManager.enemySpawnManager) {
            this.game.world.worldManager.enemySpawnManager.forceRespawnAll();
        }
        
        this.log('Respawned all enemies');
    }
    
    killAllEnemies() {
        if (!this.game.entities) return;
        
        let count = 0;
        this.game.entities.forEach(entity => {
            if (entity.type === 'enemy' && entity.alive) {
                entity.takeDamage(999999, this.game.player);
                count++;
            }
        });
        
        this.log(`Killed ${count} enemies`);
    }
    
    pauseAllEnemies() {
        if (!this.game.entities) return;
        
        this.game.entities.forEach(entity => {
            if (entity.type === 'enemy' && entity.ai) {
                entity.ai.paused = !entity.ai.paused;
            }
        });
        
        this.log('Toggled enemy AI pause');
    }
    
    showAllSpawns() {
        // Toggle spawn point visibility
        if (this.game.world && this.game.world.worldManager && this.game.world.worldManager.enemySpawnManager) {
            this.game.world.worldManager.enemySpawnManager.toggleSpawnVisualization();
        }
        
        this.log('Toggled spawn point visibility');
    }
    
    // Spawn Commands
    spawnEnemy() {
        const enemyType = document.getElementById('enemy-type').value;
        const level = parseInt(document.getElementById('enemy-level').value);
        const isElite = document.getElementById('enemy-elite').checked;
        
        // Get spawn position (in front of player)
        const spawnPos = this.getSpawnPosition();
        
        if (this.game.world && this.game.world.worldManager && this.game.world.worldManager.entityFactory) {
            const enemy = this.game.world.worldManager.entityFactory.createEnemy(enemyType, spawnPos, {
                level: level,
                elite: isElite
            });
            
            if (enemy) {
                this.game.world.worldManager.addEntity(enemy);
                this.log(`Spawned ${isElite ? 'Elite ' : ''}${enemyType} (Level ${level})`);
            }
        }
    }
    
    spawnEnemyGroup() {
        const enemyType = document.getElementById('enemy-type').value;
        const level = parseInt(document.getElementById('enemy-level').value);
        const isElite = document.getElementById('enemy-elite').checked;
        
        const basePos = this.getSpawnPosition();
        
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5;
            const spawnPos = {
                x: basePos.x + Math.cos(angle) * 5,
                y: basePos.y,
                z: basePos.z + Math.sin(angle) * 5
            };
            
            if (this.game.world && this.game.world.worldManager && this.game.world.worldManager.entityFactory) {
                const enemy = this.game.world.worldManager.entityFactory.createEnemy(enemyType, spawnPos, {
                    level: level,
                    elite: isElite
                });
                
                if (enemy) {
                    this.game.world.worldManager.addEntity(enemy);
                }
            }
        }
        
        this.log(`Spawned group of 5 ${enemyType}`);
    }
    
    spawnNPC() {
        const npcName = document.getElementById('npc-name').value || 'Test NPC';
        const spawnPos = this.getSpawnPosition();
        
        // Create a simple NPC
        const npc = {
            id: `npc_${Date.now()}`,
            type: 'npc',
            name: npcName,
            position: spawnPos,
            mesh: this.createNPCMesh()
        };
        
        if (this.game.world && this.game.world.worldManager) {
            this.game.world.worldManager.addEntity(npc);
        }
        
        this.log(`Spawned NPC: ${npcName}`);
    }
    
    spawnObject() {
        const objectType = document.getElementById('object-type').value;
        const spawnPos = this.getSpawnPosition();
        
        // Create object based on type
        const object = {
            id: `object_${Date.now()}`,
            type: 'object',
            objectType: objectType,
            position: spawnPos,
            mesh: this.createObjectMesh(objectType)
        };
        
        if (this.game.world && this.game.world.worldManager) {
            this.game.world.worldManager.addEntity(object);
        }
        
        this.log(`Spawned ${objectType}`);
    }
    
    getSpawnPosition() {
        if (!this.game.player) {
            return { x: 0, y: 0, z: 0 };
        }
        
        const player = this.game.player;
        const distance = 10;
        const angle = player.rotation.y;
        
        return {
            x: player.position.x + Math.sin(angle) * distance,
            y: player.position.y,
            z: player.position.z + Math.cos(angle) * distance
        };
    }
    
    createNPCMesh() {
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        return new THREE.Mesh(geometry, material);
    }
    
    createObjectMesh(type) {
        let geometry, material;
        
        switch(type) {
            case 'chest':
                geometry = new THREE.BoxGeometry(1.5, 1, 1);
                material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                break;
            case 'campfire':
                geometry = new THREE.ConeGeometry(1, 1, 8);
                material = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
                break;
            case 'portal':
                geometry = new THREE.TorusGeometry(2, 0.5, 8, 16);
                material = new THREE.MeshLambertMaterial({ color: 0x9932CC });
                break;
            case 'banner':
                geometry = new THREE.BoxGeometry(0.2, 3, 0.2);
                material = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
                break;
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        }
        
        return new THREE.Mesh(geometry, material);
    }
    
    // Teleport Commands
    teleportTo(areaName) {
        const locations = {
            'goldshire': { x: 50, y: 1, z: 50 },
            'elwynn_forest': { x: 0, y: 1, z: 0 },
            'westfall': { x: 200, y: 1, z: 0 },
            'stormwind': { x: -100, y: 1, z: -100 }
        };
        
        const pos = locations[areaName];
        if (pos && this.game.player) {
            this.game.player.position.set(pos.x, pos.y, pos.z);
            this.log(`Teleported to ${areaName}`);
            this.game.ui.showNotification(`Teleported to ${areaName}`, 'info');
        }
    }
    
    teleportToCoords() {
        const x = parseFloat(document.getElementById('tp-x').value);
        const y = parseFloat(document.getElementById('tp-y').value);
        const z = parseFloat(document.getElementById('tp-z').value);
        
        if (this.game.player) {
            this.game.player.position.set(x, y, z);
            this.log(`Teleported to (${x}, ${y}, ${z})`);
        }
    }
    
    saveLocation() {
        if (!this.game.player) return;
        
        const name = prompt('Location name:');
        if (!name) return;
        
        const savedLocations = JSON.parse(localStorage.getItem('adminSavedLocations') || '{}');
        savedLocations[name] = {
            x: this.game.player.position.x,
            y: this.game.player.position.y,
            z: this.game.player.position.z
        };
        
        localStorage.setItem('adminSavedLocations', JSON.stringify(savedLocations));
        this.updateSavedLocations();
        this.log(`Saved location: ${name}`);
    }
    
    updateSavedLocations() {
        const container = document.getElementById('saved-locations');
        const savedLocations = JSON.parse(localStorage.getItem('adminSavedLocations') || '{}');
        
        container.innerHTML = '';
        
        Object.entries(savedLocations).forEach(([name, pos]) => {
            const btn = document.createElement('button');
            btn.textContent = name;
            btn.onclick = () => {
                if (this.game.player) {
                    this.game.player.position.set(pos.x, pos.y, pos.z);
                    this.log(`Teleported to saved location: ${name}`);
                }
            };
            container.appendChild(btn);
        });
    }
    
    // Item Commands
    updateItemList() {
        const container = document.getElementById('item-list');
        const searchInput = document.getElementById('item-search');
        
        // Sample items - in a real game, this would come from item definitions
        const items = [
            { id: 'sword_iron', name: 'Iron Sword', type: 'weapon' },
            { id: 'armor_leather', name: 'Leather Armor', type: 'armor' },
            { id: 'potion_health', name: 'Health Potion', type: 'consumable' },
            { id: 'ring_power', name: 'Ring of Power', type: 'accessory' }
        ];
        
        container.innerHTML = '';
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.style.padding = '5px';
            div.style.cursor = 'pointer';
            div.innerHTML = `${item.name} <small>(${item.type})</small>`;
            div.onclick = () => this.giveItem(item);
            container.appendChild(div);
        });
    }
    
    giveItem(item) {
        if (this.game.inventory) {
            this.game.inventory.addItem(item);
            this.log(`Added ${item.name} to inventory`);
        }
    }
    
    giveAllItems() {
        // Give all available items
        this.log('Gave all items');
        this.game.ui.showNotification('All items added!', 'loot');
    }
    
    clearInventory() {
        if (this.game.inventory) {
            this.game.inventory.clear();
            this.log('Cleared inventory');
        }
    }
    
    giveStarterSet() {
        this.log('Gave starter equipment set');
    }
    
    giveWarriorSet() {
        this.log('Gave warrior equipment set');
    }
    
    giveMageSet() {
        this.log('Gave mage equipment set');
    }
    
    giveRogueSet() {
        this.log('Gave rogue equipment set');
    }
    
    giveEpicSet() {
        this.log('Gave epic equipment set');
    }
    
    // Combat Commands
    setDamageMultiplier(multiplier) {
        if (!this.game.player) return;
        
        this.game.player.damageMultiplier = multiplier;
        this.log(`Set damage multiplier to ${multiplier}x`);
        this.game.ui.showNotification(`Damage ${multiplier}x!`, 'buff');
    }
    
    toggleInvincible() {
        if (!this.game.player) return;
        
        this.game.player.invincible = !this.game.player.invincible;
        this.log(`Invincibility ${this.game.player.invincible ? 'enabled' : 'disabled'}`);
        this.game.ui.showNotification(`Invincible ${this.game.player.invincible ? 'ON' : 'OFF'}`, 'buff');
    }
    
    setDefense(amount) {
        if (!this.game.player) return;
        
        this.game.player.armor = amount;
        this.log(`Set armor to ${amount}`);
    }
    
    resetCooldowns() {
        if (this.game.skills) {
            // Reset all skill cooldowns
            this.log('Reset all cooldowns');
            this.game.ui.showNotification('Cooldowns reset!', 'buff');
        }
    }
    
    infiniteResources() {
        if (!this.game.player) return;
        
        this.game.player.infiniteResources = !this.game.player.infiniteResources;
        this.log(`Infinite resources ${this.game.player.infiniteResources ? 'enabled' : 'disabled'}`);
    }
    
    instantCast() {
        if (!this.game.player) return;
        
        this.game.player.instantCast = !this.game.player.instantCast;
        this.log(`Instant cast ${this.game.player.instantCast ? 'enabled' : 'disabled'}`);
    }
    
    aoeNuke() {
        // Kill all enemies in range
        const radius = 50;
        let count = 0;
        
        if (this.game.entities) {
            this.game.entities.forEach(entity => {
                if (entity.type === 'enemy' && entity.alive) {
                    const distance = this.game.player.distanceTo(entity);
                    if (distance <= radius) {
                        entity.takeDamage(999999, this.game.player);
                        count++;
                    }
                }
            });
        }
        
        this.log(`AOE Nuke killed ${count} enemies`);
        this.game.ui.showNotification('BOOM!', 'damage');
    }
    
    // Debug Commands
    updateDebugSettings() {
        const settings = {
            showFPS: document.getElementById('show-fps').checked,
            showCoords: document.getElementById('show-coords').checked,
            showHitboxes: document.getElementById('show-hitboxes').checked,
            showPaths: document.getElementById('show-paths').checked,
            showSpawns: document.getElementById('show-spawns').checked,
            showGrid: document.getElementById('show-grid').checked
        };
        
        // Apply debug settings
        if (this.game.debugSettings) {
            Object.assign(this.game.debugSettings, settings);
        }
        
        this.log('Updated debug settings');
    }
    
    showStats() {
        if (this.game.stats) {
            this.game.stats.showPanel(0); // FPS
        }
        this.log('Showing performance stats');
    }
    
    profileFrame() {
        console.profile('Frame');
        requestAnimationFrame(() => {
            console.profileEnd('Frame');
            this.log('Frame profiled - check console');
        });
    }
    
    clearCache() {
        // Clear various caches
        if (this.game.renderer) {
            this.game.renderer.clear();
        }
        this.log('Cleared caches');
    }
    
    reloadShaders() {
        // Reload shader programs
        this.log('Reloaded shaders');
    }
    
    updateWorldInfo() {
        const info = document.getElementById('world-info');
        if (!info) return;
        
        const data = {
            'Player Position': this.game.player ? 
                `${this.game.player.position.x.toFixed(2)}, ${this.game.player.position.y.toFixed(2)}, ${this.game.player.position.z.toFixed(2)}` : 'N/A',
            'Current Area': this.game.world?.worldManager?.currentArea?.name || 'None',
            'Active Entities': this.game.entities?.size || 0,
            'Active Chunks': this.game.world?.worldManager?.activeChunks?.size || 0,
            'FPS': this.game.fps || 0,
            'Memory': `${(performance.memory?.usedJSHeapSize / 1048576).toFixed(2) || 'N/A'} MB`
        };
        
        info.innerHTML = Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('<br>');
    }
    
    // Console Commands
    registerCommands() {
        this.commands = {
            help: () => {
                this.log('Available commands:');
                this.log('  god - Toggle god mode');
                this.log('  fly - Toggle fly mode');
                this.log('  noclip - Toggle noclip');
                this.log('  tp <x> <y> <z> - Teleport to coordinates');
                this.log('  spawn <enemy> [level] - Spawn enemy');
                this.log('  kill all - Kill all enemies');
                this.log('  give <item> - Give item');
                this.log('  level <n> - Set level');
                this.log('  gold <n> - Add gold');
                this.log('  heal - Full heal');
                this.log('  clear - Clear console');
            },
            
            god: () => {
                this.toggleInvincible();
                this.setHealth(9999, 9999);
                this.setMana(9999, 9999);
            },
            
            fly: () => this.toggleFly(),
            noclip: () => this.toggleNoclip(),
            
            tp: (x, y, z) => {
                if (x && y && z && this.game.player) {
                    this.game.player.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
                    this.log(`Teleported to (${x}, ${y}, ${z})`);
                }
            },
            
            spawn: (enemyType, level = 1) => {
                if (enemyType && this.game.world?.worldManager?.entityFactory) {
                    const pos = this.getSpawnPosition();
                    const enemy = this.game.world.worldManager.entityFactory.createEnemy(enemyType, pos, parseInt(level));
                    if (enemy) {
                        this.game.world.worldManager.addEntity(enemy);
                        this.log(`Spawned ${enemyType} level ${level}`);
                    }
                }
            },
            
            kill: (target) => {
                if (target === 'all') {
                    this.killAllEnemies();
                }
            },
            
            give: (item) => {
                this.log(`Gave item: ${item}`);
            },
            
            level: (n) => {
                if (n) this.setLevel(parseInt(n));
            },
            
            gold: (n) => {
                if (n) this.addGold(parseInt(n));
            },
            
            heal: () => this.healFull(),
            
            clear: () => {
                document.getElementById('console-output').innerHTML = '';
            }
        };
    }
    
    executeCommand(input) {
        if (!input.trim()) return;
        
        // Add to history
        this.commandHistory.push(input);
        this.historyIndex = this.commandHistory.length;
        
        // Log command
        this.log(`> ${input}`, 'command');
        
        // Parse command
        const parts = input.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Execute command
        if (this.commands[cmd]) {
            try {
                this.commands[cmd](...args);
            } catch (error) {
                this.log(`Error: ${error.message}`, 'error');
            }
        } else {
            this.log(`Unknown command: ${cmd}`, 'error');
        }
    }
    
    navigateHistory(direction) {
        const input = document.getElementById('console-input');
        
        this.historyIndex += direction;
        this.historyIndex = Math.max(0, Math.min(this.historyIndex, this.commandHistory.length));
        
        if (this.historyIndex < this.commandHistory.length) {
            input.value = this.commandHistory[this.historyIndex];
        } else {
            input.value = '';
        }
    }
    
    log(message, type = 'info') {
        const output = document.getElementById('console-output');
        if (!output) return;
        
        const line = document.createElement('div');
        line.style.color = {
            'info': '#fff',
            'command': '#FFD700',
            'error': '#ff6666',
            'success': '#66ff66'
        }[type] || '#fff';
        
        line.textContent = message;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
        
        // Also log to browser console
        console.log(`[Admin] ${message}`);
    }
}

// Make available globally
window.AdminPanel = AdminPanel;
