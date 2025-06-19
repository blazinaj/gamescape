import { useState, useRef } from 'react';
import * as THREE from 'three';
import { GameRenderer } from '../components/GameRenderer';
import { Character } from '../components/Character';
import { InputManager } from '../components/InputManager';
import { CameraController } from '../components/CameraController';
import { MapManager } from '../components/MapManager';
import { ConversationSystem } from '../services/ConversationSystem';
import { SaveSystem, NPCState } from '../services/SaveSystem';
import { EnemyManager } from '../services/EnemyManager';
import { NPC } from '../components/NPC';
import { CharacterCustomization, DEFAULT_CUSTOMIZATION } from '../types/CharacterTypes';
import { InteractableObject } from '../services/InteractableObjectManager';

export interface GameRef {
  renderer: GameRenderer | null;
  character: Character | null;
  inputManager: InputManager | null;
  cameraController: CameraController | null;
  mapManager: MapManager | null;
  conversationSystem: ConversationSystem | null;
  saveSystem: SaveSystem | null;
  enemyManager: EnemyManager | null;
  animationId: number | null;
  loadingStartTime: number;
}

export const useGameState = (gameId?: string) => {
  const gameRef = useRef<GameRef>({
    renderer: null,
    character: null,
    inputManager: null,
    cameraController: null,
    mapManager: null,
    conversationSystem: null,
    saveSystem: null,
    enemyManager: null,
    animationId: null,
    loadingStartTime: Date.now()
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentBiome, setCurrentBiome] = useState<string>('grassland');
  const [nearbyNPCs, setNearbyNPCs] = useState<NPC[]>([]);
  const [closestNPC, setClosestNPC] = useState<NPC | null>(null);
  const [nearbyObjects, setNearbyObjects] = useState<InteractableObject[]>([]);
  const [closestObject, setClosestObject] = useState<InteractableObject | null>(null);
  const [npcStates, setNpcStates] = useState<Map<string, NPCState>>(new Map());
  const [isLoadingGame, setIsLoadingGame] = useState(!!gameId);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing...');
  const [gameData, setGameData] = useState<any>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [characterCustomization, setCharacterCustomization] = useState<CharacterCustomization>(DEFAULT_CUSTOMIZATION);
  const [loadingProgress, setLoadingProgress] = useState(0);

  return {
    gameRef,
    isLoaded,
    setIsLoaded,
    isGenerating,
    setIsGenerating,
    currentBiome,
    setCurrentBiome,
    nearbyNPCs,
    setNearbyNPCs,
    closestNPC,
    setClosestNPC,
    nearbyObjects,
    setNearbyObjects,
    closestObject,
    setClosestObject,
    npcStates,
    setNpcStates,
    isLoadingGame,
    setIsLoadingGame,
    loadingError,
    setLoadingError,
    loadingStep,
    setLoadingStep,
    gameData,
    setGameData,
    isPointerLocked,
    setIsPointerLocked,
    characterCustomization,
    setCharacterCustomization,
    loadingProgress,
    setLoadingProgress,
  };
};