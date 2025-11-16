import React, { useState, useEffect } from 'react';
import { Store, Search, TrendingUp, Star, User, Wallet, LogOut, Code2 } from 'lucide-react';
import { gameStoreService } from '../services/GameStoreService';
import { GameStoreItem } from '../types/PlatformTypes';
import { useProfile } from '../hooks/useProfile';
import { useGrindWallet } from '../hooks/useGrindWallet';
import { useAuth } from '../hooks/useAuth';

interface GameStoreProps {
  onNavigateToPlay: (gameId: string) => void;
  onNavigateToDevelop: () => void;
}

export const GameStore: React.FC<GameStoreProps> = ({
  onNavigateToPlay,
  onNavigateToDevelop,
}) => {
  const { profile, isDeveloper, upgradeToDeveloper } = useProfile();
  const { wallet, formatAmount } = useGrindWallet();
  const { signOut } = useAuth();
  const [featuredGames, setFeaturedGames] = useState<GameStoreItem[]>([]);
  const [allGames, setAllGames] = useState<GameStoreItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'all' | 'owned'>('featured');
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    const [featured, all] = await Promise.all([
      gameStoreService.getFeaturedGames(6),
      gameStoreService.getPublishedGames({ sortBy: 'recent', limit: 20 }),
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
    setActiveTab('all');
  };

  const handleUpgradeToDeveloper = async () => {
    setIsUpgrading(true);
    const success = await upgradeToDeveloper();
    if (success) {
      onNavigateToDevelop();
    }
    setIsUpgrading(false);
  };

  const renderGameCard = (item: GameStoreItem) => (
    <div
      key={item.project.id}
      className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-blue-500 transition-colors"
    >
      <div className="aspect-video bg-slate-700 flex items-center justify-center">
        {item.project.thumbnail_url ? (
          <img
            src={item.project.thumbnail_url}
            alt={item.project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Store className="w-16 h-16 text-slate-600" />
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{item.project.title}</h3>
        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
          {item.project.description || 'No description available'}
        </p>

        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-slate-300">{item.project.average_rating.toFixed(1)}</span>
          </div>
          <div className="text-slate-400">
            {item.project.total_plays.toLocaleString()} plays
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            {item.listing.is_free ? (
              <span className="text-green-400 font-semibold">Free</span>
            ) : (
              <span className="text-blue-400 font-semibold">
                {formatAmount(item.listing.price_grind)}
              </span>
            )}
          </div>

          <button
            onClick={() => onNavigateToPlay(item.project.id)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            Play Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <header className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Gamescape Store</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
              <Wallet className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">
                {formatAmount(wallet?.balance || 0)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
              <User className="w-5 h-5 text-slate-400" />
              <span className="text-white">{profile?.username}</span>
            </div>

            {isDeveloper ? (
              <button
                onClick={onNavigateToDevelop}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Code2 className="w-5 h-5" />
                <span>Developer</span>
              </button>
            ) : (
              <button
                onClick={handleUpgradeToDeveloper}
                disabled={isUpgrading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Code2 className="w-5 h-5" />
                <span>{isUpgrading ? 'Upgrading...' : 'Become Developer'}</span>
              </button>
            )}

            <button
              onClick={signOut}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'featured'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Featured</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Games
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">Loading games...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'featured'
              ? featuredGames.map(renderGameCard)
              : allGames.map(renderGameCard)}
          </div>
        )}

        {!loading && allGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No games found</p>
          </div>
        )}
      </div>
    </div>
  );
};
