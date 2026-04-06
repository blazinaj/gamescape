import { AssetLibraryService, Asset } from './AssetLibraryService';

export interface CharacterGenerationRequest {
  description: string;
  artStyle?: 'realistic' | 'stylized' | 'cartoon' | 'anime';
  userId?: string;
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

  constructor() {
    this.assetLibrary = new AssetLibraryService();
  }

  async generateCharacter(
    request: CharacterGenerationRequest
  ): Promise<GeneratedCharacter> {
    const { description, artStyle, userId } = request;

    const existingAsset = await this.findExistingCharacter(description, artStyle);
    if (existingAsset) {
      return {
        assetId: existingAsset.id,
        meshyRequestId: existingAsset.meshy_request_id,
        status: 'completed',
        modelUrl: existingAsset.file_url || undefined,
        previewUrl: existingAsset.preview_url || undefined,
      };
    }

    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meshy-asset-generator`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate-model',
        prompt: description,
        art_style: artStyle || 'realistic',
        asset_category: 'character',
        user_id: userId,
        name: `Character: ${description.substring(0, 50)}`,
        description: `AI-generated character: ${description}`,
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
  ): Promise<Asset | null> {
    try {
      const tags = [artStyle || 'realistic', 'character'];
      const similar = await this.assetLibrary.findSimilarAssets('model', tags, 1);
      if (similar.length > 0) {
        return similar[0];
      }

      const keywords = description.split(' ').filter(word => word.length > 3);
      for (const keyword of keywords.slice(0, 3)) {
        const results = await this.assetLibrary.searchAssets(keyword, 'model');
        if (results.length > 0) {
          return results[0];
        }
      }
    } catch (e) {
      console.warn('Error searching existing characters:', e);
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

  async listAvailableCharacters(limit: number = 20): Promise<Asset[]> {
    const characters = await this.assetLibrary.getAssetsByType('model');
    return characters
      .filter(a => a.tags?.includes('character'))
      .slice(0, limit);
  }
}

let instance: CharacterGenerationService | null = null;

export const getCharacterGenerationService = (): CharacterGenerationService => {
  if (!instance) {
    instance = new CharacterGenerationService();
  }
  return instance;
};
