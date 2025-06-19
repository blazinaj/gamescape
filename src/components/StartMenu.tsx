import React, { useState, useEffect } from 'react';
import { SaveSystem, GameSave } from '../services/SaveSystem';
import { AuthForm } from './AuthForm';
import { useAuth } from '../hooks/useAuth';
import { ExperienceSystem } from '../services/ExperienceSystem';
import { Play, Plus, Trash2, Clock, Calendar, Loader2, AlertCircle, LogOut, User, Star } from 'lucide-react';

interface StartMenuProps {
  onNewGame: (gameName: string) => void;
  onLoadGame: (gameId: string) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onNewGame, onLoadGame }) => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const [savedGames, setSavedGames] = useState<GameSave[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewGameForm, setShowNewGameForm] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalLevel, setTotalLevel] = useState<number>(0);
  const saveSystem = new SaveSystem();

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedGames();
      calculateTotalLevel();
    }
  }, [isAuthenticated]);

  const loadSavedGames = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const games = await saveSystem.listGames();
      setSavedGames(games);
    } catch (err) {
      setError('Failed to load saved games');
      console.error('Error loading games:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalLevel = () => {
    // Create a temporary experience system to calculate total level
    // In a real implementation, this would come from saved data
    const experienceSystem = new ExperienceSystem();
    setTotalLevel(experienceSystem.getTotalLevel());
  };

  const handleAuthSuccess = () => {
    // Auth state will update automatically via useAuth hook
    // which will trigger the useEffect to load games
  };

  const handleNewGame = async () => {
    if (!newGameName.trim()) return;
    
    setIsCreating(true);
    setError(null);
    try {
      const gameId = await saveSystem.createNewGame(newGameName.trim());
      if (gameId) {
        onNewGame(gameId);
      } else {
        setError('Failed to create new game');
      }
    } catch (err) {
      setError('Failed to create new game');
      console.error('Error creating game:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLoadGame = (gameId: string) => {
    onLoadGame(gameId);
  };

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${gameName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const success = await saveSystem.deleteGame(gameId);
      if (success) {
        await loadSavedGames();
      } else {
        setError('Failed to delete game');
      }
    } catch (err) {
      setError('Failed to delete game');
      console.error('Error deleting game:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setSavedGames([]);
    setShowNewGameForm(false);
    setNewGameName('');
    setError(null);
    setTotalLevel(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              GameScape
            </h1>
            <p className="text-xl text-gray-300">
              Explore infinite AI-generated worlds and endless adventures
            </p>
          </div>

          <AuthForm onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header with User Info */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div></div> {/* Spacer */}
            <h1 className="text-6xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              GameScape
            </h1>
            <div className="flex items-center gap-2">
              <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg px-3 py-2 border border-white border-opacity-20 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm">{user?.email}</span>
                </div>
                {totalLevel > 8 && ( // Only show if player has leveled beyond starting levels
                  <div className="flex items-center gap-1 pl-2 border-l border-white border-opacity-20">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300 text-sm font-bold">Lv.{totalLevel}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xl text-gray-300">
            Explore infinite AI-generated worlds and endless adventures
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900 bg-opacity-50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* New Game Section */}
          <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Start New Adventure
            </h2>
            
            {!showNewGameForm ? (
              <div className="space-y-4">
                <p className="text-gray-300">
                  Begin a new journey in a unique AI-generated world. Each adventure is different!
                </p>
                <button
                  onClick={() => setShowNewGameForm(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Create New Game
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="Enter adventure name..."
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleNewGame}
                    disabled={!newGameName.trim() || isCreating}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewGameForm(false);
                      setNewGameName('');
                    }}
                    className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Load Game Section */}
          <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Play className="w-6 h-6" />
              Continue Adventure
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="ml-2 text-gray-300">Loading saved games...</span>
              </div>
            ) : savedGames.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No saved adventures found.</p>
                <p className="text-sm mt-2">Create a new game to get started!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {savedGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {game.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-300 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(game.updated_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{saveSystem.formatPlayTime(game.play_time)}</span>
                          </div>
                        </div>
                        <div className="text-xs text-blue-300 mt-1 capitalize">
                          Current area: {game.current_biome}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleLoadGame(game.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Play className="w-4 h-4" />
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.id, game.name)}
                          className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Your adventures are automatically saved as you explore</p>
          {totalLevel > 8 && (
            <p className="mt-1 text-yellow-400">
              Total Level: {totalLevel} • Keep adventuring to grow stronger!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};