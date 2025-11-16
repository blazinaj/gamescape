import React, { useState } from 'react';
import { AuthForm } from './AuthForm';
import { Gamepad2, Code2, Store } from 'lucide-react';

interface MainMenuProps {
  onNavigate: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      {showAuth ? (
        <div className="w-full max-w-md">
          <AuthForm onSuccess={onNavigate} />
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-7xl font-bold text-white mb-4 tracking-tight">
              Gamescape
            </h1>
            <p className="text-xl text-slate-300">
              Create, Play, and Share Infinite Worlds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
              <Store className="w-12 h-12 text-blue-400 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">Game Store</h3>
              <p className="text-slate-400">
                Discover and play thousands of AI-generated games created by our community
              </p>
            </div>

            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
              <Gamepad2 className="w-12 h-12 text-green-400 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">Play Games</h3>
              <p className="text-slate-400">
                Experience unique procedurally generated adventures with intelligent NPCs
              </p>
            </div>

            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
              <Code2 className="w-12 h-12 text-purple-400 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">Developer Portal</h3>
              <p className="text-slate-400">
                Build and publish your own games using AI-powered tools
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAuth(true)}
            className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Get Started
          </button>

          <div className="mt-8 text-slate-400">
            <p>Powered by AI | Infinite Possibilities</p>
          </div>
        </div>
      )}
    </div>
  );
};
