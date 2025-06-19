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
import { CharacterCustomization } from '../types/CharacterTypes';
import { GameRef } from '../hooks/useGameState';
import { InteractableObject } from '../services/InteractableObjectManager';
import { DamageInfo } from '../types/HealthTypes';
import { collisionSystem } from '../services/CollisionSystem';
import { GameScenario } from '../components/ScenarioSelector';

export class GameInitializer {
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
      
      console.log('🔧 Creating Character...');
      gameRef.character = new Character(characterCustomization);
      
      console.log('🔧 Creating InputManager...');
      gameRef.inputManager = new InputManager();
      
      console.log('🔧 Creating CameraController...');
      gameRef.cameraController = new CameraController(gameRef.renderer.camera);
      
      console.log('🔧 Creating MapManager...');
      gameRef.mapManager = new MapManager(gameRef.renderer.scene);
      
      console.log('🔧 Creating ConversationSystem...');
      gameRef.conversationSystem = new ConversationSystem();
      
      console.log('🔧 Creating SaveSystem...');
      gameRef.saveSystem = new SaveSystem();

      console.log('🔧 Creating EnemyManager...');
      gameRef.enemyManager = new EnemyManager(gameRef.renderer.scene, gameRef.character.getInventorySystem());

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
        } else {
          console.log('⚠️ No scenario data found, using default generation');
        }
        
        // Restore player position and rotation
        const pos = gameData.game.player_position;
        const rot = gameData.game.player_rotation;
        
        console.log('👤 Restoring player to position:', pos);
        gameRef.character.mesh.position.set(pos.x, pos.y, pos.z);
        gameRef.character.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
        console.log('✅ Player position restored');

        // Restore health state
        if (gameData.game.health_data) {
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
        if (gameData.skills && gameData.skills.length > 0) {
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
        if (gameData.inventory && gameData.inventory.length > 0) {
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
        if (gameData.equipment && gameData.equipment.length > 0) {
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
            gameRef.mapManager.updateAroundPosition(new THREE.Vector3(pos.x, pos.y, pos.z)).catch(error => {
              console.error('Background generation error:', error);
            });
          }
        }, 1000);
      } else {
        console.log('🆕 Starting new game - generating initial area');
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
      
      console.log('🔧 Creating Character...');
      gameRef.character = new Character(characterCustomization);
      
      console.log('🔧 Creating InputManager...');
      gameRef.inputManager = new InputManager();
      
      console.log('🔧 Creating CameraController...');
      gameRef.cameraController = new CameraController(gameRef.renderer.camera);
      
      console.log('🔧 Creating MapManager...');
      gameRef.mapManager = new MapManager(gameRef.renderer.scene);
      
      console.log('🔧 Creating ConversationSystem...');
      gameRef.conversationSystem = new ConversationSystem();
      
      console.log('🔧 Creating SaveSystem...');
      gameRef.saveSystem = new SaveSystem();

      console.log('🔧 Creating EnemyManager...');
      gameRef.enemyManager = new EnemyManager(gameRef.renderer.scene, gameRef.character.getInventorySystem());

      console.log('✅ All game components created successfully');

      // Set scenario context for AI systems
      console.log('🌍 Setting scenario context for AI systems');
      gameRef.mapManager.setScenario(scenario.prompt, scenario.theme);
      gameRef.conversationSystem.setScenario(scenario.prompt);

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
        const pos = gameData.game.player_position;
        const rot = gameData.game.player_rotation;
        
        console.log('👤 Restoring player to position:', pos);
        gameRef.character.mesh.position.set(pos.x, pos.y, pos.z);
        gameRef.character.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
        console.log('✅ Player position restored');

        // Restore health state
        if (gameData.game.health_data) {
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
        if (gameData.skills && gameData.skills.length > 0) {
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
        if (gameData.inventory && gameData.inventory.length > 0) {
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
        if (gameData.equipment && gameData.equipment.length > 0) {
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
            gameRef.mapManager.updateAroundPosition(new THREE.Vector3(pos.x, pos.y, pos.z)).catch(error => {
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
    gameRef.character = null;
    gameRef.inputManager = null;
    gameRef.cameraController = null;
    gameRef.mapManager = null;
    gameRef.conversationSystem = null;
    gameRef.saveSystem = null;
    gameRef.enemyManager = null;
    gameRef.animationId = null;
  }
}