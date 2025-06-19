import React, { useState } from 'react';
import { Game3D } from './components/Game3D';
import { StartMenu } from './components/StartMenu';
import { GameScenario } from './components/ScenarioSelector';

type AppState = 'menu' | 'game';

function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentScenario, setCurrentScenario] = useState<GameScenario | null>(null);

  const handleNewGame = (gameId: string) => {
    setCurrentGameId(gameId);
    setAppState('game');
  };

  const handleLoadGame = (gameId: string) => {
    setCurrentGameId(gameId);
    setCurrentScenario(null);
    setAppState('game');
  };

  const handleReturnToMenu = () => {
    setCurrentGameId(null);
    setCurrentScenario(null);
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
        scenario={currentScenario || undefined}
        onReturnToMenu={handleReturnToMenu}
      />
    </div>
  );
}

export default App;