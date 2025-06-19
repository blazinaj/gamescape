import { InventorySystem } from './InventorySystem';
import { notificationSystem } from './NotificationSystem';
import * as THREE from 'three';

export interface InteractableObject {
  id: string;
  type: string;
  maxHp: number;
  currentHp: number;
  position: { x: number; y: number; z: number };
  drops: {
    itemId: string;
    quantity: number;
    chance: number;
  }[];
  mesh?: THREE.Object3D;
  canHarvest: boolean;
  canExamine: boolean;
  canTake: boolean;
  name: string;
  description: string;
}

export interface InteractionOption {
  id: string;
  label: string;
  icon: string;
  description: string;
  action: () => void;
}

export class InteractableObjectManager {
  private objects: Map<string, InteractableObject> = new Map();
  private inventorySystem: InventorySystem;

  constructor(inventorySystem: InventorySystem) {
    this.inventorySystem = inventorySystem;
  }

  createInteractableObject(
    id: string,
    type: string,
    position: { x: number; y: number; z: number },
    mesh?: THREE.Object3D
  ): InteractableObject {
    const objectData = this.getObjectDataByType(type);
    
    const object: InteractableObject = {
      id,
      type,
      maxHp: objectData.hp,
      currentHp: objectData.hp,
      position,
      drops: objectData.drops,
      mesh,
      canHarvest: objectData.canHarvest,
      canExamine: objectData.canExamine,
      canTake: objectData.canTake,
      name: objectData.name,
      description: objectData.description
    };

    this.objects.set(id, object);
    return object;
  }

