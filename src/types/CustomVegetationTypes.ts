import { CustomizableObject, AppearanceProperties } from './BaseObjectTypes';

export interface CustomVegetation extends CustomizableObject {
  type: 'tree' | 'bush' | 'flower' | 'plant' | 'mushroom' | 'grass' | 'vine' | 'log';
  appearance: VegetationAppearance;
  properties: VegetationProperties;
  interaction: VegetationInteraction;
}

export interface VegetationAppearance extends AppearanceProperties {
  trunkColor?: string;
  leafColor?: string;
  fruitColor?: string;
  height?: number;
  width?: number;
  leafDensity?: number;
  seasonalVariation?: boolean;
  rootsVisible?: boolean;
  hasFruits?: boolean;
  hasFlowers?: boolean;
}

export interface VegetationProperties {
  age?: number;
  health?: number;
  isDeadly?: boolean;
  isPoisonous?: boolean;
  isHarvestable?: boolean;
  growthStage?: 'seed' | 'sapling' | 'mature' | 'ancient' | 'decaying';
  biomes?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface VegetationInteraction {
  harvestable?: boolean;
  harvestTool?: string;
  harvestableResources?: {
    resourceId: string;
    minAmount: number;
    maxAmount: number;
    chance: number;
  }[];
  harvestRegrowth?: number; // time in seconds
  damageToHarvest?: number;
  canBeBurned?: boolean;
  canBeCut?: boolean;
  effects?: {
    type: 'heal' | 'damage' | 'buff' | 'debuff';
    amount: number;
    duration?: number;
    description: string;
  }[];
  sounds?: {
    interact?: string;
    harvest?: string;
    destroy?: string;
  };
}