import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AlertTriangle,
  RotateCcw,
  Send,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEED_ASSETS, SeedAssetDefinition } from '../data/seedAssets';

type SeedStatus = 'idle' | 'submitting' | 'monitoring' | 'done' | 'error';

interface AssetProgress {
  name: string;
  category: string;
  phase: 'waiting' | 'submitting' | 'submitted' | 'processing' | 'completed' | 'failed' | 'skipped';
  assetId?: string;
  meshyRequestId?: string;
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

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meshy-asset-generator`;
const AUTH_HEADERS = {
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

interface SeedAssetLibraryProps {
  onClose?: () => void;
}

export const SeedAssetLibrary: React.FC<SeedAssetLibraryProps> = ({ onClose }) => {
  const [seedStatus, setSeedStatus] = useState<SeedStatus>('idle');
  const [progress, setProgress] = useState<AssetProgress[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [dbAssets, setDbAssets] = useState<Array<{ name: string; status: string; meshy_request_id: string | null }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const abortRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadExistingAssets();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const loadExistingAssets = async () => {
    const { data } = await supabase
      .from('asset_library')
      .select('name, status, meshy_request_id');
    if (data) setDbAssets(data);
  };

  const isFullySeeded = (name: string): boolean => {
    const match = dbAssets.find(a => a.name === name);
    return !!match && !!match.meshy_request_id;
  };

  const getDbStatus = (name: string): string | null => {
    const match = dbAssets.find(a => a.name === name);
    return match ? match.status : null;
  };

  const getFilteredAssets = useCallback((): SeedAssetDefinition[] => {
    if (selectedCategories.size === 0) return SEED_ASSETS;
    return SEED_ASSETS.filter(a => selectedCategories.has(a.category));
  }, [selectedCategories]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const submitSingleAsset = async (asset: SeedAssetDefinition): Promise<{
    success: boolean;
    assetId?: string;
    meshyRequestId?: string;
    skipped?: boolean;
    error?: string;
  }> => {
    const response = await fetch(EDGE_URL, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        action: 'seed-single',
        name: asset.name,
        prompt: asset.prompt,
        art_style: asset.art_style,
        category: asset.category,
        tags: asset.tags,
        description: asset.description,
      }),
    });

    const data = await response.json();

    if (data.skipped) {
      return { success: true, assetId: data.asset_id, skipped: true };
    }
    if (data.success) {
      return { success: true, assetId: data.asset_id, meshyRequestId: data.meshy_request_id };
    }
    return { success: false, error: data.error || 'Unknown error' };
  };

  const startSeeding = async () => {
    const assetsToSeed = getFilteredAssets().filter(a => !isFullySeeded(a.name));

    if (assetsToSeed.length === 0) {
      setErrorMessage('All selected assets are already generated or in progress.');
      return;
    }

    abortRef.current = false;
    setSeedStatus('submitting');
    setErrorMessage(null);
    setCurrentIndex(0);

    const initialProgress: AssetProgress[] = assetsToSeed.map(a => ({
      name: a.name,
      category: a.category,
      phase: 'waiting',
    }));
    setProgress(initialProgress);

    for (let i = 0; i < assetsToSeed.length; i++) {
      if (abortRef.current) break;

      setCurrentIndex(i);
      setProgress(prev => prev.map((p, idx) =>
        idx === i ? { ...p, phase: 'submitting' } : p
      ));

      try {
        const result = await submitSingleAsset(assetsToSeed[i]);

        setProgress(prev => prev.map((p, idx) => {
          if (idx !== i) return p;
          if (result.skipped) {
            return { ...p, phase: 'skipped', assetId: result.assetId };
          }
          if (result.success) {
            return {
              ...p,
              phase: 'submitted',
              assetId: result.assetId,
              meshyRequestId: result.meshyRequestId,
            };
          }
          return { ...p, phase: 'failed', error: result.error };
        }));
      } catch (err) {
        setProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, phase: 'failed', error: String(err) } : p
        ));
      }

      if (i < assetsToSeed.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setSeedStatus('monitoring');
    startPolling();
  };

  const startPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('asset_library')
        .select('name, status, meshy_request_id');

      if (!data) return;

      setDbAssets(data);

      setProgress(prev => {
        const updated = prev.map(p => {
          if (p.phase === 'completed' || p.phase === 'failed' || p.phase === 'skipped') return p;

          const dbMatch = data.find(d => d.name === p.name);
          if (!dbMatch) return p;

          if (dbMatch.status === 'completed') return { ...p, phase: 'completed' as const };
          if (dbMatch.status === 'failed') return { ...p, phase: 'failed' as const };
          if (dbMatch.meshy_request_id && p.phase === 'submitted') return { ...p, phase: 'processing' as const };
          return p;
        });

        const allDone = updated.every(
          p => p.phase === 'completed' || p.phase === 'failed' || p.phase === 'skipped'
        );

        if (allDone) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setSeedStatus('done');
        }

        return updated;
      });
    }, 6000);
  };

  const retryFailed = async () => {
    const failedItems = progress.filter(p => p.phase === 'failed');
    if (failedItems.length === 0) return;

    setSeedStatus('submitting');
    setErrorMessage(null);

    const failedDefs = failedItems
      .map(f => SEED_ASSETS.find(a => a.name === f.name))
      .filter(Boolean) as SeedAssetDefinition[];

    setProgress(prev => prev.map(p =>
      p.phase === 'failed' ? { ...p, phase: 'waiting', error: undefined } : p
    ));

    for (let i = 0; i < failedDefs.length; i++) {
      if (abortRef.current) break;

      const asset = failedDefs[i];
      setProgress(prev => prev.map(p =>
        p.name === asset.name ? { ...p, phase: 'submitting' } : p
      ));

      try {
        const result = await submitSingleAsset(asset);
        setProgress(prev => prev.map(p => {
          if (p.name !== asset.name) return p;
          if (result.skipped) return { ...p, phase: 'skipped', assetId: result.assetId };
          if (result.success) {
            return {
              ...p,
              phase: 'submitted',
              assetId: result.assetId,
              meshyRequestId: result.meshyRequestId,
            };
          }
          return { ...p, phase: 'failed', error: result.error };
        }));
      } catch (err) {
        setProgress(prev => prev.map(p =>
          p.name === asset.name ? { ...p, phase: 'failed', error: String(err) } : p
        ));
      }

      if (i < failedDefs.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setSeedStatus('monitoring');
    startPolling();
  };

  const categories = [...new Set(SEED_ASSETS.map(a => a.category))];
  const filteredAssets = getFilteredAssets();
  const newAssets = filteredAssets.filter(a => !isFullySeeded(a.name));
  const existingAssets = filteredAssets.filter(a => isFullySeeded(a.name));

  const submittedCount = progress.filter(p => p.phase === 'submitted' || p.phase === 'processing').length;
  const completedCount = progress.filter(p => p.phase === 'completed').length;
  const failedCount = progress.filter(p => p.phase === 'failed').length;
  const skippedCount = progress.filter(p => p.phase === 'skipped').length;
  const totalActive = progress.filter(p => p.phase !== 'skipped').length;

  const isWorking = seedStatus === 'submitting' || seedStatus === 'monitoring';

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
              Generate 3D models one by one using Meshy AI
            </p>
          </div>
        </div>
        {onClose && !isWorking && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {seedStatus === 'idle' && (
        <>
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

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-300">
                {filteredAssets.length} assets selected
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-400">{newAssets.length} new</span>
                {existingAssets.length > 0 && (
                  <span className="text-amber-400">{existingAssets.length} already seeded</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-2">
              {filteredAssets.map(asset => {
                const seeded = isFullySeeded(asset.name);
                const dbStatus = getDbStatus(asset.name);
                return (
                  <div
                    key={asset.name}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                      seeded
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
                    {seeded && (
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                        dbStatus === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : dbStatus === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {dbStatus || 'seeded'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
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
              onClick={loadExistingAssets}
              className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </>
      )}

      {isWorking && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                <span className="text-white font-medium">
                  {seedStatus === 'submitting'
                    ? `Submitting to Meshy... (${currentIndex + 1}/${progress.length})`
                    : `Waiting for models to generate...`}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {completedCount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="w-3 h-3" /> {completedCount}
                  </span>
                )}
                {submittedCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="w-3 h-3" /> {submittedCount}
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3 h-3" /> {failedCount}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-700 ease-out"
                  style={{
                    width: `${((completedCount + failedCount + skippedCount) / Math.max(totalActive, 1)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {completedCount + failedCount + skippedCount} of {progress.length} resolved
                {seedStatus === 'monitoring' && ' -- models generating in background, this page updates automatically'}
              </p>
            </div>

            <ProgressList progress={progress} />
          </div>
        </div>
      )}

