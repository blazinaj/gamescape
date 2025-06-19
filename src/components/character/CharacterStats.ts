import * as THREE from 'three';
import { HealthSystem } from '../../services/HealthSystem';
import { ExperienceSystem } from '../../services/ExperienceSystem';
import { DamageInfo } from '../../types/HealthTypes';

export class CharacterStats {
  private healthSystem: HealthSystem;
  private experienceSystem: ExperienceSystem;
  private lastPosition: THREE.Vector3;
  private totalDistanceMoved: number = 0;
  private lastMovementXpGain: number = 0;

  constructor() {
    this.healthSystem = new HealthSystem(100); // 100 max HP
    this.experienceSystem = new ExperienceSystem();
    this.lastPosition = new THREE.Vector3();

    // Subscribe to experience system for stat bonuses
    this.experienceSystem.subscribe(() => {
      this.updateStatsFromSkills();
    });

    // Initialize stats from skills
    this.updateStatsFromSkills();
  }

  update(deltaTime: number, currentPosition: THREE.Vector3): { speed: number; runSpeed: number } {
    // Update health system
    this.healthSystem.update(deltaTime);

    // Track movement for experience
    const movementDistance = currentPosition.distanceTo(this.lastPosition);
    
    if (movementDistance > 0.01) { // Minimum movement threshold
      this.totalDistanceMoved += movementDistance;
      
      // Give movement experience every 10 units moved
      const xpThreshold = 10;
      if (this.totalDistanceMoved - this.lastMovementXpGain >= xpThreshold) {
        const xpGain = Math.floor((this.totalDistanceMoved - this.lastMovementXpGain) / xpThreshold) * 2;
        this.experienceSystem.giveExperience('movement', xpGain, 'Walking');
        this.lastMovementXpGain = this.totalDistanceMoved;
      }
    }
    
    this.lastPosition.copy(currentPosition);

    // Return updated speeds based on skills
    const baseSpeed = 0.07;
    const baseRunSpeed = 0.14;
    const speedBonus = this.experienceSystem.getMovementSpeedBonus();
    
    return {
      speed: baseSpeed * (1 + speedBonus),
      runSpeed: baseRunSpeed * (1 + speedBonus)
    };
  }

  private updateStatsFromSkills(): void {
    // Update max health based on vitality skill
    const baseMaxHealth = 100;
    const healthBonus = this.experienceSystem.getHealthBonus();
    const newMaxHealth = baseMaxHealth + healthBonus;
    
    this.healthSystem.setMaxHealth(newMaxHealth);
  }

  takeDamage(damageInfo: DamageInfo): boolean {
    const isDead = this.healthSystem.takeDamage(damageInfo);
    
    // Give small health XP for taking damage (learning from pain)
    this.experienceSystem.giveExperience('health', 1, 'Taking Damage');
    
    return isDead;
  }

  heal(amount: number, source: string = 'unknown'): number {
    const healedAmount = this.healthSystem.heal(amount, source);
    
    // Give health XP for healing
    if (healedAmount > 0) {
      this.experienceSystem.giveExperience('health', Math.floor(healedAmount / 2), 'Healing');
    }
    
    return healedAmount;
  }

  isDead(): boolean {
    return this.healthSystem.isDead();
  }

  setLastPosition(position: THREE.Vector3): void {
    this.lastPosition.copy(position);
  }

  getHealthSystem(): HealthSystem {
    return this.healthSystem;
  }

  getExperienceSystem(): ExperienceSystem {
    return this.experienceSystem;
  }

  getSkillBonuses(): {
    combatDamage: number;
    woodcuttingEfficiency: number;
    miningEfficiency: number;
  } {
    return {
      combatDamage: this.experienceSystem.getCombatDamageBonus(),
      woodcuttingEfficiency: this.experienceSystem.getWoodcuttingEfficiencyBonus(),
      miningEfficiency: this.experienceSystem.getMiningEfficiencyBonus()
    };
  }
}