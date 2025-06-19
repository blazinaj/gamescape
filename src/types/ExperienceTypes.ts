export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  experience: number;
  experienceToNext: number;
  totalExperience: number;
  multiplier: number; // XP gain multiplier
  category: 'combat' | 'gathering' | 'utility' | 'passive';
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'combat' | 'gathering' | 'utility' | 'passive';
  baseXpToLevel: number;
  xpMultiplier: number; // How much XP required scales per level
}

export interface ExperienceGain {
  skillId: string;
  amount: number;
  source: string;
  timestamp: number;
}

export interface LevelUpEvent {
  skillId: string;
  oldLevel: number;
  newLevel: number;
  skill: Skill;
  timestamp: number;
}

export interface SkillBonus {
  type: 'flat' | 'percentage';
  value: number;
  description: string;
}

export interface SkillBenefits {
  [skillId: string]: {
    [level: number]: SkillBonus[];
  };
}