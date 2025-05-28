// Quests.js - Quest and objective tracking system
class QuestSystem {
    constructor(game) {
        this.game = game;
        
        // Quest storage
        this.availableQuests = new Map();
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        
        // Quest chains
        this.questChains = new Map();
        
        // Initialize quests
        this.initializeQuests();
    }
    
    initializeQuests() {
        // Starter quests
        this.addQuest({
            id: 'q001',
            name: 'A Threat Within',
            giver: 'Marshal Dughan',
            level: 1,
            description: 'Marshal Dughan has asked you to seek out his deputy, Willem, in Northshire Abbey.',
            objectives: [
                {
                    type: 'talk',
                    target: 'Deputy Willem',
                    description: 'Speak with Deputy Willem',
                    required: 1,
                    current: 0
                }
            ],
            rewards: {
                experience: 170,
                gold: 0,
                items: []
            },
            prereq: null,
            chain: 'northshire'
        });
        
        this.addQuest({
            id: 'q002',
            name: 'Kobold Camp Cleanup',
            giver: 'Marshal Dughan',
            level: 3,
            description: 'Your first task is to thin the numbers of the Kobold Vermin north of the abbey.',
            objectives: [
                {
                    type: 'kill',
                    target: 'Kobold Vermin',
                    description: 'Kill Kobold Vermin',
                    required: 10,
                    current: 0
                }
            ],
            rewards: {
                experience: 250,
                gold: 50,
                items: [
                    {
                        name: 'Worn Leather Gloves',
                        type: 'armor',
                        slot: 'hands',
                        quality: 'common',
                        stats: { armor: 5, agility: 1 }
                    }
                ]
            },
            prereq: 'q001',
            chain: 'northshire'
        });
        
        this.addQuest({
            id: 'q003',
            name: 'Investigate Echo Ridge',
            giver: 'Marshal Dughan',
            level: 4,
            description: 'Marshal Dughan wants you to investigate the Kobold presence at Echo Ridge Mine.',
            objectives: [
                {
                    type: 'kill',
                    target: 'Kobold Worker',
                    description: 'Kill Kobold Workers',
                    required: 10,
                    current: 0
                },
                {
                    type: 'collect',
                    target: 'Large Candle',
                    description: 'Collect Large Candles',
                    required: 8,
                    current: 0
                }
            ],
            rewards: {
                experience: 360,
                gold: 75,
                items: [
                    {
                        name: 'Militia Quarterstaff',
                        type: 'weapon',
                        slot: 'mainhand',
                        quality: 'common',
                        stats: { attackPower: 8, stamina: 2 }
                    }
                ],
                reputation: {
                    faction: 'Stormwind',
                    amount: 250
                }
            },
            prereq: 'q002',
            chain: 'northshire'
        });
        
        this.addQuest({
            id: 'q004',
            name: 'Brotherhood of Thieves',
            giver: 'Deputy Willem',
            level: 2,
            description: 'Bring Deputy Willem the red bandanas of the Defias thugs.',
            objectives: [
                {
                    type: 'collect',
                    target: 'Red Defias Bandana',
                    description: 'Collect Red Defias Bandanas',
                    required: 12,
                    current: 0,
                    dropChance: 0.8,
                    dropFrom: ['Defias Thug']
                }
            ],
            rewards: {
                experience: 230,
                gold: 50,
                items: [
                    {
                        name: 'Footpad\'s Shoes',
                        type: 'armor',
                        slot: 'feet',
                        quality: 'common',
                        stats: { armor: 7, agility: 1 }
                    }
                ]
            },
            prereq: null,
            chain: 'defias'
        });
        
        this.addQuest({
            id: 'q005',
            name: 'Milly Osworth',
            giver: 'Deputy Willem',
            level: 3,
            description: 'Deputy Willem has asked you to bring Milly her grape harvest.',
            objectives: [
                {
                    type: 'deliver',
                    target: 'Milly Osworth',
                    item: 'Grape Harvest',
                    description: 'Deliver the Grape Harvest to Milly Osworth',
                    required: 1,
                    current: 0
                }
            ],
            rewards: {
                experience: 170,
                gold: 25,
                items: []
            },
            prereq: null,
            chain: 'northshire'
        });
        
        this.addQuest({
            id: 'q006',
            name: 'Bounty on Garrick Padfoot',
            giver: 'Deputy Willem',
            level: 5,
            description: 'Kill Garrick Padfoot and bring his head to Deputy Willem.',
            objectives: [
                {
                    type: 'kill',
                    target: 'Garrick Padfoot',
                    description: 'Kill Garrick Padfoot',
                    required: 1,
                    current: 0,
                    boss: true
                },
                {
                    type: 'collect',
                    target: 'Garrick\'s Head',
                    description: 'Bring Garrick\'s Head to Deputy Willem',
                    required: 1,
                    current: 0,
                    dropChance: 1.0,
                    dropFrom: ['Garrick Padfoot']
                }
            ],
            rewards: {
                experience: 450,
                gold: 100,
                items: [
                    {
                        name: 'Outfitter Gloves',
                        type: 'armor',
                        slot: 'hands',
                        quality: 'uncommon',
                        stats: { armor: 10, strength: 2, stamina: 1 }
                    }
                ],
                reputation: {
                    faction: 'Stormwind',
                    amount: 350
                }
            },
            prereq: 'q004',
            chain: 'defias'
        });
        
        // Elwynn Forest quests
        this.addQuest({
            id: 'q101',
            name: 'A Swift Message',
            giver: 'Marshal Dughan',
            level: 7,
            description: 'Marshal Dughan wants you to deliver a message to Lewis at the inn in Goldshire.',
            objectives: [
                {
                    type: 'deliver',
                    target: 'Lewis',
                    item: 'Marshal\'s Documents',
                    description: 'Deliver the message to Lewis in Goldshire',
                    required: 1,
                    current: 0
                }
            ],
            rewards: {
                experience: 210,
                gold: 40,
                items: []
            },
            prereq: 'q003',
            chain: 'elwynn'
        });
        
        this.addQuest({
            id: 'q102',
            name: 'The Fargodeep Mine',
            giver: 'Marshal Dughan',
            level: 9,
            description: 'Explore the Fargodeep Mine and discover what has happened to the miners.',
            objectives: [
                {
                    type: 'explore',
                    target: 'Fargodeep Mine',
                    description: 'Scout through the Fargodeep Mine',
                    required: 1,
                    current: 0,
                    location: { x: -9798, y: 0, z: -978 }
                }
            ],
            rewards: {
                experience: 540,
                gold: 150,
                items: [
                    {
                        name: 'Stormwind Guard Leggings',
                        type: 'armor',
                        slot: 'legs',
                        quality: 'uncommon',
                        stats: { armor: 25, strength: 3, stamina: 3 }
                    }
                ]
            },
            prereq: 'q101',
            chain: 'elwynn'
        });
        
        this.addQuest({
            id: 'q103',
            name: 'Goldshire Inn',
            giver: 'Lewis',
            level: 7,
            description: 'Lewis has asked you to speak with Innkeeper Farley about the recent troubles.',
            objectives: [
                {
                    type: 'talk',
                    target: 'Innkeeper Farley',
                    description: 'Speak with Innkeeper Farley',
                    required: 1,
                    current: 0
                }
            ],
            rewards: {
                experience: 85,
                gold: 0,
                items: [
                    {
                        name: 'Refreshing Spring Water',
                        type: 'consumable',
                        stackable: true,
                        stackSize: 5,
                        effect: { mana: 150 }
                    }
                ]
            },
            prereq: 'q101',
            chain: 'elwynn'
        });
    }
    
