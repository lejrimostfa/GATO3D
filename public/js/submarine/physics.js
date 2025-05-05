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
      maxForwardSpeed: options.maxForwardSpeed || 10, // 10 m/s (environ 20 noeuds, ajustable)
      maxBackwardSpeed: options.maxBackwardSpeed || 10, // Set equal to forward speed
      
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
      
      // Resistance de l'eau - fréquence et intensité du drag
      waterResistance: options.waterResistance || 1.0,  // Valeur par défaut = résistance normale
      
      // Minimum velocity to consider moving
      minEffectiveVelocity: options.minEffectiveVelocity || 0.0001
    };
    
    // Derived values
    this.momentumFactor = 1.0 + (this.config.mass * 0.5);
    
    // Debug flag
    this.debug = false;
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
    // PALIER: If input.palierTargetSpeed is defined, use it as target velocity
    if (typeof input.palierTargetSpeed === 'number') {
      this.targetVelocity = input.palierTargetSpeed;
    } else {
      // Fallback: Calculate target velocity based on input
      this._updateTargetVelocity(input);
    }
    
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
    // Détection des changements de direction (avant vers arrière ou inversement)
    const directionChangeDetected = 
      (this.lastInput.forward && input.backward) || 
      (this.lastInput.backward && input.forward);
    
    // Stocker l'entrée actuelle pour comparaison à la trame suivante
    this.lastInput = { ...input };
    
    // Si appui simultané des touches de direction: aller vers l'arrêt
    if (input.forward && input.backward) {
      this.targetVelocity = 0;
      return;
    }
    
    // Déterminer la direction et la vitesse cibles
    if (input.forward) {
      this.targetVelocity = this.config.maxForwardSpeed;
    } else if (input.backward) {
      this.targetVelocity = -this.config.maxBackwardSpeed;
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
      // La masse affecte la décélération - plus le sous-marin est lourd, plus il met du temps à s'arrêter
      // La résistance de l'eau augmente le facteur de freinage
      // Réduction significative du facteur de freinage pour un arrêt plus progressif
      const dragFactor = (0.3 * Math.pow(this.config.waterResistance, 2)) / this.momentumFactor;
      
      // Réduire encore plus la décélération quand la vitesse est déjà faible
      const velocityRatio = Math.abs(this.velocity / this.config.maxForwardSpeed);
      const slowdownFactor = Math.max(0.2, velocityRatio); // Plus lent à basse vitesse
      
      acceleration = (this.config.dragDeceleration * dragFactor * slowdownFactor) * Math.sign(velocityDiff);
    } else if (velocityDiff > 0) {
      // Accélération vers l'avant (ou décélération depuis l'arrière)
      const progressToMax = Math.abs(this.velocity / this.config.maxForwardSpeed);
      let accelerationFactor;
      
      if (progressToMax < 0.2) {
        accelerationFactor = 0.9; // Up from 0.6
      } else if (progressToMax < 0.7) {
        accelerationFactor = 1.0;
      } else {
        accelerationFactor = 0.85 * (1 - (progressToMax - 0.7) / 0.3); // Up from 0.7
      }
      
      // Résistance de l'eau basée sur la vitesse actuelle
      // Formule: accélération = accélération_base * (1 - (vitesse_actuelle/vitesse_max)^2 * facteur_drag)
      // Où facteur_drag dépend de la résistance de l'eau configurée
      
      // 1. Calculer le ratio vitesse actuelle / vitesse max (entre 0 et 1)
      const velocityRatio = Math.abs(this.velocity / this.config.maxForwardSpeed);
      
      // 2. Facteur de résistance qui dépend du slider (résistance de l'eau)
      // Lorsque waterResistance = 1.0, le facteur est 0.8 (résistance normale)
      // Lorsque waterResistance = 0.1, le facteur est 0.2 (résistance faible)
      // Lorsque waterResistance = 5.0, le facteur est 0.98 (résistance très élevée)
      const resistanceFactor = 1.0 - Math.exp(-this.config.waterResistance);
      
      // 3. Réduction de l'accélération basée sur la vitesse et la résistance
      // Formule: 1 - (vitesse/vitesse_max)^2 * facteur_resistance
      // Résultat: plus on va vite et plus la résistance est élevée, plus l'accélération diminue
      const dragMultiplier = 1.0 - (Math.pow(velocityRatio, 2) * resistanceFactor);
      
      // 4. Application de la masse et du drag sur l'accélération de base
      acceleration = (this.config.forwardAcceleration * accelerationFactor * dragMultiplier) / this.momentumFactor;
      
      if (this.debug) {
        // console.log(`[PHYSICS] V_ratio: ${velocityRatio.toFixed(2)}, R_factor: ${resistanceFactor.toFixed(2)}, Drag_mult: ${dragMultiplier.toFixed(2)}`);
      }
      
      // Boost de réponse rapide - ajoute un boost immédiat basé sur le changement d'entrée
      if (Math.abs(this.velocity) < 0.1 * this.config.maxForwardSpeed) {
        // Les sous-marins plus légers ont une meilleure réactivité au démarrage
        // La résistance de l'eau réduit ce boost
        const massBoostFactor = 3.0 / (Math.sqrt(this.momentumFactor) * Math.sqrt(this.config.waterResistance));
        acceleration *= massBoostFactor; 
      }
    } else {
      // Accélération vers l'arrière (ou décélération depuis l'avant)
      const progressToMax = Math.abs(this.velocity / this.config.maxBackwardSpeed);
      let accelerationFactor;
      
      if (progressToMax < 0.2) {
        accelerationFactor = 0.9; // Up from 0.6
      } else if (progressToMax < 0.7) {
        accelerationFactor = 1.0;
      } else {
        accelerationFactor = 0.85 * (1 - (progressToMax - 0.7) / 0.3); // Up from 0.7
      }
      
      // Appliquer exactement la même formule de résistance qu'en marche avant,
      // pour assurer un comportement cohérent
      
      // 1. Calculer le ratio vitesse actuelle / vitesse max
      const velocityRatio = Math.abs(this.velocity / this.config.maxBackwardSpeed);
      
      // 2. Facteur de résistance basé sur le slider
      const resistanceFactor = 1.0 - Math.exp(-this.config.waterResistance);
      
      // 3. Calcul du multiplicateur de drag
      const dragMultiplier = 1.0 - (Math.pow(velocityRatio, 2) * resistanceFactor);
      
      // 4. Application à l'accélération arrière
      acceleration = (-this.config.backwardAcceleration * accelerationFactor * dragMultiplier) / this.momentumFactor;
      
      if (this.debug) {
        // console.log(`[PHYSICS] Backward - V_ratio: ${velocityRatio.toFixed(2)}, Drag_mult: ${dragMultiplier.toFixed(2)}`);
      }
      
      // Boost de réponse rapide - ajoute un boost immédiat basé sur le changement d'entrée
      if (Math.abs(this.velocity) < 0.1 * this.config.maxBackwardSpeed) {
        // Les sous-marins plus légers ont une meilleure réactivité au démarrage
        // La résistance de l'eau réduit ce boost
        const massBoostFactor = 3.0 / (Math.sqrt(this.momentumFactor) * Math.sqrt(this.config.waterResistance));
        acceleration *= massBoostFactor;
      }
    }
    
    // ******************************************************************
    // NOUVELLE APPROCHE POUR LE DRAG - MODIFICATION DE L'ACCÉLÉRATION PLUTÔT QUE FORCE OPPOSÉE
    // ******************************************************************
    // Au lieu d'ajouter une force opposée, on va diminuer l'accélération progressivement 
    // en fonction de la vitesse et du coefficient de résistance
    //
    // Plus la résistance est élevée, plus l'accélération diminue rapidement avec la vitesse
    // ******************************************************************
    
    // On applique le drag (résistance de l'eau) avant d'appliquer l'accélération
    // pour modifier directement la façon dont le sous-marin accélère
    
    // Ne rien faire ici, le drag est maintenant appliqué dans les fonctions d'accélération
    
    // Apply acceleration (with a small boost for more immediate response)
    // Réduire encore plus le boost d'accélération pour les sous-marins lourds et en eau résistante
    // Version amplifiée pour rendre l'effet beaucoup plus visible
    const responseMultiplier = 1.5 / (Math.sqrt(this.momentumFactor) * Math.pow(this.config.waterResistance, 1.5));
    this.velocity += acceleration * responseMultiplier;
    
    if (this.debug) {
      // console.log(`[PHYSICS] Response multiplier: ${responseMultiplier.toFixed(4)} at resistance ${this.config.waterResistance.toFixed(2)}`);
    }
    
    // Ensure we don't overshoot target
    if ((velocityDiff > 0 && this.velocity > this.targetVelocity) ||
        (velocityDiff < 0 && this.velocity < this.targetVelocity)) {
      this.velocity = this.targetVelocity;
    }
    
    // Log debug info if enabled
    if (this.debug) {
      // console.log(`Velocity: ${this.velocity.toFixed(4)}, Target: ${this.targetVelocity.toFixed(4)}, ` + 
      //           `Mass: ${this.momentumFactor.toFixed(2)}, Water Resistance: ${this.config.waterResistance.toFixed(2)}`);
    }
  }
  
  /**
   * Calculate rotation based on input and current state
   * @private
   */
  _calculateRotation(input) {
    let rotation = 0;
    
    // Base rotation on inputs
    // La masse du sous-marin et la résistance de l'eau affectent le taux de rotation de base
    // Version amplifiée pour rendre l'effet beaucoup plus visible
    const rotationFactor = 1.0 / (Math.sqrt(this.momentumFactor) * this.config.waterResistance);
    if (input.left) rotation += this.config.rotationSpeed * rotationFactor;
    if (input.right) rotation -= this.config.rotationSpeed * rotationFactor;
    
    if (this.debug) {
      // console.log(`[PHYSICS] Rotation factor: ${rotationFactor.toFixed(4)} at resistance ${this.config.waterResistance.toFixed(2)}`);
    }
    
    // Adjust rotation based on current speed
    // Les sous-marins tournent plus difficilement à haute vitesse
    if (rotation !== 0 && Math.abs(this.velocity) > 0.01) {
      // La masse et la résistance de l'eau réduisent la capacité à tourner à haute vitesse
      const massSpeedEffect = 0.7 * Math.min(1.0, Math.sqrt(this.momentumFactor * this.config.waterResistance) * 0.5);
      let speedFactor = 1.0 - (Math.abs(this.velocity) / this.config.maxForwardSpeed) * massSpeedEffect;
      speedFactor = Math.max(0.35, speedFactor); // Ne descend jamais sous 0.35 pour garder du contrôle
      rotation *= speedFactor;
      
      // Appliquer une résistance hydrodynamique supplémentaire proportionnelle à la vitesse
      // Plus on va vite, plus les virages sont larges et difficiles (mais moins qu'avant)
      let speedResistance = 1.0 - Math.min(0.35, Math.pow(Math.abs(this.velocity) / this.config.maxForwardSpeed, 2) * this.config.waterResistance * 0.25);
      speedResistance = Math.max(0.9, speedResistance); // Ne descend jamais sous 0.9 (était 0.35)
      rotation *= speedResistance;
      
      // If moving backward, turning behaves differently (reverse steering)
      if (this.velocity < 0) {
        // La masse et la résistance de l'eau impactent la maniabilité en marche arrière
        const reverseFactor = this.config.rotationDamping * Math.min(1.8, this.momentumFactor * this.config.waterResistance * 0.6);
        rotation *= reverseFactor;
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

// Exposer l'instance physique au niveau global pour un accès facile depuis d'autres modules
// C'est important pour garantir que tous les modules interagissent avec la même instance
window.submarinePhysics = defaultPhysics;

/**
 * Current velocity state
 * (for backward compatibility - use the class for new code)
 */
export let currentVelocity = 0;
export let maxSpeed = 1.0;

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
