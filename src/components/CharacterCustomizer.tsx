import React, { useState } from 'react';
import { CharacterCustomization, DEFAULT_CUSTOMIZATION } from '../types/CharacterTypes';
import { CharacterCustomizationService } from '../services/CharacterCustomizationService';
import { CharacterPreview } from './CharacterPreview';
import { 
  User, 
  Palette, 
  Shuffle, 
  Send, 
  Loader2, 
  RotateCcw, 
  Sliders,
  MessageSquare,
  Sparkles,
  X,
  Eye
} from 'lucide-react';

interface CharacterCustomizerProps {
  isVisible: boolean;
  onClose: () => void;
  onCustomizationChange: (customization: CharacterCustomization) => void;
  currentCustomization: CharacterCustomization;
}

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  isVisible,
  onClose,
  onCustomizationChange,
  currentCustomization
}) => {
  const [customizationService] = useState(() => new CharacterCustomizationService());
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastExplanation, setLastExplanation] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

  const handleAICustomization = async () => {
    if (!description.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await customizationService.customizeCharacter({
        description: description.trim(),
        currentCustomization
      });

      onCustomizationChange(result.customization);
      setLastExplanation(result.explanation);
      setDescription('');
    } catch (error) {
      console.error('Customization failed:', error);
      setLastExplanation('Failed to process customization request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRandomize = () => {
    const randomCustomization = customizationService.generateRandomCustomization();
    onCustomizationChange(randomCustomization);
    setLastExplanation('Generated a random character appearance!');
  };

  const handleReset = () => {
    onCustomizationChange(DEFAULT_CUSTOMIZATION);
    setLastExplanation('Reset to default character appearance.');
  };

  const handleManualChange = (property: keyof CharacterCustomization, value: any) => {
    const newCustomization = { ...currentCustomization, [property]: value };
    onCustomizationChange(newCustomization);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAICustomization();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 character-customizer">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl max-h-full flex flex-col border border-gray-700">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-lg flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold">Character Customizer</h2>
              <p className="text-sm text-gray-400">Describe how you want your character to look, or use manual controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="w-1/2 flex flex-col border-r border-gray-700">
            {/* Tabs */}
            <div className="bg-gray-800 border-b border-gray-700">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'ai'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-700'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  AI Description
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'manual'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-700'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4 inline mr-2" />
                  Manual Controls
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'ai' ? (
                <div className="space-y-6">
                  {/* AI Customization */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Describe your character
                    </label>
                    <div className="space-y-3">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Describe how you want your character to look... (e.g., 'Make my character tall with red clothing and dark skin' or 'I want a small character with blue eyes')"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        rows={3}
                        disabled={isProcessing}
                      />
                      
                      <div className="flex gap-3">
                        <button
                          onClick={handleAICustomization}
                          disabled={!description.trim() || isProcessing}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Customize with AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Example prompts */}
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-3">Example prompts:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "Make my character tall and strong",
                        "Give me red clothing and blue eyes",
                        "I want a smaller, thinner character",
                        "Make them have dark skin and green clothes",
                        "Create a character with a big head",
                        "Make them broad and imposing"
                      ].map((example, index) => (
                        <button
                          key={index}
                          onClick={() => setDescription(example)}
                          className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors border border-gray-600"
                        >
                          "{example}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Last explanation */}
                  {lastExplanation && (
                    <div className="bg-purple-900 bg-opacity-50 border border-purple-500 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-300 mb-1">AI Response:</p>
                          <p className="text-sm text-purple-200">{lastExplanation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Manual Controls */}
                  <div className="space-y-6">
                    {/* Colors */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Colors
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Skin Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={currentCustomization.bodyColor}
                            onChange={(e) => handleManualChange('bodyColor', e.target.value)}
                            className="w-12 h-10 rounded border border-gray-600"
                          />
                          <input
                            type="text"
                            value={currentCustomization.bodyColor}
                            onChange={(e) => handleManualChange('bodyColor', e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Clothing Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={currentCustomization.clothingColor}
                            onChange={(e) => handleManualChange('clothingColor', e.target.value)}
                            className="w-12 h-10 rounded border border-gray-600"
                          />
                          <input
                            type="text"
                            value={currentCustomization.clothingColor}
                            onChange={(e) => handleManualChange('clothingColor', e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Eye Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={currentCustomization.eyeColor}
                            onChange={(e) => handleManualChange('eyeColor', e.target.value)}
                            className="w-12 h-10 rounded border border-gray-600"
                          />
                          <input
                            type="text"
                            value={currentCustomization.eyeColor}
                            onChange={(e) => handleManualChange('eyeColor', e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Proportions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5" />
                        Proportions
                      </h3>

                      {[
                        { key: 'scale', label: 'Overall Size', min: 0.5, max: 2.0, step: 0.1 },
                        { key: 'headScale', label: 'Head Size', min: 0.8, max: 1.5, step: 0.1 },
                        { key: 'bodyWidth', label: 'Body Width', min: 0.7, max: 1.3, step: 0.1 },
                        { key: 'armLength', label: 'Arm Length', min: 0.8, max: 1.2, step: 0.05 },
                        { key: 'legLength', label: 'Leg Length', min: 0.8, max: 1.2, step: 0.05 }
                      ].map(({ key, label, min, max, step }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {label}: {currentCustomization[key as keyof CharacterCustomization]}
                          </label>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={currentCustomization[key as keyof CharacterCustomization] as number}
                            onChange={(e) => handleManualChange(key as keyof CharacterCustomization, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Character Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Character Name</label>
                      <input
                        type="text"
                        value={currentCustomization.name || ''}
                        onChange={(e) => handleManualChange('name', e.target.value)}
                        placeholder="Enter character name..."
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Footer */}
            <div className="bg-gray-800 px-4 py-3 border-t border-gray-700 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={handleRandomize}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Randomize
                </button>
                <button
                  onClick={handleReset}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
              <div className="text-xs text-gray-400">
                Changes apply in real-time
              </div>
            </div>
          </div>

          {/* Right Panel - 3D Preview */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-800 p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Live Preview
              </h3>
              <p className="text-sm text-gray-400">See your customizations in real-time</p>
            </div>
            
            <div className="flex-1 p-4">
              <CharacterPreview 
                customization={currentCustomization}
                className="w-full h-full"
              />
            </div>
            
            <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
              <div className="text-xs text-gray-400 text-center">
                Character rotates automatically • Preview updates instantly
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};