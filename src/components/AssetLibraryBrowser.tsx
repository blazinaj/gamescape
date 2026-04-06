import React, { useState, useEffect } from 'react';
import { Library, Search, Download, TrendingUp, Clock } from 'lucide-react';

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
}

interface AssetLibraryBrowserProps {
  onAssetSelect?: (asset: Asset) => void;
}

export const AssetLibraryBrowser: React.FC<AssetLibraryBrowserProps> = ({ onAssetSelect }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load assets from library
    loadAssets();
  }, []);

  useEffect(() => {
    // Filter and sort assets
    let filtered = assets.filter(asset => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch && asset.asset_type === 'model';
    });

    if (sortBy === 'popular') {
      filtered.sort((a, b) => b.usage_count - a.usage_count);
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredAssets(filtered);
  }, [assets, searchQuery, sortBy]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, this would load from the Supabase library
      // In a real implementation, you'd call an API endpoint
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Placeholder - actual implementation would query asset_library table
      setAssets([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Library className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Asset Library</h2>
          <span className="ml-auto px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
            {filteredAssets.length} assets
          </span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets by name, description, or tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-400"
          >
            <option value="popular">Most Used</option>
            <option value="recent">Recently Added</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full" />
          </div>
          <p className="text-gray-400 mt-4">Loading asset library...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400">
          {error}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <Library className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {searchQuery
              ? 'No assets match your search. Try generating a new character!'
              : 'No assets in the library yet. Start by generating a character!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => onAssetSelect?.(asset)}
            >
              {asset.preview_url && (
                <div className="aspect-square bg-slate-900 overflow-hidden">
                  <img
                    src={asset.preview_url}
                    alt={asset.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform"
                  />
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold text-white mb-2 truncate">{asset.name}</h3>

                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{asset.prompt}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {asset.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {asset.tags.length > 3 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">
                      +{asset.tags.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {asset.usage_count} uses
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(asset.created_at).toLocaleDateString()}
                  </div>
                </div>

                {asset.file_url && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      window.open(asset.file_url, '_blank');
                    }}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
