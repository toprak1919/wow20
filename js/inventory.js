// Inventory.js - Inventory management system
class Inventory {
    constructor(game) {
        this.game = game;
        
        // Inventory settings
        this.maxSlots = 20;
        this.items = new Map();
        
        // Initialize empty slots
        for (let i = 0; i < this.maxSlots; i++) {
            this.items.set(i, null);
        }
    }
    
    addItem(item) {
        // Check if item is stackable and already exists
        if (item.stackable) {
            for (const [slot, existingItem] of this.items) {
                if (existingItem && existingItem.name === item.name) {
                    const maxStack = item.maxStack || 20;
                    const canAdd = maxStack - existingItem.stackSize;
                    
                    if (canAdd > 0) {
                        const toAdd = Math.min(canAdd, item.stackSize || 1);
                        existingItem.stackSize += toAdd;
                        
                        // Update UI
                        this.game.ui.updateInventory();
                        
                        // If we added all items, return true
                        if (toAdd >= (item.stackSize || 1)) {
                            return true;
                        }
                        
                        // Otherwise, reduce the stack we're trying to add
                        item.stackSize -= toAdd;
                    }
                }
            }
        }
        
        // Find first empty slot
        for (const [slot, existingItem] of this.items) {
            if (!existingItem) {
                // Set default values
                if (!item.stackSize) item.stackSize = 1;
                if (!item.quality) item.quality = 'common';
                if (!item.id) item.id = this.generateItemId();
                
                this.items.set(slot, item);
                
                // Update UI
                this.game.ui.updateInventory();
                
                // Show notification
                this.game.ui.showNotification(`Added ${item.name} to inventory`);
                
                return true;
            }
        }
        
        // Inventory full
        this.game.ui.showError('Inventory is full!');
        return false;
    }
    
    removeItem(slot, amount = null) {
        const item = this.items.get(slot);
        if (!item) return null;
        
        if (amount && item.stackSize > amount) {
            // Remove partial stack
            item.stackSize -= amount;
            const removedItem = {...item, stackSize: amount};
            
            // Update UI
            this.game.ui.updateInventory();
            
            return removedItem;
        } else {
            // Remove entire item
            this.items.set(slot, null);
            
            // Update UI
            this.game.ui.updateInventory();
            
            return item;
        }
    }
    
    moveItem(fromSlot, toSlot) {
        const fromItem = this.items.get(fromSlot);
        const toItem = this.items.get(toSlot);
        
        if (!fromItem) return;
        
        // If target slot has same stackable item
        if (toItem && fromItem.stackable && fromItem.name === toItem.name) {
            const maxStack = fromItem.maxStack || 20;
            const canAdd = maxStack - toItem.stackSize;
            
            if (canAdd > 0) {
                const toAdd = Math.min(canAdd, fromItem.stackSize);
                toItem.stackSize += toAdd;
                fromItem.stackSize -= toAdd;
                
                if (fromItem.stackSize <= 0) {
                    this.items.set(fromSlot, null);
                }
            }
        } else {
            // Swap items
            this.items.set(fromSlot, toItem);
            this.items.set(toSlot, fromItem);
        }
        
        // Update UI
        this.game.ui.updateInventory();
    }
    
    useItem(slot) {
        const item = this.items.get(slot);
        if (!item) return;
        
        switch (item.type) {
            case 'consumable':
                this.useConsumable(item, slot);
                break;
            case 'equipment':
            case 'weapon':
            case 'armor':
                this.equipItem(item, slot);
                break;
            case 'quest':
                this.useQuestItem(item, slot);
                break;
            default:
                this.game.ui.showError('Cannot use this item');
        }
    }
    
