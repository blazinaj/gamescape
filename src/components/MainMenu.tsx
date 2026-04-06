import React, { useState } from 'react';
import { AuthForm } from './AuthForm';
import { Compass, Globe, Sparkles } from 'lucide-react';

interface MainMenuProps {
  onNavigate: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_70%)]" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      {showAuth ? (
        <div className="relative z-10 w-full max-w-md px-4">
          <button
            onClick={() => setShowAuth(false)}
            className="text-slate-400 hover:text-white text-sm mb-6 transition-colors"
          >
            &larr; Back
          </button>
          <AuthForm onSuccess={onNavigate} />
        </div>
      ) : (
        <div className="relative z-10 text-center px-6">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Compass className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Gamescape
          </h1>
          <p className="text-xl text-slate-400 mb-14 max-w-md mx-auto leading-relaxed">
            Create and explore infinite AI-generated worlds
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14 max-w-3xl mx-auto">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
              <h3 className="text-base font-semibold text-white mb-1.5">AI-Generated</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Pick a theme and AI creates terrain, NPCs, quests, and more
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <Globe className="w-8 h-8 text-emerald-400 mb-3 mx-auto" />
              <h3 className="text-base font-semibold text-white mb-1.5">Infinite Worlds</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every world is unique and expands as you explore it
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <Compass className="w-8 h-8 text-amber-400 mb-3 mx-auto" />
              <h3 className="text-base font-semibold text-white mb-1.5">Your Adventure</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Shape your world as you play -- every choice matters
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAuth(true)}
            className="px-14 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-lg font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 hover:scale-[1.02]"
          >
            Get Started
          </button>

          <p className="mt-8 text-sm text-slate-500">
            Powered by AI -- Infinite Possibilities
          </p>
        </div>
      )}
    </div>
  );
};
