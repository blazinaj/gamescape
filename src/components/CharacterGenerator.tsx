import React, { useState, useEffect } from 'react';
import { Wand2, Loader2, AlertCircle, CheckCircle, Sparkles, X, Download, Library, Bone, Play } from 'lucide-react';
import { useCharacterGeneration, GenerationPhase } from '../hooks/useCharacterGeneration';
import { AssetLibraryService, Asset } from '../services/AssetLibraryService';
import type { AnimationUrls } from '../services/CharacterAnimationService';

interface CharacterGeneratorProps {
  isVisible: boolean;
  onClose: () => void;
  onModelReady?: (glbUrl: string, animationUrls?: AnimationUrls) => void;
}

const PHASE_LABELS: Record<GenerationPhase, string> = {
  idle: '',
  generating: 'Generating 3D Model',
  model_complete: 'Model Ready',
  rigging: 'Rigging Skeleton',
  animating: 'Creating Animations',
  completed: 'All Animations Ready',
  failed: 'Error',
};

const PHASE_DESCRIPTIONS: Record<GenerationPhase, string> = {
  idle: '',
  generating: 'Building a 3D model from your description. This usually takes 2-5 minutes.',
  model_complete: 'Your 3D model is ready. You can apply it now, or rig it for animations.',
  rigging: 'Adding a skeleton to the model so it can move naturally.',
  animating: 'Generating walk, run, idle, attack, and death animations.',
  completed: 'Your character is fully animated and ready to play.',
  failed: 'Something went wrong. You can try again.',
};

