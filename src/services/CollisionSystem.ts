import * as THREE from 'three';
import { CollisionObject, CollisionBounds, CollisionResult, CollisionResponse, SpatialCell } from '../types/CollisionTypes';

const COLLISIONS_ENABLED = false;

export class CollisionSystem {
  private static instance: CollisionSystem | null = null;
  private collisionObjects: Map<string, CollisionObject> = new Map();
  private spatialGrid: Map<string, SpatialCell> = new Map();
  private gridSize: number = 8;
  private debugMode: boolean = false;
  private debugVisualization: THREE.Group | null = null;
  private scene: THREE.Scene | null = null;
  private collisionEnabled: boolean = true; // Add this for settings

  // Collision layers for filtering
  private collisionLayers: Map<string, string[]> = new Map([
    ['character', ['static', 'enemy', 'npc', 'dynamic', 'trigger']],
    ['enemy', ['static', 'character', 'enemy', 'dynamic', 'trigger']],
    ['npc', ['static', 'character', 'dynamic']],
    ['static', ['character', 'enemy', 'npc', 'dynamic']],
    ['dynamic', ['static', 'character', 'enemy', 'npc', 'dynamic']],
    ['trigger', ['character', 'enemy']], // Triggers only affect characters and enemies
    ['projectile', ['static', 'character', 'enemy', 'npc']]
  ]);

  static getInstance(): CollisionSystem {
    if (!CollisionSystem.instance) {
      CollisionSystem.instance = new CollisionSystem();
    }
    return CollisionSystem.instance;
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
    if (this.debugMode && !this.debugVisualization) {
      this.initializeDebugVisualization();
    }
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (enabled && this.scene && !this.debugVisualization) {
      this.initializeDebugVisualization();
    } else if (!enabled && this.debugVisualization && this.scene) {
      this.scene.remove(this.debugVisualization);
      this.debugVisualization = null;
    }
  }

  setCollisionEnabled(enabled: boolean): void {
    this.collisionEnabled = enabled;
    console.log(`🔧 Collision detection ${enabled ? 'enabled' : 'disabled'}`);
  }

  isCollisionEnabled(): boolean {
    return this.collisionEnabled;
  }

  private initializeDebugVisualization(): void {
    if (!this.scene) return;
    
    this.debugVisualization = new THREE.Group();
    this.debugVisualization.name = 'CollisionDebug';
    this.scene.add(this.debugVisualization);
    
    // Refresh all debug meshes
    this.collisionObjects.forEach(obj => {
      this.addDebugVisualization(obj);
    });
  }

  registerObject(object: CollisionObject): void {
    this.collisionObjects.set(object.id, object);
    this.updateSpatialGrid(object);
    
    if (this.debugMode) {
      this.addDebugVisualization(object);
      console.log(`🔷 Registered collision object: ${object.id} (${object.type})`);
    }
  }

  unregisterObject(id: string): void {
    const object = this.collisionObjects.get(id);
    if (object) {
      this.removeFromSpatialGrid(object);
      this.collisionObjects.delete(id);
      this.removeDebugVisualization(id);
      
      if (this.debugMode) {
        console.log(`🔶 Unregistered collision object: ${id}`);
      }
    }
  }

  updateObject(id: string, newPosition: { x: number; y: number; z: number }, newVelocity?: { x: number; y: number; z: number }): void {
    const object = this.collisionObjects.get(id);
    if (object) {
      this.removeFromSpatialGrid(object);
      object.position = { ...newPosition };
      if (newVelocity) {
        object.velocity = { ...newVelocity };
      }
      this.updateSpatialGrid(object);
      this.updateDebugVisualization(object);
    }
  }

