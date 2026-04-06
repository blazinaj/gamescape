import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Sparkles, User, Palette, Loader2, Wand2,
  Library, CheckCircle,
} from 'lucide-react';
import { CharacterCustomization, DEFAULT_CUSTOMIZATION } from '../types/CharacterTypes';
import { useCharacterGeneration } from '../hooks/useCharacterGeneration';
import { AssetLibraryService, Asset } from '../services/AssetLibraryService';
import { GameScenario } from './ScenarioSelector';

interface CharacterCreationStepProps {
  scenario: GameScenario;
  onBack: () => void;
  onStart: (customization: CharacterCustomization) => void;
}

const SKIN_COLORS = ['#FFDBAC', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#4A2C12'];
const CLOTHING_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#1E293B', '#F8FAFC'];

export const CharacterCreationStep: React.FC<CharacterCreationStepProps> = ({
  scenario,
  onBack,
  onStart,
}) => {
  const [customization, setCustomization] = useState<CharacterCustomization>({
    ...DEFAULT_CUSTOMIZATION,
  });
  const [tab, setTab] = useState<'customize' | 'generate' | 'library'>('customize');
  const [description, setDescription] = useState('');
  const [artStyle, setArtStyle] = useState<'realistic' | 'stylized' | 'cartoon'>('stylized');
  const [libraryAssets, setLibraryAssets] = useState<Asset[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selectedLibraryAsset, setSelectedLibraryAsset] = useState<Asset | null>(null);

  const {
    generating,
    character,
    error,
    progress,
    generateCharacter,
    reset,
  } = useCharacterGeneration();

  useEffect(() => {
    if (tab === 'library') loadLibrary();
  }, [tab]);

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const service = AssetLibraryService.getInstance();
      const assets = await service.getAssetsByType('model');
      setLibraryAssets(assets.filter(a =>
        a.status === 'completed' && a.tags?.some(t => ['character', 'human', 'elf', 'warrior', 'wizard', 'archer', 'ranger', 'mage'].includes(t))
      ));
    } catch {
      setLibraryAssets([]);
    }
    setLoadingLibrary(false);
  };

  const handleGenerate = () => {
    if (!description.trim()) return;
    generateCharacter(description, artStyle);
  };

  const update = (key: keyof CharacterCustomization, value: any) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
  };

  const handleStart = () => {
    onStart(customization);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to World Setup
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Design Your Character
          </h1>
          <p className="text-lg text-slate-400">
            Entering <span className="text-blue-400 font-medium">{scenario.name}</span> -- customize your adventurer before you begin.
          </p>
        </div>

        {/* Character Name */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">Character Name</label>
          <input
            type="text"
            value={customization.name || ''}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Adventurer"
            maxLength={24}
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-lg"
          />
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { id: 'customize' as const, label: 'Customize', icon: Palette },
            { id: 'generate' as const, label: 'AI Generate', icon: Wand2 },
            { id: 'library' as const, label: 'Asset Library', icon: Library },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
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
        <div className="max-w-2xl mx-auto mb-10">
          {tab === 'customize' && (
            <div className="space-y-6">
              {/* Appearance Preview */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-44 rounded-2xl border-2 border-slate-700 bg-slate-800/50 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-slate-600"
                    style={{ backgroundColor: customization.bodyColor }}
                  />
                  <div
                    className="w-16 h-16 rounded-lg"
                    style={{ backgroundColor: customization.clothingColor }}
                  />
                  <div className="absolute bottom-2 text-[10px] text-slate-500 font-medium">
                    {customization.name || 'Adventurer'}
                  </div>
                </div>
              </div>

              {/* Skin Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Skin Tone</label>
                <div className="flex gap-2">
                  {SKIN_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => update('bodyColor', color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                        customization.bodyColor === color ? 'border-blue-400 scale-110 ring-2 ring-blue-400/30' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Clothing Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Clothing Color</label>
                <div className="flex gap-2 flex-wrap">
                  {CLOTHING_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => update('clothingColor', color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                        customization.clothingColor === color ? 'border-blue-400 scale-110 ring-2 ring-blue-400/30' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'scale' as const, label: 'Size', min: 0.7, max: 1.5 },
                  { key: 'headScale' as const, label: 'Head Size', min: 0.8, max: 1.4 },
                  { key: 'bodyWidth' as const, label: 'Body Width', min: 0.7, max: 1.3 },
                  { key: 'legLength' as const, label: 'Leg Length', min: 0.8, max: 1.2 },
                ].map(({ key, label, min, max }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      {label}
                    </label>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={0.05}
                      value={customization[key] as number}
                      onChange={(e) => update(key, parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'generate' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-400 text-center">
                Describe your character and AI will generate a unique 3D model. This takes a few minutes.
              </p>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brave knight in silver armor with a red cape, wielding a longsword..."
                rows={4}
                disabled={generating}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
              />

              <div className="flex gap-2">
                {(['stylized', 'realistic', 'cartoon'] as const).map(style => (
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

              {!generating && !character && (
                <button
                  onClick={handleGenerate}
                  disabled={!description.trim()}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate 3D Character
                </button>
              )}

              {generating && (
                <div className="text-center py-6">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">{progress.phase_label || 'Generating...'}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    This usually takes 2-5 minutes. You can start your adventure now and the model will load when ready.
                  </p>
                </div>
              )}

              {character && (
                <div className="text-center py-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-300 font-medium">Character model generated!</p>
                  <p className="text-sm text-slate-400 mt-1">It will be applied when the game starts.</p>
                </div>
              )}

              {error && (
                <div className="text-center py-4 bg-red-900/20 border border-red-700/30 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={reset} className="text-xs text-slate-400 mt-2 underline">Try again</button>
                </div>
              )}
            </div>
          )}

          {tab === 'library' && (
            <div>
              <p className="text-sm text-slate-400 text-center mb-4">
                Choose from previously generated character models.
              </p>
              {loadingLibrary ? (
                <div className="text-center py-10">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                </div>
              ) : libraryAssets.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <User className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                  <p>No character models in the library yet.</p>
                  <p className="text-sm mt-1">Generate one using the AI Generate tab!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {libraryAssets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedLibraryAsset(asset)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedLibraryAsset?.id === asset.id
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      {asset.preview_url ? (
                        <img src={asset.preview_url} alt={asset.name} className="w-full aspect-square object-cover rounded-lg mb-2 bg-slate-900" />
                      ) : (
                        <div className="w-full aspect-square bg-slate-900 rounded-lg mb-2 flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-700" />
                        </div>
                      )}
                      <p className="text-sm text-white font-medium truncate">{asset.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Start Button */}
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