export const CharacterGenerator: React.FC<CharacterGeneratorProps> = ({
  isVisible,
  onClose,
  onModelReady,
}) => {
  const [description, setDescription] = useState('');
  const [artStyle, setArtStyle] = useState<'realistic' | 'stylized' | 'cartoon' | 'anime'>('stylized');
  const [tab, setTab] = useState<'generate' | 'library'>('generate');
  const [libraryAssets, setLibraryAssets] = useState<Asset[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const {
    generating,
    character,
    error,
    progress,
    animationProgress,
    animationUrls,
    generateCharacter,
    triggerRigging,
    reset,
  } = useCharacterGeneration();

  useEffect(() => {
    if (isVisible && tab === 'library') {
      loadLibraryAssets();
    }
  }, [isVisible, tab]);

  const loadLibraryAssets = async () => {
    setLoadingLibrary(true);
    try {
      const service = new AssetLibraryService();
      const assets = await service.getAssetsByType('model');
      setLibraryAssets(assets.filter(a => a.tags?.includes('character')));
    } catch {
      setLibraryAssets([]);
    }
    setLoadingLibrary(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    await generateCharacter({ description: description.trim(), artStyle });
  };

  const handleApplyModel = (glbUrl: string, anims?: AnimationUrls) => {
    onModelReady?.(glbUrl, anims);
    onClose();
  };

  const handleRigAndAnimate = () => {
    if (character?.assetId) {
      triggerRigging(character.assetId);
    }
  };

  if (!isVisible) return null;

  const showForm = progress === 'idle' || progress === 'failed';
  const showProgress = progress === 'generating' || progress === 'rigging' || progress === 'animating';
  const showModelReady = progress === 'model_complete';
  const showCompleted = progress === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">AI Character Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setTab('generate')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'generate'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Wand2 className="w-4 h-4" />
              Generate New
            </div>
          </button>
          <button
            onClick={() => setTab('library')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'library'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Library className="w-4 h-4" />
              Asset Library
            </div>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {tab === 'generate' && (
            <>
              {showForm && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Character Description
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="A brave knight with glowing armor and a sword of legend, a wise wizard with mystical robes..."
                      className="w-full h-24 px-4 py-3 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none"
                      disabled={generating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Art Style
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['realistic', 'stylized', 'cartoon', 'anime'] as const).map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setArtStyle(style)}
                          disabled={generating}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize ${
                            artStyle === style
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={generating || !description.trim()}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Wand2 className="w-4 h-4" />
                    Generate Character Model
                  </button>
                </form>
              )}

              {showProgress && (
                <div className="space-y-4">
                  <PipelineProgress progress={progress} animationProgress={animationProgress} />

                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Prompt:</p>
                    <p className="text-white">{description}</p>
                    <p className="text-sm text-slate-500 mt-2">Style: {artStyle}</p>
                  </div>

                  <button
                    onClick={reset}
                    className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Cancel & Start Over
                  </button>
                </div>
              )}

              {showModelReady && character && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">3D Model Ready</p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Apply it as-is, or rig it with skeleton + animations.
                      </p>
                    </div>
                  </div>

                  {character.modelUrl && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApplyModel(character.modelUrl!)}
                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Apply Static Model
                      </button>
                      <button
                        onClick={handleRigAndAnimate}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <Bone className="w-4 h-4" />
                        Rig & Animate
                      </button>
                    </div>
                  )}

                  <button
                    onClick={reset}
                    className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Generate Another
                  </button>
                </div>
              )}

              {showCompleted && character && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <Play className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Animated Character Ready</p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {animationProgress
                          ? `${animationProgress.progress.completed}/${animationProgress.progress.total} animations generated.`
                          : 'Your character is fully rigged and animated.'}
                      </p>
                    </div>
                  </div>

                  {animationProgress && (
                    <AnimationList animations={animationProgress.animations} />
                  )}

                  {character.modelUrl && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApplyModel(character.modelUrl!, animationUrls || undefined)}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <Play className="w-4 h-4" />
                        Apply Animated Character
                      </button>
                    </div>
                  )}

                  <button
                    onClick={reset}
                    className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Generate Another
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mt-4">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Error</p>
                    <p className="text-sm text-slate-400 mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'library' && (
            <div className="space-y-3">
              {loadingLibrary ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="ml-3 text-slate-400">Loading asset library...</span>
                </div>
              ) : libraryAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Library className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No character models in the library yet.</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Generate your first character to start building the shared library.
                  </p>
                  <button
                    onClick={() => setTab('generate')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Generate a Character
                  </button>
                </div>
              ) : (
                libraryAssets.map(asset => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                  >
                    {asset.preview_url ? (
                      <img
                        src={asset.preview_url}
                        alt={asset.name}
                        className="w-16 h-16 rounded-lg object-cover bg-slate-700"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{asset.name}</p>
                      <p className="text-sm text-slate-400 truncate">{asset.prompt}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        {asset.tags?.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {asset.file_url && (
                      <button
                        onClick={() => handleApplyModel(asset.file_url!)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex-shrink-0"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PIPELINE_STEPS: { key: GenerationPhase; label: string; icon: React.ReactNode }[] = [
  { key: 'generating', label: 'Model', icon: <Wand2 className="w-3.5 h-3.5" /> },
  { key: 'rigging', label: 'Rigging', icon: <Bone className="w-3.5 h-3.5" /> },
  { key: 'animating', label: 'Animate', icon: <Play className="w-3.5 h-3.5" /> },
];

function PipelineProgress({
  progress,
  animationProgress,
}: {
  progress: GenerationPhase;
  animationProgress: ReturnType<typeof useCharacterGeneration>['animationProgress'];
}) {
  const stepOrder: GenerationPhase[] = ['generating', 'rigging', 'animating'];
  const currentIndex = stepOrder.indexOf(progress);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = step.key === progress;
          const isDone = currentIndex > i || progress === 'completed';

          return (
            <React.Fragment key={step.key}>
              {i > 0 && (
                <div className={`flex-1 h-0.5 ${isDone ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isActive
                    ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isDone ? <CheckCircle className="w-3.5 h-3.5" /> : step.icon}
                {step.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
        <div>
          <p className="font-semibold text-white">{PHASE_LABELS[progress]}</p>
          <p className="text-sm text-slate-400 mt-0.5">{PHASE_DESCRIPTIONS[progress]}</p>
          {animationProgress && progress === 'animating' && (
            <p className="text-sm text-blue-400 mt-1">
              {animationProgress.progress.completed}/{animationProgress.progress.total} animations done
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AnimationList({ animations }: { animations: Record<string, { status: string; glb_url?: string }> }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Object.entries(animations).map(([name, data]) => (
        <div
          key={name}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs ${
            data.status === 'SUCCEEDED'
              ? 'bg-emerald-500/10 text-emerald-400'
              : data.status === 'FAILED'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-slate-800 text-slate-500'
          }`}
        >
          {data.status === 'SUCCEEDED' ? (
            <CheckCircle className="w-4 h-4" />
          ) : data.status === 'FAILED' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          <span className="capitalize font-medium">{name}</span>
        </div>
      ))}
    </div>
  );
}
