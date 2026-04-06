import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Loader2, Wand2, Library, CheckCircle,
  AlertCircle, Bone, Play, Shield, Sword, Crosshair, Flame, Skull as SkullIcon, Crown,
} from 'lucide-react';
import { CharacterCustomization, DEFAULT_CUSTOMIZATION } from '../types/CharacterTypes';
import { useCharacterGeneration, GenerationPhase } from '../hooks/useCharacterGeneration';
import { AssetLibraryService, Asset } from '../services/AssetLibraryService';
import { GameScenario } from './ScenarioSelector';
import type { AnimationProgress } from '../services/CharacterAnimationService';

interface CharacterCreationStepProps {
  scenario: GameScenario;
  onBack: () => void;
  onStart: (customization: CharacterCustomization) => void;
}

interface CharacterPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tags: string[];
}

const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'knight',
    name: 'Knight',
    description: 'Heavy armor, sword & shield',
    prompt: 'A medieval knight warrior in full plate armor, standing in a heroic pose with a longsword and shield, detailed steel armor with engravings',
    icon: Shield,
    color: 'from-slate-500 to-slate-600',
    tags: ['character', 'knight', 'warrior', 'medieval', 'human'],
  },
  {
    id: 'archer',
    name: 'Ranger',
    description: 'Leather armor, longbow',
    prompt: 'A female elven ranger archer with a longbow, wearing leather armor and a forest green cloak, pointed ears, quiver of arrows on back',
    icon: Crosshair,
    color: 'from-emerald-600 to-green-700',
    tags: ['character', 'archer', 'ranger', 'elf'],
  },
  {
    id: 'wizard',
    name: 'Wizard',
    description: 'Mystical robes, magic staff',
    prompt: 'A mysterious wizard mage in dark robes holding a glowing magical staff, long beard, pointy hat, arcane runes on robe',
    icon: Wand2,
    color: 'from-cyan-600 to-teal-700',
    tags: ['character', 'wizard', 'mage', 'magic', 'human'],
  },
  {
    id: 'warrior',
    name: 'Berserker',
    description: 'Fur armor, dual axes',
    prompt: 'A muscular berserker warrior with dual battle axes, wearing fur-lined leather armor, war paint on face, wild hair, intimidating pose',
    icon: Sword,
    color: 'from-red-600 to-red-800',
    tags: ['character', 'warrior', 'berserker', 'human'],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'Dark cloak, twin daggers',
    prompt: 'A stealthy rogue assassin in dark leather armor and hooded cloak, twin daggers at the belt, mysterious expression, agile build',
    icon: SkullIcon,
    color: 'from-stone-600 to-stone-800',
    tags: ['character', 'rogue', 'assassin', 'human'],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy armor, warhammer',
    prompt: 'A noble paladin in gleaming white and gold plate armor, carrying a massive warhammer, glowing holy aura, righteous pose',
    icon: Crown,
    color: 'from-amber-500 to-amber-700',
    tags: ['character', 'paladin', 'knight', 'holy', 'human'],
  },
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    description: 'Scaled warrior, fire breath',
    prompt: 'A dragonborn warrior with scales and horns, wearing tribal armor with dragon motifs, glowing eyes, powerful and imposing build',
    icon: Flame,
    color: 'from-orange-600 to-red-700',
    tags: ['character', 'dragonborn', 'creature', 'warrior'],
  },
];

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
  model_complete: 'Your 3D model is ready. You can enter the world now or rig it for animations.',
  rigging: 'Adding a skeleton to the model so it can move naturally.',
  animating: 'Generating walk, run, idle, attack, and death animations.',
  completed: 'Your character is fully animated and ready to play.',
  failed: 'Something went wrong. You can try again.',
};

