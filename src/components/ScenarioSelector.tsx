import React, { useState } from 'react';
import { X, Scroll, Sparkles, Mountain, TreePine, Castle, Users, Swords, Wand2, Ship, Eye, EyeOff } from 'lucide-react';

export interface GameScenario {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  theme: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  features: string[];
}

interface ScenarioSelectorProps {
  onSelect: (scenario: GameScenario) => void;
  onCancel: () => void;
}

const predefinedScenarios: GameScenario[] = [
  {
    id: 'peaceful_village',
    name: 'Peaceful Village',
    description: 'Start your adventure in a tranquil farming village surrounded by gentle hills and friendly neighbors.',
    icon: TreePine,
    prompt: 'A peaceful rural setting with rolling green hills, small farming villages, friendly NPCs who are farmers, merchants, and crafters. The world is safe and welcoming, with abundant resources, beautiful landscapes, and a focus on building, crafting, and exploration. Wildlife is harmless and the atmosphere is serene and pastoral.',
    theme: 'pastoral',
    difficulty: 'Easy',
    features: ['Safe exploration', 'Friendly NPCs', 'Rich resources', 'Beautiful landscapes']
  },
  {
    id: 'ancient_ruins',
    name: 'Ancient Ruins',
    description: 'Explore mysterious ruins of a lost civilization, uncovering secrets and magical artifacts.',
    icon: Castle,
    prompt: 'An ancient world filled with crumbling ruins, mysterious stone structures, and remnants of a lost magical civilization. The landscape features weathered temples, abandoned cities, mystical crystals, and ancient artifacts. NPCs are archaeologists, scholars, and mystic guardians. There are puzzles to solve and magical mysteries to uncover.',
    theme: 'archaeological',
    difficulty: 'Medium',
    features: ['Ancient mysteries', 'Magical artifacts', 'Puzzle elements', 'Rich lore']
  },
  {
    id: 'frontier_wilderness',
    name: 'Wild Frontier',
    description: 'Survive in an untamed wilderness where danger and opportunity await around every corner.',
    icon: Mountain,
    prompt: 'A rugged frontier wilderness with dense forests, treacherous mountains, and dangerous wildlife. The world is harsh but resource-rich, with scattered outposts, brave pioneers, and wild creatures. NPCs are survivalists, traders, and adventurers. The focus is on survival, resource gathering, and taming the wild.',
    theme: 'survival',
    difficulty: 'Hard',
    features: ['Survival challenges', 'Dangerous wildlife', 'Resource scarcity', 'Frontier towns']
  },
  {
    id: 'magical_realm',
    name: 'Magical Realm',
    description: 'Enter a world where magic flows freely and fantastical creatures roam enchanted forests.',
    icon: Wand2,
    prompt: 'A mystical realm where magic is commonplace and wonder fills every corner. Enchanted forests with glowing plants, magical creatures like unicorns and dragons, floating islands, and spellcasting NPCs including wizards, witches, and magical beings. The world is colorful, whimsical, and full of magical phenomena.',
    theme: 'fantasy',
    difficulty: 'Medium',
    features: ['Magic everywhere', 'Fantastical creatures', 'Enchanted landscapes', 'Spell-casting NPCs']
  },
  {
    id: 'pirate_islands',
    name: 'Pirate Islands',
    description: 'Sail the high seas between tropical islands, searching for treasure and adventure.',
    icon: Ship,
    prompt: 'A collection of tropical islands connected by ocean waters, with palm trees, sandy beaches, hidden coves, and buried treasures. NPCs are pirates, sailors, merchants, and island natives. The world features sea adventures, treasure hunting, naval themes, and a mix of danger and tropical paradise.',
    theme: 'nautical',
    difficulty: 'Medium',
    features: ['Tropical islands', 'Treasure hunting', 'Pirate lore', 'Naval adventures']
  },
  {
    id: 'steampunk_city',
    name: 'Steampunk Metropolis',
    description: 'Explore a Victorian-inspired city powered by steam technology and mechanical wonders.',
    icon: Users,
    prompt: 'A grand steampunk metropolis with towering brass buildings, steam-powered machinery, clockwork contraptions, and Victorian-era aesthetics. NPCs are inventors, engineers, factory workers, and aristocrats. The world features industrial landscapes, mechanical marvels, steam-powered transport, and technological innovation.',
    theme: 'industrial',
    difficulty: 'Medium',
    features: ['Steam technology', 'Urban exploration', 'Mechanical puzzles', 'Victorian atmosphere']
  },
  {
    id: 'post_apocalyptic',
    name: 'Post-Apocalyptic Wasteland',
    description: 'Survive in the ruins of civilization, scavenging resources in a dangerous wasteland.',
    icon: Swords,
    prompt: 'A post-apocalyptic wasteland with ruined cities, radioactive zones, and struggling survivor settlements. The world is harsh and unforgiving, with scarce resources, mutated creatures, and desperate NPCs including raiders, traders, and survivors. The focus is on scavenging, survival, and rebuilding civilization.',
    theme: 'apocalyptic',
    difficulty: 'Hard',
    features: ['Harsh survival', 'Scavenging focus', 'Dangerous enemies', 'Rebuilding themes']
  }
];

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ onSelect, onCancel }) => {
  const [selectedScenario, setSelectedScenario] = useState<GameScenario | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customScenario, setCustomScenario] = useState({
    name: '',
    description: '',
    prompt: ''
  });
  const [showPromptPreview, setShowPromptPreview] = useState<string | null>(null);

  const handleCustomSubmit = () => {
    if (!customScenario.name.trim() || !customScenario.prompt.trim()) return;

    const custom: GameScenario = {
      id: 'custom',
      name: customScenario.name,
      description: customScenario.description || 'Custom scenario',
      icon: Scroll,
      prompt: customScenario.prompt,
      theme: 'custom',
      difficulty: 'Medium',
      features: ['Custom world', 'Unique adventure', 'Personal story']
    };

    onSelect(custom);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-900';
      case 'Medium': return 'text-yellow-400 bg-yellow-900';
      case 'Hard': return 'text-red-400 bg-red-900';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Scroll className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Choose Your Adventure</h2>
                <p className="text-blue-200">Select a scenario to shape your world and story</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* Scenario List */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-700">
            <div className="space-y-4">
              {/* Toggle between preset and custom */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setShowCustom(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    !showCustom 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Preset Scenarios
                </button>
                <button
                  onClick={() => setShowCustom(true)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    showCustom 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Scroll className="w-4 h-4 inline mr-2" />
                  Custom Scenario
                </button>
              </div>

              {!showCustom ? (
                /* Preset Scenarios */
                predefinedScenarios.map((scenario) => {
                  const Icon = scenario.icon;
                  const isSelected = selectedScenario?.id === scenario.id;
                  return (
                    <div
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600' : 'bg-gray-700'}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{scenario.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(scenario.difficulty)}`}>
                              {scenario.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{scenario.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {scenario.features.slice(0, 2).map((feature, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                            {scenario.features.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{scenario.features.length - 2} more
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPromptPreview(showPromptPreview === scenario.id ? null : scenario.id);
                            }}
                            className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            {showPromptPreview === scenario.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {showPromptPreview === scenario.id ? 'Hide' : 'Preview'} AI Prompt
                          </button>
                          {showPromptPreview === scenario.id && (
                            <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-600">
                              <p className="text-xs text-gray-300 italic">{scenario.prompt}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Custom Scenario Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Scenario Name *
                    </label>
                    <input
                      type="text"
                      value={customScenario.name}
                      onChange={(e) => setCustomScenario(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter a name for your scenario..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={customScenario.description}
                      onChange={(e) => setCustomScenario(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your world..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      maxLength={150}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      World Description *
                    </label>
                    <textarea
                      value={customScenario.prompt}
                      onChange={(e) => setCustomScenario(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Describe your world in detail... What kind of environment, NPCs, themes, and atmosphere do you want? Be specific about the setting, mood, and what makes this world unique."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={8}
                      maxLength={1000}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {customScenario.prompt.length}/1000 characters
                    </div>
                  </div>

                  <div className="bg-blue-900 bg-opacity-30 border border-blue-500 border-opacity-50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-medium mb-2">💡 Tips for Great Scenarios:</h4>
                    <ul className="text-sm text-blue-200 space-y-1">
                      <li>• Describe the overall mood and atmosphere</li>
                      <li>• Mention what types of NPCs live there</li>
                      <li>• Include details about landscape and environment</li>
                      <li>• Specify if it's dangerous, peaceful, magical, etc.</li>
                      <li>• Add unique elements that make your world special</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 p-6 bg-gray-850">
            {!showCustom && selectedScenario ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <selectedScenario.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedScenario.name}</h3>
                    <span className={`px-3 py-1 text-sm rounded-full ${getDifficultyColor(selectedScenario.difficulty)}`}>
                      {selectedScenario.difficulty} Difficulty
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
                    <p className="text-gray-200">{selectedScenario.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Features</h4>
                    <div className="space-y-2">
                      {selectedScenario.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-200">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">AI World Context</h4>
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <p className="text-sm text-gray-300 italic">{selectedScenario.prompt}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelect(selectedScenario)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 mt-6"
                >
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  Start Adventure
                </button>
              </div>
            ) : showCustom ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-600 rounded-lg">
                    <Scroll className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Custom Scenario</h3>
                    <span className="text-purple-300">Create your unique world</span>
                  </div>
                </div>

                <div className="flex-1">
                  {customScenario.name && (
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-white mb-1">{customScenario.name}</h4>
                      {customScenario.description && (
                        <p className="text-gray-300">{customScenario.description}</p>
                      )}
                    </div>
                  )}

                  {customScenario.prompt && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">AI World Context Preview</h4>
                      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 max-h-40 overflow-y-auto">
                        <p className="text-sm text-gray-300 italic">{customScenario.prompt}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCustomSubmit}
                  disabled={!customScenario.name.trim() || !customScenario.prompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none mt-6"
                >
                  <Scroll className="w-5 h-5 inline mr-2" />
                  Create World
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">Select a Scenario</h3>
                  <p className="text-gray-500">Choose from our curated scenarios or create your own custom world</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};