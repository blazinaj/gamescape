import * as THREE from 'three';
import { NPCData } from '../types/MapTypes';
import { collisionSystem } from '../services/CollisionSystem';
import { CollisionObject } from '../types/CollisionTypes';

export class NPC {
  public mesh: THREE.Group;
  public data: NPCData;
  private animationOffset: number;
  private collisionObject: CollisionObject;
  private interactionZone: CollisionObject;
  private lastInteractionTime: number = 0;
  private interactionCooldown: number = 1000; // 1 second between interactions

  constructor(data: NPCData, position: THREE.Vector3) {
    this.data = data;
    this.mesh = new THREE.Group();
    this.animationOffset = Math.random() * Math.PI * 2;
    
    // Create main collision object for NPC body
    this.collisionObject = {
      id: `npc_${data.id}`,
      type: 'npc',
      bounds: {
        type: 'capsule',
        center: { x: 0, y: 1, z: 0 },
        radius: 0.3 * data.appearance.scale,
        height: 1.8 * data.appearance.scale
      },
      position: { x: position.x, y: position.y, z: position.z },
      velocity: { x: 0, y: 0, z: 0 },
      mass: 60,
      isStatic: true, // NPCs don't move around much
      canCollideWith: ['character', 'enemy', 'dynamic'],
      userData: { type: 'npc', npcData: data }
    };

    // Create interaction zone around NPC
    this.interactionZone = {
      id: `npc_interaction_${data.id}`,
      type: 'trigger',
      bounds: {
        type: 'sphere',
        center: { x: 0, y: 1, z: 0 },
        radius: 2.5 // Interaction radius
      },
      position: { x: position.x, y: position.y, z: position.z },
      mass: 0,
      isStatic: true,
      canCollideWith: ['character'],
      userData: { 
        type: 'interactionZone', 
        npcId: data.id,
        npcName: data.name,
        triggerType: 'dialogue'
      }
    };

    // Register with collision system
    collisionSystem.registerObject(this.collisionObject);
    collisionSystem.registerObject(this.interactionZone);
    
    this.createNPCMesh();
    this.mesh.position.copy(position);
  }

