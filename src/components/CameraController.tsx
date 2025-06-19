import * as THREE from 'three';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Object3D | null = null;
  private offset: THREE.Vector3;
  private currentPosition: THREE.Vector3;
  private currentLookAt: THREE.Vector3;
  private smoothness: number;
  private lookAtOffset: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    // Over-the-shoulder positioning: slightly to the right, elevated, BEHIND the character
    this.offset = new THREE.Vector3(1.2, 3.5, -5); // Negative Z to position camera behind character
    this.lookAtOffset = new THREE.Vector3(0, 1.5, 0); // Look slightly above character center
    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this.smoothness = 0.15; // Slightly more responsive
  }

  setTarget(target: THREE.Object3D): void {
    this.target = target;
  }

  update(): void {
    if (!this.target) return;

    // Calculate desired camera position relative to character's rotation
    const targetPosition = this.target.position.clone();
    const rotatedOffset = this.offset.clone().applyQuaternion(this.target.quaternion);
    const desiredPosition = targetPosition.clone().add(rotatedOffset);

    // Calculate look-at point (slightly above character center)
    const lookAtPoint = targetPosition.clone().add(this.lookAtOffset);

    // Smooth camera movement with more responsive feel
    this.currentPosition.lerp(desiredPosition, this.smoothness);
    this.currentLookAt.lerp(lookAtPoint, this.smoothness);

    // Apply to camera
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  adjustOffset(x: number, y: number, z: number): void {
    this.offset.set(x, y, z);
  }

  setSmoothness(smoothness: number): void {
    this.smoothness = Math.max(0.01, Math.min(1, smoothness));
  }

  // Method to switch between left and right shoulder
  switchShoulder(): void {
    this.offset.x *= -1;
  }
}