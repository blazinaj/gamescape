import { ResourceNode } from '../types/InventoryTypes';
import { InventorySystem } from './InventorySystem';
import * as THREE from 'three';

export class ResourceNodeManager {
  private nodes: Map<string, ResourceNode> = new Map();
  private inventorySystem: InventorySystem;

  constructor(inventorySystem: InventorySystem) {
    this.inventorySystem = inventorySystem;
  }

  createResourceNode(
    id: string,
    type: string,
    position: { x: number; y: number; z: number },
    mesh?: THREE.Object3D
  ): ResourceNode {
    const nodeData = this.getNodeDataByType(type);
    
    const node: ResourceNode = {
      id,
      type,
      maxHp: nodeData.hp,
      currentHp: nodeData.hp,
      position,
      drops: nodeData.drops,
      mesh
    };

    this.nodes.set(id, node);
    return node;
  }

  private getNodeDataByType(type: string) {
    const nodeTypes = {
      tree: {
        hp: 100,
        drops: [
          { itemId: 'wood_log', quantity: 3, chance: 1.0 },
          { itemId: 'wood_log', quantity: 2, chance: 0.8 },
          { itemId: 'leaves', quantity: 5, chance: 0.6 },
          { itemId: 'berry', quantity: 1, chance: 0.2 }
        ]
      },
      bush: {
        hp: 25,
        drops: [
          { itemId: 'leaves', quantity: 2, chance: 1.0 },
          { itemId: 'berry', quantity: 2, chance: 0.8 },
          { itemId: 'wood_log', quantity: 1, chance: 0.3 }
        ]
      },
      rock: {
        hp: 150,
        drops: [
          { itemId: 'stone', quantity: 4, chance: 1.0 },
          { itemId: 'stone', quantity: 2, chance: 0.7 },
          { itemId: 'flint', quantity: 1, chance: 0.4 },
          { itemId: 'iron_ore', quantity: 1, chance: 0.1 }
        ]
      },
      ruins: {
        hp: 80,
        drops: [
          { itemId: 'stone_brick', quantity: 2, chance: 1.0 },
          { itemId: 'stone', quantity: 3, chance: 0.8 },
          { itemId: 'iron_ore', quantity: 1, chance: 0.3 }
        ]
      },
      // New interactive objects
      chest: {
        hp: 50,
        drops: [
          { itemId: 'iron_ore', quantity: 3, chance: 0.8 },
          { itemId: 'stone_brick', quantity: 2, chance: 0.6 },
          { itemId: 'wood_log', quantity: 5, chance: 0.9 },
          { itemId: 'flint', quantity: 2, chance: 0.4 }
        ]
      },
      crate: {
        hp: 30,
        drops: [
          { itemId: 'wood_plank', quantity: 2, chance: 1.0 },
          { itemId: 'berry', quantity: 3, chance: 0.7 },
          { itemId: 'flint', quantity: 1, chance: 0.3 }
        ]
      },
      plant: {
        hp: 15,
        drops: [
          { itemId: 'leaves', quantity: 3, chance: 1.0 },
          { itemId: 'berry', quantity: 1, chance: 0.6 }
        ]
      },
      mushroom: {
        hp: 10,
        drops: [
          { itemId: 'berry', quantity: 2, chance: 1.0 }, // Mushrooms give berries (edible)
          { itemId: 'leaves', quantity: 1, chance: 0.4 }
        ]
      },
      crystal: {
        hp: 200,
        drops: [
          { itemId: 'iron_ore', quantity: 2, chance: 1.0 },
          { itemId: 'stone', quantity: 3, chance: 0.8 },
          { itemId: 'flint', quantity: 3, chance: 0.6 }
        ]
      },
      log: {
        hp: 60,
        drops: [
          { itemId: 'wood_log', quantity: 4, chance: 1.0 },
          { itemId: 'wood_plank', quantity: 1, chance: 0.5 },
          { itemId: 'berry', quantity: 1, chance: 0.2 } // Sometimes bugs/berries in logs
        ]
      },
      berry_bush: {
        hp: 20,
        drops: [
          { itemId: 'berry', quantity: 4, chance: 1.0 },
          { itemId: 'berry', quantity: 2, chance: 0.8 },
          { itemId: 'leaves', quantity: 2, chance: 0.6 }
        ]
      }
    };

    return nodeTypes[type as keyof typeof nodeTypes] || nodeTypes.tree;
  }

