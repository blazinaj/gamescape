import React, { useEffect, useRef } from 'react';
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
import { MapTile } from '../types/MapTypes';
import { CharacterCustomization } from '../types/CharacterTypes';
import { useGameState } from '../hooks/useGameState';
import { useUIState } from '../hooks/useUIState';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../hooks/useAutoSave';
import { GameInitializer } from '../services/GameInitializer';
import { GameLoader } from '../services/GameLoader';
import { Zap, Map as MapIcon, MessageCircle, Package, Skull } from 'lucide-react';
import * as THREE from 'three';
import { CollisionSystem } from '../services/CollisionSystem';

interface Game3DProps {
  gameId?: string;
  onReturnToMenu: () => void;
}

export const Game3D: React.FC<Game3DProps> = ({ gameId, onReturnToMenu }) => {
  console.log('🚀 Game3D Component Starting - gameId:', gameId);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const gameState = useGameState(gameId);
  const uiState = useUIState();
  const [generatedTiles, setGeneratedTiles] = React.useState<Array<{tile: MapTile, description: string}>>([]);

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

  // Auto-save functionality
  const autoSaveState = useAutoSave({
    enabled: true,
    interval: 30000, // 30 seconds
    onSave: handleSaveGame,
    gameLoaded: isLoaded && !isLoadingGame
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

  // Load game data first (if gameId provided)
  useEffect(() => {
    if (!gameId) {
      console.log('🆕 No gameId provided, will start new game after component mounts');
      setIsLoadingGame(false);
      return;
    }

    console.log('🔄 Loading game data for gameId:', gameId);
    loadGameData(gameId);
  }, [gameId]);

  // Initialize game components after loading is complete and component is mounted
  useEffect(() => {
    if (isLoadingGame) {
      console.log('⏳ Still loading game data, skipping game initialization');
      return;
    }

    if (!mountRef.current) {
      console.log('⏳ mountRef not ready yet, waiting...');
      return;
    }

    console.log('🎮 Ready to initialize game components');
    initializeGame();

    return () => {
      console.log('🧹 Cleaning up game components...');
      GameInitializer.cleanup(gameRef.current);
    };
  }, [isLoadingGame, gameData]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    uiState,
    onSave: () => uiState.setShowSaveUI(true),
  });

  // Handle interactions
  useEffect(() => {
    const handleInteraction = (event: KeyboardEvent) => {
      if (event.code.toLowerCase() === 'keye' && !isUIActive) {
        // Prioritize NPC interactions over object interactions
        if (closestNPC && !uiState.activeConversation) {
          console.log('🗣️ Starting conversation with NPC:', closestNPC.data.name);
          uiState.setActiveConversation(closestNPC);
          // Update NPC state
          setNpcStates(prev => {
            const newStates = new Map(prev);
            const currentState = newStates.get(closestNPC.data.id) || {
              npc_id: closestNPC.data.id,
              has_talked: false,
              conversation_count: 0
            };
            newStates.set(closestNPC.data.id, {
              ...currentState,
              has_talked: true,
              conversation_count: currentState.conversation_count + 1,
              last_interaction: new Date().toISOString()
            });
            return newStates;
          });
        } else if (closestObject && !uiState.activeObjectInteraction) {
          console.log('📦 Interacting with object:', closestObject.name);
          uiState.setActiveObjectInteraction(closestObject);
        }
      }
    };

    document.addEventListener('keydown', handleInteraction);
    return () => document.removeEventListener('keydown', handleInteraction);
  }, [closestNPC, closestObject, uiState.activeConversation, uiState.activeObjectInteraction, isUIActive, uiState, setNpcStates]);

  const loadGameData = async (gameId: string) => {
    console.log('🔄 === STARTING LOAD PROCESS ===');
    setIsLoadingGame(true);
    setLoadingError(null);
    setLoadingStep('Connecting to save system...');
    
    const loadingTimeout = setTimeout(() => {
      console.error('⏰ Loading timed out after 15 seconds');
      setLoadingError('Loading timed out. The save system may be unavailable.');
      setIsLoadingGame(false);
    }, 15000);

    try {
      setLoadingStep('Loading complete game data...');
      const saveData = await GameLoader.loadGameData(gameId);
      
      setLoadingStep('Processing game data...');
      setGameData(saveData);
      setCurrentBiome(saveData.game.current_biome);

      // Restore character customization
      if (saveData.game.character_customization) {
        setCharacterCustomization(saveData.game.character_customization);
      }

      // Restore NPC states
      const npcStateMap = new Map();
      saveData.npcStates.forEach(state => {
        npcStateMap.set(state.npc_id, state);
      });
      setNpcStates(npcStateMap);
      console.log('✅ NPC states restored:', npcStateMap.size, 'NPCs');

      setLoadingStep('Almost ready...');
      
      console.log('✅ === LOAD PROCESS COMPLETE ===');
      clearTimeout(loadingTimeout);
      setIsLoadingGame(false);
      setLoadingStep('Complete!');
      
    } catch (error) {
      console.error('❌ Failed to load game:', error);
      clearTimeout(loadingTimeout);
      setLoadingError(`Failed to load game: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoadingGame(false);
    }
  };

  const initializeGame = () => {
    if (!mountRef.current) {
      console.error('❌ mountRef.current is still null during initialization!');
      return;
    }

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
        },
        onGenerationStart: (x, z) => {
          console.log('🔄 Starting tile generation at:', x, z);
          setIsGenerating(true);
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

    // Add a visible ground plane for debugging, but only if scene exists
    if (gameRef.current && gameRef.current.scene) {
      const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshBasicMaterial({
          color: 0x444444,
          wireframe: true,
          opacity: 0.5,
          transparent: true
        })
      );
      groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      groundMesh.position.y = 0.01; // Slightly above ground level
      gameRef.current.scene.add(groundMesh);

      console.log("Debug ground mesh added at y=0.01");
    } else {
      console.log("Scene not available yet, skipping debug ground mesh");
    }
  };

  const handleCharacterCustomization = (customization: CharacterCustomization) => {
    setCharacterCustomization(customization);
    
    // Update the character in the game if it exists
    if (gameRef.current.character) {
      gameRef.current.character.updateCustomization(customization);
    }
  };

  async function handleSaveGame(): Promise<boolean> {
    const game = gameRef.current;
    if (!game.character || !game.mapManager || !game.saveSystem) return false;

    const playerPosition = game.character.getPosition();
    const playerRotation = game.character.getRotation();
    const mapTiles = game.mapManager.getLoadedTiles();
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

    return await game.saveSystem.saveGame(
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
      availableWeapons
    );
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
    loadingError: !!loadingError,
    loadingStep,
    isUIActive,
    isPointerLocked
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

      {/* API Key Notice */}
      {!import.meta.env.VITE_OPENAI_API_KEY && !isUIActive && (
        <div className="absolute bottom-4 left-4 bg-yellow-900 bg-opacity-90 text-yellow-100 p-3 rounded-lg backdrop-blur-sm max-w-md">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-medium mb-1">AI Features Disabled</div>
              <div>Add your OpenAI API key to <code>.env</code> file as <code>VITE_OPENAI_API_KEY</code> to enable AI-powered map generation and NPC conversations. Currently using fallback systems.</div>
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