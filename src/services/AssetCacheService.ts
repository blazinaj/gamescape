import { createClient } from 'npm:@supabase/supabase-js@^2.101.1';

export interface CacheEntry {
  id: string;
  prompt_hash: string;
  asset_id: string;
  art_style: string;
  similarity_score: number;
  last_accessed: string;
}

export class AssetCacheService {
  private supabase: ReturnType<typeof createClient>;
  private localCache: Map<string, any> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  private hashPrompt(prompt: string, artStyle: string): string {
    const combined = `${prompt}::${artStyle}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private calculateSimilarity(prompt1: string, prompt2: string): number {
    const words1 = new Set(prompt1.toLowerCase().split(/\s+/));
    const words2 = new Set(prompt2.toLowerCase().split(/\s+/));

    let matches = 0;
    words1.forEach(word => {
      if (words2.has(word)) matches++;
    });

    const totalWords = Math.max(words1.size, words2.size);
    return totalWords > 0 ? matches / totalWords : 0;
  }

  async findCachedAsset(
    prompt: string,
    artStyle: string,
    similarityThreshold: number = 0.7
  ): Promise<any | null> {
    const promptHash = this.hashPrompt(prompt, artStyle);

    // Check local cache first
    const localKey = `${promptHash}:${artStyle}`;
    if (this.localCache.has(localKey)) {
      return this.localCache.get(localKey);
    }

    // Query database for similar assets
    const { data: assets, error } = await this.supabase
      .from('asset_library')
      .select('*')
      .eq('asset_type', 'model')
      .eq('status', 'completed')
      .contains('tags', [artStyle])
      .order('usage_count', { ascending: false });

    if (error || !assets) {
      console.error('Cache lookup error:', error);
      return null;
    }

    // Find the best match by similarity
    let bestMatch: any = null;
    let bestSimilarity = 0;

    assets.forEach(asset => {
      const similarity = this.calculateSimilarity(prompt, asset.prompt);
      if (similarity > bestSimilarity && similarity >= similarityThreshold) {
        bestMatch = asset;
        bestSimilarity = similarity;
      }
    });

    if (bestMatch) {
      // Cache the result locally
      this.localCache.set(localKey, bestMatch);

      // Update usage count
      await this.updateAssetUsage(bestMatch.id);

      return bestMatch;
    }

    return null;
  }

  async findByTags(tags: string[], assetType: string = 'model'): Promise<any[]> {
    const { data: assets, error } = await this.supabase
      .from('asset_library')
      .select('*')
      .eq('asset_type', assetType)
      .eq('status', 'completed')
      .contains('tags', tags)
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Tag search error:', error);
      return [];
    }

    return assets || [];
  }

  async updateAssetUsage(assetId: string): Promise<void> {
    try {
      const { data: asset } = await this.supabase
        .from('asset_library')
        .select('usage_count')
        .eq('id', assetId)
        .single();

      if (asset) {
        await this.supabase
          .from('asset_library')
          .update({
            usage_count: (asset.usage_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', assetId);
      }
    } catch (error) {
      console.error('Error updating asset usage:', error);
    }
  }

  async getMostUsedAssets(assetType: string = 'model', limit: number = 10): Promise<any[]> {
    const { data: assets, error } = await this.supabase
      .from('asset_library')
      .select('*')
      .eq('asset_type', assetType)
      .eq('status', 'completed')
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular assets:', error);
      return [];
    }

    return assets || [];
  }

  async getRecentAssets(assetType: string = 'model', limit: number = 10): Promise<any[]> {
    const { data: assets, error } = await this.supabase
      .from('asset_library')
      .select('*')
      .eq('asset_type', assetType)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent assets:', error);
      return [];
    }

    return assets || [];
  }

  clearLocalCache(): void {
    this.localCache.clear();
  }

  async getAssetStatistics(): Promise<{
    totalAssets: number;
    totalGenerations: number;
    completedAssets: number;
    failedAssets: number;
  }> {
    try {
      const { count: totalAssets } = await this.supabase
        .from('asset_library')
        .select('*', { count: 'exact', head: true });

      const { count: completedAssets } = await this.supabase
        .from('asset_library')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: failedAssets } = await this.supabase
        .from('asset_library')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      const { count: totalGenerations } = await this.supabase
        .from('asset_generations')
        .select('*', { count: 'exact', head: true });

      return {
        totalAssets: totalAssets || 0,
        totalGenerations: totalGenerations || 0,
        completedAssets: completedAssets || 0,
        failedAssets: failedAssets || 0,
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        totalAssets: 0,
        totalGenerations: 0,
        completedAssets: 0,
        failedAssets: 0,
      };
    }
  }
}

let assetCacheService: AssetCacheService | null = null;

export const initializeAssetCache = (
  supabaseUrl: string,
  supabaseKey: string
): AssetCacheService => {
  if (!assetCacheService) {
    assetCacheService = new AssetCacheService(supabaseUrl, supabaseKey);
  }
  return assetCacheService;
};

export const getAssetCacheService = (): AssetCacheService => {
  if (!assetCacheService) {
    throw new Error('AssetCacheService not initialized');
  }
  return assetCacheService;
};
