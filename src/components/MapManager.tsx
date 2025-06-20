import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapTile, BiomeType } from '../types/MapTypes';
import { Logger } from '../services/Logger';

interface MapManagerProps {
  gameId: string;
  playerPosition: { x: number; y: number; z: number };
  scene: THREE.Scene;
  onTileLoaded?: (tile: MapTile) => void;
  onTileUnloaded?: (tile: MapTile) => void;
}

interface LoadedTile {
  tile: MapTile;
  meshes: THREE.Object3D[];
  lastAccessed: number;
}

export const MapManager: React.FC<MapManagerProps> = ({
  gameId,
  playerPosition,
  scene,
  onTileLoaded,
  onTileUnloaded
}) => {
  const [loadedTiles, setLoadedTiles] = useState<Map<string, LoadedTile>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const loadingQueue = useRef<Set<string>>(new Set());
  const TILE_SIZE = 100;
  const RENDER_DISTANCE = 3; // Load tiles within this radius
  const MAX_LOADED_TILES = 25; // Maximum number of tiles to keep loaded

  // Convert world position to tile coordinates
  const worldToTileCoords = (x: number, z: number) => ({
    tileX: Math.floor(x / TILE_SIZE),
    tileZ: Math.floor(z / TILE_SIZE)
  });

  // Generate tile key for indexing
  const getTileKey = (tileX: number, tileZ: number) => `${tileX},${tileZ}`;

  // Load a single tile from database or generate if not exists
  const loadTile = async (tileX: number, tileZ: number): Promise<MapTile | null> => {
    try {
      const { data: existingTile, error } = await supabase
        .from('map_tiles')
        .select('*')
        .eq('game_id', gameId)
        .eq('tile_x', tileX)
        .eq('tile_z', tileZ)
        .single();

      if (error && error.code !== 'PGRST116') {
        Logger.error('Error loading tile:', error);
        return null;
      }

      if (existingTile) {
        return existingTile as MapTile;
      }

      // Generate new tile if it doesn't exist
      const newTile = await generateTile(tileX, tileZ);
      if (newTile) {
        const { error: insertError } = await supabase
          .from('map_tiles')
          .insert([newTile]);

        if (insertError) {
          Logger.error('Error saving generated tile:', insertError);
        }
      }

      return newTile;
    } catch (error) {
      Logger.error('Error in loadTile:', error);
      return null;
    }
  };

  // Generate a new tile with biome and objects
  const generateTile = async (tileX: number, tileZ: number): Promise<MapTile | null> => {
    try {
      // Simple biome generation based on position
      const biomes: BiomeType[] = ['grassland', 'forest', 'mountain', 'desert', 'tundra'];
      const biomeIndex = Math.abs((tileX * 7 + tileZ * 13) % biomes.length);
      const biome = biomes[biomeIndex];

      // Generate objects for the tile
      const objects = generateTileObjects(biome, tileX, tileZ);

      const newTile: Omit<MapTile, 'id'> = {
        game_id: gameId,
        tile_x: tileX,
        tile_z: tileZ,
        biome,
        objects,
        description: `A ${biome} tile at coordinates (${tileX}, ${tileZ})`,
        theme: biome,
        generated_at: new Date().toISOString()
      };

      return newTile as MapTile;
    } catch (error) {
      Logger.error('Error generating tile:', error);
      return null;
    }
  };

  // Generate objects for a tile based on biome
  const generateTileObjects = (biome: BiomeType, tileX: number, tileZ: number) => {
    const objects = [];
    const random = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const baseSeed = tileX * 1000 + tileZ;

    // Generate different objects based on biome
    switch (biome) {
      case 'forest':
        // Trees
        for (let i = 0; i < 8; i++) {
          const seed = baseSeed + i;
          objects.push({
            id: `tree_${tileX}_${tileZ}_${i}`,
            type: 'tree',
            position: {
              x: tileX * TILE_SIZE + random(seed) * TILE_SIZE,
              y: 0,
              z: tileZ * TILE_SIZE + random(seed + 1) * TILE_SIZE
            },
            rotation: { x: 0, y: random(seed + 2) * Math.PI * 2, z: 0 },
            scale: { x: 1, y: 1 + random(seed + 3) * 0.5, z: 1 }
          });
        }
        break;

      case 'mountain':
        // Rocks
        for (let i = 0; i < 5; i++) {
          const seed = baseSeed + i;
          objects.push({
            id: `rock_${tileX}_${tileZ}_${i}`,
            type: 'rock',
            position: {
              x: tileX * TILE_SIZE + random(seed) * TILE_SIZE,
              y: random(seed + 1) * 10,
              z: tileZ * TILE_SIZE + random(seed + 2) * TILE_SIZE
            },
            rotation: { x: 0, y: random(seed + 3) * Math.PI * 2, z: 0 },
            scale: { x: 1 + random(seed + 4), y: 1 + random(seed + 5), z: 1 + random(seed + 6) }
          });
        }
        break;

      case 'grassland':
        // Grass patches and occasional trees
        for (let i = 0; i < 3; i++) {
          const seed = baseSeed + i;
          objects.push({
            id: `grass_${tileX}_${tileZ}_${i}`,
            type: 'grass',
            position: {
              x: tileX * TILE_SIZE + random(seed) * TILE_SIZE,
              y: 0,
              z: tileZ * TILE_SIZE + random(seed + 1) * TILE_SIZE
            },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          });
        }
        break;

      default:
        // Default sparse vegetation
        for (let i = 0; i < 2; i++) {
          const seed = baseSeed + i;
          objects.push({
            id: `plant_${tileX}_${tileZ}_${i}`,
            type: 'plant',
            position: {
              x: tileX * TILE_SIZE + random(seed) * TILE_SIZE,
              y: 0,
              z: tileZ * TILE_SIZE + random(seed + 1) * TILE_SIZE
            },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          });
        }
    }

    return objects;
  };

  // Create 3D meshes for a tile
  const createTileMeshes = (tile: MapTile): THREE.Object3D[] => {
    const meshes: THREE.Object3D[] = [];

    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: getBiomeColor(tile.biome) 
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(
      tile.tile_x * TILE_SIZE + TILE_SIZE / 2,
      0,
      tile.tile_z * TILE_SIZE + TILE_SIZE / 2
    );
    meshes.push(groundMesh);

    // Create object meshes
    tile.objects?.forEach(obj => {
      const objectMesh = createObjectMesh(obj);
      if (objectMesh) {
        meshes.push(objectMesh);
      }
    });

    return meshes;
  };

  // Get color for biome
  const getBiomeColor = (biome: BiomeType): number => {
    switch (biome) {
      case 'grassland': return 0x4CAF50;
      case 'forest': return 0x2E7D32;
      case 'mountain': return 0x795548;
      case 'desert': return 0xFFC107;
      case 'tundra': return 0xE0E0E0;
      default: return 0x4CAF50;
    }
  };

  // Create mesh for a tile object
  const createObjectMesh = (obj: any): THREE.Object3D | null => {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (obj.type) {
      case 'tree':
        // Simple tree representation
        const treeGroup = new THREE.Group();
        
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 4;
        treeGroup.add(trunk);

        // Foliage
        const foliageGeometry = new THREE.SphereGeometry(4, 8, 6);
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 10;
        treeGroup.add(foliage);

        treeGroup.position.copy(obj.position);
        treeGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        treeGroup.scale.copy(obj.scale);
        return treeGroup;

      case 'rock':
        geometry = new THREE.DodecahedronGeometry(2);
        material = new THREE.MeshLambertMaterial({ color: 0x808080 });
        break;

      case 'grass':
        geometry = new THREE.PlaneGeometry(2, 2);
        material = new THREE.MeshLambertMaterial({ 
          color: 0x90EE90, 
          transparent: true, 
          opacity: 0.8 
        });
        break;

      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(obj.position);
    mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
    mesh.scale.copy(obj.scale);
    return mesh;
  };

  // Update loaded tiles based on player position
  const updateLoadedTiles = async () => {
    if (isLoading) return;

    const { tileX: playerTileX, tileZ: playerTileZ } = worldToTileCoords(playerPosition.x, playerPosition.z);
    const tilesToLoad: string[] = [];
    const tilesToUnload: string[] = [];

    // Determine which tiles should be loaded
    const shouldLoadTiles = new Set<string>();
    for (let x = playerTileX - RENDER_DISTANCE; x <= playerTileX + RENDER_DISTANCE; x++) {
      for (let z = playerTileZ - RENDER_DISTANCE; z <= playerTileZ + RENDER_DISTANCE; z++) {
        const distance = Math.sqrt((x - playerTileX) ** 2 + (z - playerTileZ) ** 2);
        if (distance <= RENDER_DISTANCE) {
          shouldLoadTiles.add(getTileKey(x, z));
        }
      }
    }

    // Find tiles to load
    shouldLoadTiles.forEach(tileKey => {
      if (!loadedTiles.has(tileKey) && !loadingQueue.current.has(tileKey)) {
        tilesToLoad.push(tileKey);
      }
    });

    // Find tiles to unload
    loadedTiles.forEach((loadedTile, tileKey) => {
      if (!shouldLoadTiles.has(tileKey)) {
        tilesToUnload.push(tileKey);
      }
    });

    // Unload distant tiles
    tilesToUnload.forEach(tileKey => {
      const loadedTile = loadedTiles.get(tileKey);
      if (loadedTile) {
        // Remove meshes from scene
        loadedTile.meshes.forEach(mesh => {
          scene.remove(mesh);
        });
        
        // Remove from loaded tiles
        const newLoadedTiles = new Map(loadedTiles);
        newLoadedTiles.delete(tileKey);
        setLoadedTiles(newLoadedTiles);

        if (onTileUnloaded) {
          onTileUnloaded(loadedTile.tile);
        }
      }
    });

    // Load new tiles
    if (tilesToLoad.length > 0) {
      setIsLoading(true);
      
      for (const tileKey of tilesToLoad) {
        loadingQueue.current.add(tileKey);
        const [tileX, tileZ] = tileKey.split(',').map(Number);
        
        try {
          const tile = await loadTile(tileX, tileZ);
          if (tile) {
            const meshes = createTileMeshes(tile);
            meshes.forEach(mesh => scene.add(mesh));

            const newLoadedTile: LoadedTile = {
              tile,
              meshes,
              lastAccessed: Date.now()
            };

            setLoadedTiles(prev => new Map(prev).set(tileKey, newLoadedTile));

            if (onTileLoaded) {
              onTileLoaded(tile);
            }
          }
        } catch (error) {
          Logger.error(`Error loading tile ${tileKey}:`, error);
        } finally {
          loadingQueue.current.delete(tileKey);
        }
      }
      
      setIsLoading(false);
    }

    // Cleanup old tiles if we have too many loaded
    if (loadedTiles.size > MAX_LOADED_TILES) {
      const sortedTiles = Array.from(loadedTiles.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const tilesToRemove = sortedTiles.slice(0, loadedTiles.size - MAX_LOADED_TILES);
      tilesToRemove.forEach(([tileKey, loadedTile]) => {
        loadedTile.meshes.forEach(mesh => scene.remove(mesh));
        const newLoadedTiles = new Map(loadedTiles);
        newLoadedTiles.delete(tileKey);
        setLoadedTiles(newLoadedTiles);
      });
    }
  };

  // Update tiles when player position changes
  useEffect(() => {
    updateLoadedTiles();
  }, [playerPosition.x, playerPosition.z, gameId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      loadedTiles.forEach(loadedTile => {
        loadedTile.meshes.forEach(mesh => scene.remove(mesh));
      });
    };
  }, []);

  // Component doesn't render anything visible
  return null;
};

export default MapManager;