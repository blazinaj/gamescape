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

        // For now, use local storage since we're not using Supabase in the frontend
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/meshy-asset-generator/generate-model`;

        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: request.description,
            art_style: request.artStyle || 'realistic',
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
          generating: true, // Keep true - we're polling
          progress: 'generating',
        }));

        // Start polling for completion
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
  maxAttempts: number = 40, // 2 minutes with 3-second intervals
  interval: number = 3000
) {
  let attempts = 0;

  const checkStatus = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/meshy-asset-generator/check-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ meshyRequestId }),
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
                previewUrl: data.model_urls?.fbx || data.model_urls?.glb,
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
      console.error('Error checking generation status:', error);
      return false;
    }
  };

  while (attempts < maxAttempts) {
    const completed = await checkStatus();
    if (completed) return;

    attempts++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  // Timeout - still polling on backend, but inform user
  setState(prev => ({
    ...prev,
    error: 'Generation is taking longer than expected. Check back in a few minutes.',
    generating: false,
    progress: 'failed',
  }));
}
