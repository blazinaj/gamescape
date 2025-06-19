import * as THREE from 'three';
import { collisionSystem } from '../../services/CollisionSystem';
import { CollisionObject, TriggerZone } from '../../types/CollisionTypes';
import { CharacterCustomization } from '../../types/CharacterTypes';

// Add this at the top of the file to temporarily disable collisions
const COLLISIONS_ENABLED = false;

export class CharacterCollision {
  private characterId: string;
  private collisionObject: CollisionObject;
  private triggerCallbacks: Map<string, (trigger: CollisionObject) => void> = new Map();
  private lastTriggers: Set<string> = new Set();

  constructor(characterId: string, customization: CharacterCustomization) {
    this.characterId = characterId;
    
    // Define collision capsule dimensions
    const radius = 0.4 * customization.bodyWidth * customization.scale;
    const height = 2.0 * customization.scale;

    // Position capsule so its bottom is exactly at y=0
    // When center.y = radius, the bottom of the capsule touches the ground
    this.collisionObject = {
      id: characterId,
      type: 'character',
      bounds: {
        type: 'capsule',
        center: { x: 0, y: radius, z: 0 }, // Bottom of capsule at y=0
        radius: radius,
        height: height - radius * 2 // Adjust height to account for capsule ends
      },
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      mass: 70,
      canCollideWith: ['static', 'enemy', 'dynamic', 'interactable', 'npc', 'trigger'],
      userData: { type: 'player', customization }
    };

    collisionSystem.registerObject(this.collisionObject);

    // Print debug info
    console.log("Character collision capsule:", {
      radius,
      height,
      centerY: radius,
      bottomY: 0,
      topY: height
    });
  }

  updatePosition(
    currentPosition: THREE.Vector3,
    desiredPosition: THREE.Vector3,
    velocity: THREE.Vector3
  ): { 
    position: THREE.Vector3; 
    velocity: THREE.Vector3; 
    grounded: boolean; 
    sliding: boolean;
    triggeredObjects: CollisionObject[];
  } {
    
    // Skip collision checks when disabled
    if (!COLLISIONS_ENABLED) {
      return {
        position: desiredPosition,
        velocity: velocity,
        grounded: true, // Always return grounded = true
        sliding: false,
        triggeredObjects: []
      };
    }

    const current = { x: currentPosition.x, y: currentPosition.y, z: currentPosition.z };
    const desired = { x: desiredPosition.x, y: desiredPosition.y, z: desiredPosition.z };
    const vel = { x: velocity.x, y: velocity.y, z: velocity.z };

    const response = collisionSystem.resolveCollision(this.characterId, current, desired, vel);
    
    collisionSystem.updateObject(this.characterId, response.newPosition, response.newVelocity);

    const newPosition = new THREE.Vector3(
      response.newPosition.x,
      response.newPosition.y,
      response.newPosition.z
    );

    const newVelocity = response.newVelocity 
      ? new THREE.Vector3(response.newVelocity.x, response.newVelocity.y, response.newVelocity.z)
      : velocity.clone();

    // Handle triggered objects
    const triggeredObjects = response.triggers || [];
    this.handleTriggers(triggeredObjects);

    return {
      position: newPosition,
      velocity: newVelocity,
      grounded: response.groundContact,
      sliding: response.sliding,
      triggeredObjects
    };
  }

  private handleTriggers(triggeredObjects: CollisionObject[]): void {
    const currentTriggers = new Set(triggeredObjects.map(obj => obj.id));
    
    // Handle new triggers
    for (const trigger of triggeredObjects) {
      if (!this.lastTriggers.has(trigger.id)) {
        // New trigger activated
        this.onTriggerEnter(trigger);
      }
    }

    // Handle trigger exits
    for (const lastTriggerId of this.lastTriggers) {
      if (!currentTriggers.has(lastTriggerId)) {
        // Trigger exited
        const trigger = collisionSystem.getObject(lastTriggerId);
        if (trigger) {
          this.onTriggerExit(trigger);
        }
      }
    }

    this.lastTriggers = currentTriggers;
  }

  private onTriggerEnter(trigger: CollisionObject): void {
    const callback = this.triggerCallbacks.get(trigger.userData?.triggerType || 'default');
    if (callback) {
      callback(trigger);
    }

    // Default trigger handling
    switch (trigger.userData?.triggerType) {
      case 'interaction':
        console.log('🔗 Entered interaction zone:', trigger.userData?.name || trigger.id);
        break;
      case 'dialogue':
        console.log('💬 Entered dialogue zone:', trigger.userData?.npcName || trigger.id);
        break;
      case 'combat':
        console.log('⚔️ Entered combat zone:', trigger.id);
        break;
      case 'area_transition':
        console.log('🚪 Entered area transition:', trigger.userData?.destinationArea || 'unknown');
        break;
      default:
        console.log('🎯 Triggered:', trigger.id);
    }
  }

