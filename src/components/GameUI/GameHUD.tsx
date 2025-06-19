import React from 'react';
import { Map as MapIcon, MousePointer, Scroll } from 'lucide-react';

interface GameHUDProps {
  currentBiome: string;
  isLoaded: boolean;
  isPointerLocked: boolean;
  scenarioName?: string;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentBiome,
  isLoaded,
  isPointerLocked,
  scenarioName
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white p-4 rounded-lg backdrop-blur-sm">
      <h1 className="text-xl font-bold mb-2 flex items-center gap-2 justify-center">
        <MapIcon className="w-5 h-5" />
        GameScape
      </h1>
      
      <div className="text-xs opacity-75 flex items-center justify-center gap-4">
        <span>{isLoaded ? '✅ Active' : '⏳ Loading...'}</span>
        {isPointerLocked && (
          <span className="flex items-center gap-1 text-green-300">
            <MousePointer className="w-3 h-3" />
            Mouse Locked
          </span>
        )}
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="capitalize">{currentBiome}</span>
        </span>
        {scenarioName && (
          <span className="flex items-center gap-1 text-purple-300">
            <Scroll className="w-3 h-3" />
            {scenarioName}
          </span>
        )}
        <span className="text-blue-300">Auto-Save: ON</span>
      </div>
    </div>
  );
};