import * as THREE from 'three';
import { InputState } from '../Character';
import { Tool } from '../../types/EquipmentTypes';

export interface BaseArmRotations {
  left: { x: number; y: number; z: number };
  right: { x: number; y: number; z: number };
}

export interface BaseLegRotations {
  left: { x: number; y: number; z: number };
  right: { x: number; y: number; z: number };
}

export class CharacterAnimations {
  private isUsingTool: boolean = false;
  private _isAttacking: boolean = false;
  private toolAnimationTime: number = 0;
  private attackAnimationTime: number = 0;
  
  private baseArmRotations: BaseArmRotations = {
    left: { x: 0, y: 0, z: 0.1 },
    right: { x: 0, y: 0, z: -0.1 }
  };
  
  private baseLegRotations: BaseLegRotations = {
    left: { x: 0, y: 0, z: 0 },
    right: { x: 0, y: 0, z: 0 }
  };

  // Animation time tracking
  private cycleTime: number = 0;
  private walkingSpeed: number = 4.0; // Increased speed
  private runningSpeed: number = 6.0; // Increased speed

  updateMovementAnimations(
    input: InputState,
    velocity: THREE.Vector3,
    leftArm: THREE.Group | null,
    rightArm: THREE.Group | null,
    leftLeg: THREE.Group | null,
    rightLeg: THREE.Group | null
  ): void {
    if (!leftArm || !rightArm || !leftLeg || !rightLeg) return;

    const isMoving = velocity.length() > 0.01;
    const isRunning = input.run && isMoving;

    // Update the cycle time based on movement state
    if (isMoving) {
      // Use actual speed for animation, not fixed increments
      const speed = isRunning ? this.runningSpeed : this.walkingSpeed;
      this.cycleTime += 0.016 * speed; // ~60fps, can adjust with deltaTime if needed
    } else {
      // Reset cycle time when not moving
      this.cycleTime = 0;
    }

    if (isMoving && !this.isUsingTool && !this._isAttacking) {
      // Walking animation
      const armSwingAmount = isRunning ? 1.0 : 0.8; // Increased amplitude
      const legSwingAmount = isRunning ? 0.8 : 0.6; // Increased amplitude
      
      // Arms swing opposite to legs for natural walking
      leftArm.rotation.x = Math.sin(this.cycleTime) * armSwingAmount + this.baseArmRotations.left.x;
      rightArm.rotation.x = -Math.sin(this.cycleTime) * armSwingAmount + this.baseArmRotations.right.x;
      
      // Small sideways rotation
      leftArm.rotation.y = Math.sin(this.cycleTime * 0.5) * 0.15;
      rightArm.rotation.y = -Math.sin(this.cycleTime * 0.5) * 0.15;
      
      // Legs swing opposite to each other
      leftLeg.rotation.x = -Math.sin(this.cycleTime) * legSwingAmount + this.baseLegRotations.left.x;
      rightLeg.rotation.x = Math.sin(this.cycleTime) * legSwingAmount + this.baseLegRotations.right.x;
      
      // Slight leg twist
      leftLeg.rotation.z = Math.sin(this.cycleTime) * 0.08 + this.baseLegRotations.left.z;
      rightLeg.rotation.z = -Math.sin(this.cycleTime) * 0.08 + this.baseLegRotations.right.z;
      
      // Forward lean when running
      if (isRunning) {
        leftArm.rotation.x += 0.3;
        rightArm.rotation.x += 0.3;
      }
    } else if (!this.isUsingTool && !this._isAttacking) {
      // Idle animation - subtle breathing
      const time = Date.now() * 0.001; // Slower, smoother idle
      const breathAmount = 0.08;
      
      // Subtle arm sway
      leftArm.rotation.x = Math.sin(time * 0.5) * breathAmount + this.baseArmRotations.left.x;
      rightArm.rotation.x = Math.sin(time * 0.5) * breathAmount + this.baseArmRotations.right.x;
      
      // Reset legs to neutral with very slight movement
      leftLeg.rotation.x = Math.sin(time * 0.3) * 0.03 + this.baseLegRotations.left.x;
      rightLeg.rotation.x = -Math.sin(time * 0.3) * 0.03 + this.baseLegRotations.right.x;
    }

    // Maintain base z-rotations for natural limb positioning
    leftArm.rotation.z = this.baseArmRotations.left.z;
    rightArm.rotation.z = this.baseArmRotations.right.z;
  }

  startToolAnimation(): void {
    this.isUsingTool = true;
    this.toolAnimationTime = Date.now();
  }

  startAttackAnimation(): void {
    this._isAttacking = true;
    this.attackAnimationTime = Date.now();
  }

