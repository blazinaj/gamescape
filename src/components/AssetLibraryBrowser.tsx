import React, { useState, useEffect } from 'react';
import { Library, Search, Download, TrendingUp, Clock, Database, RefreshCw, Filter, Bone, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SeedAssetLibrary } from './SeedAssetLibrary';
import { AssetDetailPanel } from './AssetDetailPanel';

interface Asset {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  file_url: string | null;
  preview_url: string | null;
  usage_count: number;
  tags: string[];
  created_at: string;
  asset_type: 'model' | 'animation' | 'texture';
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

interface AssetLibraryBrowserProps {
  onAssetSelect?: (asset: Asset) => void;
}

type ViewMode = 'library' | 'seed';
type FilterType = 'all' | 'model' | 'animation' | 'texture';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';

export const AssetLibraryBrowser: React.FC<AssetLibraryBrowserProps> = ({ onAssetSelect }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('asset_library')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setAssets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets
    .filter(asset => {
      if (typeFilter !== 'all' && asset.asset_type !== typeFilter) return false;
      if (statusFilter !== 'all' && asset.status !== statusFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(q) ||
          asset.prompt.toLowerCase().includes(q) ||
          asset.tags.some(tag => tag.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.usage_count - a.usage_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const completedCount = assets.filter(a => a.status === 'completed').length;
  const pendingCount = assets.filter(a => a.status === 'pending').length;

  if (viewMode === 'seed') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <SeedAssetLibrary onClose={() => {
          setViewMode('library');
          loadAssets();
        }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Library className="w-6 h-6 text-teal-400" />
          <h2 className="text-2xl font-bold text-white">Asset Library</h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-3 py-1 bg-teal-600/20 text-teal-300 border border-teal-500/30 rounded-full text-sm">
              {completedCount} ready
            </span>
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-full text-sm">
                {pendingCount} generating
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, prompt, or tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'popular' | 'recent')}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500 transition-colors"
          >
            <option value="recent">Newest First</option>
            <option value="popular">Most Used</option>
          </select>

          <button
            onClick={loadAssets}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-gray-300 hover:text-white hover:border-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('seed')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-teal-500/10"
          >
            <Database className="w-4 h-4" />
            Seed Library
          </button>
          {typeFilter !== 'all' && (
            <button
              onClick={() => setTypeFilter('all')}
              className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-gray-300 rounded-xl text-sm hover:bg-slate-600 transition-colors"
            >
              <Filter className="w-3 h-3" />
              Clear type filter
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin mb-4">
            <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full" />
          </div>
          <p className="text-gray-400">Loading asset library...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-16">
          <Library className="w-14 h-14 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">
            {searchQuery
              ? 'No assets match your search.'
              : 'No assets in the library yet.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setViewMode('seed')}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-medium transition-all"
            >
              Seed Library with Starter Assets
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => {
            const meta = asset.metadata || {};
            const hasRig = !!meta.rigging?.task_id;
            const rigDone = meta.rigging?.status === 'SUCCEEDED';
            const anims = meta.animations || {};
            const animsDone = Object.values(anims).filter((a: any) => a.status === 'SUCCEEDED').length;
            const animsTotal = Object.keys(anims).length;

            return (
              <div
                key={asset.id}
                className="group bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-teal-500/50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-teal-500/5"
                onClick={() => setSelectedAsset(asset)}
              >
                <div className="aspect-square bg-slate-900 overflow-hidden relative">
                  {asset.preview_url ? (
                    <img
                      src={asset.preview_url}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Library className="w-12 h-12 text-gray-700" />
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium ${
                    asset.status === 'completed'
                      ? 'bg-emerald-500/90 text-white'
                      : asset.status === 'pending'
                      ? 'bg-amber-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}>
                    {asset.status}
                  </div>
                  {/* Rigging / Animation badges */}
                  <div className="absolute bottom-2 left-2 flex gap-1.5">
                    {hasRig && (
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        rigDone ? 'bg-blue-500/90 text-white' : 'bg-amber-500/80 text-white'
                      }`}>
                        <Bone className="w-2.5 h-2.5" />
                        {rigDone ? 'Rigged' : 'Rigging'}
                      </span>
                    )}
                    {animsTotal > 0 && (
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        animsDone === animsTotal ? 'bg-teal-500/90 text-white' : 'bg-amber-500/80 text-white'
                      }`}>
                        <Play className="w-2.5 h-2.5" />
                        {animsDone}/{animsTotal}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1.5 truncate group-hover:text-teal-300 transition-colors">
                    {asset.name}
                  </h3>

                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{asset.prompt}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {asset.tags.slice(0, 4).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-700/50 text-gray-400 text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 4 && (
                      <span className="px-2 py-0.5 text-gray-600 text-xs">
                        +{asset.tags.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {asset.usage_count} uses
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(asset.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {asset.file_url && asset.status === 'completed' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        window.open(asset.file_url!, '_blank');
                      }}
                      className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download GLB
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAsset && (
        <AssetDetailPanel
          asset={selectedAsset as any}
          onClose={() => setSelectedAsset(null)}
          onApply={(a) => {
            onAssetSelect?.(a as any);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
};
