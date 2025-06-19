import * as THREE from 'three';
import { Tool } from '../../types/EquipmentTypes';
import { CharacterCustomization } from '../../types/CharacterTypes';

export class CharacterEquipment {
  private toolMesh: THREE.Group | null = null;
  private weaponMesh: THREE.Group | null = null;
  private rightArm: THREE.Group | null = null;
  private leftArm: THREE.Group | null = null;
  private customization: CharacterCustomization;

  constructor(rightArm: THREE.Group | null, leftArm: THREE.Group | null, customization: CharacterCustomization) {
    this.rightArm = rightArm;
    this.leftArm = leftArm;
    this.customization = customization;
    this.createToolMesh();
    this.createWeaponMesh();
  }

  updateArms(rightArm: THREE.Group | null, leftArm: THREE.Group | null, customization: CharacterCustomization): void {
    this.rightArm = rightArm;
    this.leftArm = leftArm;
    this.customization = customization;
    this.createToolMesh();
    this.createWeaponMesh();
  }

  private createToolMesh(): void {
    this.toolMesh = new THREE.Group();
    
    // Attach tool to right arm group (so it moves with arm rotations)
    if (this.rightArm) {
      // Position tool at the hand (end of arm) - this is the grip point
      this.toolMesh.position.set(0.05, -0.8 * this.customization.armLength, 0);
      this.toolMesh.rotation.set(0, 0, 0);
      this.rightArm.add(this.toolMesh);
    }
  }

  private createWeaponMesh(): void {
    this.weaponMesh = new THREE.Group();
    
    // Attach weapon to left arm group for dual wielding
    if (this.leftArm) {
      this.weaponMesh.position.set(-0.05, -0.8 * this.customization.armLength, 0);
      this.weaponMesh.rotation.set(0, 0, 0);
      this.leftArm.add(this.weaponMesh);
    }
  }

  updateToolMesh(tool: Tool | null): void {
    if (!this.toolMesh) return;

    // Clear existing tool
    this.toolMesh.clear();

    if (!tool) return;

    // Create visual representation of the tool
    const toolGroup = this.createToolGeometry(tool);
    this.toolMesh.add(toolGroup);
  }

  updateWeaponMesh(weapon: Tool | null): void {
    if (!this.weaponMesh) return;

    // Clear existing weapon
    this.weaponMesh.clear();

    if (!weapon) return;

    // Create visual representation of the weapon
    const weaponGroup = this.createWeaponGeometry(weapon);
    this.weaponMesh.add(weaponGroup);
  }

