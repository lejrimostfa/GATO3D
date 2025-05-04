// submarine/physics.js
// Physics-based movement system for submarine in GATO3D

/**
 * SubmarinePhysics - A modular physics system for realistic submarine movement
 */
export class SubmarinePhysics {
  constructor(options = {}) {
    // Current state
    this.velocity = 0;           // Current velocity (positive or negative)
    this.targetVelocity = 0;     // Target velocity based on input
    this.lastInput = { forward: false, backward: false }; // Track previous input state for direction changes
    
    // Configuration
    this.config = {
      // Maximum speeds - much lower default for more realistic submarine movement
      maxForwardSpeed: options.maxForwardSpeed || 0.1, // Equivalent to 10 knots
      maxBackwardSpeed: options.maxBackwardSpeed || 0.1, // Set equal to forward speed
      
      // Acceleration values (per frame) - much faster now
      forwardAcceleration: options.forwardAcceleration || 0.005,  // 6.25x faster
      backwardAcceleration: options.backwardAcceleration || 0.006, // 6x faster
      
      // Deceleration when no input (drag) - faster stop
      dragDeceleration: options.dragDeceleration || 0.003,  // 6x faster
      
      // Turning parameters - more responsive
      rotationSpeed: options.rotationSpeed || 0.005,  // Half as fast turning
      rotationDamping: options.rotationDamping || 2.8, // Higher damping for heavier feel
      
      // Mass and inertia simulation - much lighter
      mass: options.mass || 0.3,  // Lower mass = less inertia
      
      // Minimum velocity to consider moving
      minEffectiveVelocity: options.minEffectiveVelocity || 0.0001
    };
    
    // Derived values
    this.momentumFactor = 1.0 + (this.config.mass * 0.5);
    
    // Debug mode
    this.debug = options.debug || false;
  }
  
  /**
   * Set maximum speed limits
   * @param {number} forward - Maximum forward speed
   * @param {number} backward - Maximum backward speed
   */
  setMaxSpeeds(forward, backward = null) {
    this.config.maxForwardSpeed = forward;
    // Always make backward speed equal to forward speed for consistent deceleration
    this.config.maxBackwardSpeed = forward;
  }
  
  /**
   * Set submarine rotation parameters
   * @param {number} speed - Rotation speed (how fast the submarine turns)
   * @param {number} damping - Rotation damping (higher = more resistance)
   */
  setRotationParams(speed, damping = null) {
    if (speed !== null && speed !== undefined) {
      this.config.rotationSpeed = speed;
    }
    
    if (damping !== null && damping !== undefined) {
      this.config.rotationDamping = damping;
    }
  }
  
  /**
   * Update physics based on input
   * @param {Object} input - Input state
   * @param {boolean} input.forward - Forward input active
   * @param {boolean} input.backward - Backward input active
   * @param {boolean} input.left - Left turn input active
   * @param {boolean} input.right - Right turn input active
   * @returns {Object} - Movement values to apply
   */
  update(input) {
    // Calculate target velocity based on input
    this._updateTargetVelocity(input);
    
    // Apply inertia and physics to current velocity
    this._updateCurrentVelocity();
    
    // Calculate rotation based on input and current velocity
    const rotation = this._calculateRotation(input);
    
    // Return movement values
    return {
      velocity: this.velocity,
      rotation: rotation,
      speed: Math.abs(this.velocity),
      // Normalized speed (0-1) for UI display
      normalizedSpeed: Math.abs(this.velocity) / this.config.maxForwardSpeed,
      direction: this.velocity < 0 ? 'backward' : 'forward'
    };
  }
  
  /**
   * Update target velocity based on input
   * @private
   */
  _updateTargetVelocity(input) {
    // Detect direction changes (forward to backward or vice versa)
    const directionChangeDetected = 
      (this.lastInput.forward && input.backward) || 
      (this.lastInput.backward && input.forward);
    
    // Store current input for next frame comparison
    this.lastInput = { ...input };
    
    if (input.forward) {
      // Want to go forward
      this.targetVelocity = this.config.maxForwardSpeed;
      
      // If switching from backward to forward, first help slow down
      if (this.velocity < 0 && directionChangeDetected) {
        // Instead of immediately targeting max forward speed,
        // first target zero to help decelerate
        this.targetVelocity = 0;
      }
    } else if (input.backward) {
      // Want to go backward
      this.targetVelocity = -this.config.maxBackwardSpeed;
      
      // If switching from forward to backward, first help slow down
      if (this.velocity > 0 && directionChangeDetected) {
        // Instead of immediately targeting max backward speed,
        // first target zero to help decelerate
        this.targetVelocity = 0;
      }
    } else {
      // No input, gradually slow down
      this.targetVelocity = 0;
    }
  }
  
