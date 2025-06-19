import { NPCData } from '../types/MapTypes';

export interface ConversationMessage {
  id: string;
  speaker: 'player' | 'npc';
  content: string;
  timestamp: number;
}

export interface ResponseOptions {
  options: string[];
  allowCustom: boolean;
}

export class ConversationSystem {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private conversations = new Map<string, ConversationMessage[]>();

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. NPC conversations will use fallback responses.');
    }
  }

  async startConversation(npc: NPCData): Promise<string> {
    const conversationId = `${npc.id}_${Date.now()}`;
    this.conversations.set(conversationId, []);

    try {
      if (this.apiKey) {
        return await this.generateNPCGreeting(npc);
      } else {
        return this.getFallbackGreeting(npc);
      }
    } catch (error) {
      console.error('Failed to generate NPC greeting:', error);
      return this.getFallbackGreeting(npc);
    }
  }

  async generateNPCResponse(npc: NPCData, conversationHistory: ConversationMessage[], playerMessage: string): Promise<string> {
    const conversationId = this.getConversationId(npc, conversationHistory);
    
    // Add player message to history
    this.addMessage(conversationId, {
      id: `msg_${Date.now()}`,
      speaker: 'player',
      content: playerMessage,
      timestamp: Date.now()
    });

    try {
      if (this.apiKey) {
        return await this.generateAIResponse(npc, conversationHistory, playerMessage);
      } else {
        return this.getFallbackResponse(npc, playerMessage);
      }
    } catch (error) {
      console.error('Failed to generate NPC response:', error);
      return this.getFallbackResponse(npc, playerMessage);
    }
  }

  async generateResponseOptions(npc: NPCData, conversationHistory: ConversationMessage[], npcMessage: string): Promise<string[]> {
    try {
      if (this.apiKey) {
        return await this.generateAIResponseOptions(npc, conversationHistory, npcMessage);
      } else {
        return this.getFallbackResponseOptions(npc, npcMessage);
      }
    } catch (error) {
      console.error('Failed to generate response options:', error);
      return this.getFallbackResponseOptions(npc, npcMessage);
    }
  }

  private async generateNPCGreeting(npc: NPCData): Promise<string> {
    const prompt = this.createNPCPrompt(npc, [], '', 'greeting');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are roleplaying as an NPC in a 3D walking game. Stay in character and provide engaging, contextual responses. Keep responses concise but interesting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || this.getFallbackGreeting(npc);
  }

  private async generateAIResponse(npc: NPCData, history: ConversationMessage[], playerMessage: string): Promise<string> {
    const prompt = this.createNPCPrompt(npc, history, playerMessage, 'response');

    const messages = [
      {
        role: 'system',
        content: 'You are roleplaying as an NPC in a 3D walking game. Stay in character and provide engaging, contextual responses. Keep responses concise but interesting.'
      }
    ];

    // Add conversation history
    history.slice(-6).forEach(msg => { // Keep last 6 messages for context
      messages.push({
        role: msg.speaker === 'player' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    messages.push({
      role: 'user',
      content: playerMessage
    });

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages,
        temperature: 0.8,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || this.getFallbackResponse(npc, playerMessage);
  }

  private async generateAIResponseOptions(npc: NPCData, history: ConversationMessage[], npcMessage: string): Promise<string[]> {
    const prompt = `Given this NPC and their latest message, generate 3 diverse response options for the player:

NPC: ${npc.name} (${npc.personality})
NPC's message: "${npcMessage}"

Generate 3 different response options that would make sense in this context. Make them varied in tone (friendly, curious, direct, etc.):`;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'Generate exactly 3 response options separated by newlines. Each should be a complete sentence that a player might say in response.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    return content.split('\n').filter((line: string) => line.trim()).slice(0, 3);
  }

  private createNPCPrompt(npc: NPCData, history: ConversationMessage[], playerMessage: string, type: 'greeting' | 'response'): string {
    const contextInfo = `
Character: ${npc.name}
Personality: ${npc.personality}
Background: ${npc.background}
Occupation: ${npc.occupation || 'Unknown'}
Current Mood: ${npc.mood}
Topics of Interest: ${npc.topics.join(', ')}
`;

    if (type === 'greeting') {
      return `${contextInfo}

Generate a natural greeting from this character as they notice a traveler approaching. Keep it in character and concise.`;
    } else {
      return `${contextInfo}

Player said: "${playerMessage}"

Respond as this character would, staying true to their personality and background. Keep it conversational and engaging.`;
    }
  }

  private getFallbackGreeting(npc: NPCData): string {
    const greetings = [
      `Hello there, traveler! I'm ${npc.name}.`,
      `Greetings! The name's ${npc.name}. What brings you to these parts?`,
      `Well hello! I'm ${npc.name}. Nice to meet you!`,
      `Good day to you! ${npc.name}'s the name.`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private getFallbackResponse(npc: NPCData, playerMessage: string): string {
    const responses = [
      "That's quite interesting! Tell me more.",
      "I see, I see. What else is on your mind?",
      "Fascinating! I hadn't thought of it that way.",
      "Oh really? That sounds intriguing.",
      "Well, that's certainly something to think about."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getFallbackResponseOptions(npc: NPCData, npcMessage: string): string[] {
    return [
      "That's really interesting to hear.",
      "Could you tell me more about that?",
      "I should probably get going now."
    ];
  }

  private getConversationId(npc: NPCData, history: ConversationMessage[]): string {
    return `${npc.id}_conversation`;
  }

  private addMessage(conversationId: string, message: ConversationMessage): void {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, []);
    }
    this.conversations.get(conversationId)!.push(message);
  }

  endConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }
}