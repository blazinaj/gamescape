import { Skill, SkillDefinition, ExperienceGain, LevelUpEvent, SkillBenefits } from '../types/ExperienceTypes';
import { notificationSystem } from './NotificationSystem';

export class ExperienceSystem {
  private skills: Map<string, Skill> = new Map();
  private skillDefinitions: Map<string, SkillDefinition> = new Map();
  private experienceGains: ExperienceGain[] = [];
  private levelUpEvents: LevelUpEvent[] = [];
  private subscribers: ((skills: Map<string, Skill>) => void)[] = [];
  private levelUpSubscribers: ((event: LevelUpEvent) => void)[] = [];
  private recentSkillUpdates: Map<string, number> = new Map(); // Track when skills were last updated

  constructor() {
    this.initializeSkillDefinitions();
    this.initializeSkills();
  }

  private initializeSkillDefinitions(): void {
    const definitions: SkillDefinition[] = [
      {
        id: 'movement',
        name: 'Movement',
        description: 'Improves movement speed and stamina efficiency',
        icon: '🏃',
        category: 'passive',
        baseXpToLevel: 100,
        xpMultiplier: 1.15
      },
      {
        id: 'woodcutting',
        name: 'Woodcutting',
        description: 'Increases wood harvesting efficiency and yields',
        icon: '🪓',
        category: 'gathering',
        baseXpToLevel: 150,
        xpMultiplier: 1.2
      },
      {
        id: 'mining',
        name: 'Mining',
        description: 'Improves stone and ore mining capabilities',
        icon: '⛏️',
        category: 'gathering',
        baseXpToLevel: 150,
        xpMultiplier: 1.2
      },
      {
        id: 'gathering',
        name: 'Gathering',
        description: 'Enhances collection of plants, berries, and materials',
        icon: '🌿',
        category: 'gathering',
        baseXpToLevel: 120,
        xpMultiplier: 1.18
      },
      {
        id: 'combat',
        name: 'Combat',
        description: 'Increases damage, accuracy, and combat effectiveness',
        icon: '⚔️',
        category: 'combat',
        baseXpToLevel: 200,
        xpMultiplier: 1.25
      },
      {
        id: 'health',
        name: 'Vitality',
        description: 'Increases maximum health and regeneration rate',
        icon: '❤️',
        category: 'passive',
        baseXpToLevel: 180,
        xpMultiplier: 1.22
      },
      {
        id: 'crafting',
        name: 'Crafting',
        description: 'Improves tool durability and crafting efficiency',
        icon: '🔨',
        category: 'utility',
        baseXpToLevel: 160,
        xpMultiplier: 1.2
      },
      {
        id: 'exploration',
        name: 'Exploration',
        description: 'Increases detection range and world generation bonuses',
        icon: '🗺️',
        category: 'utility',
        baseXpToLevel: 140,
        xpMultiplier: 1.18
      }
    ];

    definitions.forEach(def => {
      this.skillDefinitions.set(def.id, def);
    });
  }

  private initializeSkills(): void {
    this.skillDefinitions.forEach((def, id) => {
      const skill: Skill = {
        id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        level: 1,
        experience: 0,
        experienceToNext: def.baseXpToLevel,
        totalExperience: 0,
        multiplier: 1.0,
        category: def.category
      };
      this.skills.set(id, skill);
    });

    this.notifySubscribers();
  }

  giveExperience(skillId: string, amount: number, source: string = 'unknown'): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    const adjustedAmount = Math.floor(amount * skill.multiplier);
    
    // Record experience gain
    const experienceGain: ExperienceGain = {
      skillId,
      amount: adjustedAmount,
      source,
      timestamp: Date.now()
    };
    this.experienceGains.push(experienceGain);

    // Update skill
    skill.experience += adjustedAmount;
    skill.totalExperience += adjustedAmount;

    // Track when this skill was last updated for recent progress display
    this.recentSkillUpdates.set(skillId, Date.now());

    // Check for level ups
    this.checkLevelUp(skill);

