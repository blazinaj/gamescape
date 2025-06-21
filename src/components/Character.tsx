import * as THREE from 'three';
import { EquipmentManager } from '../services/EquipmentManager';
import { InventorySystem } from '../services/InventorySystem';
import { InteractableObjectManager } from '../services/InteractableObjectManager';
import { CharacterCustomization, DEFAULT_CUSTOMIZATION } from '../types/CharacterTypes';
import { DamageInfo } from '../types/HealthTypes';

// Import the modular components
import { CharacterMesh } from './character/CharacterMesh';
import { CharacterEquipment } from './character/CharacterEquipment';
import { CharacterAnimations } from './character/CharacterAnimations';
import { CharacterStats } from './character/CharacterStats';
import { CharacterCombat } from './character/CharacterCombat';
import { CharacterCollision } from './character/CharacterCollision';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  mouseX: number;
  mouseY: number;
  leftClick: boolean;
  rightClick: boolean;
}

export class Character {
  // Core components
  private characterMesh: CharacterMesh;
  private characterEquipment: CharacterEquipment;
  private characterAnimations: CharacterAnimations;
  private characterStats: CharacterStats;
  private characterCombat: CharacterCombat;
  private characterCollision: CharacterCollision;

  // Systems
  private equipmentManager: EquipmentManager;
  private inventorySystem: InventorySystem;
  private interactableObjectManager: InteractableObjectManager;

  // Movement and input
  private velocity: THREE.Vector3;
  private direction: THREE.Vector3;
  private speed: number;
  private runSpeed: number;
  private rotationSpeed: number;
  private gravity: number = -9.81;

  // Input tracking
  private lastLeftClickState: boolean = false;
  private lastRightClickState: boolean = false;
  private lastFrameTime: number = Date.now();

  constructor(customization?: CharacterCustomization) {
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = 0.07;
    this.runSpeed = 0.14;
    this.rotationSpeed = 0.08;

    // Initialize systems
    this.inventorySystem = new InventorySystem();
    this.interactableObjectManager = new InteractableObjectManager(this.inventorySystem);
    this.equipmentManager = new EquipmentManager();

    // Initialize character components - make sure no y offset is applied initially
    this.characterMesh = new CharacterMesh(customization);
    this.characterAnimations = new CharacterAnimations();
    this.characterStats = new CharacterStats(); // Initialize stats before using it

    // Force the mesh position to y=0 (feet at ground level)
    this.characterMesh.mesh.position.set(0, 0, 0);

    // Initialize collision with correct ground alignment
    this.characterCollision = new CharacterCollision(
      'player_character',
      customization || DEFAULT_CUSTOMIZATION
    );

    // Initialize equipment with mesh references
    this.characterEquipment = new CharacterEquipment(
      this.characterMesh.rightArm,
      this.characterMesh.leftArm,
      this.characterMesh.getCustomization()
    );

    // Initialize combat with required systems
    this.characterCombat = new CharacterCombat(
      this.interactableObjectManager,
      this.characterStats.getExperienceSystem(),
      this.equipmentManager
    );

    // Subscribe to equipment changes
    this.equipmentManager.subscribe((tool, weapon) => {
      this.characterEquipment.updateToolMesh(tool);
      this.characterEquipment.updateWeaponMesh(weapon);
    });

    // Set initial position for stats tracking - use y=0
    this.characterStats.setLastPosition(this.characterMesh.mesh.position);

    // Add some test items to inventory for demonstration
    setTimeout(() => {
      this.inventorySystem.addTestItems();
    }, 1000);
    
    // Initialize last frame time
    this.lastFrameTime = Date.now();
  }

  updateCustomization(customization: CharacterCustomization): void {
    this.characterMesh.updateCustomization(customization);

    // Update equipment with new mesh references
    this.characterEquipment.updateArms(
      this.characterMesh.rightArm,
      this.characterMesh.leftArm,
      customization
    );

    // Update collision bounds
    this.characterCollision.updateBounds(customization);
  }

  getCustomization(): CharacterCustomization {
    return this.characterMesh.getCustomization();
  }

  addToScene(scene: THREE.Scene): void {
    this.characterMesh.addToScene(scene);
  }

  // Method to register interactable objects with the manager
  registerInteractableObject(
    id: string,
    type: string,
    position: { x: number; y: number; z: number },
    mesh?: THREE.Object3D
  ): void {
    this.interactableObjectManager.createInteractableObject(id, type, position, mesh);
  }

