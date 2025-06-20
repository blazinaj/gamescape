import { supabase } from '../lib/supabase';
import { MapTile } from '../types/MapTypes';
import { CharacterCustomization } from '../types/CharacterTypes';
import { InventoryStack } from '../types/InventoryTypes';
import { Tool } from '../types/EquipmentTypes';
import { Skill } from '../types/ExperienceTypes';
import { HealthState } from '../types/HealthTypes';
import * as THREE from 'three';
import { GameScenario } from '../components/ScenarioSelector';

export interface GameSave {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  player_position: { x: number; y: number; z: number };
  player_rotation: { x: number; y: number; z: number; w: number };
  current_biome: string;
  play_time: number;
  character_customization: CharacterCustomization;
  health_data: HealthState;
  scenario_data?: {
    id: string;
    name: string;
    prompt: string;
    theme: string;
  };
}

export interface SavedMapTile {
  tile_x: number;
  tile_z: number;
  biome: string;
  objects: any[];
  description: string;
  theme: string;
}

export interface NPCState {
  npc_id: string;
  has_talked: boolean;
  conversation_count: number;
  last_interaction?: string;
}

export interface SavedSkill {
  skill_id: string;
  level: number;
  experience: number;
  total_experience: number;
  multiplier: number;
}

export interface SavedInventoryItem {
  item_id: string;
  quantity: number;
  slot_index?: number;
}

export interface SavedEquipment {
  equipment_type: 'tool' | 'weapon';
  item_id: string;
  durability: number;
  max_durability: number;
  is_equipped: boolean;
}

export interface CompleteGameData {
  game: GameSave;
  mapTiles: SavedMapTile[];
  npcStates: NPCState[];
  skills: SavedSkill[];
  inventory: SavedInventoryItem[];
  equipment: SavedEquipment[];
}

export class SaveSystem {
  private currentGameId: string | null = null;
  private startTime: number = Date.now();