  private getObjectDataByType(type: string) {
    const objectTypes = {
      tree: {
        hp: 100,
        name: 'Tree',
        description: 'A tall tree with valuable wood',
        canHarvest: true,
        canExamine: true,
        canTake: false,
        drops: [
          { itemId: 'wood_log', quantity: 3, chance: 1.0 },
          { itemId: 'wood_log', quantity: 2, chance: 0.8 },
          { itemId: 'leaves', quantity: 5, chance: 0.6 },
          { itemId: 'berry', quantity: 1, chance: 0.2 }
        ]
      },
      bush: {
        hp: 25,
        name: 'Bush',
        description: 'A leafy bush with berries',
        canHarvest: true,
        canExamine: true,
        canTake: false,
        drops: [
          { itemId: 'leaves', quantity: 2, chance: 1.0 },
          { itemId: 'berry', quantity: 2, chance: 0.8 },
          { itemId: 'wood_log', quantity: 1, chance: 0.3 }
        ]
      },
      rock: {
        hp: 150,
        name: 'Rock',
        description: 'A solid rock containing minerals',
        canHarvest: true,
        canExamine: true,
        canTake: false,
        drops: [
          { itemId: 'stone', quantity: 4, chance: 1.0 },
          { itemId: 'stone', quantity: 2, chance: 0.7 },
          { itemId: 'flint', quantity: 1, chance: 0.4 },
          { itemId: 'iron_ore', quantity: 1, chance: 0.1 }
        ]
      },
      ruins: {
        hp: 80,
        name: 'Ancient Ruins',
        description: 'Crumbling remains of an old structure',
        canHarvest: true,
        canExamine: true,
        canTake: false,
        drops: [
          { itemId: 'stone_brick', quantity: 2, chance: 1.0 },
          { itemId: 'stone', quantity: 3, chance: 0.8 },
          { itemId: 'iron_ore', quantity: 1, chance: 0.3 }
        ]
      },
      chest: {
        hp: 50,
        name: 'Treasure Chest',
        description: 'A wooden chest that might contain valuable items',
        canHarvest: false,
        canExamine: true,
        canTake: true,
        drops: [
          { itemId: 'iron_ore', quantity: 3, chance: 0.8 },
          { itemId: 'stone_brick', quantity: 2, chance: 0.6 },
          { itemId: 'wood_log', quantity: 5, chance: 0.9 },
          { itemId: 'flint', quantity: 2, chance: 0.4 }
        ]
      },
      crate: {
        hp: 30,
        name: 'Wooden Crate',
        description: 'A storage crate containing supplies',
        canHarvest: false,
        canExamine: true,
        canTake: true,
        drops: [
          { itemId: 'wood_plank', quantity: 2, chance: 1.0 },
          { itemId: 'berry', quantity: 3, chance: 0.7 },
          { itemId: 'flint', quantity: 1, chance: 0.3 }
        ]
      },
      plant: {
        hp: 15,
        name: 'Wild Plant',
        description: 'A medicinal plant growing in the wild',
        canHarvest: true,
        canExamine: true,
        canTake: true,
        drops: [
          { itemId: 'leaves', quantity: 3, chance: 1.0 },
          { itemId: 'berry', quantity: 1, chance: 0.6 }
        ]
      },
      mushroom: {
        hp: 10,
        name: 'Wild Mushroom',
        description: 'An edible mushroom growing on the ground',
        canHarvest: false,
        canExamine: true,
        canTake: true,
        drops: [
          { itemId: 'berry', quantity: 2, chance: 1.0 },
          { itemId: 'leaves', quantity: 1, chance: 0.4 }
        ]
      },
      crystal: {
        hp: 200,
        name: 'Crystal Formation',
        description: 'A beautiful crystal formation containing valuable minerals',
        canHarvest: true,
        canExamine: true,
        canTake: false,
        drops: [
          { itemId: 'iron_ore', quantity: 2, chance: 1.0 },
          { itemId: 'stone', quantity: 3, chance: 0.8 },
          { itemId: 'flint', quantity: 3, chance: 0.6 }
        ]
      },
      log: {
        hp: 60,
        name: 'Fallen Log',
        description: 'A fallen tree trunk, rich in wood',
        canHarvest: true,
        canExamine: true,
        canTake: false,
        drops: [
          { itemId: 'wood_log', quantity: 4, chance: 1.0 },
          { itemId: 'wood_plank', quantity: 1, chance: 0.5 },
          { itemId: 'berry', quantity: 1, chance: 0.2 }
        ]
      },
      berry_bush: {
        hp: 20,
        name: 'Berry Bush',
        description: 'A bush heavy with ripe berries',
        canHarvest: true,
        canExamine: true,
        canTake: false,
        drops: [
          { itemId: 'berry', quantity: 4, chance: 1.0 },
          { itemId: 'berry', quantity: 2, chance: 0.8 },
          { itemId: 'leaves', quantity: 2, chance: 0.6 }
        ]
      },
      // Non-resource objects
      well: {
        hp: 999,
        name: 'Stone Well',
        description: 'An old stone well, still functional',
        canHarvest: false,
        canExamine: true,
        canTake: false,
        drops: []
      },
      campfire: {
        hp: 999,
        name: 'Campfire',
        description: 'The remains of someone\'s campfire',
        canHarvest: false,
        canExamine: true,
        canTake: false,
        drops: []
      },
      statue: {
        hp: 999,
        name: 'Ancient Statue',
        description: 'A weathered statue from a bygone era',
        canHarvest: false,
        canExamine: true,
        canTake: false,
        drops: []
      },
      fence: {
        hp: 50,
        name: 'Wooden Fence',
        description: 'A simple wooden fence',
        canHarvest: true,
        canExamine: true,
        canTake: false,
        drops: [
          { itemId: 'wood_plank', quantity: 1, chance: 1.0 }
        ]
      },
      bridge: {
        hp: 999,
        name: 'Wooden Bridge',
        description: 'A sturdy wooden bridge',
        canHarvest: false,
        canExamine: true,
        canTake: false,
        drops: []
      },
      cart: {
        hp: 80,
        name: 'Wooden Cart',
        description: 'An old cart, might contain supplies',
        canHarvest: false,
        canExamine: true,
        canTake: true,
        drops: [
          { itemId: 'wood_plank', quantity: 3, chance: 0.8 },
          { itemId: 'rope', quantity: 1, chance: 0.6 }
        ]
      }
    };

    return objectTypes[type as keyof typeof objectTypes] || objectTypes.rock;
  }

