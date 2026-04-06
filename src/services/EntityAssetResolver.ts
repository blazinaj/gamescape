import { supabase } from '../lib/supabase';
import { getGLBModelLoader } from './GLBModelLoader';
import * as THREE from 'three';

interface AssetMatch {
  found: boolean;
  glbUrl?: string;
  assetId?: string;
  animations?: Record<string, string>;
}

const cache = new Map<string, AssetMatch>();
const pending = new Set<string>();

export async function findEntityAsset(
  entityType: string,
  tags: string[]
): Promise<AssetMatch> {
  const cacheKey = `${entityType}:${tags.sort().join(',')}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const { data: assets, error } = await supabase
      .from('asset_library')
      .select('*')
      .eq('asset_type', 'model')
      .eq('status', 'completed')
      .contains('tags', [entityType])
      .order('usage_count', { ascending: false })
      .limit(1);

    if (error || !assets || assets.length === 0) {
      const result: AssetMatch = { found: false };
      cache.set(cacheKey, result);
      return result;
    }

    const asset = assets[0];
    const animations: Record<string, string> = {};
    if (asset.metadata?.animations) {
      for (const [name, data] of Object.entries(asset.metadata.animations as Record<string, any>)) {
        if (data?.glb_url) {
          animations[name] = data.glb_url;
        }
      }
    }

    const result: AssetMatch = {
      found: true,
      glbUrl: asset.file_url || undefined,
      assetId: asset.id,
      animations: Object.keys(animations).length > 0 ? animations : undefined,
    };
    cache.set(cacheKey, result);
    return result;
  } catch {
    return { found: false };
  }
}

export async function loadEntityGLB(
  glbUrl: string,
  targetHeight: number
): Promise<THREE.Group | null> {
  try {
    const loader = getGLBModelLoader();
    const { scene } = await loader.load(glbUrl);

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = targetHeight / (maxDim || 1);

    scene.scale.setScalar(scale);

    const scaledBox = new THREE.Box3().setFromObject(scene);
    scene.position.y = -scaledBox.min.y;

    return scene;
  } catch {
    return null;
  }
}

export function requestEntityGeneration(
  entityType: string,
  description: string,
  tags: string[]
): void {
  const key = `gen:${entityType}`;
  if (pending.has(key)) return;
  pending.add(key);

  const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meshy-asset-generator`;

  fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generate-model',
      prompt: description,
      art_style: 'stylized',
      asset_category: 'character',
      name: entityType,
      description,
      tags,
    }),
  }).catch(() => {});
}

export function clearEntityAssetCache(): void {
  cache.clear();
  pending.clear();
}
