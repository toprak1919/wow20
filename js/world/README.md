# Modular World Building System

This document describes the new modular world building system that replaces the monolithic world.js architecture.

## Overview

The world system has been refactored into a modular architecture that separates concerns and makes it easy to add new areas, entities, and environmental features. The system is designed to be:

- **Modular**: Each component has a specific responsibility
- **Extensible**: Easy to add new areas, enemies, and features
- **Performant**: Efficient chunk loading and entity management
- **Data-driven**: Content is defined in separate data files
- **Backward compatible**: Existing code continues to work

## Architecture

### Core Components

#### WorldManager (`WorldManager.js`)
The main orchestrator that manages all world systems:
- Coordinates terrain, areas, weather, and environment
- Handles chunk loading/unloading based on player position
- Manages entity spawning and lifecycle
- Provides unified API for world interactions

#### AreaManager (`AreaManager.js`)
Manages all game areas and their content:
- Loads area definitions from modular files
- Tracks which areas are active
- Handles area transitions and events
- Manages area-specific content spawning

#### TerrainManager (`TerrainManager.js`)
Handles terrain generation and management:
- Generates heightmaps using multi-octave noise
- Creates terrain mesh with vertex colors
- Manages water planes and effects
- Provides height queries and raycasting

#### WeatherManager (`WeatherManager.js`)
Controls weather systems and effects:
- Rain, snow, fog, and storm effects
- Dynamic weather changes based on area/time
- Particle systems for precipitation
- Lighting adjustments for atmosphere

#### EnvironmentManager (`EnvironmentManager.js`)
Manages environmental objects and decorations:
- Trees, rocks, grass, and flowers
- Instanced rendering for performance
- Wind animations and seasonal effects
- Area-specific environment generation

### Data Systems

#### EntityFactory (`EntityFactory.js`)
Factory pattern for creating different entity types:
- Creates enemies, NPCs, resources, and structures
- Loads definitions from data files
- Handles level scaling and customization
- Integrates with behavior and interaction systems
- Manages entity lifecycle

#### BaseArea (`BaseArea.js`)
Base class for all game areas:
- Defines area boundaries and properties
- Handles content generation (enemies, NPCs, resources)
- Manages area events (enter/exit)
- Provides spawn position utilities

### Enemy Systems

#### EnemySpawnManager (`EnemySpawnManager.js`)
Advanced enemy spawning system:
- Manages all enemy spawn points across areas
- Supports multiple spawn types (normal, pack, ambush, rare, etc.)
- Handles respawn timers and spawn limits
- Provides formation spawning for coordinated groups
- Tracks and manages all active enemies

#### EnemyBehaviorSystem (`EnemyBehaviorSystem.js`)
Modular AI behavior system for enemies:
- Registry-based behavior modules (idle, patrol, chase, attack, flee, etc.)
- Advanced behaviors (pack hunting, ambush, kiting, berserk)
- State machine for behavior transitions
- Threat management and target selection
- Configurable AI personalities per enemy type

#### EnemyInteractionSystem (`EnemyInteractionSystem.js`)
Dynamic enemy interaction and communication:
- Contextual interactions (taunts, rallies, calls for help)
- Combat dialogue and idle chatter
- Death rattles and flee warnings
- Coordinated group tactics
- Environmental awareness and alerts

## Creating New Areas

To create a new area, extend the `BaseArea` class:

```javascript
// js/world/areas/MyNewArea.js
import BaseArea from '../BaseArea.js';

class MyNewArea extends BaseArea {
    constructor() {
        super({
            id: 'my_new_area',
            name: 'My New Area',
            description: 'A description of the area',
            position: { x: 100, z: 100 },
            radius: 150,
            levelRange: { min: 10, max: 20 },
            faction: 'neutral',
            biome: 'desert',
            weather: 'clear'
        });
    }
    
    initializeContent() {
        // Define area-specific initialization
    }
    
    generateEnemySpawns() {
        // Define enemy spawns
        const enemyTypes = this.getAreaEnemyTypes();
        for (let i = 0; i < 20; i++) {
            const position = this.getValidSpawnPosition();
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            this.addEnemySpawn(enemyType, position);
        }
    }
    
    getAreaEnemyTypes() {
        return ['desert_spider', 'sand_crawler', 'nomad_bandit'];
    }
    
    onEnter(player) {
        // Area enter logic
        player.game.ui.showZoneText(this.name);
    }
}

export default MyNewArea;
```

Then register it in `AreaManager.js` by adding it to the `areaFiles` array.

## Adding New Enemies

Define enemies in `js/world/data/EnemyDefinitions.js`:

```javascript
desert_spider: {
    name: 'Desert Spider',
    level: 12,
    baseHealth: 180,
    baseAttackPower: 15,
    baseArmor: 8,
    moveSpeed: 4,
    attackRange: 2,
    aggroRange: 12,
    color: 0xD2B48C,
    faction: 'hostile',
    aiType: 'ambush',
    abilities: ['poison_bite', 'web_trap'],
    lootTable: [
        {
            chance: 0.5,
            item: { name: 'Spider Chitin', type: 'material', stackable: true }
        }
    ]
}
```

## Advanced Enemy Spawn System

The new spawn system supports various spawn types:

