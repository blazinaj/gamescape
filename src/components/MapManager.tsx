import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { MapManager as MapManagerService } from '../services/MapManager';
import { MapTile } from '../types/MapTypes';

interface MapManagerProps {
  scene: THREE.Scene;
  character: any;
  gameId?: string;
  playerPosition: THREE.Vector3;
  onTileGenerated?: (tile: MapTile, description: string) => void;
  onGenerationStart?: (x: number, z: number) => void;
  onBiomeChange?: (biome: string) => void;
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
  scenarioPrompt,
  scenarioTheme
}) => {
  const [mapManager, setMapManager] = useState<MapManagerService | null>(null);
  const [lastTileCoords, setLastTileCoords] = useState({ x: 0, z: 0 });
  const tileSize = 25; // This should match the tileSize in MapManager service

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
      onTileGenerated,
      onGenerationStart
    });
    
    // Set scenario if available
    if (scenarioPrompt && scenarioTheme) {
      manager.setScenario(scenarioPrompt, scenarioTheme);
    }
    
    setMapManager(manager);
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up MapManager component');
      manager.dispose();
    };
  }, [scene, character]);

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
      if (currentTile && onBiomeChange) {
        onBiomeChange(currentTile.biome);
      }
      
      // Update loaded tiles around player
      mapManager.updateAroundPosition(playerPosition).catch(error => {
        console.error('Error updating tiles around player:', error);
      });
    }
  }, [playerPosition, mapManager, lastTileCoords.x, lastTileCoords.z, onBiomeChange]);

  // This component doesn't render any visible UI
  return null;
};