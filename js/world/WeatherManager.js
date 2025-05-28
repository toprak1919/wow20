// WeatherManager.js - Handles weather systems and effects
class WeatherManager {
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.game = worldManager.game;
        
        // Current weather state
        this.weather = {
            type: 'clear',
            intensity: 0,
            windSpeed: 5,
            windDirection: 0,
            temperature: 20,
            humidity: 0.5
        };
        
        // Weather particles
        this.rainParticles = null;
        this.snowParticles = null;
        this.fogEffect = null;
        
        // Weather change timer
        this.weatherChangeTimer = 0;
        this.weatherChangeDuration = 300; // 5 minutes
    }
    
    init() {
        console.log('Initializing Weather Manager...');
        this.createWeatherSystems();
        console.log('Weather Manager initialized');
    }
    
    createWeatherSystems() {
        // Initialize particle systems for different weather types
        this.initRainSystem();
        this.initSnowSystem();
        this.initFogSystem();
    }
    
    initRainSystem() {
        const rainCount = 5000;
        const rainGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        
        for (let i = 0; i < rainCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 200;
            positions[i + 1] = Math.random() * 100;
            positions[i + 2] = (Math.random() - 0.5) * 200;
        }
        
        rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const rainMaterial = new THREE.PointsMaterial({
            color: 0xAAAAFF,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });
        
        this.rainParticles = new THREE.Points(rainGeometry, rainMaterial);
        this.rainParticles.visible = false;
        this.game.scene.add(this.rainParticles);
    }
    
    initSnowSystem() {
        const snowCount = 3000;
        const snowGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(snowCount * 3);
        
        for (let i = 0; i < snowCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 200;
            positions[i + 1] = Math.random() * 100;
            positions[i + 2] = (Math.random() - 0.5) * 200;
        }
        
        snowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const snowMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        this.snowParticles = new THREE.Points(snowGeometry, snowMaterial);
        this.snowParticles.visible = false;
        this.game.scene.add(this.snowParticles);
    }
    
    initFogSystem() {
        // Fog is handled through the scene fog property
        this.fogEffect = {
            near: 50,
            far: 500,
            color: 0x87CEEB
        };
    }
    
    setWeather(weatherType, intensity = 1.0) {
        console.log(`Setting weather to: ${weatherType} (intensity: ${intensity})`);
        
        // Hide all weather effects first
        this.hideAllWeatherEffects();
        
        this.weather.type = weatherType;
        this.weather.intensity = Math.max(0, Math.min(1, intensity));
        
        // Apply weather effects
        switch (weatherType) {
            case 'rain':
                this.activateRain();
                break;
            case 'snow':
                this.activateSnow();
                break;
            case 'fog':
                this.activateFog();
                break;
            case 'storm':
                this.activateStorm();
                break;
            case 'clear':
            default:
                this.activateClearWeather();
                break;
        }
        
        // Update game state
        this.game.gameState.weather = weatherType;
    }
    
    hideAllWeatherEffects() {
        if (this.rainParticles) this.rainParticles.visible = false;
        if (this.snowParticles) this.snowParticles.visible = false;
        
        // Reset fog
        this.game.scene.fog.near = 50;
        this.game.scene.fog.far = 500;
    }
    
    activateRain() {
        if (this.rainParticles) {
            this.rainParticles.visible = true;
            this.rainParticles.material.opacity = 0.6 * this.weather.intensity;
        }
        
        // Darken the sky
        this.game.scene.fog.color.setHex(0x708090);
        
        // Reduce sun intensity
        if (this.game.sunLight) {
            this.game.sunLight.intensity = 0.3;
        }
    }
    
    activateSnow() {
        if (this.snowParticles) {
            this.snowParticles.visible = true;
            this.snowParticles.material.opacity = 0.8 * this.weather.intensity;
        }
        
        // Lighten the sky for snow
        this.game.scene.fog.color.setHex(0xE6E6FA);
        
        // Reduce sun intensity
        if (this.game.sunLight) {
            this.game.sunLight.intensity = 0.4;
        }
    }
    
    activateFog() {
        // Reduce visibility
        this.game.scene.fog.near = 10;
        this.game.scene.fog.far = 100 * (1 - this.weather.intensity * 0.8);
        this.game.scene.fog.color.setHex(0xC0C0C0);
        
        // Reduce sun intensity
        if (this.game.sunLight) {
            this.game.sunLight.intensity = 0.2;
        }
    }
    
    activateStorm() {
        // Combine rain with stronger effects
        this.activateRain();
        
        // Darker sky
        this.game.scene.fog.color.setHex(0x2F4F4F);
        
        // Much reduced sun intensity
        if (this.game.sunLight) {
            this.game.sunLight.intensity = 0.1;
        }
        
        // Add lightning flashes (simple effect)
        this.addLightningEffect();
    }
    
    activateClearWeather() {
        // Restore normal sky color
        this.game.scene.fog.color.setHex(0x87CEEB);
        
        // Restore normal sun intensity
        if (this.game.sunLight) {
            this.game.sunLight.intensity = 1.0;
        }
    }
    
    addLightningEffect() {
        // Simple lightning flash effect
        if (Math.random() < 0.001) { // Very rare random lightning
            const originalIntensity = this.game.sunLight.intensity;
            this.game.sunLight.intensity = 2.0;
            this.game.sunLight.color.setHex(0xFFFFFF);
            
            setTimeout(() => {
                this.game.sunLight.intensity = originalIntensity;
                this.game.sunLight.color.setHex(0xFFFFE0);
            }, 100);
        }
    }
    
    update(deltaTime) {
        // Update weather change timer
        this.weatherChangeTimer += deltaTime;
        
        // Random weather changes
        if (this.weatherChangeTimer >= this.weatherChangeDuration) {
            this.weatherChangeTimer = 0;
            this.randomWeatherChange();
        }
        
        // Update weather effects
        this.updateWeatherEffects(deltaTime);
        
        // Update wind
        this.updateWind(deltaTime);
    }
    
    randomWeatherChange() {
        // Only change weather randomly sometimes
        if (Math.random() < 0.3) {
            const weatherTypes = ['clear', 'rain', 'fog'];
            
            // Add snow only in appropriate areas/seasons
            const currentArea = this.worldManager.currentArea;
            if (currentArea && (currentArea.biome === 'arctic' || currentArea.biome === 'mountain')) {
                weatherTypes.push('snow');
            }
            
            // Add storms in temperate areas
            if (currentArea && currentArea.biome === 'temperate_forest') {
                weatherTypes.push('storm');
            }
            
            const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
            const intensity = 0.3 + Math.random() * 0.7; // 30-100% intensity
            
            this.setWeather(newWeather, intensity);
        }
    }
    
    updateWeatherEffects(deltaTime) {
        // Update rain
        if (this.rainParticles && this.rainParticles.visible) {
            this.updateRain(deltaTime);
        }
        
        // Update snow
        if (this.snowParticles && this.snowParticles.visible) {
            this.updateSnow(deltaTime);
        }
        
        // Update storm effects
        if (this.weather.type === 'storm') {
            this.addLightningEffect();
        }
    }
    
    updateRain(deltaTime) {
        const positions = this.rainParticles.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= 50 * deltaTime * this.weather.intensity;
            
            // Reset rain drops that fall below ground
            if (positions[i + 1] < 0) {
                positions[i + 1] = 100;
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i + 2] = (Math.random() - 0.5) * 200;
            }
        }
        
        this.rainParticles.geometry.attributes.position.needsUpdate = true;
        
        // Center rain on player
        if (this.game.player) {
            this.rainParticles.position.x = this.game.player.position.x;
            this.rainParticles.position.z = this.game.player.position.z;
        }
    }
    
    updateSnow(deltaTime) {
        const positions = this.snowParticles.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= 5 * deltaTime * this.weather.intensity;
            
            // Add drift effect
            positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.1 * deltaTime;
            
            // Reset snow flakes that fall below ground
            if (positions[i + 1] < 0) {
                positions[i + 1] = 100;
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i + 2] = (Math.random() - 0.5) * 200;
            }
        }
        
        this.snowParticles.geometry.attributes.position.needsUpdate = true;
        
        // Center snow on player
        if (this.game.player) {
            this.snowParticles.position.x = this.game.player.position.x;
            this.snowParticles.position.z = this.game.player.position.z;
        }
    }
    
    updateWind(deltaTime) {
        // Slowly change wind direction
        this.weather.windDirection += (Math.random() - 0.5) * 0.1 * deltaTime;
        
        // Update wind speed based on weather
        let targetWindSpeed = 5;
        switch (this.weather.type) {
            case 'storm':
                targetWindSpeed = 20;
                break;
            case 'rain':
                targetWindSpeed = 10;
                break;
            case 'clear':
                targetWindSpeed = 3;
                break;
        }
        
        // Smoothly transition wind speed
        this.weather.windSpeed += (targetWindSpeed - this.weather.windSpeed) * deltaTime;
    }
    
    getWeatherInfo() {
        return {
            type: this.weather.type,
            intensity: this.weather.intensity,
            windSpeed: this.weather.windSpeed,
            windDirection: this.weather.windDirection,
            temperature: this.weather.temperature,
            humidity: this.weather.humidity
        };
    }
    
    dispose() {
        if (this.rainParticles) {
            this.rainParticles.geometry.dispose();
            this.rainParticles.material.dispose();
            this.game.scene.remove(this.rainParticles);
        }
        
        if (this.snowParticles) {
            this.snowParticles.geometry.dispose();
            this.snowParticles.material.dispose();
            this.game.scene.remove(this.snowParticles);
        }
    }
}