```javascript
// Pack spawn - Multiple enemies spawn together
this.addEnemySpawn('wolf', position, {
    spawnType: 'pack_spawn',
    maxCount: 4,
    formation: 'circle',
    respawnTime: 120
});

// Ambush spawn - Hidden until player approaches
this.addEnemySpawn('kobold', position, {
    spawnType: 'ambush_spawn',
    triggerRadius: 15,
    maxCount: 3
});

// Rare spawn - Low chance elite enemies
this.addEnemySpawn('bear', position, {
    spawnType: 'rare_spawn',
    spawnChance: 0.1,
    eliteModifier: true,
    respawnTime: 600
});

// Patrol spawn - Enemies follow paths
this.addEnemySpawn('bandit', position, {
    spawnType: 'patrol_spawn',
    patrolPoints: [...],
    maxCount: 2
});
```

## Enemy AI Behaviors

Available AI behaviors include:

- **idle**: Standing still, occasional look around
- **patrol**: Following waypoints or generated paths
- **chase**: Pursuing targets
- **attack**: Engaging in combat
- **flee**: Running away when low health
- **guard**: Protecting an area or position
- **ambush**: Hidden until triggered
- **pack_hunt**: Coordinated group attacks
- **kite**: Ranged attack while maintaining distance
- **berserk**: Increased aggression at low health
- **defensive**: Cautious combat with blocking
- **support**: Healing/buffing allies

AI types map to behavior combinations:
- `aggressive`: patrol → attack
- `territorial`: guard → attack
- `cowardly`: idle → flee
- `pack_hunter`: patrol → pack_hunt
- `stalker`: ambush → attack

## Directory Structure

```
js/world/
├── README.md                    # This documentation
├── WorldManager.js             # Main world orchestrator
├── AreaManager.js              # Area management system
├── TerrainManager.js           # Terrain generation and management
├── WeatherManager.js           # Weather systems and effects
├── EnvironmentManager.js       # Environmental objects
├── MapManager.js               # Map and minimap functionality
├── EntityFactory.js            # Entity creation factory
├── EnemySpawnManager.js        # Enemy spawn point management
├── EnemyBehaviorSystem.js      # Modular AI behaviors
├── EnemyInteractionSystem.js   # Enemy communication/interaction
├── BaseArea.js                 # Base class for all areas
├── areas/                      # Area definitions
│   ├── Goldshire.js           # Starting town
│   ├── ElwynnForest.js        # Beginner forest area
│   ├── Westfall.js            # Farm region
│   └── ...
└── data/                       # Data definitions
    ├── EnemyDefinitions.js     # Enemy type definitions
    ├── NPCDefinitions.js       # NPC type definitions
    ├── ResourceDefinitions.js  # Resource definitions
    └── StructureDefinitions.js # Structure definitions
```

## Benefits of the Modular System

### 1. Separation of Concerns
Each manager handles a specific aspect of the world:
- Terrain generation
- Weather effects
- Area management
- Environment decoration

### 2. Easy Extensibility
Adding new content is simple:
- New areas: Create a class extending `BaseArea`
- New enemies: Add definition to `EnemyDefinitions.js`
- New weather: Extend `WeatherManager`
- New environment: Extend `EnvironmentManager`

### 3. Performance Optimization
- Chunk-based loading/unloading
- Instanced rendering for environment objects
- Efficient entity management
- Lazy loading of area content

### 4. Data-Driven Design
- Enemy stats in separate files
- Area definitions as modular classes
- Easy to balance and modify content
- Support for different biomes and themes

### 5. Maintainability
- Clear file organization
- Single responsibility principle
- Easy to debug and test
- Consistent patterns throughout

## Migration from Legacy System

The new system maintains backward compatibility through the `world.js` compatibility layer. Existing code will continue to work, but you'll see console warnings encouraging migration to the new system.

### Legacy vs New

```javascript
// Legacy approach
game.world.spawnCreatures();
game.world.createZones();

// New approach
game.world.worldManager.loadArea(area);
game.world.worldManager.setWeather('rain', 0.7);
```

## Performance Considerations

### Chunk Loading
The system uses a chunk-based approach where only nearby areas are loaded and rendered. This provides:
- Constant memory usage regardless of world size
- Smooth performance in large worlds
- Automatic cleanup of distant content

### Entity Management
Entities are managed per-area and per-chunk:
- Entities are spawned when chunks load
- Entities are removed when chunks unload
- Efficient update loops only for active entities

### Rendering Optimization
- Instanced rendering for repetitive objects (grass, flowers)
- Level-of-detail for distant objects
- Frustum culling for off-screen objects
- Efficient particle systems for weather

## Future Enhancements

The modular system is designed to support future features:

1. **Dynamic World Events**: Time-based events, invasions, etc.
2. **Procedural Generation**: Algorithmic area generation
3. **Multiplayer Support**: Area synchronization across clients
4. **Save/Load System**: Persistent world state
5. **Modding Support**: Plugin-based area and entity creation
6. **Advanced Weather**: Seasonal changes, climate zones
7. **Dynamic Ecosystems**: Predator/prey relationships, migration

## Best Practices

### Creating Areas
1. Always extend `BaseArea`
2. Use appropriate level ranges
3. Define area-specific enemy and resource types
4. Include enter/exit events for immersion
5. Consider environmental factors (biome, weather)

### Adding Entities
1. Define base stats in data files
2. Use appropriate AI types for behavior
3. Include meaningful loot tables
4. Scale stats appropriately with level
5. Consider faction relationships

### Performance
1. Use reasonable spawn counts
2. Implement appropriate respawn timers
3. Use instanced rendering when possible
4. Consider view distance limits
5. Clean up resources properly

This modular system provides a solid foundation for creating rich, diverse game worlds while maintaining excellent performance and extensibility.
