import * as THREE from 'three';
import { Enemy } from '../components/Enemy';
import { EnemyData } from '../types/EnemyTypes';
import { InventorySystem } from './InventorySystem';
import { CustomEnemy } from '../types/CustomEnemyTypes';

export class EnemyManager {
  private enemies: Enemy[] = [];
  private scene: THREE.Scene;
  private inventorySystem: InventorySystem;
  private spawnCooldown: number = 5000; // 5 seconds between spawns
  private lastSpawnTime: number = 0;
  private maxEnemies: number = 20;
  private spawnRadius: number = 50;
  private customEnemies: Map<string, CustomEnemy> = new Map();

  constructor(scene: THREE.Scene, inventorySystem: InventorySystem) {
    this.scene = scene;
    this.inventorySystem = inventorySystem;
  }

  registerCustomEnemies(customEnemies: CustomEnemy[]): void {
    if (!customEnemies || !Array.isArray(customEnemies)) {
      console.warn('⚠️ No valid enemies array provided to registerCustomEnemies');
      return;
    }

    customEnemies.forEach(enemy => {
      if (!enemy || typeof enemy !== 'object') {
        console.warn('⚠️ Invalid enemy object in registerCustomEnemies');
        return;
      }

      this.customEnemies.set(enemy.id, enemy);
      console.log(`🐺 Registered custom enemy: ${enemy.name || enemy.id}`);
    });
  }

  update(playerPosition: THREE.Vector3, deltaTime: number): void {
    // Update existing enemies
    this.enemies.forEach(enemy => {
      enemy.update(playerPosition, deltaTime);
    });

    // Remove dead enemies
    this.enemies = this.enemies.filter(enemy => {
      if (enemy.isDead()) {
        this.scene.remove(enemy.mesh);
        enemy.dispose();
        return false;
      }
      return true;
    });

    // Try to spawn new enemies
    const now = Date.now();
    if (now - this.lastSpawnTime > this.spawnCooldown && this.enemies.length < this.maxEnemies) {
      this.trySpawnEnemy(playerPosition);
      this.lastSpawnTime = now;
    }
  }

  private trySpawnEnemy(playerPosition: THREE.Vector3): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = this.spawnRadius * (0.5 + Math.random() * 0.5);
    
    const spawnPosition = new THREE.Vector3(
      playerPosition.x + Math.cos(angle) * distance,
      playerPosition.y,
      playerPosition.z + Math.sin(angle) * distance
    );

    // Randomly choose between default and custom enemies
    const useCustomEnemy = Math.random() < 0.3 && this.customEnemies.size > 0;
    
    let enemyData: EnemyData;
    
    if (useCustomEnemy) {
      const customEnemyArray = Array.from(this.customEnemies.values());
      const randomCustomEnemy = customEnemyArray[Math.floor(Math.random() * customEnemyArray.length)];
      enemyData = this.convertCustomEnemyToStandard(randomCustomEnemy);
    } else {
      enemyData = this.getRandomDefaultEnemy();
    }

    const enemy = new Enemy(enemyData, spawnPosition);
    this.enemies.push(enemy);
    this.scene.add(enemy.mesh);
    
    console.log(`🐺 Spawned ${enemyData.name} at position:`, spawnPosition);
  }

  private convertCustomEnemyToStandard(customEnemy: CustomEnemy): EnemyData {
    // Ensure stats exists with defaults if missing
    const stats = customEnemy.stats || {
      level: 1,
      health: 100,
      damage: 20,
      defense: 5,
      speed: 2,
      attackRange: 2,
      attackSpeed: 1,
      experienceValue: 50,
      detectRange: 8,
      aggression: 5
    };

    // Ensure appearance exists with defaults if missing
    const appearance = customEnemy.appearance || {
      primaryColor: '#8B4513',
      scale: 1
    };

    return {
      id: customEnemy.id,
      name: customEnemy.name || 'Unknown Enemy',
      type: customEnemy.type as any || 'goblin',
      maxHealth: stats.health,
      damage: stats.damage,
      speed: stats.speed,
      attackRange: stats.attackRange,
      attackCooldown: 1000 / (stats.attackSpeed || 1),
      experience: stats.experienceValue,
      behavior: (customEnemy.behavior?.isAggressive ? 'aggressive' : 'neutral') as any,
      detectionRange: stats.detectRange,
      appearance: {
        scale: appearance.scale || 1,
        bodyColor: appearance.primaryColor || '#8B4513',
        eyeColor: '#FF0000'
      }
    };
  }

  private getRandomDefaultEnemy(): EnemyData {
    const enemyTypes = ['goblin', 'orc', 'skeleton', 'wolf', 'spider'];
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    const baseStats = {
      goblin: { health: 60, damage: 15, speed: 3, experience: 25 },
      orc: { health: 120, damage: 30, speed: 2, experience: 50 },
      skeleton: { health: 80, damage: 20, speed: 2.5, experience: 35 },
      wolf: { health: 70, damage: 25, speed: 4, experience: 30 },
      spider: { health: 40, damage: 10, speed: 3.5, experience: 20 }
    };

    const stats = baseStats[randomType as keyof typeof baseStats];
    
    return {
      id: `${randomType}_${Date.now()}`,
      name: randomType.charAt(0).toUpperCase() + randomType.slice(1),
      type: randomType as any,
      maxHealth: stats.health,
      damage: stats.damage,
      speed: stats.speed,
      attackRange: 2,
      attackCooldown: 1000,
      experience: stats.experience,
      behavior: 'aggressive',
      detectionRange: 8,
      appearance: {
        scale: 0.8 + Math.random() * 0.4,
        bodyColor: this.getEnemyColor(randomType),
        eyeColor: '#FF0000'
      }
    };
  }

  private getEnemyColor(type: string): string {
    const colors = {
      goblin: '#4A7C59',
      orc: '#8B4513',
      skeleton: '#F5F5DC',
      wolf: '#8B4513',
      spider: '#2F2F2F'
    };
    return colors[type as keyof typeof colors] || '#8B4513';
  }

  checkEnemyAttacks(playerPosition: THREE.Vector3): number {
    let totalDamage = 0;
    
    this.enemies.forEach(enemy => {
      if (enemy.canAttackPlayer() && enemy.distanceTo(playerPosition) <= enemy.getCombatRadius()) {
        totalDamage += enemy.getDamage();
        console.log(`⚔️ ${enemy.data.name} attacks player for ${enemy.getDamage()} damage!`);
      }
    });
    
    return totalDamage;
  }

  getEnemiesInRange(position: THREE.Vector3, range: number): Enemy[] {
    return this.enemies.filter(enemy => 
      !enemy.isDead() && enemy.distanceTo(position) <= range
    );
  }

  clear(): void {
    this.enemies.forEach(enemy => {
      this.scene.remove(enemy.mesh);
      enemy.dispose();
    });
    this.enemies = [];
    this.customEnemies.clear();
  }

  getEnemyCount(): number {
    return this.enemies.length;
  }

  getAliveEnemyCount(): number {
    return this.enemies.filter(enemy => !enemy.isDead()).length;
  }
}