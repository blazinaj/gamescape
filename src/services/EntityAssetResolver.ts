import { supabase } from '../lib/supabase';
import { getGLBModelLoader } from './GLBModelLoader';
import * as THREE from 'three';

export interface AssetMatch {
  found: boolean;
  glbUrl?: string;
  assetId?: string;
  animations?: Record<string, string>;
}

const ENEMY_TAG_MAP: Record<string, string[]> = {
  goblin: ['goblin'],
  skeleton: ['skeleton'],
  wolf: ['wolf', 'creature'],
  spider: ['spider', 'creature'],
  orc: ['orc', 'creature'],
  troll: ['troll', 'creature'],
  dragon: ['dragon'],
  boss: ['boss', 'dragon'],
};

const NPC_TAG_MAP: Record<string, string[]> = {
  'world guide': ['wizard', 'mage'],
  guide: ['wizard', 'mage'],
  sage: ['wizard', 'mage'],
  wizard: ['wizard', 'mage'],
  mage: ['wizard', 'mage'],
  blacksmith: ['blacksmith'],
  merchant: ['merchant', 'human'],
  archer: ['archer', 'ranger'],
  ranger: ['archer', 'ranger'],
  guard: ['skeleton', 'warrior'],
  warrior: ['warrior'],
  villager: ['human', 'character'],
  innkeeper: ['human', 'character'],
  healer: ['wizard', 'mage'],
  farmer: ['human', 'character'],
};

const cache = new Map<string, AssetMatch>();
const NOT_FOUND: AssetMatch = { found: false };

async function queryAssetByTag(tag: string): Promise<AssetMatch> {
  const cacheKey = `tag:${tag}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const { data: assets, error } = await supabase
      .from('asset_library')
      .select('*')
      .eq('asset_type', 'model')
      .eq('status', 'completed')
      .contains('tags', [tag])
      .order('usage_count', { ascending: false })
      .limit(5);

    if (error || !assets || assets.length === 0) {
      cache.set(cacheKey, NOT_FOUND);
      return NOT_FOUND;
    }

    const asset = assets[Math.floor(Math.random() * assets.length)];

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
    return NOT_FOUND;
  }
}

export async function findEnemyAsset(enemyType: string): Promise<AssetMatch> {
  const cacheKey = `enemy:${enemyType}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const tagsToTry = ENEMY_TAG_MAP[enemyType.toLowerCase()] || [enemyType.toLowerCase()];

  for (const tag of tagsToTry) {
    const result = await queryAssetByTag(tag);
    if (result.found) {
      cache.set(cacheKey, result);
      return result;
    }
  }

  const fallback = await queryAssetByTag('enemy');
  cache.set(cacheKey, fallback);
  return fallback;
}

export async function findNPCAsset(occupation: string, name?: string): Promise<AssetMatch> {
  const key = (occupation || 'villager').toLowerCase();
  const cacheKey = `npc:${key}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const tagsToTry = NPC_TAG_MAP[key] || [];

  if (name) {
    const nameKey = name.toLowerCase();
    const nameMap = NPC_TAG_MAP[nameKey];
    if (nameMap) tagsToTry.push(...nameMap);
  }

  tagsToTry.push('character');

  for (const tag of tagsToTry) {
    const result = await queryAssetByTag(tag);
    if (result.found) {
      cache.set(cacheKey, result);
      return result;
    }
  }

  cache.set(cacheKey, NOT_FOUND);
  return NOT_FOUND;
}

export async function findMapObjectAsset(objectType: string): Promise<AssetMatch> {
  const cacheKey = `map:${objectType}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const result = await queryAssetByTag(objectType);
  cache.set(cacheKey, result);
  return result;
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

export function clearEntityAssetCache(): void {
  cache.clear();
}