  async ensureAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }

  async createNewGame(name: string): Promise<string | null> {
    try {
      console.log('🎮 Creating new game:', name);
      console.info(`Creating new game: ${name}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        console.error('User not authenticated when creating new game');
        return null;
      }

      const { data, error } = await supabase
        .from('games')
        .insert([
          {
            name,
            user_id: user.id,
            player_position: { x: 0, y: 0, z: 0 },
            player_rotation: { x: 0, y: 0, z: 0, w: 1 },
            current_biome: 'grassland',
            play_time: 0,
            character_customization: {
              bodyColor: '#FFDBAC',
              clothingColor: '#3B82F6',
              eyeColor: '#000000',
              scale: 1.0,
              headScale: 1.0,
              bodyWidth: 1.0,
              armLength: 1.0,
              legLength: 1.0,
              name: 'Adventurer'
            },
            health_data: {
              current: 100,
              maximum: 100,
              regeneration: 1,
              lastDamageTime: 0,
              isRegenerating: false
            }
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating game:', error);
        console.error(`Error creating game: ${error.message}`);
        throw error;
      }

      console.log('✅ New game created with ID:', data.id);
      console.info(`New game created with ID: ${data.id}`);
      
      this.currentGameId = data.id;
      this.startTime = Date.now();
      return data.id;
    } catch (error) {
      console.error('Failed to create new game:', error);
      console.error(`Failed to create new game: ${error.message || error}`);
      return null;
    }
  }

  async createNewGameWithScenario(name: string, scenario: GameScenario): Promise<string | null> {
    try {
      console.log('🎮 Creating new game with scenario:', scenario.name);
      console.info(`Creating new game with scenario: ${scenario.name}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        console.error('User not authenticated when creating game with scenario');
        return null;
      }

      // Determine starting biome based on scenario theme
      let startingBiome = 'grassland';
      switch (scenario.theme) {
        case 'pastoral':
          startingBiome = 'grassland';
          break;
        case 'archaeological':
          startingBiome = 'ruins';
          break;
        case 'survival':
          startingBiome = 'forest';
          break;
        case 'fantasy':
          startingBiome = 'forest';
          break;
        case 'nautical':
          startingBiome = 'lake';
          break;
        case 'industrial':
          startingBiome = 'village';
          break;
        case 'apocalyptic':
          startingBiome = 'desert';
          break;
        default:
          startingBiome = 'grassland';
      }

      const { data, error } = await supabase
        .from('games')
        .insert([
          {
            name,
            user_id: user.id,
            player_position: { x: 0, y: 0, z: 0 },
            player_rotation: { x: 0, y: 0, z: 0, w: 1 },
            current_biome: startingBiome,
            play_time: 0,
            character_customization: {
              bodyColor: '#FFDBAC',
              clothingColor: '#3B82F6',
              eyeColor: '#000000',
              scale: 1.0,
              headScale: 1.0,
              bodyWidth: 1.0,
              armLength: 1.0,
              legLength: 1.0,
              name: 'Adventurer'
            },
            health_data: {
              current: 100,
              maximum: 100,
              regeneration: 1,
              lastDamageTime: 0,
              isRegenerating: false
            },
            scenario_data: {
              id: scenario.id,
              name: scenario.name,
              prompt: scenario.prompt,
              theme: scenario.theme
            }
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating game with scenario:', error);
        console.error(`Error creating game with scenario: ${error.message}`);
        throw error;
      }

      console.log('✅ New game created with scenario. ID:', data.id);
      console.info(`New game created with scenario ${scenario.name}. ID: ${data.id}`);
      
      this.currentGameId = data.id;
      this.startTime = Date.now();
      
      // Store the scenario in player_settings for future reference
      try {
        await supabase
          .from('player_settings')
          .insert([
            {
              game_id: data.id,
              setting_key: 'scenario',
              setting_value: {
                id: scenario.id,
                name: scenario.name,
                description: scenario.description,
                prompt: scenario.prompt,
                theme: scenario.theme,
                difficulty: scenario.difficulty,
                features: scenario.features
              }
            }
          ]);
        console.log('✅ Scenario data stored in player_settings');
      } catch (settingsError) {
        console.warn('⚠️ Could not store scenario in settings (non-critical):', settingsError);
      }

      return data.id;
    } catch (error) {
      console.error('Failed to create new game with scenario:', error);
      console.error(`Failed to create new game with scenario: ${error.message || error}`);
      return null;
    }
  }

  async loadGame(gameId: string): Promise<CompleteGameData | null> {
    try {
      console.log('🔄 Loading game data for ID:', gameId);
      console.info(`Loading game data for ID: ${gameId}`);
      
      const isAuth = await this.ensureAuthenticated();
      if (!isAuth) {
        console.error('❌ User not authenticated');
        console.error('User not authenticated when loading game');
        return null;
      }

      // Load game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error('❌ Error loading game data:', gameError);
        console.error(`Error loading game data: ${gameError.message}`);
        throw gameError;
      }

      // Load map tiles
      const { data: mapTiles, error: tilesError } = await supabase
        .from('map_tiles')
        .select('tile_x, tile_z, biome, objects, description, theme')
        .eq('game_id', gameId);

      if (tilesError) {
        console.error('❌ Error loading map tiles:', tilesError);
        console.error(`Error loading map tiles: ${tilesError.message}`);
        throw tilesError;
      }

      // Load NPC states
      const { data: npcStates, error: npcError } = await supabase
        .from('npc_states')
        .select('npc_id, has_talked, conversation_count, last_interaction')
        .eq('game_id', gameId);

      if (npcError) {
        console.error('❌ Error loading NPC states:', npcError);
        console.error(`Error loading NPC states: ${npcError.message}`);
        throw npcError;
      }

      // Load skills
      const { data: skills, error: skillsError } = await supabase
        .from('player_skills')
        .select('skill_id, level, experience, total_experience, multiplier')
        .eq('game_id', gameId);

      if (skillsError) {
        console.error('❌ Error loading skills:', skillsError);
        console.error(`Error loading skills: ${skillsError.message}`);
        throw skillsError;
      }

      // Load inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('player_inventory')
        .select('item_id, quantity, slot_index')
        .eq('game_id', gameId);

      if (inventoryError) {
        console.error('❌ Error loading inventory:', inventoryError);
        console.error(`Error loading inventory: ${inventoryError.message}`);
        throw inventoryError;
      }

      // Load equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('player_equipment')
        .select('equipment_type, item_id, durability, max_durability, is_equipped')
        .eq('game_id', gameId);

      if (equipmentError) {
        console.error('❌ Error loading equipment:', equipmentError);
        console.error(`Error loading equipment: ${equipmentError.message}`);
        throw equipmentError;
      }

      console.log('✅ Successfully loaded complete game data for ID:', gameId);
      console.info(`Successfully loaded complete game data for ID: ${gameId}`);
      
      this.currentGameId = gameId;
      this.startTime = Date.now() - (gameData.play_time * 1000);

      return {
        game: gameData,
        mapTiles: mapTiles || [],
        npcStates: npcStates || [],
        skills: skills || [],
        inventory: inventory || [],
        equipment: equipment || []
      };
    } catch (error) {
      console.error('Failed to load game:', error);
      console.error(`Failed to load game: ${error.message || error}`);
      return null;
    }
  }

  async saveGame(
    playerPosition: THREE.Vector3,
    playerRotation: THREE.Quaternion,
    currentBiome: string,
    mapTiles: Map<string, MapTile>,
    npcStates: Map<string, NPCState>,
    characterCustomization: CharacterCustomization,
    healthState: HealthState,
    skills: Map<string, Skill>,
    inventory: InventoryStack[],
    equippedTool: Tool | null,
    equippedWeapon: Tool | null,
    availableTools: Tool[],
    availableWeapons: Tool[],
    scenarioData?: any
  ): Promise<boolean> {
    if (!this.currentGameId) {
      console.error('❌ No current game ID set');
      console.error('No current game ID set when trying to save');
      return false;
    }

    try {
      console.log(`💾 Saving game ${this.currentGameId} with ${mapTiles.size} tiles`);
      console.info(`Saving game ${this.currentGameId} with ${mapTiles.size} tiles`);
      
      const currentPlayTime = Math.floor((Date.now() - this.startTime) / 1000);

      // Validate position data before saving
      if (isNaN(playerPosition.x) || isNaN(playerPosition.y) || isNaN(playerPosition.z)) {
        console.error('❌ Invalid player position:', playerPosition);
        console.error(`Invalid player position when saving: ${JSON.stringify(playerPosition)}`);
        playerPosition = new THREE.Vector3(0, 0, 0);
      }
      
      if (isNaN(playerRotation.x) || isNaN(playerRotation.y) || isNaN(playerRotation.z) || isNaN(playerRotation.w)) {
        console.error('❌ Invalid player rotation:', playerRotation);
        console.error(`Invalid player rotation when saving: ${JSON.stringify(playerRotation)}`);
        playerRotation = new THREE.Quaternion();
      }

      // Update main game state
      const { error: gameError } = await supabase
        .from('games')
        .update({
          player_position: {
            x: playerPosition.x,
            y: playerPosition.y,
            z: playerPosition.z
          },
          player_rotation: {
            x: playerRotation.x,
            y: playerRotation.y,
            z: playerRotation.z,
            w: playerRotation.w
          },
          current_biome: currentBiome,
          play_time: currentPlayTime,
          character_customization: characterCustomization,
          health_data: {
            current: healthState.current,
            maximum: healthState.maximum,
            regeneration: healthState.regeneration,
            lastDamageTime: healthState.lastDamageTime,
            isRegenerating: healthState.isRegenerating
          },
          // Include scenario data if provided
          ...(scenarioData ? { scenario_data: scenarioData } : {})
        })
        .eq('id', this.currentGameId);

      if (gameError) {
        console.error('❌ Error updating game data:', gameError);
        console.error(`Error updating game data: ${gameError.message}`);
        throw gameError;
      }

      console.log('✅ Game main data updated successfully');

      // Convert map tiles to database format
      const tileData: any[] = [];
      let tileCount = 0;
      
      mapTiles.forEach((tile) => {
        try {
          // Validate and clean tile data before saving
          if (!tile || !tile.objects || !Array.isArray(tile.objects)) {
            console.warn(`⚠️ Invalid tile data at ${tile.x}, ${tile.z}, skipping`);
            return;
          }
          
          // Filter out any invalid objects
          const validObjects = tile.objects.filter(obj => 
            obj && obj.type && obj.position && obj.scale && obj.rotation
          );
          
          tileData.push({
            game_id: this.currentGameId,
            tile_x: tile.x,
            tile_z: tile.z,
            biome: tile.biome,
            objects: validObjects,
            description: `Generated tile at (${tile.x}, ${tile.z})`,
            theme: tile.biome
          });
          
          tileCount++;
        } catch (error) {
          console.error(`❌ Error processing tile at ${tile.x}, ${tile.z}:`, error);
          console.error(`Error processing tile at ${tile.x}, ${tile.z}: ${error.message}`);
        }
      });

      // Use batched upsert for large tile collections
      if (tileData.length > 0) {
        // Save in batches of 100 to avoid hitting request size limits
        const BATCH_SIZE = 50; // Smaller batch size for better reliability
        for (let i = 0; i < tileData.length; i += BATCH_SIZE) {
          const batch = tileData.slice(i, i + BATCH_SIZE);
          console.log(`💾 Saving tile batch ${i/BATCH_SIZE + 1}/${Math.ceil(tileData.length/BATCH_SIZE)}: ${batch.length} tiles`);
          
          try {
            const { error: tilesError } = await supabase
              .from('map_tiles')
              .upsert(batch, {
                onConflict: 'game_id,tile_x,tile_z'
              });

            if (tilesError) {
              console.error(`Failed to save tile batch ${i/BATCH_SIZE + 1}:`, tilesError);
              console.error(`Failed to save tile batch ${i/BATCH_SIZE + 1}: ${tilesError.message}`);
              throw tilesError;
            }
            
            // Brief pause between batches to avoid rate limits
            if (i + BATCH_SIZE < tileData.length) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (batchError) {
            console.error(`Error in batch ${i/BATCH_SIZE + 1}:`, batchError);
            console.error(`Error in batch ${i/BATCH_SIZE + 1}: ${batchError.message || batchError}`);
            // Continue with next batch instead of failing completely
          }
        }
        
        console.log(`✅ Successfully saved ${tileCount} map tiles`);
        console.info(`Successfully saved ${tileCount} map tiles`);
      }

      // Save/update NPC states
      const npcData: any[] = [];
      npcStates.forEach((state, npcId) => {
        npcData.push({
          game_id: this.currentGameId,
          npc_id: npcId,
          has_talked: state.has_talked || false,
          conversation_count: state.conversation_count || 0,
          last_interaction: state.last_interaction || null
        });
      });

      if (npcData.length > 0) {
        console.log(`💾 Saving ${npcData.length} NPC states`);
        try {
          const { error: npcError } = await supabase
            .from('npc_states')
            .upsert(npcData, {
              onConflict: 'game_id,npc_id'
            });

          if (npcError) {
            console.error('❌ Error saving NPC states:', npcError);
            console.error(`Error saving NPC states: ${npcError.message}`);
            throw npcError;
          }
        } catch (npcError) {
          console.error('❌ Error during NPC state saving:', npcError);
          console.error(`Error during NPC state saving: ${npcError.message || npcError}`);
          // Continue - NPCs aren't critical
        }
      }

      // Save skills
      const skillData: any[] = [];
      skills.forEach((skill) => {
        skillData.push({
          game_id: this.currentGameId,
          skill_id: skill.id,
          level: skill.level,
          experience: skill.experience,
          total_experience: skill.totalExperience,
          multiplier: skill.multiplier
        });
      });

      if (skillData.length > 0) {
        console.log(`💾 Saving ${skillData.length} skills`);
        try {
          const { error: skillsError } = await supabase
            .from('player_skills')
            .upsert(skillData, {
              onConflict: 'game_id,skill_id'
            });

          if (skillsError) {
            console.error('❌ Error saving skills:', skillsError);
            console.error(`Error saving skills: ${skillsError.message}`);
            throw skillsError;
          }
        } catch (skillError) {
          console.error('❌ Error during skill saving:', skillError);
          console.error(`Error during skill saving: ${skillError.message || skillError}`);
          // Continue - skills aren't critical
        }
      }

      // Save inventory
      try {
        // First, clear existing inventory
        const { error: clearInventoryError } = await supabase
          .from('player_inventory')
          .delete()
          .eq('game_id', this.currentGameId);

        if (clearInventoryError) {
          console.error('❌ Error clearing inventory:', clearInventoryError);
          console.error(`Error clearing inventory: ${clearInventoryError.message}`);
          throw clearInventoryError;
        }

        // Insert current inventory
        if (inventory.length > 0) {
          console.log(`💾 Saving ${inventory.length} inventory items`);
          const inventoryData = inventory.map((stack, index) => ({
            game_id: this.currentGameId,
            item_id: stack.item.id,
            quantity: stack.quantity,
            slot_index: index
          }));

          const { error: inventoryError } = await supabase
            .from('player_inventory')
            .insert(inventoryData);

          if (inventoryError) {
            console.error('❌ Error saving inventory:', inventoryError);
            console.error(`Error saving inventory: ${inventoryError.message}`);
            throw inventoryError;
          }
        }
      } catch (inventoryError) {
        console.error('❌ Error during inventory saving:', inventoryError);
        console.error(`Error during inventory saving: ${inventoryError.message || inventoryError}`);
        // Continue - inventory isn't critical
      }

      // Save equipment
      try {
        // Clear existing equipment
        const { error: clearEquipmentError } = await supabase
          .from('player_equipment')
          .delete()
          .eq('game_id', this.currentGameId);

        if (clearEquipmentError) {
          console.error('❌ Error clearing equipment:', clearEquipmentError);
          console.error(`Error clearing equipment: ${clearEquipmentError.message}`);
          throw clearEquipmentError;
        }

        // Save current equipment
        const equipmentData: any[] = [];

        // Save all available tools
        availableTools.forEach(tool => {
          equipmentData.push({
            game_id: this.currentGameId,
            equipment_type: 'tool',
            item_id: tool.id,
            durability: tool.durability,
            max_durability: tool.maxDurability,
            is_equipped: equippedTool?.id === tool.id
          });
        });

        // Save all available weapons
        availableWeapons.forEach(weapon => {
          equipmentData.push({
            game_id: this.currentGameId,
            equipment_type: 'weapon',
            item_id: weapon.id,
            durability: weapon.durability,
            max_durability: weapon.maxDurability,
            is_equipped: equippedWeapon?.id === weapon.id
          });
        });

        if (equipmentData.length > 0) {
          console.log(`💾 Saving ${equipmentData.length} equipment items`);
          const { error: equipmentError } = await supabase
            .from('player_equipment')
            .insert(equipmentData);

          if (equipmentError) {
            console.error('❌ Error saving equipment:', equipmentError);
            console.error(`Error saving equipment: ${equipmentError.message}`);
            throw equipmentError;
          }
        }
      } catch (equipmentError) {
        console.error('❌ Error during equipment saving:', equipmentError);
        console.error(`Error during equipment saving: ${equipmentError.message || equipmentError}`);
        // Continue - equipment isn't critical
      }

      console.log('💾 Game saved successfully with complete player data');
      console.info(`Game ${this.currentGameId} saved successfully with ${mapTiles.size} tiles`);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      console.error(`Failed to save game: ${error.message || error}`);
      return false;
    }
  }

  async getGameScenario(gameId: string): Promise<any | null> {
    try {
      // First check if scenario data is in the game record
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('scenario_data')
        .eq('id', gameId)
        .single();

      if (gameData?.scenario_data) {
        console.log('✅ Found scenario data in game record');
        return gameData.scenario_data;
      }

      // If not, check player_settings
      const { data, error } = await supabase
        .from('player_settings')
        .select('setting_value')
        .eq('game_id', gameId)
        .eq('setting_key', 'scenario')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No scenario found, not an error
          console.log('ℹ️ No scenario found for this game');
          return null;
        }
        console.error('❌ Error loading scenario data:', error);
        throw error;
      }

      console.log('✅ Found scenario data in player settings');
      return data?.setting_value || null;
    } catch (error) {
      console.error('Failed to get game scenario:', error);
      return null;
    }
  }

  async listGames(): Promise<GameSave[]> {
    try {
      const isAuth = await this.ensureAuthenticated();
      if (!isAuth) {
        console.error('❌ User not authenticated');
        return [];
      }

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error listing games:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Failed to list games:', error);
      return [];
    }
  }

  async deleteGame(gameId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting game:', gameId);
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) {
        console.error('❌ Error deleting game:', error);
        throw error;
      }
      console.log('✅ Game deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete game:', error);
      return false;
    }
  }

  getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  setCurrentGameId(gameId: string): void {
    this.currentGameId = gameId;
    console.log(`🎮 Game ID set to: ${gameId}`);
    console.info(`Current game ID set to: ${gameId}`);
  }

  formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}