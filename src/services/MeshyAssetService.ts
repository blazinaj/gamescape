interface MeshyTextTo3DRequest {
  mode: 'preview' | 'refine';
  prompt: string;
  art_style?: string;
  negative_prompt?: string;
  seed?: number;
}

interface MeshyRemeshRequest {
  source_url: string;
  target_count: number;
}

interface MeshyRiggingRequest {
  source_url: string;
  rigging_type: 'biped' | 'quadruped' | 'custom';
}

interface MeshyRetextureRequest {
  source_url: string;
  prompt: string;
  style?: string;
}

interface MeshyTaskStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  model_urls?: {
    glb: string;
    fbx: string;
    usdz: string;
  };
  texture_urls?: string[];
  error?: string;
}

export class MeshyAssetService {
  private apiKey: string;
  private baseUrl = 'https://api.meshy.ai/v2';
  private pollInterval = 3000;
  private maxPolls = 600; // 30 minutes max

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCharacterModel(
    prompt: string,
    artStyle?: string
  ): Promise<{
    taskId: string;
    status: 'pending' | 'completed' | 'failed';
    modelUrls?: { glb: string; fbx: string; usdz: string };
    error?: string;
  }> {
    const enhancedPrompt = `A detailed 3D character model. ${prompt}. Game-ready, optimized for real-time rendering.`;

    const request: MeshyTextTo3DRequest = {
      mode: 'preview',
      prompt: enhancedPrompt,
      art_style: artStyle || 'realistic',
      negative_prompt: 'low quality, blurry, distorted',
    };

    const response = await fetch(`${this.baseUrl}/text-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meshy API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      taskId: data.id,
      status: 'pending',
      error: data.error,
    };
  }

  async generateTextures(
    modelUrl: string,
    prompt: string,
    style?: string
  ): Promise<{
    taskId: string;
    status: 'pending' | 'completed' | 'failed';
    textureUrls?: string[];
    error?: string;
  }> {
    const request: MeshyRetextureRequest = {
      source_url: modelUrl,
      prompt: prompt,
      style: style || 'photorealistic',
    };

    const response = await fetch(`${this.baseUrl}/retexture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meshy API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      taskId: data.id,
      status: 'pending',
      error: data.error,
    };
  }

  async remesh(
    modelUrl: string,
    targetPolyCount: number = 100000
  ): Promise<{
    taskId: string;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
  }> {
    const request: MeshyRemeshRequest = {
      source_url: modelUrl,
      target_count: targetPolyCount,
    };

    const response = await fetch(`${this.baseUrl}/remesh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meshy API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      taskId: data.id,
      status: 'pending',
      error: data.error,
    };
  }

  async generateRigging(
    modelUrl: string,
    rigType: 'biped' | 'quadruped' | 'custom' = 'biped'
  ): Promise<{
    taskId: string;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
  }> {
    const request: MeshyRiggingRequest = {
      source_url: modelUrl,
      rigging_type: rigType,
    };

    const response = await fetch(`${this.baseUrl}/roaming`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meshy API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      taskId: data.id,
      status: 'pending',
      error: data.error,
    };
  }

  async checkTaskStatus(taskId: string): Promise<MeshyTaskStatus> {
    const response = await fetch(`${this.baseUrl}/text-to-3d/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.statusText}`);
    }

    return response.json();
  }

  async pollForCompletion(
    taskId: string
  ): Promise<{
    status: 'completed' | 'failed';
    modelUrls?: { glb: string; fbx: string; usdz: string };
    error?: string;
  }> {
    let attempts = 0;

    while (attempts < this.maxPolls) {
      try {
        const status = await this.checkTaskStatus(taskId);

        if (status.status === 'SUCCEEDED') {
          return {
            status: 'completed',
            modelUrls: status.model_urls,
          };
        }

        if (status.status === 'FAILED') {
          return {
            status: 'failed',
            error: status.error || 'Task failed without error message',
          };
        }

        // Still pending
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        attempts++;
      } catch (error) {
        console.error('Error polling task status:', error);
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        attempts++;
      }
    }

    return {
      status: 'failed',
      error: 'Task polling timeout exceeded',
    };
  }
}

export const createMeshyService = (apiKey: string) => new MeshyAssetService(apiKey);