  damageNode(nodeId: string, damage: number): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    node.currentHp = Math.max(0, node.currentHp - damage);
    
    console.log(`💥 ${node.type} took ${damage} damage (${node.currentHp}/${node.maxHp} HP remaining)`);

    // Visual feedback - make the object flash red
    if (node.mesh) {
      this.flashDamage(node.mesh);
    }

    // Check if node is destroyed
    if (node.currentHp <= 0) {
      this.destroyNode(nodeId);
      return true; // Node was destroyed
    }

    return false; // Node still alive
  }

  private flashDamage(mesh: THREE.Object3D): void {
    // Store original materials
    const originalMaterials: THREE.Material[] = [];
    
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        originalMaterials.push(child.material);
        
        // Create damage flash material
        const flashMaterial = new THREE.MeshLambertMaterial({ 
          color: 0xff4444,
          transparent: true,
          opacity: 0.8
        });
        child.material = flashMaterial;
      }
    });

    // Restore original materials after flash
    setTimeout(() => {
      let materialIndex = 0;
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && originalMaterials[materialIndex]) {
          child.material = originalMaterials[materialIndex];
          materialIndex++;
        }
      });
    }, 150);
  }

  private destroyNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    console.log(`🔥 Destroying ${node.type} and generating loot...`);

    // Generate loot drops
    node.drops.forEach(drop => {
      if (Math.random() <= drop.chance) {
        this.inventorySystem.addItem(drop.itemId, drop.quantity);
      }
    });

    // Create destruction particles
    if (node.mesh) {
      this.createDestructionParticles(node.mesh, node.type);
    }

    // Remove from nodes map
    this.nodes.delete(nodeId);

    console.log(`✅ ${node.type} destroyed and loot collected!`);
  }

  private createDestructionParticles(mesh: THREE.Object3D, nodeType: string): void {
    const position = mesh.position.clone();
    
    // Create particle effect based on node type
    const particleCount = 20;
    const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    
    let particleColor = 0x8B4513; // Default brown
    if (nodeType === 'rock' || nodeType === 'ruins' || nodeType === 'crystal') {
      particleColor = 0x696969; // Gray for rocks/ruins/crystals
    } else if (nodeType === 'bush' || nodeType === 'plant' || nodeType === 'berry_bush') {
      particleColor = 0x228B22; // Green for plants
    } else if (nodeType === 'chest' || nodeType === 'crate') {
      particleColor = 0xD2B48C; // Tan for wooden containers
    } else if (nodeType === 'mushroom') {
      particleColor = 0xDC143C; // Red for mushrooms
    }
    
    const particleMaterial = new THREE.MeshLambertMaterial({ color: particleColor });
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Random position around the destroyed object
      particle.position.copy(position);
      particle.position.x += (Math.random() - 0.5) * 2;
      particle.position.y += Math.random() * 2;
      particle.position.z += (Math.random() - 0.5) * 2;
      
      // Add to scene (we'll need to pass scene reference)
      mesh.parent?.add(particle);
      
      // Animate particles falling and fading
      const startY = particle.position.y;
      const animateParticle = () => {
        particle.position.y -= 0.05;
        particle.rotation.x += 0.1;
        particle.rotation.z += 0.1;
        
        // Fade out
        if (particleMaterial.opacity > 0) {
          particleMaterial.opacity -= 0.02;
        }
        
        // Remove when done
        if (particle.position.y < startY - 3 || particleMaterial.opacity <= 0) {
          mesh.parent?.remove(particle);
          return;
        }
        
        requestAnimationFrame(animateParticle);
      };
      
      // Start animation with slight delay
      setTimeout(() => animateParticle(), i * 50);
    }
  }

  getNodesInRange(position: THREE.Vector3, range: number): ResourceNode[] {
    const nodesInRange: ResourceNode[] = [];
    
    this.nodes.forEach(node => {
      const distance = position.distanceTo(new THREE.Vector3(
        node.position.x,
        node.position.y,
        node.position.z
      ));
      
      if (distance <= range) {
        nodesInRange.push(node);
      }
    });
    
    return nodesInRange;
  }

  getNode(nodeId: string): ResourceNode | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): ResourceNode[] {
    return Array.from(this.nodes.values());
  }

  removeNode(nodeId: string, removeFromScene: boolean = true): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    if (removeFromScene && node.mesh && node.mesh.parent) {
      node.mesh.parent.remove(node.mesh);
    }

    this.nodes.delete(nodeId);
  }

  clear(): void {
    this.nodes.clear();
  }
}