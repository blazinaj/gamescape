import React, { useState } from 'react';
import {
  Sparkles, TreePine, Castle, Mountain, Wand2, Ship,
  Cog, Skull, Loader2, ArrowLeft, Pen,
} from 'lucide-react';
import { GameScenario } from './ScenarioSelector';

interface WorldTheme {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  theme: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  color: string;
  accent: string;
}

const WORLD_THEMES: WorldTheme[] = [
  {
    id: 'peaceful_village',
    name: 'Peaceful Village',
    icon: TreePine,
    prompt: 'A peaceful rural setting with rolling green hills, small farming villages, friendly NPCs who are farmers, merchants, and crafters. The world is safe and welcoming, with abundant resources, beautiful landscapes, and a focus on building, crafting, and exploration. Wildlife is harmless and the atmosphere is serene and pastoral.',
    theme: 'pastoral',
    difficulty: 'Easy',
    color: 'from-emerald-600 to-green-700',
    accent: 'border-emerald-500 bg-emerald-500/10',
  },
  {
    id: 'ancient_ruins',
    name: 'Ancient Ruins',
    icon: Castle,
    prompt: 'An ancient world filled with crumbling ruins, mysterious stone structures, and remnants of a lost magical civilization. The landscape features weathered temples, abandoned cities, mystical crystals, and ancient artifacts. NPCs are archaeologists, scholars, and mystic guardians. There are puzzles to solve and magical mysteries to uncover.',
    theme: 'archaeological',
    difficulty: 'Medium',
    color: 'from-amber-600 to-yellow-700',
    accent: 'border-amber-500 bg-amber-500/10',
  },
  {
    id: 'frontier_wilderness',
    name: 'Wild Frontier',
    icon: Mountain,
    prompt: 'A rugged frontier wilderness with dense forests, treacherous mountains, and dangerous wildlife. The world is harsh but resource-rich, with scattered outposts, brave pioneers, and wild creatures. NPCs are survivalists, traders, and adventurers. The focus is on survival, resource gathering, and taming the wild.',
    theme: 'survival',
    difficulty: 'Hard',
    color: 'from-stone-600 to-stone-700',
    accent: 'border-stone-500 bg-stone-500/10',
  },
  {
    id: 'magical_realm',
    name: 'Magical Realm',
    icon: Wand2,
    prompt: 'A mystical realm where magic is commonplace and wonder fills every corner. Enchanted forests with glowing plants, magical creatures like unicorns and dragons, floating islands, and spellcasting NPCs including wizards, witches, and magical beings. The world is colorful, whimsical, and full of magical phenomena.',
    theme: 'fantasy',
    difficulty: 'Medium',
    color: 'from-cyan-600 to-teal-700',
    accent: 'border-cyan-500 bg-cyan-500/10',
  },
  {
    id: 'pirate_islands',
    name: 'Pirate Islands',
    icon: Ship,
    prompt: 'A collection of tropical islands connected by ocean waters, with palm trees, sandy beaches, hidden coves, and buried treasures. NPCs are pirates, sailors, merchants, and island natives. The world features sea adventures, treasure hunting, naval themes, and a mix of danger and tropical paradise.',
    theme: 'nautical',
    difficulty: 'Medium',
    color: 'from-sky-600 to-blue-700',
    accent: 'border-sky-500 bg-sky-500/10',
  },
  {
    id: 'steampunk_city',
    name: 'Steampunk City',
    icon: Cog,
    prompt: 'A grand steampunk metropolis with towering brass buildings, steam-powered machinery, clockwork contraptions, and Victorian-era aesthetics. NPCs are inventors, engineers, factory workers, and aristocrats. The world features industrial landscapes, mechanical marvels, steam-powered transport, and technological innovation.',
    theme: 'industrial',
    difficulty: 'Medium',
    color: 'from-orange-600 to-orange-700',
    accent: 'border-orange-500 bg-orange-500/10',
  },
  {
    id: 'post_apocalyptic',
    name: 'Wasteland',
    icon: Skull,
    prompt: 'A post-apocalyptic wasteland with ruined cities, radioactive zones, and struggling survivor settlements. The world is harsh and unforgiving, with scarce resources, mutated creatures, and desperate NPCs including raiders, traders, and survivors. The focus is on scavenging, survival, and rebuilding civilization.',
    theme: 'apocalyptic',
    difficulty: 'Hard',
    color: 'from-red-700 to-rose-800',
    accent: 'border-red-500 bg-red-500/10',
  },
];

