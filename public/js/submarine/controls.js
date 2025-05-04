// submarine/controls.js
// Contrôles et mouvements du sous-marin pour GATO3D

// Import the modular physics system
import { defaultPhysics, updatePhysics, currentVelocity, maxSpeed, setMaxSpeed } from './physics.js';
// Import keys from centralized input manager
import { keys } from '../input/inputManager.js';

// Export core values for backward compatibility
export { currentVelocity, maxSpeed, setMaxSpeed };

/**
 * Set rotation parameters for the submarine
 * @param {number} speed - Rotation speed (radians per frame)
 * @param {number} damping - Optional damping factor
 */
export function updateRotationParams(speed, damping = null) {
  // Update the physics system
  defaultPhysics.setRotationParams(speed, damping);
  
  // Store values globally for access by other systems
  window.submarineRotationSpeed = speed;
  if (damping !== null) window.submarineRotationDamping = damping;
  
  console.log(`[SUBMARINE] Updated rotation params - speed: ${speed}, damping: ${damping || 'unchanged'}`);
}

/**
 * Update submarine mass/inertia parameter
 * @param {number} mass - Submarine mass value (affects momentum and handling)
 */
export function updateSubmarineMass(mass) {
  // Update the physics system mass directly
  if (defaultPhysics && defaultPhysics.config) {
    defaultPhysics.config.mass = mass;
    
    // Recalculate momentum factor
    defaultPhysics.momentumFactor = 1.0 + (mass * 0.5);
    
    // Store value globally
    window.submarineMass = mass;
    
    console.log(`[SUBMARINE] Updated mass to ${mass} (momentum factor: ${defaultPhysics.momentumFactor.toFixed(2)})`);
  } else {
    console.warn('[SUBMARINE] Cannot update mass: physics system not initialized');
  }
}

/**
 * Update the maximum submarine speed and pass it to the physics system
 * @param {number} speed - New maximum speed
 */
export function updateMaxSpeed(speed) {
  setMaxSpeed(speed);
}

/**
 * Met à jour la position et la rotation du sous-marin en fonction des entrées clavier.
 * @param {THREE.Object3D} playerSubmarine
 */
