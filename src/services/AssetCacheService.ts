import { supabase } from '../lib/supabase';

export class AssetCacheService {
  private localCache: Map<string, any> = new Map();

  private hashPrompt(prompt: string, artStyle: string): string {
    const combined = `${prompt}::${artStyle}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
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
    const localKey = `${promptHash}:${artStyle}`;

    if (this.localCache.has(localKey)) {
      return this.localCache.get(localKey);
    }

    try {
      const { data: assets, error } = await supabase
        .from('asset_library')
        .select('*')
        .eq('asset_type', 'model')
        .eq('status', 'completed')
        .contains('tags', [artStyle])
        .order('usage_count', { ascending: false });

      if (error || !assets) return null;

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
        this.localCache.set(localKey, bestMatch);
        await this.updateAssetUsage(bestMatch.id);
        return bestMatch;
      }
    } catch (e) {
      console.warn('Cache lookup error:', e);
    }

    return null;
  }

  async findByTags(tags: string[], assetType: string = 'model'): Promise<any[]> {
    try {
      const { data: assets, error } = await supabase
        .from('asset_library')
        .select('*')
        .eq('asset_type', assetType)
        .eq('status', 'completed')
        .contains('tags', tags)
        .order('usage_count', { ascending: false });

      if (error) return [];
      return assets || [];
    } catch {
      return [];
    }
  }

  async updateAssetUsage(assetId: string): Promise<void> {
    try {
      const { data: asset } = await supabase
        .from('asset_library')
        .select('usage_count')
        .eq('id', assetId)
        .maybeSingle();

      if (asset) {
        await supabase
          .from('asset_library')
          .update({
            usage_count: (asset.usage_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', assetId);
      }
    } catch (e) {
      console.warn('Error updating asset usage:', e);
    }
  }

  async getMostUsedAssets(assetType: string = 'model', limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('asset_library')
        .select('*')
        .eq('asset_type', assetType)
        .eq('status', 'completed')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }

  async getRecentAssets(assetType: string = 'model', limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('asset_library')
        .select('*')
        .eq('asset_type', assetType)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }

  clearLocalCache(): void {
    this.localCache.clear();
  }
}

let instance: AssetCacheService | null = null;

export const getAssetCacheService = (): AssetCacheService => {
  if (!instance) {
    instance = new AssetCacheService();
  }
  return instance;
};
