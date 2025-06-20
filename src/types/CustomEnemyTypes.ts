import { CustomizableObject, AppearanceProperties } from './BaseObjectTypes';

export interface CustomEnemy extends CustomizableObject {
  type: string;
  appearance: EnemyAppearance;
  stats: EnemyStats;
  behavior: EnemyBehavior;
  abilities: EnemyAbility[];
  drops: EnemyDrop[];
  sounds: EnemySounds;
}

export interface EnemyAppearance extends AppearanceProperties {
  bodyType?: 'humanoid' | 'beast' | 'insect' | 'undead' | 'elemental' | 'construct' | 'plant' | 'slime';
  skinTexture?: 'smooth' | 'rough' | 'scaly' | 'furry' | 'slimy' | 'rocky' | 'metallic' | 'wooden' | 'ghostly';
  eyeColor?: string;
  hasClaws?: boolean;
  hasTail?: boolean;
  hasHorns?: boolean;
  hasWings?: boolean;
  weaponType?: string;
  armorType?: string;
}

export interface EnemyStats {
  level: number;
  health: number;
  damage: number;
  defense: number;
  speed: number;
  attackRange: number;
  attackSpeed: number;
  experienceValue: number;
  detectRange: number;
  aggression: number; // 0-10, how likely to attack
}

export interface EnemyBehavior {
  isAggressive: boolean;
  isNocturnal: boolean;
  isPack: boolean;
  isTerritorial: boolean;
  fleeThreshold?: number; // health percentage when enemy tries to flee
  patrolRadius?: number;
  preferredBiomes?: string[];
  fears?: string[]; // what causes this enemy to flee
  preys?: string[]; // what this enemy attacks besides the player
}

export interface EnemyAbility {
  name: string;
  type: 'melee' | 'ranged' | 'magic' | 'special';
  damage?: number;
  range?: number;
  cooldown: number;
  areaOfEffect?: number;
  effects?: {
    type: 'poison' | 'fire' | 'stun' | 'slow' | 'freeze' | 'debuff';
    duration: number;
    tickDamage?: number;
  }[];
  animation?: string;
  particles?: string;
  sound?: string;
}

export interface EnemyDrop {
  itemId: string;
  minQuantity: number;
  maxQuantity: number;
  chance: number; // 0-1
  requiredTool?: string;
}

export interface EnemySounds {
  idle?: string;
  attack?: string;
  damaged?: string;
  death?: string;
  special?: string;
}