  // Enhanced collision checking with layer filtering
  checkCollision(
    objectId: string, 
    currentPosition: { x: number; y: number; z: number },
    newPosition: { x: number; y: number; z: number }
  ): CollisionResult {
    // Short-circuit collision detection
    if (!COLLISIONS_ENABLED) {
      return { collided: false };
    }

    const object = this.collisionObjects.get(objectId);
    if (!object) {
      return { collided: false };
    }

    const potentialColliders = this.getPotentialColliders(newPosition, 8);
    const allowedCollisions = this.collisionLayers.get(object.type) || [];
    
    for (const colliderId of potentialColliders) {
      if (colliderId === objectId) continue;
      
      const other = this.collisionObjects.get(colliderId);
      if (!other) continue;

      // Check collision layer filtering
      if (!allowedCollisions.includes(other.type)) continue;

      const result = this.detectCollision(object, newPosition, other);
      if (result.collided) {
        result.object = other;
        return result;
      }
    }

    return { collided: false };
  }

  // Enhanced collision resolution with smooth sliding
  resolveCollision(
    objectId: string,
    currentPosition: { x: number; y: number; z: number },
    desiredPosition: { x: number; y: number; z: number },
    velocity?: { x: number; y: number; z: number }
  ): CollisionResponse {
    // Short-circuit collision resolution
    if (!COLLISIONS_ENABLED) {
      return {
        newPosition: desiredPosition,
        newVelocity: velocity,
        blocked: false,
        sliding: false,
        groundContact: true, // Always return true for ground contact
        triggers: []
      };
    }

    const object = this.collisionObjects.get(objectId);
    if (!object) {
      return {
        newPosition: desiredPosition,
        newVelocity: velocity,
        blocked: false,
        sliding: false,
        groundContact: true, // Always return true for ground contact
        triggers: []
      };
    }

    let currentPos = { ...currentPosition };
    let currentVel = velocity ? { ...velocity } : undefined;
    let totalBlocked = false;
    let isSliding = false;
    let hasGroundContact = false;
    let triggeredObjects: CollisionObject[] = [];

    // Multi-step collision resolution for smooth movement
    const steps = Math.max(1, Math.ceil(this.getDistance(currentPosition, desiredPosition) / 0.5));
    const deltaPos = {
      x: (desiredPosition.x - currentPosition.x) / steps,
      y: (desiredPosition.y - currentPosition.y) / steps,
      z: (desiredPosition.z - currentPosition.z) / steps
    };

    for (let step = 0; step < steps; step++) {
      const nextPos = {
        x: currentPos.x + deltaPos.x,
        y: currentPos.y + deltaPos.y,
        z: currentPos.z + deltaPos.z
      };

      const collisionResult = this.checkCollision(objectId, currentPos, nextPos);
      
      if (!collisionResult.collided) {
        currentPos = nextPos;
        continue;
      }

      // Handle trigger objects (don't block movement)
      if (collisionResult.object?.type === 'trigger') {
        triggeredObjects.push(collisionResult.object);
        currentPos = nextPos;
        continue;
      }

      totalBlocked = true;
      
      const response = this.handleCollisionResponse(
        object,
        currentPos,
        nextPos,
        collisionResult,
        currentVel
      );

      currentPos = response.newPosition;
      currentVel = response.newVelocity;
      isSliding = response.sliding || isSliding;
      hasGroundContact = response.groundContact || hasGroundContact;
    }

    return {
      newPosition: currentPos,
      newVelocity: currentVel,
      blocked: totalBlocked,
      sliding: isSliding,
      groundContact: hasGroundContact,
      triggers: triggeredObjects
    };
  }

