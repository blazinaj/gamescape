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
  private textures: Map<string, THREE.Texture> = new Map();

  constructor(customization?: CharacterCustomization) {
    this.mesh = new THREE.Group();
    
    if (customization) {
      this.customization = customization;
    }
    
    this.preloadTextures();
    this.createCharacterMesh();

    // Adjust the entire mesh group so feet are at ground level (y=0)
    this.alignMeshToGround();
  }

  private preloadTextures(): void {
    // Create and store reusable textures
    const textureLoader = new THREE.TextureLoader();

    // Common textures for character
    const textureUrls = {
      'skin': 'https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=512&h=512&dpr=1',
      'cloth': 'https://images.pexels.com/photos/1092364/pexels-photo-1092364.jpeg?auto=compress&cs=tinysrgb&w=512&h=512&dpr=1',
      'leather': 'https://images.pexels.com/photos/276092/pexels-photo-276092.jpeg?auto=compress&cs=tinysrgb&w=512&h=512&dpr=1',
    };

    // Load each texture
    for (const [key, url] of Object.entries(textureUrls)) {
      try {
        const texture = textureLoader.load(url);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        this.textures.set(key, texture);
      } catch (error) {
        console.error(`Failed to load texture ${key} from ${url}:`, error);
      }
    }
  }

  private getTexture(name: string): THREE.Texture | null {
    return this.textures.get(name) || null;
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

    // Get textures
    const skinTexture = this.getTexture('skin');
    const clothTexture = this.getTexture('cloth');

    // Main body - improved with better geometry
    const bodyGeometry = new THREE.CapsuleGeometry(0.3 * this.customization.bodyWidth, bodyHeight, 8, 12);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: parseInt(this.customization.clothingColor.replace('#', ''), 16),
      roughness: 0.7,
      metalness: 0.1
    });
    
    if (clothTexture) {
      bodyMaterial.map = clothTexture;
      bodyMaterial.map.repeat.set(1, 2);
    }
    
    this.characterParts.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.characterParts.body.position.y = bodyY;
    this.characterParts.body.castShadow = true;
    this.characterParts.body.receiveShadow = true;
    this.mesh.add(this.characterParts.body);

    // Improved head with better geometry and facial features
    const headGeometry = new THREE.SphereGeometry(0.25 * this.customization.headScale, 16, 12);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: parseInt(this.customization.bodyColor.replace('#', ''), 16),
      roughness: 0.5,
      metalness: 0.1
    });
    
    if (skinTexture) {
      headMaterial.map = skinTexture;
    }
    
    this.characterParts.head = new THREE.Mesh(headGeometry, headMaterial);
    this.characterParts.head.position.y = bodyY + 0.6 + 0.25 * this.customization.headScale; // on top of body
    this.characterParts.head.castShadow = true;
    this.mesh.add(this.characterParts.head);

    // More detailed eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05 * this.customization.headScale, 12, 10);
    const eyeMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(this.customization.eyeColor.replace('#', ''), 16) 
    });
    
    // Add pupil detail
    const pupilGeometry = new THREE.SphereGeometry(0.025 * this.customization.headScale, 8, 8);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Left eye with pupil
    const leftEyeGroup = new THREE.Group();
    this.characterParts.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEyeGroup.add(this.characterParts.leftEye);
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 0.03 * this.customization.headScale;
    leftEyeGroup.add(leftPupil);
    
    leftEyeGroup.position.set(
      -0.1 * this.customization.headScale, 
      this.characterParts.head.position.y + 0.05, 
      0.2 * this.customization.headScale
    );
    this.mesh.add(leftEyeGroup);
    
    // Right eye with pupil
    const rightEyeGroup = new THREE.Group();
    this.characterParts.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEyeGroup.add(this.characterParts.rightEye);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.z = 0.03 * this.customization.headScale;
    rightEyeGroup.add(rightPupil);
    
    rightEyeGroup.position.set(
      0.1 * this.customization.headScale, 
      this.characterParts.head.position.y + 0.05, 
      0.2 * this.customization.headScale
    );
    this.mesh.add(rightEyeGroup);

    // Add more facial features
    
    // Nose
    const noseGeometry = new THREE.ConeGeometry(0.04 * this.customization.headScale, 0.08 * this.customization.headScale, 4);
    const noseMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(this.customization.bodyColor.replace('#', ''), 16) 
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(
      0, 
      this.characterParts.head.position.y, 
      0.25 * this.customization.headScale
    );
    nose.rotation.x = -Math.PI / 2; // Point outward
    this.mesh.add(nose);
    
    // Mouth
    const mouthGeometry = new THREE.TorusGeometry(0.08 * this.customization.headScale, 0.01 * this.customization.headScale, 8, 12, Math.PI * 0.5);
    const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xA02020 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(
      0, 
      this.characterParts.head.position.y - 0.08 * this.customization.headScale, 
      0.22 * this.customization.headScale
    );
    mouth.rotation.x = -Math.PI / 10; // Slight angle
    this.mesh.add(mouth);
    
    // Ears
    const earGeometry = new THREE.SphereGeometry(0.06 * this.customization.headScale, 8, 6);
    // Modify ear geometry to be more ear-shaped
    if (earGeometry.attributes.position) {
      const positions = earGeometry.attributes.position;
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Flatten and elongate ears
        positions.setXYZ(
          i,
          x * 0.6,
          y * 1.2,
          z
        );
      }
      
      earGeometry.computeVertexNormals();
    }
    
    const earMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(this.customization.bodyColor.replace('#', ''), 16)
    });
    
    // Left ear
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(
      -0.25 * this.customization.headScale, 
      this.characterParts.head.position.y + 0.05 * this.customization.headScale, 
      0
    );
    this.mesh.add(leftEar);
    
    // Right ear
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(
      0.25 * this.customization.headScale, 
      this.characterParts.head.position.y + 0.05 * this.customization.headScale, 
      0
    );
    this.mesh.add(rightEar);

    // Hair - simple representation
    if (Math.random() > 0.3) { // 70% chance to have visible hair
      const hairColor = 0x000000 + Math.floor(Math.random() * 0x8B4513);
      const hairGeometry = new THREE.SphereGeometry(0.27 * this.customization.headScale, 16, 12);
      // Modify to create a hair shape
      if (hairGeometry.attributes.position) {
        const positions = hairGeometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
          const y = positions.getY(i);
          
          // Only keep top portion of sphere
          if (y < -0.05) {
            positions.setY(i, -0.05);
          }
        }
        
        hairGeometry.computeVertexNormals();
      }
      
      const hairMaterial = new THREE.MeshLambertMaterial({ color: hairColor });
      const hair = new THREE.Mesh(hairGeometry, hairMaterial);
      hair.position.copy(this.characterParts.head.position);
      hair.position.y += 0.05;
      this.mesh.add(hair);
    }

    // Improved limbs with better joints and details
    
    // Improved arm geometry
    const armGeometry = new THREE.CapsuleGeometry(0.1, 0.8 * this.customization.armLength, 8, 10);
    const armMaterial = new THREE.MeshStandardMaterial({ 
      color: parseInt(this.customization.bodyColor.replace('#', ''), 16),
      roughness: 0.6,
      metalness: 0.1
    });
    
    if (skinTexture) {
      armMaterial.map = skinTexture;
    }
    
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

    // Add arm details - forearm/hand distinction
    
    // Left forearm/hand
    const leftHandGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const leftHand = new THREE.Mesh(leftHandGeometry, armMaterial);
    leftHand.position.set(0, -0.8 * this.customization.armLength, 0);
    this.leftArm.add(leftHand);
    
    // Right forearm/hand
    const rightHandGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const rightHand = new THREE.Mesh(rightHandGeometry, armMaterial);
    rightHand.position.set(0, -0.8 * this.customization.armLength, 0);
    this.rightArm.add(rightHand);
    
    // Add simple fingers
    const fingerCount = 3; // Simplified fingers
    
    for (let i = 0; i < fingerCount; i++) {
      const fingerGeometry = new THREE.CapsuleGeometry(0.02, 0.06, 4, 2);
      
      // Left hand fingers
      const leftFinger = new THREE.Mesh(fingerGeometry, armMaterial);
      leftFinger.position.set(
        -0.03 + i * 0.03,
        -0.85 * this.customization.armLength,
        0.05
      );
      leftFinger.rotation.x = -Math.PI / 6;
      this.leftArm.add(leftFinger);
      
      // Right hand fingers
      const rightFinger = new THREE.Mesh(fingerGeometry, armMaterial);
      rightFinger.position.set(
        -0.03 + i * 0.03,
        -0.85 * this.customization.armLength,
        0.05
      );
      rightFinger.rotation.x = -Math.PI / 6;
      this.rightArm.add(rightFinger);
    }

    // Improved legs
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.8 * this.customization.legLength, 8, 10);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: parseInt(this.customization.clothingColor.replace('#', ''), 16),
      roughness: 0.7,
      metalness: 0.0
    });
    
    if (clothTexture) {
      legMaterial.map = clothTexture;
      legMaterial.map.repeat.set(1, 1);
    }
    
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

    // Add foot details
    
    // Left foot
    const leftFootGeometry = new THREE.BoxGeometry(0.14, 0.05, 0.2);
    const leftFoot = new THREE.Mesh(leftFootGeometry, legMaterial);
    leftFoot.position.set(0, -0.8 * this.customization.legLength - 0.025, 0.04);
    this.leftLeg.add(leftFoot);
    
    // Right foot
    const rightFootGeometry = new THREE.BoxGeometry(0.14, 0.05, 0.2);
    const rightFoot = new THREE.Mesh(rightFootGeometry, legMaterial);
    rightFoot.position.set(0, -0.8 * this.customization.legLength - 0.025, 0.04);
    this.rightLeg.add(rightFoot);

    // Add clothing details
    
    // Belt
    const beltGeometry = new THREE.CylinderGeometry(
      0.31 * this.customization.bodyWidth,
      0.31 * this.customization.bodyWidth,
      0.1,
      16
    );
    const beltMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.y = bodyY - 0.2;
    this.mesh.add(belt);
    
    // Belt buckle
    const buckleGeometry = new THREE.BoxGeometry(0.1, 0.07, 0.04);
    const buckleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xDAA520,
      roughness: 0.2,
      metalness: 0.8
    });
    const buckle = new THREE.Mesh(buckleGeometry, buckleMaterial);
    buckle.position.set(0, bodyY - 0.2, 0.32 * this.customization.bodyWidth);
    this.mesh.add(buckle);
    
    // Neck collar detail
    const collarGeometry = new THREE.TorusGeometry(
      0.13 * this.customization.bodyWidth,
      0.03,
      8,
      16,
      Math.PI
    );
    const collarMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(this.customization.clothingColor.replace('#', ''), 16)
    });
    const collar = new THREE.Mesh(collarGeometry, collarMaterial);
    collar.position.set(0, bodyY + 0.55, 0.02);
    collar.rotation.x = Math.PI / 2;
    collar.rotation.z = Math.PI;
    this.mesh.add(collar);

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