      {seedStatus === 'done' && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-medium">Seeding complete</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-400">{completedCount} completed</span>
                {failedCount > 0 && <span className="text-red-400">{failedCount} failed</span>}
                {skippedCount > 0 && <span className="text-gray-400">{skippedCount} skipped</span>}
              </div>
            </div>

            <ProgressList progress={progress} />
          </div>

          <div className="flex gap-3">
            {failedCount > 0 && (
              <button
                onClick={retryFailed}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Retry {failedCount} Failed
              </button>
            )}
            <button
              onClick={() => {
                setSeedStatus('idle');
                setProgress([]);
                loadExistingAssets();
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors"
            >
              Back to overview
            </button>
          </div>
        </div>
      )}

      {seedStatus === 'error' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {errorMessage || 'An error occurred during seeding.'}
          </div>
          <button
            onClick={() => {
              setSeedStatus('idle');
              setProgress([]);
              setErrorMessage(null);
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
};

function ProgressList({ progress }: { progress: AssetProgress[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
      {progress.map(item => (
        <div
          key={item.name}
          className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
            item.phase === 'completed'
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : item.phase === 'failed'
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-slate-800 border-slate-700'
          }`}
        >
          <div className="flex-shrink-0">
            {item.phase === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            {item.phase === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
            {item.phase === 'submitting' && <Send className="w-4 h-4 text-blue-400 animate-pulse" />}
            {(item.phase === 'submitted' || item.phase === 'processing') && (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            )}
            {item.phase === 'waiting' && <Clock className="w-4 h-4 text-gray-500" />}
            {item.phase === 'skipped' && <CheckCircle className="w-4 h-4 text-gray-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{item.name}</p>
            {item.error ? (
              <p className="text-xs text-red-400 truncate">{item.error}</p>
            ) : (
              <p className="text-xs text-gray-500 capitalize">{item.category}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
            item.phase === 'completed' ? 'bg-emerald-500/20 text-emerald-400'
            : item.phase === 'failed' ? 'bg-red-500/20 text-red-400'
            : item.phase === 'submitting' ? 'bg-blue-500/20 text-blue-400'
            : item.phase === 'submitted' || item.phase === 'processing' ? 'bg-amber-500/20 text-amber-400'
            : item.phase === 'skipped' ? 'bg-gray-500/20 text-gray-400'
            : 'bg-gray-500/20 text-gray-500'
          }`}>
            {item.phase === 'submitted' ? 'generating' : item.phase}
          </span>
        </div>
      ))}
    </div>
  );
}
