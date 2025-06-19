import * as THREE from 'three';
import { Enemy } from '../components/Enemy';
import { EnemyData } from '../types/EnemyTypes';
import { InventorySystem } from './InventorySystem';
import { notificationSystem } from './NotificationSystem';

export class EnemyManager {
  private scene: THREE.Scene;
  private enemies = new Map<string, Enemy>();
  private inventorySystem: InventorySystem;
  private spawnPoints = new Set<string>();
  private lastSpawnTime = 0;
  private spawnCooldown = 10000; // 10 seconds between spawns
  private maxEnemies = 8; // Maximum enemies at once

  constructor(scene: THREE.Scene, inventorySystem: InventorySystem) {
    this.scene = scene;
    this.inventorySystem = inventorySystem;
  }

  update(playerPosition: THREE.Vector3, deltaTime: number): void {
    const now = Date.now();

    // Update existing enemies
    this.enemies.forEach((enemy, id) => {
      if (enemy.isDead()) {
        // Handle death - remove after delay
        setTimeout(() => {
          this.removeEnemy(id);
        }, 3000);
      } else {
        enemy.update(playerPosition, deltaTime);
      }
    });

    // Spawn new enemies
    if (now - this.lastSpawnTime > this.spawnCooldown && this.enemies.size < this.maxEnemies) {
      this.trySpawnEnemy(playerPosition);
      this.lastSpawnTime = now;
    }
  }

  private trySpawnEnemy(playerPosition: THREE.Vector3): void {
    // Find spawn position away from player but not too far
    const spawnDistance = 15 + Math.random() * 10; // 15-25 units away
    const angle = Math.random() * Math.PI * 2;
    
    const spawnPosition = new THREE.Vector3(
      playerPosition.x + Math.cos(angle) * spawnDistance,
      0, // Ground level
      playerPosition.z + Math.sin(angle) * spawnDistance
    );

    // Check if spawn point is already used
    const spawnKey = `${Math.floor(spawnPosition.x / 5)}_${Math.floor(spawnPosition.z / 5)}`;
    if (this.spawnPoints.has(spawnKey)) return;

    // Create random enemy
    const enemyData = this.generateRandomEnemy(spawnPosition);
    const enemy = new Enemy(enemyData, spawnPosition);
    
    this.enemies.set(enemyData.id, enemy);
    this.scene.add(enemy.mesh);
    this.spawnPoints.add(spawnKey);

    console.log(`👹 Spawned ${enemyData.name} at distance ${spawnDistance.toFixed(1)} from player`);
  }