  /**
   * Update current velocity with inertia simulation
   * @private
   */
  _updateCurrentVelocity() {
    // Calculate velocity difference
    const velocityDiff = this.targetVelocity - this.velocity;
    
    if (Math.abs(velocityDiff) < this.config.minEffectiveVelocity) {
      // Close enough, just set it to target
      this.velocity = this.targetVelocity;
      return;
    }
    
    // Calculate acceleration based on movement direction and current state
    let acceleration;
    
    if (this.targetVelocity === 0) {
      // Coasting to stop - apply drag
      // Much simpler formula with less inertia
      const dragFactor = 1.2; // Reduced from previous complex calculation
      
      acceleration = (this.config.dragDeceleration * dragFactor) * Math.sign(velocityDiff);
    } else if (velocityDiff > 0) {
      // Accelerating forward (or decelerating from backward)
      // Faster initial response curve with less inertia
      const progressToMax = Math.abs(this.velocity / this.config.maxForwardSpeed);
      let accelerationFactor;
      
      if (progressToMax < 0.2) {
        // Initial acceleration is now much faster (easy to overcome inertia)
        accelerationFactor = 0.9; // Up from 0.5
      } else if (progressToMax < 0.7) {
        // Mid-range is even faster
        accelerationFactor = 1.0;
      } else {
        // Approaching max speed - less diminishing returns
        accelerationFactor = 0.85 * (1 - (progressToMax - 0.7) / 0.3); // Up from 0.7
      }
      
      acceleration = this.config.forwardAcceleration * accelerationFactor;
      
      // Fast response boost - add an immediate boost based on input change
      if (Math.abs(this.velocity) < 0.1 * this.config.maxForwardSpeed) {
        acceleration *= 3.0; // Triple acceleration from standstill
      }
    } else {
      // Accelerating backward (or decelerating from forward)
      // Similar faster curve for backward acceleration
      const progressToMax = Math.abs(this.velocity / this.config.maxBackwardSpeed);
      let accelerationFactor;
      
      if (progressToMax < 0.2) {
        accelerationFactor = 0.9; // Up from 0.6
      } else if (progressToMax < 0.7) {
        accelerationFactor = 1.0;
      } else {
        accelerationFactor = 0.85 * (1 - (progressToMax - 0.7) / 0.3); // Up from 0.7
      }
      
      acceleration = -this.config.backwardAcceleration * accelerationFactor;
      
      // Fast response boost - add an immediate boost based on input change
      if (Math.abs(this.velocity) < 0.1 * this.config.maxBackwardSpeed) {
        acceleration *= 3.0; // Triple acceleration from standstill
      }
    }
    
    // Apply acceleration (with a small boost for more immediate response)
    this.velocity += acceleration * 1.5;
    
    // Ensure we don't overshoot target
    if ((velocityDiff > 0 && this.velocity > this.targetVelocity) ||
        (velocityDiff < 0 && this.velocity < this.targetVelocity)) {
      this.velocity = this.targetVelocity;
    }
    
    // Log debug info if enabled
    if (this.debug) {
      console.log(`Velocity: ${this.velocity.toFixed(4)}, Target: ${this.targetVelocity.toFixed(4)}`);
    }
  }
  
  /**
   * Calculate rotation based on input and current state
   * @private
   */
  _calculateRotation(input) {
    let rotation = 0;
    
    // Base rotation on inputs
    if (input.left) rotation += this.config.rotationSpeed;
    if (input.right) rotation -= this.config.rotationSpeed;
    
    // Adjust rotation based on current speed
    // Submarines rotate more slowly at higher speeds
    if (rotation !== 0 && Math.abs(this.velocity) > 0.01) {
      const speedFactor = 1.0 - (Math.abs(this.velocity) / this.config.maxForwardSpeed) * 0.7;
      rotation *= speedFactor;
      
      // If moving backward, turning behaves differently (reverse steering)
      if (this.velocity < 0) {
        rotation *= this.config.rotationDamping;
      }
    }
    
    return rotation;
  }
}

/**
 * Create a default submarine physics instance
 * @param {Object} options - Override default settings
 * @returns {SubmarinePhysics} - A new submarine physics instance
 */
export function createSubmarinePhysics(options = {}) {
  return new SubmarinePhysics(options);
}

/**
 * Default physics instance for easy access
 */
export const defaultPhysics = new SubmarinePhysics();

/**
 * Current velocity state
 * (for backward compatibility - use the class for new code)
 */
export let currentVelocity = 0;
export let maxSpeed = 0.5;

// Update the global variables when physics updates
function syncPhysicsToGlobals() {
  // Get the raw velocity value from the physics engine
  const rawVelocity = defaultPhysics.velocity;
  
  // Convert to absolute value for speedometer (we just want speed magnitude)
  const absVelocity = Math.abs(rawVelocity);
  
  // Normalize to 0-1 range based on max forward speed
  // This is what the speedometer expects
  currentVelocity = absVelocity / defaultPhysics.config.maxForwardSpeed;
  
  // Clamp to valid range to prevent any issues
  currentVelocity = Math.min(1.0, Math.max(0.0, currentVelocity));
}

// Call this after each physics update
export function updatePhysics(input) {
  const movement = defaultPhysics.update(input);
  syncPhysicsToGlobals();
  return movement;
}

/**
 * Legacy setter for maximum speed
 * @param {number} speed - The maximum speed value
 */
export function setMaxSpeed(speed) {
  maxSpeed = speed;
  defaultPhysics.setMaxSpeeds(speed);
}
