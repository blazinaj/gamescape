import React, { useState, useEffect } from 'react';
import {
  Compass, Search, Star, User, LogOut, Plus, Play, Sparkles, Library,
  Clock, Trash2, MapPin, TreePine, Castle, Mountain, Wand2, Ship, Cog, Skull,
} from 'lucide-react';
import { SaveSystem, GameSave } from '../services/SaveSystem';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';

interface GameStoreProps {
  onNavigateToPlay: (gameId: string) => void;
  onNavigateToCreate: () => void;
  onNavigateToAssets?: () => void;
}

const THEME_META: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pastoral: { color: 'from-emerald-600 to-green-700', icon: TreePine },
  archaeological: { color: 'from-amber-600 to-yellow-700', icon: Castle },
  survival: { color: 'from-stone-600 to-stone-700', icon: Mountain },
  fantasy: { color: 'from-cyan-600 to-teal-700', icon: Wand2 },
  nautical: { color: 'from-sky-600 to-blue-700', icon: Ship },
  industrial: { color: 'from-orange-600 to-orange-700', icon: Cog },
  apocalyptic: { color: 'from-red-700 to-rose-800', icon: Skull },
  custom: { color: 'from-slate-600 to-slate-700', icon: Sparkles },
  default: { color: 'from-blue-600 to-blue-700', icon: Compass },
};

function getThemeMeta(theme?: string) {
  return THEME_META[theme || 'default'] || THEME_META.default;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export const GameStore: React.FC<GameStoreProps> = ({
  onNavigateToPlay,
  onNavigateToCreate,
  onNavigateToAssets,
}) => {
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const [myWorlds, setMyWorlds] = useState<GameSave[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadWorlds();
  }, []);

  const loadWorlds = async () => {
    setLoading(true);
    const worlds = await SaveSystem.getUserWorlds();
    setMyWorlds(worlds);
    setLoading(false);
  };

  const handleDelete = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this world? This cannot be undone.')) return;
    setDeletingId(gameId);
    const saveSystem = new SaveSystem();
    await saveSystem.deleteGame(gameId);
    setMyWorlds(prev => prev.filter(w => w.id !== gameId));
    setDeletingId(null);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-7 h-7 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Gamescape</h1>
          </div>

          <div className="flex items-center gap-4">
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
        {/* Hero / Create CTA */}
        <div className="relative mb-12 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.08),transparent_70%)]" />
          <div className="relative px-10 py-14 flex items-center justify-between">
            <div className="max-w-lg">
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Your next adventure starts here
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Create a world in seconds. Pick a theme, design your character, and AI handles the rest --
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

        {/* My Worlds */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            My Worlds
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/30 overflow-hidden animate-pulse">
                <div className="h-32 bg-slate-700/50" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-700/50 rounded w-2/3" />
                  <div className="h-4 bg-slate-700/30 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : myWorlds.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-700/60 rounded-2xl bg-slate-900/30">
            <Compass className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-2">No worlds yet</p>
            <p className="text-slate-600 mb-6">Create your first world and start exploring.</p>
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
            {myWorlds.map((world) => {
              const theme = world.scenario_data?.theme || 'default';
              const meta = getThemeMeta(theme);
              const ThemeIcon = meta.icon;
              const isDeleting = deletingId === world.id;

              return (
                <button
                  key={world.id}
                  onClick={() => onNavigateToPlay(world.id)}
                  disabled={isDeleting}
                  className="group bg-slate-800/40 rounded-xl border border-slate-700/30 overflow-hidden hover:border-slate-600/60 transition-all duration-200 hover:shadow-xl hover:shadow-black/20 text-left disabled:opacity-50"
                >
                  <div className={`h-28 bg-gradient-to-br ${meta.color} flex items-center justify-center relative overflow-hidden`}>
                    <ThemeIcon className="w-12 h-12 text-white/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <span className="text-xs font-medium text-white/80 bg-black/30 px-2 py-0.5 rounded-full capitalize">
                        {world.scenario_data?.theme || 'Classic'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors truncate">
                      {world.name}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatPlayTime(world.play_time || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="capitalize">{world.current_biome}</span>
                      </div>
                      <span className="ml-auto text-slate-600">{formatDate(world.updated_at)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/80 group-hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                        <Play className="w-3.5 h-3.5" />
                        Continue
                      </div>

                      <div
                        role="button"
                        onClick={(e) => handleDelete(world.id, e)}
                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete world"
                      >
                        <Trash2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
