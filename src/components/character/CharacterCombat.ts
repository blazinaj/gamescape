import * as THREE from 'three';
import { DamageInfo } from '../../types/HealthTypes';
import { InteractableObjectManager } from '../../services/InteractableObjectManager';
import { ExperienceSystem } from '../../services/ExperienceSystem';
import { EquipmentManager } from '../../services/EquipmentManager';

export class CharacterCombat {
  private interactableObjectManager: InteractableObjectManager;
  private experienceSystem: ExperienceSystem;
  private equipmentManager: EquipmentManager;

  constructor(
    interactableObjectManager: InteractableObjectManager,
    experienceSystem: ExperienceSystem,
    equipmentManager: EquipmentManager
  ) {
    this.interactableObjectManager = interactableObjectManager;
    this.experienceSystem = experienceSystem;
    this.equipmentManager = equipmentManager;
  }

  checkToolTargets(action: any, playerPosition: THREE.Vector3): void {
    const equippedTool = this.equipmentManager.getEquippedTool();
    if (!equippedTool) return;

    const toolRange = equippedTool.range;

    // Find interactable objects in range
    const objectsInRange = this.interactableObjectManager.getObjectsInRange(playerPosition, toolRange);
    
    console.log(`🎯 Found ${objectsInRange.length} potential targets within ${toolRange}m range`);

    // Filter objects by tool target types
    const validTargets = objectsInRange.filter(object => 
      equippedTool.targetTypes.includes(object.type)
    );

    if (validTargets.length === 0) {
      console.log(`❌ No valid ${equippedTool.targetTypes.join(' or ')} targets found`);
      return;
    }

    // Find the closest valid target
    let closestObject = validTargets[0];
    let closestDistance = playerPosition.distanceTo(new THREE.Vector3(
      closestObject.position.x,
      closestObject.position.y,
      closestObject.position.z
    ));

    for (const object of validTargets.slice(1)) {
      const distance = playerPosition.distanceTo(new THREE.Vector3(
        object.position.x,
        object.position.y,
        object.position.z
      ));
      
      if (distance < closestDistance) {
        closestObject = object;
        closestDistance = distance;
      }
    }

    // Apply damage with skill bonuses
    const baseDamage = action.amount;
    let skillBonus = 0;
    
    if (equippedTool.type === 'axe') {
      skillBonus = this.experienceSystem.getWoodcuttingEfficiencyBonus();
      this.experienceSystem.giveExperience('woodcutting', 5, 'Tree Chopping');
    } else if (equippedTool.type === 'pickaxe') {
      skillBonus = this.experienceSystem.getMiningEfficiencyBonus();
      this.experienceSystem.giveExperience('mining', 5, 'Rock Mining');
    }
    
    // Give crafting XP for tool use
    this.experienceSystem.giveExperience('crafting', 1, 'Tool Usage');
    
    const finalDamage = Math.floor(baseDamage * (1 + skillBonus));
    
    console.log(`⚔️ Attacking ${closestObject.type} with ${finalDamage} damage (${baseDamage} base + ${(skillBonus * 100).toFixed(1)}% skill bonus)`);
    
    const wasDestroyed = this.interactableObjectManager.damageObject(closestObject.id, finalDamage);
    
    if (wasDestroyed) {
      console.log(`🔥 ${closestObject.type} was destroyed!`);
      
      // Give gathering XP for resource collection
      this.experienceSystem.giveExperience('gathering', 3, 'Resource Collection');
      
      // Remove the mesh from the scene
      if (closestObject.mesh && closestObject.mesh.parent) {
        closestObject.mesh.parent.remove(closestObject.mesh);
      }
    }
  }

  // Method to be called by Game3D with enemy manager
  attackEnemies(enemyManager: any, playerPosition: THREE.Vector3): void {
    const equippedWeapon = this.equipmentManager.getEquippedWeapon();
    if (!equippedWeapon) return;

    const weaponRange = equippedWeapon.range;

    // Find enemies in range
    const enemiesInRange = enemyManager.getEnemiesInRange(playerPosition, weaponRange);
    
    if (enemiesInRange.length === 0) {
      console.log(`❌ No enemies within ${weaponRange}m range`);
      return;
    }

    // Find closest enemy
    let closestEnemy = enemiesInRange[0];
    let closestDistance = closestEnemy.distanceTo(playerPosition);

    for (const enemy of enemiesInRange.slice(1)) {
      const distance = enemy.distanceTo(playerPosition);
      if (distance < closestDistance) {
        closestEnemy = enemy;
        closestDistance = distance;
      }
    }

    // Calculate damage with skill bonuses
    const baseDamage = equippedWeapon.damage;
    const combatBonus = this.experienceSystem.getCombatDamageBonus();
    const isCritical = Math.random() < 0.15; // 15% crit chance
    const critMultiplier = isCritical ? 1.5 : 1.0;
    const finalDamage = Math.floor(baseDamage * (1 + combatBonus) * critMultiplier);

    // Create damage info
    const damageInfo: DamageInfo = {
      amount: finalDamage,
      type: 'physical',
      source: equippedWeapon.name,
      isCritical,
      position: playerPosition
    };

    // Apply damage to enemy
    const enemyDied = closestEnemy.takeDamage(damageInfo);
    
    // Give combat experience
    const xpGain = Math.floor(finalDamage / 5) + (isCritical ? 2 : 0);
    this.experienceSystem.giveExperience('combat', xpGain, 'Enemy Combat');
    
    if (enemyDied) {
      // Bonus XP for killing enemy
      this.experienceSystem.giveExperience('combat', closestEnemy.data.experience || 10, 'Enemy Defeated');
    }
  }
}