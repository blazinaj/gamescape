import React, { useState } from 'react';
import { Game3D } from './components/Game3D';
import { StartMenu } from './components/StartMenu';

type AppState = 'menu' | 'game';

function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  const handleNewGame = (gameId: string) => {
    setCurrentGameId(gameId);
    setAppState('game');
  };

  const handleLoadGame = (gameId: string) => {
    setCurrentGameId(gameId);
    setAppState('game');
  };

  const handleReturnToMenu = () => {
    setCurrentGameId(null);
    setAppState('menu');
  };

  if (appState === 'menu') {
    return (
      <StartMenu
        onNewGame={handleNewGame}
        onLoadGame={handleLoadGame}
      />
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <Game3D
        gameId={currentGameId || undefined}
        onReturnToMenu={handleReturnToMenu}
      />
    </div>
  );
}

export default App;