import { AssetLibraryService } from './AssetLibraryService';
import { createClient } from 'npm:@supabase/supabase-js@^2.101.1';

export interface CharacterGenerationRequest {
  description: string;
  artStyle?: 'realistic' | 'stylized' | 'cartoon' | 'anime';
  userId?: string;
  generateTextures?: boolean;
  generateRigging?: boolean;
}

export interface GeneratedCharacter {
  assetId: string;
  meshyRequestId: string;
  status: 'pending' | 'completed' | 'failed';
  modelUrl?: string;
  previewUrl?: string;
  estimatedTime?: string;
}

export class CharacterGenerationService {
  private assetLibrary: AssetLibraryService;
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.assetLibrary = new AssetLibraryService(this.supabase);
  }

  async generateCharacter(
    request: CharacterGenerationRequest
  ): Promise<GeneratedCharacter> {
    const { description, artStyle, userId, generateTextures, generateRigging } = request;

    // Check if similar character exists in library
    const existingAsset = await this.findExistingCharacter(description, artStyle);
    if (existingAsset) {
      await this.assetLibrary.incrementAssetUsage(existingAsset.id);
      return {
        assetId: existingAsset.id,
        meshyRequestId: existingAsset.meshy_request_id,
        status: 'completed',
        modelUrl: existingAsset.file_url || undefined,
        previewUrl: existingAsset.preview_url || undefined,
      };
    }

    // Generate new character
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meshy-asset-generator/generate-model`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: description,
        art_style: artStyle || 'realistic',
        user_id: userId,
        name: `Character: ${description.substring(0, 50)}`,
        description: `AI-generated character from prompt: ${description}`,
        tags: ['character', artStyle || 'realistic', 'player-generated'],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to generate character: ${error.error}`);
    }

    const data = await response.json();

    return {
      assetId: data.asset_id,
      meshyRequestId: data.meshy_request_id,
      status: 'pending',
      estimatedTime: '2-5 minutes',
    };
  }

  private async findExistingCharacter(
    description: string,
    artStyle?: string
  ): Promise<any | null> {
    const tags = [artStyle || 'realistic', 'character'];

    // First try exact tag match
    const similar = await this.assetLibrary.findSimilarAssets('model', tags, 1);
    if (similar.length > 0) {
      return similar[0];
    }

    // Then search by description keywords
    const keywords = description.split(' ').filter(word => word.length > 3);
    for (const keyword of keywords) {
      const results = await this.assetLibrary.searchAssets(keyword, 'model');
      if (results.length > 0) {
        return results[0];
      }
    }

    return null;
  }

  async checkGenerationStatus(meshyRequestId: string): Promise<GeneratedCharacter> {
    const asset = await this.assetLibrary.getAssetByMeshyRequestId(meshyRequestId);

    if (!asset) {
      throw new Error('Asset not found');
    }

    return {
      assetId: asset.id,
      meshyRequestId: asset.meshy_request_id,
      status: asset.status as 'pending' | 'completed' | 'failed',
      modelUrl: asset.file_url || undefined,
      previewUrl: asset.preview_url || undefined,
    };
  }

  async getCharacterAsset(assetId: string) {
    return this.assetLibrary.getAsset(assetId);
  }

  async listAvailableCharacters(limit: number = 20) {
    const characters = await this.assetLibrary.getAssetsByType('model');
    return characters.slice(0, limit);
  }

  async searchCharacters(query: string, limit: number = 20) {
    const results = await this.assetLibrary.searchAssets(query, 'model');
    return results.slice(0, limit);
  }

  async getCharactersByStyle(style: string, limit: number = 20) {
    const characters = await this.assetLibrary.getAssetsByTag(style);
    return characters.slice(0, limit);
  }
}

let characterGenerationService: CharacterGenerationService | null = null;

export const initializeCharacterGeneration = (
  supabaseUrl: string,
  supabaseKey: string
): CharacterGenerationService => {
  if (!characterGenerationService) {
    characterGenerationService = new CharacterGenerationService(supabaseUrl, supabaseKey);
  }
  return characterGenerationService;
};

export const getCharacterGenerationService = (): CharacterGenerationService => {
  if (!characterGenerationService) {
    throw new Error('CharacterGenerationService not initialized');
  }
  return characterGenerationService;
};
