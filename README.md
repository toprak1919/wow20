# World of WebCraft - 3D MMORPG

A comprehensive World of Warcraft-inspired 3D MMORPG built with vanilla JavaScript and Three.js, featuring a fully modular world building system, dynamic weather, interactive maps, and rich gameplay mechanics.

## 🚀 Quick Start

1. **Clone and Run**:
   ```bash
   git clone <repository-url>
   cd wow20
   # Open index.html in a modern web browser
   # Or serve with a local server for best performance
   python -m http.server 8000
   ```

2. **Play**: Navigate to `http://localhost:8000` and start your adventure!

## ✨ Key Features

### 🌍 **Advanced Modular World System**
- **Procedural Terrain Generation** - Multi-octave noise-based heightmaps with biome coloring
- **Dynamic Weather System** - Rain, snow, fog, and storms with particle effects
- **Chunked Loading** - Efficient memory management with 100x100 unit chunks
- **Area-Based Design** - Modular areas with unique properties, spawns, and events
- **Environmental Objects** - 500+ trees, rocks, grass patches with wind animations

### 🗺️ **Interactive Map System**
- **World Map** - Full terrain-based map with clickable navigation
- **Minimap** - Real-time radar showing nearby entities and terrain
- **Fog of War** - Areas revealed through exploration
- **POI Discovery** - Towns, dungeons, vendors, and quest givers
- **Map Navigation** - Click to move or quick-travel to discovered locations

### 🎮 **Core Gameplay**
- **Four Character Classes** - Warrior, Mage, Priest, Rogue with unique abilities
- **Advanced Combat System** - Real-time combat with abilities, cooldowns, and status effects
- **Quest System** - Dynamic quests with objectives, rewards, and story progression
- **Inventory Management** - Equipment slots, bags, and item quality system
- **Skill Trees** - Talent points and character progression
- **Social Features** - Friends, guilds, and chat systems

### 🏞️ **Three Unique Areas**

#### **🌲 Elwynn Forest** (Levels 1-10)
- **Starter Area** - Perfect for new adventurers
- **Enemies**: Forest wolves, kobold miners, young bears, bandits
- **Features**: Dense forests, rolling hills, peaceful streams
- **Quests**: Learn the basics, protect the forest, clear kobold camps

#### **🌾 Westfall** (Levels 10-20)  
- **Farming Region** - Golden wheat fields and farmlands
- **Enemies**: Defias Brotherhood, harvest golems, gnolls
- **Features**: The Deadmines entrance, abandoned farms
- **Quests**: Investigate Defias activity, protect farmers, dungeon preparation

#### **🏘️ Goldshire** (Safe Zone)
- **Starting Town** - Hub for new players with essential services
- **NPCs**: Innkeepers, blacksmiths, vendors, quest givers, guards
- **Services**: Equipment repair, item vendors, inn rooms, stable master
- **Features**: Lion's Pride Inn, guard post, notice board, town well

## 🏗️ Technical Architecture

### **Modular World System**
```
js/world/
├── WorldManager.js      # Core orchestrator
├── AreaManager.js       # Area loading and management
├── TerrainManager.js    # Procedural terrain generation
├── WeatherManager.js    # Dynamic weather systems
├── EnvironmentManager.js # Environmental objects
├── MapManager.js        # World and minimap rendering
├── EntityFactory.js     # Entity creation and management
├── BaseArea.js         # Base class for all areas
├── areas/              # Individual area implementations
│   ├── ElwynnForest.js
│   ├── Westfall.js
│   └── Goldshire.js
└── data/
    └── EnemyDefinitions.js # Comprehensive enemy database
```

### **Core Game Systems**
- **Game.js** - Main engine with rendering, physics, and audio
- **Player.js** - Character movement, stats, and abilities
- **Combat.js** - Real-time combat mechanics
- **UI.js** - Complete user interface system
- **Inventory.js** - Item management and equipment
- **Quests.js** - Quest tracking and completion
- **Skills.js** - Character progression and talents
- **Social.js** - Multiplayer features and communication

## 🎯 Gameplay Features

### **Combat System**
- **Real-time Combat** - Action-based fighting with timing
- **Ability System** - Class-specific spells and skills
- **Targeting** - Tab targeting and click selection
- **Status Effects** - Buffs, debuffs, and damage over time
- **Threat System** - Enemy AI with aggro mechanics

### **Character Progression**
- **Level System** - XP-based advancement from 1-60
- **Talent Trees** - Specialized skill paths for each class
- **Equipment** - 15 equipment slots with stat bonuses
- **Attributes** - Strength, Agility, Intellect, Stamina, Spirit

### **World Interaction**
- **Resource Gathering** - Mining, herbalism, and crafting materials
- **Environmental Storytelling** - Rich lore through area design
- **Dynamic Events** - Weather effects and seasonal changes
- **Exploration Rewards** - Hidden areas and treasure discovery

### **Social Features**
- **Chat System** - Multiple channels (General, Combat, Guild)
- **Friend Lists** - Player relationships and online status
- **Guild System** - Player organizations with ranks
- **Trading** - Secure item and gold exchange

## 🎨 Visual Features

