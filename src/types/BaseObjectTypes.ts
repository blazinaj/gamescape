/**
 * Base interface for all customizable game objects
 */
export interface CustomizableObject {
  id: string;
  name: string;
  description: string;
  scenario: string; // Which scenario this object belongs to
  customAttributes?: Record<string, any>; // Additional attributes specific to the object type
  createdAt: number;
}

/**
 * Types of objects the AI can customize
 */
export type ObjectCategory = 
  | 'enemy'
  | 'npc'
  | 'vegetation' 
  | 'structure'
  | 'item'
  | 'weapon'
  | 'tool'
  | 'resource'
  | 'terrain'
  | 'effect';

/**
 * Appearance properties that many objects can have
 */
export interface AppearanceProperties {
  primaryColor?: string;
  secondaryColor?: string;
  size?: number;
  scale?: { x: number; y: number; z: number };
  texture?: string;
  model?: string;
  emissive?: boolean;
  emissiveColor?: string;
  emissiveIntensity?: number;
  opacity?: number;
  glow?: boolean;
  particles?: string;
  animation?: string;
  variants?: number;
}

/**
 * Environment context for object generation
 */
export interface EnvironmentContext {
  biome: string;
  climate: string;
  timeOfDay?: string;
  weather?: string;
  proximity?: {
    nearWater: boolean;
    nearMountains: boolean;
    nearSettlement: boolean;
  };
}

/**
 * Schema definition for object categories, used to guide AI generation
 */
export interface ObjectSchema {
  category: ObjectCategory;
  attributes: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required: boolean;
    options?: string[];
    min?: number;
    max?: number;
  }>;
  examples: any[];
}

/**
 * Container for AI-generated object definitions
 */
export interface GeneratedObjectSet {
  scenarioId: string;
  theme: string;
  environmentContexts: Record<string, EnvironmentContext>;
  objects: {
    [category in ObjectCategory]?: CustomizableObject[];
  };
}