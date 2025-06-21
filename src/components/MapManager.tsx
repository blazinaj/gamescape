import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { MapManager as MapManagerService } from '../services/MapManager';
import { MapTile } from '../types/MapTypes';
import { Character } from './Character';
import { NPC } from './NPC';

interface MapManagerProps {
  scene: THREE.Scene;
  character: Character;
  gameId?: string;
  playerPosition: THREE.Vector3;
  onTileGenerated?: (tile: MapTile, description: string) => void;
  onGenerationStart?: (x: number, z: number) => void;
  onBiomeChange?: (biome: string) => void;
  onNearbyNPCsChange?: (npcs: NPC[]) => void;
  onClosestNPCChange?: (npc: NPC | null) => void;
  onNearbyObjectsChange?: (objects: any[]) => void;
  onClosestObjectChange?: (object: any | null) => void;
  scenarioPrompt?: string;
  scenarioTheme?: string;
}

export const MapManager: React.FC<MapManagerProps> = ({
  scene,
  character,
  gameId,
  playerPosition,
  onTileGenerated,
  onGenerationStart,
  onBiomeChange,
  onNearbyNPCsChange,
  onClosestNPCChange,
  onNearbyObjectsChange,
  onClosestObjectChange,
  scenarioPrompt,
  scenarioTheme
}) => {
  const [mapManager, setMapManager] = useState<MapManagerService | null>(null);
  const [lastTileCoords, setLastTileCoords] = useState<{x: number, z: number}>({ x: 0, z: 0 });
  const [currentBiome, setCurrentBiome] = useState<string>('grassland');
  const tileSize = 25; // This should match the tileSize in MapManager service
  
  const updateInterval = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  // Initialize the map manager
  useEffect(() => {
    if (!scene) return;

    console.log('🗺️ Initializing MapManager component');
    const manager = new MapManagerService(scene);
    
    // Set character for interactable object registration
    if (character) {
      manager.setCharacter(character);
    }
    
    // Set callbacks
    manager.setCallbacks({
      onTileGenerated: (tile, description) => {
        if (onTileGenerated) onTileGenerated(tile, description);
      },
      onGenerationStart: (x, z) => {
        if (onGenerationStart) onGenerationStart(x, z);
      },
      onNPCInteraction: (npc) => {
        console.log('🗣️ NPC interaction event:', npc.data.name);
      }
    });
    
    // Set scenario if available
    if (scenarioPrompt && scenarioTheme) {
      console.log('🌍 Setting scenario in MapManager:', scenarioTheme);
      manager.setScenario(scenarioPrompt, scenarioTheme);
    }
    
    setMapManager(manager);
    
    // Initialize with first update
    if (playerPosition) {
      const initialTileX = Math.floor(playerPosition.x / tileSize);
      const initialTileZ = Math.floor(playerPosition.z / tileSize);
      setLastTileCoords({ x: initialTileX, z: initialTileZ });
      
      // Initial map update
      manager.updateAroundPosition(playerPosition).catch(error => {
        console.error('❌ Error in initial map update:', error);
      });
    }
    
    return () => {
      console.log('🧹 Cleaning up MapManager component');
      isComponentMounted.current = false;
      
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
      
      if (manager) {
        manager.dispose();
      }
    };
  }, [scene, character, scenarioPrompt, scenarioTheme]);

  // Set up periodic nearby entity detection
  useEffect(() => {
    if (!mapManager || !playerPosition || !character) return;
    
    // Clear any existing interval
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }
    
    // Set up an interval to update nearby entities
    updateInterval.current = setInterval(() => {
      if (!isComponentMounted.current) return;
      
      // Update nearby NPCs
      if (onNearbyNPCsChange) {
        const npcs = mapManager.getNearbyNPCs(playerPosition, 10);
        onNearbyNPCsChange(npcs);
      }
      
      // Find closest NPC
      if (onClosestNPCChange) {
        const npcs = mapManager.getNearbyNPCs(playerPosition, 3);
        let closest: NPC | null = null;
        let closestDistance = Infinity;
        
        for (const npc of npcs) {
          const distance = npc.distanceTo(playerPosition);
          if (distance < closestDistance) {
            closestDistance = distance;
            closest = npc;
          }
        }
        
        onClosestNPCChange(closest);
      }
      
      // Update nearby objects
      if (onNearbyObjectsChange && character) {
        const interactableManager = character.getInteractableObjectManager();
        const objects = interactableManager.getObjectsInRange(playerPosition, 5);
        onNearbyObjectsChange(objects);
      }
      
      // Find closest object
      if (onClosestObjectChange && character) {
        const interactableManager = character.getInteractableObjectManager();
        const objects = interactableManager.getObjectsInRange(playerPosition, 3);
        let closest = null;
        let closestDistance = Infinity;
        
        for (const object of objects) {
          const objectPos = new THREE.Vector3(
            object.position.x,
            object.position.y,
            object.position.z
          );
          const distance = playerPosition.distanceTo(objectPos);
          if (distance < closestDistance) {
            closestDistance = distance;
            closest = object;
          }
        }
        
        onClosestObjectChange(closest);
      }
    }, 200); // Update every 200ms for smooth interaction detection
    
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
    };
  }, [mapManager, playerPosition, character, onNearbyNPCsChange, onClosestNPCChange, onNearbyObjectsChange, onClosestObjectChange]);

  // Update tiles when player position changes
  useEffect(() => {
    if (!mapManager || !playerPosition) return;

    const currentTileX = Math.floor(playerPosition.x / tileSize);
    const currentTileZ = Math.floor(playerPosition.z / tileSize);
    
    // Only update if player has moved to a different tile to avoid too many updates
    if (currentTileX !== lastTileCoords.x || currentTileZ !== lastTileCoords.z) {
      // Update current player tile
      setLastTileCoords({ x: currentTileX, z: currentTileZ });
      
      // Get current tile's biome and notify if changed
      const currentTile = mapManager.getTileInfo(currentTileX, currentTileZ);
      if (currentTile) {
        // Check if biome has changed
        if (currentTile.biome !== currentBiome) {
          setCurrentBiome(currentTile.biome);
          if (onBiomeChange) {
            onBiomeChange(currentTile.biome);
          }
          
          console.log(`🏞️ Biome changed to: ${currentTile.biome}`);
        }
      }
      
      // Update loaded tiles around player
      mapManager.updateAroundPosition(playerPosition).catch(error => {
        console.error('❌ Error updating tiles around player:', error);
      });
    }
  }, [playerPosition, mapManager, lastTileCoords.x, lastTileCoords.z, onBiomeChange, currentBiome]);

  // Update if character changes
  useEffect(() => {
    if (mapManager && character) {
      mapManager.setCharacter(character);
    }
  }, [character, mapManager]);

  // This component doesn't render any visible UI
  return null;
};