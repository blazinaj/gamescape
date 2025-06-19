import * as THREE from 'three';
import { EnemyData, EnemyState } from '../types/EnemyTypes';
import { HealthState, DamageInfo } from '../types/HealthTypes';
import { collisionSystem } from '../services/CollisionSystem';
import { CollisionObject } from '../types/CollisionTypes';

export class Enemy {
  public mesh: THREE.Group;
  public data: EnemyData;
  public state: EnemyState;
  public health: HealthState;
  private animationOffset: number;
  private velocity: THREE.Vector3;
  private lastUpdateTime: number = Date.now();
  private collisionObject: CollisionObject;
  private combatHitbox: CollisionObject;
  private detectionZone: CollisionObject;
  private lastPathfindTime: number = 0;
  private pathfindCooldown: number = 500; // ms between pathfinding updates

  constructor(data: EnemyData, position: THREE.Vector3) {
    this.data = data;
    this.mesh = new THREE.Group();
    this.animationOffset = Math.random() * Math.PI * 2;
    this.velocity = new THREE.Vector3();
    
    // Initialize health
    this.health = {
      current: data.maxHealth,
      maximum: data.maxHealth,
      regeneration: 0.5,
      lastDamageTime: 0,
      isRegenerating: false
    };

    // Initialize AI state
    this.state = {
      target: null,
      lastAttackTime: 0,
      isAttacking: false,
      isDead: false,
      patrolCenter: position.clone(),
      patrolRadius: 5,
      alertLevel: 0
    };

    // Create main collision object
    this.collisionObject = {
      id: `enemy_${data.id}`,
      type: 'enemy',
      bounds: {
        type: 'sphere',
        center: { x: 0, y: data.appearance.scale, z: 0 },
        radius: 0.5 * data.appearance.scale
      },
      position: { x: position.x, y: position.y, z: position.z },
      velocity: { x: 0, y: 0, z: 0 },
      mass: 50,
      canCollideWith: ['character', 'static', 'enemy', 'interactable', 'npc'],
      userData: { type: 'enemy', enemyData: data }
    };

    // Create combat hitbox (larger for easier combat)
    this.combatHitbox = {
      id: `enemy_combat_${data.id}`,
      type: 'trigger',
      bounds: {
        type: 'sphere',
        center: { x: 0, y: data.appearance.scale, z: 0 },
        radius: data.attackRange * 1.2 // Slightly larger than attack range
      },
      position: { x: position.x, y: position.y, z: position.z },
      mass: 0,
      isStatic: false,
      canCollideWith: ['character'],
      userData: { 
        type: 'combatZone', 
        enemyId: data.id,
        triggerType: 'combat'
      }
    };

    // Create detection zone for AI
    this.detectionZone = {
      id: `enemy_detection_${data.id}`,
      type: 'trigger',
      bounds: {
        type: 'sphere',
        center: { x: 0, y: data.appearance.scale, z: 0 },
        radius: data.detectionRange
      },
      position: { x: position.x, y: position.y, z: position.z },
      mass: 0,
      isStatic: false,
      canCollideWith: ['character'],
      userData: { 
        type: 'detectionZone', 
        enemyId: data.id,
        triggerType: 'detection'
      }
    };

    // Register with collision system
    collisionSystem.registerObject(this.collisionObject);
    collisionSystem.registerObject(this.combatHitbox);
    collisionSystem.registerObject(this.detectionZone);

    this.createEnemyMesh();
    this.mesh.position.copy(position);
  }

