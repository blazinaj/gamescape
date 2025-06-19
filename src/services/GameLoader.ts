import { SaveSystem, CompleteGameData, SavedMapTile, NPCState, SavedSkill, SavedInventoryItem, SavedEquipment } from './SaveSystem';

export interface GameLoadResult {
  game: any;
  mapTiles: SavedMapTile[];
  npcStates: NPCState[];
  skills: SavedSkill[];
  inventory: SavedInventoryItem[];
  equipment: SavedEquipment[];
}

export class GameLoader {
  static async loadGameData(gameId: string): Promise<GameLoadResult | null> {
    console.log('🔄 === STARTING COMPLETE LOAD PROCESS ===');
    console.log('🔄 Loading game with ID:', gameId);
    
    const saveSystem = new SaveSystem();
    console.log('🔌 Setting current game ID:', gameId);
    saveSystem.setCurrentGameId(gameId);
    
    console.log('📦 Calling loadGame...');
    const saveData = await saveSystem.loadGame(gameId);
    console.log('📦 LoadGame returned:', saveData);
    
    if (!saveData) {
      throw new Error('No save data found - game may not exist or you may not have permission to access it');
    }

    console.log('✅ Complete game data loaded successfully');
    console.log('Game info:', {
      name: saveData.game.name,
      position: saveData.game.player_position,
      biome: saveData.game.current_biome,
      tileCount: saveData.mapTiles.length,
      npcCount: saveData.npcStates.length,
      skillCount: saveData.skills.length,
      inventoryCount: saveData.inventory.length,
      equipmentCount: saveData.equipment.length
    });
    
    console.log('✅ === COMPLETE LOAD PROCESS COMPLETE ===');
    return saveData;
  }
}