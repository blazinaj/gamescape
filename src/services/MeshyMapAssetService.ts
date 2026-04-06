import * as THREE from 'three';
import { supabase } from '../lib/supabase';
import { getGLBModelLoader } from './GLBModelLoader';
import { Asset } from './AssetLibraryService';

interface ObjectTypePrompt {
  prompt: string;
  tags: string[];
  artStyle: string;
}

const OBJECT_PROMPTS: Record<string, ObjectTypePrompt> = {
  tree: {
    prompt: 'A stylized game-ready tree with detailed bark trunk and lush green leaf canopy, low-poly optimized',
    tags: ['tree', 'vegetation', 'environment'],
    artStyle: 'stylized',
  },
  rock: {
    prompt: 'A natural rock formation, rough textured stone boulder, game-ready low-poly',
    tags: ['rock', 'terrain', 'environment'],
    artStyle: 'stylized',
  },
  building: {
    prompt: 'A small medieval fantasy building with wooden frame and stone walls, game-ready',
    tags: ['building', 'structure', 'environment'],
    artStyle: 'stylized',
  },
  chest: {
    prompt: 'A treasure chest with iron straps and lock, wooden with metal details, game-ready',
    tags: ['chest', 'interactive', 'item'],
    artStyle: 'stylized',
  },
  ruins: {
    prompt: 'Ancient stone ruins, crumbling pillars and broken walls, game-ready',
    tags: ['ruins', 'structure', 'environment'],
    artStyle: 'stylized',
  },
  bush: {
    prompt: 'A green leafy bush, garden shrub, game-ready low-poly',
    tags: ['bush', 'vegetation', 'environment'],
    artStyle: 'stylized',
  },
  mushroom: {
    prompt: 'A fantasy mushroom with red cap and white spots, game-ready',
    tags: ['mushroom', 'vegetation', 'fantasy'],
    artStyle: 'cartoon',
  },
  crystal: {
    prompt: 'A glowing magical crystal cluster, translucent purple gemstone, game-ready',
    tags: ['crystal', 'magical', 'item'],
    artStyle: 'stylized',
  },
  well: {
    prompt: 'A medieval stone well with wooden roof and bucket, game-ready',
    tags: ['well', 'structure', 'interactive'],
    artStyle: 'stylized',
  },
  campfire: {
    prompt: 'A campfire with stone ring and burning logs, game-ready',
    tags: ['campfire', 'interactive', 'environment'],
    artStyle: 'stylized',
  },
  statue: {
    prompt: 'An ancient stone statue of a warrior on a pedestal, weathered, game-ready',
    tags: ['statue', 'decoration', 'environment'],
    artStyle: 'realistic',
  },
  fence: {
    prompt: 'A wooden picket fence section, rustic farm style, game-ready',
    tags: ['fence', 'structure', 'environment'],
    artStyle: 'stylized',
  },
  cart: {
    prompt: 'A medieval wooden cart with wheels, market wagon, game-ready',
    tags: ['cart', 'vehicle', 'environment'],
    artStyle: 'stylized',
  },
  log: {
    prompt: 'A fallen tree log, cut lumber on the ground, game-ready',
    tags: ['log', 'resource', 'environment'],
    artStyle: 'stylized',
  },
  crate: {
    prompt: 'A wooden storage crate with metal reinforcements, game-ready',
    tags: ['crate', 'interactive', 'item'],
    artStyle: 'stylized',
  },
};

interface AssetLookupResult {
  found: boolean;
  glbUrl?: string;
  assetId?: string;
}

export class MeshyMapAssetService {
  private assetCache: Map<string, AssetLookupResult> = new Map();
  private pendingGenerations: Set<string> = new Set();
  private loadedModels: Map<string, THREE.Group> = new Map();
  private pendingSwaps: Map<string, { placeholder: THREE.Object3D; parent: THREE.Group }[]> = new Map();

