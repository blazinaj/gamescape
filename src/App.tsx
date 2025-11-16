import React, { useState } from 'react';
import { Game3D } from './components/Game3D';
import { MainMenu } from './components/MainMenu';
import { GameStore } from './components/GameStore';
import { DeveloperPortal } from './components/DeveloperPortal';
import { AppMode } from './types/AppTypes';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [appMode, setAppMode] = useState<AppMode>('store');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const handleNavigateToStore = () => {
    setAppMode('store');
    setCurrentGameId(null);
    setCurrentProjectId(null);
  };

  const handleNavigateToPlay = (gameId: string) => {
    setCurrentGameId(gameId);
    setAppMode('play');
  };

  const handleNavigateToDevelop = (projectId?: string) => {
    setCurrentProjectId(projectId || null);
    setAppMode('develop');
  };

  const handleReturnToStore = () => {
    setCurrentGameId(null);
    setCurrentProjectId(null);
    setAppMode('store');
  };

  if (authLoading || profileLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">Loading Gamescape...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <MainMenu onNavigate={handleNavigateToStore} />
    );
  }

  if (appMode === 'play' && currentGameId) {
    return (
      <div className="w-full h-screen overflow-hidden">
        <Game3D
          gameId={currentGameId}
          onReturnToMenu={handleReturnToStore}
        />
      </div>
    );
  }

  if (appMode === 'develop') {
    return (
      <DeveloperPortal
        currentProjectId={currentProjectId}
        onNavigateToStore={handleNavigateToStore}
        onNavigateToPlay={handleNavigateToPlay}
      />
    );
  }

  return (
    <GameStore
      onNavigateToPlay={handleNavigateToPlay}
      onNavigateToDevelop={handleNavigateToDevelop}
    />
  );
}

export default App;