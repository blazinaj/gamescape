import React from 'react';
import { Zap, Loader2, MousePointer } from 'lucide-react';

interface GameStatusProps {
  isGenerating: boolean;
  isUIActive: boolean;
  isPointerLocked: boolean;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  isGenerating,
  isUIActive,
  isPointerLocked,
}) => {
  return (
    <>
      {/* AI Generation Status */}
      <div className="absolute top-20 right-4 bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm">
        <div className="text-xs flex items-center gap-2">
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 text-green-400" />
              <span>AI Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Click instruction for new users */}
      {!isPointerLocked && !isUIActive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg backdrop-blur-sm border-2 border-blue-400">
          <div className="text-sm text-center">
            <span className="animate-pulse flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              👆 Click anywhere on the game area to activate mouse look and start playing!
            </span>
          </div>
        </div>
      )}

      {/* Mouse lock instructions when UI active */}
      {isUIActive && isPointerLocked && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
          <div className="text-sm text-center">
            Press <strong>Escape</strong> to unlock mouse and interact with menus properly
          </div>
        </div>
      )}
    </>
  );
};