  getInteractionOptions(objectId: string): InteractionOption[] {
    const object = this.objects.get(objectId);
    if (!object) return [];

    const options: InteractionOption[] = [];

    // Examine option (always available)
    if (object.canExamine) {
      options.push({
        id: 'examine',
        label: 'Examine',
        icon: '🔍',
        description: `Look closely at the ${object.name.toLowerCase()}`,
        action: () => this.examineObject(objectId)
      });
    }

    // Take/Open option for containers and small items
    if (object.canTake) {
      const label = ['chest', 'crate', 'cart'].includes(object.type) ? 'Open' : 'Take';
      const icon = ['chest', 'crate', 'cart'].includes(object.type) ? '📦' : '👋';
      
      options.push({
        id: 'take',
        label,
        icon,
        description: `${label} the ${object.name.toLowerCase()}`,
        action: () => this.takeObject(objectId)
      });
    }

    // Harvest option for resource objects (requires tools in real implementation)
    if (object.canHarvest) {
      options.push({
        id: 'harvest',
        label: 'Harvest',
        icon: '⛏️',
        description: `Harvest materials from the ${object.name.toLowerCase()}`,
        action: () => this.harvestObject(objectId)
      });
    }

    return options;
  }

  private examineObject(objectId: string): void {
    const object = this.objects.get(objectId);
    if (!object) return;

    const messages = {
      tree: "This is a sturdy tree. Its wood could be useful for building.",
      bush: "A leafy bush with small berries growing on it.",
      rock: "A large rock formation. It looks like it contains minerals.",
      ruins: "Ancient stone ruins. Who knows what civilization built these?",
      chest: "A wooden chest with metal fittings. It looks like it might contain treasure.",
      crate: "A simple wooden storage crate. There might be supplies inside.",
      plant: "A wild medicinal plant. Its leaves could be useful for healing.",
      mushroom: "A colorful mushroom. It looks edible, but you should be careful.",
      crystal: "A beautiful crystal formation that sparkles in the light.",
      log: "A fallen tree trunk. Still plenty of good wood in it.",
      berry_bush: "A bush loaded with ripe, juicy berries.",
      well: "An old stone well. The water looks clear and fresh.",
      campfire: "The cold ashes of someone's campfire. They were here recently.",
      statue: "An ancient statue, weathered by time. You can barely make out its features.",
      fence: "A simple wooden fence marking a boundary.",
      bridge: "A sturdy wooden bridge spanning a gap.",
      cart: "An old wooden cart with iron-bound wheels."
    };

    const message = messages[object.type as keyof typeof messages] || object.description;
    console.log(`🔍 ${object.name}: ${message}`);
  }

  private takeObject(objectId: string): void {
    const object = this.objects.get(objectId);
    if (!object) return;

    console.log(`📦 Taking items from ${object.name}...`);
    
    // Generate items based on drops and track what was actually obtained
    const itemsObtained: { name: string; icon: string; quantity: number }[] = [];
    
    object.drops.forEach(drop => {
      if (Math.random() <= drop.chance) {
        if (this.inventorySystem.addItem(drop.itemId, drop.quantity)) {
          // Get item details for notification
          const itemStack = this.inventorySystem.getInventory().find(stack => stack.item.id === drop.itemId);
          if (itemStack) {
            itemsObtained.push({
              name: itemStack.item.name,
              icon: itemStack.item.icon,
              quantity: drop.quantity
            });
          }
        }
      }
    });

    if (itemsObtained.length > 0) {
      notificationSystem.showItemNotification(
        `Opened ${object.name.toLowerCase()}`,
        itemsObtained
      );
      
      // Remove the object after taking items
      this.removeObject(objectId, true);
    } else {
      notificationSystem.showItemNotification(
        `The ${object.name.toLowerCase()} is empty`,
        []
      );
    }
  }

