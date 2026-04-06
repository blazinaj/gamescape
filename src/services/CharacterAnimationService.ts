export interface AnimationUrls {
  idle?: string;
  walk?: string;
  run?: string;
  attack?: string;
  death?: string;
}

export interface AnimationProgress {
  asset_id: string;
  overall_status: 'pending' | 'rigging' | 'animating' | 'completed' | 'partial' | 'failed';
  rigging: {
    status: string;
    rigged_glb_url?: string;
  };
  animations: Record<string, { status: string; glb_url?: string }>;
  progress: {
    completed: number;
    total: number;
  };
}

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meshy-asset-generator`;
const AUTH_HEADERS = {
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

async function callEdgeFunction(body: Record<string, unknown>) {
  const response = await fetch(EDGE_FN_URL, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Edge function request failed');
  }

  return response.json();
}

export async function startRigging(assetId: string): Promise<{ rigTaskId: string }> {
  const data = await callEdgeFunction({
    action: 'rig-model',
    asset_id: assetId,
  });

  if (!data.success) {
    throw new Error(data.error || 'Failed to start rigging');
  }

  return { rigTaskId: data.rig_task_id };
}

export async function checkAnimationProgress(assetId: string): Promise<AnimationProgress> {
  return callEdgeFunction({
    action: 'check-animation-progress',
    asset_id: assetId,
  });
}

export function extractAnimationUrls(progress: AnimationProgress): AnimationUrls {
  const urls: AnimationUrls = {};

  for (const [name, data] of Object.entries(progress.animations)) {
    if (data.status === 'SUCCEEDED' && data.glb_url) {
      (urls as Record<string, string>)[name] = data.glb_url;
    }
  }

  return urls;
}

export async function pollAnimationProgress(
  assetId: string,
  onProgress: (progress: AnimationProgress) => void,
  maxAttempts = 180,
  interval = 5000
): Promise<AnimationProgress> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const progress = await checkAnimationProgress(assetId);
      onProgress(progress);

      if (progress.overall_status === 'completed' || progress.overall_status === 'partial') {
        return progress;
      }

      if (progress.overall_status === 'failed') {
        return progress;
      }
    } catch (e) {
      console.warn('Animation progress check failed:', e);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Animation progress polling timeout');
}
