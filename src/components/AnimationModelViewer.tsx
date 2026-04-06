import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface AnimationModelViewerProps {
  modelUrl: string;
  animationUrls?: Record<string, string>;
  riggedModelUrl?: string;
  className?: string;
}

interface LoadedAnimation {
  name: string;
  clip: THREE.AnimationClip;
  sourceUrl: string;
}

export const AnimationModelViewer: React.FC<AnimationModelViewerProps> = ({
  modelUrl,
  animationUrls = {},
  riggedModelUrl,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const frameRef = useRef<number>(0);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animations, setAnimations] = useState<LoadedAnimation[]>([]);
  const [activeAnim, setActiveAnim] = useState<number>(-1);
  const [playing, setPlaying] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1e2e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);
    camera.position.set(0, 1.2, 3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.8, 0);
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 5, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8ecae6, 0.4);
    fillLight.position.set(-3, 2, -1);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd166, 0.3);
    rimLight.position.set(0, 2, -4);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(6, 12, 0x2a2e3e, 0x2a2e3e);
    scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(6, 6);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    return { scene, camera, renderer, controls };
  }, []);

  const fitCameraToModel = useCallback((model: THREE.Group) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.2;

    controlsRef.current.target.copy(center);
    cameraRef.current.position.set(
      center.x + distance * 0.6,
      center.y + maxDim * 0.4,
      center.z + distance * 0.8
    );
    controlsRef.current.update();
  }, []);

  const playAnimation = useCallback((index: number) => {
    if (!mixerRef.current || !modelRef.current) return;

    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.3);
    }

    if (index < 0 || index >= animations.length) {
      currentActionRef.current = null;
      setActiveAnim(-1);
      return;
    }

    const anim = animations[index];
    const action = mixerRef.current.clipAction(anim.clip);
    action.reset();
    action.fadeIn(0.3);
    action.play();
    currentActionRef.current = action;
    setActiveAnim(index);
    setPlaying(true);
  }, [animations]);

  useEffect(() => {
    const result = initScene();
    if (!result) return;

    const { scene, renderer, controls } = result;
    const loader = new GLTFLoader();
    const allAnimations: LoadedAnimation[] = [];

    const loadModel = async () => {
      setLoading(true);
      setError(null);

      try {
        const primaryUrl = riggedModelUrl || modelUrl;

        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(primaryUrl, resolve, undefined, reject);
        });

        const model = gltf.scene;
        model.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        modelRef.current = model;
        fitCameraToModel(model);

        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;

        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach((clip: THREE.AnimationClip) => {
            allAnimations.push({
              name: clip.name || `clip_${allAnimations.length}`,
              clip,
              sourceUrl: primaryUrl,
            });
          });
        }

        const animEntries = Object.entries(animationUrls).filter(
          ([, url]) => url && url !== primaryUrl
        );

        for (const [name, url] of animEntries) {
          try {
            const animGltf = await new Promise<any>((resolve, reject) => {
              loader.load(url, resolve, undefined, reject);
            });

            if (animGltf.animations && animGltf.animations.length > 0) {
              animGltf.animations.forEach((clip: THREE.AnimationClip) => {
                allAnimations.push({
                  name,
                  clip,
                  sourceUrl: url,
                });
              });
            }
          } catch (err) {
            console.warn(`Failed to load animation "${name}":`, err);
          }
        }

        setAnimations(allAnimations);

        if (allAnimations.length > 0) {
          const idleIdx = allAnimations.findIndex(a =>
            a.name.toLowerCase().includes('idle')
          );
          const startIdx = idleIdx >= 0 ? idleIdx : 0;
          const action = mixer.clipAction(allAnimations[startIdx].clip);
          action.play();
          currentActionRef.current = action;
          setActiveAnim(startIdx);
        }

        setLoading(false);
      } catch (err) {
        console.error('Model load error:', err);
        setError('Failed to load 3D model');
        setLoading(false);
      }
    };

    loadModel();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();

      if (mixerRef.current && playing) {
        mixerRef.current.update(delta);
      }

      controls.update();
      renderer.render(scene, cameraRef.current!);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (modelRef.current) {
        scene.remove(modelRef.current);
      }
      mixerRef.current = null;
      modelRef.current = null;
      currentActionRef.current = null;
    };
  }, [modelUrl, riggedModelUrl, JSON.stringify(animationUrls)]);

  useEffect(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    cameraRef.current.aspect = w / h;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(w, h);
  }, [expanded]);

  const togglePlayback = () => {
    setPlaying(prev => !prev);
  };

  const cycleAnimation = (direction: number) => {
    if (animations.length === 0) return;
    const next = ((activeAnim + direction) % animations.length + animations.length) % animations.length;
    playAnimation(next);
  };

  const resetCamera = () => {
    if (modelRef.current) {
      fitCameraToModel(modelRef.current);
    }
  };

  const containerClass = expanded
    ? 'fixed inset-4 z-[60] rounded-2xl overflow-hidden'
    : `relative ${className}`;

  return (
    <div className={containerClass}>
      {expanded && (
        <div className="fixed inset-0 z-[-1] bg-black/70 backdrop-blur-sm" onClick={() => setExpanded(false)} />
      )}

      <div
        ref={containerRef}
        className="w-full h-full bg-[#1a1e2e] rounded-xl overflow-hidden"
        style={{ minHeight: expanded ? '100%' : '280px' }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1e2e]/90 rounded-xl z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            <span className="text-sm text-slate-400">Loading model...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1e2e]/90 rounded-xl z-10">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/50 rounded-xl p-2.5 flex items-center gap-2">
            <button
              onClick={() => cycleAnimation(-1)}
              disabled={animations.length <= 1}
              className="p-1.5 text-slate-400 hover:text-white disabled:text-slate-600 transition-colors rounded-lg hover:bg-slate-700/50"
              title="Previous animation"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayback}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => cycleAnimation(1)}
              disabled={animations.length <= 1}
              className="p-1.5 text-slate-400 hover:text-white disabled:text-slate-600 transition-colors rounded-lg hover:bg-slate-700/50"
              title="Next animation"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0 px-1">
              {animations.length > 0 ? (
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {animations.map((anim, idx) => (
                    <button
                      key={`${anim.name}-${idx}`}
                      onClick={() => playAnimation(idx)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all flex-shrink-0 ${
                        idx === activeAnim
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                      }`}
                    >
                      {anim.name}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 px-1">No animations</span>
              )}
            </div>

            <button
              onClick={resetCamera}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
              title="Reset camera"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setExpanded(prev => !prev)}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
              title={expanded ? 'Minimize' : 'Fullscreen'}
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