export function updatePlayerSubmarine(playerSubmarine) {
  if (!playerSubmarine) return;

  // Core submarine settings
  const verticalSpeed = 0.4;
  const surfaceY = 20;
  const maxDepth = 200;
  
  // Process key inputs from the centralized input manager with special brake handling
  const forwardPressed = Boolean(keys['z'] || keys['arrowup']);
  const backwardPressed = Boolean(keys['s'] || keys['arrowdown']);
  const upPressed = Boolean(keys['a']);
  const downPressed = Boolean(keys['w']);
  
  // Get the actual velocity percentage for decision making
  const currentVelocityPct = Math.abs(currentVelocity);
  
  // Create effective controls that implement special braking mechanics
  let effectiveForward = forwardPressed;
  let effectiveBackward = backwardPressed;
  
  // DIVE BRAKE: When pressing down (W) at high speeds, disable forward input to allow deceleration
  if (downPressed && currentVelocityPct > 0.5) {
    effectiveForward = false;
    console.log('[CONTROLS] Dive brake activated - forward disabled');
  }
  
  // REVERSE BRAKE: When at high forward speeds, pressing backward (S) acts as a pure brake
  // rather than trying to go backward (which can cause acceleration issues)
  if (backwardPressed && currentVelocityPct > 0.5) {
    // Apply special braking by disabling both forward and backward inputs
    // This lets natural drag slow the submarine down much faster
    effectiveForward = false;
    effectiveBackward = false;
    console.log('[CONTROLS] Reverse brake activated - natural drag increased');
  }
  
  // Create the input object for the physics system with our modified inputs
  const input = {
    forward: effectiveForward,
    backward: effectiveBackward,
    left: Boolean(keys['q'] || keys['arrowleft']),
    right: Boolean(keys['d'] || keys['arrowright']),
    up: upPressed,
    down: downPressed
  };
  
  // Update physics and get movement parameters
  // Using the shared physics instance to ensure currentVelocity is updated
  const movement = updatePhysics(input);
  
  // Apply movements to the submarine model
  if (movement.velocity !== 0) {
    // Move forward/backward based on velocity
    playerSubmarine.translateZ(-movement.velocity);
  }
  
  // Apply rotation
  if (movement.rotation !== 0) {
    playerSubmarine.rotation.y += movement.rotation;
  }

  // Track vertical movement for velocity calculation
  let verticalMovement = 0;
  
  // Vertical Control (A = up, W = down)
  if (playerSubmarine.children && playerSubmarine.children[0]) {
    const sub = playerSubmarine.children[0];
    
    // Calculate vertical speed based on current max speed
    // This ensures vertical movement scales appropriately with max speed setting
    const scaledVerticalSpeed = Math.min(verticalSpeed, maxSpeed * 0.6);
    
    // Apply vertical movement
    if (input.up) {
      sub.position.y += scaledVerticalSpeed;
      verticalMovement = scaledVerticalSpeed;
    }
    if (input.down) {
      sub.position.y -= scaledVerticalSpeed;
      verticalMovement = -scaledVerticalSpeed;
    }
    
    // Depth limits
    if (sub.position.y + playerSubmarine.position.y > surfaceY) {
      sub.position.y = surfaceY - playerSubmarine.position.y;
      verticalMovement = 0; // No movement at surface
    }
    if (sub.position.y + playerSubmarine.position.y < surfaceY - maxDepth) {
      sub.position.y = (surfaceY - maxDepth) - playerSubmarine.position.y;
      verticalMovement = 0; // No movement at max depth
    }
  }
  
  // Calculate velocity considering direction and intent
  let combinedVelocity;
  
  // First, get the base velocity from forward/backward movement
  const horizontalComponent = Math.abs(movement.velocity / maxSpeed);
  
  // Forced deceleration mode - always apply strong deceleration for down button
  // regardless of current speed
  if (verticalMovement < 0) {
    // Calculate vertical component as percentage of max speed
    const verticalComponent = Math.abs(verticalMovement / maxSpeed);
    
    // Apply a MUCH stronger deceleration factor, increasing with speed
    // Higher speeds should have even greater deceleration when pressing down
    const baseFactor = 0.4; // Increased from 0.2 for stronger effect
    const speedBoost = horizontalComponent * 0.5; // Higher speeds increase deceleration 
    const decelerationFactor = baseFactor * verticalComponent * (1 + speedBoost);
    
    // Calculate new velocity - ensuring we never go below zero
    combinedVelocity = Math.max(0, horizontalComponent - decelerationFactor);
    
    // Force velocity to be no more than 80% of what it was if we're above 50% max speed
    // This ensures we always feel a significant slowdown when pressing down
    if (horizontalComponent > 0.5) {
      combinedVelocity = Math.min(combinedVelocity, horizontalComponent * 0.8);
    }
    
    console.log(`[CONTROLS] Forced diving brake: ${horizontalComponent.toFixed(3)} -> ${combinedVelocity.toFixed(3)}`);
  } 
  // Upward movement - slight acceleration (unchanged)
  else if (verticalMovement > 0) {
    // Calculate vertical component as percentage of max speed
    const verticalComponent = Math.abs(verticalMovement / maxSpeed);
    
    // Use cosine weighting to make vertical movement less significant at high speeds
    const weight = Math.cos(horizontalComponent * (Math.PI/2));
    const weightedVertical = verticalComponent * weight * 0.3; // Reduced for more natural feeling
    
    // Cap total velocity to prevent exceeding max
    combinedVelocity = Math.min(1.0, horizontalComponent + weightedVertical);
    
    console.log(`[CONTROLS] Ascending: ${combinedVelocity.toFixed(3)} ` +
               `(h: ${horizontalComponent.toFixed(3)}, v: ${weightedVertical.toFixed(3)})`);
  } 
  // No vertical movement
  else {
    combinedVelocity = currentVelocity;
  }
  
  // Return data for external systems like the speedometer
  return {
    velocity: combinedVelocity, // Combined horizontal and vertical velocity
    maxSpeed: maxSpeed,
    // Include full movement data for advanced use
    movement: movement,
    verticalMovement: verticalMovement
  };
}
