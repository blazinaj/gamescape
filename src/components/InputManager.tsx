import { InputState } from './Character';

export class InputManager {
  private keys: { [key: string]: boolean } = {};
  private mouseMovement: { x: number; y: number } = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;
  private interactPressed: boolean = false;
  private leftClickPressed: boolean = false;
  private rightClickPressed: boolean = false;
  private uiActive: boolean = false;
  private gameContainer: HTMLElement | null = null;

  constructor() {
    this.setupEventListeners();
  }

  // Method to set the game container element for targeted event handling
  setGameContainer(container: HTMLElement): void {
    this.gameContainer = container;
  }

  private setupEventListeners(): void {
    // Keyboard events - these can stay on document since we handle UI filtering
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Mouse events - initially attach to document, but we'll be more careful about handling
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
    
    // Use a more targeted click listener
    document.addEventListener('click', this.handleClick.bind(this), true); // Use capture phase
    
    // Prevent context menu on right click only when pointer is locked
    document.addEventListener('contextmenu', (e) => {
      if (this.isPointerLocked) {
        e.preventDefault();
      }
    });

    // Release pointer lock when escape is pressed
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isPointerLocked) {
        document.exitPointerLock();
      }
    });
  }

  private isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    if (!target) return false;

    // Check if the target is an input element where the user might be typing
    const typingElements = ['INPUT', 'TEXTAREA', 'SELECT'];
    const isTypingElement = typingElements.includes(target.tagName);
    
    // Also check for contenteditable elements
    const isContentEditable = target.contentEditable === 'true';
    
    // Check if target is inside a form or has input-related classes/attributes
    const isInForm = target.closest('form') !== null;
    const hasInputRole = target.getAttribute('role') === 'textbox';
    
    return isTypingElement || isContentEditable || (isInForm && hasInputRole);
  }

  private isUIElement(target: HTMLElement): boolean {
    // Check if the target is a UI element that should handle its own clicks
    
    // Check for specific UI component markers
    const uiSelectors = [
      'button',
      'input',
      'textarea',
      'select',
      'a',
      '[role="button"]',
      '[role="textbox"]',
      '[role="dialog"]',
      '[role="menu"]',
      '.character-customizer',
      '.inventory-ui',
      '.conversation-ui',
      '.save-ui',
      '.log-viewer'
    ];

    // Check if target matches any UI selectors
    for (const selector of uiSelectors) {
      if (target.matches?.(selector) || target.closest?.(selector)) {
        return true;
      }
    }

    // Check if target is inside a fixed positioned overlay (like inventory)
    const fixedParent = target.closest('.fixed');
    if (fixedParent) {
      return true;
    }

    // Check for common UI class patterns
    const uiClassPatterns = [
      /^bg-/, // Tailwind background classes often used for UI
      /^hover:/, // Hover states usually indicate interactive UI
      /modal/i,
      /dialog/i,
      /menu/i,
      /button/i,
      /input/i,
      /form/i
    ];

    const className = target.className || '';
    for (const pattern of uiClassPatterns) {
      if (pattern.test(className)) {
        return true;
      }
    }

    return false;
  }

  private isGameCanvas(target: HTMLElement): boolean {
    // Check if the click target is the game canvas or its container
    return (
      target.tagName === 'CANVAS' ||
      target.closest('canvas') !== null ||
      (this.gameContainer && this.gameContainer.contains(target)) ||
      target.id === 'root' ||
      target.closest('#root > div > div:first-child') !== null
    );
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // If user is typing in an input field, don't capture keys for game
    if (this.isTypingInInput(event)) {
      return;
    }

    // Only capture game input if UI is not active OR it's the interact key
    if (!this.uiActive || event.code.toLowerCase() === 'keye') {
      // Handle interact key (E) - works even with UI active for conversation triggers
      if (event.code.toLowerCase() === 'keye') {
        this.interactPressed = true;
      }
      
      // Only capture movement keys when UI is not active
      if (!this.uiActive) {
        this.keys[event.code.toLowerCase()] = true;
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Always clear key states on keyup to prevent stuck keys
    this.keys[event.code.toLowerCase()] = false;
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // If UI is active, don't interfere with UI clicks at all
    if (this.uiActive) {
      return;
    }

    // Check if this is a UI element click
    if (this.isUIElement(target)) {
      // Let UI elements handle their own clicks
      return;
    }

    // Only request pointer lock for game canvas clicks when not already locked
    if (!this.isPointerLocked && this.isGameCanvas(target)) {
      // Small delay to ensure any UI state changes have been processed
      setTimeout(() => {
        // Double-check UI state hasn't changed
        if (!this.uiActive) {
          document.body.requestPointerLock();
        }
      }, 10);
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // CRITICAL: Don't interfere with UI mouse events when UI is active
    if (this.uiActive) {
      return;
    }

    // Don't interfere with UI element clicks
    if (this.isUIElement(target)) {
      return;
    }

    // Handle mouse clicks for combat
    if (event.button === 0) { // Left click
      if (this.isPointerLocked) {
        console.log('🖱️ Left mouse down detected with pointer locked - tool action!');
        this.leftClickPressed = true;
        event.preventDefault();
        event.stopPropagation();
      } else if (this.isGameCanvas(target)) {
        console.log('🖱️ Left mouse down detected on game canvas without pointer lock');
        this.leftClickPressed = true;
        event.preventDefault();
        event.stopPropagation();
      }
    } else if (event.button === 2) { // Right click
      if (this.isPointerLocked) {
        console.log('🖱️ Right mouse down detected with pointer locked - weapon attack!');
        this.rightClickPressed = true;
        event.preventDefault();
        event.stopPropagation();
      } else if (this.isGameCanvas(target)) {
        console.log('🖱️ Right mouse down detected on game canvas without pointer lock');
        this.rightClickPressed = true;
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // If UI is active, don't interfere with UI mouse events
    if (this.uiActive) {
      return;
    }

    if (event.button === 0) { // Left click
      console.log('🖱️ Left mouse up detected');
      this.leftClickPressed = false;
    } else if (event.button === 2) { // Right click
      console.log('🖱️ Right mouse up detected');
      this.rightClickPressed = false;
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    // Only capture mouse movement for camera when pointer is locked and no UI is active
    if (this.isPointerLocked && !this.uiActive) {
      this.mouseMovement.x = event.movementX || 0;
      this.mouseMovement.y = event.movementY || 0;
    }
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === document.body;
    
    // Clear click states when pointer lock changes to prevent stuck clicks
    if (!this.isPointerLocked) {
      this.leftClickPressed = false;
      this.rightClickPressed = false;
      console.log('🖱️ Pointer lock released - clearing click states');
    } else {
      console.log('🖱️ Pointer lock acquired');
    }
    
    // If pointer lock is lost and UI is active, that's expected
    if (!this.isPointerLocked && this.uiActive) {
      console.log('🖱️ Pointer lock released due to UI interaction');
    }
  }

  // Method to inform the input manager about UI state
  setUIActive(active: boolean): void {
    const wasActive = this.uiActive;
    this.uiActive = active;
    
    // If UI becomes active and pointer is locked, release it immediately
    if (active && this.isPointerLocked) {
      document.exitPointerLock();
      console.log('🖱️ Released pointer lock due to UI activation');
    }
    
    // Clear any pending inputs when UI state changes to prevent sticky keys/clicks
    if (active !== wasActive) {
      this.clearInputs();
    }
  }

  private clearInputs(): void {
    // Clear movement keys when switching UI state
    Object.keys(this.keys).forEach(key => {
      this.keys[key] = false;
    });
    
    // Clear mouse inputs
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
    this.leftClickPressed = false;
    this.rightClickPressed = false;
    this.interactPressed = false;
  }

  getInputState(): InputState & { interact: boolean } {
    const inputState = {
      forward: !this.uiActive && (this.keys['keyw'] || this.keys['arrowup'] || false),
      backward: !this.uiActive && (this.keys['keys'] || this.keys['arrowdown'] || false),
      left: !this.uiActive && (this.keys['keya'] || this.keys['arrowleft'] || false),
      right: !this.uiActive && (this.keys['keyd'] || this.keys['arrowright'] || false),
      run: !this.uiActive && (this.keys['shiftleft'] || this.keys['shiftright'] || false),
      mouseX: !this.uiActive ? this.mouseMovement.x * 0.008 : 0,
      mouseY: !this.uiActive ? this.mouseMovement.y * 0.008 : 0,
      interact: this.interactPressed,
      leftClick: !this.uiActive && this.leftClickPressed,
      rightClick: !this.uiActive && this.rightClickPressed
    };

    // Reset one-time events after reading
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
    this.interactPressed = false;
    // NOTE: click states are reset in handleMouseUp, not here

    return inputState;
  }

  isPointerLockActive(): boolean {
    return this.isPointerLocked;
  }

  isUICurrentlyActive(): boolean {
    return this.uiActive;
  }

  dispose(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('click', this.handleClick.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }
}