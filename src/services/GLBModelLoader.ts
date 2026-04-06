import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const PROXY_HOSTS = ['assets.meshy.ai', 'api.meshy.ai'];
const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/model-proxy`;

export function proxyModelUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (PROXY_HOSTS.includes(parsed.hostname)) {
      return `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
    }
  } catch { /* not a valid URL */ }
  return url;
}

interface CachedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  loadedAt: number;
}

export class GLBModelLoader {
  private loader: GLTFLoader;
  private cache: Map<string, CachedModel> = new Map();
  private loading: Map<string, Promise<GLTF>> = new Map();
  private maxCacheSize = 50;

  constructor() {
    this.loader = new GLTFLoader();
  }

  async load(url: string): Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }> {
    const cached = this.cache.get(url);
    if (cached) {
      return {
        scene: cached.scene.clone(),
        animations: cached.animations,
      };
    }

    if (this.loading.has(url)) {
      const gltf = await this.loading.get(url)!;
      return {
        scene: gltf.scene.clone(),
        animations: gltf.animations,
      };
    }

    const fetchUrl = proxyModelUrl(url);

    const loadPromise = new Promise<GLTF>((resolve, reject) => {
      this.loader.load(
        fetchUrl,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });

    this.loading.set(url, loadPromise);

    try {
      const gltf = await loadPromise;

      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.cache.set(url, {
        scene: gltf.scene,
        animations: gltf.animations,
        loadedAt: Date.now(),
      });

      this.evictIfNeeded();

      return {
        scene: gltf.scene.clone(),
        animations: gltf.animations,
      };
    } finally {
      this.loading.delete(url);
    }
  }

  clone(url: string): THREE.Group | null {
    const cached = this.cache.get(url);
    if (!cached) return null;
    return cached.scene.clone();
  }

  isLoaded(url: string): boolean {
    return this.cache.has(url);
  }

  isLoading(url: string): boolean {
    return this.loading.has(url);
  }

  async preload(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.load(url).catch(() => null));
    await Promise.all(promises);
  }

  private evictIfNeeded(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].loadedAt - b[1].loadedAt);

    const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
    toRemove.forEach(([key, cached]) => {
      this.disposeModel(cached.scene);
      this.cache.delete(key);
    });
  }

  private disposeModel(group: THREE.Group): void {
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
  }

  dispose(): void {
    this.cache.forEach((cached) => {
      this.disposeModel(cached.scene);
    });
    this.cache.clear();
    this.loading.clear();
  }
}

let instance: GLBModelLoader | null = null;

export const getGLBModelLoader = (): GLBModelLoader => {
  if (!instance) {
    instance = new GLBModelLoader();
  }
  return instance;
};