    this.notifySubscribers();
    return true;
  }

  private checkLevelUp(skill: Skill): void {
    const definition = this.skillDefinitions.get(skill.id);
    if (!definition) return;

    let leveledUp = false;
    const oldLevel = skill.level;

    while (skill.experience >= skill.experienceToNext) {
      skill.experience -= skill.experienceToNext;
      skill.level++;
      leveledUp = true;

      // Calculate next level requirement
      skill.experienceToNext = Math.floor(
        definition.baseXpToLevel * Math.pow(definition.xpMultiplier, skill.level - 1)
      );
    }

    if (leveledUp) {
      const levelUpEvent: LevelUpEvent = {
        skillId: skill.id,
        oldLevel,
        newLevel: skill.level,
        skill: { ...skill },
        timestamp: Date.now()
      };

      this.levelUpEvents.push(levelUpEvent);
      this.notifyLevelUpSubscribers(levelUpEvent);

      // Show level up notification
      notificationSystem.showItemNotification(
        `${skill.name} Level Up! (${oldLevel} → ${skill.level})`,
        [{
          name: skill.name,
          icon: skill.icon,
          quantity: skill.level
        }],
        4000
      );

      console.log(`🎉 ${skill.name} leveled up! ${oldLevel} → ${skill.level}`);
      
      // Apply level up benefits
      this.applySkillBenefits(skill);
    }
  }

  getRecentlyUpdatedSkills(limit: number = 3, timeWindow: number = 30000): Skill[] {
    const cutoff = Date.now() - timeWindow;
    const recentSkills: { skill: Skill; lastUpdate: number }[] = [];

    this.recentSkillUpdates.forEach((timestamp, skillId) => {
      if (timestamp > cutoff) {
        const skill = this.skills.get(skillId);
        if (skill) {
          recentSkills.push({ skill, lastUpdate: timestamp });
        }
      }
    });

    // Sort by most recently updated and return the skills
    return recentSkills
      .sort((a, b) => b.lastUpdate - a.lastUpdate)
      .slice(0, limit)
      .map(item => item.skill);
  }

  private applySkillBenefits(skill: Skill): void {
    // These benefits can be used by other systems
    switch (skill.id) {
      case 'movement':
        // Movement speed bonuses applied in character update
        break;
      case 'health':
        // Max health bonuses applied via health system
        break;
      case 'combat':
        // Damage bonuses applied in equipment manager
        break;
      case 'crafting':
        // Tool durability bonuses applied in equipment usage
        break;
      // Additional skill benefits can be added here
    }
  }

  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.getAllSkills().filter(skill => skill.category === category);
  }

  getTotalLevel(): number {
    return this.getAllSkills().reduce((total, skill) => total + skill.level, 0);
  }

  getRecentExperienceGains(timeWindow: number = 10000): ExperienceGain[] {
    const cutoff = Date.now() - timeWindow;
    return this.experienceGains.filter(gain => gain.timestamp > cutoff);
  }

  getRecentLevelUps(timeWindow: number = 60000): LevelUpEvent[] {
    const cutoff = Date.now() - timeWindow;
    return this.levelUpEvents.filter(event => event.timestamp > cutoff);
  }

  // Skill bonus calculation helpers
  getMovementSpeedBonus(): number {
    const movementSkill = this.getSkill('movement');
    if (!movementSkill) return 0;
    return (movementSkill.level - 1) * 0.02; // 2% per level after 1
  }

  getHealthBonus(): number {
    const healthSkill = this.getSkill('health');
    if (!healthSkill) return 0;
    return (healthSkill.level - 1) * 5; // 5 HP per level after 1
  }

  getCombatDamageBonus(): number {
    const combatSkill = this.getSkill('combat');
    if (!combatSkill) return 0;
    return (combatSkill.level - 1) * 0.03; // 3% damage per level after 1
  }

  getGatheringYieldBonus(): number {
    const gatheringSkill = this.getSkill('gathering');
    if (!gatheringSkill) return 0;
    return (gatheringSkill.level - 1) * 0.05; // 5% yield per level after 1
  }

  getWoodcuttingEfficiencyBonus(): number {
    const woodcuttingSkill = this.getSkill('woodcutting');
    if (!woodcuttingSkill) return 0;
    return (woodcuttingSkill.level - 1) * 0.04; // 4% efficiency per level after 1
  }

  getMiningEfficiencyBonus(): number {
    const miningSkill = this.getSkill('mining');
    if (!miningSkill) return 0;
    return (miningSkill.level - 1) * 0.04; // 4% efficiency per level after 1
  }

  getCraftingDurabilityBonus(): number {
    const craftingSkill = this.getSkill('crafting');
    if (!craftingSkill) return 0;
    return (craftingSkill.level - 1) * 0.02; // 2% durability per level after 1
  }

  subscribe(callback: (skills: Map<string, Skill>) => void): () => void {
    this.subscribers.push(callback);
    callback(new Map(this.skills));

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  subscribeLevelUps(callback: (event: LevelUpEvent) => void): () => void {
    this.levelUpSubscribers.push(callback);

    return () => {
      const index = this.levelUpSubscribers.indexOf(callback);
      if (index > -1) {
        this.levelUpSubscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback(new Map(this.skills));
    });
  }

  private notifyLevelUpSubscribers(event: LevelUpEvent): void {
    this.levelUpSubscribers.forEach(callback => {
      callback(event);
    });
  }

  // Save/load functionality
  exportSkills(): any {
    const data: any = {};
    this.skills.forEach((skill, id) => {
      data[id] = {
        level: skill.level,
        experience: skill.experience,
        totalExperience: skill.totalExperience,
        multiplier: skill.multiplier
      };
    });
    return data;
  }

  importSkills(data: any): void {
    Object.keys(data).forEach(skillId => {
      const skill = this.skills.get(skillId);
      const skillData = data[skillId];
      
      if (skill && skillData) {
        skill.level = skillData.level || 1;
        skill.experience = skillData.experience || 0;
        skill.totalExperience = skillData.totalExperience || 0;
        skill.multiplier = skillData.multiplier || 1.0;

        // Recalculate experience to next level
        const definition = this.skillDefinitions.get(skillId);
        if (definition) {
          skill.experienceToNext = Math.floor(
            definition.baseXpToLevel * Math.pow(definition.xpMultiplier, skill.level - 1)
          ) - skill.experience;
        }
      }
    });

    this.notifySubscribers();
  }

  // Clean up old data
  cleanup(): void {
    // Keep only last 100 experience gains
    if (this.experienceGains.length > 100) {
      this.experienceGains = this.experienceGains.slice(-100);
    }

    // Keep only last 50 level up events
    if (this.levelUpEvents.length > 50) {
      this.levelUpEvents = this.levelUpEvents.slice(-50);
    }

    // Clean up old recent skill updates (older than 1 minute)
    const cutoff = Date.now() - 60000;
    this.recentSkillUpdates.forEach((timestamp, skillId) => {
      if (timestamp < cutoff) {
        this.recentSkillUpdates.delete(skillId);
      }
    });
  }
}