  private harvestObject(objectId: string): void {
    const object = this.objects.get(objectId);
    if (!object) return;

    console.log(`⛏️ Harvesting ${object.name}...`);
    
    // For simplicity, allow harvesting without tools (in real game, check for appropriate tool)
    const damage = 25; // Base harvest damage
    
    object.currentHp = Math.max(0, object.currentHp - damage);
    
    // Visual feedback
    if (object.mesh) {
      this.flashDamage(object.mesh);
    }

    // Generate some items from harvesting and track what was obtained
    const itemsObtained: { name: string; icon: string; quantity: number }[] = [];
    const harvestYield = Math.floor(Math.random() * 2) + 1; // 1-2 items
    
    object.drops.slice(0, harvestYield).forEach(drop => {
      if (Math.random() <= drop.chance * 0.5) { // Reduced chance for harvesting
        const quantity = Math.max(1, Math.floor(drop.quantity * 0.5));
        if (this.inventorySystem.addItem(drop.itemId, quantity)) {
          // Get item details for notification
          const itemStack = this.inventorySystem.getInventory().find(stack => stack.item.id === drop.itemId);
          if (itemStack) {
            itemsObtained.push({
              name: itemStack.item.name,
              icon: itemStack.item.icon,
              quantity: quantity
            });
          }
        }
      }
    });

    // Show notification for harvested items
    if (itemsObtained.length > 0) {
      notificationSystem.showItemNotification(
        `Harvested from ${object.name.toLowerCase()}`,
        itemsObtained
      );
    }

    // Check if object is destroyed
    if (object.currentHp <= 0) {
      this.destroyObject(objectId);
    }
  }

  private destroyObject(objectId: string): void {
    const object = this.objects.get(objectId);
    if (!object) return;

    console.log(`🔥 Destroying ${object.name}...`);

    // Generate final loot drops and track what was obtained
    const itemsObtained: { name: string; icon: string; quantity: number }[] = [];
    
    object.drops.forEach(drop => {
      if (Math.random() <= drop.chance) {
        if (this.inventorySystem.addItem(drop.itemId, drop.quantity)) {
          // Get item details for notification
          const itemStack = this.inventorySystem.getInventory().find(stack => stack.item.id === drop.itemId);
          if (itemStack) {
            itemsObtained.push({
              name: itemStack.item.name,
              icon: itemStack.item.icon,
              quantity: drop.quantity
            });
          }
        }
      }
    });

    // Show notification for final loot
    if (itemsObtained.length > 0) {
      notificationSystem.showItemNotification(
        `${object.name} destroyed`,
        itemsObtained
      );
    }

    // Remove the object
    this.removeObject(objectId, true);
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

  // Tool-based damage (existing functionality for tool usage)
  damageObject(objectId: string, damage: number): boolean {
    const object = this.objects.get(objectId);
    if (!object) return false;

    object.currentHp = Math.max(0, object.currentHp - damage);
    
    console.log(`💥 ${object.name} took ${damage} damage (${object.currentHp}/${object.maxHp} HP remaining)`);

    // Visual feedback
    if (object.mesh) {
      this.flashDamage(object.mesh);
    }

    // Check if object is destroyed
    if (object.currentHp <= 0) {
      this.destroyObject(objectId);
      return true; // Object was destroyed
    }

    return false; // Object still exists
  }

  getObjectsInRange(position: THREE.Vector3, range: number): InteractableObject[] {
    const objectsInRange: InteractableObject[] = [];
    
    this.objects.forEach(object => {
      const distance = position.distanceTo(new THREE.Vector3(
        object.position.x,
        object.position.y,
        object.position.z
      ));
      
      if (distance <= range) {
        objectsInRange.push(object);
      }
    });
    
    return objectsInRange;
  }

  getObject(objectId: string): InteractableObject | undefined {
    return this.objects.get(objectId);
  }

  getAllObjects(): InteractableObject[] {
    return Array.from(this.objects.values());
  }

  removeObject(objectId: string, removeFromScene: boolean = true): void {
    const object = this.objects.get(objectId);
    if (!object) return;

    if (removeFromScene && object.mesh && object.mesh.parent) {
      object.mesh.parent.remove(object.mesh);
    }

    this.objects.delete(objectId);
  }

  clear(): void {
    this.objects.clear();
  }
}