  private generateRandomEnemy(position: THREE.Vector3): EnemyData {
    const enemyTypes = ['goblin', 'orc', 'skeleton', 'wolf', 'spider'] as const;
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    const baseStats = this.getEnemyBaseStats(type);
    
    return {
      id: `enemy_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateEnemyName(type),
      type,
      ...baseStats,
      drops: this.generateDrops(type),
      appearance: {
        bodyColor: this.getEnemyColor(type),
        scale: 0.8 + Math.random() * 0.4, // 0.8 to 1.2 scale
        modelType: type
      }
    };
  }

  private getEnemyBaseStats(type: string) {
    const stats = {
      goblin: {
        maxHealth: 40,
        damage: 8,
        speed: 3,
        attackRange: 1.5,
        attackCooldown: 1200,
        experience: 10,
        behavior: 'aggressive' as const,
        detectionRange: 8
      },
      orc: {
        maxHealth: 80,
        damage: 15,
        speed: 2.5,
        attackRange: 2,
        attackCooldown: 1500,
        experience: 25,
        behavior: 'aggressive' as const,
        detectionRange: 10
      },
      skeleton: {
        maxHealth: 60,
        damage: 12,
        speed: 2,
        attackRange: 1.8,
        attackCooldown: 1000,
        experience: 20,
        behavior: 'aggressive' as const,
        detectionRange: 12
      },
      wolf: {
        maxHealth: 50,
        damage: 10,
        speed: 4,
        attackRange: 1.2,
        attackCooldown: 800,
        experience: 15,
        behavior: 'aggressive' as const,
        detectionRange: 6
      },
      spider: {
        maxHealth: 35,
        damage: 6,
        speed: 3.5,
        attackRange: 1,
        attackCooldown: 600,
        experience: 12,
        behavior: 'aggressive' as const,
        detectionRange: 5
      },
      troll: {
        maxHealth: 150,
        damage: 25,
        speed: 1.5,
        attackRange: 3,
        attackCooldown: 2500,
        experience: 50,
        behavior: 'aggressive' as const,
        detectionRange: 15
      }
    };

    return stats[type as keyof typeof stats] || stats.goblin;
  }

  private generateEnemyName(type: string): string {
    const names = {
      goblin: ['Grax', 'Snik', 'Bogg', 'Zitt', 'Krex'],
      orc: ['Gorthak', 'Drogul', 'Thokk', 'Grimjaw', 'Bloodfang'],
      skeleton: ['Boneclaw', 'Rattlebones', 'Grimskull', 'Deathrattle', 'Soulless'],
      wolf: ['Shadowfang', 'Greymaw', 'Nighthowl', 'Bloodpaw', 'Darkclaw'],
      spider: ['Webweaver', 'Poisonfang', 'Blackwidow', 'Silkspinner', 'Venomstrike'],
      troll: ['Rockfist', 'Stonehide', 'Boulderbash', 'Ironjaw', 'Mountainbane']
    };

    const typeNames = names[type as keyof typeof names] || names.goblin;
    return typeNames[Math.floor(Math.random() * typeNames.length)];
  }

  private getEnemyColor(type: string): string {
    const colors = {
      goblin: '#228B22', // Green
      orc: '#8B4513',    // Brown
      skeleton: '#F5F5DC', // Bone white
      wolf: '#696969',   // Gray
      spider: '#000000', // Black
      troll: '#708090'   // Slate gray
    };

    return colors[type as keyof typeof colors] || '#696969';
  }

  private generateDrops(type: string) {
    const commonDrops = [
      { itemId: 'wood_log', quantity: 1, chance: 0.3 },
      { itemId: 'stone', quantity: 2, chance: 0.4 },
      { itemId: 'berry', quantity: 1, chance: 0.2 }
    ];

    const rareDrops = {
      goblin: [
        { itemId: 'flint', quantity: 1, chance: 0.5 },
        { itemId: 'old_coin', quantity: 1, chance: 0.1 }
      ],
      orc: [
        { itemId: 'iron_ore', quantity: 1, chance: 0.3 },
        { itemId: 'old_coin', quantity: 2, chance: 0.15 }
      ],
      skeleton: [
        { itemId: 'crystal_shard', quantity: 1, chance: 0.2 },
        { itemId: 'old_coin', quantity: 1, chance: 0.25 }
      ],
      wolf: [
        { itemId: 'rope', quantity: 1, chance: 0.4 },
        { itemId: 'berry', quantity: 2, chance: 0.6 }
      ],
      spider: [
        { itemId: 'rope', quantity: 2, chance: 0.7 },
        { itemId: 'crystal_shard', quantity: 1, chance: 0.1 }
      ],
      troll: [
        { itemId: 'iron_ore', quantity: 3, chance: 0.8 },
        { itemId: 'crystal_shard', quantity: 2, chance: 0.4 },
        { itemId: 'old_coin', quantity: 5, chance: 0.6 }
      ]
    };

    const typeDrops = rareDrops[type as keyof typeof rareDrops] || [];
    return [...commonDrops, ...typeDrops];
  }

  killEnemy(enemyId: string, damageSource: string): void {
    const enemy = this.enemies.get(enemyId);
    if (!enemy || enemy.isDead()) return;

    console.log(`💀 ${enemy.data.name} has been slain by ${damageSource}!`);

    // Generate loot
    const droppedItems: { name: string; icon: string; quantity: number }[] = [];
    
    enemy.data.drops.forEach(drop => {
      if (Math.random() <= drop.chance) {
        if (this.inventorySystem.addItem(drop.itemId, drop.quantity)) {
          const itemStack = this.inventorySystem.getInventory().find(stack => stack.item.id === drop.itemId);
          if (itemStack) {
            droppedItems.push({
              name: itemStack.item.name,
              icon: itemStack.item.icon,
              quantity: drop.quantity
            });
          }
        }
      }
    });

    // Show loot notification
    if (droppedItems.length > 0) {
      notificationSystem.showItemNotification(
        `Defeated ${enemy.data.name}`,
        droppedItems
      );
    }

    // Mark enemy as dead (will be removed after delay)
    enemy.takeDamage({ amount: 9999, type: 'physical', source: damageSource, isCritical: false });
  }

  private removeEnemy(enemyId: string): void {
    const enemy = this.enemies.get(enemyId);
    if (!enemy) return;

    this.scene.remove(enemy.mesh);
    this.enemies.delete(enemyId);

    // Clear spawn point
    const position = enemy.getPosition();
    const spawnKey = `${Math.floor(position.x / 5)}_${Math.floor(position.z / 5)}`;
    this.spawnPoints.delete(spawnKey);

    console.log(`🗑️ Removed enemy ${enemyId}`);
  }

  getEnemiesInRange(position: THREE.Vector3, range: number): Enemy[] {
    const enemiesInRange: Enemy[] = [];
    
    this.enemies.forEach(enemy => {
      if (!enemy.isDead() && enemy.distanceTo(position) <= range) {
        enemiesInRange.push(enemy);
      }
    });
    
    return enemiesInRange;
  }

  getClosestEnemy(position: THREE.Vector3, maxRange: number = Infinity): Enemy | null {
    let closestEnemy: Enemy | null = null;
    let closestDistance = maxRange;

    this.enemies.forEach(enemy => {
      if (!enemy.isDead()) {
        const distance = enemy.distanceTo(position);
        if (distance < closestDistance) {
          closestEnemy = enemy;
          closestDistance = distance;
        }
      }
    });

    return closestEnemy;
  }

  checkEnemyAttacks(playerPosition: THREE.Vector3): number {
    let totalDamage = 0;

    this.enemies.forEach(enemy => {
      if (enemy.canAttackPlayer() && enemy.distanceTo(playerPosition) <= enemy.data.attackRange) {
        totalDamage += enemy.getDamage();
        console.log(`⚔️ ${enemy.data.name} attacks player for ${enemy.getDamage()} damage!`);
      }
    });

    return totalDamage;
  }

  clear(): void {
    this.enemies.forEach(enemy => {
      this.scene.remove(enemy.mesh);
    });
    this.enemies.clear();
    this.spawnPoints.clear();
  }

  getAllEnemies(): Enemy[] {
    return Array.from(this.enemies.values());
  }
}