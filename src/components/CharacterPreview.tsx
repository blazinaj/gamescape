import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CharacterCustomization } from '../types/CharacterTypes';

interface CharacterPreviewProps {
  customization: CharacterCustomization;
  className?: string;
}

export class CharacterPreviewRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private character: THREE.Group;
  private animationId: number | null = null;
  private characterParts: {
    body?: THREE.Mesh;
    head?: THREE.Mesh;
    leftEye?: THREE.Mesh;
    rightEye?: THREE.Mesh;
    leftArm?: THREE.Mesh;
    rightArm?: THREE.Mesh;
    leftLeg?: THREE.Mesh;
    rightLeg?: THREE.Mesh;
  } = {};
  private textures: Map<string, THREE.Texture> = new Map();

  constructor(container: HTMLElement, width: number, height: number) {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1f2937); // Dark gray background

    // Create camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(3, 2, 4);
    this.camera.lookAt(0, 1, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(this.renderer.domElement);

    // Preload textures
    this.preloadTextures();

    // Add lighting
    this.addLighting();

    // Create character
    this.character = new THREE.Group();
    this.scene.add(this.character);

    // Start animation loop
    this.animate();
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

  private addLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.4);
    fillLight.position.set(-3, 5, -3);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 3, -5);
    this.scene.add(rimLight);
  }

  updateCharacter(customization: CharacterCustomization): void {
    // Clear existing character
    this.character.clear();
    this.characterParts = {};

    // Create character with new customization
    this.createCharacterMesh(customization);
  }

  private createCharacterMesh(customization: CharacterCustomization): void {
    // Get textures
    const skinTexture = this.getTexture('skin');
    const clothTexture = this.getTexture('cloth');

    // Main body (improved with better geometry)
    const bodyGeometry = new THREE.CapsuleGeometry(0.3 * customization.bodyWidth, 1.2, 8, 12);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: parseInt(customization.clothingColor.replace('#', ''), 16),
      roughness: 0.7,
      metalness: 0.1
    });
    
    if (clothTexture) {
      bodyMaterial.map = clothTexture;
      bodyMaterial.map.repeat.set(1, 2);
    }
    
    this.characterParts.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.characterParts.body.position.y = 1;
    this.characterParts.body.castShadow = true;
    this.characterParts.body.receiveShadow = true;
    this.character.add(this.characterParts.body);

    // Improved head with better geometry and facial features
    const headGeometry = new THREE.SphereGeometry(0.25 * customization.headScale, 16, 12);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: parseInt(customization.bodyColor.replace('#', ''), 16),
      roughness: 0.5,
      metalness: 0.1
    });
    
    if (skinTexture) {
      headMaterial.map = skinTexture;
    }
    
    this.characterParts.head = new THREE.Mesh(headGeometry, headMaterial);
    this.characterParts.head.position.y = 2;
    this.characterParts.head.castShadow = true;
    this.character.add(this.characterParts.head);

    // More detailed eyes with pupils
    const eyeGeometry = new THREE.SphereGeometry(0.05 * customization.headScale, 12, 10);
    const eyeMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(customization.eyeColor.replace('#', ''), 16) 
    });
    
    // Add pupil detail
    const pupilGeometry = new THREE.SphereGeometry(0.025 * customization.headScale, 8, 8);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Left eye with pupil
    const leftEyeGroup = new THREE.Group();
    this.characterParts.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEyeGroup.add(this.characterParts.leftEye);
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 0.03 * customization.headScale;
    leftEyeGroup.add(leftPupil);
    
    leftEyeGroup.position.set(
      -0.1 * customization.headScale, 
      2.05, 
      0.2 * customization.headScale
    );
    this.character.add(leftEyeGroup);
    
    // Right eye with pupil
    const rightEyeGroup = new THREE.Group();
    this.characterParts.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEyeGroup.add(this.characterParts.rightEye);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.z = 0.03 * customization.headScale;
    rightEyeGroup.add(rightPupil);
    
    rightEyeGroup.position.set(
      0.1 * customization.headScale, 
      2.05, 
      0.2 * customization.headScale
    );
    this.character.add(rightEyeGroup);

    // Add more facial features
    
    // Nose
    const noseGeometry = new THREE.ConeGeometry(0.04 * customization.headScale, 0.08 * customization.headScale, 4);
    const noseMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(customization.bodyColor.replace('#', ''), 16) 
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(
      0, 
      2.0, 
      0.25 * customization.headScale
    );
    nose.rotation.x = -Math.PI / 2; // Point outward
    this.character.add(nose);
    
    // Mouth - simple smile
    const smileGeometry = new THREE.TorusGeometry(0.08 * customization.headScale, 0.01 * customization.headScale, 8, 12, Math.PI * 0.5);
    const smileMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(
      0, 
      1.9, 
      0.22 * customization.headScale
    );
    smile.rotation.x = -Math.PI / 10; // Slight angle
    this.character.add(smile);
    
    // Ears
    const earGeometry = new THREE.SphereGeometry(0.06 * customization.headScale, 8, 6);
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
      color: parseInt(customization.bodyColor.replace('#', ''), 16)
    });
    
    // Left ear
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(
      -0.25 * customization.headScale, 
      2.05, 
      0
    );
    this.character.add(leftEar);
    
    // Right ear
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(
      0.25 * customization.headScale, 
      2.05, 
      0
    );
    this.character.add(rightEar);

    // Hair - simple representation
    if (Math.random() > 0.3) { // 70% chance to have visible hair
      const hairColor = 0x000000 + Math.floor(Math.random() * 0x8B4513);
      const hairGeometry = new THREE.SphereGeometry(0.27 * customization.headScale, 16, 12);
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
      hair.position.set(0, 2.1, 0);
      this.character.add(hair);
    }

    // Arms (improved)
    const armGeometry = new THREE.CapsuleGeometry(0.1, 0.8 * customization.armLength, 8, 10);
    const armMaterial = new THREE.MeshStandardMaterial({ 
      color: parseInt(customization.bodyColor.replace('#', ''), 16),
      roughness: 0.6,
      metalness: 0.1
    });
    
    if (skinTexture) {
      armMaterial.map = skinTexture;
    }
    
    // Left arm
    this.characterParts.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.characterParts.leftArm.position.set(
      -0.45 * customization.bodyWidth, 
      1.6, 
      0
    );
    this.characterParts.leftArm.castShadow = true;
    this.character.add(this.characterParts.leftArm);
    
    // Right arm
    this.characterParts.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.characterParts.rightArm.position.set(
      0.45 * customization.bodyWidth, 
      1.6, 
      0
    );
    this.characterParts.rightArm.castShadow = true;
    this.character.add(this.characterParts.rightArm);

    // Add hand details
    const handGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    
    // Left hand
    const leftHand = new THREE.Mesh(handGeometry, armMaterial);
    leftHand.position.set(
      -0.45 * customization.bodyWidth,
      1.6 - 0.8 * customization.armLength,
      0
    );
    this.character.add(leftHand);
    
    // Right hand
    const rightHand = new THREE.Mesh(handGeometry, armMaterial);
    rightHand.position.set(
      0.45 * customization.bodyWidth,
      1.6 - 0.8 * customization.armLength,
      0
    );
    this.character.add(rightHand);

    // Legs (improved)
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.8 * customization.legLength, 8, 10);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: parseInt(customization.clothingColor.replace('#', ''), 16),
      roughness: 0.7,
      metalness: 0.0
    });
    
    if (clothTexture) {
      legMaterial.map = clothTexture;
      legMaterial.map.repeat.set(1, 1);
    }
    
    // Left leg
    this.characterParts.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.characterParts.leftLeg.position.set(
      -0.18 * customization.bodyWidth, 
      0.4 * customization.legLength, 
      0
    );
    this.characterParts.leftLeg.castShadow = true;
    this.character.add(this.characterParts.leftLeg);
    
    // Right leg
    this.characterParts.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.characterParts.rightLeg.position.set(
      0.18 * customization.bodyWidth, 
      0.4 * customization.legLength, 
      0
    );
    this.characterParts.rightLeg.castShadow = true;
    this.character.add(this.characterParts.rightLeg);

    // Add foot details
    const footGeometry = new THREE.BoxGeometry(0.14, 0.05, 0.2);
    
    // Left foot
    const leftFoot = new THREE.Mesh(footGeometry, legMaterial);
    leftFoot.position.set(
      -0.18 * customization.bodyWidth,
      0.025,
      0.04
    );
    this.character.add(leftFoot);
    
    // Right foot
    const rightFoot = new THREE.Mesh(footGeometry, legMaterial);
    rightFoot.position.set(
      0.18 * customization.bodyWidth,
      0.025,
      0.04
    );
    this.character.add(rightFoot);

    // Add clothing details
    
    // Belt
    const beltGeometry = new THREE.CylinderGeometry(
      0.31 * customization.bodyWidth,
      0.31 * customization.bodyWidth,
      0.1,
      16
    );
    const beltMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.y = 0.8;
    this.character.add(belt);
    
    // Belt buckle
    const buckleGeometry = new THREE.BoxGeometry(0.1, 0.07, 0.04);
    const buckleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xDAA520,
      roughness: 0.2,
      metalness: 0.8
    });
    const buckle = new THREE.Mesh(buckleGeometry, buckleMaterial);
    buckle.position.set(0, 0.8, 0.32 * customization.bodyWidth);
    this.character.add(buckle);
    
    // Neck collar detail
    const collarGeometry = new THREE.TorusGeometry(
      0.13 * customization.bodyWidth,
      0.03,
      8,
      16,
      Math.PI
    );
    const collarMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(customization.clothingColor.replace('#', ''), 16)
    });
    const collar = new THREE.Mesh(collarGeometry, collarMaterial);
    collar.position.set(0, 1.55, 0.02);
    collar.rotation.x = Math.PI / 2;
    collar.rotation.z = Math.PI;
    this.character.add(collar);

    // Apply overall scale
    this.character.scale.setScalar(customization.scale);

    // Add a simple ground plane
    const groundGeometry = new THREE.PlaneGeometry(8, 8);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x374151,
      transparent: true,
      opacity: 0.3
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.character.add(ground);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    // Enhanced idle animation with more natural movement
    const time = Date.now() * 0.002;
    
    // Primary bobbing movement
    this.character.position.y = Math.sin(time * 0.5) * 0.03;
    
    // Gentle head movement
    if (this.characterParts.head) {
      this.characterParts.head.rotation.y = Math.sin(time * 0.3) * 0.1;
      this.characterParts.head.rotation.x = Math.sin(time * 0.5) * 0.05;
    }
    
    // Subtle arm swaying
    if (this.characterParts.leftArm && this.characterParts.rightArm) {
      // Enhanced arm movements that look more natural
      this.characterParts.leftArm.rotation.x = Math.sin(time * 0.7) * 0.1;
      this.characterParts.rightArm.rotation.x = -Math.sin(time * 0.7) * 0.1;
      
      this.characterParts.leftArm.rotation.z = Math.cos(time * 0.5) * 0.05 + 0.1;
      this.characterParts.rightArm.rotation.z = -Math.cos(time * 0.5) * 0.05 - 0.1;
    }
    
    // Subtle leg movements
    if (this.characterParts.leftLeg && this.characterParts.rightLeg) {
      // Very subtle leg movement while idle
      this.characterParts.leftLeg.rotation.x = Math.sin(time * 0.3) * 0.03;
      this.characterParts.rightLeg.rotation.x = -Math.sin(time * 0.3) * 0.03;
    }

    // Slow rotation around the character
    const radius = 4;
    const rotationSpeed = 0.3;
    this.camera.position.x = Math.cos(time * rotationSpeed) * radius;
    this.camera.position.z = Math.sin(time * rotationSpeed) * radius;
    this.camera.lookAt(0, 1, 0);

    this.renderer.render(this.scene, this.camera);
  };

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Clean up Three.js resources
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    
    // Dispose of textures
    this.textures.forEach(texture => {
      texture.dispose();
    });
    
    this.renderer.dispose();
    
    // Remove canvas from DOM
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({ 
  customization, 
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CharacterPreviewRenderer | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Create renderer
    rendererRef.current = new CharacterPreviewRenderer(
      container, 
      rect.width || 300, 
      rect.height || 400
    );

    // Update with initial customization
    rendererRef.current.updateCharacter(customization);

    // Set up resize observer
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (rendererRef.current && width > 0 && height > 0) {
          rendererRef.current.resize(width, height);
        }
      }
    });

    resizeObserverRef.current.observe(container);

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, []);

  // Update character when customization changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateCharacter(customization);
    }
  }, [customization]);

  return (
    <div 
      ref={containerRef} 
      className={`bg-gray-800 rounded-lg border border-gray-600 overflow-hidden ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
};