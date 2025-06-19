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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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

      if (error) throw error;

      this.currentGameId = data.id;
      this.startTime = Date.now();
      return data.id;
    } catch (error) {
      console.error('Failed to create new game:', error);
      return null;
    }
  }

  async createNewGameWithScenario(name: string, scenario: GameScenario): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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

      if (error) throw error;

      this.currentGameId = data.id;
      this.startTime = Date.now();
      
      // Store the scenario in player_settings for future reference
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

      return data.id;
    } catch (error) {
      console.error('Failed to create new game with scenario:', error);
      return null;
    }
  }

  async loadGame(gameId: string): Promise<CompleteGameData | null> {
    try {
      const isAuth = await this.ensureAuthenticated();
      if (!isAuth) return null;

      // Load game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      // Load map tiles
      const { data: mapTiles, error: tilesError } = await supabase
        .from('map_tiles')
        .select('tile_x, tile_z, biome, objects, description, theme')
        .eq('game_id', gameId);

      if (tilesError) throw tilesError;

      // Load NPC states
      const { data: npcStates, error: npcError } = await supabase
        .from('npc_states')
        .select('npc_id, has_talked, conversation_count, last_interaction')
        .eq('game_id', gameId);

      if (npcError) throw npcError;

      // Load skills
      const { data: skills, error: skillsError } = await supabase
        .from('player_skills')
        .select('skill_id, level, experience, total_experience, multiplier')
        .eq('game_id', gameId);

      if (skillsError) throw skillsError;

      // Load inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('player_inventory')
        .select('item_id, quantity, slot_index')
        .eq('game_id', gameId);

      if (inventoryError) throw inventoryError;

      // Load equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('player_equipment')
        .select('equipment_type, item_id, durability, max_durability, is_equipped')
        .eq('game_id', gameId);

      if (equipmentError) throw equipmentError;

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
    if (!this.currentGameId) return false;

    try {
      console.log(`💾 Saving game ${this.currentGameId} with ${mapTiles.size} tiles`);
      const currentPlayTime = Math.floor((Date.now() - this.startTime) / 1000);

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

      if (gameError) throw gameError;

      // Save/update map tiles
      const tileData: any[] = [];
      mapTiles.forEach((tile) => {
        tileData.push({
          game_id: this.currentGameId,
          tile_x: tile.x,
          tile_z: tile.z,
          biome: tile.biome,
          objects: tile.objects,
          description: `Generated tile at (${tile.x}, ${tile.z})`,
          theme: tile.biome
        });
      });

      // Use batched upsert for large tile collections
      if (tileData.length > 0) {
        // Save in batches of 100 to avoid hitting request size limits
        const BATCH_SIZE = 100;
        for (let i = 0; i < tileData.length; i += BATCH_SIZE) {
          const batch = tileData.slice(i, i + BATCH_SIZE);
          console.log(`💾 Saving tile batch ${i/BATCH_SIZE + 1}/${Math.ceil(tileData.length/BATCH_SIZE)}: ${batch.length} tiles`);
          
          const { error: tilesError } = await supabase
            .from('map_tiles')
            .upsert(batch, {
              onConflict: 'game_id,tile_x,tile_z'
            });

          if (tilesError) {
            console.error(`Failed to save tile batch ${i/BATCH_SIZE + 1}:`, tilesError);
            throw tilesError;
          }
          
          // Brief pause between batches to avoid rate limits
          if (i + BATCH_SIZE < tileData.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        console.log(`✅ Successfully saved all ${tileData.length} map tiles`);
      }

      // Save/update NPC states
      const npcData: any[] = [];
      npcStates.forEach((state, npcId) => {
        npcData.push({
          game_id: this.currentGameId,
          npc_id: npcId,
          has_talked: state.has_talked,
          conversation_count: state.conversation_count,
          last_interaction: state.last_interaction
        });
      });

      if (npcData.length > 0) {
        const { error: npcError } = await supabase
          .from('npc_states')
          .upsert(npcData, {
            onConflict: 'game_id,npc_id'
          });

        if (npcError) throw npcError;
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
        const { error: skillsError } = await supabase
          .from('player_skills')
          .upsert(skillData, {
            onConflict: 'game_id,skill_id'
          });

        if (skillsError) throw skillsError;
      }

      // Save inventory
      // First, clear existing inventory
      const { error: clearInventoryError } = await supabase
        .from('player_inventory')
        .delete()
        .eq('game_id', this.currentGameId);

      if (clearInventoryError) throw clearInventoryError;

      // Insert current inventory
      if (inventory.length > 0) {
        const inventoryData = inventory.map((stack, index) => ({
          game_id: this.currentGameId,
          item_id: stack.item.id,
          quantity: stack.quantity,
          slot_index: index
        }));

        const { error: inventoryError } = await supabase
          .from('player_inventory')
          .insert(inventoryData);

        if (inventoryError) throw inventoryError;
      }

      // Save equipment
      // Clear existing equipment
      const { error: clearEquipmentError } = await supabase
        .from('player_equipment')
        .delete()
        .eq('game_id', this.currentGameId);

      if (clearEquipmentError) throw clearEquipmentError;

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
        const { error: equipmentError } = await supabase
          .from('player_equipment')
          .insert(equipmentData);

        if (equipmentError) throw equipmentError;
      }

      console.log('💾 Game saved successfully with complete player data');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  async listGames(): Promise<GameSave[]> {
    try {
      const isAuth = await this.ensureAuthenticated();
      if (!isAuth) return [];

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to list games:', error);
      return [];
    }
  }

  async deleteGame(gameId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete game:', error);
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
          return null;
        }
        throw error;
      }

      return data?.setting_value || null;
    } catch (error) {
      console.error('Failed to get game scenario:', error);
      return null;
    }
  }

  getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  setCurrentGameId(gameId: string): void {
    this.currentGameId = gameId;
    console.log(`🎮 Game ID set to: ${gameId}`);
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