    addQuest(questData) {
        const quest = new Quest(questData);
        this.availableQuests.set(quest.id, quest);
        
        if (quest.chain) {
            if (!this.questChains.has(quest.chain)) {
                this.questChains.set(quest.chain, []);
            }
            this.questChains.get(quest.chain).push(quest.id);
        }
    }
    
    acceptQuest(questId) {
        const quest = this.availableQuests.get(questId);
        if (!quest) {
            this.game.ui.showError('Quest not found');
            return false;
        }
        
        // Check prerequisites
        if (quest.prereq && !this.completedQuests.has(quest.prereq)) {
            this.game.ui.showError('You must complete previous quests first');
            return false;
        }
        
        // Check level requirement
        if (this.game.player.level < quest.level - 2) {
            this.game.ui.showError(`This quest requires level ${quest.level - 2}`);
            return false;
        }
        
        // Check if already accepted
        if (this.activeQuests.has(questId)) {
            this.game.ui.showError('Quest already accepted');
            return false;
        }
        
        // Add to active quests
        this.activeQuests.set(questId, quest);
        
        // Give quest items if any
        quest.objectives.forEach(obj => {
            if (obj.type === 'deliver' && obj.item) {
                this.game.inventory.addItem({
                    name: obj.item,
                    type: 'quest',
                    description: 'Quest Item',
                    quality: 'common'
                });
            }
        });
        
        // Show notification
        this.game.ui.showNotification(`Quest accepted: ${quest.name}`);
        this.game.ui.addChatMessage('general', 'Quest', 
            `Quest accepted: ${quest.name}`, '#ffcc00');
        
        // Update quest log
        this.game.ui.updateQuestLog();
        
        return true;
    }
    
    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) {
            this.game.ui.showError('Quest not found');
            return false;
        }
        
        // Check if all objectives are completed
        if (!quest.isComplete()) {
            this.game.ui.showError('Quest objectives not completed');
            return false;
        }
        
        // Remove quest items
        quest.objectives.forEach(obj => {
            if (obj.type === 'collect' || obj.type === 'deliver') {
                const item = this.game.inventory.findItem(obj.target || obj.item);
                if (item) {
                    this.game.inventory.removeItem(item.slot, obj.required);
                }
            }
        });
        
        // Award rewards
        const player = this.game.player;
        
        // Experience
        player.gainExperience(quest.rewards.experience);
        
        // Gold
        if (quest.rewards.gold > 0) {
            player.addCurrency(quest.rewards.gold);
        }
        
        // Items
        quest.rewards.items.forEach(item => {
            if (!this.game.inventory.addItem(item)) {
                // Mail items if inventory full
                this.game.ui.showNotification('Some reward items were mailed to you');
            }
        });
        
        // Reputation
        if (quest.rewards.reputation) {
            player.gainReputation(
                quest.rewards.reputation.faction,
                quest.rewards.reputation.amount
            );
        }
        
        // Move to completed
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        
        // Show completion notification
        this.game.ui.showNotification(`Quest completed: ${quest.name}`);
        this.game.ui.addChatMessage('general', 'Quest', 
            `Quest completed: ${quest.name}`, '#ffcc00');
        
        // Check for follow-up quests
        this.checkNewQuests();
        
        // Update quest log
        this.game.ui.updateQuestLog();
        
        // Update stats
        this.game.stats.questsCompleted++;
        
        return true;
    }
    
    abandonQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;
        
        // Remove quest items
        quest.objectives.forEach(obj => {
            if (obj.type === 'deliver' && obj.item) {
                const item = this.game.inventory.findItem(obj.item);
                if (item && item.item.type === 'quest') {
                    this.game.inventory.removeItem(item.slot);
                }
            }
        });
        
        // Remove from active quests
        this.activeQuests.delete(questId);
        
        // Reset objectives
        quest.resetObjectives();
        
        this.game.ui.showNotification(`Quest abandoned: ${quest.name}`);
        this.game.ui.updateQuestLog();
        
        return true;
    }
    
    updateObjective(objectiveType, target, amount = 1) {
        let updated = false;
        
        this.activeQuests.forEach(quest => {
            quest.objectives.forEach(obj => {
                if (obj.type === objectiveType && 
                    obj.target === target && 
                    obj.current < obj.required) {
                    
                    obj.current = Math.min(obj.current + amount, obj.required);
                    obj.completed = obj.current >= obj.required;
                    updated = true;
                    
                    // Show progress
                    this.game.ui.showNotification(
                        `${obj.description}: ${obj.current}/${obj.required}`
                    );
                    
                    // Check if quest is complete
                    if (quest.isComplete()) {
                        this.game.ui.showNotification(
                            `Quest ready for turn-in: ${quest.name}`
                        );
                        this.game.ui.addChatMessage('general', 'Quest',
                            `${quest.name} completed! Return to ${quest.giver}`,
                            '#ffcc00'
                        );
                    }
                }
            });
        });
        
        if (updated) {
            this.game.ui.updateQuestLog();
        }
        
        return updated;
    }
    
    checkKillObjective(enemy) {
        this.updateObjective('kill', enemy.name);
        
        // Check for quest item drops
        this.activeQuests.forEach(quest => {
            quest.objectives.forEach(obj => {
                if (obj.type === 'collect' && obj.dropFrom && 
                    obj.dropFrom.includes(enemy.name)) {
                    
                    if (Math.random() < (obj.dropChance || 0.5)) {
                        const questItem = {
                            name: obj.target,
                            type: 'quest',
                            quality: 'common',
                            description: 'Quest Item'
                        };
                        
                        if (!enemy.loot) enemy.loot = [];
                        enemy.loot.push(questItem);
                    }
                }
            });
        });
    }
    
    checkCollectObjective(itemName) {
        this.updateObjective('collect', itemName);
    }
    
    checkExploreObjective(position) {
        this.activeQuests.forEach(quest => {
            quest.objectives.forEach(obj => {
                if (obj.type === 'explore' && obj.location && !obj.completed) {
                    const distance = position.distanceTo(
                        new THREE.Vector3(
                            obj.location.x,
                            position.y,
                            obj.location.z
                        )
                    );
                    
                    if (distance < 20) {
                        obj.current = 1;
                        obj.completed = true;
                        
                        this.game.ui.showNotification(
                            `Discovered: ${obj.target}`
                        );
                        
                        this.game.ui.updateQuestLog();
                    }
                }
            });
        });
    }
    
    checkTalkObjective(npcName) {
        this.updateObjective('talk', npcName);
    }
    
    checkDeliverObjective(npcName, itemName) {
        const hasItem = this.game.inventory.countItem(itemName) > 0;
        if (hasItem) {
            this.updateObjective('deliver', npcName);
        }
    }
    
    checkNewQuests() {
        // Check for newly available quests
        this.availableQuests.forEach((quest, questId) => {
            if (!this.activeQuests.has(questId) && 
                !this.completedQuests.has(questId)) {
                
                // Check if prerequisites are met
                if (!quest.prereq || this.completedQuests.has(quest.prereq)) {
                    // Notify player of new quest
                    const npc = this.game.npcs.get(quest.giver);
                    if (npc) {
                        npc.hasQuest = true;
                        npc.questId = questId;
                    }
                }
            }
        });
    }
    
    getQuestForNPC(npcName) {
        // Check for quests to turn in
        for (const [questId, quest] of this.activeQuests) {
            if (quest.giver === npcName && quest.isComplete()) {
                return { quest, turnIn: true };
            }
        }
        
        // Check for new quests
        for (const [questId, quest] of this.availableQuests) {
            if (quest.giver === npcName && 
                !this.activeQuests.has(questId) &&
                !this.completedQuests.has(questId) &&
                (!quest.prereq || this.completedQuests.has(quest.prereq))) {
                
                return { quest, turnIn: false };
            }
        }
        
        return null;
    }
    
    getQuestForItem(itemName) {
        for (const [questId, quest] of this.activeQuests) {
            for (const obj of quest.objectives) {
                if ((obj.type === 'collect' && obj.target === itemName) ||
                    (obj.type === 'deliver' && obj.item === itemName)) {
                    return quest;
                }
            }
        }
        return null;
    }
    
    useQuestItem(quest, item) {
        // Handle special quest item usage
        // This could trigger events, summon creatures, etc.
        this.game.ui.showNotification(`Used ${item.name}`);
    }
    
    showQuestDialog(npc) {
        const questData = this.getQuestForNPC(npc.name);
        if (!questData) {
            this.game.ui.showError('No quests available');
            return;
        }
        
        const { quest, turnIn } = questData;
        
        // Create quest dialog window
        const dialog = document.createElement('div');
        dialog.className = 'quest-dialog';
        dialog.innerHTML = `
            <div class="quest-dialog-header">
                <h2>${npc.name}</h2>
                <button class="close-btn">×</button>
            </div>
            <div class="quest-dialog-content">
                <h3>${quest.name}</h3>
                ${turnIn ? '<p class="quest-complete">Quest Complete!</p>' : ''}
                <p class="quest-description">${quest.description}</p>
                
                ${!turnIn ? `
                    <h4>Objectives:</h4>
                    <ul class="objectives-preview">
                        ${quest.objectives.map(obj => 
                            `<li>${obj.description}</li>`
                        ).join('')}
                    </ul>
                ` : ''}
                
                <h4>Rewards:</h4>
                <div class="quest-rewards">
                    ${quest.rewards.experience ? 
                        `<p>Experience: ${quest.rewards.experience} XP</p>` : ''}
                    ${quest.rewards.gold ? 
                        `<p>Gold: ${quest.rewards.gold}g</p>` : ''}
                    ${quest.rewards.items.length > 0 ? `
                        <p>Items:</p>
                        <div class="reward-items">
                            ${quest.rewards.items.map(item => `
                                <div class="reward-item" 
                                     style="color: ${this.game.ui.getItemQualityColor(item.quality)}">
                                    ${item.icon || '📦'} ${item.name}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="quest-dialog-actions">
                ${turnIn ? 
                    `<button class="complete-btn">Complete Quest</button>` :
                    `<button class="accept-btn">Accept Quest</button>`
                }
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        
        document.getElementById('ui-overlay').appendChild(dialog);
        
        // Event listeners
        dialog.querySelector('.close-btn').addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            dialog.remove();
        });
        
        if (turnIn) {
            dialog.querySelector('.complete-btn').addEventListener('click', () => {
                this.completeQuest(quest.id);
                dialog.remove();
            });
        } else {
            dialog.querySelector('.accept-btn').addEventListener('click', () => {
                this.acceptQuest(quest.id);
                dialog.remove();
            });
        }
        
        // Add item tooltips
        dialog.querySelectorAll('.reward-item').forEach((element, index) => {
            const item = quest.rewards.items[index];
            element.addEventListener('mouseenter', () => {
                this.game.ui.showTooltip(element, 
                    this.game.ui.createItemTooltip(item));
            });
            element.addEventListener('mouseleave', () => {
                this.game.ui.hideTooltip();
            });
        });
    }
    
    // Save/Load quest progress
    save() {
        const data = {
            active: {},
            completed: Array.from(this.completedQuests)
        };
        
        this.activeQuests.forEach((quest, id) => {
            data.active[id] = {
                objectives: quest.objectives.map(obj => ({
                    current: obj.current,
                    completed: obj.completed
                }))
            };
        });
        
        return data;
    }
    
    load(data) {
        if (data.completed) {
            this.completedQuests = new Set(data.completed);
        }
        
        if (data.active) {
            Object.entries(data.active).forEach(([questId, questData]) => {
                const quest = this.availableQuests.get(questId);
                if (quest) {
                    this.activeQuests.set(questId, quest);
                    
                    // Restore objective progress
                    questData.objectives.forEach((objData, index) => {
                        if (quest.objectives[index]) {
                            quest.objectives[index].current = objData.current;
                            quest.objectives[index].completed = objData.completed;
                        }
                    });
                }
            });
        }
        
        this.checkNewQuests();
    }
}

// Quest class
class Quest {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.giver = data.giver;
        this.level = data.level;
        this.description = data.description;
        this.objectives = data.objectives.map(obj => ({...obj, completed: false}));
        this.rewards = data.rewards;
        this.prereq = data.prereq;
        this.chain = data.chain;
        this.repeatable = data.repeatable || false;
        this.daily = data.daily || false;
    }
    
    isComplete() {
        return this.objectives.every(obj => obj.completed);
    }
    
    resetObjectives() {
        this.objectives.forEach(obj => {
            obj.current = 0;
            obj.completed = false;
        });
    }
}
