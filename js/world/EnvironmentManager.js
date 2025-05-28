// EnvironmentManager.js - Handles environmental objects and decorations
class EnvironmentManager {
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.game = worldManager.game;
        
        // Environment objects
        this.trees = [];
        this.rocks = [];
        this.grass = [];
        this.flowers = [];
        this.structures = [];
        
        // Performance settings
        this.maxTrees = 500;
        this.maxRocks = 200;
        this.maxGrassPatches = 100;
        this.viewDistance = 200;
        
        // Object pools for performance
        this.treePool = [];
        this.rockPool = [];
        this.grassPool = [];
    }
    
    init() {
        console.log('Initializing Environment Manager...');
        this.createEnvironmentObjects();
        console.log('Environment Manager initialized');
    }
    
    createEnvironmentObjects() {
        this.createTrees();
        this.createRocks();
        this.createGrassPatches();
        this.createFlowers();
    }
    
    createTrees() {
        console.log('Creating trees...');
        
        for (let i = 0; i < this.maxTrees; i++) {
            const x = (Math.random() - 0.5) * this.worldManager.worldSize * 0.8;
            const z = (Math.random() - 0.5) * this.worldManager.worldSize * 0.8;
            const y = this.worldManager.getHeightAtPosition(x, z);
            
            // Only place trees on suitable terrain
            if (y > 2 && y < 25) {
                const tree = this.createTree();
                tree.position.set(x, y, z);
                tree.scale.set(
                    0.8 + Math.random() * 0.4,
                    0.8 + Math.random() * 0.4,
                    0.8 + Math.random() * 0.4
                );
                tree.rotation.y = Math.random() * Math.PI * 2;
                
                this.trees.push(tree);
                this.game.scene.add(tree);
            }
        }
    }
    
    createTree() {
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2.5;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        // Create leaves
        const leavesGeometry = new THREE.ConeGeometry(3, 6, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22 + Math.random() * 0x002200 
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 7;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        
        // Group them together
        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(leaves);
        
        // Add some variation
        if (Math.random() < 0.3) {
            // Add second layer of leaves
            const leaves2 = new THREE.Mesh(leavesGeometry.clone(), leavesMaterial.clone());
            leaves2.position.y = 5;
            leaves2.scale.set(0.8, 0.8, 0.8);
            tree.add(leaves2);
        }
        
        return tree;
    }
    
    createRocks() {
        console.log('Creating rocks...');
        
        for (let i = 0; i < this.maxRocks; i++) {
            const x = (Math.random() - 0.5) * this.worldManager.worldSize;
            const z = (Math.random() - 0.5) * this.worldManager.worldSize;
            const y = this.worldManager.getHeightAtPosition(x, z);
            
            const rock = this.createRock();
            rock.position.set(x, y + 0.5, z);
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.scale.set(
                0.5 + Math.random() * 1.5,
                0.5 + Math.random() * 1.5,
                0.5 + Math.random() * 1.5
            );
            
            this.rocks.push(rock);
            this.game.scene.add(rock);
        }
    }
    
    createRock() {
        const geometry = new THREE.DodecahedronGeometry(1, 0);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x808080 + Math.random() * 0x202020 
        });
        
        const rock = new THREE.Mesh(geometry, material);
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        return rock;
    }
    
    createGrassPatches() {
        console.log('Creating grass patches...');
        
        // Create instanced grass for better performance
        const grassBlade = new THREE.PlaneGeometry(0.1, 1);
        const grassMaterial = new THREE.MeshLambertMaterial({
            color: 0x3A5F3A,
            side: THREE.DoubleSide,
            transparent: true,
            alphaTest: 0.5
        });
        
        for (let patch = 0; patch < this.maxGrassPatches; patch++) {
            const grassCount = 50 + Math.random() * 100;
            const instancedGrass = new THREE.InstancedMesh(
                grassBlade,
                grassMaterial,
                grassCount
            );
            
            const patchX = (Math.random() - 0.5) * this.worldManager.worldSize;
            const patchZ = (Math.random() - 0.5) * this.worldManager.worldSize;
            
            const matrix = new THREE.Matrix4();
            const position = new THREE.Vector3();
            const rotation = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            
            for (let i = 0; i < grassCount; i++) {
                // Distribute grass around patch center
                const offsetX = (Math.random() - 0.5) * 10;
                const offsetZ = (Math.random() - 0.5) * 10;
                
                position.x = patchX + offsetX;
                position.z = patchZ + offsetZ;
                position.y = this.worldManager.getHeightAtPosition(position.x, position.z);
                
                // Only place grass on suitable terrain
                if (position.y > 2 && position.y < 20) {
                    rotation.setFromEuler(new THREE.Euler(
                        -Math.PI / 2 + Math.random() * 0.3,
                        Math.random() * Math.PI * 2,
                        0
                    ));
                    
                    scale.set(
                        0.8 + Math.random() * 0.4,
                        0.8 + Math.random() * 0.4,
                        1
                    );
                    
                    matrix.compose(position, rotation, scale);
                    instancedGrass.setMatrixAt(i, matrix);
                }
            }
            
            instancedGrass.instanceMatrix.needsUpdate = true;
            this.grass.push(instancedGrass);
            this.game.scene.add(instancedGrass);
        }
    }
    
    createFlowers() {
        console.log('Creating flowers...');
        
        const flowerCount = 200;
        const flowerTypes = [
            { color: 0xFF6B6B, size: 0.3 }, // Red
            { color: 0x4ECDC4, size: 0.25 }, // Cyan
            { color: 0xFFE66D, size: 0.35 }, // Yellow
            { color: 0xFF6B9D, size: 0.28 }, // Pink
            { color: 0xC7CEEA, size: 0.32 }  // Purple
        ];
        
        for (let i = 0; i < flowerCount; i++) {
            const x = (Math.random() - 0.5) * this.worldManager.worldSize * 0.6;
            const z = (Math.random() - 0.5) * this.worldManager.worldSize * 0.6;
            const y = this.worldManager.getHeightAtPosition(x, z);
            
            // Only place flowers on grass areas
            if (y > 3 && y < 15) {
                const flowerType = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
                const flower = this.createFlower(flowerType);
                flower.position.set(x, y, z);
                
                this.flowers.push(flower);
                this.game.scene.add(flower);
            }
        }
    }
    
    createFlower(flowerType) {
        const group = new THREE.Group();
        
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25;
        group.add(stem);
        
        // Create flower petals
        const petalGeometry = new THREE.CircleGeometry(flowerType.size, 6);
        const petalMaterial = new THREE.MeshLambertMaterial({
            color: flowerType.color,
            side: THREE.DoubleSide
        });
        
        const flower = new THREE.Mesh(petalGeometry, petalMaterial);
        flower.rotation.x = -Math.PI / 2;
        flower.position.y = 0.5;
        group.add(flower);
        
        // Add slight random rotation
        group.rotation.y = Math.random() * Math.PI * 2;
        
        return group;
    }
    
    getEnvironmentAtPosition(position) {
        const environment = {
            biome: 'temperate',
            temperature: 20,
            humidity: 0.5,
            windExposure: 0.5,
            treeCount: 0,
            rockCount: 0,
            grassDensity: 0
        };
        
        const radius = 50;
        
        // Count nearby environmental objects
        this.trees.forEach(tree => {
            if (tree.position.distanceTo(position) < radius) {
                environment.treeCount++;
            }
        });
        
        this.rocks.forEach(rock => {
            if (rock.position.distanceTo(position) < radius) {
                environment.rockCount++;
            }
        });
        
        // Determine biome based on environment
        if (environment.treeCount > 10) {
            environment.biome = 'forest';
            environment.temperature -= 2;
            environment.humidity += 0.2;
            environment.windExposure -= 0.3;
        } else if (environment.rockCount > 5) {
            environment.biome = 'rocky';
            environment.temperature += 1;
            environment.humidity -= 0.1;
            environment.windExposure += 0.2;
        }
        
        return environment;
    }
    
    update(deltaTime) {
        // Update environment effects
        this.updateWindEffects(deltaTime);
        this.updateSeasonalEffects(deltaTime);
    }
    
    updateWindEffects(deltaTime) {
        // Simple wind animation for trees and grass
        const windStrength = this.worldManager.weatherManager?.weather.windSpeed || 5;
        const windDirection = this.worldManager.weatherManager?.weather.windDirection || 0;
        
        const time = Date.now() * 0.001;
        
        // Animate trees
        this.trees.forEach((tree, index) => {
            if (tree.children && tree.children[1]) { // Leaves
                const leaves = tree.children[1];
                const sway = Math.sin(time + index * 0.1) * (windStrength * 0.001);
                leaves.rotation.z = sway;
            }
        });
        
        // Animate grass
        this.grass.forEach((grassPatch, patchIndex) => {
            // Grass animation is handled in the shader or by updating instance matrices
            // For simplicity, we'll skip complex grass animation here
        });
    }
    
    updateSeasonalEffects(deltaTime) {
        // Could implement seasonal color changes, leaf falling, etc.
        // For now, this is a placeholder
    }
    
    // Utility methods for area-specific environment generation
    generateTreesInArea(area, count = 50) {
        const newTrees = [];
        
        for (let i = 0; i < count; i++) {
            const position = area.getValidSpawnPosition(true);
            const tree = this.createTree();
            tree.position.set(position.x, position.y, position.z);
            tree.scale.set(
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4
            );
            tree.rotation.y = Math.random() * Math.PI * 2;
            
            newTrees.push(tree);
            this.trees.push(tree);
            this.game.scene.add(tree);
        }
        
        return newTrees;
    }
    
    generateRocksInArea(area, count = 20) {
        const newRocks = [];
        
        for (let i = 0; i < count; i++) {
            const position = area.getValidSpawnPosition(false);
            const rock = this.createRock();
            rock.position.set(position.x, position.y + 0.5, position.z);
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.scale.set(
                0.5 + Math.random() * 1.5,
                0.5 + Math.random() * 1.5,
                0.5 + Math.random() * 1.5
            );
            
            newRocks.push(rock);
            this.rocks.push(rock);
            this.game.scene.add(rock);
        }
        
        return newRocks;
    }
    
    dispose() {
        // Clean up all environment objects
        this.trees.forEach(tree => {
            tree.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.game.scene.remove(tree);
        });
        
        this.rocks.forEach(rock => {
            rock.geometry.dispose();
            rock.material.dispose();
            this.game.scene.remove(rock);
        });
        
        this.grass.forEach(grassPatch => {
            grassPatch.geometry.dispose();
            grassPatch.material.dispose();
            this.game.scene.remove(grassPatch);
        });
        
        this.flowers.forEach(flower => {
            flower.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.game.scene.remove(flower);
        });
        
        // Clear arrays
        this.trees = [];
        this.rocks = [];
        this.grass = [];
        this.flowers = [];
        this.structures = [];
    }
}
