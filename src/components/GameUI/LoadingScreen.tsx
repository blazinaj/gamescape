import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface LoadingScreenProps {
  loadingError: string | null;
  loadingStep: string;
  onRetryLoad: () => void;
  onStartFresh: () => void;
  onReturnToMenu: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  loadingError,
  loadingStep,
  onRetryLoad,
  onStartFresh,
  onReturnToMenu,
}) => {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-sky-200 to-sky-400 flex items-center justify-center">
      <div className="bg-black bg-opacity-50 text-white p-8 rounded-lg backdrop-blur-sm text-center max-w-md">
        {loadingError ? (
          <>
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-red-300">Loading Failed</h2>
            <p className="text-gray-300 mb-6">{loadingError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onRetryLoad}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onStartFresh}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Start Fresh
              </button>
              <button
                onClick={onReturnToMenu}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Back to Menu
              </button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Loading Your Adventure</h2>
            <p className="text-gray-300 mb-4">{loadingStep}</p>
            <div className="text-sm text-gray-400 mb-4">
              This may take a moment while we restore your progress
            </div>
            <div className="mt-4">
              <button
                onClick={onReturnToMenu}
                className="text-gray-400 hover:text-white text-sm underline"
              >
                Cancel and return to menu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};