  updateToolAnimation(
    rightArm: THREE.Group | null,
    toolMesh: THREE.Group | null,
    equippedTool: Tool | null
  ): void {
    if (!this.isUsingTool || !rightArm || !toolMesh) return;

    const elapsed = Date.now() - this.toolAnimationTime;
    const animationDuration = 500; // Reduced from 600ms for faster animations
    
    if (elapsed >= animationDuration) {
      // Animation complete - reset
      this.isUsingTool = false;
      
      // Reset arm to base position with smooth transition
      rightArm.rotation.x = this.baseArmRotations.right.x;
      rightArm.rotation.z = this.baseArmRotations.right.z;
      return;
    }

    // Animate tool swing
    const progress = elapsed / animationDuration;
    
    if (equippedTool?.type === 'axe') {
      // Axe swing - overhead chop
      const swingProgress = Math.sin(progress * Math.PI); // Full swing motion
      const swingAmount = 2.0; // Increased from 1.8 for more dramatic motion
      
      rightArm.rotation.x = -swingAmount * swingProgress + 0.3;
      rightArm.rotation.z = this.baseArmRotations.right.z - (swingAmount * 0.3 * swingProgress);
      
    } else if (equippedTool?.type === 'pickaxe') {
      // Pickaxe swing - overhead strike
      const swingProgress = Math.sin(progress * Math.PI);
      const swingAmount = 2.2; // Increased from 2.0 for more dramatic motion
      
      rightArm.rotation.x = -swingAmount * swingProgress + 0.5;
      rightArm.rotation.z = this.baseArmRotations.right.z - (swingAmount * 0.2 * swingProgress);
    } else {
      // Default tool animation
      const swingAmount = 1.5;
      const swingProgress = Math.sin(progress * Math.PI);
      
      rightArm.rotation.x = -swingAmount * swingProgress + 0.3;
      rightArm.rotation.z = this.baseArmRotations.right.z;
    }
  }

  updateWeaponAnimation(
    leftArm: THREE.Group | null,
    weaponMesh: THREE.Group | null,
    equippedWeapon: Tool | null
  ): void {
    if (!this._isAttacking || !leftArm || !weaponMesh) return;

    const elapsed = Date.now() - this.attackAnimationTime;
    const animationDuration = 400; // Reduced from 500ms for faster animations
    
    if (elapsed >= animationDuration) {
      // Animation complete - reset
      this._isAttacking = false;
      
      // Reset arm to base position with smooth transition
      leftArm.rotation.x = this.baseArmRotations.left.x;
      leftArm.rotation.y = this.baseArmRotations.left.y;
      leftArm.rotation.z = this.baseArmRotations.left.z;
      return;
    }

    // Animate weapon attack
    const progress = elapsed / animationDuration;
    
    if (equippedWeapon?.type === 'sword') {
      // Sword slash - horizontal swing
      const swingAmount = 1.8; // Increased from 1.5 for more dramatic motion
      const swingProgress = Math.sin(progress * Math.PI);
      
      leftArm.rotation.x = swingProgress * swingAmount + 0.2;
      leftArm.rotation.y = swingProgress * swingAmount * 0.8;
      
    } else if (equippedWeapon?.type === 'dagger') {
      // Dagger stab - quick thrust
      const thrustAmount = 1.4; // Increased from 1.2 for more dramatic motion
      const thrustProgress = Math.sin(progress * Math.PI);
      
      leftArm.rotation.x = -thrustProgress * thrustAmount + 0.5;
      
    } else if (equippedWeapon?.type === 'spear') {
      // Spear thrust - forward stab
      const thrustAmount = 1.2; // Increased from 1.0 for more dramatic motion
      const thrustProgress = Math.sin(progress * Math.PI);
      
      leftArm.rotation.x = -thrustProgress * thrustAmount + 0.3;
      leftArm.rotation.z = this.baseArmRotations.left.z + thrustProgress * thrustAmount * 0.3;
      
    } else if (equippedWeapon?.type === 'mace') {
      // Mace smash - overhead slam
      const smashAmount = 2.5; // Increased from 2.2 for more dramatic motion
      const smashProgress = Math.sin(progress * Math.PI);
      
      leftArm.rotation.x = -smashProgress * smashAmount + 0.8;
      
    } else if (equippedWeapon?.type === 'bow') {
      // Bow draw - pulling motion
      const drawAmount = 1.0; // Increased from 0.8 for more dramatic motion
      const drawProgress = Math.sin(progress * Math.PI);
      
      leftArm.rotation.x = drawProgress * drawAmount + 0.3;
      leftArm.rotation.y = -drawProgress * drawAmount * 0.5;
    } else {
      // Default weapon animation
      const swingAmount = 1.5;
      const swingProgress = Math.sin(progress * Math.PI);
      
      leftArm.rotation.x = swingProgress * swingAmount + 0.2;
    }
  }

  get isAttacking(): boolean {
    return this._isAttacking;
  }

  isToolInUse(): boolean {
    return this.isUsingTool;
  }
}