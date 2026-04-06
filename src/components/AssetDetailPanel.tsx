import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Clock,
  TrendingUp,
  Tag,
  Bone,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileBox,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import type { Asset } from '../services/AssetLibraryService';
import {
  checkAnimationProgress,
  startRigging,
  type AnimationProgress,
} from '../services/CharacterAnimationService';

interface AssetDetailPanelProps {
  asset: Asset;
  onClose: () => void;
  onApply?: (asset: Asset) => void;
}

interface RiggingMeta {
  task_id?: string;
  status?: string;
  rigged_glb_url?: string;
  rigged_fbx_url?: string;
  basic_animations?: Record<string, string>;
  error?: string;
}

interface AnimationMeta {
  task_id?: string;
  status?: string;
  glb_url?: string;
  fbx_url?: string;
  action_id?: number;
  error?: string;
}

export const AssetDetailPanel: React.FC<AssetDetailPanelProps> = ({
  asset,
  onClose,
  onApply,
}) => {
  const [animProgress, setAnimProgress] = useState<AnimationProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [rigging, setRigging] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const metadata = asset.metadata || {};
  const riggingMeta: RiggingMeta = metadata.rigging || {};
  const animationsMeta: Record<string, AnimationMeta> = metadata.animations || {};
  const formats = metadata.formats || {};

  const isCharacter = asset.tags?.includes('character');
  const hasRigging = !!riggingMeta.task_id;
  const riggingComplete = riggingMeta.status === 'SUCCEEDED';
  const hasAnimations = Object.keys(animationsMeta).length > 0;

  useEffect(() => {
    if (hasRigging && !riggingComplete) {
      refreshAnimationProgress();
    }
  }, [asset.id]);

  const refreshAnimationProgress = async () => {
    setLoadingProgress(true);
    try {
      const progress = await checkAnimationProgress(asset.id);
      setAnimProgress(progress);
    } catch {
      // silent
    }
    setLoadingProgress(false);
  };

  const handleStartRigging = async () => {
    setRigging(true);
    try {
      await startRigging(asset.id);
      await refreshAnimationProgress();
    } catch {
      // silent
    }
    setRigging(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const completedAnims = Object.values(animationsMeta).filter(
    a => a.status === 'SUCCEEDED'
  ).length;
  const totalAnims = Object.keys(animationsMeta).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-slate-900 border-l border-slate-700/60 shadow-2xl h-full overflow-y-auto animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3 min-w-0">
              <FileBox className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white truncate">{asset.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Preview */}
          <div className="aspect-square bg-slate-800 rounded-xl overflow-hidden relative">
            {asset.preview_url ? (
              <img
                src={asset.preview_url}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-slate-700" />
              </div>
            )}
            <StatusBadge status={asset.status} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {asset.file_url && asset.status === 'completed' && onApply && (
              <button
                onClick={() => onApply(asset)}
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Play className="w-4 h-4" />
                Apply to Character
              </button>
            )}
            {asset.file_url && (
              <a
                href={asset.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                GLB
              </a>
            )}
          </div>

          {/* Rig & Animate Action */}
          {isCharacter && asset.status === 'completed' && !hasRigging && (
            <button
              onClick={handleStartRigging}
              disabled={rigging}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
            >
              {rigging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting Rigging...
                </>
              ) : (
                <>
                  <Bone className="w-4 h-4" />
                  Rig & Generate Animations
                </>
              )}
            </button>
          )}

          {/* Rigging Section */}
          {hasRigging && (
            <Section title="Rigging" icon={<Bone className="w-4 h-4 text-blue-400" />}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Status</span>
                  <AnimationStatusChip status={riggingMeta.status || 'PENDING'} />
                </div>
                {riggingMeta.rigged_glb_url && (
                  <UrlRow
                    label="Rigged GLB"
                    url={riggingMeta.rigged_glb_url}
                    copiedField={copiedField}
                    onCopy={copyToClipboard}
                  />
                )}
                {riggingMeta.rigged_fbx_url && (
                  <UrlRow
                    label="Rigged FBX"
                    url={riggingMeta.rigged_fbx_url}
                    copiedField={copiedField}
                    onCopy={copyToClipboard}
                  />
                )}
              </div>
            </Section>
          )}

          {/* Animations Section */}
          {(hasAnimations || (animProgress && Object.keys(animProgress.animations).length > 0)) && (
            <Section
              title={`Animations ${totalAnims > 0 ? `(${completedAnims}/${totalAnims})` : ''}`}
              icon={<Play className="w-4 h-4 text-teal-400" />}
              action={
                <button
                  onClick={refreshAnimationProgress}
                  disabled={loadingProgress}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {loadingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Refresh'}
                </button>
              }
            >
              <div className="space-y-2">
                {Object.entries(animationsMeta).map(([name, anim]) => (
                  <AnimationRow
                    key={name}
                    name={name}
                    anim={anim}
                    copiedField={copiedField}
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Model Formats */}
          {Object.keys(formats).length > 0 && (
            <Section title="Model Formats" icon={<FileBox className="w-4 h-4 text-cyan-400" />}>
              <div className="space-y-2">
                {Object.entries(formats).map(([fmt, url]) =>
                  url ? (
                    <UrlRow
                      key={fmt}
                      label={fmt.toUpperCase()}
                      url={url as string}
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                  ) : null
                )}
              </div>
            </Section>
          )}

          {/* Details */}
          <Section title="Details" icon={<Tag className="w-4 h-4 text-amber-400" />}>
            <div className="space-y-3">
              {asset.prompt && (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Prompt</span>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{asset.prompt}</p>
                </div>
              )}
              {asset.description && (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</span>
                  <p className="text-sm text-slate-300 mt-1">{asset.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <MetaItem icon={<TrendingUp className="w-3.5 h-3.5" />} label="Uses" value={String(asset.usage_count)} />
                <MetaItem icon={<Clock className="w-3.5 h-3.5" />} label="Created" value={new Date(asset.created_at).toLocaleDateString()} />
                {metadata.art_style && (
                  <MetaItem icon={<Sparkles className="w-3.5 h-3.5" />} label="Style" value={metadata.art_style} />
                )}
                {metadata.model_type && (
                  <MetaItem icon={<FileBox className="w-3.5 h-3.5" />} label="Type" value={metadata.model_type} />
                )}
              </div>
            </div>
          </Section>

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700/50 text-slate-400 text-xs rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Asset ID */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-mono truncate">{asset.id}</span>
              <button
                onClick={() => copyToClipboard(asset.id, 'asset-id')}
                className="hover:text-slate-400 transition-colors flex-shrink-0"
              >
                {copiedField === 'asset-id' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-emerald-500/90',
    pending: 'bg-amber-500/90',
    failed: 'bg-red-500/90',
  };
  return (
    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-semibold text-white ${styles[status] || 'bg-slate-600'}`}>
      {status}
    </span>
  );
}

function AnimationStatusChip({ status }: { status: string }) {
  if (status === 'SUCCEEDED') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
        <CheckCircle className="w-3 h-3" /> Complete
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-md">
        <AlertCircle className="w-3 h-3" /> Failed
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
      <Loader2 className="w-3 h-3 animate-spin" /> {status || 'Pending'}
    </span>
  );
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function AnimationRow({
  name,
  anim,
  copiedField,
  onCopy,
}: {
  name: string;
  anim: AnimationMeta;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const isComplete = anim.status === 'SUCCEEDED';
  const isFailed = anim.status === 'FAILED';

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg ${
      isComplete ? 'bg-emerald-500/5' : isFailed ? 'bg-red-500/5' : 'bg-slate-800/60'
    }`}>
      <div className="flex-shrink-0">
        {isComplete ? (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        ) : isFailed ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : (
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
        )}
      </div>
      <span className="text-sm font-medium text-slate-300 capitalize flex-1">{name}</span>
      {anim.glb_url && (
        <div className="flex items-center gap-1">
          <a
            href={anim.glb_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-slate-500 hover:text-teal-400 transition-colors"
            title="Open GLB"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => onCopy(anim.glb_url!, `anim-${name}`)}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            title="Copy URL"
          >
            {copiedField === `anim-${name}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      {isFailed && anim.error && (
        <span className="text-xs text-red-400/70 truncate max-w-[120px]" title={anim.error}>
          {anim.error}
        </span>
      )}
    </div>
  );
}

function UrlRow({
  label,
  url,
  copiedField,
  onCopy,
}: {
  label: string;
  url: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const fieldKey = `url-${label}`;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-slate-500 hover:text-teal-400 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={() => onCopy(url, fieldKey)}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {copiedField === fieldKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1 px-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
        >
          <Download className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">{icon}</span>
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-300 capitalize">{value}</span>
    </div>
  );
}
