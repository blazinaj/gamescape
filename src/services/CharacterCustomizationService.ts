import { CharacterCustomization, CustomizationRequest, CustomizationResponse, DEFAULT_CUSTOMIZATION } from '../types/CharacterTypes';

export class CharacterCustomizationService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Character customization will use fallback system.');
    }
  }

  async customizeCharacter(request: CustomizationRequest): Promise<CustomizationResponse> {
    try {
      if (this.apiKey) {
        return await this.customizeWithAI(request);
      } else {
        return this.customizeWithFallback(request);
      }
    } catch (error) {
      console.error('AI customization failed, using fallback:', error);
      return this.customizeWithFallback(request);
    }
  }

  private async customizeWithAI(request: CustomizationRequest): Promise<CustomizationResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a character customization assistant. When users describe how they want their character to look, interpret their request and generate appropriate customization values. Always respond using the customize_character function.

Guidelines for customization values:
- bodyColor: Hex colors for skin tones (e.g., #FFDBAC, #F1C27D, #E0AC69, #C68642, #8D5524)
- clothingColor: Any hex color for clothing
- eyeColor: Hex colors for eyes (e.g., #000000, #8B4513, #1E40AF, #059669, #7C3AED)
- scale: 0.5-2.0 (1.0 is normal size)
- headScale: 0.8-1.5 (1.0 is normal head size)
- bodyWidth: 0.7-1.3 (1.0 is normal width)
- armLength: 0.8-1.2 (1.0 is normal arm length)
- legLength: 0.8-1.2 (1.0 is normal leg length)

Be creative but reasonable with interpretations. If they mention colors, convert them to appropriate hex values.`
          },
          {
            role: 'user',
            content: `Current character: ${JSON.stringify(request.currentCustomization, null, 2)}

User request: "${request.description}"

Please customize the character based on this request.`
          }
        ],
        functions: [
          {
            name: 'customize_character',
            description: 'Customize character appearance based on user description',
            parameters: {
              type: 'object',
              properties: {
                bodyColor: {
                  type: 'string',
                  description: 'Hex color for character skin tone'
                },
                clothingColor: {
                  type: 'string',
                  description: 'Hex color for character clothing'
                },
                eyeColor: {
                  type: 'string',
                  description: 'Hex color for character eyes'
                },
                scale: {
                  type: 'number',
                  minimum: 0.5,
                  maximum: 2.0,
                  description: 'Overall character size multiplier'
                },
                headScale: {
                  type: 'number',
                  minimum: 0.8,
                  maximum: 1.5,
                  description: 'Head size multiplier'
                },
                bodyWidth: {
                  type: 'number',
                  minimum: 0.7,
                  maximum: 1.3,
                  description: 'Body width multiplier'
                },
                armLength: {
                  type: 'number',
                  minimum: 0.8,
                  maximum: 1.2,
                  description: 'Arm length multiplier'
                },
                legLength: {
                  type: 'number',
                  minimum: 0.8,
                  maximum: 1.2,
                  description: 'Leg length multiplier'
                },
                name: {
                  type: 'string',
                  description: 'Character name if mentioned'
                },
                explanation: {
                  type: 'string',
                  description: 'Brief explanation of the changes made'
                }
              },
              required: ['bodyColor', 'clothingColor', 'eyeColor', 'scale', 'headScale', 'bodyWidth', 'armLength', 'legLength', 'explanation']
            }
          }
        ],
        function_call: { name: 'customize_character' },
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const functionCall = data.choices[0]?.message?.function_call;
    
    if (!functionCall || functionCall.name !== 'customize_character') {
      throw new Error('Invalid function call response');
    }

    const result = JSON.parse(functionCall.arguments);
    
    return {
      customization: {
        bodyColor: result.bodyColor,
        clothingColor: result.clothingColor,
        eyeColor: result.eyeColor,
        scale: result.scale,
        headScale: result.headScale,
        bodyWidth: result.bodyWidth,
        armLength: result.armLength,
        legLength: result.legLength,
        name: result.name || request.currentCustomization.name
      },
      explanation: result.explanation
    };
  }

  private customizeWithFallback(request: CustomizationRequest): CustomizationResponse {
    const description = request.description.toLowerCase();
    const current = { ...request.currentCustomization };
    let changes: string[] = [];

    // Simple keyword-based customization
    if (description.includes('tall') || description.includes('big') || description.includes('large')) {
      current.scale = Math.min(2.0, current.scale + 0.3);
      changes.push('made character taller');
    }
    
    if (description.includes('short') || description.includes('small') || description.includes('tiny')) {
      current.scale = Math.max(0.5, current.scale - 0.3);
      changes.push('made character shorter');
    }

    if (description.includes('red') && (description.includes('clothes') || description.includes('shirt'))) {
      current.clothingColor = '#DC2626';
      changes.push('changed clothing to red');
    }

    if (description.includes('blue') && (description.includes('clothes') || description.includes('shirt'))) {
      current.clothingColor = '#2563EB';
      changes.push('changed clothing to blue');
    }

    if (description.includes('green') && (description.includes('clothes') || description.includes('shirt'))) {
      current.clothingColor = '#16A34A';
      changes.push('changed clothing to green');
    }

    if (description.includes('dark skin') || description.includes('darker skin')) {
      current.bodyColor = '#8D5524';
      changes.push('changed to darker skin tone');
    }

    if (description.includes('light skin') || description.includes('pale')) {
      current.bodyColor = '#FFDBAC';
      changes.push('changed to lighter skin tone');
    }

    if (description.includes('big head') || description.includes('large head')) {
      current.headScale = Math.min(1.5, current.headScale + 0.2);
      changes.push('increased head size');
    }

    if (description.includes('thin') || description.includes('skinny')) {
      current.bodyWidth = Math.max(0.7, current.bodyWidth - 0.2);
      changes.push('made character thinner');
    }

    if (description.includes('wide') || description.includes('broad')) {
      current.bodyWidth = Math.min(1.3, current.bodyWidth + 0.2);
      changes.push('made character broader');
    }

    const explanation = changes.length > 0 
      ? `Applied changes: ${changes.join(', ')}`
      : 'No specific changes detected from description';

    return {
      customization: current,
      explanation
    };
  }

  generateRandomCustomization(): CharacterCustomization {
    const skinTones = ['#FFDBAC', '#F1C27D', '#E0AC69', '#C68642', '#8D5524'];
    const clothingColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const eyeColors = ['#000000', '#8B4513', '#1E40AF', '#059669', '#7C3AED'];

    return {
      bodyColor: skinTones[Math.floor(Math.random() * skinTones.length)],
      clothingColor: clothingColors[Math.floor(Math.random() * clothingColors.length)],
      eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
      scale: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
      headScale: 0.9 + Math.random() * 0.2, // 0.9 to 1.1
      bodyWidth: 0.9 + Math.random() * 0.2, // 0.9 to 1.1
      armLength: 0.95 + Math.random() * 0.1, // 0.95 to 1.05
      legLength: 0.95 + Math.random() * 0.1, // 0.95 to 1.05
      name: 'Adventurer'
    };
  }
}