  private createNPCMesh(): void {
    const appearance = this.data.appearance;

    // Main body (capsule-like shape)
    const bodyGeometry = new THREE.CapsuleGeometry(0.25, 1.0, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(appearance.clothingColor.replace('#', ''), 16) 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    this.mesh.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.22, 8, 6);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(appearance.bodyColor.replace('#', ''), 16) 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    this.mesh.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.04, 6, 4);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 1.65, 0.18);
    this.mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 1.65, 0.18);
    this.mesh.add(rightEye);

    // Simple smile
    const smileGeometry = new THREE.TorusGeometry(0.06, 0.01, 4, 8, Math.PI);
    const smileMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(0, 1.55, 0.18);
    smile.rotation.z = Math.PI;
    this.mesh.add(smile);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.6, 4, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(appearance.bodyColor.replace('#', ''), 16) 
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.35, 1.0, 0);
    leftArm.castShadow = true;
    this.mesh.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.35, 1.0, 0);
    rightArm.castShadow = true;
    this.mesh.add(rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.1, 0.6, 4, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(appearance.clothingColor.replace('#', ''), 16) 
    });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.12, 0.3, 0);
    leftLeg.castShadow = true;
    this.mesh.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.12, 0.3, 0);
    rightLeg.castShadow = true;
    this.mesh.add(rightLeg);

    // Scale the entire NPC
    this.mesh.scale.setScalar(appearance.scale);

    // Add name label above head
    this.addNameLabel();

    // Add occupation label
    this.addOccupationLabel();
  }

  private addNameLabel(): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = 'bold 20px Arial';
    context.textAlign = 'center';
    context.fillText(this.data.name, canvas.width / 2, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 2.5, 0);
    sprite.scale.set(2, 0.5, 1);
    this.mesh.add(sprite);
  }

  private addOccupationLabel(): void {
    if (!this.data.occupation) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 32;
    
    context.fillStyle = 'rgba(0, 100, 200, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText(this.data.occupation, canvas.width / 2, 20);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 2.0, 0);
    sprite.scale.set(1.5, 0.3, 1);
    this.mesh.add(sprite);
  }

  update(): void {
    // Gentle idle animation
    const time = Date.now() * 0.003 + this.animationOffset;
    const bobAmount = 0.03;
    
    // Subtle position bobbing
    const baseY = this.mesh.position.y;
    this.mesh.position.y = baseY + Math.sin(time) * bobAmount;

    // Gentle arm sway
    const arms = [this.mesh.children[3], this.mesh.children[4]]; // left and right arms
    if (arms[0] && arms[1]) {
      const swayAmount = 0.1;
      arms[0].rotation.z = Math.sin(time * 0.7) * swayAmount + 0.1;
      arms[1].rotation.z = -Math.sin(time * 0.7) * swayAmount - 0.1;
    }

    // Gentle head movement (looking around)
    const head = this.mesh.children[1]; // head
    if (head) {
      head.rotation.y = Math.sin(time * 0.3) * 0.2;
      head.rotation.x = Math.sin(time * 0.5) * 0.1;
    }

    // Update collision system position
    collisionSystem.updateObject(
      this.collisionObject.id,
      { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z }
    );
    
    collisionSystem.updateObject(
      this.interactionZone.id,
      { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z }
    );
  }

  // Enhanced interaction methods
  canInteract(): boolean {
    const now = Date.now();
    return now - this.lastInteractionTime > this.interactionCooldown;
  }

  startInteraction(): void {
    this.lastInteractionTime = Date.now();
    
    // Animation for interaction
    const head = this.mesh.children[1]; // head
    if (head) {
      // Look towards the player (simplified)
      head.rotation.y = 0;
      head.rotation.x = -0.1; // Slight nod
    }

    // Arms gesture
    const arms = [this.mesh.children[3], this.mesh.children[4]]; // left and right arms
    if (arms[0] && arms[1]) {
      arms[0].rotation.z = 0.3; // Welcoming gesture
      arms[1].rotation.z = -0.3;
    }

    // Reset animation after a delay
    setTimeout(() => {
      if (head) {
        head.rotation.x = 0;
      }
      if (arms[0] && arms[1]) {
        arms[0].rotation.z = 0.1;
        arms[1].rotation.z = -0.1;
      }
    }, 2000);

    console.log(`💬 Starting interaction with ${this.data.name} (${this.data.occupation})`);
  }

  // Get nearby characters for interaction
  getNearbyCharacters(radius: number = 3): CollisionObject[] {
    return collisionSystem.getObjectsInRadius(
      this.mesh.position,
      radius,
      ['character']
    );
  }

  // Check if player is in interaction range
  isPlayerInRange(playerPosition: THREE.Vector3): boolean {
    const distance = this.mesh.position.distanceTo(playerPosition);
    return distance <= 2.5 && this.canInteract();
  }

  // Simple pathfinding for NPC movement (if needed for quests)
  moveToPosition(targetPosition: THREE.Vector3, deltaTime: number): boolean {
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.mesh.position)
      .normalize();

    const speed = 0.5; // Slow NPC movement
    const velocity = direction.multiplyScalar(speed * deltaTime / 1000);
    
    const currentPos = this.mesh.position.clone();
    const desiredPos = currentPos.clone().add(velocity);
    
    // Use collision system for movement
    const collisionResult = collisionSystem.resolveCollision(
      this.collisionObject.id,
      { x: currentPos.x, y: currentPos.y, z: currentPos.z },
      { x: desiredPos.x, y: desiredPos.y, z: desiredPos.z },
      { x: velocity.x, y: velocity.y, z: velocity.z }
    );
    
    // Apply collision-resolved position
    this.mesh.position.set(
      collisionResult.newPosition.x,
      collisionResult.newPosition.y,
      collisionResult.newPosition.z
    );

    // Face the movement direction
    if (!collisionResult.blocked) {
      this.mesh.lookAt(targetPosition);
    }

    // Return true if reached target (within small threshold)
    return this.mesh.position.distanceTo(targetPosition) < 0.5;
  }

  // Get interaction prompt text
  getInteractionPrompt(): string {
    if (!this.canInteract()) {
      return 'Please wait...';
    }

    const prompts = [
      `Talk to ${this.data.name}`,
      `Speak with ${this.data.name}`,
      `Chat with the ${this.data.occupation}`,
      `Approach ${this.data.name}`
    ];

    return prompts[0]; // Default prompt
  }

  // Check line of sight to position (for quests/AI)
  hasLineOfSightTo(position: THREE.Vector3): boolean {
    const fromPos = {
      x: this.mesh.position.x,
      y: this.mesh.position.y + 1.6, // Head height
      z: this.mesh.position.z
    };
    const toPos = {
      x: position.x,
      y: position.y + 1,
      z: position.z
    };

    return collisionSystem.checkLineOfSight(fromPos, toPos, 20).clear;
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  distanceTo(position: THREE.Vector3): number {
    return this.mesh.position.distanceTo(position);
  }

  // Enhanced mood and state management
  getCurrentMood(): string {
    return this.data.mood;
  }

  setMood(newMood: string): void {
    this.data.mood = newMood;
    console.log(`${this.data.name} is now feeling ${newMood}`);
  }

  // Get conversation topics based on NPC state
  getAvailableTopics(): string[] {
    return this.data.topics;
  }

  addTopic(topic: string): void {
    if (!this.data.topics.includes(topic)) {
      this.data.topics.push(topic);
    }
  }

  removeTopic(topic: string): void {
    const index = this.data.topics.indexOf(topic);
    if (index > -1) {
      this.data.topics.splice(index, 1);
    }
  }

  dispose(): void {
    collisionSystem.unregisterObject(this.collisionObject.id);
    collisionSystem.unregisterObject(this.interactionZone.id);
  }
}