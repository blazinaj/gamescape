import React, { useEffect, useRef, useState } from 'react';
import { ConversationUI } from './ConversationUI';
import { ObjectInteractionUI } from './ObjectInteractionUI';
import { SaveGameUI } from './SaveGameUI';
import { LogViewer } from './LogViewer';
import { EquipmentUI } from './EquipmentUI';
import { InventoryUI } from './InventoryUI';
import { CharacterCustomizer } from './CharacterCustomizer';
import { KeybindingsUI } from './KeybindingsUI';
import { ExperienceUI } from './ExperienceUI';
import { GameSettingsUI } from './GameSettingsUI';
import { NotificationDisplay } from './NotificationDisplay';
import { HealthUI } from './HealthUI';
import { RecentSkillProgress } from './RecentSkillProgress';
import { GameHUD } from './GameUI/GameHUD';
import { GameControls } from './GameUI/GameControls';
import { InteractionPrompt } from './GameUI/InteractionPrompt';
import { ObjectInteractionPrompt } from './GameUI/ObjectInteractionPrompt';
import { GameStatus } from './GameUI/GameStatus';
import { LoadingScreen } from './GameUI/LoadingScreen';
import { WorldGenerationLoading } from './GameUI/WorldGenerationLoading';
import { MapTile } from '../types/MapTypes';
import { CharacterCustomization } from '../types/CharacterTypes';
import { useGameState } from '../hooks/useGameState';
import { useUIState } from '../hooks/useUIState';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../hooks/useAutoSave';
import { GameInitializer } from '../services/GameInitializer';
import { GameLoader } from '../services/GameLoader';
import { Zap, Map as MapIcon, MessageCircle, Package, Skull, Scroll } from 'lucide-react';
import * as THREE from 'three';
import { CollisionSystem } from '../services/CollisionSystem';
import { GameScenario } from './ScenarioSelector';

interface Game3DProps {
  gameId?: string;
  scenario?: GameScenario;
  onReturnToMenu: () => void;
}