  // Enhanced collision response with smooth sliding
  private handleCollisionResponse(
    object: CollisionObject,
    currentPos: { x: number; y: number; z: number },
    desiredPos: { x: number; y: number; z: number },
    collision: CollisionResult,
    velocity?: { x: number; y: number; z: number }
  ): CollisionResponse {
    if (!collision.normal || !collision.penetration) {
      return {
        newPosition: currentPos,
        newVelocity: velocity,
        blocked: true,
        sliding: false,
        groundContact: false
      };
    }

    const normal = collision.normal;
    
    // Separate the object from the collision surface
    const separationDistance = 0.01; // Small buffer to prevent interpenetration
    const correctedPosition = {
      x: desiredPos.x + normal.x * (Math.abs(collision.penetration.x) + separationDistance),
      y: desiredPos.y + normal.y * (Math.abs(collision.penetration.y) + separationDistance),
      z: desiredPos.z + normal.z * (Math.abs(collision.penetration.z) + separationDistance)
    };

    let newVelocity = velocity;
    let isSliding = false;
    let groundContact = false;

    if (velocity) {
      const velocityVector = new THREE.Vector3(velocity.x, velocity.y, velocity.z);
      const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z);
      
      // Ground detection (surface normal pointing upward)
      if (normal.y > 0.7) {
        groundContact = true;
        if (velocity.y < 0) {
          velocityVector.y = 0; // Stop downward movement
        }
      }

      // Calculate sliding velocity along the surface
      const dot = velocityVector.dot(normalVector);
      if (dot < 0) {
        // Project velocity onto the surface for sliding
        const slidingVelocity = velocityVector.clone().addScaledVector(normalVector, -dot);
        
        // Apply friction to sliding
        const frictionFactor = 0.95; // Slight friction
        slidingVelocity.multiplyScalar(frictionFactor);
        
        isSliding = slidingVelocity.length() > 0.1;
        newVelocity = { x: slidingVelocity.x, y: slidingVelocity.y, z: slidingVelocity.z };
      }
    }

