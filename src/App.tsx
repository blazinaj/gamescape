import React, { useState } from 'react';
import { Game3D } from './components/Game3D';
import { MainMenu } from './components/MainMenu';
import { GameStore } from './components/GameStore';
import { CreateWorldForm } from './components/CreateWorldForm';
import { AssetLibraryBrowser } from './components/AssetLibraryBrowser';
import { AppMode } from './types/AppTypes';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { GameScenario } from './components/ScenarioSelector';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { loading: profileLoading } = useProfile();
  const [appMode, setAppMode] = useState<AppMode>('home');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentScenario, setCurrentScenario] = useState<GameScenario | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleNavigateToHome = () => {
    setAppMode('home');
    setCurrentGameId(null);
    setCurrentScenario(null);
  };

  const handleNavigateToCreate = () => {
    setAppMode('create');
  };

  const handleNavigateToPlay = (gameId: string) => {
    setCurrentGameId(gameId);
    setCurrentScenario(null);
    setAppMode('play');
  };

  const handleCreateWorld = (name: string, scenario: GameScenario) => {
    setIsCreating(true);
    const namedScenario = { ...scenario, name };
    setCurrentScenario(namedScenario);
    setCurrentGameId(null);
    setAppMode('play');
    setIsCreating(false);
  };

  const handleReturnToHome = () => {
    setCurrentGameId(null);
    setCurrentScenario(null);
    setAppMode('home');
  };

  if (authLoading || profileLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading Gamescape...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <MainMenu onNavigate={handleNavigateToHome} />;
  }

  if (appMode === 'play' && (currentGameId || currentScenario)) {
    return (
      <div className="w-full h-screen overflow-hidden">
        <Game3D
          gameId={currentGameId || undefined}
          scenario={currentScenario || undefined}
          onReturnToMenu={handleReturnToHome}
        />
      </div>
    );
  }

  if (appMode === 'create') {
    return (
      <CreateWorldForm
        onCreateWorld={handleCreateWorld}
        onBack={handleNavigateToHome}
        isCreating={isCreating}
      />
    );
  }

  if (appMode === 'assets') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={handleNavigateToHome}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <span className="text-lg">&larr;</span>
              <span className="text-sm">Back to Home</span>
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <AssetLibraryBrowser />
        </div>
      </div>
    );
  }

  return (
    <GameStore
      onNavigateToPlay={handleNavigateToPlay}
      onNavigateToCreate={handleNavigateToCreate}
      onNavigateToAssets={() => setAppMode('assets')}
    />
  );
}

export default App;
