import * as THREE from 'three';
import { AIMapGenerator } from '../services/AIMapGenerator';
import { MapTile, MapObject, NPCData } from '../types/MapTypes';
import { SavedMapTile } from '../services/SaveSystem';
import { NPC } from './NPC';
import { Character } from './Character';
import { collisionSystem } from '../services/CollisionSystem';
import { CustomVegetation } from '../types/CustomVegetationTypes';
import { CustomStructure } from '../types/CustomStructureTypes';

export class MapManager {
  private scene: THREE.Scene;
  private aiGenerator: AIMapGenerator;
  private loadedTiles = new Map<string, THREE.Group>();
  private loadedNPCs = new Map<string, NPC>();
  private isGenerating = new Set<string>();
  private tileSize = 25;
  private loadDistance = 2; // Load tiles within 2 tiles of player
  private hasCreatedStartingNPC = false;
  private character: Character | null = null;
  private callbacks: {
    onTileGenerated?: (tile: MapTile, description: string) => void;
    onGenerationStart?: (x: number, z: number) => void;
    onNPCInteraction?: (npc: NPC) => void;
  } = {};
  private customVegetation: CustomVegetation[] = [];
  private customStructures: CustomStructure[] = [];

  // Terrain collision objects
  private terrainCollisionObjects = new Map<string, string[]>(); // tile_id -> collision_object_ids
  private objectMeshCache = new Map<string, THREE.Object3D>(); // For reusing similar objects

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.aiGenerator = new AIMapGenerator();
  }

  setCharacter(character: Character): void {
    this.character = character;
  }

  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = callbacks;
  }

  setScenario(prompt: string, theme: string): void {
    this.aiGenerator.setScenario(prompt, theme);
  }
  
  registerCustomVegetation(vegetation: CustomVegetation[]): void {
    this.customVegetation = vegetation;
    console.log(`🌳 Registered ${vegetation.length} custom vegetation types for map generation`);
  }
  
  registerCustomStructures(structures: CustomStructure[]): void {
    this.customStructures = structures;
    console.log(`🏛️ Registered ${structures.length} custom structure types for map generation`);
  }

  async updateAroundPosition(playerPosition: THREE.Vector3): Promise<void> {
    const playerTileX = Math.floor(playerPosition.x / this.tileSize);
    const playerTileZ = Math.floor(playerPosition.z / this.tileSize);

    // Create starting NPC if we haven't already and player is near spawn
    if (!this.hasCreatedStartingNPC && Math.abs(playerTileX) <= 1 && Math.abs(playerTileZ) <= 1) {
      this.createStartingNPC();
      this.hasCreatedStartingNPC = true;
    }

    const promises: Promise<void>[] = [];

    // Generate tiles around player
    for (let x = playerTileX - this.loadDistance; x <= playerTileX + this.loadDistance; x++) {
      for (let z = playerTileZ - this.loadDistance; z <= playerTileZ + this.loadDistance; z++) {
        const tileId = `${x}_${z}`;
        
        if (!this.loadedTiles.has(tileId) && !this.isGenerating.has(tileId)) {
          promises.push(this.generateAndLoadTile(x, z));
        }
      }
    }

    // Update NPCs
    this.updateNPCs();

    // Check for NPC interactions
    this.checkNPCInteractions(playerPosition);

    // Unload distant tiles
    this.unloadDistantTiles(playerTileX, playerTileZ);

    await Promise.all(promises);
  }

  loadSavedTiles(savedTiles: SavedMapTile[]): void {
    console.log('🗺️ Loading', savedTiles.length, 'saved tiles...');
    
    savedTiles.forEach(savedTile => {
      const tile: MapTile = {
        id: `${savedTile.tile_x}_${savedTile.tile_z}`,
        x: savedTile.tile_x,
        z: savedTile.tile_z,
        biome: savedTile.biome as any,
        objects: savedTile.objects,
        generated: true
      };

      // Store in AI generator cache
      this.aiGenerator.addToCache(tile);
      
      // Create and load the tile visually
      const tileGroup = this.createTileObjects(tile);
      this.scene.add(tileGroup);
      this.loadedTiles.set(tile.id, tileGroup);
      
      console.log(`✅ Loaded tile ${tile.id} with ${tile.objects.length} objects`);
    });
  }

  getLoadedTiles(): Map<string, MapTile> {
    const tiles = new Map<string, MapTile>();
    this.loadedTiles.forEach((group, tileId) => {
      const tileInfo = this.aiGenerator.getTileInfo(
        parseInt(tileId.split('_')[0]),
        parseInt(tileId.split('_')[1])
      );
      if (tileInfo) {
        tiles.set(tileId, tileInfo);
      }
    });
    return tiles;
  }

  private createStartingNPC(): void {
    const startingNPCData: NPCData = {
      id: 'starting_guide_npc',
      name: 'Sage',
      personality: 'wise and welcoming',
      background: 'An ancient guide who has watched over travelers for countless years. Sage knows the secrets of this ever-changing world and is always ready to help newcomers.',
      occupation: 'World Guide',
      mood: 'welcoming',
      topics: ['world exploration', 'AI generation', 'travel tips', 'local lore', 'getting started'],
      appearance: {
        bodyColor: '#F1C27D',
        clothingColor: '#8A2BE2',
        scale: 1.1
      }
    };

    // Position the NPC near spawn but not directly on it
    const position = new THREE.Vector3(3, 0, 3);
    const startingNPC = new NPC(startingNPCData, position);
    
    this.scene.add(startingNPC.mesh);
    this.loadedNPCs.set(startingNPCData.id, startingNPC);

    console.log('🧙 Starting NPC "Sage" created at spawn location');
  }

  private async generateAndLoadTile(x: number, z: number): Promise<void> {
    const tileId = `${x}_${z}`;
    this.isGenerating.add(tileId);

    try {
      this.callbacks.onGenerationStart?.(x, z);

      // Get nearby biomes for context
      const nearbyBiomes = this.getNearbyBiomes(x, z);
      
      const generatedContent = await this.aiGenerator.generateMapTile(x, z, nearbyBiomes);
      const { tile, description } = generatedContent;

      // Enhance the tile with custom objects based on our scenario
      this.enhanceTileWithCustomObjects(tile);

      const tileGroup = this.createTileObjects(tile);
      this.scene.add(tileGroup);
      this.loadedTiles.set(tileId, tileGroup);

      this.callbacks.onTileGenerated?.(tile, description);
      console.log(`🎯 Generated tile ${tileId} with ${tile.objects.length} objects`);
    } catch (error) {
      console.error(`❌ Failed to generate tile ${tileId}:`, error);
    } finally {
      this.isGenerating.delete(tileId);
    }
  }

  private enhanceTileWithCustomObjects(tile: MapTile): void {
    // Skip if we don't have any custom objects
    if (this.customVegetation.length === 0 && this.customStructures.length === 0) {
      return;
    }
    
    // Add custom vegetation with ~30% chance per tile
    if (this.customVegetation.length > 0 && Math.random() < 0.3) {
      // Select a random custom vegetation
      const vegetation = this.customVegetation[Math.floor(Math.random() * this.customVegetation.length)];
      
      // Create a map object for it at a random position within the tile
      const posX = tile.x * this.tileSize + (Math.random() - 0.5) * 20;
      const posZ = tile.z * this.tileSize + (Math.random() - 0.5) * 20;
      
      const vegObject: MapObject = {
        type: vegetation.type,
        position: { x: posX, y: 0, z: posZ },
        scale: {
          x: 0.8 + Math.random() * 0.4,
          y: vegetation.appearance.height ? vegetation.appearance.height / 5 : 1.0, // Scale height based on vegetation height
          z: 0.8 + Math.random() * 0.4
        },
        rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
        color: vegetation.appearance.primaryColor || '#228B22',
        properties: {
          customId: vegetation.id,
          isCustomVegetation: true
        }
      };
      
      // Add to tile objects
      tile.objects.push(vegObject);
      console.log(`🌿 Added custom vegetation '${vegetation.name}' to tile ${tile.id}`);
    }
    
    // Add custom structure with ~15% chance per tile
    if (this.customStructures.length > 0 && Math.random() < 0.15) {
      // Select a random custom structure
      const structure = this.customStructures[Math.floor(Math.random() * this.customStructures.length)];
      
      // Create a map object for it, positioned carefully to avoid overlap with other objects
      // Find a position away from other objects
      const existingPositions = tile.objects.map(o => ({ x: o.position.x, z: o.position.z }));
      let posX, posZ, tooClose;
      let attempts = 0;
      
      do {
        posX = tile.x * this.tileSize + (Math.random() - 0.5) * 15; // Structures are larger, so use smaller area
        posZ = tile.z * this.tileSize + (Math.random() - 0.5) * 15;
        tooClose = false;
        
        // Check if this position is too close to existing objects
        for (const pos of existingPositions) {
          const dx = pos.x - posX;
          const dz = pos.z - posZ;
          const distSq = dx * dx + dz * dz;
          if (distSq < 25) { // 5 units min distance squared
            tooClose = true;
            break;
          }
        }
        
        attempts++;
      } while (tooClose && attempts < 10);
      
      // Only add if we found a good position
      if (!tooClose || attempts >= 10) {
        const structObject: MapObject = {
          type: structure.type,
          position: { x: posX, y: 0, z: posZ },
          scale: {
            x: structure.appearance.width ? structure.appearance.width / 10 : 1.0,
            y: structure.appearance.height ? structure.appearance.height / 10 : 1.0,
            z: structure.appearance.length ? structure.appearance.length / 10 : 1.0
          },
          rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
          color: structure.appearance.primaryColor || '#8B4513',
          properties: {
            customId: structure.id,
            isCustomStructure: true
          }
        };
        
        // Add to tile objects
        tile.objects.push(structObject);
        console.log(`🏛️ Added custom structure '${structure.name}' to tile ${tile.id}`);
      }
    }
  }

  private getNearbyBiomes(x: number, z: number): string[] {
    const nearbyBiomes: string[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dx, dz] of directions) {
      const nearbyTile = this.aiGenerator.getTileInfo(x + dx, z + dz);
      if (nearbyTile) {
        nearbyBiomes.push(nearbyTile.biome);
      }
    }

    return [...new Set(nearbyBiomes)]; // Remove duplicates
  }

  private createTileObjects(tile: MapTile): THREE.Group {
    const tileGroup = new THREE.Group();
    tileGroup.name = `tile_${tile.x}_${tile.z}`;

    // Track collision objects for this tile
    const tileCollisionIds: string[] = [];

    // Add ground plane for this tile with collision
    this.addTileGround(tileGroup, tile, tileCollisionIds);

    // Add objects
    tile.objects.forEach((obj, index) => {
      if (obj.type === 'npc') {
        this.createNPC(obj, tile);
      } else {
        const mesh = this.createObjectMesh(obj, tile.biome, index);
        if (mesh) {
          tileGroup.add(mesh);
          
          // Register interactable objects with the character for interaction
          if (this.character && this.isInteractableObject(obj.type)) {
            const objectId = `${tile.id}_${index}_${obj.type}`;
            this.character.registerInteractableObject(
              objectId,
              obj.type,
              obj.position,
              mesh
            );
          }

          // Add collision object for static objects
          if (this.isStaticCollidableObject(obj.type)) {
            const collisionId = this.addObjectCollision(obj, mesh, `${tile.id}_${index}`);
            if (collisionId) {
              tileCollisionIds.push(collisionId);
            }
          }
        }
      }
    });

    // Store collision object IDs for cleanup
    this.terrainCollisionObjects.set(tile.id, tileCollisionIds);

    return tileGroup;
  }

  private addTileGround(tileGroup: THREE.Group, tile: MapTile, tileCollisionIds: string[]): void {
    const groundGeometry = new THREE.PlaneGeometry(this.tileSize, this.tileSize);
    const groundColor = this.getBiomeGroundColor(tile.biome);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: groundColor,
      transparent: true,
      opacity: 0.95,     // Higher opacity for more solidity
      depthWrite: false, // Don't write to depth buffer to avoid z-fighting
      polygonOffset: true, // Use polygon offset to prevent z-fighting
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(
      tile.x * this.tileSize,
      0.01, // Slightly above base ground to prevent z-fighting
      tile.z * this.tileSize
    );
    ground.receiveShadow = true;
    ground.name = `ground_${tile.id}`;
    ground.renderOrder = 0; // Render after base ground but before other objects
    tileGroup.add(ground);

    // Add ground collision BELOW the visual surface
    const groundCollisionId = `ground_${tile.x}_${tile.z}`;
    collisionSystem.registerObject({
      id: groundCollisionId,
      type: 'static',
      bounds: {
        type: 'box',
        center: { x: 0, y: -0.5, z: 0 }, // Center of collision box at y: -0.5
        size: { x: this.tileSize, y: 1, z: this.tileSize } // Box from y: -1 to y: 0
      },
      position: { 
        x: tile.x * this.tileSize, 
        y: -0.5, // Position collision center below ground
        z: tile.z * this.tileSize 
      },
      mass: Infinity,
      isStatic: true,
      canCollideWith: ['character', 'enemy', 'dynamic'],
      userData: { type: 'ground', tileId: tile.id }
    });

    tileCollisionIds.push(groundCollisionId);
  }

  private getBiomeGroundColor(biome: string): number {
    const colors = {
      forest: 0x0F5132,
      grassland: 0x10B981,
      desert: 0xD2691E,
      mountains: 0x696969,
      lake: 0x1E40AF,
      village: 0x92400E,
      ruins: 0x8B8878
    };
    return colors[biome as keyof typeof colors] || 0x10B981;
  }

  private isInteractableObject(objectType: string): boolean {
    return [
      'tree', 'rock', 'bush', 'ruins', 'chest', 'crate', 
      'plant', 'mushroom', 'crystal', 'log', 'berry_bush',
      'well', 'campfire', 'statue', 'fence', 'bridge', 'cart'
    ].includes(objectType);
  }

  private isStaticCollidableObject(objectType: string): boolean {
    // Objects that should have collision boxes
    return [
      'tree', 'rock', 'building', 'ruins', 'chest', 'crate',
      'well', 'statue', 'fence', 'cart', 'bridge'
    ].includes(objectType);
  }

  private addObjectCollision(obj: MapObject, mesh: THREE.Object3D, objectId: string): string | null {
    const collisionId = `object_${objectId}`;
    
    // Get collision bounds based on object type
    const bounds = this.getObjectCollisionBounds(obj.type, obj.scale);
    if (!bounds) return null;

    // Calculate world position
    const worldPosition = {
      x: obj.position.x,
      y: obj.position.y + (bounds.center?.y || 0),
      z: obj.position.z
    };

    collisionSystem.registerObject({
      id: collisionId,
      type: 'static',
      bounds,
      position: worldPosition,
      mass: Infinity,
      isStatic: true,
      canCollideWith: ['character', 'enemy', 'dynamic'],
      userData: { 
        type: 'mapObject', 
        objectType: obj.type,
        mesh: mesh,
        interactable: this.isInteractableObject(obj.type),
        customId: obj.properties?.customId
      }
    });

    return collisionId;
  }

  private getObjectCollisionBounds(objectType: string, scale: { x: number; y: number; z: number }) {
    const bounds = {
      tree: { type: 'capsule' as const, center: { x: 0, y: 1.5, z: 0 }, radius: 0.3, height: 3.0 },
      rock: { type: 'sphere' as const, center: { x: 0, y: 0.5, z: 0 }, radius: 0.6 },
      building: { type: 'box' as const, center: { x: 0, y: 1.5, z: 0 }, size: { x: 2, y: 3, z: 2 } },
      ruins: { type: 'box' as const, center: { x: 0, y: 1, z: 0 }, size: { x: 1.6, y: 2, z: 1.6 } },
      chest: { type: 'box' as const, center: { x: 0, y: 0.3, z: 0 }, size: { x: 0.8, y: 0.6, z: 0.6 } },
      crate: { type: 'box' as const, center: { x: 0, y: 0.3, z: 0 }, size: { x: 0.6, y: 0.6, z: 0.6 } },
      well: { type: 'capsule' as const, center: { x: 0, y: 1, z: 0 }, radius: 0.9, height: 2.0 },
      statue: { type: 'capsule' as const, center: { x: 0, y: 1, z: 0 }, radius: 0.4, height: 2.0 },
      fence: { type: 'box' as const, center: { x: 0, y: 0.5, z: 0 }, size: { x: 2.2, y: 1.0, z: 0.2 } },
      cart: { type: 'box' as const, center: { x: 0, y: 0.4, z: 0 }, size: { x: 1.2, y: 0.8, z: 0.8 } },
      bridge: { type: 'box' as const, center: { x: 0, y: 0.1, z: 0 }, size: { x: 4, y: 0.2, z: 1 } }
    };

    const baseBounds = bounds[objectType as keyof typeof bounds];
    if (!baseBounds) return null;

    // Apply scale to bounds
    const scaledBounds = { ...baseBounds };
    if (scaledBounds.radius) {
      scaledBounds.radius *= Math.max(scale.x, scale.z);
    }
    if (scaledBounds.height) {
      scaledBounds.height *= scale.y;
    }
    if (scaledBounds.size) {
      scaledBounds.size = {
        x: scaledBounds.size.x * scale.x,
        y: scaledBounds.size.y * scale.y,
        z: scaledBounds.size.z * scale.z
      };
    }
    if (scaledBounds.center) {
      scaledBounds.center = {
        x: scaledBounds.center.x * scale.x,
        y: scaledBounds.center.y * scale.y,
        z: scaledBounds.center.z * scale.z
      };
    }

    return scaledBounds;
  }

  private createNPC(obj: MapObject, tile: MapTile): void {
    const npcData = obj.properties?.npcData as NPCData;
    if (!npcData) return;

    const position = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
    const npc = new NPC(npcData, position);
    
    this.scene.add(npc.mesh);
    this.loadedNPCs.set(npcData.id, npc);
    
    console.log(`👤 Created NPC ${npcData.name} at tile ${tile.id}`);
  }

  private updateNPCs(): void {
    this.loadedNPCs.forEach(npc => {
      npc.update();
    });
  }

  private checkNPCInteractions(playerPosition: THREE.Vector3): void {
    this.loadedNPCs.forEach(npc => {
      const distance = npc.distanceTo(playerPosition);
      if (distance < 3 && this.callbacks.onNPCInteraction) {
        // Only trigger if player is close enough (within 3 units)
        // You might want to add a cooldown or state management here
        // this.callbacks.onNPCInteraction(npc);
      }
    });
  }

  getNearbyNPCs(position: THREE.Vector3, radius: number = 3): NPC[] {
    const nearbyNPCs: NPC[] = [];
    this.loadedNPCs.forEach(npc => {
      if (npc.distanceTo(position) <= radius) {
        nearbyNPCs.push(npc);
      }
    });
    return nearbyNPCs;
  }

  private createObjectMesh(obj: MapObject, biome: string, index: number): THREE.Object3D | null {
    // Check if this is a custom object
    const isCustomVegetation = obj.properties?.isCustomVegetation;
    const isCustomStructure = obj.properties?.isCustomStructure;
    const customId = obj.properties?.customId;
    
    if (isCustomVegetation && customId) {
      // Find the matching custom vegetation definition
      const customVeg = this.customVegetation.find(v => v.id === customId);
      if (customVeg) {
        return this.createCustomVegetationMesh(obj, customVeg);
      }
    }
    
    if (isCustomStructure && customId) {
      // Find the matching custom structure definition
      const customStruct = this.customStructures.find(s => s.id === customId);
      if (customStruct) {
        return this.createCustomStructureMesh(obj, customStruct);
      }
    }
    
    // If not custom or custom definition not found, use standard object creation
    const cacheKey = `${obj.type}_${biome}_${obj.scale.x}_${obj.scale.y}_${obj.scale.z}`;
    
    // Check cache for similar objects
    if (this.objectMeshCache.has(cacheKey) && Math.random() < 0.3) {
      const cachedMesh = this.objectMeshCache.get(cacheKey)!;
      const clonedMesh = cachedMesh.clone();
      clonedMesh.position.set(obj.position.x, obj.position.y, obj.position.z);
      clonedMesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
      return clonedMesh;
    }

    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (obj.type) {
      case 'tree':
        const tree = this.createTree(obj, biome);
        this.objectMeshCache.set(cacheKey, tree.clone());
        return tree;
      
      case 'rock':
        geometry = new THREE.DodecahedronGeometry(0.5);
        material = new THREE.MeshLambertMaterial({ 
          color: obj.color ? parseInt(obj.color.replace('#', ''), 16) : 0x696969 
        });
        break;
      
      case 'building':
        geometry = new THREE.BoxGeometry(2, 3, 2);
        material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        break;
      
      case 'hill':
        geometry = new THREE.SphereGeometry(2, 8, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        break;
      
      case 'flower':
        return this.createFlower(obj);
      
      case 'bush':
        geometry = new THREE.SphereGeometry(0.8, 8, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x006400 });
        break;
      
      case 'ruins':
        geometry = new THREE.CylinderGeometry(0.8, 1, 2, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x708090 });
        break;
      
      case 'water':
        geometry = new THREE.PlaneGeometry(3, 3);
        material = new THREE.MeshLambertMaterial({ 
          color: 0x1E40AF, 
          transparent: true, 
          opacity: 0.7 
        });
        break;

      // Detailed object types
      case 'chest':
        return this.createChest(obj);
      
      case 'crate':
        return this.createCrate(obj);
      
      case 'plant':
        return this.createPlant(obj);
      
      case 'mushroom':
        return this.createMushroom(obj);
      
      case 'crystal':
        return this.createCrystal(obj);
      
      case 'log':
        return this.createLog(obj);
      
      case 'berry_bush':
        return this.createBerryBush(obj);
      
      case 'well':
        return this.createWell(obj);
      
      case 'campfire':
        return this.createCampfire(obj);
      
      case 'statue':
        geometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
        material = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });
        break;
      
      case 'fence':
        return this.createFence(obj);
      
      case 'bridge':
        geometry = new THREE.BoxGeometry(4, 0.2, 1);
        material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        break;
      
      case 'cart':
        return this.createCart(obj);
      
      default:
        return null;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
    mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Cache for reuse
    this.objectMeshCache.set(cacheKey, mesh.clone());

    return mesh;
  }

  // Method to create custom vegetation meshes
  private createCustomVegetationMesh(obj: MapObject, vegetation: CustomVegetation): THREE.Object3D {
    const vegGroup = new THREE.Group();
    
    // Base properties from the vegetation definition
    const primaryColor = vegetation.appearance.primaryColor || '#228B22'; 
    const secondaryColor = vegetation.appearance.secondaryColor || '#006400';
    const height = vegetation.appearance.height || 2.0;
    const width = vegetation.appearance.width || 1.0;
    const type = vegetation.type;
    
    // Create appropriate geometry based on vegetation type
    switch (type) {
      case 'tree': {
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(width * 0.1, width * 0.15, height * 0.6, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ 
          color: vegetation.appearance.trunkColor || '#8B4513' 
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = height * 0.3;
        trunk.castShadow = true;
        vegGroup.add(trunk);
        
        // Create foliage
        const foliageGeometry = new THREE.SphereGeometry(width * 0.8, 8, 6);
        const foliageMaterial = new THREE.MeshLambertMaterial({ 
          color: vegetation.appearance.leafColor || primaryColor
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = height * 0.7;
        foliage.castShadow = true;
        vegGroup.add(foliage);
        
        // Add fruits if applicable
        if (vegetation.appearance.hasFruits) {
          const fruitColor = vegetation.appearance.fruitColor || '#FF0000';
          for (let i = 0; i < 5; i++) {
            const fruitGeometry = new THREE.SphereGeometry(width * 0.1, 6, 4);
            const fruitMaterial = new THREE.MeshLambertMaterial({ color: fruitColor });
            const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
            
            // Random position within the foliage
            const angle = Math.random() * Math.PI * 2;
            const radius = width * 0.6 * Math.random();
            fruit.position.set(
              Math.cos(angle) * radius, 
              height * (0.6 + Math.random() * 0.3), 
              Math.sin(angle) * radius
            );
            
            fruit.castShadow = true;
            vegGroup.add(fruit);
          }
        }
        break;
      }
      
      case 'bush': {
        // Create main bush shape
        const bushGeometry = new THREE.SphereGeometry(width * 0.6, 8, 6);
        const bushMaterial = new THREE.MeshLambertMaterial({ 
          color: vegetation.appearance.leafColor || primaryColor
        });
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.y = height * 0.3;
        bush.castShadow = true;
        vegGroup.add(bush);
        
        // Add some smaller leaf clusters
        for (let i = 0; i < 3; i++) {
          const clusterGeometry = new THREE.SphereGeometry(width * 0.4 * (0.7 + Math.random() * 0.3), 7, 5);
          const clusterMesh = new THREE.Mesh(clusterGeometry, bushMaterial);
          
          const angle = i * Math.PI * 2 / 3;
          clusterMesh.position.set(
            Math.cos(angle) * width * 0.4,
            height * (0.3 + Math.random() * 0.2),
            Math.sin(angle) * width * 0.4
          );
          
          clusterMesh.castShadow = true;
          vegGroup.add(clusterMesh);
        }
        
        // Add berries if applicable
        if (vegetation.appearance.hasFruits) {
          const fruitColor = vegetation.appearance.fruitColor || '#FF0000';
          for (let i = 0; i < 8; i++) {
            const berryGeometry = new THREE.SphereGeometry(width * 0.05, 6, 4);
            const berryMaterial = new THREE.MeshLambertMaterial({ color: fruitColor });
            const berry = new THREE.Mesh(berryGeometry, berryMaterial);
            
            // Random position on bush surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = width * 0.6;
            
            berry.position.set(
              r * Math.sin(phi) * Math.cos(theta),
              height * 0.3 + r * Math.cos(phi),
              r * Math.sin(phi) * Math.sin(theta)
            );
            
            vegGroup.add(berry);
          }
        }
        break;
      }
      
      case 'flower':
      case 'plant': {
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(width * 0.02, width * 0.03, height * 0.8, 5);
        const stemMaterial = new THREE.MeshLambertMaterial({ 
          color: secondaryColor 
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = height * 0.4;
        stem.castShadow = true;
        vegGroup.add(stem);
        
        // Create leaves
        const leafGeometry = new THREE.SphereGeometry(width * 0.15, 6, 4);
        const leafMaterial = new THREE.MeshLambertMaterial({ 
          color: vegetation.appearance.leafColor || primaryColor 
        });
        
        for (let i = 0; i < 2; i++) {
          const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
          leaf.scale.set(1, 0.3, 1); // Flatten into leaf shape
          
          const height = 0.2 + i * 0.3;
          const angle = i * Math.PI;
          
          leaf.position.set(
            Math.cos(angle) * width * 0.15, 
            height * 2, 
            Math.sin(angle) * width * 0.15
          );
          
          leaf.rotation.x = Math.PI / 4;
          leaf.rotation.y = angle;
          
          vegGroup.add(leaf);
        }
        
        // For flowers, add flower petals/blooms
        if (type === 'flower') {
          const flowerColor = vegetation.appearance.primaryColor || '#FF69B4';
          const petalGeometry = new THREE.CircleGeometry(width * 0.2, 5);
          const petalMaterial = new THREE.MeshLambertMaterial({ 
            color: flowerColor,
            side: THREE.DoubleSide 
          });
          
          for (let i = 0; i < 5; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            const angle = (i / 5) * Math.PI * 2;
            
            petal.position.set(
              Math.cos(angle) * width * 0.08, 
              height * 0.8, 
              Math.sin(angle) * width * 0.08
            );
            
            petal.rotation.x = Math.PI / 2;
            petal.rotation.y = angle;
            
            vegGroup.add(petal);
          }
          
          // Add center of flower
          const centerGeometry = new THREE.SphereGeometry(width * 0.08, 8, 6);
          const centerMaterial = new THREE.MeshLambertMaterial({ 
            color: vegetation.appearance.secondaryColor || '#FFFF00' 
          });
          const center = new THREE.Mesh(centerGeometry, centerMaterial);
          center.position.y = height * 0.8;
          vegGroup.add(center);
        }
        break;
      }
      
      case 'mushroom': {
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(width * 0.1, width * 0.15, height * 0.6, 6);
        const stemMaterial = new THREE.MeshLambertMaterial({ 
          color: vegetation.appearance.secondaryColor || '#F5F5DC' 
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = height * 0.3;
        stem.castShadow = true;
        vegGroup.add(stem);
        
        // Create cap
        const capGeometry = new THREE.SphereGeometry(width * 0.3, 8, 6);
        const capMaterial = new THREE.MeshLambertMaterial({ 
          color: vegetation.appearance.primaryColor || '#B22222' 
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = height * 0.65;
        cap.scale.set(1, 0.5, 1); // Flatten into mushroom cap shape
        cap.castShadow = true;
        vegGroup.add(cap);
        
        // Add spots on cap for certain mushroom types
        if (Math.random() > 0.5) {
          const spotColor = vegetation.appearance.secondaryColor || '#FFFFFF';
          const spotGeometry = new THREE.CircleGeometry(width * 0.03, 4);
          const spotMaterial = new THREE.MeshLambertMaterial({ 
            color: spotColor, 
            side: THREE.DoubleSide 
          });
          
          for (let i = 0; i < 8; i++) {
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            
            // Random position on cap
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI / 4; // Constrain to cap surface
            const r = width * 0.3;
            
            spot.position.set(
              r * Math.sin(phi) * Math.cos(theta),
              height * 0.65 + r * Math.cos(phi) * 0.5,
              r * Math.sin(phi) * Math.sin(theta)
            );
            
            spot.rotation.x = Math.PI / 2;
            spot.lookAt(new THREE.Vector3(spot.position.x * 2, spot.position.y, spot.position.z * 2));
            
            vegGroup.add(spot);
          }
        }
        break;
      }
      
      case 'log': {
        // Create log cylinder
        const logGeometry = new THREE.CylinderGeometry(width * 0.3, width * 0.3, height, 8);
        const logMaterial = new THREE.MeshLambertMaterial({ 
          color: vegetation.appearance.trunkColor || '#8B4513' 
        });
        const log = new THREE.Mesh(logGeometry, logMaterial);
        
        // Rotate to horizontal position
        log.rotation.x = Math.PI / 2;
        log.position.y = width * 0.3; // Half the diameter to rest on ground
        
        log.castShadow = true;
        vegGroup.add(log);
        
        // Add some bark detail
        for (let i = 0; i < 3; i++) {
          const barkGeometry = new THREE.BoxGeometry(0.05 * width, 0.1 * width, 0.2 * height);
          const barkMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x654321 
          });
          const bark = new THREE.Mesh(barkGeometry, barkMaterial);
          
          const angle = Math.random() * Math.PI * 2;
          const radius = width * 0.3;
          
          bark.position.set(
            Math.cos(angle) * radius,
            width * 0.3 + 0.05 * width,
            (Math.random() - 0.5) * height
          );
          
          bark.rotation.z = angle;
          
          vegGroup.add(bark);
        }
        
        // Add moss or growth on top if needed
        if (vegetation.appearance.hasFlowers) {
          const mossGeometry = new THREE.PlaneGeometry(width * 0.6, height * 0.6);
          const mossColor = vegetation.appearance.secondaryColor || '#7CFC00';
          const mossMaterial = new THREE.MeshLambertMaterial({ 
            color: mossColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
          });
          
          const moss = new THREE.Mesh(mossGeometry, mossMaterial);
          moss.position.set(0, width * 0.3 + 0.01, 0);
          moss.rotation.x = -Math.PI / 2;
          
          vegGroup.add(moss);
        }
        break;
      }
      
      default: {
        // Generic vegetation object for any other types
        const genericGeometry = new THREE.SphereGeometry(width * 0.5, 8, 6);
        const genericMaterial = new THREE.MeshLambertMaterial({ 
          color: primaryColor 
        });
        const genericMesh = new THREE.Mesh(genericGeometry, genericMaterial);
        genericMesh.position.y = height * 0.5;
        genericMesh.castShadow = true;
        vegGroup.add(genericMesh);
      }
    }
    
    // Apply any custom visual effects
    if (vegetation.appearance.glow) {
      const glowColor = vegetation.appearance.emissiveColor || primaryColor;
      const glowGeometry = new THREE.SphereGeometry(width * 0.6, 8, 6);
      const glowMaterial = new THREE.MeshLambertMaterial({ 
        color: glowColor,
        transparent: true,
        opacity: 0.2,
        emissive: glowColor,
        emissiveIntensity: vegetation.appearance.emissiveIntensity || 1.0
      });
      
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.y = height * 0.5;
      vegGroup.add(glowMesh);
    }
    
    // Set position, scale and rotation from the map object
    vegGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    vegGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
    
    // Scale is already factored into the individual meshes
    
    return vegGroup;
  }
  
  // Method to create custom structure meshes
  private createCustomStructureMesh(obj: MapObject, structure: CustomStructure): THREE.Object3D {
    const structGroup = new THREE.Group();
    
    // Base properties from the structure definition
    const primaryColor = structure.appearance.primaryColor || '#8B4513';
    const secondaryColor = structure.appearance.secondaryColor || '#A0522D';
    const height = structure.appearance.height || 3.0;
    const width = structure.appearance.width || 2.0;
    const length = structure.appearance.length || 2.0;
    const type = structure.type;
    
    // Create appropriate geometry based on structure type
    switch (type) {
      case 'building': {
        // Main building structure
        const buildingGeometry = new THREE.BoxGeometry(width, height, length);
        const buildingMaterial = new THREE.MeshLambertMaterial({
          color: primaryColor
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = height / 2; // Center at origin with bottom at ground
        building.castShadow = true;
        building.receiveShadow = true;
        structGroup.add(building);
        
        // Add roof if specified
        if (structure.appearance.hasRoof) {
          const roofHeight = height * 0.3;
          const roofGeometry = new THREE.ConeGeometry(Math.max(width, length) * 0.6, roofHeight, 4);
          const roofMaterial = new THREE.MeshLambertMaterial({
            color: secondaryColor
          });
          
          const roof = new THREE.Mesh(roofGeometry, roofMaterial);
          roof.position.y = height + roofHeight / 2;
          roof.rotation.y = Math.PI / 4; // Orient the pyramid roof
          roof.castShadow = true;
          structGroup.add(roof);
        }
        
        // Add door if specified
        if (structure.appearance.hasDoor) {
          const doorWidth = Math.min(width, length) * 0.4;
          const doorHeight = height * 0.6;
          const doorGeometry = new THREE.PlaneGeometry(doorWidth, doorHeight);
          const doorMaterial = new THREE.MeshLambertMaterial({
            color: 0x5D4037,
            side: THREE.DoubleSide
          });
          
          const door = new THREE.Mesh(doorGeometry, doorMaterial);
          
          // Position door on the front face
          door.position.set(0, doorHeight / 2, length / 2 + 0.01);
          door.castShadow = false;
          structGroup.add(door);
        }
        
        // Add windows if specified
        if (structure.appearance.hasWindows) {
          const windowSize = Math.min(width, length) * 0.3;
          const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
          const windowMaterial = new THREE.MeshLambertMaterial({
            color: 0xB0C4DE,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
          });
          
          // Side windows
          const windowOffsetY = height * 0.6;
          
          // Front windows (one on each side of the door)
          const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
          window1.position.set(-width * 0.25, windowOffsetY, length / 2 + 0.01);
          structGroup.add(window1);
          
          const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
          window2.position.set(width * 0.25, windowOffsetY, length / 2 + 0.01);
          structGroup.add(window2);
          
          // Side windows
          const window3 = new THREE.Mesh(windowGeometry, windowMaterial);
          window3.position.set(width / 2 + 0.01, windowOffsetY, 0);
          window3.rotation.y = Math.PI / 2;
          structGroup.add(window3);
          
          const window4 = new THREE.Mesh(windowGeometry, windowMaterial);
          window4.position.set(-width / 2 - 0.01, windowOffsetY, 0);
          window4.rotation.y = Math.PI / 2;
          structGroup.add(window4);
        }
        
        break;
      }
      
      case 'ruin': {
        // Main structure - partially broken walls
        const wallSegments = [];
        const wallHeight = height * 0.8; // Reduced height for ruins
        const wallThickness = Math.min(width, length) * 0.1;
        
        // Ruined appearance - some walls partially destroyed
        // Wall 1 - mostly intact
        const wall1Geometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
        const wall1Material = new THREE.MeshLambertMaterial({ color: primaryColor });
        const wall1 = new THREE.Mesh(wall1Geometry, wall1Material);
        wall1.position.set(0, wallHeight / 2, length / 2 - wallThickness / 2);
        wall1.castShadow = true;
        wallSegments.push(wall1);
        
        // Wall 2 - partially broken
        const wall2Geometry = new THREE.BoxGeometry(wallThickness, wallHeight * 0.7, length);
        const wall2 = new THREE.Mesh(wall2Geometry, wall1Material);
        wall2.position.set(width / 2 - wallThickness / 2, wallHeight * 0.35, 0);
        wall2.castShadow = true;
        wallSegments.push(wall2);
        
        // Wall 3 - very broken
        const wall3Geometry = new THREE.BoxGeometry(width * 0.4, wallHeight * 0.5, wallThickness);
        const wall3 = new THREE.Mesh(wall3Geometry, wall1Material);
        wall3.position.set(-width * 0.3, wallHeight * 0.25, -length / 2 + wallThickness / 2);
        wall3.castShadow = true;
        wallSegments.push(wall3);
        
        // Wall 4 - broken into pieces
        const wall4Geometry = new THREE.BoxGeometry(wallThickness, wallHeight * 0.6, length * 0.5);
        const wall4 = new THREE.Mesh(wall4Geometry, wall1Material);
        wall4.position.set(-width / 2 + wallThickness / 2, wallHeight * 0.3, -length * 0.25);
        wall4.castShadow = true;
        wallSegments.push(wall4);
        
        // Add rubble around the base
        for (let i = 0; i < 10; i++) {
          const rubbleSize = 0.2 + Math.random() * 0.3;
          const rubbleGeometry = new THREE.DodecahedronGeometry(rubbleSize);
          const rubble = new THREE.Mesh(rubbleGeometry, wall1Material);
          
          const angle = Math.random() * Math.PI * 2;
          const radius = (Math.max(width, length) / 2) * (0.7 + Math.random() * 0.5);
          
          rubble.position.set(
            Math.cos(angle) * radius,
            rubbleSize / 2, // Half height to rest on ground
            Math.sin(angle) * radius
          );
          
          rubble.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
          
          rubble.castShadow = true;
          wallSegments.push(rubble);
        }
        
        // Add walls to group
        wallSegments.forEach(segment => structGroup.add(segment));
        
        // Add some vegetation overgrowth
        if (structure.appearance.overgrown) {
          const plantPositions = [
            [width * 0.4, wallHeight, 0],
            [0, wallHeight * 0.6, length * 0.4],
            [-width * 0.3, 0, -length * 0.3]
          ];
          
          plantPositions.forEach(([x, y, z]) => {
            const vineGeometry = new THREE.SphereGeometry(0.4, 6, 4);
            const vineMaterial = new THREE.MeshLambertMaterial({
              color: 0x4CAF50,
              transparent: true,
              opacity: 0.9
            });
            
            const vine = new THREE.Mesh(vineGeometry, vineMaterial);
            vine.position.set(x, y, z);
            vine.scale.set(1, 0.4, 1);
            structGroup.add(vine);
          });
        }
        
        break;
      }
      
      case 'monument': {
        // Base plinth
        const plinthGeometry = new THREE.BoxGeometry(width, height * 0.2, width);
        const plinthMaterial = new THREE.MeshLambertMaterial({ color: secondaryColor });
        const plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
        plinth.position.y = height * 0.1;
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        structGroup.add(plinth);
        
        // Main statue
        const statueGeometry = new THREE.CylinderGeometry(width * 0.2, width * 0.2, height * 0.8, 8);
        const statueMaterial = new THREE.MeshLambertMaterial({ color: primaryColor });
        const statue = new THREE.Mesh(statueGeometry, statueMaterial);
        statue.position.y = height * 0.6;
        statue.castShadow = true;
        structGroup.add(statue);
        
        // Add decorative elements
        const ringGeometry = new THREE.TorusGeometry(width * 0.3, width * 0.03, 8, 24);
        const ringMaterial = new THREE.MeshLambertMaterial({ color: secondaryColor });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = height * 0.7;
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        structGroup.add(ring);
        
        break;
      }
      
      case 'bridge': {
        // Create bridge deck
        const deckGeometry = new THREE.BoxGeometry(width, height * 0.1, length);
        const deckMaterial = new THREE.MeshLambertMaterial({ color: primaryColor });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.y = height * 0.05;
        deck.castShadow = true;
        deck.receiveShadow = true;
        structGroup.add(deck);
        
        // Create supports
        const supportGeometry = new THREE.BoxGeometry(width * 0.1, height, width * 0.1);
        const supportMaterial = new THREE.MeshLambertMaterial({ color: secondaryColor });
        
        // First support
        const support1 = new THREE.Mesh(supportGeometry, supportMaterial);
        support1.position.set(-width * 0.4, height * 0.5, length * 0.4);
        support1.castShadow = true;
        structGroup.add(support1);
        
        // Second support
        const support2 = new THREE.Mesh(supportGeometry, supportMaterial);
        support2.position.set(width * 0.4, height * 0.5, length * 0.4);
        support2.castShadow = true;
        structGroup.add(support2);
        
        // Third support
        const support3 = new THREE.Mesh(supportGeometry, supportMaterial);
        support3.position.set(-width * 0.4, height * 0.5, -length * 0.4);
        support3.castShadow = true;
        structGroup.add(support3);
        
        // Fourth support
        const support4 = new THREE.Mesh(supportGeometry, supportMaterial);
        support4.position.set(width * 0.4, height * 0.5, -length * 0.4);
        support4.castShadow = true;
        structGroup.add(support4);
        
        // Add railings
        const railingHeight = height * 0.3;
        const railingGeometry = new THREE.BoxGeometry(width, railingHeight, width * 0.05);
        const railingMaterial = new THREE.MeshLambertMaterial({ color: secondaryColor });
        
        // Front railing
        const railing1 = new THREE.Mesh(railingGeometry, railingMaterial);
        railing1.position.set(0, height * 0.1 + railingHeight / 2, length / 2 - width * 0.025);
        railing1.castShadow = true;
        structGroup.add(railing1);
        
        // Back railing
        const railing2 = new THREE.Mesh(railingGeometry, railingMaterial);
        railing2.position.set(0, height * 0.1 + railingHeight / 2, -length / 2 + width * 0.025);
        railing2.castShadow = true;
        structGroup.add(railing2);
        
        break;
      }
      
      case 'altar': {
        // Base
        const baseGeometry = new THREE.BoxGeometry(width, height * 0.2, width);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: secondaryColor });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = height * 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        structGroup.add(base);
        
        // Top slab
        const topGeometry = new THREE.BoxGeometry(width * 1.2, height * 0.1, width * 1.2);
        const topMaterial = new THREE.MeshLambertMaterial({ color: primaryColor });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = height * 0.95;
        top.castShadow = true;
        structGroup.add(top);
        
        // Pillars
        const pillarGeometry = new THREE.CylinderGeometry(width * 0.08, width * 0.08, height * 0.7, 6);
        const pillarMaterial = new THREE.MeshLambertMaterial({ color: primaryColor });
        
        const pillarPositions = [
          [-width * 0.4, -width * 0.4],
          [width * 0.4, -width * 0.4],
          [-width * 0.4, width * 0.4],
          [width * 0.4, width * 0.4]
        ];
        
        pillarPositions.forEach(([x, z]) => {
          const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
          pillar.position.set(x, height * 0.5, z);
          pillar.castShadow = true;
          structGroup.add(pillar);
        });
        
        // Add magical effects if it's a magical structure
        if (structure.appearance.style === 'magical') {
          const glowColor = structure.appearance.emissiveColor || '#4DB6AC';
          const glowGeometry = new THREE.SphereGeometry(width * 0.2, 8, 6);
          const glowMaterial = new THREE.MeshLambertMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.4,
            emissive: glowColor,
            emissiveIntensity: 1.0
          });
          
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          glow.position.y = height;
          structGroup.add(glow);
        }
        
        break;
      }
      
      case 'statue': {
        // Base
        const baseGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.1, width * 0.8);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: secondaryColor });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = height * 0.05;
        base.castShadow = true;
        base.receiveShadow = true;
        structGroup.add(base);
        
        // Main figure - simplified humanoid shape
        const torsoGeometry = new THREE.CylinderGeometry(width * 0.2, width * 0.25, height * 0.4, 8);
        const figureMaterial = new THREE.MeshLambertMaterial({ color: primaryColor });
        const torso = new THREE.Mesh(torsoGeometry, figureMaterial);
        torso.position.y = height * 0.3;
        torso.castShadow = true;
        structGroup.add(torso);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(width * 0.15, 8, 6);
        const head = new THREE.Mesh(headGeometry, figureMaterial);
        head.position.y = height * 0.6;
        head.castShadow = true;
        structGroup.add(head);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(width * 0.05, width * 0.05, height * 0.4, 6);
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, figureMaterial);
        leftArm.position.set(width * 0.25, height * 0.3, 0);
        leftArm.rotation.z = -Math.PI / 4;
        leftArm.castShadow = true;
        structGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, figureMaterial);
        rightArm.position.set(-width * 0.25, height * 0.3, 0);
        rightArm.rotation.z = Math.PI / 4;
        rightArm.castShadow = true;
        structGroup.add(rightArm);
        
        // Add weathering if specified
        if (structure.appearance.weathered) {
          // Apply a more weathered texture or color
          figureMaterial.color.set(0x9E9E9E);
          
          // Add cracks or damage to the statue
          const crackGeometry = new THREE.BoxGeometry(width * 0.01, height * 0.2, width * 0.01);
          const crackMaterial = new THREE.MeshLambertMaterial({ color: 0x212121 });
          
          for (let i = 0; i < 5; i++) {
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            // Random positions on the statue
            const part = Math.random();
            let y, x, z;
            
            if (part < 0.3) {
              // Crack in base
              y = height * 0.05;
              x = (Math.random() - 0.5) * width * 0.7;
              z = (Math.random() - 0.5) * width * 0.7;
            } else if (part < 0.7) {
              // Crack in torso
              y = height * 0.3;
              x = (Math.random() - 0.5) * width * 0.4;
              z = (Math.random() - 0.5) * width * 0.4;
            } else {
              // Crack in head
              y = height * 0.6;
              x = (Math.random() - 0.5) * width * 0.3;
              z = (Math.random() - 0.5) * width * 0.3;
            }
            
            crack.position.set(x, y, z);
            crack.rotation.set(
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            );
            
            structGroup.add(crack);
          }
        }
        
        break;
      }
      
      default: {
        // Create a basic structure for any other types
        const genericGeometry = new THREE.BoxGeometry(width, height, length);
        const genericMaterial = new THREE.MeshLambertMaterial({ color: primaryColor });
        const genericStructure = new THREE.Mesh(genericGeometry, genericMaterial);
        genericStructure.position.y = height / 2; // Center with bottom at ground level
        genericStructure.castShadow = true;
        genericStructure.receiveShadow = true;
        structGroup.add(genericStructure);
      }
    }
    
    // Apply any custom visual effects
    if (structure.appearance.glow) {
      const glowColor = structure.appearance.emissiveColor || primaryColor;
      const glowGeometry = new THREE.SphereGeometry(Math.max(width, length) * 0.6, 8, 6);
      const glowMaterial = new THREE.MeshLambertMaterial({ 
        color: glowColor,
        transparent: true,
        opacity: 0.2,
        emissive: glowColor,
        emissiveIntensity: structure.appearance.emissiveIntensity || 1.0
      });
      
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.y = height * 0.5;
      structGroup.add(glowMesh);
    }
    
    // Set position, scale and rotation from the map object
    structGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    structGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
    
    return structGroup;
  }

  // Enhanced object creation methods with improved detail
  private createChest(obj: MapObject): THREE.Group {
    const chestGroup = new THREE.Group();

    // Main chest body
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.6);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: obj.color ? parseInt(obj.color.replace('#', ''), 16) : 0x8B4513 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    chestGroup.add(body);

    // Chest lid
    const lidGeometry = new THREE.BoxGeometry(0.82, 0.1, 0.62);
    const lidMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(0, 0.3, 0);
    lid.castShadow = true;
    chestGroup.add(lid);

    // Metal straps
    const strapGeometry = new THREE.BoxGeometry(0.85, 0.05, 0.1);
    const strapMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    
    const strap1 = new THREE.Mesh(strapGeometry, strapMaterial);
    strap1.position.set(0, 0, 0.2);
    chestGroup.add(strap1);
    
    const strap2 = new THREE.Mesh(strapGeometry, strapMaterial);
    strap2.position.set(0, 0, -0.2);
    chestGroup.add(strap2);

    // Lock
    const lockGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.05);
    const lockMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const lock = new THREE.Mesh(lockGeometry, lockMaterial);
    lock.position.set(0, 0.1, 0.31);
    chestGroup.add(lock);

    chestGroup.position.set(obj.position.x, obj.position.y + 0.25, obj.position.z);
    chestGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    chestGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return chestGroup;
  }

  private createCrate(obj: MapObject): THREE.Group {
    const crateGroup = new THREE.Group();

    // Main crate
    const crateGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const crateMaterial = new THREE.MeshLambertMaterial({ 
      color: obj.color ? parseInt(obj.color.replace('#', ''), 16) : 0xD2B48C 
    });
    const crate = new THREE.Mesh(crateGeometry, crateMaterial);
    crate.castShadow = true;
    crateGroup.add(crate);

    // Wood slats
    const slatGeometry = new THREE.BoxGeometry(0.62, 0.05, 0.1);
    const slatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    for (let i = 0; i < 3; i++) {
      const slat = new THREE.Mesh(slatGeometry, slatMaterial);
      slat.position.set(0, -0.2 + i * 0.2, 0.31);
      crateGroup.add(slat);
    }

    // Corner reinforcements
    const cornerGeometry = new THREE.BoxGeometry(0.05, 0.65, 0.05);
    const corners = [
      { x: -0.275, z: -0.275 },
      { x: 0.275, z: -0.275 },
      { x: -0.275, z: 0.275 },
      { x: 0.275, z: 0.275 }
    ];

    corners.forEach(corner => {
      const cornerMesh = new THREE.Mesh(cornerGeometry, slatMaterial);
      cornerMesh.position.set(corner.x, 0, corner.z);
      crateGroup.add(cornerMesh);
    });

    crateGroup.position.set(obj.position.x, obj.position.y + 0.3, obj.position.z);
    crateGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    crateGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return crateGroup;
  }

  private createPlant(obj: MapObject): THREE.Group {
    const plantGroup = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4);
    const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.4;
    plantGroup.add(stem);

    // Leaves at different heights
    const leafGeometry = new THREE.SphereGeometry(0.15, 6, 4);
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
    
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      const angle = (i / 4) * Math.PI * 2;
      leaf.position.set(
        Math.cos(angle) * 0.2,
        0.6 + i * 0.1,
        Math.sin(angle) * 0.2
      );
      leaf.scale.set(1, 0.3, 1); // Flatten leaves
      plantGroup.add(leaf);
    }

    // Flower on top
    const flowerGeometry = new THREE.SphereGeometry(0.08, 6, 4);
    const flowerMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
    const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
    flower.position.y = 1.0;
    plantGroup.add(flower);

    plantGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    plantGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    plantGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return plantGroup;
  }

  private createMushroom(obj: MapObject): THREE.Group {
    const mushroomGroup = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.3, 8);
    const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.15;
    stem.castShadow = true;
    mushroomGroup.add(stem);

    // Cap
    const capGeometry = new THREE.SphereGeometry(0.2, 8, 6);
    const capMaterial = new THREE.MeshLambertMaterial({ color: 0xDC143C });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 0.35;
    cap.scale.y = 0.6;
    cap.castShadow = true;
    mushroomGroup.add(cap);

    // Spots on cap
    const spotGeometry = new THREE.SphereGeometry(0.03, 6, 4);
    const spotMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    
    for (let i = 0; i < 5; i++) {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      const angle = (i / 5) * Math.PI * 2;
      spot.position.set(
        Math.cos(angle) * 0.12,
        0.4,
        Math.sin(angle) * 0.12
      );
      mushroomGroup.add(spot);
    }

    // Gills under cap
    const gillGeometry = new THREE.RingGeometry(0.05, 0.18, 16);
    const gillMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513,
      side: THREE.DoubleSide 
    });
    const gills = new THREE.Mesh(gillGeometry, gillMaterial);
    gills.position.y = 0.25;
    gills.rotation.x = Math.PI;
    mushroomGroup.add(gills);

    mushroomGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    mushroomGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    mushroomGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return mushroomGroup;
  }

  private createCrystal(obj: MapObject): THREE.Group {
    const crystalGroup = new THREE.Group();
    
    // Main crystal
    const crystalGeometry = new THREE.ConeGeometry(0.3, 1.5, 6);
    const crystalMaterial = new THREE.MeshLambertMaterial({ 
      color: obj.color ? parseInt(obj.color.replace('#', ''), 16) : 0x9370DB,
      transparent: true,
      opacity: 0.8
    });
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    crystal.position.y = 0.75;
    crystal.castShadow = true;
    crystalGroup.add(crystal);

    // Smaller crystals around base
    for (let i = 0; i < 3; i++) {
      const smallCrystal = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.5, 6),
        crystalMaterial.clone()
      );
      const angle = (i / 3) * Math.PI * 2;
      smallCrystal.position.set(
        Math.cos(angle) * 0.3,
        0.25,
        Math.sin(angle) * 0.3
      );
      smallCrystal.rotation.z = (Math.random() - 0.5) * 0.5;
      crystalGroup.add(smallCrystal);
    }

    crystalGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    crystalGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    crystalGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return crystalGroup;
  }

  private createLog(obj: MapObject): THREE.Group {
    const logGroup = new THREE.Group();

    // Main log
    const logGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2, 8);
    const logMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const log = new THREE.Mesh(logGeometry, logMaterial);
    log.castShadow = true;
    logGroup.add(log);

    // Bark texture rings
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.25, 0.27, 8),
        new THREE.MeshLambertMaterial({ color: 0x654321 })
      );
      ring.position.x = -0.6 + i * 0.6;
      ring.rotation.z = Math.PI / 2;
      logGroup.add(ring);
    }

    // End caps showing wood grain
    const endCapGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
    const endCapMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
    
    const endCap1 = new THREE.Mesh(endCapGeometry, endCapMaterial);
    endCap1.position.x = -1;
    endCap1.rotation.z = Math.PI / 2;
    logGroup.add(endCap1);
    
    const endCap2 = new THREE.Mesh(endCapGeometry, endCapMaterial);
    endCap2.position.x = 1;
    endCap2.rotation.z = Math.PI / 2;
    logGroup.add(endCap2);

    logGroup.position.set(obj.position.x, obj.position.y + 0.2, obj.position.z);
    logGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    logGroup.rotation.set(obj.rotation.x, obj.rotation.y, Math.PI / 2); // Lay it horizontally

    return logGroup;
  }

  private createBerryBush(obj: MapObject): THREE.Group {
    const bushGroup = new THREE.Group();

    // Main bush
    const bushGeometry = new THREE.SphereGeometry(0.6, 8, 6);
    const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x006400 });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.y = 0.4;
    bush.castShadow = true;
    bushGroup.add(bush);

    // Berries
    const berryGeometry = new THREE.SphereGeometry(0.04, 6, 4);
    const berryMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    
    for (let i = 0; i < 12; i++) {
      const berry = new THREE.Mesh(berryGeometry, berryMaterial);
      const phi = Math.acos(1 - 2 * Math.random()); // Uniform distribution on sphere
      const theta = 2 * Math.PI * Math.random();
      const radius = 0.5 + Math.random() * 0.1;
      
      berry.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        0.4 + radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
      bushGroup.add(berry);
    }

    // Some leaves sticking out
    const leafGeometry = new THREE.SphereGeometry(0.08, 6, 4);
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
    
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      const angle = (i / 6) * Math.PI * 2;
      leaf.position.set(
        Math.cos(angle) * 0.7,
        0.4 + Math.random() * 0.3,
        Math.sin(angle) * 0.7
      );
      leaf.scale.set(1, 0.3, 1);
      bushGroup.add(leaf);
    }

    bushGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    bushGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    bushGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return bushGroup;
  }

  private createWell(obj: MapObject): THREE.Group {
    const wellGroup = new THREE.Group();

    // Well base
    const baseGeometry = new THREE.CylinderGeometry(0.8, 0.9, 0.3, 12);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.15;
    base.castShadow = true;
    wellGroup.add(base);

    // Well walls
    const wallGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1, 12);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 0.8;
    wall.castShadow = true;
    wellGroup.add(wall);

    // Well interior (dark)
    const interiorGeometry = new THREE.CylinderGeometry(0.65, 0.65, 0.95, 12);
    const interiorMaterial = new THREE.MeshLambertMaterial({ color: 0x000033 });
    const interior = new THREE.Mesh(interiorGeometry, interiorMaterial);
    interior.position.y = 0.8;
    wellGroup.add(interior);

    // Roof supports
    const supportGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 6);
    const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    for (let i = 0; i < 4; i++) {
      const support = new THREE.Mesh(supportGeometry, supportMaterial);
      const angle = (i / 4) * Math.PI * 2;
      support.position.set(
        Math.cos(angle) * 0.9,
        1.8,
        Math.sin(angle) * 0.9
      );
      wellGroup.add(support);
    }

    // Roof
    const roofGeometry = new THREE.ConeGeometry(1.2, 0.8, 8);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3;
    roof.castShadow = true;
    wellGroup.add(roof);

    // Bucket and rope
    const bucketGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.15, 8);
    const bucketMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
    bucket.position.set(0.3, 1.5, 0.3);
    wellGroup.add(bucket);

    wellGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    wellGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    wellGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return wellGroup;
  }

  private createCampfire(obj: MapObject): THREE.Group {
    const campfireGroup = new THREE.Group();

    // Fire pit (stones in circle)
    const stoneGeometry = new THREE.DodecahedronGeometry(0.1);
    const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    
    for (let i = 0; i < 8; i++) {
      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      const angle = (i / 8) * Math.PI * 2;
      stone.position.set(
        Math.cos(angle) * 0.4,
        0.05,
        Math.sin(angle) * 0.4
      );
      stone.scale.set(
        0.8 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4
      );
      campfireGroup.add(stone);
    }

    // Logs
    const logGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
    const logMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(logGeometry, logMaterial);
      const angle = (i / 4) * Math.PI * 2;
      log.position.set(
        Math.cos(angle) * 0.1,
        0.1,
        Math.sin(angle) * 0.1
      );
      log.rotation.z = angle;
      campfireGroup.add(log);
    }

    // Ash/charcoal
    const ashGeometry = new THREE.SphereGeometry(0.15, 6, 4);
    const ashMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const ash = new THREE.Mesh(ashGeometry, ashMaterial);
    ash.position.y = 0.05;
    ash.scale.set(1, 0.3, 1);
    campfireGroup.add(ash);

    // Embers/flames (simple red glow)
    const emberGeometry = new THREE.SphereGeometry(0.1, 6, 4);
    const emberMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xFF4500,
      transparent: true,
      opacity: 0.7
    });
    const ember = new THREE.Mesh(emberGeometry, emberMaterial);
    ember.position.y = 0.2;
    campfireGroup.add(ember);

    campfireGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    campfireGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    campfireGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return campfireGroup;
  }

  private createFence(obj: MapObject): THREE.Group {
    const fenceGroup = new THREE.Group();

    // Fence posts
    const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
    const postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    for (let i = 0; i < 3; i++) {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(i - 1, 0.5, 0);
      post.castShadow = true;
      fenceGroup.add(post);
    }

    // Fence rails
    const railGeometry = new THREE.BoxGeometry(2.2, 0.1, 0.1);
    const railMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    
    for (let i = 0; i < 2; i++) {
      const rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.position.set(0, 0.3 + i * 0.4, 0);
      rail.castShadow = true;
      fenceGroup.add(rail);
    }

    // Post caps
    const capGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 6);
    const capMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    
    for (let i = 0; i < 3; i++) {
      const cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(i - 1, 1.02, 0);
      fenceGroup.add(cap);
    }

    fenceGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    fenceGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    fenceGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return fenceGroup;
  }

  private createCart(obj: MapObject): THREE.Group {
    const cartGroup = new THREE.Group();

    // Cart body
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    cartGroup.add(body);

    // Cart sides
    const sideGeometry = new THREE.BoxGeometry(1.22, 0.3, 0.05);
    const sideMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    
    const frontSide = new THREE.Mesh(sideGeometry, sideMaterial);
    frontSide.position.set(0, 0.55, 0.4);
    cartGroup.add(frontSide);
    
    const backSide = new THREE.Mesh(sideGeometry, sideMaterial);
    backSide.position.set(0, 0.55, -0.4);
    cartGroup.add(backSide);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    
    const positions = [
      { x: -0.5, y: 0.25, z: -0.5 },
      { x: 0.5, y: 0.25, z: -0.5 },
      { x: -0.5, y: 0.25, z: 0.5 },
      { x: 0.5, y: 0.25, z: 0.5 }
    ];
    
    positions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.rotation.x = Math.PI / 2;
      wheel.castShadow = true;
      
      // Wheel spokes
      for (let i = 0; i < 4; i++) {
        const spoke = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.03, 0.03),
          new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        spoke.rotation.z = (i / 4) * Math.PI * 2;
        wheel.add(spoke);
      }
      
      cartGroup.add(wheel);
    });

    // Handle
    const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.8, -0.8);
    handle.rotation.z = Math.PI / 6;
    cartGroup.add(handle);

    // Crossbar
    const crossbarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
    const crossbar = new THREE.Mesh(crossbarGeometry, handleMaterial);
    crossbar.position.set(0, 0.6, -0.9);
    crossbar.rotation.z = Math.PI / 2;
    cartGroup.add(crossbar);

    cartGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    cartGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    cartGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return cartGroup;
  }

  private createTree(obj: MapObject, biome: string): THREE.Group {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
    const trunkColor = obj.color ? parseInt(obj.color.replace('#', ''), 16) : 0x8B4513;
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: trunkColor });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Bark texture
    for (let i = 0; i < 3; i++) {
      const barkRing = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.32, 8),
        new THREE.MeshLambertMaterial({ color: 0x654321 })
      );
      barkRing.position.y = 0.5 + i * 1;
      barkRing.rotation.x = Math.PI / 2;
      barkRing.rotation.z = Math.random() * Math.PI;
      treeGroup.add(barkRing);
    }

    // Leaves
    const leavesGeometry = new THREE.SphereGeometry(1, 8, 6);
    const leavesColor = biome === 'desert' ? 0x556B2F : 0x228B22;
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: leavesColor });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 3.5;
    leaves.castShadow = true;
    treeGroup.add(leaves);

    // Additional smaller leaf clusters
    for (let i = 0; i < 3; i++) {
      const smallLeaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 6, 4),
        leavesMaterial
      );
      const angle = (i / 3) * Math.PI * 2;
      smallLeaves.position.set(
        Math.cos(angle) * 0.8,
        3.2 + Math.random() * 0.6,
        Math.sin(angle) * 0.8
      );
      treeGroup.add(smallLeaves);
    }

    // Branches
    const branchGeometry = new THREE.CylinderGeometry(0.05, 0.08, 1, 6);
    const branchMaterial = new THREE.MeshLambertMaterial({ color: trunkColor });
    
    for (let i = 0; i < 4; i++) {
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      const angle = (i / 4) * Math.PI * 2;
      branch.position.set(
        Math.cos(angle) * 0.4,
        2.5 + Math.random() * 0.5,
        Math.sin(angle) * 0.4
      );
      branch.rotation.z = angle + Math.PI / 2;
      branch.rotation.x = -Math.PI / 6;
      treeGroup.add(branch);
    }

    treeGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    treeGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    treeGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    return treeGroup;
  }

  private createFlower(obj: MapObject): THREE.Group {
    const flowerGroup = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
    const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.25;
    flowerGroup.add(stem);

    // Petals
    const petalGeometry = new THREE.SphereGeometry(0.08, 6, 4);
    const colors = [0xFF69B4, 0xFF0000, 0xFFFF00, 0xFF4500, 0x9370DB];
    const petalColor = colors[Math.floor(Math.random() * colors.length)];
    const petalMaterial = new THREE.MeshLambertMaterial({ color: petalColor });
    
    // Center
    const centerGeometry = new THREE.SphereGeometry(0.04, 6, 4);
    const centerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.y = 0.5;
    flowerGroup.add(center);
    
    // Petals around center
    for (let i = 0; i < 6; i++) {
      const petal = new THREE.Mesh(petalGeometry, petalMaterial);
      const angle = (i / 6) * Math.PI * 2;
      petal.position.set(
        Math.cos(angle) * 0.1,
        0.5,
        Math.sin(angle) * 0.1
      );
      petal.scale.set(1, 0.3, 1);
      flowerGroup.add(petal);
    }

    // Leaves
    const leafGeometry = new THREE.SphereGeometry(0.12, 6, 4);
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
    
    for (let i = 0; i < 2; i++) {
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      const angle = (i / 2) * Math.PI;
      leaf.position.set(
        Math.cos(angle) * 0.15,
        0.3,
        Math.sin(angle) * 0.15
      );
      leaf.scale.set(1.5, 0.2, 0.8);
      leaf.rotation.y = angle;
      flowerGroup.add(leaf);
    }

    flowerGroup.position.set(obj.position.x, obj.position.y, obj.position.z);
    flowerGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);

    return flowerGroup;
  }

  private unloadDistantTiles(playerTileX: number, playerTileZ: number): void {
    const unloadDistance = this.loadDistance + 1;
    const tilesToUnload: string[] = [];

    this.loadedTiles.forEach((tileGroup, tileId) => {
      const [x, z] = tileId.split('_').map(Number);
      const distance = Math.max(
        Math.abs(x - playerTileX),
        Math.abs(z - playerTileZ)
      );

      if (distance > unloadDistance) {
        tilesToUnload.push(tileId);
      }
    });

    tilesToUnload.forEach(tileId => {
      const tileGroup = this.loadedTiles.get(tileId);
      if (tileGroup) {
        this.scene.remove(tileGroup);
        this.loadedTiles.delete(tileId);

        // Clean up collision objects for this tile
        const collisionIds = this.terrainCollisionObjects.get(tileId);
        if (collisionIds) {
          collisionIds.forEach(id => {
            collisionSystem.unregisterObject(id);
          });
          this.terrainCollisionObjects.delete(tileId);
        }

        // Also clean up interactable objects for this tile
        if (this.character) {
          const interactableManager = this.character.getInteractableObjectManager();
          const allObjects = interactableManager.getAllObjects();
          
          allObjects.forEach(object => {
            if (object.id.startsWith(tileId)) {
              interactableManager.removeObject(object.id, false); // Don't remove from scene as tile is already removed
            }
          });
        }

        console.log(`🗑️ Unloaded tile ${tileId} and cleaned up collision objects`);
      }
    });

    // Also unload distant NPCs (but preserve the starting NPC)
    const npcsToUnload: string[] = [];
    this.loadedNPCs.forEach((npc, npcId) => {
      // Never unload the starting NPC
      if (npcId === 'starting_guide_npc') return;
      
      const npcPos = npc.getPosition();
      const npcTileX = Math.floor(npcPos.x / this.tileSize);
      const npcTileZ = Math.floor(npcPos.z / this.tileSize);
      const distance = Math.max(
        Math.abs(npcTileX - playerTileX),
        Math.abs(npcTileZ - playerTileZ)
      );

      if (distance > unloadDistance) {
        npcsToUnload.push(npcId);
      }
    });

    npcsToUnload.forEach(npcId => {
      const npc = this.loadedNPCs.get(npcId);
      if (npc) {
        this.scene.remove(npc.mesh);
        npc.dispose(); // Clean up NPC collision objects
        this.loadedNPCs.delete(npcId);
        console.log(`👤 Unloaded NPC ${npcId}`);
      }
    });
  }

  getTileInfo(x: number, z: number) {
    return this.aiGenerator.getTileInfo(x, z);
  }

  // Performance optimization: Clear mesh cache periodically
  private clearMeshCache(): void {
    if (this.objectMeshCache.size > 100) {
      // Keep only the 50 most recently used meshes
      const entries = Array.from(this.objectMeshCache.entries());
      entries.splice(0, entries.length - 50);
      this.objectMeshCache.clear();
      entries.forEach(([key, value]) => {
        this.objectMeshCache.set(key, value);
      });
      console.log('🧹 Cleared object mesh cache');
    }
  }

  dispose(): void {
    console.log('🧹 Disposing MapManager...');
    
    // Remove all loaded tiles
    this.loadedTiles.forEach(tileGroup => {
      this.scene.remove(tileGroup);
    });
    this.loadedTiles.clear();
    
    // Remove all NPCs
    this.loadedNPCs.forEach(npc => {
      this.scene.remove(npc.mesh);
      npc.dispose(); // Clean up NPC collision objects
    });
    this.loadedNPCs.clear();
    
    // Clean up collision objects
    this.terrainCollisionObjects.forEach(collisionIds => {
      collisionIds.forEach(id => {
        collisionSystem.unregisterObject(id);
      });
    });
    this.terrainCollisionObjects.clear();
    
    // Clear generation state
    this.isGenerating.clear();
    
    // Clear caches
    this.aiGenerator.clearCache();
    this.objectMeshCache.clear();
    this.customVegetation = [];
    this.customStructures = [];

    // Clear interactable objects
    if (this.character) {
      this.character.getInteractableObjectManager().clear();
    }

    console.log('✅ MapManager disposed successfully');
  }
}