  private createEnemyMesh(): void {
    const appearance = this.data.appearance;
    const scale = appearance.scale;

    // Main body - different shapes for different enemy types
    let bodyGeometry: THREE.BufferGeometry;
    switch (this.data.type) {
      case 'goblin':
        bodyGeometry = new THREE.CapsuleGeometry(0.2 * scale, 0.8 * scale, 4, 8);
        break;
      case 'orc':
        bodyGeometry = new THREE.CapsuleGeometry(0.35 * scale, 1.2 * scale, 4, 8);
        break;
      case 'skeleton':
        bodyGeometry = new THREE.CapsuleGeometry(0.25 * scale, 1.0 * scale, 4, 8);
        break;
      case 'wolf':
        bodyGeometry = new THREE.CapsuleGeometry(0.3 * scale, 0.6 * scale, 4, 8);
        break;
      case 'spider':
        bodyGeometry = new THREE.SphereGeometry(0.4 * scale, 8, 6);
        break;
      case 'troll':
        bodyGeometry = new THREE.CapsuleGeometry(0.5 * scale, 2.0 * scale, 4, 8);
        break;
      default:
        bodyGeometry = new THREE.CapsuleGeometry(0.25 * scale, 1.0 * scale, 4, 8);
    }

    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(appearance.bodyColor.replace('#', ''), 16) 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    if (this.data.type === 'wolf') {
      body.position.y = 0.4 * scale;
      body.rotation.z = Math.PI / 2;
    } else if (this.data.type === 'spider') {
      body.position.y = 0.3 * scale;
    } else {
      body.position.y = 0.8 * scale;
    }
    
    body.castShadow = true;
    this.mesh.add(body);

    // Add specific features based on enemy type
    this.addEnemyFeatures(scale);

    // Add health bar above enemy
    this.addHealthBar();

    // Add name label
    this.addNameLabel();
  }

  private addEnemyFeatures(scale: number): void {
    switch (this.data.type) {
      case 'goblin':
        this.addEars(scale);
        this.addEyes(scale, 0x8B0000);
        break;
      
      case 'orc':
        this.addTusks(scale);
        this.addEyes(scale, 0x8B0000);
        break;
      
      case 'skeleton':
        this.addSkeletonFeatures(scale);
        this.addEyes(scale, 0x00FF00);
        break;
      
      case 'wolf':
        this.addWolfFeatures(scale);
        this.addEyes(scale, 0xFFFF00);
        break;
      
      case 'spider':
        this.addSpiderLegs(scale);
        this.addEyes(scale, 0x000000, 8);
        break;
      
      case 'troll':
        this.addTrollFeatures(scale);
        this.addEyes(scale, 0x8B0000);
        break;
    }
  }

