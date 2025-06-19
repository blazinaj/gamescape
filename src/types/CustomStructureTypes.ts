import { CustomizableObject, AppearanceProperties } from './BaseObjectTypes';

export interface CustomStructure extends CustomizableObject {
  type: 'building' | 'ruin' | 'monument' | 'bridge' | 'cave' | 'wall' | 'well' | 'statue' | 'altar' | 'custom';
  appearance: StructureAppearance;
  properties: StructureProperties;
  interaction?: StructureInteraction;
}

export interface StructureAppearance extends AppearanceProperties {
  materialType?: 'stone' | 'wood' | 'metal' | 'crystal' | 'bone' | 'plant' | 'ice' | 'custom';
  style?: 'ancient' | 'modern' | 'magical' | 'natural' | 'corrupted' | 'divine' | 'technological' | 'rustic';
  height?: number;
  width?: number;
  length?: number;
  hasDoor?: boolean;
  hasWindows?: boolean;
  hasTorch?: boolean;
  hasRoof?: boolean;
  isRuined?: boolean;
  weathered?: boolean;
  overgrown?: boolean;
}

export interface StructureProperties {
  age?: number; // in years
  civilization?: string;
  purpose?: string;
  lore?: string;
  isSolid?: boolean;
  isClimbable?: boolean;
  isFlammable?: boolean;
  health?: number;
  biomes?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface StructureInteraction {
  canEnter?: boolean;
  canLoot?: boolean;
  lootTable?: {
    itemId: string;
    minQuantity: number;
    maxQuantity: number;
    chance: number;
  }[];
  triggers?: {
    type: 'proximity' | 'interaction' | 'destruction';
    effect: string;
    description: string;
  }[];
  containsNPC?: boolean;
  containsEnemy?: boolean;
  sounds?: {
    approach?: string;
    interact?: string;
    destroy?: string;
  };
}