  private createToolGeometry(tool: Tool): THREE.Group {
    const toolGroup = new THREE.Group();

    switch (tool.type) {
      case 'axe':
        // Create axe with handle and blade
        const axeHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.04, 1.0, 8),
          new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        axeHandle.position.set(0, 0.5, 0);
        axeHandle.castShadow = true;
        toolGroup.add(axeHandle);

        const axeBlade = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.2, 0.05),
          new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
        );
        axeBlade.position.set(0, 1.0, 0);
        axeBlade.castShadow = true;
        toolGroup.add(axeBlade);

        toolGroup.rotation.set(Math.PI / 6, 0, 0);
        break;

      case 'pickaxe':
        const pickHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.04, 1.1, 8),
          new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        pickHandle.position.set(0, 0.55, 0);
        pickHandle.castShadow = true;
        toolGroup.add(pickHandle);

        const pickHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.15, 0.6),
          new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        pickHead.position.set(0, 1.1, 0);
        pickHead.rotation.set(0, Math.PI / 2, 0);
        pickHead.castShadow = true;
        toolGroup.add(pickHead);

        toolGroup.rotation.set(Math.PI / 4, 0, 0);
        break;

      default:
        const defaultTool = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.8, 0.08),
          new THREE.MeshLambertMaterial({ color: parseInt(tool.color.replace('#', ''), 16) })
        );
        defaultTool.position.set(0, 0.4, 0);
        defaultTool.castShadow = true;
        toolGroup.add(defaultTool);
        break;
    }

    return toolGroup;
  }

  private createWeaponGeometry(weapon: Tool): THREE.Group {
    const weaponGroup = new THREE.Group();

    switch (weapon.type) {
      case 'sword':
        // Sword handle
        const swordHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8),
          new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        swordHandle.position.set(0, 0.15, 0);
        swordHandle.castShadow = true;
        weaponGroup.add(swordHandle);

        // Sword blade
        const swordBlade = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 1.2, 0.02),
          new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
        );
        swordBlade.position.set(0, 0.9, 0);
        swordBlade.castShadow = true;
        weaponGroup.add(swordBlade);

        // Crossguard
        const crossguard = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.05, 0.05),
          new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        crossguard.position.set(0, 0.3, 0);
        crossguard.castShadow = true;
        weaponGroup.add(crossguard);
        break;

      case 'dagger':
        const daggerHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.03, 0.2, 6),
          new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        daggerHandle.position.set(0, 0.1, 0);
        daggerHandle.castShadow = true;
        weaponGroup.add(daggerHandle);

        const daggerBlade = new THREE.Mesh(
          new THREE.ConeGeometry(0.03, 0.6, 6),
          new THREE.MeshLambertMaterial({ color: 0xE6E6FA })
        );
        daggerBlade.position.set(0, 0.5, 0);
        daggerBlade.castShadow = true;
        weaponGroup.add(daggerBlade);
        break;

      case 'spear':
        const spearShaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6),
          new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        spearShaft.position.set(0, 0.75, 0);
        spearShaft.castShadow = true;
        weaponGroup.add(spearShaft);

        const spearHead = new THREE.Mesh(
          new THREE.ConeGeometry(0.05, 0.3, 6),
          new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
        );
        spearHead.position.set(0, 1.65, 0);
        spearHead.castShadow = true;
        weaponGroup.add(spearHead);
        break;

      case 'mace':
        const maceHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8),
          new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        maceHandle.position.set(0, 0.4, 0);
        maceHandle.castShadow = true;
        weaponGroup.add(maceHandle);

        const maceHead = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 8, 6),
          new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        maceHead.position.set(0, 0.95, 0);
        maceHead.castShadow = true;
        weaponGroup.add(maceHead);

        // Spikes
        for (let i = 0; i < 6; i++) {
          const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.02, 0.1, 4),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
          );
          const angle = (i / 6) * Math.PI * 2;
          spike.position.set(
            Math.cos(angle) * 0.15,
            0.95,
            Math.sin(angle) * 0.15
          );
          spike.rotation.z = angle;
          weaponGroup.add(spike);
        }
        break;

      case 'bow':
        // Bow body
        const bowCurve = new THREE.Mesh(
          new THREE.TorusGeometry(0.8, 0.02, 4, 16, Math.PI),
          new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        bowCurve.rotation.z = Math.PI / 2;
        bowCurve.position.set(0, 0.8, 0);
        bowCurve.castShadow = true;
        weaponGroup.add(bowCurve);

        // Bowstring
        const stringGeometry = new THREE.BufferGeometry();
        const stringVertices = new Float32Array([
          0, 0.1, 0,
          0, 1.5, 0
        ]);
        stringGeometry.setAttribute('position', new THREE.BufferAttribute(stringVertices, 3));
        const bowString = new THREE.Line(
          stringGeometry,
          new THREE.LineBasicMaterial({ color: 0xFFFFFF })
        );
        weaponGroup.add(bowString);
        break;

      default:
        const defaultWeapon = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 1.0, 0.06),
          new THREE.MeshLambertMaterial({ color: parseInt(weapon.color.replace('#', ''), 16) })
        );
        defaultWeapon.position.set(0, 0.5, 0);
        defaultWeapon.castShadow = true;
        weaponGroup.add(defaultWeapon);
        break;
    }

    return weaponGroup;
  }
}