  private onTriggerExit(trigger: CollisionObject): void {
    console.log('🚪 Exited trigger zone:', trigger.id);
  }

  // Register custom trigger callbacks
  registerTriggerCallback(triggerType: string, callback: (trigger: CollisionObject) => void): void {
    this.triggerCallbacks.set(triggerType, callback);
  }

  updateBounds(customization: CharacterCustomization): void {
    this.collisionObject.bounds = {
      type: 'capsule',
      center: { x: 0, y: customization.scale, z: 0 },
      radius: 0.4 * customization.bodyWidth * customization.scale,
      height: 2.0 * customization.scale
    };

    this.collisionObject.userData = { type: 'player', customization };

    collisionSystem.updateObject(
      this.characterId, 
      this.collisionObject.position, 
      this.collisionObject.velocity
    );
  }

  canMoveTo(position: THREE.Vector3): boolean {
    const desired = { x: position.x, y: position.y, z: position.z };
    const current = this.collisionObject.position;
    
    const result = collisionSystem.checkCollision(this.characterId, current, desired);
    return !result.collided || result.object?.type === 'trigger';
  }

  getNearbyObjects(radius: number, typeFilter?: string[]): CollisionObject[] {
    return collisionSystem.getObjectsInRadius(this.collisionObject.position, radius, typeFilter);
  }

  findClosestInteractable(maxRadius: number = 3): CollisionObject | null {
    const result = collisionSystem.findClosestObject(
      this.collisionObject.position,
      ['interactable', 'npc'],
      maxRadius
    );
    return result?.object || null;
  }

  checkGroundContact(): boolean {
    // Always return true when collisions disabled
    if (!COLLISIONS_ENABLED) {
      return true;
    }

    // More robust ground detection that checks multiple points beneath the character
    const bounds = this.collisionObject.bounds;
    let capsuleBottomY = this.collisionObject.position.y;
    const capsuleRadius = bounds.type === 'capsule' ? bounds.radius : 0.4;

    if (bounds.type === 'capsule') {
      capsuleBottomY = this.collisionObject.position.y - (bounds.height / 2) + capsuleRadius;
    }

    // Check directly below the character
    const centerPos = {
      x: this.collisionObject.position.x,
      y: capsuleBottomY - 0.05, // Small offset below feet
      z: this.collisionObject.position.z
    };

    const result = collisionSystem.checkCollision(
      this.characterId,
      this.collisionObject.position,
      centerPos
    );

    if (result.collided && result.object?.userData?.type === 'ground') {
      return true;
    }

    // If center point didn't hit, check a few points around the character's base
    // to handle uneven terrain or edges
    const checkPoints = [
      { x: this.collisionObject.position.x + capsuleRadius*0.7, y: capsuleBottomY - 0.05, z: this.collisionObject.position.z },
      { x: this.collisionObject.position.x - capsuleRadius*0.7, y: capsuleBottomY - 0.05, z: this.collisionObject.position.z },
      { x: this.collisionObject.position.x, y: capsuleBottomY - 0.05, z: this.collisionObject.position.z + capsuleRadius*0.7 },
      { x: this.collisionObject.position.x, y: capsuleBottomY - 0.05, z: this.collisionObject.position.z - capsuleRadius*0.7 }
    ];

    for (const point of checkPoints) {
      const pointResult = collisionSystem.checkCollision(
        this.characterId,
        this.collisionObject.position,
        point
      );

      if (pointResult.collided && pointResult.object?.userData?.type === 'ground') {
        return true;
      }
    }

    return false;
  }

  applyGravity(velocity: THREE.Vector3, deltaTime: number, gravity: number = -9.81): THREE.Vector3 {
    // No gravity when collisions disabled
    if (!COLLISIONS_ENABLED) {
      return velocity;
    }

    const isGrounded = this.checkGroundContact();
    
    if (!isGrounded) {
      velocity.y += gravity * deltaTime / 1000;
      // Terminal velocity
      velocity.y = Math.max(velocity.y, -20);
    } else if (velocity.y < 0) {
      velocity.y = 0;
    }
    
    return velocity;
  }

  // Create interaction trigger zone around character
  createInteractionZone(radius: number = 2): void {
    const triggerId = `${this.characterId}_interaction_zone`;
    
    collisionSystem.createTriggerZone(
      triggerId,
      this.collisionObject.position,
      {
        type: 'sphere',
        center: { x: 0, y: 0, z: 0 },
        radius
      },
      {
        triggerType: 'interaction',
        ownerId: this.characterId
      }
    );
  }

  getCollisionObject(): CollisionObject {
    return this.collisionObject;
  }

  dispose(): void {
    collisionSystem.unregisterObject(this.characterId);
    
    // Remove interaction zone if it exists
    const interactionZoneId = `${this.characterId}_interaction_zone`;
    collisionSystem.unregisterObject(interactionZoneId);
  }
}