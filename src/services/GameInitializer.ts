import * as THREE from 'three';
import { GameRenderer } from '../components/GameRenderer';
import { Character } from '../components/Character';
import { InputManager } from '../components/InputManager';
import { CameraController } from '../components/CameraController';
import { MapManager } from '../services/MapManager';
import { ConversationSystem } from '../services/ConversationSystem';
import { SaveSystem, NPCState } from '../services/SaveSystem';
import { EnemyManager } from '../services/EnemyManager';
import { NPC } from '../components/NPC';
import { CharacterCustomization } from '../types/CharacterTypes';
import { GameRef } from '../hooks/useGameState';
import { InteractableObject } from '../services/InteractableObjectManager';
import { DamageInfo } from '../types/HealthTypes';
import { collisionSystem } from '../services/CollisionSystem';
import { GameScenario } from '../components/ScenarioSelector';
import { CustomObjectGenerator } from './CustomObjectGenerator';
import { ObjectDefinitionSystem } from './ObjectDefinitionSystem';

export class GameInitializer {
  private static customObjectGenerator = new CustomObjectGenerator();
  private static objectDefinitionSystem = new ObjectDefinitionSystem();

  static async initializeGame(
    gameRef: GameRef,
    mountElement: HTMLElement,
    characterCustomization: CharacterCustomization,
    gameData: any,
    isUIActive: boolean,
    callbacks: {
      onTileGenerated: (tile: any, description: string) => void;
      onGenerationStart: (x: number, z: number) => void;
      setCurrentBiome: (biome: string) => void;
      setNearbyNPCs: (npcs: any[]) => void;
      setClosestNPC: (npc: any) => void;
      setNearbyObjects: (objects: InteractableObject[]) => void;
      setClosestObject: (object: InteractableObject | null) => void;
      setIsLoaded: (loaded: boolean) => void;
      setLoadingError: (error: string) => void;
    }
  ): Promise<void> {
    console.log('🎮 Initializing game components...');
    
    try {
      // Initialize game components
      console.log('🔧 Creating GameRenderer...');
      gameRef.renderer = new GameRenderer();
      if (!gameRef.renderer) {
        throw new Error('Failed to create GameRenderer - constructor returned null');
      }
      gameRef.scene = gameRef.renderer.scene;
      
      console.log('🔧 Creating Character...');
      gameRef.character = new Character(characterCustomization);
      if (!gameRef.character) {
        throw new Error('Failed to create Character - constructor returned null');
      }
      
      console.log('🔧 Creating InputManager...');
      gameRef.inputManager = new InputManager();
      if (!gameRef.inputManager) {
        throw new Error('Failed to create InputManager - constructor returned null');
      }
      
      console.log('🔧 Creating CameraController...');
      gameRef.cameraController = new CameraController(gameRef.renderer.camera);
      if (!gameRef.cameraController) {
        throw new Error('Failed to create CameraController - constructor returned null');
      }
      
      console.log('🔧 Creating MapManager...');
      gameRef.mapManager = new MapManager(gameRef.renderer.scene);
      if (!gameRef.mapManager) {
        throw new Error('Failed to create MapManager - constructor returned null');
      }
      
      console.log('🔧 Creating ConversationSystem...');
      gameRef.conversationSystem = new ConversationSystem();
      if (!gameRef.conversationSystem) {
        throw new Error('Failed to create ConversationSystem - constructor returned null');
      }
      
      console.log('🔧 Creating SaveSystem...');
      gameRef.saveSystem = new SaveSystem();
      if (!gameRef.saveSystem) {
        throw new Error('Failed to create SaveSystem - constructor returned null');
      }

      console.log('🔧 Creating EnemyManager...');
      gameRef.enemyManager = new EnemyManager(gameRef.renderer.scene, gameRef.character.getInventorySystem());
      if (!gameRef.enemyManager) {
        throw new Error('Failed to create EnemyManager - constructor returned null');
      }

      // Store the object systems in the game ref for UI access
      gameRef.customObjectGenerator = this.customObjectGenerator;
      gameRef.objectDefinitionSystem = this.objectDefinitionSystem;

      console.log('✅ All game components created successfully');

      // Initialize collision system with scene reference for debug visualization
      console.log('🔧 Initializing collision system...');
      collisionSystem.setScene(gameRef.renderer.scene);
      
      // Enable debug mode in development (can be toggled by user later)
      if (import.meta.env.DEV) {
        // collisionSystem.setDebugMode(true); // Uncomment for visual debugging
      }

      // Setup the scene
      console.log('🎨 Setting up scene...');
      gameRef.renderer.setupScene();
      gameRef.character.addToScene(gameRef.renderer.scene);

      // Mount the renderer
      console.log('🖥️ Mounting renderer...');
      mountElement.appendChild(gameRef.renderer.domElement);

      // Set up camera to follow character
      console.log('📷 Setting up camera...');
      gameRef.cameraController.setTarget(gameRef.character.mesh);

      // Link character to map manager for object registration
      console.log('🔗 Linking character to map manager...');
      gameRef.mapManager.setCharacter(gameRef.character);

      // Set up map manager callbacks
      console.log('🗺️ Setting up map callbacks...');
      gameRef.mapManager.setCallbacks({
        onTileGenerated: callbacks.onTileGenerated,
        onGenerationStart: callbacks.onGenerationStart
      });

      // Set initial UI state for input manager and provide game container reference
      gameRef.inputManager.setUIActive(isUIActive);
      gameRef.inputManager.setGameContainer(mountElement);

      // Apply loaded game data if available
      if (gameData) {
        console.log('🔄 Applying loaded game data...');
        
        // Load scenario data if available
        if (gameData.game.scenario_data) {
          console.log('🌍 Loading scenario data:', gameData.game.scenario_data.name);
          
          // Set scenario context for AI systems
          gameRef.mapManager.setScenario(
            gameData.game.scenario_data.prompt,
            gameData.game.scenario_data.theme
          );
          
          gameRef.conversationSystem.setScenario(gameData.game.scenario_data.prompt);
          
          // Generate and initialize custom objects for this scenario
          await GameInitializer.initializeCustomObjects(
            gameRef,
            gameData.game.scenario_data.id,
            gameData.game.scenario_data.prompt,
            gameData.game.scenario_data.theme
          );
        } else {
          console.log('⚠️ No scenario data found, using default generation');
        }
        
        // Restore player position and rotation
        if (gameRef.character && gameRef.character.mesh) {
          const pos = gameData.game.player_position;
          const rot = gameData.game.player_rotation;
          
          // Validate position data
          if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
            console.log('👤 Restoring player to position:', pos);
            gameRef.character.mesh.position.set(pos.x, pos.y, pos.z);
          } else {
            console.warn('⚠️ Invalid position data, using default spawn (0,0,0)');
            gameRef.character.mesh.position.set(0, 0, 0);
          }
          
          // Validate rotation data
          if (rot && typeof rot.x === 'number' && typeof rot.y === 'number' && typeof rot.z === 'number' && typeof rot.w === 'number') {
            gameRef.character.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
            console.log('✅ Player position and rotation restored');
          } else {
            console.warn('⚠️ Invalid rotation data, using default rotation');
            gameRef.character.mesh.quaternion.set(0, 0, 0, 1);
          }
        }

        // Restore health state
        if (gameData.game.health_data && gameRef.character) {
          console.log('❤️ Restoring health state');
          const healthSystem = gameRef.character.getHealthSystem();
          const healthData = gameData.game.health_data;
          healthSystem.setMaxHealth(healthData.maximum);
          if (healthData.current < healthData.maximum) {
            const damage = healthData.maximum - healthData.current;
            healthSystem.takeDamage({
              amount: damage,
              type: 'physical',
              source: 'Save Data',
              isCritical: false
            });
          }
          healthSystem.setRegeneration(healthData.regeneration);
        }

        // Restore skills
        if (gameData.skills && gameData.skills.length > 0 && gameRef.character) {
          console.log('📈 Restoring skills');
          const experienceSystem = gameRef.character.getExperienceSystem();
          const skillData: any = {};
          gameData.skills.forEach((skill: any) => {
            skillData[skill.skill_id] = {
              level: skill.level,
              experience: skill.experience,
              totalExperience: skill.total_experience,
              multiplier: skill.multiplier
            };
          });
          experienceSystem.importSkills(skillData);
        }

        // Restore inventory
        if (gameData.inventory && gameData.inventory.length > 0 && gameRef.character) {
          console.log('🎒 Restoring inventory');
          const inventorySystem = gameRef.character.getInventorySystem();
          // Clear existing inventory first
          const currentInventory = inventorySystem.getInventory();
          currentInventory.forEach(stack => {
            inventorySystem.removeItem(stack.item.id, stack.quantity);
          });
          // Add saved items
          gameData.inventory.forEach((item: any) => {
            inventorySystem.addItem(item.item_id, item.quantity);
          });
        }

        // Restore equipment
        if (gameData.equipment && gameData.equipment.length > 0 && gameRef.character) {
          console.log('⚔️ Restoring equipment');
          const equipmentManager = gameRef.character.getEquipmentManager();
          
          // Find equipped items and equip them
          gameData.equipment.forEach((equipment: any) => {
            if (equipment.is_equipped) {
              if (equipment.equipment_type === 'tool') {
                equipmentManager.equipTool(equipment.item_id);
              } else if (equipment.equipment_type === 'weapon') {
                equipmentManager.equipWeapon(equipment.item_id);
              }
            }
            
            // Update durability
            if (equipment.equipment_type === 'tool') {
              const tool = equipmentManager.getAvailableTools().find(t => t.id === equipment.item_id);
              if (tool) {
                tool.durability = equipment.durability;
                tool.maxDurability = equipment.max_durability;
              }
            } else if (equipment.equipment_type === 'weapon') {
              const weapon = equipmentManager.getAvailableWeapons().find(w => w.id === equipment.item_id);
              if (weapon) {
                weapon.durability = equipment.durability;
                weapon.maxDurability = equipment.max_durability;
              }
            }
          });
        }

        // Set the current game ID for saving
        gameRef.saveSystem.setCurrentGameId(gameData.game.id);

        // Load saved tiles
        if (gameData.mapTiles.length > 0) {
          console.log('🗺️ Loading', gameData.mapTiles.length, 'saved tiles');
          gameRef.mapManager.loadSavedTiles(gameData.mapTiles);
          console.log('✅ Map tiles loaded');
        }

        // Restore NPC states
        const npcStateMap = new Map();
        gameData.npcStates.forEach((state: any) => {
          npcStateMap.set(state.npc_id, state);
        });
        console.log('✅ NPC states restored:', npcStateMap.size, 'NPCs');

        // Generate area around loaded position in background
        setTimeout(() => {
          console.log('🌍 Starting background world generation...');
          if (gameRef.mapManager) {
            const pos = gameData.game.player_position;
            // Use safe position values
            const safePos = {
              x: (pos && typeof pos.x === 'number') ? pos.x : 0,
              y: (pos && typeof pos.y === 'number') ? pos.y : 0,
              z: (pos && typeof pos.z === 'number') ? pos.z : 0
            };
            gameRef.mapManager.updateAroundPosition(new THREE.Vector3(safePos.x, safePos.y, safePos.z)).catch(error => {
              console.error('Background generation error:', error);
            });
          }
        }, 1000);
      } else {
        console.log('🆕 No gameId provided, will start new game after component mounts');
        // Generate initial area around spawn for new game
        try {
          gameRef.mapManager.updateAroundPosition(new THREE.Vector3(0, 0, 0));
        } catch (error) {
          console.error('❌ Failed to generate initial area:', error);
        }
      }

      // Start game loop
      GameInitializer.startGameLoop(gameRef, callbacks);

      // Handle window resize
      const handleResize = () => {
        if (gameRef.renderer) {
          gameRef.renderer.handleResize();
        }
      };

      window.addEventListener('resize', handleResize);

      console.log('✅ Game initialization complete');
      callbacks.setIsLoaded(true);

    } catch (error) {
      console.error('❌ Fatal error during game initialization:', error);
      callbacks.setLoadingError(`Failed to initialize game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async initializeGameWithScenario(
    gameRef: GameRef,
    mountElement: HTMLElement,
    characterCustomization: CharacterCustomization,
    gameData: any,
    scenario: GameScenario,
    isUIActive: boolean,
    callbacks: {
      onTileGenerated: (tile: any, description: string) => void;
      onGenerationStart: (x: number, z: number) => void;
      setCurrentBiome: (biome: string) => void;
      setNearbyNPCs: (npcs: any[]) => void;
      setClosestNPC: (npc: any) => void;
      setNearbyObjects: (objects: InteractableObject[]) => void;
      setClosestObject: (object: InteractableObject | null) => void;
      setIsLoaded: (loaded: boolean) => void;
      setLoadingError: (error: string) => void;
    }
  ): Promise<void> {
    console.log('🎮 Initializing game with scenario:', scenario.name);
    
    try {
      // Initialize game components
      console.log('🔧 Creating GameRenderer...');
      gameRef.renderer = new GameRenderer();
      if (!gameRef.renderer) {
        throw new Error('Failed to create GameRenderer - constructor returned null');
      }
      gameRef.scene = gameRef.renderer.scene;
      
      console.log('🔧 Creating Character...');
      gameRef.character = new Character(characterCustomization);
      if (!gameRef.character) {
        throw new Error('Failed to create Character - constructor returned null');
      }
      
      console.log('🔧 Creating InputManager...');
      gameRef.inputManager = new InputManager();
      if (!gameRef.inputManager) {
        throw new Error('Failed to create InputManager - constructor returned null');
      }
      
      console.log('🔧 Creating CameraController...');
      gameRef.cameraController = new CameraController(gameRef.renderer.camera);
      if (!gameRef.cameraController) {
        throw new Error('Failed to create CameraController - constructor returned null');
      }
      
      console.log('🔧 Creating MapManager...');
      gameRef.mapManager = new MapManager(gameRef.renderer.scene);
      if (!gameRef.mapManager) {
        throw new Error('Failed to create MapManager - constructor returned null');
      }
      
      console.log('🔧 Creating ConversationSystem...');
      gameRef.conversationSystem = new ConversationSystem();
      if (!gameRef.conversationSystem) {
        throw new Error('Failed to create ConversationSystem - constructor returned null');
      }
      
      console.log('🔧 Creating SaveSystem...');
      gameRef.saveSystem = new SaveSystem();
      if (!gameRef.saveSystem) {
        throw new Error('Failed to create SaveSystem - constructor returned null');
      }

      console.log('🔧 Creating EnemyManager...');
      gameRef.enemyManager = new EnemyManager(gameRef.renderer.scene, gameRef.character.getInventorySystem());
      if (!gameRef.enemyManager) {
        throw new Error('Failed to create EnemyManager - constructor returned null');
      }

      // Store the object systems in the game ref for UI access
      gameRef.customObjectGenerator = this.customObjectGenerator;
      gameRef.objectDefinitionSystem = this.objectDefinitionSystem;

      console.log('✅ All game components created successfully');

      // Set scenario context for AI systems
      console.log('🌍 Setting scenario context for AI systems');
      gameRef.mapManager.setScenario(scenario.prompt, scenario.theme);
      gameRef.conversationSystem.setScenario(scenario.prompt);
      
      // Generate and initialize custom objects for this scenario
      await GameInitializer.initializeCustomObjects(
        gameRef,
        scenario.id,
        scenario.prompt,
        scenario.theme
      );

      // Initialize collision system with scene reference for debug visualization
      console.log('🔧 Initializing collision system...');
      collisionSystem.setScene(gameRef.renderer.scene);
      
      // Setup the scene
      console.log('🎨 Setting up scene...');
      gameRef.renderer.setupScene();
      gameRef.character.addToScene(gameRef.renderer.scene);

      // Mount the renderer
      console.log('🖥️ Mounting renderer...');
      mountElement.appendChild(gameRef.renderer.domElement);

      // Set up camera to follow character
      console.log('📷 Setting up camera...');
      gameRef.cameraController.setTarget(gameRef.character.mesh);

      // Link character to map manager for object registration
      console.log('🔗 Linking character to map manager...');
      gameRef.mapManager.setCharacter(gameRef.character);

      // Set up map manager callbacks
      console.log('🗺️ Setting up map callbacks...');
      gameRef.mapManager.setCallbacks({
        onTileGenerated: callbacks.onTileGenerated,
        onGenerationStart: callbacks.onGenerationStart
      });

      // Set initial UI state for input manager and provide game container reference
      gameRef.inputManager.setUIActive(isUIActive);
      gameRef.inputManager.setGameContainer(mountElement);

      // Apply loaded game data if available
      if (gameData) {
        console.log('🔄 Applying loaded game data...');
        
        // Restore player position and rotation
        if (gameRef.character && gameRef.character.mesh) {
          const pos = gameData.game.player_position;
          const rot = gameData.game.player_rotation;
          
          // Validate position data
          if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
            console.log('👤 Restoring player to position:', pos);
            gameRef.character.mesh.position.set(pos.x, pos.y, pos.z);
          } else {
            console.warn('⚠️ Invalid position data, using default spawn (0,0,0)');
            gameRef.character.mesh.position.set(0, 0, 0);
          }
          
          // Validate rotation data
          if (rot && typeof rot.x === 'number' && typeof rot.y === 'number' && typeof rot.z === 'number' && typeof rot.w === 'number') {
            gameRef.character.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
            console.log('✅ Player position and rotation restored');
          } else {
            console.warn('⚠️ Invalid rotation data, using default rotation');
            gameRef.character.mesh.quaternion.set(0, 0, 0, 1);
          }
        }

        // Restore health state
        if (gameData.game.health_data && gameRef.character) {
          console.log('❤️ Restoring health state');
          const healthSystem = gameRef.character.getHealthSystem();
          const healthData = gameData.game.health_data;
          healthSystem.setMaxHealth(healthData.maximum);
          if (healthData.current < healthData.maximum) {
            const damage = healthData.maximum - healthData.current;
            healthSystem.takeDamage({
              amount: damage,
              type: 'physical',
              source: 'Save Data',
              isCritical: false
            });
          }
          healthSystem.setRegeneration(healthData.regeneration);
        }

        // Restore skills
        if (gameData.skills && gameData.skills.length > 0 && gameRef.character) {
          console.log('📈 Restoring skills');
          const experienceSystem = gameRef.character.getExperienceSystem();
          const skillData: any = {};
          gameData.skills.forEach((skill: any) => {
            skillData[skill.skill_id] = {
              level: skill.level,
              experience: skill.experience,
              totalExperience: skill.total_experience,
              multiplier: skill.multiplier
            };
          });
          experienceSystem.importSkills(skillData);
        }

        // Restore inventory
        if (gameData.inventory && gameData.inventory.length > 0 && gameRef.character) {
          console.log('🎒 Restoring inventory');
          const inventorySystem = gameRef.character.getInventorySystem();
          // Clear existing inventory first
          const currentInventory = inventorySystem.getInventory();
          currentInventory.forEach(stack => {
            inventorySystem.removeItem(stack.item.id, stack.quantity);
          });
          // Add saved items
          gameData.inventory.forEach((item: any) => {
            inventorySystem.addItem(item.item_id, item.quantity);
          });
        }

        // Restore equipment
        if (gameData.equipment && gameData.equipment.length > 0 && gameRef.character) {
          console.log('⚔️ Restoring equipment');
          const equipmentManager = gameRef.character.getEquipmentManager();
          
          // Find equipped items and equip them
          gameData.equipment.forEach((equipment: any) => {
            if (equipment.is_equipped) {
              if (equipment.equipment_type === 'tool') {
                equipmentManager.equipTool(equipment.item_id);
              } else if (equipment.equipment_type === 'weapon') {
                equipmentManager.equipWeapon(equipment.item_id);
              }
            }
            
            // Update durability
            if (equipment.equipment_type === 'tool') {
              const tool = equipmentManager.getAvailableTools().find(t => t.id === equipment.item_id);
              if (tool) {
                tool.durability = equipment.durability;
                tool.maxDurability = equipment.max_durability;
              }
            } else if (equipment.equipment_type === 'weapon') {
              const weapon = equipmentManager.getAvailableWeapons().find(w => w.id === equipment.item_id);
              if (weapon) {
                weapon.durability = equipment.durability;
                weapon.maxDurability = equipment.max_durability;
              }
            }
          });
        }

        // Set the current game ID for saving
        gameRef.saveSystem.setCurrentGameId(gameData.game.id);

        // Load saved tiles
        if (gameData.mapTiles.length > 0) {
          console.log('🗺️ Loading', gameData.mapTiles.length, 'saved tiles');
          gameRef.mapManager.loadSavedTiles(gameData.mapTiles);
          console.log('✅ Map tiles loaded');
        }

        // Generate area around loaded position in background
        setTimeout(() => {
          console.log('🌍 Starting background world generation...');
          if (gameRef.mapManager) {
            const pos = gameData.game.player_position;
            // Use safe position values
            const safePos = {
              x: (pos && typeof pos.x === 'number') ? pos.x : 0,
              y: (pos && typeof pos.y === 'number') ? pos.y : 0,
              z: (pos && typeof pos.z === 'number') ? pos.z : 0
            };
            gameRef.mapManager.updateAroundPosition(new THREE.Vector3(safePos.x, safePos.y, safePos.z)).catch(error => {
              console.error('Background generation error:', error);
            });
          }
        }, 1000);
      } else {
        console.log('🆕 Starting new game with scenario - generating initial area');
        // Generate initial area around spawn for new game
        try {
          gameRef.mapManager.updateAroundPosition(new THREE.Vector3(0, 0, 0));
        } catch (error) {
          console.error('❌ Failed to generate initial area:', error);
        }
      }

      // Start game loop
      GameInitializer.startGameLoop(gameRef, callbacks);

      // Handle window resize
      const handleResize = () => {
        if (gameRef.renderer) {
          gameRef.renderer.handleResize();
        }
      };

      window.addEventListener('resize', handleResize);

      console.log('✅ Game initialization complete');
      callbacks.setIsLoaded(true);

    } catch (error) {
      console.error('❌ Fatal error during game initialization:', error);
      callbacks.setLoadingError(`Failed to initialize game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private static async initializeCustomObjects(
    gameRef: GameRef,
    scenarioId: string,
    scenarioPrompt: string,
    scenarioTheme: string
  ): Promise<void> {
    try {
      console.log('🎭 Initializing custom objects for scenario:', scenarioId);
      
      // Generate custom objects based on the scenario
      const objectSet = await GameInitializer.customObjectGenerator.generateObjectSet(
        scenarioId,
        scenarioPrompt,
        scenarioTheme
      );
      
      // Register the objects with the object definition system
      GameInitializer.objectDefinitionSystem.registerObjectSet(objectSet);
      
      console.log('✅ Custom objects initialized for scenario:', scenarioId);
      
      // Initialize enemy system with custom enemies - with null check
      if (gameRef.enemyManager && objectSet.objects.enemy && Array.isArray(objectSet.objects.enemy)) {
        console.log('🐺 Registering custom enemies:', objectSet.objects.enemy.length);
        gameRef.enemyManager.registerCustomEnemies(objectSet.objects.enemy);
      } else if (!gameRef.enemyManager) {
        console.warn('⚠️ Cannot register custom enemies - enemyManager is null');
      }
      
      // Initialize item system with custom items - with null check
      if (gameRef.character && objectSet.objects.item && Array.isArray(objectSet.objects.item)) {
        console.log('🎁 Registering custom items:', objectSet.objects.item.length);
        gameRef.character.getInventorySystem().registerCustomItems(objectSet.objects.item);
      } else if (!gameRef.character) {
        console.warn('⚠️ Cannot register custom items - character is null');
      }
      
      // Initialize weapon/tool system with custom equipment - with null check
      if (gameRef.character) {
        const equipmentManager = gameRef.character.getEquipmentManager();
        
        if (objectSet.objects.weapon && Array.isArray(objectSet.objects.weapon)) {
          console.log('⚔️ Registering custom weapons:', objectSet.objects.weapon.length);
          equipmentManager.registerCustomWeapons(objectSet.objects.weapon);
        }
        
        if (objectSet.objects.tool && Array.isArray(objectSet.objects.tool)) {
          console.log('🔨 Registering custom tools:', objectSet.objects.tool.length);
          equipmentManager.registerCustomTools(objectSet.objects.tool);
        }
      } else {
        console.warn('⚠️ Cannot register custom equipment - character is null');
      }
      
      // Register custom vegetation with map manager - with null check
      if (gameRef.mapManager && objectSet.objects.vegetation && Array.isArray(objectSet.objects.vegetation)) {
        console.log('🌳 Registering custom vegetation:', objectSet.objects.vegetation.length);
        gameRef.mapManager.registerCustomVegetation(objectSet.objects.vegetation);
      } else if (!gameRef.mapManager) {
        console.warn('⚠️ Cannot register custom vegetation - mapManager is null');
      }
      
      // Register custom structures with map manager - with null check
      if (gameRef.mapManager && objectSet.objects.structure && Array.isArray(objectSet.objects.structure)) {
        console.log('🏛️ Registering custom structures:', objectSet.objects.structure.length);
        gameRef.mapManager.registerCustomStructures(objectSet.objects.structure);
      } else if (!gameRef.mapManager) {
        console.warn('⚠️ Cannot register custom structures - mapManager is null');
      }
      
    } catch (error) {
      console.error('Failed to initialize custom objects:', error);
    }
  }

  private static startGameLoop(
    gameRef: GameRef,
    callbacks: {
      setCurrentBiome: (biome: string) => void;
      setNearbyNPCs: (npcs: any[]) => void;
      setClosestNPC: (npc: any) => void;
      setNearbyObjects: (objects: InteractableObject[]) => void;
      setClosestObject: (object: InteractableObject | null) => void;
    }
  ): void {
    console.log('🔄 Starting game loop...');
    
    let lastTime = Date.now();
    
    const animate = () => {
      if (!gameRef.renderer || !gameRef.character || !gameRef.inputManager || !gameRef.cameraController || !gameRef.mapManager || !gameRef.enemyManager) return;

      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update character based on input
      const inputState = gameRef.inputManager.getInputState();
      gameRef.character.update(inputState, deltaTime);

      // Update camera
      gameRef.cameraController.update();

      // Update map based on character position
      const characterPosition = gameRef.character.getPosition();
      try {
        gameRef.mapManager.updateAroundPosition(characterPosition);
      } catch (error) {
        console.error('Error updating map:', error);
      }

      // Update enemies
      gameRef.enemyManager.update(characterPosition, deltaTime);

      // Check for enemy attacks on player
      const enemyDamage = gameRef.enemyManager.checkEnemyAttacks(characterPosition);
      if (enemyDamage > 0) {
        const damageInfo: DamageInfo = {
          amount: enemyDamage,
          type: 'physical',
          source: 'Enemy Attack',
          isCritical: false,
          position: characterPosition
        };
        
        const playerDied = gameRef.character.takeDamage(damageInfo);
        if (playerDied) {
          console.log('💀 Player has been defeated!');
          // Handle player death (respawn, game over screen, etc.)
        }
      }

      // Check for player weapon attacks on enemies
      if (gameRef.character.isAttacking) {
        gameRef.character.attackEnemies(gameRef.enemyManager);
      }

      // Update current biome display
      const tileX = Math.floor(characterPosition.x / 25);
      const tileZ = Math.floor(characterPosition.z / 25);
      const currentTile = gameRef.mapManager.getTileInfo?.(tileX, tileZ);
      if (currentTile) {
        callbacks.setCurrentBiome(currentTile.biome);
      }

      // Enhanced NPC detection with collision system integration
      const nearbyNPCs = gameRef.mapManager.getNearbyNPCs(characterPosition, 10);
      callbacks.setNearbyNPCs(nearbyNPCs);

      // Find closest NPC for interaction using collision system
      let closestNPC: any = null;
      let closestNPCDistance = Infinity;
      
      nearbyNPCs.forEach(npc => {
        const distance = npc.distanceTo(characterPosition);
        if (distance < 4 && distance < closestNPCDistance) {
          // Additional check for line of sight
          if (npc.hasLineOfSightTo(characterPosition)) {
            closestNPC = npc;
            closestNPCDistance = distance;
          }
        }
      });
      callbacks.setClosestNPC(closestNPC);

      // Enhanced object detection
      const interactableManager = gameRef.character.getInteractableObjectManager();
      const nearbyObjects = interactableManager.getObjectsInRange(characterPosition, 4);
      callbacks.setNearbyObjects(nearbyObjects);

      // Find closest object for interaction with collision system integration
      let closestObject: InteractableObject | null = null;
      let closestObjectDistance = Infinity;
      
      nearbyObjects.forEach(object => {
        const distance = characterPosition.distanceTo(new THREE.Vector3(
          object.position.x,
          object.position.y,
          object.position.z
        ));
        if (distance < 3 && distance < closestObjectDistance) {
          // Check if object is directly accessible (no walls between)
          const losResult = collisionSystem.checkLineOfSight(
            { 
              x: characterPosition.x, 
              y: characterPosition.y + 1, 
              z: characterPosition.z 
            },
            { 
              x: object.position.x, 
              y: object.position.y + 0.5, 
              z: object.position.z 
            },
            3,
            ['trigger', 'character', 'enemy', 'npc']
          );
          
          if (losResult.clear) {
            closestObject = object;
            closestObjectDistance = distance;
          }
        }
      });
      callbacks.setClosestObject(closestObject);

      // Render the scene
      gameRef.renderer.render();

      gameRef.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  static cleanup(gameRef: GameRef): void {
    console.log('🧹 Cleaning up Game3D component...');
    
    if (gameRef.animationId) {
      cancelAnimationFrame(gameRef.animationId);
    }
    if (gameRef.inputManager) {
      gameRef.inputManager.dispose();
    }
    if (gameRef.mapManager) {
      gameRef.mapManager.dispose();
    }
    if (gameRef.enemyManager) {
      gameRef.enemyManager.clear();
    }
    
    // Clean up collision system
    collisionSystem.clear();
    
    // Clean up custom object generators
    GameInitializer.customObjectGenerator.clear();
    GameInitializer.objectDefinitionSystem.clear();
    
    window.removeEventListener('resize', () => {});
    if (gameRef.renderer) {
      try {
        const domElement = gameRef.renderer.domElement;
        if (domElement && domElement.parentElement) {
          domElement.parentElement.removeChild(domElement);
        }
      } catch (error) {
        console.log('Element already removed from DOM');
      }
      gameRef.renderer.dispose();
    }

    // Reset game ref
    gameRef.renderer = null;
    gameRef.scene = null;
    gameRef.character = null;
    gameRef.inputManager = null;
    gameRef.cameraController = null;
    gameRef.mapManager = null;
    gameRef.conversationSystem = null;
    gameRef.saveSystem = null;
    gameRef.enemyManager = null;
    gameRef.animationId = null;
    gameRef.customObjectGenerator = null;
    gameRef.objectDefinitionSystem = null;
  }
}