  update(input: InputState & { interact?: boolean }, deltaTime: number = 16): void {
    // Track frame time for consistent animation speeds
    const currentTime = Date.now();
    const actualDeltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Ensure deltaTime is reasonable (prevent huge jumps if game pauses)
    const clampedDeltaTime = Math.min(actualDeltaTime, 100);
    
    // Update stats and get current speeds based on skills
    const speeds = this.characterStats.update(clampedDeltaTime, this.characterMesh.getPosition());
    this.speed = speeds.speed;
    this.runSpeed = speeds.runSpeed;

    const currentSpeed = input.run ? this.runSpeed : this.speed;

    // Apply gravity to velocity
    this.velocity = this.characterCollision.applyGravity(this.velocity, clampedDeltaTime, this.gravity);

    // Calculate movement direction based on character's current rotation
    const forward = new THREE.Vector3(0, 0, 1);
    const right = new THREE.Vector3(1, 0, 0);

    // Apply character's current rotation to movement vectors
    forward.applyQuaternion(this.characterMesh.mesh.quaternion);
    right.applyQuaternion(this.characterMesh.mesh.quaternion);

    // Reset horizontal velocity for new input
    this.velocity.x = 0;
    this.velocity.z = 0;

    // Apply movement input - scale by deltaTime for consistent speed
    const timeScale = clampedDeltaTime / 16; // Normalize to expected 16ms frame
    
    if (input.forward) {
      this.velocity.add(forward.multiplyScalar(currentSpeed * timeScale));
    }
    if (input.backward) {
      this.velocity.add(forward.multiplyScalar(-currentSpeed * 0.5 * timeScale));
    }
    if (input.left) {
      this.velocity.add(right.multiplyScalar(currentSpeed * 0.7 * timeScale));
    }
    if (input.right) {
      this.velocity.add(right.multiplyScalar(-currentSpeed * 0.7 * timeScale));
    }

    // Apply rotation based on mouse movement
    if (Math.abs(input.mouseX) > 0.005) {
      this.characterMesh.mesh.rotateY(-input.mouseX * this.rotationSpeed);
    }

    // Handle tool usage - detect click down event (transition from false to true)
    if (input.leftClick && !this.lastLeftClickState && this.equipmentManager.canUseTool()) {
      console.log('🔨 Tool attack triggered!');
      this.useTool();
    }

    // Handle weapon usage - detect right click down event
    if (input.rightClick && !this.lastRightClickState && this.equipmentManager.canUseWeapon()) {
      console.log('⚔️ Weapon attack triggered!');
      this.useWeapon();
    }

    // Update last click states for next frame
    this.lastLeftClickState = input.leftClick;
    this.lastRightClickState = input.rightClick;

    // Calculate new position with collision detection
    const currentPosition = this.characterMesh.mesh.position.clone();
    const desiredPosition = currentPosition.clone().add(this.velocity);

    // Use collision system to resolve movement
    const collisionResult = this.characterCollision.updatePosition(
      currentPosition,
      desiredPosition,
      this.velocity
    );

    // Apply the collision-resolved position
    this.characterMesh.mesh.position.copy(collisionResult.position);
    this.velocity.copy(collisionResult.velocity);

    // Update animations with proper time scaling
    this.characterAnimations.updateMovementAnimations(
      input,
      this.velocity,
      this.characterMesh.leftArm,
      this.characterMesh.rightArm,
      this.characterMesh.leftLeg,
      this.characterMesh.rightLeg
    );

    this.characterAnimations.updateToolAnimation(
      this.characterMesh.rightArm,
      this.characterEquipment['toolMesh'],
      this.equipmentManager.getEquippedTool()
    );

    this.characterAnimations.updateWeaponAnimation(
      this.characterMesh.leftArm,
      this.characterEquipment['weaponMesh'],
      this.equipmentManager.getEquippedWeapon()
    );
  }

  private useTool(): void {
    const action = this.equipmentManager.useTool();
    if (!action) return;

    this.characterAnimations.startToolAnimation();

    // Log tool usage
    console.log(`🔨 Used ${this.equipmentManager.getEquippedTool()?.name} - ${action.effect}`);

    // Apply tool effects to nearby objects
    this.characterCombat.checkToolTargets(action, this.getPosition());
  }

  private useWeapon(): void {
    const action = this.equipmentManager.useWeapon();
    if (!action) return;

    this.characterAnimations.startAttackAnimation();

    // Log weapon usage
    console.log(`⚔️ Used ${this.equipmentManager.getEquippedWeapon()?.name} - ${action.effect}`);
  }

  // Method to be called by Game3D with enemy manager
  attackEnemies(enemyManager: any): void {
    if (!this.characterAnimations.isAttacking) return;
    this.characterCombat.attackEnemies(enemyManager, this.getPosition());
  }

  // Take damage from enemies
  takeDamage(damageInfo: DamageInfo): boolean {
    return this.characterStats.takeDamage(damageInfo);
  }

  // Heal player
  heal(amount: number, source: string = 'unknown'): number {
    return this.characterStats.heal(amount, source);
  }

  // Check if character can move to a position
  canMoveTo(position: THREE.Vector3): boolean {
    return this.characterCollision.canMoveTo(position);
  }

  // Get nearby collision objects
  getNearbyCollisionObjects(radius: number = 5) {
    return this.characterCollision.getNearbyObjects(radius);
  }

  // Check if character is grounded
  isGrounded(): boolean {
    return this.characterCollision.checkGroundContact();
  }

  // Getters for systems and managers
  getEquipmentManager(): EquipmentManager {
    return this.equipmentManager;
  }

  getInventorySystem(): InventorySystem {
    return this.inventorySystem;
  }

  getInteractableObjectManager(): InteractableObjectManager {
    return this.interactableObjectManager;
  }

  getHealthSystem() {
    return this.characterStats.getHealthSystem();
  }

  getExperienceSystem() {
    return this.characterStats.getExperienceSystem();
  }

  getPosition(): THREE.Vector3 {
    return this.characterMesh.getPosition();
  }

  getRotation(): THREE.Quaternion {
    return this.characterMesh.getRotation();
  }

  isDead(): boolean {
    return this.characterStats.isDead();
  }

  // Getter for attack state (used by game loop)
  get isAttacking(): boolean {
    return this.characterAnimations.isAttacking;
  }

  // Getter for mesh (for camera and scene operations)
  get mesh(): THREE.Group {
    return this.characterMesh.mesh;
  }

  // Cleanup
  dispose(): void {
    this.characterCollision.dispose();
  }
}