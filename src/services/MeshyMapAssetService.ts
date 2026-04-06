import * as THREE from 'three';
import { getGLBModelLoader } from './GLBModelLoader';
import { findMapObjectAsset } from './EntityAssetResolver';

const TARGET_SIZES: Record<string, number> = {
  tree: 4.0, rock: 1.5, building: 3.0, chest: 0.6,
  ruins: 2.5, bush: 1.0, mushroom: 0.6, crystal: 1.5,
  well: 2.0, campfire: 0.8, statue: 2.5, fence: 1.0,
  cart: 1.5, log: 2.0, crate: 0.6, barrel: 0.8,
  bridge: 3.0, lantern: 2.0, gravestone: 1.2, gate: 4.0,
};

const ALL_OBJECT_TYPES = Object.keys(TARGET_SIZES);

interface PendingSwap {
  placeholder: THREE.Object3D;
  parent: THREE.Group;
  objectType: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
}

export class MeshyMapAssetService {
  private assetUrls: Map<string, string> = new Map();
  private loadedTypes: Set<string> = new Set();
  private loadingTypes: Set<string> = new Set();
  private pendingSwaps: PendingSwap[] = [];
  private preloaded = false;

  async preloadAllAssets(): Promise<void> {
    if (this.preloaded) return;
    this.preloaded = true;

    const promises = ALL_OBJECT_TYPES.map(type => this.resolveAndPreload(type));
    await Promise.allSettled(promises);
  }

  private async resolveAndPreload(objectType: string): Promise<void> {
    if (this.loadingTypes.has(objectType) || this.loadedTypes.has(objectType)) return;
    this.loadingTypes.add(objectType);

    try {
      const result = await findMapObjectAsset(objectType);
      if (!result.found || !result.glbUrl) {
        this.loadingTypes.delete(objectType);
        return;
      }

      this.assetUrls.set(objectType, result.glbUrl);
      const loader = getGLBModelLoader();
      await loader.load(result.glbUrl);
      this.loadedTypes.add(objectType);
      this.loadingTypes.delete(objectType);

      this.flushSwaps(objectType);
    } catch {
      this.loadingTypes.delete(objectType);
    }
  }

  isReady(objectType: string): boolean {
    return this.loadedTypes.has(objectType) && this.assetUrls.has(objectType);
  }

  getGLBUrl(objectType: string): string | undefined {
    return this.assetUrls.get(objectType);
  }

  cloneForObject(
    objectType: string,
    position: THREE.Vector3,
    scale: THREE.Vector3,
    rotation: THREE.Euler
  ): THREE.Object3D | null {
    const glbUrl = this.assetUrls.get(objectType);
    if (!glbUrl) return null;

    const loader = getGLBModelLoader();
    const clone = loader.clone(glbUrl);
    if (!clone) return null;

    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = TARGET_SIZES[objectType] || 1.0;
    const s = targetSize / (maxDim || 1);

    clone.scale.set(s * scale.x, s * scale.y, s * scale.z);
    clone.position.copy(position);
    clone.rotation.copy(rotation);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clone;
  }

  registerPendingSwap(
    placeholder: THREE.Object3D,
    parent: THREE.Group,
    objectType: string,
    position: THREE.Vector3,
    scale: THREE.Vector3,
    rotation: THREE.Euler
  ): void {
    this.pendingSwaps.push({ placeholder, parent, objectType, position, scale, rotation });

    if (!this.loadingTypes.has(objectType) && !this.loadedTypes.has(objectType)) {
      this.resolveAndPreload(objectType);
    }
  }

  private flushSwaps(objectType: string): void {
    const remaining: PendingSwap[] = [];

    for (const swap of this.pendingSwaps) {
      if (swap.objectType !== objectType) {
        remaining.push(swap);
        continue;
      }

      try {
        const glbMesh = this.cloneForObject(
          swap.objectType,
          swap.position,
          swap.scale,
          swap.rotation
        );
        if (glbMesh && swap.parent) {
          swap.parent.remove(swap.placeholder);
          swap.parent.add(glbMesh);
        } else {
          remaining.push(swap);
        }
      } catch {
        remaining.push(swap);
      }
    }

    this.pendingSwaps = remaining;
  }

  clearCache(): void {
    this.assetUrls.clear();
    this.loadedTypes.clear();
    this.loadingTypes.clear();
    this.pendingSwaps = [];
    this.preloaded = false;
  }
}

let instance: MeshyMapAssetService | null = null;

export const getMeshyMapAssetService = (): MeshyMapAssetService => {
  if (!instance) {
    instance = new MeshyMapAssetService();
  }
  return instance;
};