  async findAssetForObjectType(objectType: string, theme?: string): Promise<AssetLookupResult> {
    const cacheKey = `${objectType}:${theme || 'default'}`;
    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey)!;
    }

    try {
      const tags = [objectType, 'environment'];
      const { data: assets, error } = await supabase
        .from('asset_library')
        .select('*')
        .eq('asset_type', 'model')
        .eq('status', 'completed')
        .contains('tags', [objectType])
        .order('usage_count', { ascending: false })
        .limit(1);

      if (error || !assets || assets.length === 0) {
        const result: AssetLookupResult = { found: false };
        this.assetCache.set(cacheKey, result);
        return result;
      }

      const asset = assets[0];
      const result: AssetLookupResult = {
        found: true,
        glbUrl: asset.file_url || undefined,
        assetId: asset.id,
      };
      this.assetCache.set(cacheKey, result);
      return result;
    } catch (e) {
      console.warn(`Asset lookup failed for ${objectType}:`, e);
      return { found: false };
    }
  }

  async requestAssetGeneration(objectType: string, theme?: string): Promise<void> {
    const generationKey = `${objectType}:${theme || 'default'}`;
    if (this.pendingGenerations.has(generationKey)) return;

    const promptConfig = OBJECT_PROMPTS[objectType];
    if (!promptConfig) return;

    this.pendingGenerations.add(generationKey);

    try {
      const themePrefix = theme ? `${theme} themed ` : '';
      const prompt = `${themePrefix}${promptConfig.prompt}`;
      const tags = [...promptConfig.tags, theme || 'default', 'map-object'];

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meshy-asset-generator`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-model',
          prompt,
          art_style: promptConfig.artStyle,
          asset_category: 'environment',
          name: `${objectType} (${theme || 'default'})`,
          description: `Map object: ${objectType} for ${theme || 'default'} theme`,
          tags,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Queued Meshy generation for ${objectType}: ${data.meshy_request_id}`);
      }
    } catch (e) {
      console.warn(`Failed to request generation for ${objectType}:`, e);
    }
  }

  async loadGLBModel(
    glbUrl: string,
    objectType: string,
    position: THREE.Vector3,
    scale: THREE.Vector3,
    rotation: THREE.Euler
  ): Promise<THREE.Group | null> {
    try {
      const loader = getGLBModelLoader();
      const { scene } = await loader.load(glbUrl);

      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      const targetSizes: Record<string, number> = {
        tree: 4.0, rock: 1.0, building: 3.0, chest: 0.6,
        ruins: 2.0, bush: 1.0, mushroom: 0.4, crystal: 1.5,
        well: 2.0, campfire: 0.8, statue: 2.0, fence: 1.0,
        cart: 1.2, log: 2.0, crate: 0.6,
      };

      const targetSize = targetSizes[objectType] || 1.0;
      const normalizeScale = targetSize / maxDim;

      scene.scale.set(
        normalizeScale * scale.x,
        normalizeScale * scale.y,
        normalizeScale * scale.z
      );

      const center = box.getCenter(new THREE.Vector3());
      scene.position.set(
        position.x - center.x * normalizeScale * scale.x,
        position.y,
        position.z - center.z * normalizeScale * scale.z
      );
      scene.rotation.copy(rotation);

      return scene;
    } catch (e) {
      console.warn(`Failed to load GLB for ${objectType}:`, e);
      return null;
    }
  }

  registerPlaceholderForSwap(
    objectType: string,
    placeholder: THREE.Object3D,
    parent: THREE.Group
  ): void {
    if (!this.pendingSwaps.has(objectType)) {
      this.pendingSwaps.set(objectType, []);
    }
    this.pendingSwaps.get(objectType)!.push({ placeholder, parent });
  }

  async swapPlaceholdersForType(objectType: string, glbUrl: string): Promise<number> {
    const swaps = this.pendingSwaps.get(objectType);
    if (!swaps || swaps.length === 0) return 0;

    let swapped = 0;
    const loader = getGLBModelLoader();

    try {
      await loader.load(glbUrl);
    } catch {
      return 0;
    }

    for (const { placeholder, parent } of swaps) {
      try {
        const clone = loader.clone(glbUrl);
        if (!clone) continue;

        clone.position.copy(placeholder.position);
        clone.rotation.copy(placeholder.rotation);
        clone.scale.copy(placeholder.scale);

        parent.remove(placeholder);
        parent.add(clone);
        swapped++;
      } catch {
        continue;
      }
    }

    this.pendingSwaps.delete(objectType);
    return swapped;
  }

  clearCache(): void {
    this.assetCache.clear();
    this.pendingGenerations.clear();
    this.pendingSwaps.clear();
  }
}

let instance: MeshyMapAssetService | null = null;

export const getMeshyMapAssetService = (): MeshyMapAssetService => {
  if (!instance) {
    instance = new MeshyMapAssetService();
  }
  return instance;
};