    useConsumable(item, slot) {
        const player = this.game.player;
        
        // Check if player can use item
        if (player.isCasting) {
            this.game.ui.showError('Cannot use while casting');
            return;
        }
        
        if (item.level && player.level < item.level) {
            this.game.ui.showError(`Requires level ${item.level}`);
            return;
        }
        
        // Apply item effects
        if (item.effect) {
            if (item.effect.heal) {
                this.game.combat.heal(player, player, item.effect.heal, item.name);
            }
            
            if (item.effect.mana) {
                player.mana = Math.min(player.maxMana, player.mana + item.effect.mana);
                this.game.ui.showCombatText(`+${item.effect.mana} Mana`, 'mana');
            }
            
            if (item.effect.buff) {
                player.applyBuff(item.name, item.effect.buff);
            }
            
            if (item.effect.teleport) {
                // Teleport to location
                const location = item.effect.teleport;
                player.position.set(location.x, location.y, location.z);
            }
        }
        
        // Consume item
        this.removeItem(slot, 1);
        
        // Trigger cooldown
        if (item.cooldown) {
            player.itemCooldowns.set(item.name, Date.now() + item.cooldown * 1000);
        }
    }
    
    equipItem(item, slot) {
        if (!item.slot) {
            this.game.ui.showError('This item cannot be equipped');
            return;
        }
        
        // Check requirements
        if (item.level && this.game.player.level < item.level) {
            this.game.ui.showError(`Requires level ${item.level}`);
            return;
        }
        
        if (item.class && item.class !== this.game.player.class) {
            this.game.ui.showError(`Requires ${item.class} class`);
            return;
        }
        
        // Equip item
        this.game.player.equipItem(item, item.slot);
        
        // Remove from inventory
        this.removeItem(slot);
    }
    
    useQuestItem(item, slot) {
        // Check if item is for active quest
        const quest = this.game.quests.getQuestForItem(item.name);
        
        if (quest) {
            // Use quest item
            this.game.quests.useQuestItem(quest, item);
            
            // Some quest items are consumed
            if (item.consumed) {
                this.removeItem(slot, 1);
            }
        } else {
            this.game.ui.showError('Cannot use this item right now');
        }
    }
    
    findItem(itemName) {
        for (const [slot, item] of this.items) {
            if (item && item.name === itemName) {
                return { slot, item };
            }
        }
        return null;
    }
    
    countItem(itemName) {
        let count = 0;
        
        for (const [slot, item] of this.items) {
            if (item && item.name === itemName) {
                count += item.stackSize || 1;
            }
        }
        
        return count;
    }
    
    hasSpace() {
        for (const [slot, item] of this.items) {
            if (!item) return true;
        }
        return false;
    }
    
    getFreeSlots() {
        let count = 0;
        for (const [slot, item] of this.items) {
            if (!item) count++;
        }
        return count;
    }
    
    sortInventory() {
        const items = [];
        
        // Collect all items
        for (const [slot, item] of this.items) {
            if (item) {
                items.push(item);
                this.items.set(slot, null);
            }
        }
        
        // Sort by type, quality, then name
        items.sort((a, b) => {
            if (a.type !== b.type) {
                return this.getTypeOrder(a.type) - this.getTypeOrder(b.type);
            }
            if (a.quality !== b.quality) {
                return this.getQualityOrder(b.quality) - this.getQualityOrder(a.quality);
            }
            return a.name.localeCompare(b.name);
        });
        
        // Merge stacks
        const mergedItems = [];
        items.forEach(item => {
            if (item.stackable) {
                const existing = mergedItems.find(i => i.name === item.name);
                if (existing) {
                    const maxStack = item.maxStack || 20;
                    const canAdd = maxStack - existing.stackSize;
                    if (canAdd > 0) {
                        const toAdd = Math.min(canAdd, item.stackSize);
                        existing.stackSize += toAdd;
                        item.stackSize -= toAdd;
                    }
                }
            }
            
            if (!item.stackable || item.stackSize > 0) {
                mergedItems.push(item);
            }
        });
        
        // Place back in inventory
        mergedItems.forEach((item, index) => {
            if (index < this.maxSlots) {
                this.items.set(index, item);
            }
        });
        
        // Update UI
        this.game.ui.updateInventory();
    }
    
