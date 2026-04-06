import { useState, useCallback } from 'react';
import {
  AnimationProgress,
  AnimationUrls,
  pollAnimationProgress,
  extractAnimationUrls,
  startRigging,
} from '../services/CharacterAnimationService';

export interface GeneratedCharacter {
  assetId: string;
  meshyRequestId: string;
  status: 'pending' | 'completed' | 'failed';
  modelUrl?: string;
  previewUrl?: string;
  estimatedTime?: string;
}

export type GenerationPhase =
  | 'idle'
  | 'generating'
  | 'model_complete'
  | 'rigging'
  | 'animating'
  | 'completed'
  | 'failed';

export interface CharacterGenerationRequest {
  description: string;
  artStyle?: 'realistic' | 'stylized' | 'cartoon' | 'anime';
  userId?: string;
}

interface UseCharacterGenerationState {
  generating: boolean;
  character: GeneratedCharacter | null;
  error: string | null;
  progress: GenerationPhase;
  animationProgress: AnimationProgress | null;
  animationUrls: AnimationUrls | null;
}

export const useCharacterGeneration = () => {
  const [state, setState] = useState<UseCharacterGenerationState>({
    generating: false,
    character: null,
    error: null,
    progress: 'idle',
    animationProgress: null,
    animationUrls: null,
  });

  const generateCharacter = useCallback(
    async (request: CharacterGenerationRequest) => {
      setState(prev => ({
        ...prev,
        generating: true,
        error: null,
        progress: 'generating',
        animationProgress: null,
        animationUrls: null,
      }));

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase configuration missing');
        }

        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/meshy-asset-generator`;

        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'generate-model',
            prompt: request.description,
            art_style: request.artStyle || 'realistic',
            asset_category: 'character',
            user_id: request.userId,
            name: `Character: ${request.description.substring(0, 50)}`,
            description: `AI-generated character from prompt: ${request.description}`,
            tags: ['character', request.artStyle || 'realistic', 'player-generated'],
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(`Generation failed: ${err.error}`);
        }

        const data = await response.json();
        const character: GeneratedCharacter = {
          assetId: data.asset_id,
          meshyRequestId: data.meshy_request_id,
          status: 'pending',
          estimatedTime: '2-5 minutes',
        };

        setState(prev => ({
          ...prev,
          character,
          generating: true,
          progress: 'generating',
        }));

        pollForModelCompletion(character, setState);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          generating: false,
          progress: 'failed',
        }));
      }
    },
    []
  );

  const triggerRigging = useCallback(async (assetId: string) => {
    setState(prev => ({ ...prev, progress: 'rigging', generating: true }));

    try {
      await startRigging(assetId);

      const finalProgress = await pollAnimationProgress(
        assetId,
        (progress) => {
          const phase: GenerationPhase =
            progress.overall_status === 'rigging' ? 'rigging' :
            progress.overall_status === 'animating' ? 'animating' :
            progress.overall_status === 'completed' ? 'completed' :
            progress.overall_status === 'partial' ? 'completed' :
            progress.overall_status === 'failed' ? 'failed' : 'animating';

          setState(prev => ({
            ...prev,
            progress: phase,
            animationProgress: progress,
          }));
        }
      );

      const urls = extractAnimationUrls(finalProgress);

      setState(prev => ({
        ...prev,
        generating: false,
        progress: finalProgress.overall_status === 'failed' ? 'failed' : 'completed',
        animationProgress: finalProgress,
        animationUrls: Object.keys(urls).length > 0 ? urls : null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Rigging failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        generating: false,
        progress: 'failed',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      generating: false,
      character: null,
      error: null,
      progress: 'idle',
      animationProgress: null,
      animationUrls: null,
    });
  }, []);

  return {
    ...state,
    generateCharacter,
    triggerRigging,
    reset,
  };
};

async function pollForModelCompletion(
  character: GeneratedCharacter,
  setState: React.Dispatch<React.SetStateAction<UseCharacterGenerationState>>,
  maxAttempts = 60,
  interval = 5000
) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/meshy-asset-generator`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'check-status',
            meshyRequestId: character.meshyRequestId,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to check status');

      const data = await response.json();

      if (data.status === 'SUCCEEDED') {
        setState(prev => ({
          ...prev,
          character: prev.character
            ? {
                ...prev.character,
                status: 'completed',
                modelUrl: data.model_urls?.glb,
                previewUrl: data.thumbnail_url || data.model_urls?.glb,
              }
            : null,
          progress: 'model_complete',
        }));
        return;
      }

      if (data.status === 'FAILED') {
        setState(prev => ({
          ...prev,
          error: data.error || 'Generation failed',
          generating: false,
          progress: 'failed',
        }));
        return;
      }
    } catch (error) {
      console.warn('Error checking generation status:', error);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  setState(prev => ({
    ...prev,
    error: 'Generation is taking longer than expected.',
    generating: false,
    progress: 'failed',
  }));
}
