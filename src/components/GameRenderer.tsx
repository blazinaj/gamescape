import * as THREE from 'three';

export class GameRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public domElement: HTMLCanvasElement;

  constructor() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200); // Add fog for distant terrain

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      500 // Increased for larger world
    );

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.domElement = this.renderer.domElement;

    // Set initial camera position
    this.camera.position.set(0, 5, 10);
  }

  setupScene(): void {
    // Add lighting
    this.addLighting();
    
    // Add base ground (will be supplemented by generated tiles)
    this.addBaseGround();
    
    // Add sky elements
    this.addSkyElements();
  }

  private addLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.bias = -0.0001;
    this.scene.add(directionalLight);

    // Add hemisphere light for more natural lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.6);
    this.scene.add(hemisphereLight);
  }

  private addBaseGround(): void {
    // Large base ground plane at y: 0 (visual ground level)
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x10B981,
      transparent: true,
      opacity: 1.0 // Fully opaque to match tile grounds
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0; // Visual ground at y: 0
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle grid for reference (much larger scale)
    const gridHelper = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.05;
    gridHelper.material.transparent = true;
    gridHelper.position.y = 0.01; // Just above visual ground
    this.scene.add(gridHelper);
  }

  private addSkyElements(): void {
    // Add some distant mountains on the horizon
    for (let i = 0; i < 8; i++) {
      const mountainGeometry = new THREE.ConeGeometry(
        10 + Math.random() * 15, 
        20 + Math.random() * 30, 
        6
      );
      const mountainMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4A5568,
        transparent: true,
        opacity: 0.6
      });
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
      
      const angle = (i / 8) * Math.PI * 2;
      const distance = 150 + Math.random() * 50;
      mountain.position.x = Math.cos(angle) * distance;
      mountain.position.z = Math.sin(angle) * distance;
      mountain.position.y = 10;
      
      this.scene.add(mountain);
    }

    // Add some clouds
    for (let i = 0; i < 12; i++) {
      const cloudGeometry = new THREE.SphereGeometry(8 + Math.random() * 5, 8, 6);
      const cloudMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.8
      });
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      
      cloud.position.x = (Math.random() - 0.5) * 300;
      cloud.position.y = 40 + Math.random() * 20;
      cloud.position.z = (Math.random() - 0.5) * 300;
      
      cloud.scale.set(
        1 + Math.random() * 0.5,
        0.6 + Math.random() * 0.4,
        1 + Math.random() * 0.5
      );
      
      this.scene.add(cloud);
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}