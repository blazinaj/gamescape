import { createClient } from 'npm:@supabase/supabase-js@^2.101.1';

export interface Asset {
  id: string;
  asset_type: 'model' | 'animation' | 'texture';
  content_type: string;
  name: string;
  description: string | null;
  prompt: string;
  generated_by_user_id: string | null;
  meshy_request_id: string;
  status: 'pending' | 'completed' | 'failed';
  metadata: Record<string, any>;
  file_url: string | null;
  preview_url: string | null;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AssetGeneration {
  id: string;
  asset_id: string | null;
  user_id: string;
  prompt: string;
  meshy_request_id: string;
  status: 'pending' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export class AssetLibraryService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  async createAsset(
    assetType: 'model' | 'animation' | 'texture',
    name: string,
    prompt: string,
    meshyRequestId: string,
    userId?: string,
    description?: string
  ): Promise<Asset> {
    const { data, error } = await this.supabase
      .from('asset_library')
      .insert([
        {
          asset_type: assetType,
          content_type: assetType === 'model' ? 'gltf' : assetType,
          name,
          description: description || null,
          prompt,
          meshy_request_id: meshyRequestId,
          generated_by_user_id: userId || null,
          status: 'pending',
          tags: [],
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAssetStatus(
    assetId: string,
    status: 'completed' | 'failed',
    fileUrl?: string,
    previewUrl?: string,
    metadata?: Record<string, any>,
    error?: string
  ): Promise<Asset> {
    const { data, error: updateError } = await this.supabase
      .from('asset_library')
      .update({
        status,
        file_url: fileUrl || null,
        preview_url: previewUrl || null,
        metadata: metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update generation log if there's an error
    if (error) {
      const generation = await this.supabase
        .from('asset_generations')
        .update({
          status: 'failed',
          error_message: error,
          completed_at: new Date().toISOString(),
        })
        .eq('asset_id', assetId);
    }

    return data;
  }

  async getAssetByMeshyRequestId(meshyRequestId: string): Promise<Asset | null> {
    const { data, error } = await this.supabase
      .from('asset_library')
      .select('*')
      .eq('meshy_request_id', meshyRequestId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getAssetsByType(assetType: 'model' | 'animation' | 'texture'): Promise<Asset[]> {
    const { data, error } = await this.supabase
      .from('asset_library')
      .select('*')
      .eq('asset_type', assetType)
      .eq('status', 'completed')
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async searchAssets(query: string, assetType?: string): Promise<Asset[]> {
    let qb = this.supabase
      .from('asset_library')
      .select('*')
      .eq('status', 'completed')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

    if (assetType) {
      qb = qb.eq('asset_type', assetType);
    }

    const { data, error } = await qb.order('usage_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAssetsByTag(tag: string): Promise<Asset[]> {
    const { data, error } = await this.supabase
      .from('asset_library')
      .select('*')
      .contains('tags', [tag])
      .eq('status', 'completed')
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async incrementAssetUsage(assetId: string): Promise<void> {
    await this.supabase.rpc('increment', {
      row_id: assetId,
      numeric_column: 'usage_count',
      increment_by: 1,
    });
  }

  async addTagsToAsset(assetId: string, tags: string[]): Promise<Asset> {
    const asset = await this.getAsset(assetId);
    if (!asset) throw new Error('Asset not found');

    const newTags = [...new Set([...asset.tags, ...tags])];

    const { data, error } = await this.supabase
      .from('asset_library')
      .update({ tags: newTags })
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAsset(assetId: string): Promise<Asset | null> {
    const { data, error } = await this.supabase
      .from('asset_library')
      .select('*')
      .eq('id', assetId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createGenerationLog(
    userId: string,
    prompt: string,
    meshyRequestId: string,
    assetId?: string
  ): Promise<AssetGeneration> {
    const { data, error } = await this.supabase
      .from('asset_generations')
      .insert([
        {
          user_id: userId,
          asset_id: assetId || null,
          prompt,
          meshy_request_id: meshyRequestId,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async completeGenerationLog(meshyRequestId: string): Promise<void> {
    const { error } = await this.supabase
      .from('asset_generations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('meshy_request_id', meshyRequestId);

    if (error) throw error;
  }

  async findSimilarAssets(
    assetType: 'model' | 'animation' | 'texture',
    tags: string[],
    limit: number = 5
  ): Promise<Asset[]> {
    const { data, error } = await this.supabase
      .from('asset_library')
      .select('*')
      .eq('asset_type', assetType)
      .eq('status', 'completed')
      .contains('tags', tags)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}
