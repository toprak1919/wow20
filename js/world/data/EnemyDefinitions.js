// EnemyDefinitions.js - Enemy type definitions
const EnemyDefinitions = {
    // Forest enemies
    wolf: {
        name: 'Gray Wolf',
        level: 2,
        baseHealth: 75,
        baseAttackPower: 8,
        baseArmor: 5,
        moveSpeed: 4,
        attackRange: 2,
        aggroRange: 12,
        color: 0x696969,
        faction: 'hostile',
        aiType: 'aggressive',
        lootTable: [
            {
                chance: 0.4,
                item: { name: 'Wolf Pelt', type: 'material', stackable: true }
            },
            {
                chance: 0.2,
                item: { name: 'Sharp Claw', type: 'material', stackable: true }
            },
            {
                chance: 0.1,
                item: { name: 'Wolf Meat', type: 'consumable', stackable: true }
            }
        ]
    },
    
    bear: {
        name: 'Black Bear',
        level: 4,
        baseHealth: 150,
        baseAttackPower: 15,
        baseArmor: 8,
        moveSpeed: 3,
        attackRange: 2,
        aggroRange: 8,
        color: 0x2F1B14,
        faction: 'hostile',
        aiType: 'territorial',
        lootTable: [
            {
                chance: 0.5,
                item: { name: 'Bear Hide', type: 'material', stackable: true }
            },
            {
                chance: 0.3,
                item: { name: 'Bear Meat', type: 'consumable', stackable: true }
            }
        ]
    },
    
    spider: {
        name: 'Forest Spider',
        level: 1,
        baseHealth: 45,
        baseAttackPower: 6,
        baseArmor: 2,
        moveSpeed: 3.5,
        attackRange: 2,
        aggroRange: 10,
        color: 0x2F4F4F,
        faction: 'hostile',
        aiType: 'ambush',
        abilities: ['poison_bite'],
        lootTable: [
            {
                chance: 0.6,
                item: { name: 'Spider Silk', type: 'material', stackable: true }
            },
            {
                chance: 0.2,
                item: { name: 'Venom Sac', type: 'alchemy', stackable: true }
            }
        ]
    },
    
    kobold: {
        name: 'Kobold Vermin',
        level: 1,
        baseHealth: 50,
        baseAttackPower: 5,
        baseArmor: 0,
        moveSpeed: 3,
        attackRange: 2,
        aggroRange: 10,
        color: 0x8B4513,
        faction: 'hostile',
        aiType: 'cowardly',
        lootTable: [
            {
                chance: 0.3,
                item: { name: 'Linen Cloth', type: 'material', stackable: true }
            },
            {
                chance: 0.1,
                item: { name: 'Broken Candle', type: 'misc', value: 5 }
            },
            {
                chance: 0.05,
                item: { name: 'Crude Dagger', type: 'weapon', quality: 'poor' }
            }
        ]
    },
    
    defias_thug: {
        name: 'Defias Thug',
        level: 3,
        baseHealth: 100,
        baseAttackPower: 12,
        baseArmor: 10,
        moveSpeed: 3.5,
        attackRange: 2,
        aggroRange: 10,
        color: 0x800000,
        faction: 'hostile',
        aiType: 'aggressive',
        abilities: ['bandage_self'],
        lootTable: [
            {
                chance: 0.8,
                item: { name: 'Red Defias Bandana', type: 'quest', quality: 'common' }
            },
            {
                chance: 0.15,
                item: { name: 'Worn Dagger', type: 'weapon', slot: 'mainhand', quality: 'common' }
            },
            {
                chance: 0.1,
                item: { name: 'Copper Coin', type: 'currency', value: 10 }
            }
        ]
    },
    
    bandit: {
        name: 'Elwynn Bandit',
        level: 2,
        baseHealth: 80,
        baseAttackPower: 10,
        baseArmor: 6,
        moveSpeed: 3.5,
        attackRange: 2,
        aggroRange: 12,
        color: 0x654321,
        faction: 'hostile',
        aiType: 'aggressive',
        lootTable: [
            {
                chance: 0.5,
                item: { name: 'Bandit Mask', type: 'armor', slot: 'head', quality: 'common' }
            },
            {
                chance: 0.3,
                item: { name: 'Stolen Goods', type: 'misc', value: 15 }
            }
        ]
    },
    
    // Westfall enemies
    gnoll: {
        name: 'Riverpaw Gnoll',
        level: 12,
        baseHealth: 180,
        baseAttackPower: 18,
        baseArmor: 15,
        moveSpeed: 4,
        attackRange: 2,
        aggroRange: 15,
        color: 0xD2691E,
        faction: 'hostile',
        aiType: 'pack_hunter',
        lootTable: [
            {
                chance: 0.4,
                item: { name: 'Gnoll Cloth', type: 'material', stackable: true }
            },
            {
                chance: 0.2,
                item: { name: 'Gnoll Fang', type: 'material', stackable: true }
            }
        ]
    },
    
    harvest_golem: {
        name: 'Harvest Golem',
        level: 15,
        baseHealth: 250,
        baseAttackPower: 22,
        baseArmor: 25,
        moveSpeed: 2,
        attackRange: 2,
        aggroRange: 8,
        color: 0xDAA520,
        faction: 'hostile',
        aiType: 'guardian',
        immunities: ['poison', 'fear'],
        lootTable: [
            {
                chance: 0.6,
                item: { name: 'Mechanical Parts', type: 'engineering', stackable: true }
            },
            {
                chance: 0.3,
                item: { name: 'Harvest Gear', type: 'engineering', stackable: true }
            }
        ]
    },
    
    // Duskwood enemies
    undead_skeleton: {
        name: 'Skeletal Warrior',
        level: 22,
        baseHealth: 300,
        baseAttackPower: 28,
        baseArmor: 20,
        moveSpeed: 3,
        attackRange: 2,
        aggroRange: 12,
        color: 0xF5F5DC,
        faction: 'undead',
        aiType: 'relentless',
        immunities: ['poison', 'fear'],
        lootTable: [
            {
                chance: 0.5,
                item: { name: 'Bone Fragment', type: 'material', stackable: true }
            },
            {
                chance: 0.2,
                item: { name: 'Ancient Bone', type: 'alchemy', stackable: true }
            }
        ]
    },
    
    worgen: {
        name: 'Worgen',
        level: 25,
        baseHealth: 400,
        baseAttackPower: 35,
        baseArmor: 18,
        moveSpeed: 5,
        attackRange: 2,
        aggroRange: 20,
        color: 0x2F4F4F,
        faction: 'hostile',
        aiType: 'feral',
        abilities: ['howl', 'frenzy'],
        lootTable: [
            {
                chance: 0.3,
                item: { name: 'Worgen Claw', type: 'material', stackable: true }
            },
            {
                chance: 0.1,
                item: { name: 'Cursed Fang', type: 'rare_material', stackable: true }
            }
        ]
    },
    
    // Stranglethorn enemies
    raptor: {
        name: 'Jungle Raptor',
        level: 32,
        baseHealth: 500,
        baseAttackPower: 45,
        baseArmor: 25,
        moveSpeed: 6,
        attackRange: 2,
        aggroRange: 15,
        color: 0x228B22,
        faction: 'hostile',
        aiType: 'pack_hunter',
        abilities: ['leap_attack'],
        lootTable: [
            {
                chance: 0.4,
                item: { name: 'Raptor Hide', type: 'material', stackable: true }
            },
            {
                chance: 0.2,
                item: { name: 'Raptor Tooth', type: 'material', stackable: true }
            }
        ]
    },
    
    tiger: {
        name: 'Stranglethorn Tiger',
        level: 35,
        baseHealth: 600,
        baseAttackPower: 50,
        baseArmor: 30,
        moveSpeed: 5,
        attackRange: 2,
        aggroRange: 12,
        color: 0xFF8C00,
        faction: 'hostile',
        aiType: 'stalker',
        abilities: ['stealth', 'pounce'],
        lootTable: [
            {
                chance: 0.5,
                item: { name: 'Tiger Hide', type: 'material', stackable: true }
            },
            {
                chance: 0.3,
                item: { name: 'Tiger Fang', type: 'material', stackable: true }
            }
        ]
    },
    
    troll: {
        name: 'Jungle Troll',
        level: 38,
        baseHealth: 700,
        baseAttackPower: 55,
        baseArmor: 35,
        moveSpeed: 4,
        attackRange: 2,
        aggroRange: 18,
        color: 0x4682B4,
        faction: 'hostile',
        aiType: 'tribal',
        abilities: ['regeneration', 'throw_spear'],
        lootTable: [
            {
                chance: 0.4,
                item: { name: 'Troll Mask', type: 'armor', slot: 'head' }
            },
            {
                chance: 0.3,
                item: { name: 'Voodoo Charm', type: 'trinket' }
            }
        ]
    },
    
    // Barrens enemies
    plainstrider: {
        name: 'Greater Plainstrider',
        level: 15,
        baseHealth: 200,
        baseAttackPower: 20,
        baseArmor: 12,
        moveSpeed: 5,
        attackRange: 2,
        aggroRange: 10,
        color: 0xFFDAB9,
        faction: 'neutral',
        aiType: 'skittish',
        lootTable: [
            {
                chance: 0.6,
                item: { name: 'Plainstrider Feather', type: 'material', stackable: true }
            },
            {
                chance: 0.4,
                item: { name: 'Plainstrider Meat', type: 'consumable', stackable: true }
            }
        ]
    },
    
    centaur: {
        name: 'Kolkar Centaur',
        level: 18,
        baseHealth: 280,
        baseAttackPower: 25,
        baseArmor: 18,
        moveSpeed: 4.5,
        attackRange: 3,
        aggroRange: 15,
        color: 0xCD853F,
        faction: 'hostile',
        aiType: 'tribal',
        abilities: ['charge', 'war_stomp'],
        lootTable: [
            {
                chance: 0.4,
                item: { name: 'Centaur Bracers', type: 'armor', slot: 'wrist' }
            },
            {
                chance: 0.2,
                item: { name: 'Tribal Spear', type: 'weapon', slot: 'mainhand' }
            }
        ]
    }
};

// Make available globally
window.EnemyDefinitions = EnemyDefinitions;