    return {
      newPosition: correctedPosition,
      newVelocity,
      blocked: true,
      sliding: isSliding,
      groundContact
    };
  }

  // Line of sight checking for AI
  checkLineOfSight(
    fromPosition: { x: number; y: number; z: number },
    toPosition: { x: number; y: number; z: number },
    maxDistance: number = 50,
    ignoreTypes: string[] = ['trigger', 'character', 'enemy', 'npc']
  ): { clear: boolean; hitObject?: CollisionObject; hitPoint?: { x: number; y: number; z: number } } {
    if (!this.collisionEnabled) {
      return { clear: true }; // No collision means clear line of sight
    }

    const direction = {
      x: toPosition.x - fromPosition.x,
      y: toPosition.y - fromPosition.y,
      z: toPosition.z - fromPosition.z
    };

    const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    if (distance === 0 || distance > maxDistance) {
      return { clear: false };
    }

    // Normalize direction
    const normalizedDirection = {
      x: direction.x / distance,
      y: direction.y / distance,
      z: direction.z / distance
    };

    // Ray marching for line of sight
    const stepSize = 0.5;
    const steps = Math.ceil(distance / stepSize);

    for (let i = 1; i <= steps; i++) {
      const checkPoint = {
        x: fromPosition.x + normalizedDirection.x * stepSize * i,
        y: fromPosition.y + normalizedDirection.y * stepSize * i,
        z: fromPosition.z + normalizedDirection.z * stepSize * i
      };

      const nearbyObjects = this.getObjectsInRadius(checkPoint, stepSize * 1.5);
      
      for (const obj of nearbyObjects) {
        if (ignoreTypes.includes(obj.type)) continue;
        
        if (this.pointIntersectsObject(checkPoint, obj)) {
          return {
            clear: false,
            hitObject: obj,
            hitPoint: checkPoint
          };
        }
      }
    }

    return { clear: true };
  }

  private pointIntersectsObject(point: { x: number; y: number; z: number }, object: CollisionObject): boolean {
    const objPos = object.position;
    const bounds = object.bounds;

    if (bounds.type === 'sphere') {
      const distance = this.getDistance(point, objPos);
      return distance <= (bounds.radius || 1);
    } else if (bounds.type === 'box' && bounds.size) {
      const halfSize = {
        x: bounds.size.x / 2,
        y: bounds.size.y / 2,
        z: bounds.size.z / 2
      };
      
      return (
        Math.abs(point.x - objPos.x) <= halfSize.x &&
        Math.abs(point.y - objPos.y) <= halfSize.y &&
        Math.abs(point.z - objPos.z) <= halfSize.z
      );
    } else if (bounds.type === 'capsule') {
      // Simplified capsule check
      const distance = this.getDistance(point, objPos);
      return distance <= (bounds.radius || 1);
    }

    return false;
  }

  // Get objects in range with type filtering
  getObjectsInRadius(
    position: { x: number; y: number; z: number }, 
    radius: number, 
    typeFilter?: string[]
  ): CollisionObject[] {
    const result: CollisionObject[] = [];
    const potentialColliders = this.getPotentialColliders(position, radius);
    
    for (const colliderId of potentialColliders) {
      const object = this.collisionObjects.get(colliderId);
      if (!object) continue;
      
      if (typeFilter && !typeFilter.includes(object.type)) continue;
      
      const distance = this.getDistance(position, object.position);
      if (distance <= radius) {
        result.push(object);
      }
    }
    
    return result;
  }

  // Find closest objects of specific types
  findClosestObject(
    position: { x: number; y: number; z: number },
    typeFilter: string[],
    maxRadius: number = 10
  ): { object: CollisionObject; distance: number } | null {
    const objects = this.getObjectsInRadius(position, maxRadius, typeFilter);
    
    let closest: { object: CollisionObject; distance: number } | null = null;
    let minDistance = Infinity;

    for (const obj of objects) {
      const distance = this.getDistance(position, obj.position);
      if (distance < minDistance) {
        minDistance = distance;
        closest = { object: obj, distance };
      }
    }

    return closest;
  }

  // Create trigger zones
  createTriggerZone(
    id: string,
    position: { x: number; y: number; z: number },
    bounds: CollisionBounds,
    userData?: any
  ): void {
    this.registerObject({
      id,
      type: 'trigger',
      bounds,
      position,
      mass: 0,
      isStatic: true,
      canCollideWith: ['character', 'enemy'],
      userData: { type: 'trigger', ...userData }
    });
  }

  // Debug visualization methods
  private addDebugVisualization(object: CollisionObject): void {
    if (!this.debugVisualization || !this.scene) return;

    const debugMesh = this.createDebugMesh(object);
    debugMesh.name = `debug_${object.id}`;
    this.debugVisualization.add(debugMesh);
  }

  private removeDebugVisualization(objectId: string): void {
    if (!this.debugVisualization) return;

    const debugMesh = this.debugVisualization.getObjectByName(`debug_${objectId}`);
    if (debugMesh) {
      this.debugVisualization.remove(debugMesh);
    }
  }

  private updateDebugVisualization(object: CollisionObject): void {
    if (!this.debugVisualization) return;

    const debugMesh = this.debugVisualization.getObjectByName(`debug_${object.id}`);
    if (debugMesh) {
      debugMesh.position.set(object.position.x, object.position.y, object.position.z);
    }
  }

  private createDebugMesh(object: CollisionObject): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    
    if (object.bounds.type === 'sphere') {
      geometry = new THREE.SphereGeometry(object.bounds.radius || 1, 8, 6);
    } else if (object.bounds.type === 'box' && object.bounds.size) {
      geometry = new THREE.BoxGeometry(
        object.bounds.size.x,
        object.bounds.size.y,
        object.bounds.size.z
      );
    } else if (object.bounds.type === 'capsule') {
      geometry = new THREE.CapsuleGeometry(
        object.bounds.radius || 0.5,
        object.bounds.height || 2
      );
    } else {
      geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    // Color based on object type
    const colorMap = {
      character: 0x00ff00,    // Green
      enemy: 0xff0000,        // Red
      npc: 0x0000ff,          // Blue
      static: 0x808080,       // Gray
      dynamic: 0xffff00,      // Yellow
      trigger: 0xff00ff,      // Magenta
      projectile: 0x00ffff    // Cyan
    };

    const color = colorMap[object.type as keyof typeof colorMap] || 0xffffff;
    const material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: object.type === 'trigger' ? 0.3 : 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(object.position.x, object.position.y, object.position.z);
    
    return mesh;
  }

  // Spatial grid methods
  private updateSpatialGrid(object: CollisionObject): void {
    const gridKey = this.getGridKey(object.position);
    
    if (!this.spatialGrid.has(gridKey)) {
      const gx = Math.floor(object.position.x / this.gridSize);
      const gz = Math.floor(object.position.z / this.gridSize);
      
      this.spatialGrid.set(gridKey, {
        objects: new Set(),
        bounds: {
          minX: gx * this.gridSize,
          maxX: (gx + 1) * this.gridSize,
          minZ: gz * this.gridSize,
          maxZ: (gz + 1) * this.gridSize
        }
      });
    }
    
    this.spatialGrid.get(gridKey)!.objects.add(object.id);
  }

  private removeFromSpatialGrid(object: CollisionObject): void {
    const gridKey = this.getGridKey(object.position);
    const gridCell = this.spatialGrid.get(gridKey);
    
    if (gridCell) {
      gridCell.objects.delete(object.id);
      if (gridCell.objects.size === 0) {
        this.spatialGrid.delete(gridKey);
      }
    }
  }

  private getGridKey(position: { x: number; y: number; z: number }): string {
    const gx = Math.floor(position.x / this.gridSize);
    const gz = Math.floor(position.z / this.gridSize);
    return `${gx}_${gz}`;
  }

  private getPotentialColliders(position: { x: number; y: number; z: number }, radius: number = 8): Set<string> {
    const result = new Set<string>();
    const range = Math.ceil(radius / this.gridSize) + 1;
    const centerCoords = this.getGridKey(position).split('_').map(Number);
    
    for (let dx = -range; dx <= range; dx++) {
      for (let dz = -range; dz <= range; dz++) {
        const gridKey = `${centerCoords[0] + dx}_${centerCoords[1] + dz}`;
        const gridCell = this.spatialGrid.get(gridKey);
        
        if (gridCell) {
          gridCell.objects.forEach(id => result.add(id));
        }
      }
    }
    
    return result;
  }

  private detectCollision(
    object: CollisionObject,
    newPosition: { x: number; y: number; z: number },
    other: CollisionObject
  ): CollisionResult {
    const movingBounds: CollisionBounds = {
      ...object.bounds,
      center: {
        x: newPosition.x + (object.bounds.center?.x || 0),
        y: newPosition.y + (object.bounds.center?.y || 0),
        z: newPosition.z + (object.bounds.center?.z || 0)
      }
    };

    const staticBounds: CollisionBounds = {
      ...other.bounds,
      center: {
        x: other.position.x + (other.bounds.center?.x || 0),
        y: other.position.y + (other.bounds.center?.y || 0),
        z: other.position.z + (other.bounds.center?.z || 0)
      }
    };

    if (movingBounds.type === 'sphere' && staticBounds.type === 'sphere') {
      return this.detectSphereSphereCollision(movingBounds, staticBounds);
    } else if (movingBounds.type === 'box' && staticBounds.type === 'box') {
      return this.detectBoxBoxCollision(movingBounds, staticBounds);
    } else if (movingBounds.type === 'capsule' || staticBounds.type === 'capsule') {
      return this.detectCapsuleCollision(movingBounds, staticBounds);
    } else {
      // Fallback to sphere-sphere collision
      return this.detectSphereSphereCollision(movingBounds, staticBounds);
    }
  }

  private detectSphereSphereCollision(bounds1: CollisionBounds, bounds2: CollisionBounds): CollisionResult {
    const radius1 = this.getBoundingRadius(bounds1);
    const radius2 = this.getBoundingRadius(bounds2);
    
    const distance = this.getDistance(bounds1.center!, bounds2.center!);
    const minDistance = radius1 + radius2;
    
    if (distance < minDistance) {
      const penetration = minDistance - distance;
      const normal = this.getNormal(bounds1.center!, bounds2.center!);
      
      return {
        collided: true,
        penetration: {
          x: normal.x * penetration,
          y: normal.y * penetration,
          z: normal.z * penetration
        },
        normal,
        distance,
        contactPoint: {
          x: bounds1.center!.x - normal.x * radius1,
          y: bounds1.center!.y - normal.y * radius1,
          z: bounds1.center!.z - normal.z * radius1
        }
      };
    }

    return { collided: false };
  }

  private detectBoxBoxCollision(bounds1: CollisionBounds, bounds2: CollisionBounds): CollisionResult {
    if (!bounds1.size || !bounds2.size || !bounds1.center || !bounds2.center) {
      return { collided: false };
    }

    const half1 = {
      x: bounds1.size.x / 2,
      y: bounds1.size.y / 2,
      z: bounds1.size.z / 2
    };

    const half2 = {
      x: bounds2.size.x / 2,
      y: bounds2.size.y / 2,
      z: bounds2.size.z / 2
    };

    const dx = Math.abs(bounds1.center.x - bounds2.center.x);
    const dy = Math.abs(bounds1.center.y - bounds2.center.y);
    const dz = Math.abs(bounds1.center.z - bounds2.center.z);

    const overlapX = (half1.x + half2.x) - dx;
    const overlapY = (half1.y + half2.y) - dy;
    const overlapZ = (half1.z + half2.z) - dz;

    if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
      const minOverlap = Math.min(overlapX, overlapY, overlapZ);
      let normal = { x: 0, y: 0, z: 0 };
      let penetration = { x: 0, y: 0, z: 0 };

      if (minOverlap === overlapX) {
        normal.x = bounds1.center.x > bounds2.center.x ? 1 : -1;
        penetration.x = overlapX;
      } else if (minOverlap === overlapY) {
        normal.y = bounds1.center.y > bounds2.center.y ? 1 : -1;
        penetration.y = overlapY;
      } else {
        normal.z = bounds1.center.z > bounds2.center.z ? 1 : -1;
        penetration.z = overlapZ;
      }

      return {
        collided: true,
        penetration,
        normal,
        distance: minOverlap,
        contactPoint: {
          x: bounds1.center.x - normal.x * half1.x,
          y: bounds1.center.y - normal.y * half1.y,
          z: bounds1.center.z - normal.z * half1.z
        }
      };
    }

    return { collided: false };
  }

  private detectCapsuleCollision(bounds1: CollisionBounds, bounds2: CollisionBounds): CollisionResult {
    // Simplified capsule collision - treat as sphere for now
    return this.detectSphereSphereCollision(bounds1, bounds2);
  }

  private getBoundingRadius(bounds: CollisionBounds): number {
    if (bounds.type === 'sphere' && bounds.radius) {
      return bounds.radius;
    } else if (bounds.type === 'box' && bounds.size) {
      return Math.sqrt(bounds.size.x * bounds.size.x + bounds.size.y * bounds.size.y + bounds.size.z * bounds.size.z) / 2;
    } else if (bounds.type === 'capsule' && bounds.radius && bounds.height) {
      return Math.max(bounds.radius, bounds.height / 2);
    }
    return 1;
  }

  private getDistance(pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private getNormal(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    const dz = from.z - to.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (length === 0) {
      return { x: 1, y: 0, z: 0 };
    }
    
    return {
      x: dx / length,
      y: dy / length,
      z: dz / length
    };
  }

  clear(): void {
    this.collisionObjects.clear();
    this.spatialGrid.clear();
    
    if (this.debugVisualization && this.scene) {
      this.scene.remove(this.debugVisualization);
      this.debugVisualization = null;
    }
  }

  getAllObjects(): CollisionObject[] {
    return Array.from(this.collisionObjects.values());
  }

  getObject(id: string): CollisionObject | undefined {
    return this.collisionObjects.get(id);
  }

  // Performance monitoring
  getStats(): { 
    objectCount: number; 
    gridCells: number; 
    debugMode: boolean;
    collisionEnabled: boolean;
  } {
    return {
      objectCount: this.collisionObjects.size,
      gridCells: this.spatialGrid.size,
      debugMode: this.debugMode,
      collisionEnabled: this.collisionEnabled
    };
  }
}

export const collisionSystem = CollisionSystem.getInstance();