  private addEars(scale: number): void {
    const earGeometry = new THREE.ConeGeometry(0.05 * scale, 0.15 * scale, 4);
    const earMaterial = new THREE.MeshLambertMaterial({ color: parseInt(this.data.appearance.bodyColor.replace('#', ''), 16) });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.15 * scale, 1.4 * scale, 0);
    leftEar.rotation.z = -0.3;
    this.mesh.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.15 * scale, 1.4 * scale, 0);
    rightEar.rotation.z = 0.3;
    this.mesh.add(rightEar);
  }

  private addTusks(scale: number): void {
    const tuskGeometry = new THREE.ConeGeometry(0.02 * scale, 0.12 * scale, 4);
    const tuskMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFF0 });
    
    const leftTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
    leftTusk.position.set(-0.08 * scale, 1.35 * scale, 0.15 * scale);
    leftTusk.rotation.x = 0.3;
    this.mesh.add(leftTusk);
    
    const rightTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
    rightTusk.position.set(0.08 * scale, 1.35 * scale, 0.15 * scale);
    rightTusk.rotation.x = 0.3;
    this.mesh.add(rightTusk);
  }

  private addSkeletonFeatures(scale: number): void {
    for (let i = 0; i < 3; i++) {
      const ribGeometry = new THREE.CylinderGeometry(0.01 * scale, 0.01 * scale, 0.3 * scale, 4);
      const ribMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
      const rib = new THREE.Mesh(ribGeometry, ribMaterial);
      rib.position.set(0, 1.0 * scale - i * 0.15 * scale, 0.15 * scale);
      rib.rotation.z = Math.PI / 2;
      this.mesh.add(rib);
    }
  }

  private addWolfFeatures(scale: number): void {
    const snoutGeometry = new THREE.ConeGeometry(0.08 * scale, 0.2 * scale, 6);
    const snoutMaterial = new THREE.MeshLambertMaterial({ color: parseInt(this.data.appearance.bodyColor.replace('#', ''), 16) });
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.position.set(0, 0.4 * scale, 0.3 * scale);
    snout.rotation.x = Math.PI / 2;
    this.mesh.add(snout);

    const tailGeometry = new THREE.CylinderGeometry(0.05 * scale, 0.02 * scale, 0.6 * scale, 6);
    const tailMaterial = new THREE.MeshLambertMaterial({ color: parseInt(this.data.appearance.bodyColor.replace('#', ''), 16) });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.5 * scale, -0.5 * scale);
    tail.rotation.x = 0.5;
    this.mesh.add(tail);
  }

  private addSpiderLegs(scale: number): void {
    const legGeometry = new THREE.CylinderGeometry(0.02 * scale, 0.01 * scale, 0.4 * scale, 4);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(
        Math.cos(angle) * 0.4 * scale,
        0.1 * scale,
        Math.sin(angle) * 0.4 * scale
      );
      leg.rotation.x = Math.PI / 2;
      leg.rotation.z = angle;
      this.mesh.add(leg);
    }
  }

  private addTrollFeatures(scale: number): void {
    const clubGeometry = new THREE.CylinderGeometry(0.08 * scale, 0.05 * scale, 1.0 * scale, 6);
    const clubMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const club = new THREE.Mesh(clubGeometry, clubMaterial);
    club.position.set(0.6 * scale, 1.2 * scale, 0);
    club.rotation.z = -0.3;
    this.mesh.add(club);
  }

  private addEyes(scale: number, color: number, count: number = 2): void {
    const eyeGeometry = new THREE.SphereGeometry(0.03 * scale, 6, 4);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color });
    
    if (count === 2) {
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.08 * scale, 1.5 * scale, 0.15 * scale);
      this.mesh.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.08 * scale, 1.5 * scale, 0.15 * scale);
      this.mesh.add(rightEye);
    } else {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI;
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.set(
          Math.cos(angle) * 0.15 * scale,
          0.4 * scale,
          Math.sin(angle) * 0.15 * scale + 0.3 * scale
        );
        this.mesh.add(eye);
      }
    }
  }

  private addHealthBar(): void {
    const barWidth = 0.8;
    const barHeight = 0.1;
    
    const barBgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const barBgMaterial = new THREE.MeshLambertMaterial({ color: 0x333333, transparent: true, opacity: 0.8 });
    const barBg = new THREE.Mesh(barBgGeometry, barBgMaterial);
    barBg.position.set(0, 2.5, 0);
    barBg.lookAt(0, 2.5, 1);
    this.mesh.add(barBg);

    const barFillGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const barFillMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00, transparent: true, opacity: 0.9 });
    const barFill = new THREE.Mesh(barFillGeometry, barFillMaterial);
    barFill.position.set(0, 2.5, 0.01);
    barFill.lookAt(0, 2.5, 1);
    this.mesh.add(barFill);

    this.mesh.userData.healthBar = barFill;
    this.mesh.userData.healthBarMaterial = barFillMaterial;
  }

  private addNameLabel(): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(139, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = 'bold 20px Arial';
    context.textAlign = 'center';
    context.fillText(this.data.name, canvas.width / 2, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 3.0, 0);
    sprite.scale.set(1.5, 0.4, 1);
    this.mesh.add(sprite);
  }

  update(playerPosition: THREE.Vector3, deltaTime: number): void {
    if (this.state.isDead) return;

    // Update health regeneration
    this.updateHealth(deltaTime);

    // Update AI behavior with enhanced collision detection
    this.updateAI(playerPosition, deltaTime);

    // Update animations
    this.updateAnimations(deltaTime);

    // Update health bar
    this.updateHealthBar();

    // Update collision system positions
    this.updateCollisionObjects();
  }

  private updateCollisionObjects(): void {
    const position = { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z };
    const velocity = { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z };

    collisionSystem.updateObject(this.collisionObject.id, position, velocity);
    collisionSystem.updateObject(this.combatHitbox.id, position);
    collisionSystem.updateObject(this.detectionZone.id, position);
  }

  private updateHealth(deltaTime: number): void {
    const now = Date.now();
    
    if (now - this.health.lastDamageTime > 5000 && this.health.current < this.health.maximum) {
      this.health.isRegenerating = true;
      this.health.current = Math.min(
        this.health.maximum,
        this.health.current + this.health.regeneration * deltaTime / 1000
      );
    }
  }

  private updateAI(playerPosition: THREE.Vector3, deltaTime: number): void {
    const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
    const now = Date.now();

    // Enhanced detection using line of sight
    this.updateDetection(playerPosition, distanceToPlayer);

    // Enhanced movement with pathfinding
    if (this.state.target && this.data.behavior === 'aggressive') {
      if (distanceToPlayer > this.data.attackRange) {
        this.moveTowardsTarget(deltaTime);
      } else {
        // Attack if in range and cooldown expired
        if (now - this.state.lastAttackTime >= this.data.attackCooldown) {
          this.attack();
          this.state.lastAttackTime = now;
        }
      }
    } else {
      // Enhanced patrol behavior
      this.patrol(deltaTime);
    }
  }

  private updateDetection(playerPosition: THREE.Vector3, distanceToPlayer: number): void {
    if (distanceToPlayer <= this.data.detectionRange) {
      // Check line of sight to player
      const eyeHeight = this.data.appearance.scale * 1.5;
      const fromPos = {
        x: this.mesh.position.x,
        y: this.mesh.position.y + eyeHeight,
        z: this.mesh.position.z
      };
      const toPos = {
        x: playerPosition.x,
        y: playerPosition.y + 1, // Player eye height
        z: playerPosition.z
      };

      const losResult = collisionSystem.checkLineOfSight(
        fromPos, 
        toPos, 
        this.data.detectionRange,
        ['trigger', 'enemy'] // Ignore these for LOS
      );

      if (losResult.clear) {
        this.state.target = playerPosition.clone();
        this.state.alertLevel = Math.min(1, this.state.alertLevel + 0.02);
      } else {
        // Gradual alert decay when no clear sight
        this.state.alertLevel = Math.max(0, this.state.alertLevel - 0.01);
        if (this.state.alertLevel <= 0) {
          this.state.target = null;
        }
      }
    } else {
      this.state.alertLevel = Math.max(0, this.state.alertLevel - 0.01);
      if (this.state.alertLevel <= 0) {
        this.state.target = null;
      }
    }
  }

  private moveTowardsTarget(deltaTime: number): void {
    if (!this.state.target) return;

    const now = Date.now();
    
    // Pathfinding update with cooldown
    if (now - this.lastPathfindTime > this.pathfindCooldown) {
      this.updatePathfinding();
      this.lastPathfindTime = now;
    }

    const direction = new THREE.Vector3()
      .subVectors(this.state.target, this.mesh.position)
      .normalize();

    // Enhanced movement with collision detection and avoidance
    this.velocity.copy(direction).multiplyScalar(this.data.speed * deltaTime / 1000);
    
    const currentPos = this.mesh.position.clone();
    const desiredPos = currentPos.clone().add(this.velocity);
    
    // Use collision system for movement
    const collisionResult = collisionSystem.resolveCollision(
      this.collisionObject.id,
      { x: currentPos.x, y: currentPos.y, z: currentPos.z },
      { x: desiredPos.x, y: desiredPos.y, z: desiredPos.z },
      { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z }
    );
    
    // Apply collision-resolved position
    this.mesh.position.set(
      collisionResult.newPosition.x,
      collisionResult.newPosition.y,
      collisionResult.newPosition.z
    );
    
    // Update velocity based on collision
    if (collisionResult.newVelocity) {
      this.velocity.set(
        collisionResult.newVelocity.x,
        collisionResult.newVelocity.y,
        collisionResult.newVelocity.z
      );
    }
    
    // Face target if not completely blocked
    if (!collisionResult.blocked || collisionResult.sliding) {
      this.mesh.lookAt(this.state.target);
    }

    // If blocked, try alternative pathfinding
    if (collisionResult.blocked && !collisionResult.sliding) {
      this.handleMovementBlocked();
    }
  }

  private updatePathfinding(): void {
    if (!this.state.target) return;

    // Simple obstacle avoidance
    const nearbyObstacles = collisionSystem.getObjectsInRadius(
      this.mesh.position,
      3,
      ['static', 'enemy']
    );

    if (nearbyObstacles.length > 0) {
      // Find alternative path around obstacles
      const avoidanceVector = new THREE.Vector3();
      
      for (const obstacle of nearbyObstacles) {
        const obstaclePos = new THREE.Vector3(
          obstacle.position.x,
          obstacle.position.y,
          obstacle.position.z
        );
        
        const awayFromObstacle = new THREE.Vector3()
          .subVectors(this.mesh.position, obstaclePos)
          .normalize();
        
        avoidanceVector.add(awayFromObstacle);
      }
      
      // Blend avoidance with target direction
      const targetDirection = new THREE.Vector3()
        .subVectors(this.state.target, this.mesh.position)
        .normalize();
      
      avoidanceVector.normalize().multiplyScalar(0.3);
      targetDirection.multiplyScalar(0.7);
      
      const blendedDirection = targetDirection.add(avoidanceVector).normalize();
      
      // Update target temporarily for obstacle avoidance
      const avoidanceTarget = this.mesh.position.clone()
        .add(blendedDirection.multiplyScalar(2));
      
      this.state.target = avoidanceTarget;
    }
  }

  private handleMovementBlocked(): void {
    // Try moving in perpendicular direction to find way around
    const alternativeDirections = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1)
    ];

    for (const direction of alternativeDirections) {
      const testPosition = this.mesh.position.clone()
        .add(direction.multiplyScalar(1));
      
      if (collisionSystem.checkCollision(
        this.collisionObject.id,
        this.mesh.position,
        testPosition
      ).collided === false) {
        // Found clear direction
        this.velocity.copy(direction).multiplyScalar(this.data.speed * 0.5);
        break;
      }
    }
  }

  private patrol(deltaTime: number): void {
    const distanceFromCenter = this.mesh.position.distanceTo(this.state.patrolCenter);
    
    if (distanceFromCenter > this.state.patrolRadius) {
      // Return to patrol area with collision detection
      const direction = new THREE.Vector3()
        .subVectors(this.state.patrolCenter, this.mesh.position)
        .normalize();
      
      this.velocity.copy(direction).multiplyScalar(this.data.speed * 0.5 * deltaTime / 1000);
      
      const currentPos = this.mesh.position.clone();
      const desiredPos = currentPos.clone().add(this.velocity);
      
      const collisionResult = collisionSystem.resolveCollision(
        this.collisionObject.id,
        { x: currentPos.x, y: currentPos.y, z: currentPos.z },
        { x: desiredPos.x, y: desiredPos.y, z: desiredPos.z },
        { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z }
      );
      
      this.mesh.position.set(
        collisionResult.newPosition.x,
        collisionResult.newPosition.y,
        collisionResult.newPosition.z
      );
    } else {
      // Random movement within patrol area with collision checking
      if (Math.random() < 0.01) {
        const randomAngle = Math.random() * Math.PI * 2;
        const direction = new THREE.Vector3(
          Math.cos(randomAngle),
          0,
          Math.sin(randomAngle)
        );
        
        // Check if movement is clear before applying
        const testPosition = this.mesh.position.clone()
          .add(direction.multiplyScalar(1));
        
        if (!collisionSystem.checkCollision(
          this.collisionObject.id,
          this.mesh.position,
          testPosition
        ).collided) {
          this.velocity.copy(direction).multiplyScalar(this.data.speed * 0.3 * deltaTime / 1000);
          
          const currentPos = this.mesh.position.clone();
          const desiredPos = currentPos.clone().add(this.velocity);
          
          const collisionResult = collisionSystem.resolveCollision(
            this.collisionObject.id,
            { x: currentPos.x, y: currentPos.y, z: currentPos.z },
            { x: desiredPos.x, y: desiredPos.y, z: desiredPos.z },
            { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z }
          );
          
          this.mesh.position.set(
            collisionResult.newPosition.x,
            collisionResult.newPosition.y,
            collisionResult.newPosition.z
          );
        }
      }
    }
  }

  private attack(): void {
    this.state.isAttacking = true;
    console.log(`💀 ${this.data.name} attacks for ${this.data.damage} damage!`);
    
    setTimeout(() => {
      this.state.isAttacking = false;
    }, 500);
  }

  private updateAnimations(deltaTime: number): void {
    const time = Date.now() * 0.003 + this.animationOffset;
    
    if (this.state.isAttacking) {
      this.mesh.rotation.y += Math.sin(time * 10) * 0.1;
      this.mesh.position.y += Math.sin(time * 20) * 0.02;
    } else if (this.velocity.length() > 0.001) {
      this.mesh.position.y += Math.sin(time * 2) * 0.02;
      this.mesh.rotation.x = Math.sin(time * 2) * 0.05;
    } else {
      this.mesh.position.y += Math.sin(time * 0.5) * 0.01;
    }
  }

  private updateHealthBar(): void {
    const healthBar = this.mesh.userData.healthBar;
    const healthBarMaterial = this.mesh.userData.healthBarMaterial;
    
    if (healthBar && healthBarMaterial) {
      const healthPercent = this.health.current / this.health.maximum;
      healthBar.scale.x = healthPercent;
      
      if (healthPercent > 0.6) {
        healthBarMaterial.color.setHex(0x00FF00);
      } else if (healthPercent > 0.3) {
        healthBarMaterial.color.setHex(0xFFFF00);
      } else {
        healthBarMaterial.color.setHex(0xFF0000);
      }
    }
  }

  takeDamage(damageInfo: DamageInfo): boolean {
    if (this.state.isDead) return false;

    this.health.current = Math.max(0, this.health.current - damageInfo.amount);
    this.health.lastDamageTime = Date.now();
    this.health.isRegenerating = false;
    
    console.log(`💥 ${this.data.name} takes ${damageInfo.amount} damage! (${this.health.current}/${this.health.maximum} HP)`);

    this.flashDamage();

    if (this.health.current <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  private flashDamage(): void {
    const originalMaterials: THREE.Material[] = [];
    
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child !== this.mesh.userData.healthBar) {
        originalMaterials.push(child.material);
        const flashMaterial = new THREE.MeshLambertMaterial({ 
          color: 0xff0000,
          transparent: true,
          opacity: 0.8
        });
        child.material = flashMaterial;
      }
    });

    setTimeout(() => {
      let materialIndex = 0;
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child !== this.mesh.userData.healthBar && originalMaterials[materialIndex]) {
          child.material = originalMaterials[materialIndex];
          materialIndex++;
        }
      });
    }, 200);
  }

  private die(): void {
    this.state.isDead = true;
    console.log(`💀 ${this.data.name} has been defeated!`);
    
    this.mesh.rotation.z = Math.PI / 2;
    
    // Remove from collision system
    collisionSystem.unregisterObject(this.collisionObject.id);
    collisionSystem.unregisterObject(this.combatHitbox.id);
    collisionSystem.unregisterObject(this.detectionZone.id);
  }

  // Enhanced getter methods for AI and combat
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  distanceTo(position: THREE.Vector3): number {
    return this.mesh.position.distanceTo(position);
  }

  isDead(): boolean {
    return this.state.isDead;
  }

  canAttackPlayer(): boolean {
    return !this.state.isDead && 
           this.state.target !== null && 
           Date.now() - this.state.lastAttackTime >= this.data.attackCooldown;
  }

  getDamage(): number {
    return this.data.damage;
  }

  hasLineOfSightTo(position: THREE.Vector3): boolean {
    const fromPos = {
      x: this.mesh.position.x,
      y: this.mesh.position.y + this.data.appearance.scale * 1.5,
      z: this.mesh.position.z
    };
    const toPos = {
      x: position.x,
      y: position.y + 1,
      z: position.z
    };

    return collisionSystem.checkLineOfSight(fromPos, toPos, this.data.detectionRange).clear;
  }

  getDetectionRadius(): number {
    return this.data.detectionRange;
  }

  getCombatRadius(): number {
    return this.data.attackRange;
  }

  dispose(): void {
    collisionSystem.unregisterObject(this.collisionObject.id);
    collisionSystem.unregisterObject(this.combatHitbox.id);
    collisionSystem.unregisterObject(this.detectionZone.id);
  }
}