import { useState, useCallback } from 'react';
import { CharacterGenerationRequest, GeneratedCharacter } from '../services/CharacterGenerationService';

interface UseCharacterGenerationState {
  generating: boolean;
  character: GeneratedCharacter | null;
  error: string | null;
  progress: 'idle' | 'generating' | 'completed' | 'failed';
}

export const useCharacterGeneration = () => {
  const [state, setState] = useState<UseCharacterGenerationState>({
    generating: false,
    character: null,
    error: null,
    progress: 'idle',
  });

  const generateCharacter = useCallback(
    async (request: CharacterGenerationRequest) => {
      setState(prev => ({
        ...prev,
        generating: true,
        error: null,
        progress: 'generating',
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
          const error = await response.json();
          throw new Error(`Generation failed: ${error.error}`);
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

        pollForCompletion(character.meshyRequestId, setState);
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

  const reset = useCallback(() => {
    setState({
      generating: false,
      character: null,
      error: null,
      progress: 'idle',
    });
  }, []);

  return {
    ...state,
    generateCharacter,
    reset,
  };
};

async function pollForCompletion(
  meshyRequestId: string,
  setState: React.Dispatch<React.SetStateAction<UseCharacterGenerationState>>,
  maxAttempts: number = 60,
  interval: number = 5000
) {
  let attempts = 0;

  const checkStatus = async () => {
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
            meshyRequestId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

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
          generating: false,
          progress: 'completed',
        }));
        return true;
      }

      if (data.status === 'FAILED') {
        setState(prev => ({
          ...prev,
          error: data.error || 'Generation failed',
          generating: false,
          progress: 'failed',
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Error checking generation status:', error);
      return false;
    }
  };

  while (attempts < maxAttempts) {
    const completed = await checkStatus();
    if (completed) return;

    attempts++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  setState(prev => ({
    ...prev,
    error: 'Generation is taking longer than expected. Check back in a few minutes.',
    generating: false,
    progress: 'failed',
  }));
}