interface CreateWorldFormProps {
  onCreateWorld: (name: string, scenario: GameScenario) => void;
  onBack: () => void;
  isCreating: boolean;
}

export const CreateWorldForm: React.FC<CreateWorldFormProps> = ({
  onCreateWorld,
  onBack,
  isCreating,
}) => {
  const [worldName, setWorldName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<WorldTheme | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCreate = () => {
    const name = worldName.trim() || generateDefaultName(selectedTheme);

    if (showCustom && customPrompt.trim()) {
      const customScenario: GameScenario = {
        id: 'custom',
        name: name,
        description: customPrompt.trim(),
        icon: Pen,
        prompt: customPrompt.trim(),
        theme: 'custom',
        difficulty: 'Medium',
        features: ['Custom world', 'Your imagination'],
      };
      onCreateWorld(name, customScenario);
      return;
    }

    if (!selectedTheme) return;

    const scenario: GameScenario = {
      id: selectedTheme.id,
      name: selectedTheme.name,
      description: selectedTheme.prompt,
      icon: selectedTheme.icon,
      prompt: selectedTheme.prompt,
      theme: selectedTheme.theme,
      difficulty: selectedTheme.difficulty,
      features: [],
    };

    onCreateWorld(name, scenario);
  };

  const generateDefaultName = (theme: WorldTheme | null): string => {
    const adjectives = ['Mystic', 'Ancient', 'Lost', 'Hidden', 'Endless', 'Forgotten', 'Sacred'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const suffix = theme ? theme.name : 'World';
    return `${adj} ${suffix}`;
  };

  const canCreate = showCustom
    ? customPrompt.trim().length > 10
    : selectedTheme !== null;

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-400';
      case 'Medium': return 'text-amber-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Create Your World
          </h1>
          <p className="text-lg text-slate-400">
            Name it, pick a theme, and AI will generate everything else.
          </p>
        </div>

        <div className="max-w-lg mx-auto mb-10">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            World Name
          </label>
          <input
            type="text"
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
            placeholder="Leave blank for a random name..."
            maxLength={40}
            disabled={isCreating}
            className="w-full px-5 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => setShowCustom(false)}
            disabled={isCreating}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              !showCustom
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Pick a Theme
          </button>
          <button
            onClick={() => { setShowCustom(true); setSelectedTheme(null); }}
            disabled={isCreating}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              showCustom
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Pen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Describe Your Own
          </button>
        </div>

        {!showCustom ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
            {WORLD_THEMES.map((theme) => {
              const Icon = theme.icon;
              const isSelected = selectedTheme?.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  disabled={isCreating}
                  className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 group ${
                    isSelected
                      ? `${theme.accent} border-opacity-100 scale-[1.02] shadow-lg`
                      : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{theme.name}</h3>
                  <span className={`text-xs font-medium ${getDifficultyStyle(theme.difficulty)}`}>
                    {theme.difficulty}
                  </span>
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="max-w-lg mx-auto mb-10">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Describe your world
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="A floating sky kingdom where islands drift among the clouds, connected by rope bridges and powered by wind crystals..."
              maxLength={800}
              rows={5}
              disabled={isCreating}
              className="w-full px-5 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
            />
            <p className="text-xs text-slate-500 mt-2 text-right">
              {customPrompt.length}/800
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleCreate}
            disabled={!canCreate || isCreating}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white text-lg font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 disabled:shadow-none hover:scale-[1.02] disabled:scale-100 flex items-center gap-3"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating World...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create World
              </>
            )}
          </button>
        </div>

        {selectedTheme && !showCustom && (
          <div className="max-w-lg mx-auto mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-sm text-slate-400 leading-relaxed">
              {selectedTheme.prompt.substring(0, 150)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