    getTypeOrder(type) {
        const order = {
            'weapon': 0,
            'armor': 1,
            'equipment': 2,
            'consumable': 3,
            'material': 4,
            'quest': 5,
            'misc': 6
        };
        return order[type] || 999;
    }
    
    getQualityOrder(quality) {
        const order = {
            'legendary': 6,
            'epic': 5,
            'rare': 4,
            'uncommon': 3,
            'common': 2,
            'poor': 1
        };
        return order[quality] || 0;
    }
    
    generateItemId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    sellItem(slot) {
        const item = this.items.get(slot);
        if (!item) return;
        
        if (item.type === 'quest') {
            this.game.ui.showError('Cannot sell quest items');
            return;
        }
        
        const sellPrice = item.sellPrice || Math.floor((item.price || 1) * 0.25);
        
        // Add currency
        this.game.player.addCurrency(sellPrice);
        
        // Remove item
        this.removeItem(slot, 1);
        
        // Show notification
        this.game.ui.showNotification(`Sold ${item.name} for ${this.game.ui.formatPrice(sellPrice)}`);
    }
    
    destroyItem(slot) {
        const item = this.items.get(slot);
        if (!item) return;
        
        if (item.type === 'quest') {
            this.game.ui.showError('Cannot destroy quest items');
            return;
        }
        
        // Confirm destruction of rare+ items
        if (this.getQualityOrder(item.quality) >= 4) {
            if (!confirm(`Are you sure you want to destroy ${item.name}?`)) {
                return;
            }
        }
        
        // Remove item
        this.removeItem(slot);
        
        // Show notification
        this.game.ui.showNotification(`Destroyed ${item.name}`);
    }
    
    splitStack(slot, amount) {
        const item = this.items.get(slot);
        if (!item || !item.stackable || item.stackSize <= amount) return;
        
        // Find empty slot for split stack
        let targetSlot = null;
        for (const [s, i] of this.items) {
            if (!i) {
                targetSlot = s;
                break;
            }
        }
        
        if (targetSlot === null) {
            this.game.ui.showError('No space to split stack');
            return;
        }
        
        // Create new stack
        const newStack = {...item, stackSize: amount};
        item.stackSize -= amount;
        
        this.items.set(targetSlot, newStack);
        
        // Update UI
        this.game.ui.updateInventory();
    }
    
    // Save/Load inventory
    save() {
        const data = {
            items: {}
        };
        
        for (const [slot, item] of this.items) {
            if (item) {
                data.items[slot] = item;
            }
        }
        
        return data;
    }
    
    load(data) {
        if (data.items) {
            for (let i = 0; i < this.maxSlots; i++) {
                this.items.set(i, data.items[i] || null);
            }
        }
        
        // Update UI
        this.game.ui.updateInventory();
    }
}

// Loot system
class LootSystem {
    constructor(game) {
        this.game = game;
        this.lootRange = 5;
    }
    
