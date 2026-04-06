import React, { useState, useEffect } from 'react';
import {
  Compass, Search, Star, User, LogOut, Plus, Play, Sparkles, Library,
} from 'lucide-react';
import { gameStoreService } from '../services/GameStoreService';
import { GameStoreItem } from '../types/PlatformTypes';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';

interface GameStoreProps {
  onNavigateToPlay: (gameId: string) => void;
  onNavigateToCreate: () => void;
  onNavigateToAssets?: () => void;
}

export const GameStore: React.FC<GameStoreProps> = ({
  onNavigateToPlay,
  onNavigateToCreate,
  onNavigateToAssets,
}) => {
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const [featuredGames, setFeaturedGames] = useState<GameStoreItem[]>([]);
  const [allGames, setAllGames] = useState<GameStoreItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    const [featured, all] = await Promise.all([
      gameStoreService.getFeaturedGames(6),
      gameStoreService.getPublishedGames({ sortBy: 'popular', limit: 20 }),
    ]);
    setFeaturedGames(featured);
    setAllGames(all);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadGames();
      return;
    }
    const results = await gameStoreService.searchGames(searchTerm, 20);
    setAllGames(results);
  };

  const displayGames = searchTerm.trim() ? allGames : featuredGames;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-7 h-7 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Gamescape</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search worlds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56 text-sm"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            </div>

            {onNavigateToAssets && (
              <button
                onClick={onNavigateToAssets}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg transition-colors"
                title="Asset Library"
              >
                <Library className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-slate-300 hidden sm:inline">Assets</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-lg">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">{profile?.username || 'Player'}</span>
            </div>

            <button
              onClick={signOut}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-slate-500 hover:text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="relative mb-14 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.08),transparent_70%)]" />
          <div className="relative px-10 py-14 flex items-center justify-between">
            <div className="max-w-lg">
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Your next adventure starts here
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Create a world in seconds. Pick a theme, name it, and AI handles the rest --
                terrain, NPCs, quests, and everything in between.
              </p>
              <button
                onClick={onNavigateToCreate}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5" />
                Create a New World
              </button>
            </div>
            <div className="hidden lg:flex items-center">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-20 h-20 text-blue-500/40" />
              </div>
            </div>
          </div>
        </div>

        {!searchTerm.trim() && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Community Worlds
            </h3>
          </div>
        )}

        {searchTerm.trim() && (
          <div className="mb-6">
            <p className="text-slate-400">
              Results for "<span className="text-white">{searchTerm}</span>"
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/30 overflow-hidden animate-pulse">
                <div className="aspect-video bg-slate-700/50" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-700/50 rounded w-2/3" />
                  <div className="h-4 bg-slate-700/30 rounded w-full" />
                  <div className="h-4 bg-slate-700/30 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayGames.length === 0 ? (
          <div className="text-center py-20">
            <Compass className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-2">
              {searchTerm ? 'No worlds match your search' : 'No community worlds yet'}
            </p>
            <p className="text-slate-600 mb-6">Be the first to create one!</p>
            <button
              onClick={onNavigateToCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create World
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayGames.map((item) => (
              <div
                key={item.project.id}
                className="group bg-slate-800/40 rounded-xl border border-slate-700/30 overflow-hidden hover:border-slate-600/60 transition-all duration-200 hover:shadow-xl hover:shadow-black/20"
              >
                <div className="aspect-video bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center relative overflow-hidden">
                  <Compass className="w-12 h-12 text-slate-600 group-hover:text-slate-500 transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                </div>

                <div className="p-5">
                  <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-blue-300 transition-colors">
                    {item.project.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                    {item.project.description || 'An AI-generated adventure awaits'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{item.project.average_rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        <span>{item.project.total_plays.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToPlay(item.project.id)}
                      className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Play
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
