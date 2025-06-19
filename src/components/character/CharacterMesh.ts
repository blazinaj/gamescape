import * as THREE from 'three';
import { CharacterCustomization, DEFAULT_CUSTOMIZATION } from '../../types/CharacterTypes';

export interface CharacterParts {
  body?: THREE.Mesh;
  head?: THREE.Mesh;
  leftEye?: THREE.Mesh;
  rightEye?: THREE.Mesh;
  leftArmMesh?: THREE.Mesh;
  rightArmMesh?: THREE.Mesh;
  leftLegMesh?: THREE.Mesh;
  rightLegMesh?: THREE.Mesh;
}

export class CharacterMesh {
  public mesh: THREE.Group;
  public rightArm: THREE.Group | null = null;
  public leftArm: THREE.Group | null = null;
  public rightLeg: THREE.Group | null = null;
  public leftLeg: THREE.Group | null = null;
  
  private characterParts: CharacterParts = {};
  private customization: CharacterCustomization = DEFAULT_CUSTOMIZATION;

  constructor(customization?: CharacterCustomization) {
    this.mesh = new THREE.Group();
    
    if (customization) {
      this.customization = customization;
    }
    
    this.createCharacterMesh();

    // Adjust the entire mesh group so feet are at ground level (y=0)
    this.alignMeshToGround();
  }

  updateCustomization(customization: CharacterCustomization): void {
    this.customization = customization;
    
    // Clear existing mesh and recreate with new customization
    this.mesh.clear();
    this.characterParts = {};
    this.createCharacterMesh();

    // Realign after customization update
    this.alignMeshToGround();
  }

  getCustomization(): CharacterCustomization {
    return { ...this.customization };
  }

  private alignMeshToGround(): void {
    // Find the lowest point of the character (typically feet or bottom of legs)
    // and adjust the entire mesh group to bring that point to y=0
    const box = new THREE.Box3().setFromObject(this.mesh);
    const lowestPoint = box.min.y;

    // Move the entire mesh up so the lowest point is at y=0
    this.mesh.position.y = -lowestPoint;
  }

  private createCharacterMesh(): void {
    // Clear existing character parts
    this.characterParts = {};
    const bodyHeight = 1.2;
    const bodyY = bodyHeight / 2; // Position of body center relative to feet

    // Main body (capsule-like shape)
    const bodyGeometry = new THREE.CapsuleGeometry(0.3 * this.customization.bodyWidth, bodyHeight, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: parseInt(this.customization.clothingColor.replace('#', ''), 16) 
    });
    this.characterParts.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.characterParts.body.position.y = bodyY;
    this.characterParts.body.castShadow = true;
    this.mesh.add(this.characterParts.body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25 * this.customization.headScale, 8, 6);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(this.customization.bodyColor.replace('#', ''), 16) 
    });
    this.characterParts.head = new THREE.Mesh(headGeometry, headMaterial);
    this.characterParts.head.position.y = bodyY + 0.6 + 0.25 * this.customization.headScale; // on top of body
    this.characterParts.head.castShadow = true;
    this.mesh.add(this.characterParts.head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05 * this.customization.headScale, 6, 4);
    const eyeMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(this.customization.eyeColor.replace('#', ''), 16) 
    });
    this.characterParts.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.characterParts.leftEye.position.set(-0.1 * this.customization.headScale, this.characterParts.head.position.y + 0.1, 0.2 * this.customization.headScale);
    this.mesh.add(this.characterParts.leftEye);
    this.characterParts.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.characterParts.rightEye.position.set(0.1 * this.customization.headScale, this.characterParts.head.position.y + 0.1, 0.2 * this.customization.headScale);
    this.mesh.add(this.characterParts.rightEye);

    // Arms - Using Groups for proper pivot points at shoulders
    const armGeometry = new THREE.CapsuleGeometry(0.1, 0.8 * this.customization.armLength, 4, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(this.customization.bodyColor.replace('#', ''), 16) 
    });
    // Left arm group (pivot at shoulder)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.45 * this.customization.bodyWidth, bodyY + 0.4, 0);
    this.leftArm.rotation.set(0, 0, 0.1);
    this.mesh.add(this.leftArm);
    // Left arm mesh (offset downward so top aligns with shoulder)
    this.characterParts.leftArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    this.characterParts.leftArmMesh.position.set(0, -0.4 * this.customization.armLength, 0);
    this.characterParts.leftArmMesh.castShadow = true;
    this.leftArm.add(this.characterParts.leftArmMesh);
    // Right arm group (pivot at shoulder)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.45 * this.customization.bodyWidth, bodyY + 0.4, 0);
    this.rightArm.rotation.set(0, 0, -0.1);
    this.mesh.add(this.rightArm);
    // Right arm mesh (offset downward so top aligns with shoulder)
    this.characterParts.rightArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    this.characterParts.rightArmMesh.position.set(0, -0.4 * this.customization.armLength, 0);
    this.characterParts.rightArmMesh.castShadow = true;
    this.rightArm.add(this.characterParts.rightArmMesh);
    // Legs - Using Groups for proper pivot points at hips
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.8 * this.customization.legLength, 4, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(this.customization.clothingColor.replace('#', ''), 16) 
    });
    // Left leg group (pivot at hip)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.18 * this.customization.bodyWidth, bodyY - 0.6, 0);
    this.mesh.add(this.leftLeg);
    this.characterParts.leftLegMesh = new THREE.Mesh(legGeometry, legMaterial);
    this.characterParts.leftLegMesh.position.set(0, -0.4 * this.customization.legLength, 0);
    this.characterParts.leftLegMesh.castShadow = true;
    this.leftLeg.add(this.characterParts.leftLegMesh);
    // Right leg group (pivot at hip)
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.18 * this.customization.bodyWidth, bodyY - 0.6, 0);
    this.mesh.add(this.rightLeg);
    this.characterParts.rightLegMesh = new THREE.Mesh(legGeometry, legMaterial);
    this.characterParts.rightLegMesh.position.set(0, -0.4 * this.customization.legLength, 0);
    this.characterParts.rightLegMesh.castShadow = true;
    this.rightLeg.add(this.characterParts.rightLegMesh);

    // Set overall scale
    this.mesh.scale.setScalar(this.customization.scale);

    // Set initial rotation only - don't lift the character
    this.mesh.position.set(0, 0, 0); // Keep feet at ground level (y=0)
    this.mesh.rotation.y = 0;
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  getRotation(): THREE.Quaternion {
    return this.mesh.quaternion.clone();
  }
}