### **3D Graphics**
- **Three.js Rendering** - Hardware-accelerated 3D graphics
- **Dynamic Lighting** - Day/night cycle with sun positioning
- **Particle Effects** - Weather, magic spells, and environmental effects
- **Skybox** - Atmospheric gradient sky with time-based colors
- **Shadow Mapping** - Realistic shadows from directional lighting

### **User Interface**
- **WoW-Style UI** - Familiar interface for MMO players
- **Responsive Design** - Scales from desktop to mobile
- **Customizable Layout** - Moveable windows and panels
- **Tooltip System** - Rich information on hover
- **Achievement Notifications** - Visual feedback for accomplishments

### **Map Visualization**
- **Terrain-Based Rendering** - Maps generated from actual heightmaps
- **Biome Colors** - Visual representation of different environments
- **Forest Density Mapping** - Tree coverage visualization
- **Interactive Elements** - Clickable POIs and navigation
- **Exploration Progress** - Visual indicators of discovered areas

## ⚡ Performance Optimizations

### **Efficient Rendering**
- **Chunk-Based Loading** - Only render nearby content
- **Entity Culling** - Hide distant or occluded objects
- **Level-of-Detail** - Simplified models at distance
- **Instanced Rendering** - Efficient drawing of repeated objects
- **Texture Atlasing** - Reduced draw calls through texture combining

### **Memory Management**
- **Object Pooling** - Reuse of frequently created objects
- **Garbage Collection** - Proper cleanup of unused resources
- **Asset Loading** - On-demand resource loading
- **Entity Lifecycle** - Automatic spawn/despawn based on player location

### **Network Simulation**
- **Client Prediction** - Smooth movement despite latency
- **State Synchronization** - Consistent world state
- **Bandwidth Optimization** - Compressed data transmission
- **Lag Compensation** - Fair gameplay across connections

## 🔧 Development Guide

### **Adding New Areas**
```javascript
class MyNewArea extends BaseArea {
    constructor() {
        super({
            id: 'my_area',
            name: 'My Area',
            description: 'A custom area',
            position: { x: 0, z: 0 },
            radius: 100,
            levelRange: { min: 15, max: 25 },
            biome: 'desert'
        });
    }
    
    getAreaEnemyTypes() {
        return ['desert_spider', 'sand_crawler'];
    }
    
    generateEnemySpawns() {
        // Custom spawn logic
    }
}
```

### **Creating Custom Enemies**
```javascript
// Add to EnemyDefinitions.js
sand_crawler: {
    name: 'Sand Crawler',
    type: 'beast',
    level: 18,
    health: 420,
    damage: 45,
    abilities: ['burrow', 'sand_blast'],
    lootTable: ['chitin_shell', 'desert_essence'],
    aiType: 'territorial'
}
```

### **Weather Control**
```javascript
// Set weather programmatically
game.world.setWeather('rain', 0.8);
game.world.setWeather('snow', 0.6);
game.world.setWeather('fog', 0.4);
```

### **Map Integration**
```javascript
// Add custom POIs
mapManager.addPOI(x, z, {
    name: 'Secret Cave',
    type: 'dungeon',
    description: 'A mysterious cave entrance'
});
```

## 📊 Game Statistics

### **World Scale**
- **World Size**: 1000x1000 units
- **Chunk Size**: 100x100 units  
- **View Distance**: 300 units
- **Total Areas**: 3 (expandable)
- **Environment Objects**: 700+ trees, rocks, vegetation

### **Content Database**
- **Enemy Types**: 15+ unique creatures
- **Character Classes**: 4 with unique abilities
- **Equipment Slots**: 15 different gear pieces
- **Quest Types**: Kill, collect, escort, exploration
- **Weather Patterns**: 5 different weather states

### **Performance Metrics**
- **Target FPS**: 60 FPS on modern hardware
- **Memory Usage**: <100MB typical
- **Load Time**: <5 seconds initial load
- **Chunk Loading**: <100ms per chunk
- **Entity Limit**: 50 per chunk (configurable)

## 🎯 Future Roadmap

### **Planned Features**
- **Additional Areas** - Stormwind City, Duskwood, Stranglethorn Vale
- **Dungeon System** - Instanced content with boss encounters
- **PvP Battlegrounds** - Player vs Player combat zones
- **Crafting System** - Blacksmithing, alchemy, enchanting
- **Mount System** - Faster travel with rideable creatures

### **Technical Improvements**
- **WebGL 2.0** - Enhanced graphics capabilities
- **Web Workers** - Multithreaded processing
- **WebAssembly** - Performance-critical calculations
- **Progressive Web App** - Offline capability and mobile optimization
- **Real Multiplayer** - WebSocket-based server integration

## 📱 Mobile Usage Tips

World of WebCraft can be played on phones and tablets. When the screen width is below 768&nbsp;px the game shows an on-screen joystick and four quick-action buttons. Drag the joystick to move your character and tap the buttons to trigger the first four ability slots. Swipe gestures on the game canvas can also activate abilities.

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

## 📞 Support

For questions, bug reports, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ using vanilla JavaScript and Three.js**

*Experience the nostalgia of classic MMORPGs with modern web technology!*
