import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Box,
  TreePine,
  Castle,
  Gem,
  Sword,
  Mountain,
  Lamp,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEED_ASSETS, SeedAssetDefinition } from '../data/seedAssets';

type SeedStatus = 'idle' | 'seeding' | 'done' | 'error';

interface AssetStatus {
  name: string;
  category: string;
  status: 'pending' | 'queued' | 'completed' | 'failed' | 'skipped' | 'waiting';
  assetId?: string;
  error?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  character: <Box className="w-4 h-4" />,
  vegetation: <TreePine className="w-4 h-4" />,
  structure: <Castle className="w-4 h-4" />,
  item: <Gem className="w-4 h-4" />,
  weapon: <Sword className="w-4 h-4" />,
  terrain: <Mountain className="w-4 h-4" />,
  prop: <Lamp className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  character: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  vegetation: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  structure: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  item: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  weapon: 'bg-red-500/20 text-red-300 border-red-500/30',
  terrain: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
  prop: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

interface SeedAssetLibraryProps {
  onClose?: () => void;
}

export const SeedAssetLibrary: React.FC<SeedAssetLibraryProps> = ({ onClose }) => {
  const [seedStatus, setSeedStatus] = useState<SeedStatus>('idle');
  const [assetStatuses, setAssetStatuses] = useState<AssetStatus[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [dbAssets, setDbAssets] = useState<Array<{ name: string; status: string }>>([]);
  const [pollingActive, setPollingActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    checkExistingAssets();
  }, []);

  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(() => {
      refreshAssetStatuses();
    }, 5000);

    return () => clearInterval(interval);
  }, [pollingActive]);

  const checkExistingAssets = async () => {
    const { data } = await supabase
      .from('asset_library')
      .select('name, status');

    if (data) {
      setDbAssets(data);
    }
  };

  const refreshAssetStatuses = useCallback(async () => {
    const { data } = await supabase
      .from('asset_library')
      .select('name, status');

    if (!data) return;

    setDbAssets(data);

    setAssetStatuses(prev => {
      const updated = prev.map(a => {
        const dbMatch = data.find(d => d.name === a.name);
        if (dbMatch) {
          return { ...a, status: dbMatch.status as AssetStatus['status'] };
        }
        return a;
      });

      const allDone = updated.every(
        a => a.status === 'completed' || a.status === 'failed' || a.status === 'skipped'
      );
      if (allDone && updated.length > 0) {
        setPollingActive(false);
        setSeedStatus('done');
      }

      return updated;
    });
  }, []);

  const getFilteredAssets = (): SeedAssetDefinition[] => {
    if (selectedCategories.size === 0) return SEED_ASSETS;
    return SEED_ASSETS.filter(a => selectedCategories.has(a.category));
  };

  const isAlreadyInDb = (name: string): boolean => {
    return dbAssets.some(a => a.name === name);
  };

  const getDbStatus = (name: string): string | null => {
    const match = dbAssets.find(a => a.name === name);
    return match ? match.status : null;
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const startSeeding = async () => {
    const assetsToSeed = getFilteredAssets().filter(a => !isAlreadyInDb(a.name));

    if (assetsToSeed.length === 0) {
      setErrorMessage('All selected assets already exist in the library.');
      return;
    }

    setSeedStatus('seeding');
    setErrorMessage(null);

    const initialStatuses: AssetStatus[] = assetsToSeed.map(a => ({
      name: a.name,
      category: a.category,
      status: 'waiting',
    }));

    const skippedStatuses: AssetStatus[] = getFilteredAssets()
      .filter(a => isAlreadyInDb(a.name))
      .map(a => ({
        name: a.name,
        category: a.category,
        status: 'skipped' as const,
      }));

    setAssetStatuses([...initialStatuses, ...skippedStatuses]);

    try {
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meshy-asset-generator`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'seed-library',
          assets: assetsToSeed,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Seed request failed');
      }

      const result = await response.json();

      setAssetStatuses(prev =>
        prev.map(a => {
          const match = result.results?.find((r: { name: string }) => r.name === a.name);
          if (match) {
            if (match.error?.includes('Already exists')) {
              return { ...a, status: 'skipped', assetId: match.asset_id };
            }
            return {
              ...a,
              status: match.status === 'queued' ? 'pending' : 'failed',
              assetId: match.asset_id,
              error: match.error,
            };
          }
          return a;
        })
      );

      setPollingActive(true);
    } catch (err) {
      setSeedStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to seed library');
    }
  };

  const categories = [...new Set(SEED_ASSETS.map(a => a.category))];
  const filteredAssets = getFilteredAssets();
  const newAssets = filteredAssets.filter(a => !isAlreadyInDb(a.name));
  const existingAssets = filteredAssets.filter(a => isAlreadyInDb(a.name));

  const completedCount = assetStatuses.filter(a => a.status === 'completed').length;
  const pendingCount = assetStatuses.filter(a => a.status === 'pending').length;
  const failedCount = assetStatuses.filter(a => a.status === 'failed').length;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Seed Asset Library</h2>
            <p className="text-sm text-gray-400">
              Generate a starter collection of 3D models using Meshy AI
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        )}
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-3">Filter by category:</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const isSelected = selectedCategories.has(cat);
            const count = SEED_ASSETS.filter(a => a.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  isSelected
                    ? CATEGORY_COLORS[cat] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    : 'bg-slate-800/50 text-gray-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {CATEGORY_ICONS[cat]}
                <span className="capitalize">{cat}</span>
                <span className="text-xs opacity-60">({count})</span>
              </button>
            );
          })}
          {selectedCategories.size > 0 && (
            <button
              onClick={() => setSelectedCategories(new Set())}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {seedStatus === 'idle' && (
        <>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-300">
                {filteredAssets.length} assets selected
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-400">{newAssets.length} new</span>
                {existingAssets.length > 0 && (
                  <span className="text-amber-400">{existingAssets.length} already exist</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-2">
              {filteredAssets.map(asset => {
                const exists = isAlreadyInDb(asset.name);
                const dbStatus = getDbStatus(asset.name);
                return (
                  <div
                    key={asset.name}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                      exists
                        ? 'bg-slate-800/30 border-slate-700/50 opacity-60'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${CATEGORY_COLORS[asset.category]?.split(' ')[1] || 'text-gray-400'}`}>
                      {CATEGORY_ICONS[asset.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{asset.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{asset.category}</p>
                    </div>
                    {exists && (
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                        dbStatus === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : dbStatus === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {dbStatus || 'exists'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={startSeeding}
              disabled={newAssets.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30"
            >
              <Play className="w-4 h-4" />
              Generate {newAssets.length} Assets
            </button>
            <button
              onClick={checkExistingAssets}
              className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </>
      )}

      {(seedStatus === 'seeding' || seedStatus === 'done' || seedStatus === 'error') && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {seedStatus === 'seeding' && (
                  <>
                    <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                    <span className="text-white font-medium">Generating assets...</span>
                  </>
                )}
                {seedStatus === 'done' && (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-medium">Seeding complete</span>
                  </>
                )}
                {seedStatus === 'error' && (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-white font-medium">Seeding error</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs">
                {completedCount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="w-3 h-3" /> {completedCount} done
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="w-3 h-3" /> {pendingCount} processing
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3 h-3" /> {failedCount} failed
                  </span>
                )}
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="mb-4">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                    style={{
                      width: `${((completedCount + failedCount) / Math.max(assetStatuses.filter(a => a.status !== 'skipped').length, 1)) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Models are generating in the background. This page will update automatically.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
              {assetStatuses
                .filter(a => a.status !== 'skipped')
                .map(asset => (
                  <div
                    key={asset.name}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800 border border-slate-700"
                  >
                    <div className="flex-shrink-0">
                      {asset.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                      {asset.status === 'failed' && (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      {asset.status === 'pending' && (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      )}
                      {(asset.status === 'waiting' || asset.status === 'queued') && (
                        <Clock className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{asset.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{asset.category}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      asset.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : asset.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : asset.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {seedStatus === 'done' && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSeedStatus('idle');
                  setAssetStatuses([]);
                  checkExistingAssets();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors"
              >
                Back to overview
              </button>
            </div>
          )}

          {seedStatus === 'error' && (
            <button
              onClick={() => {
                setSeedStatus('idle');
                setAssetStatuses([]);
                setErrorMessage(null);
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
};
