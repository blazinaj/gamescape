import React, { useState } from 'react';
import { Wand2, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useCharacterGeneration } from '../hooks/useCharacterGeneration';

export const CharacterGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [artStyle, setArtStyle] = useState<'realistic' | 'stylized' | 'cartoon' | 'anime'>('realistic');
  const { generating, character, error, progress, generateCharacter, reset } = useCharacterGeneration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    await generateCharacter({
      description: description.trim(),
      artStyle,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-blue-500/20">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">AI Character Generator</h2>
      </div>

      {progress === 'idle' || progress === 'failed' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Character Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your ideal character: 'A brave knight with glowing armor and a sword of legend', 'A wise wizard with mystical robes', etc."
              className="w-full h-24 px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              disabled={generating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Art Style
            </label>
            <select
              value={artStyle}
              onChange={e => setArtStyle(e.target.value as any)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-400"
              disabled={generating}
            >
              <option value="realistic">Realistic</option>
              <option value="stylized">Stylized</option>
              <option value="cartoon">Cartoon</option>
              <option value="anime">Anime</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={generating || !description.trim()}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded flex items-center justify-center gap-2 transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Character
              </>
            )}
          </button>
        </form>
      ) : null}

      {progress === 'generating' && character ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <div>
              <p className="font-semibold text-white">Generating Your Character</p>
              <p className="text-sm text-gray-300">
                This usually takes 2-5 minutes. We'll update you when it's ready!
              </p>
            </div>
          </div>

          <div className="bg-slate-700 p-4 rounded">
            <p className="text-sm text-gray-300 mb-2">Your Request:</p>
            <p className="text-white font-medium">{description}</p>
            <p className="text-sm text-gray-400 mt-2">Style: {artStyle}</p>
          </div>

          <button
            onClick={reset}
            className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded transition-colors"
          >
            Start New Generation
          </button>
        </div>
      ) : null}

      {progress === 'completed' && character ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-semibold text-white">Character Ready!</p>
              <p className="text-sm text-gray-300">
                Your AI-generated character has been saved to the asset library.
              </p>
            </div>
          </div>

          {character.modelUrl && (
            <div className="bg-slate-700 p-4 rounded">
              <p className="text-sm text-gray-300 mb-2">Model Available:</p>
              <a
                href={character.modelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 break-all text-sm"
              >
                Download Model (GLB)
              </a>
            </div>
          )}

          <button
            onClick={reset}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Generate Another Character
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-white">Error</p>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
