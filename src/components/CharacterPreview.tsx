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

    // Add lighting
    this.addLighting();

    // Create character
    this.character = new THREE.Group();
    this.scene.add(this.character);

    // Start animation loop
    this.animate();
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
    // Main body
    const bodyGeometry = new THREE.CapsuleGeometry(0.3 * customization.bodyWidth, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(customization.clothingColor.replace('#', ''), 16) 
    });
    this.characterParts.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.characterParts.body.position.y = 1;
    this.characterParts.body.castShadow = true;
    this.character.add(this.characterParts.body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25 * customization.headScale, 8, 6);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(customization.bodyColor.replace('#', ''), 16) 
    });
    this.characterParts.head = new THREE.Mesh(headGeometry, headMaterial);
    this.characterParts.head.position.y = 2;
    this.characterParts.head.castShadow = true;
    this.character.add(this.characterParts.head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05 * customization.headScale, 6, 4);
    const eyeMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(customization.eyeColor.replace('#', ''), 16) 
    });
    
    this.characterParts.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.characterParts.leftEye.position.set(-0.1 * customization.headScale, 2.1, 0.2 * customization.headScale);
    this.character.add(this.characterParts.leftEye);
    
    this.characterParts.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.characterParts.rightEye.position.set(0.1 * customization.headScale, 2.1, 0.2 * customization.headScale);
    this.character.add(this.characterParts.rightEye);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.1, 0.8 * customization.armLength, 4, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(customization.bodyColor.replace('#', ''), 16) 
    });
    
    this.characterParts.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.characterParts.leftArm.position.set(-0.45 * customization.bodyWidth, 1.2, 0);
    this.characterParts.leftArm.rotation.set(0, 0, 0.1);
    this.characterParts.leftArm.castShadow = true;
    this.character.add(this.characterParts.leftArm);
    
    this.characterParts.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.characterParts.rightArm.position.set(0.45 * customization.bodyWidth, 1.2, 0);
    this.characterParts.rightArm.rotation.set(0, 0, -0.1);
    this.characterParts.rightArm.castShadow = true;
    this.character.add(this.characterParts.rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.8 * customization.legLength, 4, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ 
      color: parseInt(customization.clothingColor.replace('#', ''), 16) 
    });
    
    this.characterParts.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.characterParts.leftLeg.position.set(-0.15 * customization.bodyWidth, 0.4 * customization.legLength, 0);
    this.characterParts.leftLeg.castShadow = true;
    this.character.add(this.characterParts.leftLeg);
    
    this.characterParts.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.characterParts.rightLeg.position.set(0.15 * customization.bodyWidth, 0.4 * customization.legLength, 0);
    this.characterParts.rightLeg.castShadow = true;
    this.character.add(this.characterParts.rightLeg);

    // Add simple smile
    const smileGeometry = new THREE.TorusGeometry(0.06 * customization.headScale, 0.01 * customization.headScale, 4, 8, Math.PI);
    const smileMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(0, 1.95, 0.18 * customization.headScale);
    smile.rotation.z = Math.PI;
    this.character.add(smile);

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

    // Gentle idle animation
    const time = Date.now() * 0.002;
    
    // Gentle bobbing
    this.character.position.y = Math.sin(time) * 0.02;
    
    // Slight arm sway
    if (this.characterParts.leftArm && this.characterParts.rightArm) {
      this.characterParts.leftArm.rotation.z = 0.1 + Math.sin(time * 0.7) * 0.05;
      this.characterParts.rightArm.rotation.z = -0.1 - Math.sin(time * 0.7) * 0.05;
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