    showLootWindow(entity) {
        if (!entity.loot || entity.loot.length === 0) {
            this.game.ui.showError('Nothing to loot');
            return;
        }
        
        // Check range
        const distance = this.game.player.position.distanceTo(entity.position);
        if (distance > this.lootRange) {
            this.game.ui.showError('Too far away');
            return;
        }
        
        // Create loot window
        const lootWindow = document.createElement('div');
        lootWindow.className = 'game-window loot-window';
        lootWindow.innerHTML = `
            <div class="window-header">
                <span>${entity.name || 'Loot'}</span>
                <button class="close-btn">×</button>
            </div>
            <div class="loot-items">
                ${entity.loot.map((item, index) => `
                    <div class="loot-item" data-index="${index}">
                        <span class="item-icon" style="color: ${this.game.ui.getItemQualityColor(item.quality || 'common')}">
                            ${item.icon || '📦'}
                        </span>
                        <span class="item-name">${item.name}</span>
                        ${item.stackSize > 1 ? `<span class="stack-count">x${item.stackSize}</span>` : ''}
                        <button class="loot-btn" data-index="${index}">Take</button>
                    </div>
                `).join('')}
            </div>
            <button class="loot-all-btn">Loot All</button>
        `;
        
        document.getElementById('ui-overlay').appendChild(lootWindow);
        
        // Position near entity
        const screenPos = this.game.ui.worldToScreen(entity.position);
        lootWindow.style.left = screenPos.x + 'px';
        lootWindow.style.top = screenPos.y + 'px';
        
        // Event listeners
        lootWindow.querySelector('.close-btn').addEventListener('click', () => {
            lootWindow.remove();
        });
        
        lootWindow.querySelectorAll('.loot-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.lootItem(entity, index);
                
                // Update window
                if (entity.loot.length === 0) {
                    lootWindow.remove();
                } else {
                    this.updateLootWindow(lootWindow, entity);
                }
            });
        });
        
        lootWindow.querySelector('.loot-all-btn').addEventListener('click', () => {
            this.lootAll(entity);
            lootWindow.remove();
        });
        
        // Add tooltips
        lootWindow.querySelectorAll('.loot-item').forEach((element, index) => {
            element.addEventListener('mouseenter', () => {
                this.game.ui.showTooltip(element, 
                    this.game.ui.createItemTooltip(entity.loot[index]));
            });
            
            element.addEventListener('mouseleave', () => {
                this.game.ui.hideTooltip();
            });
        });
    }
    
    lootItem(entity, index) {
        const item = entity.loot[index];
        if (!item) return;
        
        // Try to add to inventory
        if (this.game.inventory.addItem(item)) {
            // Remove from loot
            entity.loot.splice(index, 1);
            
            // If no more loot, remove lootable flag
            if (entity.loot.length === 0) {
                entity.lootable = false;
                
                // Start despawn timer for corpse
                this.startDespawnTimer(entity);
            }
        }
    }
    
    lootAll(entity) {
        const itemsToLoot = [...entity.loot];
        entity.loot = [];
        
        itemsToLoot.forEach(item => {
            if (!this.game.inventory.addItem(item)) {
                // Put back items that couldn't be looted
                entity.loot.push(item);
            }
        });
        
        if (entity.loot.length === 0) {
            entity.lootable = false;
            this.startDespawnTimer(entity);
        } else {
            this.game.ui.showError('Inventory full - some items remain');
        }
    }
    
    updateLootWindow(window, entity) {
        const itemsContainer = window.querySelector('.loot-items');
        itemsContainer.innerHTML = entity.loot.map((item, index) => `
            <div class="loot-item" data-index="${index}">
                <span class="item-icon" style="color: ${this.game.ui.getItemQualityColor(item.quality || 'common')}">
                    ${item.icon || '📦'}
                </span>
                <span class="item-name">${item.name}</span>
                ${item.stackSize > 1 ? `<span class="stack-count">x${item.stackSize}</span>` : ''}
                <button class="loot-btn" data-index="${index}">Take</button>
            </div>
        `).join('');
        
        // Re-add event listeners
        itemsContainer.querySelectorAll('.loot-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.lootItem(entity, index);
                
                if (entity.loot.length === 0) {
                    window.remove();
                } else {
                    this.updateLootWindow(window, entity);
                }
            });
        });
    }
    
    startDespawnTimer(entity) {
        setTimeout(() => {
            if (entity && !entity.lootable && !entity.alive) {
                // Fade out and remove
                const fadeOut = () => {
                    if (entity.mesh) {
                        entity.mesh.material.opacity -= 0.02;
                        if (entity.mesh.material.opacity <= 0) {
                            this.game.removeEntity(entity.id);
                        } else {
                            requestAnimationFrame(fadeOut);
                        }
                    }
                };
                
                if (entity.mesh && entity.mesh.material) {
                    entity.mesh.material.transparent = true;
                    fadeOut();
                }
            }
        }, 30000); // 30 seconds
    }
    
    // Generate random loot
    generateRandomLoot(level, quality = 'common') {
        const lootTables = {
            weapon: [
                { name: 'Rusty Sword', icon: '🗡️', slot: 'mainhand', type: 'weapon' },
                { name: 'Worn Dagger', icon: '🔪', slot: 'mainhand', type: 'weapon' },
                { name: 'Cracked Staff', icon: '🪄', slot: 'mainhand', type: 'weapon' }
            ],
            armor: [
                { name: 'Tattered Cloth Armor', icon: '👕', slot: 'chest', type: 'armor' },
                { name: 'Worn Leather Boots', icon: '👢', slot: 'feet', type: 'armor' },
                { name: 'Damaged Shield', icon: '🛡️', slot: 'offhand', type: 'armor' }
            ],
            consumable: [
                { name: 'Minor Health Potion', icon: '🧪', type: 'consumable', 
                  effect: { heal: 50 }, stackable: true, maxStack: 20 },
                { name: 'Bread', icon: '🍞', type: 'consumable', 
                  effect: { heal: 25 }, stackable: true, maxStack: 20 },
                { name: 'Spring Water', icon: '💧', type: 'consumable', 
                  effect: { mana: 50 }, stackable: true, maxStack: 20 }
            ],
            material: [
                { name: 'Linen Cloth', icon: '🧵', type: 'material', stackable: true, maxStack: 20 },
                { name: 'Copper Ore', icon: '🪨', type: 'material', stackable: true, maxStack: 20 },
                { name: 'Light Leather', icon: '🟫', type: 'material', stackable: true, maxStack: 20 }
            ]
        };
        
        // Choose random category
        const categories = Object.keys(lootTables);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const items = lootTables[category];
        const item = {...items[Math.floor(Math.random() * items.length)]};
        
        // Adjust item level and stats
        item.level = level;
        item.quality = quality;
        
        if (item.type === 'weapon' || item.type === 'armor') {
            item.stats = this.generateItemStats(level, quality);
            item.price = this.calculateItemPrice(level, quality);
        }
        
        return item;
    }
    
    generateItemStats(level, quality) {
        const qualityMultipliers = {
            poor: 0.5,
            common: 1,
            uncommon: 1.25,
            rare: 1.5,
            epic: 2,
            legendary: 3
        };
        
        const multiplier = qualityMultipliers[quality] || 1;
        const baseStats = Math.floor(level * multiplier);
        
        const stats = {};
        
        // Random primary stat
        const primaryStats = ['strength', 'agility', 'intellect'];
        const primaryStat = primaryStats[Math.floor(Math.random() * primaryStats.length)];
        stats[primaryStat] = Math.floor(baseStats * (0.8 + Math.random() * 0.4));
        
        // Stamina
        stats.stamina = Math.floor(baseStats * (0.6 + Math.random() * 0.3));
        
        // Random secondary stats for uncommon+
        if (quality !== 'poor' && quality !== 'common') {
            if (Math.random() < 0.5) {
                stats.critChance = (0.5 + Math.random() * 0.5) * multiplier;
            }
            if (Math.random() < 0.3) {
                stats.haste = Math.floor(baseStats * 0.3);
            }
        }
        
        return stats;
    }
    
    calculateItemPrice(level, quality) {
        const basePrice = level * 50;
        const qualityMultipliers = {
            poor: 0.1,
            common: 1,
            uncommon: 3,
            rare: 10,
            epic: 50,
            legendary: 200
        };
        
        return Math.floor(basePrice * (qualityMultipliers[quality] || 1));
    }
}