export const Game3D: React.FC<Game3DProps> = ({ gameId, scenario, onReturnToMenu }) => {
  console.log('🚀 Game3D Component Starting - gameId:', gameId, 'scenario:', scenario?.name);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const gameState = useGameState(gameId);
  const uiState = useUIState();
  const [generatedTiles, setGeneratedTiles] = useState<Array<{tile: MapTile, description: string}>>([]);
  const [scenarioInfo, setScenarioInfo] = useState<GameScenario | null>(scenario || null);
  const [initialGenerationComplete, setInitialGenerationComplete] = useState(false);
  const [forcedCompletion, setForcedCompletion] = useState(false);
  const [showLoadingLogs, setShowLoadingLogs] = useState(false);
  const [debugLoadingInfo, setDebugLoadingInfo] = useState<string[]>([]);
  const [loadingStartTime] = useState(Date.now());

  const {
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
  } = gameState;

  const { isUIActive } = uiState;

  // Auto-save functionality with improved settings
  const autoSaveState = useAutoSave({
    enabled: true,
    interval: 60000, // 60 seconds (increased to avoid too-frequent saves)
    onSave: handleSaveGame,
    gameLoaded: isLoaded && !isLoadingGame && initialGenerationComplete
  });

  // Update input manager about UI state
  useEffect(() => {
    if (gameRef.current.inputManager) {
      gameRef.current.inputManager.setUIActive(isUIActive);
    }
  }, [isUIActive]);

  // Monitor pointer lock state
  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === document.body;
      setIsPointerLocked(locked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, [setIsPointerLocked]);

  // Force complete loading after waiting too long
  const handleForceCompleteLoading = () => {
    console.log('🚨 Force completing world generation manually triggered');
    setForcedCompletion(true);
    setInitialGenerationComplete(true);
    setShowLoadingLogs(true); // Show logs when forcing completion to help debugging
    
    // Add debug info
    addDebugInfo('Force completion triggered manually');
  };

  // Add debug info for loading diagnostics
  const addDebugInfo = (message: string) => {
    const timestamp = Math.floor((Date.now() - loadingStartTime) / 1000);
    setDebugLoadingInfo(prev => [...prev, `[${timestamp}s] ${message}`]);
  };

  // Load game data first (if gameId provided)
  useEffect(() => {
    if (!gameId && !scenario) {
      console.log('🆕 No gameId or scenario provided, will start new game after component mounts');
      setIsLoadingGame(false);
      return;
    }

    if (gameId) {
      console.log('🔄 Loading game data for gameId:', gameId);
      loadGameData(gameId);
    } else if (scenario) {
      console.log('🆕 Starting new game with scenario:', scenario.name);
      setIsLoadingGame(false);
    }
  }, [gameId, scenario]);

  // Initialize game components after loading is complete and component is mounted
  useEffect(() => {
    if (isLoadingGame) {
      console.log('⏳ Still loading game data, skipping game initialization');
      addDebugInfo('Waiting for game data to load');
      return;
    }

    if (!mountRef.current) {
      console.log('⏳ mountRef not ready yet, waiting...');
      addDebugInfo('Waiting for mount reference to be ready');
      return;
    }

    console.log('🎮 Ready to initialize game components');
    addDebugInfo('Initializing game components');
    
    if (scenario && !gameData) {
      // Initialize with scenario
      addDebugInfo(`Initializing with scenario: ${scenario.name}`);
      initializeGameWithScenario();
    } else {
      // Initialize normally (with or without gameData)
      addDebugInfo('Initializing game normally');
      initializeGame();
    }

    return () => {
      console.log('🧹 Cleaning up game components...');
      GameInitializer.cleanup(gameRef.current);
    };
  }, [isLoadingGame, gameData, mountRef.current, scenario]);

  // Track initial world generation completion with better logging
  useEffect(() => {
    // Log state for debugging
    console.log(`🔍 Tracking generation - isLoaded: ${isLoaded}, isGenerating: ${isGenerating}, initialGenerationComplete: ${initialGenerationComplete}, forcedCompletion: ${forcedCompletion}, tiles: ${generatedTiles.length}`);
    addDebugInfo(`Status update - loaded: ${isLoaded}, generating: ${isGenerating}, tiles: ${generatedTiles.length}`);
    
    if (isLoaded && !initialGenerationComplete) {
      // Improved completion logic
      if (forcedCompletion) {
        // Force completion was triggered
        console.log('✅ Marking generation complete due to forced completion');
        addDebugInfo('Force completion triggered');
        setInitialGenerationComplete(true);
        return;
      }
      
      if (generatedTiles.length > 0) {
        // We have generated at least one tile
        console.log('✅ Marking generation complete - tiles generated:', generatedTiles.length);
        addDebugInfo(`Tiles generated: ${generatedTiles.length}`);
        setInitialGenerationComplete(true);
        return;
      }
      
      if (!isGenerating && isLoaded) {
        // If we're not generating and the game is loaded
        console.log('✅ Marking generation complete - not generating and game is loaded');
        addDebugInfo('Not generating and game is loaded');
        setInitialGenerationComplete(true);
        return;
      }
      
      // Check for timeout
      const timeElapsed = (Date.now() - loadingStartTime) / 1000;
      if (timeElapsed > 25) {
        // Force complete after 25 seconds as a safety measure
        console.log(`⏱️ Forcing completion after ${timeElapsed}s timeout`);
        addDebugInfo(`Timeout-based force completion after ${timeElapsed}s`);
        setInitialGenerationComplete(true);
        setForcedCompletion(true);
      }
    }
  }, [isLoaded, isGenerating, initialGenerationComplete, forcedCompletion, generatedTiles]);

  // Separate effect just for tile generation monitoring
  useEffect(() => {
    if (isLoaded && generatedTiles.length > 0 && !initialGenerationComplete) {
      // After we've generated at least one tile, we can consider it ready
      console.log(`✅ ${generatedTiles.length} tiles generated, marking initial generation as complete`);
      addDebugInfo(`${generatedTiles.length} tiles generated`);
      setInitialGenerationComplete(true);
    }
  }, [generatedTiles, isLoaded, initialGenerationComplete]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    uiState,
    onSave: () => uiState.setShowSaveUI(true),
  });

  const loadGameData = async (gameId: string) => {
    console.log('🔄 === STARTING LOAD PROCESS ===');
    setIsLoadingGame(true);
    setLoadingError(null);
    setLoadingStep('Connecting to save system...');
    addDebugInfo('Starting game data load');
    
    const loadingTimeout = setTimeout(() => {
      console.error('⏰ Loading timed out after 15 seconds');
      setLoadingError('Loading timed out. The save system may be unavailable.');
      setIsLoadingGame(false);
      addDebugInfo('Loading timed out');
    }, 15000);

    try {
      setLoadingStep('Loading complete game data...');
      addDebugInfo('Loading game data from server');
      const saveData = await GameLoader.loadGameData(gameId);
      
      setLoadingStep('Processing game data...');
      setGameData(saveData);
      setCurrentBiome(saveData.game.current_biome);
      addDebugInfo('Game data loaded successfully');

      // Restore character customization
      if (saveData.game.character_customization) {
        setCharacterCustomization(saveData.game.character_customization);
        addDebugInfo('Character customization restored');
      }

      // Restore NPC states
      const npcStateMap = new Map();
      saveData.npcStates.forEach(state => {
        npcStateMap.set(state.npc_id, state);
      });
      setNpcStates(npcStateMap);
      console.log('✅ NPC states restored:', npcStateMap.size, 'NPCs');
      addDebugInfo(`${npcStateMap.size} NPC states restored`);

      // Load scenario data if available
      if (saveData.game.scenario_data) {
        console.log('🌍 Scenario data found:', saveData.game.scenario_data);
        setScenarioInfo({
          id: saveData.game.scenario_data.id || 'custom',
          name: saveData.game.scenario_data.name || 'Custom Scenario',
          description: 'Loaded from save',
          icon: Scroll,
          prompt: saveData.game.scenario_data.prompt || '',
          theme: saveData.game.scenario_data.theme || 'default',
          difficulty: 'Medium',
          features: ['Saved world', 'Custom adventure']
        });
        addDebugInfo('Scenario data loaded from save');
      }

      setLoadingStep('Almost ready...');
      
      console.log('✅ === LOAD PROCESS COMPLETE ===');
      clearTimeout(loadingTimeout);
      setIsLoadingGame(false);
      setLoadingStep('Complete!');
      addDebugInfo('Load process complete');
      
    } catch (error) {
      console.error('❌ Failed to load game:', error);
      clearTimeout(loadingTimeout);
      setLoadingError(`Failed to load game: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoadingGame(false);
      addDebugInfo('Game load failed with error');
    }
  };

  const initializeGame = () => {
    if (!mountRef.current) {
      console.error('❌ mountRef.current is still null during initialization!');
      addDebugInfo('Mount reference is null during initialization');
      return;
    }

    addDebugInfo('Starting normal game initialization');
    GameInitializer.initializeGame(
      gameRef.current,
      mountRef.current,
      characterCustomization,
      gameData,
      isUIActive,
      {
        onTileGenerated: (tile, description) => {
          console.log('🎯 Tile generated:', tile.id);
          setGeneratedTiles(prev => [...prev, { tile, description }]);
          setIsGenerating(false);
          addDebugInfo(`Tile generated: ${tile.id}`);
        },
        onGenerationStart: (x, z) => {
          console.log('🔄 Starting tile generation at:', x, z);
          setIsGenerating(true);
          addDebugInfo(`Starting tile generation at: (${x}, ${z})`);
        },
        setCurrentBiome,
        setNearbyNPCs,
        setClosestNPC,
        setNearbyObjects,
        setClosestObject,
        setIsLoaded,
        setLoadingError,
      }
    );

    // Register a flat ground collision object
    CollisionSystem.getInstance().registerObject({
      id: 'ground',
      type: 'static',
      bounds: {
        type: 'box',
        // Center is 0.5 units below ground level, so top surface is at exactly y=0
        center: { x: 0, y: -0.5, z: 0 },
        // Large enough to cover the entire playable area
        size: { x: 2000, y: 1, z: 2000 }
      },
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      mass: 0, // Static object
      canCollideWith: ['character', 'enemy', 'npc', 'dynamic'],
      userData: { type: 'ground' } // Important for ground detection
    });

    console.log("Ground plane registered with top surface at y=0");
    addDebugInfo('Ground collision plane registered');
  };

  const initializeGameWithScenario = () => {
    if (!mountRef.current || !scenario) {
      console.error('❌ mountRef.current is null or scenario is missing during initialization!');
      addDebugInfo('Mount reference or scenario missing during initialization');
      return;
    }

    console.log('🌍 Initializing game with scenario:', scenario.name);
    addDebugInfo(`Initializing with scenario: ${scenario.name}`);

    GameInitializer.initializeGameWithScenario(
      gameRef.current,
      mountRef.current,
      characterCustomization,
      null, // No game data for new game
      scenario,
      isUIActive,
      {
        onTileGenerated: (tile, description) => {
          console.log('🎯 Tile generated:', tile.id);
          setGeneratedTiles(prev => [...prev, { tile, description }]);
          setIsGenerating(false);
          addDebugInfo(`Tile generated: ${tile.id}`);
        },
        onGenerationStart: (x, z) => {
          console.log('🔄 Starting tile generation at:', x, z);
          setIsGenerating(true);
          addDebugInfo(`Starting tile generation at: (${x}, ${z})`);
        },
        setCurrentBiome,
        setNearbyNPCs,
        setClosestNPC,
        setNearbyObjects,
        setClosestObject,
        setIsLoaded,
        setLoadingError,
      }
    );

    // Register a flat ground collision object
    CollisionSystem.getInstance().registerObject({
      id: 'ground',
      type: 'static',
      bounds: {
        type: 'box',
        center: { x: 0, y: -0.5, z: 0 },
        size: { x: 2000, y: 1, z: 2000 }
      },
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      mass: 0,
      canCollideWith: ['character', 'enemy', 'npc', 'dynamic'],
      userData: { type: 'ground' }
    });

    console.log("Ground plane registered with top surface at y=0");
    addDebugInfo('Ground collision plane registered');
  };

  const handleCharacterCustomization = (customization: CharacterCustomization) => {
    setCharacterCustomization(customization);
    
    // Update the character in the game if it exists
    if (gameRef.current.character) {
      gameRef.current.character.updateCustomization(customization);
    }
  };

  async function handleSaveGame(): Promise<boolean> {
    console.log('💾 Starting game save process...');
    
    const game = gameRef.current;
    if (!game.character || !game.mapManager || !game.saveSystem) {
      console.error('❌ Cannot save game - required game components are missing');
      return false;
    }

    try {
      const playerPosition = game.character.getPosition();
      const playerRotation = game.character.getRotation();
      
      // Get ALL map tiles, including those in the AIMapGenerator cache
      const mapTiles = game.mapManager.getAllTiles();
      console.log(`🗺️ Saving ${mapTiles.size} map tiles to database`);
      
      const healthState = game.character.getHealthSystem().getHealth();
      const experienceSystem = game.character.getExperienceSystem();
      const inventorySystem = game.character.getInventorySystem();
      const equipmentManager = game.character.getEquipmentManager();

      // Get skills data
      const skillsMap = new Map();
      experienceSystem.getAllSkills().forEach(skill => {
        skillsMap.set(skill.id, skill);
      });

      // Get inventory data
      const inventory = inventorySystem.getInventory();

      // Get equipment data
      const equippedTool = equipmentManager.getEquippedTool();
      const equippedWeapon = equipmentManager.getEquippedWeapon();
      const availableTools = equipmentManager.getAvailableTools();
      const availableWeapons = equipmentManager.getAvailableWeapons();

      // Include scenario data in save if available
      let scenarioData = null;
      if (scenarioInfo) {
        scenarioData = {
          id: scenarioInfo.id,
          name: scenarioInfo.name,
          prompt: scenarioInfo.prompt,
          theme: scenarioInfo.theme
        };
      }

      const success = await game.saveSystem.saveGame(
        playerPosition,
        playerRotation,
        currentBiome,
        mapTiles,
        npcStates,
        characterCustomization,
        healthState,
        skillsMap,
        inventory,
        equippedTool,
        equippedWeapon,
        availableTools,
        availableWeapons,
        scenarioData
      );

      console.log('💾 Save operation completed with result:', success);
      return success;
    } catch (error) {
      console.error('❌ Error during save operation:', error);
      return false;
    }
  }

  const handleRetryLoad = () => {
    console.log('🔄 Retrying load...');
    if (gameId) {
      setLoadingError(null);
      setLoadingStep('Retrying...');
      loadGameData(gameId);
    }
  };

  const handleStartFresh = () => {
    console.log('🆕 Starting fresh game...');
    setLoadingError(null);
    setIsLoadingGame(false);
    setIsLoaded(true);
    setGameData(null);
  };

  const handleObjectInteraction = (actionId: string) => {
    console.log(`📦 Object interaction completed: ${actionId}`);
  };

  // Get nearby enemies for display
  const nearbyEnemies = gameRef.current.enemyManager ? 
    gameRef.current.enemyManager.getEnemiesInRange(
      gameRef.current.character?.getPosition() || new THREE.Vector3(0, 0, 0), 
      10
    ) : [];

  console.log('🎭 Rendering Game3D component. State:', {
    isLoadingGame,
    isLoaded,
    hasGameId: !!gameId,
    hasScenario: !!scenario,
    loadingError: !!loadingError,
    loadingStep,
    isUIActive,
    isPointerLocked,
    initialGenerationComplete,
    forcedCompletion,
    generatedTilesCount: generatedTiles.length
  });

  if (isLoadingGame) {
    return (
      <LoadingScreen
        loadingError={loadingError}
        loadingStep={loadingStep}
        onRetryLoad={handleRetryLoad}
        onStartFresh={handleStartFresh}
        onReturnToMenu={onReturnToMenu}
      />
    );
  }

  // Show world generation loading screen during initial setup
  if (isLoaded === false || (isLoaded === true && !initialGenerationComplete)) {
    return (
      <WorldGenerationLoading 
        scenario={scenarioInfo} 
        onForceComplete={handleForceCompleteLoading}
      />
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-sky-200 to-sky-400">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Notification Display */}
      <NotificationDisplay />
      
      {/* Health UI with Levels */}
      {gameRef.current.character && (
        <HealthUI 
          healthSystem={gameRef.current.character.getHealthSystem()}
          experienceSystem={gameRef.current.character.getExperienceSystem()}
        />
      )}

      {/* Recent Skill Progress */}
      {gameRef.current.character && (
        <RecentSkillProgress 
          experienceSystem={gameRef.current.character.getExperienceSystem()}
          isUIActive={isUIActive}
        />
      )}

      {/* Main UI Overlay */}
      <GameHUD
        currentBiome={currentBiome}
        isLoaded={isLoaded}
        isPointerLocked={isPointerLocked}
        scenarioName={scenarioInfo?.name}
      />

      {/* Game Controls with Auto-Save Status */}
      <GameControls
        onShowCharacterCustomizer={() => uiState.setShowCharacterCustomizer(true)}
        onShowInventory={() => uiState.setShowInventory(true)}
        onShowKeybindings={() => uiState.setShowKeybindings(true)}
        onShowExperience={() => uiState.setShowExperience(true)}
        onShowLogViewer={() => uiState.setShowLogViewer(true)}
        onShowSaveUI={() => uiState.setShowSaveUI(true)}
        onShowSettings={() => uiState.setShowSettings(true)}
        onReturnToMenu={onReturnToMenu}
        autoSaveState={autoSaveState}
      />

      {/* Game Status */}
      <GameStatus
        isGenerating={isGenerating}
        isUIActive={isUIActive}
        isPointerLocked={isPointerLocked}
      />

      {/* Equipment UI */}
      {gameRef.current.character && (
        <EquipmentUI equipmentManager={gameRef.current.character.getEquipmentManager()} />
      )}

      {/* NPC Interact Button */}
      {closestNPC && !uiState.activeConversation && !isUIActive && (
        <InteractionPrompt
          npc={closestNPC}
          onInteract={() => uiState.setActiveConversation(closestNPC)}
        />
      )}

      {/* Object Interact Button */}
      {closestObject && !closestNPC && !uiState.activeObjectInteraction && !isUIActive && (
        <ObjectInteractionPrompt
          object={closestObject}
          onInteract={() => uiState.setActiveObjectInteraction(closestObject)}
        />
      )}

      {/* Nearby NPCs List */}
      {nearbyNPCs.length > 0 && !isUIActive && (
        <div className="absolute top-36 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg backdrop-blur-sm">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            Nearby People
          </h3>
          <div className="space-y-2">
            {nearbyNPCs.map((npc) => (
              <button
                key={npc.data.id}
                onClick={() => uiState.setActiveConversation(npc)}
                className={`w-full text-left p-2 rounded text-xs transition-all ${
                  npc === closestNPC 
                    ? 'bg-yellow-600 bg-opacity-80 border border-yellow-400' 
                    : 'bg-blue-600 bg-opacity-60 hover:bg-opacity-80'
                }`}
              >
                <div className="font-medium">{npc.data.name}</div>
                <div className="text-blue-200">{npc.data.occupation}</div>
                {npc === closestNPC && (
                  <div className="text-yellow-200 text-xs mt-1">Press E to interact</div>
                )}
                {npcStates.get(npc.data.id)?.has_talked && (
                  <div className="text-green-200 text-xs mt-1">Previously talked</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Objects List */}
      {nearbyObjects.length > 0 && !isUIActive && (
        <div className="absolute top-36 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg backdrop-blur-sm max-w-xs">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-1">
            <Package className="w-4 h-4" />
            Nearby Objects
          </h3>
          <div className="space-y-2">
            {nearbyObjects.slice(0, 5).map((object) => (
              <button
                key={object.id}
                onClick={() => uiState.setActiveObjectInteraction(object)}
                className={`w-full text-left p-2 rounded text-xs transition-all ${
                  object === closestObject 
                    ? 'bg-green-600 bg-opacity-80 border border-green-400' 
                    : 'bg-gray-600 bg-opacity-60 hover:bg-opacity-80'
                }`}
              >
                <div className="font-medium">{object.name}</div>
                <div className="text-gray-200 capitalize">{object.type.replace('_', ' ')}</div>
                {object === closestObject && (
                  <div className="text-green-200 text-xs mt-1">Press E to interact</div>
                )}
              </button>
            ))}
            {nearbyObjects.length > 5 && (
              <div className="text-xs text-gray-400 text-center">
                +{nearbyObjects.length - 5} more objects nearby
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nearby Enemies List */}
      {nearbyEnemies.length > 0 && !isUIActive && (
        <div className="absolute top-36 right-80 bg-black bg-opacity-50 text-white p-3 rounded-lg backdrop-blur-sm max-w-xs border border-red-400">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-1 text-red-300">
            <Skull className="w-4 h-4" />
            Nearby Enemies
          </h3>
          <div className="space-y-2">
            {nearbyEnemies.slice(0, 5).map((enemy) => {
              const distance = enemy.distanceTo(gameRef.current.character?.getPosition() || new THREE.Vector3(0, 0, 0));
              const healthPercent = (enemy.health.current / enemy.health.maximum) * 100;
              
              return (
                <div
                  key={enemy.data.id}
                  className="p-2 rounded text-xs bg-red-900 bg-opacity-60 border border-red-500"
                >
                  <div className="font-medium text-red-200">{enemy.data.name}</div>
                  <div className="text-gray-300 capitalize">{enemy.data.type}</div>
                  <div className="text-xs text-gray-400">
                    Distance: {distance.toFixed(1)}m
                  </div>
                  
                  {/* Enemy Health Bar */}
                  <div className="mt-1">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all ${
                          healthPercent > 60 ? 'bg-green-500' : 
                          healthPercent > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${healthPercent}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      HP: {Math.floor(enemy.health.current)}/{enemy.health.maximum}
                    </div>
                  </div>
                </div>
              );
            })}
            {nearbyEnemies.length > 5 && (
              <div className="text-xs text-gray-400 text-center">
                +{nearbyEnemies.length - 5} more enemies nearby
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Tiles Log */}
      {generatedTiles.length > 0 && !isUIActive && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg backdrop-blur-sm max-w-sm max-h-40 overflow-y-auto">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-1">
            <MapIcon className="w-4 h-4" />
            Recent Generations
          </h3>
          <div className="space-y-1 text-xs">
            {generatedTiles.slice(-3).map((item, index) => (
              <div key={index} className="border-l-2 border-blue-400 pl-2">
                <div className="font-medium capitalize">{item.tile.biome} Tile</div>
                <div className="text-gray-300 truncate">{item.description}</div>
                <div className="text-gray-400">
                  ({item.tile.x}, {item.tile.z}) • {item.tile.objects.length} objects
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenario Info */}
      {scenarioInfo && !isUIActive && (
        <div className="absolute bottom-4 left-4 bg-blue-900 bg-opacity-50 text-blue-100 p-3 rounded-lg backdrop-blur-sm max-w-md">
          <div className="flex items-start gap-2">
            <Scroll className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-medium mb-1">Scenario: {scenarioInfo.name}</div>
              <div className="text-blue-200">{scenarioInfo.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Notice */}
      {!import.meta.env.VITE_OPENAI_API_KEY && !isUIActive && (
        <div className="absolute bottom-20 left-4 bg-yellow-900 bg-opacity-90 text-yellow-100 p-3 rounded-lg backdrop-blur-sm max-w-md">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-medium mb-1">AI Features Disabled</div>
              <div>Add your OpenAI API key to <code>.env</code> file as <code>VITE_OPENAI_API_KEY</code> to enable AI-powered map generation and NPC conversations. Currently using fallback systems.</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Debug Info */}
      {(showLoadingLogs || forcedCompletion) && (
        <div className="absolute bottom-40 left-4 bg-gray-900 bg-opacity-90 text-gray-100 p-3 rounded-lg backdrop-blur-sm max-w-md">
          <div className="flex items-start gap-2">
            <div className="text-xs">
              <div className="font-medium mb-1">Loading Debug Info:</div>
              <div>Loaded: {isLoaded ? 'Yes' : 'No'}</div>
              <div>Initial Generation: {initialGenerationComplete ? 'Complete' : 'In Progress'}</div>
              <div>Force Completed: {forcedCompletion ? 'Yes' : 'No'}</div>
              <div>Generating: {isGenerating ? 'Yes' : 'No'}</div>
              <div>Generated Tiles: {generatedTiles.length}</div>
              <div>Loading Game: {isLoadingGame ? 'Yes' : 'No'}</div>
              
              {debugLoadingInfo.length > 0 && (
                <>
                  <div className="mt-2 mb-1 font-medium border-t border-gray-700 pt-2">Event Log:</div>
                  {debugLoadingInfo.slice(-10).map((log, index) => (
                    <div key={index} className="text-xs text-gray-300">{log}</div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UI Components */}
      {uiState.activeConversation && gameRef.current.conversationSystem && (
        <ConversationUI
          npc={uiState.activeConversation.data}
          onClose={() => uiState.setActiveConversation(null)}
          conversationSystem={gameRef.current.conversationSystem}
        />
      )}

      {uiState.activeObjectInteraction && gameRef.current.character && (
        <ObjectInteractionUI
          object={uiState.activeObjectInteraction}
          options={gameRef.current.character.getInteractableObjectManager().getInteractionOptions(uiState.activeObjectInteraction.id)}
          onClose={() => uiState.setActiveObjectInteraction(null)}
          onAction={handleObjectInteraction}
        />
      )}

      <SaveGameUI
        onSave={handleSaveGame}
        isVisible={uiState.showSaveUI}
        onClose={() => uiState.setShowSaveUI(false)}
      />

      <LogViewer
        isVisible={uiState.showLogViewer}
        onClose={() => uiState.setShowLogViewer(false)}
      />

      {gameRef.current.character && (
        <InventoryUI
          inventorySystem={gameRef.current.character.getInventorySystem()}
          isVisible={uiState.showInventory}
          onClose={() => uiState.setShowInventory(false)}
        />
      )}

      <CharacterCustomizer
        isVisible={uiState.showCharacterCustomizer}
        onClose={() => uiState.setShowCharacterCustomizer(false)}
        onCustomizationChange={handleCharacterCustomization}
        currentCustomization={characterCustomization}
      />

      <KeybindingsUI
        isVisible={uiState.showKeybindings}
        onClose={() => uiState.setShowKeybindings(false)}
      />

      {gameRef.current.character && (
        <ExperienceUI
          experienceSystem={gameRef.current.character.getExperienceSystem()}
          isVisible={uiState.showExperience}
          onClose={() => uiState.setShowExperience(false)}
        />
      )}

      <GameSettingsUI
        isVisible={uiState.showSettings}
        onClose={() => uiState.setShowSettings(false)}
      />
    </div>
  );
};