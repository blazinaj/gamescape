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

  // Animation state tracking
  private runningTime: number = 0;
  private breathingTime: number = 0;
  private headBobTime: number = 0;

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
    const isRunning = input.run && isMoving;

    this.runningTime += isMoving ? 0.02 : 0;
    this.breathingTime += 0.01;
    this.headBobTime += isMoving ? 0.015 : 0.005;

    if (isMoving && !this.isUsingTool && !this._isAttacking) {
      // Enhanced walking animation with better arm and leg coordination
      const speed = isRunning ? 1.5 : 1.0;
      const armSwingAmount = input.run ? 0.9 : 0.7;
      const legSwingAmount = input.run ? 0.7 : 0.5;
      
      // Use runningTime for smoother animations
      const cycleTime = this.runningTime * speed;
      
      // Arms swing opposite to legs for natural walking
      leftArm.rotation.x = Math.sin(cycleTime) * armSwingAmount + this.baseArmRotations.left.x;
      rightArm.rotation.x = -Math.sin(cycleTime) * armSwingAmount + this.baseArmRotations.right.x;
      
      // Arms also rotate slightly around y and z for more natural movement
      leftArm.rotation.y = Math.sin(cycleTime * 0.5) * 0.1 + this.baseArmRotations.left.y;
      rightArm.rotation.y = -Math.sin(cycleTime * 0.5) * 0.1 + this.baseArmRotations.right.y;
      leftArm.rotation.z = Math.cos(cycleTime * 0.5) * 0.05 + this.baseArmRotations.left.z;
      rightArm.rotation.z = -Math.cos(cycleTime * 0.5) * 0.05 + this.baseArmRotations.right.z;
      
      // Legs swing opposite to each other
      leftLeg.rotation.x = -Math.sin(cycleTime) * legSwingAmount + this.baseLegRotations.left.x;
      rightLeg.rotation.x = Math.sin(cycleTime) * legSwingAmount + this.baseLegRotations.right.x;
      
      // Add slight sideways rotation for natural hip movement
      leftLeg.rotation.z = Math.sin(cycleTime) * 0.05 + this.baseLegRotations.left.z;
      rightLeg.rotation.z = -Math.sin(cycleTime) * 0.05 + this.baseLegRotations.right.z;
      
      // Add slight forward lean when running
      if (input.run) {
        leftArm.rotation.x += 0.3;
        rightArm.rotation.x += 0.3;
        leftLeg.rotation.x += 0.1;
        rightLeg.rotation.x += 0.1;
      }
    } else if (!this.isUsingTool && !this._isAttacking) {
      // Enhanced idle animation with more natural breathing and subtle movements
      const breathAmount = 0.06;
      const idleSwayAmount = 0.04;
      
      // Subtle arm movements during breathing
      leftArm.rotation.x = Math.sin(this.breathingTime * 0.3) * breathAmount + this.baseArmRotations.left.x;
      rightArm.rotation.x = Math.sin(this.breathingTime * 0.3) * breathAmount + this.baseArmRotations.right.x;
      
      // Subtle arm rotation for more liveliness
      leftArm.rotation.y = Math.sin(this.breathingTime * 0.2) * idleSwayAmount + this.baseArmRotations.left.y;
      rightArm.rotation.y = -Math.sin(this.breathingTime * 0.2) * idleSwayAmount + this.baseArmRotations.right.y;
      
      // Very subtle sway for legs in idle position
      leftLeg.rotation.x = Math.sin(this.breathingTime * 0.15) * 0.02 + this.baseLegRotations.left.x;
      rightLeg.rotation.x = -Math.sin(this.breathingTime * 0.15) * 0.02 + this.baseLegRotations.right.x;
      
      // Subtle hip adjustments
      leftLeg.rotation.z = Math.sin(this.breathingTime * 0.1) * 0.01 + this.baseLegRotations.left.z;
      rightLeg.rotation.z = -Math.sin(this.breathingTime * 0.1) * 0.01 + this.baseLegRotations.right.z;
    }

    // Maintain base rotations for natural limb positioning
    leftArm.rotation.z = this.baseArmRotations.left.z + Math.sin(this.headBobTime) * 0.02;
    rightArm.rotation.z = this.baseArmRotations.right.z - Math.sin(this.headBobTime) * 0.02;
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
      // Reset arm to base position with slight transition
      rightArm.rotation.x = this.baseArmRotations.right.x;
      rightArm.rotation.z = this.baseArmRotations.right.z;
      return;
    }

    // Enhanced tool animation with better arm movement
    const progress = elapsed / animationDuration;
    
    if (equippedTool?.type === 'axe') {
      // Enhanced axe swing - overhead chop with more realistic motion curve
      const swingPhase = Math.min(1, progress * 1.5); // Speed up first half of swing
      
      // Use easing function for more natural movement
      const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const swingAngle = Math.sin(easeInOut(swingPhase) * Math.PI) * 2.0; // More dramatic swing
      
      rightArm.rotation.x = -swingAngle + 0.3;
      rightArm.rotation.y = Math.sin(easeInOut(swingPhase) * Math.PI) * 0.2; // Add slight sideways movement
      rightArm.rotation.z = this.baseArmRotations.right.z - (swingAngle * 0.3);
      
      // Add follow-through and recovery phase
      if (progress > 0.6) {
        const recoveryPhase = (progress - 0.6) / 0.4;
        rightArm.rotation.x = -swingAngle * (1 - recoveryPhase) + this.baseArmRotations.right.x * recoveryPhase + 0.3 * (1 - recoveryPhase);
        rightArm.rotation.z = (this.baseArmRotations.right.z - (swingAngle * 0.3)) * (1 - recoveryPhase) + this.baseArmRotations.right.z * recoveryPhase;
      }
      
    } else if (equippedTool?.type === 'pickaxe') {
      // Enhanced pickaxe swing with better animation curve
      const swingPhase = progress < 0.4 ? progress / 0.4 : (1 - progress) / 0.6; // Faster raise, slower strike
      
      // Use different movement for upswing and downswing
      if (progress < 0.4) {
        // Upswing/preparation
        const upswingAngle = swingPhase * 1.5;
        rightArm.rotation.x = -upswingAngle;
        rightArm.rotation.z = this.baseArmRotations.right.z - upswingAngle * 0.1;
      } else {
        // Downswing/strike (more powerful)
        const strikeProgress = (progress - 0.4) / 0.6;
        const strikeAngle = Math.sin(strikeProgress * Math.PI) * 2.5;
        
        rightArm.rotation.x = -1.5 + strikeAngle;
        rightArm.rotation.y = Math.sin(strikeProgress * Math.PI * 0.5) * 0.2; // Add slight twist
        rightArm.rotation.z = this.baseArmRotations.right.z - 0.15 + strikeAngle * 0.1;
        
        // Add shake at impact
        if (strikeProgress > 0.45 && strikeProgress < 0.55) {
          const shakeAmount = 0.03;
          rightArm.rotation.x += (Math.random() - 0.5) * shakeAmount;
          rightArm.rotation.y += (Math.random() - 0.5) * shakeAmount;
        }
      }
    } else {
      // Default tool animation for other tool types
      // More generically useful animation with prep, swing, and follow-through phases
      const swingAngle = Math.sin(progress * Math.PI) * 1.5;
      
      if (progress < 0.3) {
        // Preparation phase - draw back
        const prepProgress = progress / 0.3;
        rightArm.rotation.x = -prepProgress * 0.8 + this.baseArmRotations.right.x;
        rightArm.rotation.y = prepProgress * 0.2;
      } else if (progress < 0.6) {
        // Swing phase - forward movement
        const swingProgress = (progress - 0.3) / 0.3;
        rightArm.rotation.x = -0.8 + swingProgress * 1.8;
        rightArm.rotation.y = 0.2 - swingProgress * 0.3;
      } else {
        // Recovery phase
        const recoveryProgress = (progress - 0.6) / 0.4;
        rightArm.rotation.x = 1.0 - recoveryProgress * (1.0 - this.baseArmRotations.right.x);
        rightArm.rotation.y = -0.1 + recoveryProgress * 0.1;
      }
      
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
    const animationDuration = 600; // slightly longer for weapons
    
    if (elapsed >= animationDuration) {
      this._isAttacking = false;
      // Reset arm to base position with slight transition
      leftArm.rotation.x = this.baseArmRotations.left.x;
      leftArm.rotation.y = this.baseArmRotations.left.y;
      leftArm.rotation.z = this.baseArmRotations.left.z;
      return;
    }

    // Enhanced weapon animations with better physics and follow-through
    const progress = elapsed / animationDuration;
    
    if (equippedWeapon?.type === 'sword') {
      // Enhanced sword slash - horizontal swing with better arc
      const slashPhases = [0.3, 0.6, 1.0]; // Preparation, strike, follow-through
      
      if (progress < slashPhases[0]) {
        // Preparation phase - draw back
        const prepProgress = progress / slashPhases[0];
        const easeInPrepProgress = prepProgress * prepProgress; // Ease-in
        
        leftArm.rotation.x = this.baseArmRotations.left.x - easeInPrepProgress * 0.3;
        leftArm.rotation.y = this.baseArmRotations.left.y - easeInPrepProgress * 1.2;
        leftArm.rotation.z = this.baseArmRotations.left.z - easeInPrepProgress * 0.2;
        
      } else if (progress < slashPhases[1]) {
        // Strike phase - fast swing
        const strikeProgress = (progress - slashPhases[0]) / (slashPhases[1] - slashPhases[0]);
        const easeOutStrikeProgress = 1 - Math.pow(1 - strikeProgress, 2); // Ease-out for power
        
        leftArm.rotation.x = this.baseArmRotations.left.x - 0.3 + easeOutStrikeProgress * 1.0;
        leftArm.rotation.y = this.baseArmRotations.left.y - 1.2 + easeOutStrikeProgress * 2.4;
        leftArm.rotation.z = this.baseArmRotations.left.z - 0.2 + easeOutStrikeProgress * 0.4;
        
        // Add blade wobble at mid-swing for effect
        if (strikeProgress > 0.4 && strikeProgress < 0.6) {
          weaponMesh.rotation.z = (Math.random() - 0.5) * 0.1;
        }
        
      } else {
        // Follow-through phase
        const recoveryProgress = (progress - slashPhases[1]) / (slashPhases[2] - slashPhases[1]);
        const easeInOutRecoveryProgress = recoveryProgress < 0.5 ? 
          2 * recoveryProgress * recoveryProgress : 
          -1 + (4 - 2 * recoveryProgress) * recoveryProgress;
        
        leftArm.rotation.x = this.baseArmRotations.left.x + 0.7 - easeInOutRecoveryProgress * 0.7;
        leftArm.rotation.y = this.baseArmRotations.left.y + 1.2 - easeInOutRecoveryProgress * 1.2;
        leftArm.rotation.z = this.baseArmRotations.left.z + 0.2 - easeInOutRecoveryProgress * 0.2;
      }
      
    } else if (equippedWeapon?.type === 'dagger') {
      // Enhanced dagger stab - more precise, direct thrust
      const stabPhases = [0.25, 0.45, 1.0]; // Ready, strike, withdraw
      
      if (progress < stabPhases[0]) {
        // Ready position - pull back and up
        const readyProgress = progress / stabPhases[0];
        leftArm.rotation.x = this.baseArmRotations.left.x - readyProgress * 0.8;
        leftArm.rotation.y = this.baseArmRotations.left.y + readyProgress * 0.2;
        leftArm.rotation.z = this.baseArmRotations.left.z + readyProgress * 0.1;
        
      } else if (progress < stabPhases[1]) {
        // Strike phase - fast, direct thrust forward
        const strikeProgress = (progress - stabPhases[0]) / (stabPhases[1] - stabPhases[0]);
        const easeOutStrikeProgress = 1 - Math.pow(1 - strikeProgress, 3); // Sharper ease-out for stab
        
        leftArm.rotation.x = this.baseArmRotations.left.x - 0.8 + easeOutStrikeProgress * 2.2;
        leftArm.rotation.y = this.baseArmRotations.left.y + 0.2 - easeOutStrikeProgress * 0.4;
        leftArm.rotation.z = this.baseArmRotations.left.z + 0.1;
        
        // Add slight shake at full extension
        if (strikeProgress > 0.8) {
          leftArm.rotation.x += (Math.random() - 0.5) * 0.05;
          leftArm.rotation.y += (Math.random() - 0.5) * 0.05;
        }
        
      } else {
        // Withdraw phase - return to neutral position
        const withdrawProgress = (progress - stabPhases[1]) / (stabPhases[2] - stabPhases[1]);
        
        leftArm.rotation.x = this.baseArmRotations.left.x + 1.4 - withdrawProgress * 1.4;
        leftArm.rotation.y = this.baseArmRotations.left.y - 0.2 + withdrawProgress * 0.2;
        leftArm.rotation.z = this.baseArmRotations.left.z + 0.1 - withdrawProgress * 0.1;
      }
      
    } else if (equippedWeapon?.type === 'spear') {
      // Enhanced spear thrust with better weight and momentum
      const thrustPhases = [0.3, 0.5, 1.0]; // Windup, thrust, recover
      
      if (progress < thrustPhases[0]) {
        // Windup phase - pull back
        const windupProgress = progress / thrustPhases[0];
        leftArm.rotation.x = this.baseArmRotations.left.x - windupProgress * 1.0; // Pull back and up
        leftArm.rotation.y = this.baseArmRotations.left.y - windupProgress * 0.2;
        leftArm.rotation.z = this.baseArmRotations.left.z + windupProgress * 0.5; // Rotate to position
        
      } else if (progress < thrustPhases[1]) {
        // Thrust phase - powerful forward motion
        const thrustProgress = (progress - thrustPhases[0]) / (thrustPhases[1] - thrustPhases[0]);
        const easedThrust = 1 - Math.pow(1 - thrustProgress, 2); // Ease out for momentum
        
        leftArm.rotation.x = this.baseArmRotations.left.x - 1.0 + easedThrust * 2.5; // Long reach
        leftArm.rotation.y = this.baseArmRotations.left.y - 0.2 + thrustProgress * 0.4;
        leftArm.rotation.z = this.baseArmRotations.left.z + 0.5 - thrustProgress * 0.7;
        
        // Add spear vibration at full extension
        if (thrustProgress > 0.8) {
          weaponMesh.rotation.y = (Math.random() - 0.5) * 0.05;
          weaponMesh.rotation.z = (Math.random() - 0.5) * 0.05;
        }
        
      } else {
        // Recovery phase - return to ready
        const recoveryProgress = (progress - thrustPhases[1]) / (thrustPhases[2] - thrustPhases[1]);
        
        leftArm.rotation.x = this.baseArmRotations.left.x + 1.5 - recoveryProgress * 1.5;
        leftArm.rotation.y = this.baseArmRotations.left.y + 0.2 - recoveryProgress * 0.2;
        leftArm.rotation.z = this.baseArmRotations.left.z - 0.2 + recoveryProgress * 0.2;
      }
      
    } else if (equippedWeapon?.type === 'mace') {
      // Enhanced mace smash with better weight and power
      const smashPhases = [0.35, 0.55, 1.0]; // Windup, smash, recover
      
      if (progress < smashPhases[0]) {
        // Windup phase - raise high
        const windupProgress = progress / smashPhases[0];
        const easedWindup = windupProgress * windupProgress; // Ease-in for effort
        
        leftArm.rotation.x = this.baseArmRotations.left.x - easedWindup * 1.8; // High overhead
        leftArm.rotation.y = this.baseArmRotations.left.y + easedWindup * 0.3;
        leftArm.rotation.z = this.baseArmRotations.left.z - easedWindup * 0.2;
        
      } else if (progress < smashPhases[1]) {
        // Smash phase - powerful downward strike
        const smashProgress = (progress - smashPhases[0]) / (smashPhases[1] - smashPhases[0]);
        // Use cubic easing for a strong, weighted feel
        const easedSmash = smashProgress * smashProgress * smashProgress;
        
        leftArm.rotation.x = this.baseArmRotations.left.x - 1.8 + easedSmash * 3.0;
        leftArm.rotation.y = this.baseArmRotations.left.y + 0.3 - smashProgress * 0.6;
        leftArm.rotation.z = this.baseArmRotations.left.z - 0.2 + smashProgress * 0.4;
        
        // Add impact shake at bottom of swing
        if (smashProgress > 0.85) {
          leftArm.rotation.x += (Math.random() - 0.5) * 0.1;
          leftArm.rotation.y += (Math.random() - 0.5) * 0.1;
          leftArm.rotation.z += (Math.random() - 0.5) * 0.1;
        }
        
      } else {
        // Recovery phase - weapon has momentum
        const recoveryProgress = (progress - smashPhases[1]) / (smashPhases[2] - smashPhases[1]);
        // Slower recovery due to weapon weight
        const easedRecovery = Math.sqrt(recoveryProgress);
        
        leftArm.rotation.x = this.baseArmRotations.left.x + 1.2 - easedRecovery * 1.2;
        leftArm.rotation.y = this.baseArmRotations.left.y - 0.3 + easedRecovery * 0.3;
        leftArm.rotation.z = this.baseArmRotations.left.z + 0.2 - easedRecovery * 0.2;
      }
      
    } else if (equippedWeapon?.type === 'bow') {
      // Enhanced bow draw and fire animation
      const bowPhases = [0.4, 0.5, 1.0]; // Draw, hold, release
      
      if (progress < bowPhases[0]) {
        // Draw phase - pull back string
        const drawProgress = progress / bowPhases[0];
        
        leftArm.rotation.x = this.baseArmRotations.left.x + drawProgress * 0.8; // Raise arm
        leftArm.rotation.y = this.baseArmRotations.left.y - drawProgress * 1.2; // Pull across body
        
        // Add slight oscillation for effort
        if (drawProgress > 0.7) {
          leftArm.rotation.x += Math.sin(elapsed * 0.05) * 0.02;
        }
        
      } else if (progress < bowPhases[1]) {
        // Brief hold at full draw
        leftArm.rotation.x = this.baseArmRotations.left.x + 0.8;
        leftArm.rotation.y = this.baseArmRotations.left.y - 1.2;
        
        // Add tension shaking
        leftArm.rotation.x += Math.sin(elapsed * 0.1) * 0.015;
        leftArm.rotation.y += Math.sin(elapsed * 0.12) * 0.01;
        
      } else {
        // Release and follow through
        const releaseProgress = (progress - bowPhases[1]) / (bowPhases[2] - bowPhases[1]);
        
        // Quick initial snap on release, then slower return
        const snapFactor = releaseProgress < 0.1 ? 
          releaseProgress * 10 : 0.8 + (releaseProgress - 0.1) * 0.2;
        
        leftArm.rotation.x = this.baseArmRotations.left.x + 0.8 - snapFactor * 0.8;
        leftArm.rotation.y = this.baseArmRotations.left.y - 1.2 + snapFactor * 1.2;
        
        // Add slight forward motion after release
        if (releaseProgress < 0.3) {
          leftArm.rotation.x += (0.3 - releaseProgress) * 0.2;
        }
      }
    } else {
      // Default weapon animation with better physics
      // Generic slash with windup and follow-through
      
      if (progress < 0.3) {
        // Preparation phase
        const prepProgress = progress / 0.3;
        leftArm.rotation.x = this.baseArmRotations.left.x - prepProgress * 0.5;
        leftArm.rotation.y = this.baseArmRotations.left.y - prepProgress * 0.8;
      } else if (progress < 0.6) {
        // Strike phase
        const strikeProgress = (progress - 0.3) / 0.3;
        const swingAngle = Math.pow(strikeProgress, 2) * 2.0; // Accelerating swing
        
        leftArm.rotation.x = this.baseArmRotations.left.x - 0.5 + swingAngle;
        leftArm.rotation.y = this.baseArmRotations.left.y - 0.8 + strikeProgress * 1.6;
      } else {
        // Follow-through phase
        const recoveryProgress = (progress - 0.6) / 0.4;
        
        leftArm.rotation.x = this.baseArmRotations.left.x + 1.5 - recoveryProgress * 1.5;
        leftArm.rotation.y = this.baseArmRotations.left.y + 0.8 - recoveryProgress * 0.8;
      }
    }
  }

  get isAttacking(): boolean {
    return this._isAttacking;
  }

  isToolInUse(): boolean {
    return this.isUsingTool;
  }
}