export const CharacterCreationStep: React.FC<CharacterCreationStepProps> = ({
  scenario,
  onBack,
  onStart,
}) => {
  const [characterName, setCharacterName] = useState('');
  const [tab, setTab] = useState<'browse' | 'generate'>('browse');
  const [selectedPreset, setSelectedPreset] = useState<CharacterPreset | null>(null);
  const [selectedLibraryAsset, setSelectedLibraryAsset] = useState<Asset | null>(null);
  const [libraryAssets, setLibraryAssets] = useState<Asset[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [description, setDescription] = useState('');
  const [artStyle, setArtStyle] = useState<'realistic' | 'stylized' | 'cartoon' | 'anime'>('stylized');

  const {
    generating,
    character,
    error,
    progress,
    animationProgress,
    generateCharacter,
    triggerRigging,
    reset,
  } = useCharacterGeneration();

  useEffect(() => {
    loadLibraryCharacters();
  }, []);

  const loadLibraryCharacters = async () => {
    setLoadingLibrary(true);
    try {
      const service = new AssetLibraryService();
      const assets = await service.getAssetsByType('model');
      setLibraryAssets(assets.filter(a =>
        a.tags?.some(t => ['character', 'human', 'elf', 'warrior', 'wizard', 'archer', 'ranger', 'mage', 'knight', 'rogue', 'paladin'].includes(t))
      ));
    } catch {
      setLibraryAssets([]);
    }
    setLoadingLibrary(false);
  };

  const handleSelectPreset = (preset: CharacterPreset) => {
    setSelectedPreset(preset);
    setSelectedLibraryAsset(null);
  };

  const handleSelectLibraryAsset = (asset: Asset) => {
    setSelectedLibraryAsset(asset);
    setSelectedPreset(null);
  };

  const handleGenerate = () => {
    if (!description.trim()) return;
    generateCharacter({ description: description.trim(), artStyle });
  };

  const handleRigAndAnimate = () => {
    if (character?.assetId) {
      triggerRigging(character.assetId);
    }
  };

  const handleStart = () => {
    const customization: CharacterCustomization = {
      ...DEFAULT_CUSTOMIZATION,
      name: characterName.trim() || 'Adventurer',
    };
    onStart(customization);
  };

  const showGenerateForm = progress === 'idle' || progress === 'failed';
  const showProgress = progress === 'generating' || progress === 'rigging' || progress === 'animating';
  const showModelReady = progress === 'model_complete';
  const showCompleted = progress === 'completed';

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to World Setup
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Choose Your Character
          </h1>
          <p className="text-lg text-slate-400">
            Entering <span className="text-blue-400 font-medium">{scenario.name}</span> -- pick a character class or generate a custom one.
          </p>
        </div>

        {/* Character Name */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">Character Name</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Adventurer"
            maxLength={24}
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-lg text-center"
          />
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { id: 'browse' as const, label: 'Choose Class', icon: Shield },
            { id: 'generate' as const, label: 'AI Generate', icon: Wand2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                tab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-10">
          {tab === 'browse' && (
            <div className="space-y-8">
              {/* Character Class Presets */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Character Classes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {CHARACTER_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedPreset?.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group ${
                          isSelected
                            ? 'border-blue-400 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/10'
                            : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${preset.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-white text-sm mb-0.5">{preset.name}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{preset.description}</p>
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="w-5 h-5 text-blue-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Library Models */}
              {!loadingLibrary && libraryAssets.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Library className="w-4 h-4" />
                    Generated Models
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {libraryAssets.map((asset) => {
                      const isSelected = selectedLibraryAsset?.id === asset.id;
                      return (
                        <button
                          key={asset.id}
                          onClick={() => handleSelectLibraryAsset(asset)}
                          className={`relative rounded-xl border-2 overflow-hidden text-left transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-400 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/10'
                              : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                          }`}
                        >
                          {asset.preview_url ? (
                            <img
                              src={asset.preview_url}
                              alt={asset.name}
                              className="w-full aspect-square object-cover bg-slate-900"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                              <Shield className="w-10 h-10 text-slate-700" />
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-sm text-white font-medium truncate">{asset.name}</p>
                            <div className="flex gap-1 mt-1.5">
                              {asset.tags?.slice(0, 2).map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 bg-slate-700/70 rounded text-[10px] text-slate-400 capitalize">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="w-5 h-5 text-blue-400 drop-shadow-lg" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {loadingLibrary && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin mr-2" />
                  <span className="text-sm text-slate-400">Loading model library...</span>
                </div>
              )}

              {/* Selected preview */}
              {selectedPreset && (
                <div className="max-w-lg mx-auto p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedPreset.color} flex items-center justify-center flex-shrink-0`}>
                      {React.createElement(selectedPreset.icon, { className: 'w-5 h-5 text-white' })}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{selectedPreset.name}</p>
                      <p className="text-sm text-slate-400 leading-relaxed mt-0.5">
                        {selectedPreset.prompt.substring(0, 120)}...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'generate' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <p className="text-sm text-slate-400 text-center">
                Describe any character and AI will generate a unique 3D model. You can start playing while it generates.
              </p>

              {showGenerateForm && (
                <>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brave knight in silver armor with a red cape, wielding a longsword..."
                    rows={4}
                    disabled={generating}
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Art Style</label>
                    <div className="flex gap-2">
                      {(['stylized', 'realistic', 'cartoon', 'anime'] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => setArtStyle(style)}
                          disabled={generating}
                          className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                            artStyle === style
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!description.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Generate 3D Character
                  </button>
                </>
              )}

              {showProgress && (
                <div className="space-y-4">
                  <GenerationPipeline progress={progress} animationProgress={animationProgress} />

                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Prompt:</p>
                    <p className="text-white text-sm">{description}</p>
                    <p className="text-xs text-slate-500 mt-2 capitalize">Style: {artStyle}</p>
                  </div>

                  <p className="text-sm text-slate-400 text-center">
                    You can enter the world now -- your model will load when ready.
                  </p>

                  <button
                    onClick={reset}
                    className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                  >
                    Cancel & Start Over
                  </button>
                </div>
              )}

              {showModelReady && character && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">3D Model Ready</p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Enter the world as-is, or rig it with animations first.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleRigAndAnimate}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <Bone className="w-4 h-4" />
                      Rig & Animate
                    </button>
                  </div>

                  <button
                    onClick={reset}
                    className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                  >
                    Generate Another
                  </button>
                </div>
              )}

              {showCompleted && character && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <Play className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Animated Character Ready</p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Your character is fully rigged and animated.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={reset}
                    className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                  >
                    Generate Another
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Error</p>
                    <p className="text-sm text-slate-400 mt-0.5">{error}</p>
                    <button onClick={reset} className="text-xs text-blue-400 mt-2 underline">Try again</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enter World */}
        <div className="flex justify-center">
          <button
            onClick={handleStart}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-lg font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:scale-[1.02] flex items-center gap-3"
          >
            <ArrowRight className="w-5 h-5" />
            Enter World
          </button>
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

function GenerationPipeline({
  progress,
  animationProgress,
}: {
  progress: GenerationPhase;
  animationProgress: AnimationProgress | null;
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
