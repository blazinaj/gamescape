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

  updateMovementAnimations(
    input: InputState,
    velocity: THREE.Vector3,
    leftArm: THREE.Group | null,
    rightArm: THREE.Group | null,
    leftLeg: THREE.Group | null,
    rightLeg: THREE.Group | null
  ): void {
    if (!leftArm || !rightArm || !leftLeg || !rightLeg) return;

    const time = Date.now() * 0.01;
    const isMoving = velocity.length() > 0;

    if (isMoving && !this.isUsingTool && !this._isAttacking) {
      // Walking animation - arms and legs swing naturally
      const armSwingAmount = input.run ? 0.8 : 0.6;
      const legSwingAmount = input.run ? 0.6 : 0.4;
      
      // Arms swing opposite to legs for natural walking
      leftArm.rotation.x = Math.sin(time) * armSwingAmount + this.baseArmRotations.left.x;
      rightArm.rotation.x = -Math.sin(time) * armSwingAmount + this.baseArmRotations.right.x;
      
      // Legs swing opposite to arms - left leg forward when right arm forward
      leftLeg.rotation.x = -Math.sin(time) * legSwingAmount + this.baseLegRotations.left.x;
      rightLeg.rotation.x = Math.sin(time) * legSwingAmount + this.baseLegRotations.right.x;
      
      // Add slight forward lean when running
      if (input.run) {
        leftArm.rotation.x += 0.2;
        rightArm.rotation.x += 0.2;
        leftLeg.rotation.x += 0.1;
        rightLeg.rotation.x += 0.1;
      }
    } else if (!this.isUsingTool && !this._isAttacking) {
      // Idle animation - subtle breathing movement
      const breathAmount = 0.1;
      leftArm.rotation.x = Math.sin(time * 0.3) * breathAmount + this.baseArmRotations.left.x;
      rightArm.rotation.x = Math.sin(time * 0.3) * breathAmount + this.baseArmRotations.right.x;
      
      // Legs return to neutral position when idle
      leftLeg.rotation.x = this.baseLegRotations.left.x;
      rightLeg.rotation.x = this.baseLegRotations.right.x;
    }

    // Maintain base rotations for natural limb positioning
    leftArm.rotation.z = this.baseArmRotations.left.z;
    rightArm.rotation.z = this.baseArmRotations.right.z;
    leftLeg.rotation.z = this.baseLegRotations.left.z;
    rightLeg.rotation.z = this.baseLegRotations.right.z;
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
    const animationDuration = 600; // ms
    
    if (elapsed >= animationDuration) {
      this.isUsingTool = false;
      // Reset arm to base position
      rightArm.rotation.x = this.baseArmRotations.right.x;
      rightArm.rotation.z = this.baseArmRotations.right.z;
      return;
    }

    // Animate tool swing with arm movement
    const progress = elapsed / animationDuration;
    
    if (equippedTool?.type === 'axe') {
      // Axe swing - overhead chop
      const swingAngle = Math.sin(progress * Math.PI) * 1.8;
      rightArm.rotation.x = -swingAngle + 0.3;
      rightArm.rotation.z = this.baseArmRotations.right.z - (swingAngle * 0.3);
      
    } else if (equippedTool?.type === 'pickaxe') {
      // Pickaxe swing - overhead strike downward
      const swingAngle = Math.sin(progress * Math.PI) * 2.0;
      rightArm.rotation.x = -swingAngle + 0.5;
      rightArm.rotation.z = this.baseArmRotations.right.z - (swingAngle * 0.2);
    }
  }

  updateWeaponAnimation(
    leftArm: THREE.Group | null,
    weaponMesh: THREE.Group | null,
    equippedWeapon: Tool | null
  ): void {
    if (!this._isAttacking || !leftArm || !weaponMesh) return;

    const elapsed = Date.now() - this.attackAnimationTime;
    const animationDuration = 500; // ms
    
    if (elapsed >= animationDuration) {
      this._isAttacking = false;
      // Reset arm to base position
      leftArm.rotation.x = this.baseArmRotations.left.x;
      leftArm.rotation.z = this.baseArmRotations.left.z;
      return;
    }

    // Animate weapon attack with arm movement
    const progress = elapsed / animationDuration;
    
    if (equippedWeapon?.type === 'sword') {
      // Sword slash - horizontal swing
      const swingAngle = Math.sin(progress * Math.PI) * 1.5;
      leftArm.rotation.x = swingAngle + 0.2;
      leftArm.rotation.y = swingAngle * 0.8;
      
    } else if (equippedWeapon?.type === 'dagger') {
      // Dagger stab - quick thrust
      const thrustAngle = Math.sin(progress * Math.PI) * 1.2;
      leftArm.rotation.x = -thrustAngle + 0.5;
      
    } else if (equippedWeapon?.type === 'spear') {
      // Spear thrust - forward stab
      const thrustAngle = Math.sin(progress * Math.PI) * 1.0;
      leftArm.rotation.x = -thrustAngle + 0.3;
      leftArm.rotation.z = this.baseArmRotations.left.z + thrustAngle * 0.3;
      
    } else if (equippedWeapon?.type === 'mace') {
      // Mace smash - overhead slam
      const smashAngle = Math.sin(progress * Math.PI) * 2.2;
      leftArm.rotation.x = -smashAngle + 0.8;
      
    } else if (equippedWeapon?.type === 'bow') {
      // Bow draw - pulling motion
      const drawAngle = Math.sin(progress * Math.PI) * 0.8;
      leftArm.rotation.x = drawAngle + 0.3;
      leftArm.rotation.y = -drawAngle * 0.5;
    }
  }

  get isAttacking(): boolean {
    return this._isAttacking;
  }

  isToolInUse(): boolean {
    return this.isUsingTool;
  }
}