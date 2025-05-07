// submarine/controls.js
// Contrôles et mouvements du sous-marin pour GATO3D

// Import THREE.js pour la détection de collision et les transformations
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// Constantes pour l'inclinaison du sous-marin (en degrés)
const TILT_ANGLE = 15; // Angle d'inclinaison pour tous les mouvements (en degrés) - réduit à 3°
const TILT_SPEED = 0.02; // Vitesse réduite pour une transition plus lente (environ 3-4 secondes)
const TILT_EASING = 0.5; // Coefficient d'atténuation pour effet non linéaire (0.5-0.9)
const PITCH_AMPLITUDE = 1.0; // Amplitude du tangage (en degrés)
const PITCH_SPEED = 0.1; // Vitesse du tangage

// Variables pour suivre l'inclinaison actuelle
let currentPitch = 0; // Inclinaison avant/arrière actuelle pour monter/descendre
let targetPitch = 0; // Inclinaison avant/arrière cible pour monter/descendre
let currentAccelPitch = 0; // Inclinaison avant/arrière actuelle pour accélération/freinage
let targetAccelPitch = 0; // Inclinaison avant/arrière cible pour accélération/freinage
let currentRoll = 0; // Inclinaison gauche/droite actuelle
let targetRoll = 0; // Inclinaison gauche/droite cible
let pitchPhase = 0; // Phase pour le mouvement de tangage
let lastVelocity = 0; // Vitesse précédente pour calculer l'accélération

// Flag pour suivre si les rotations ont été précompilées
let rotationsPrecompiled = false;

// Import the modular physics system
import { defaultPhysics, updatePhysics, currentVelocity, maxSpeed, setMaxSpeed } from './physics.js';

// Import terrain height function
import { getTerrainHeightAt } from '../ocean/terrain.js';

// Import keys from centralized input manager
import { keys } from '../input/inputManager.js';

// --- PALIER SPEED CONTROL ---
import { targetSpeed, targetSpeedStep, clamp, setTargetSpeed, updateSpeedLabel } from './palierSpeed.js';

/**
 * Précompile les calculs de rotation pour éviter le freeze au premier changement d'angle
 * Cette fonction effectue une "rotation à blanc" pour forcer la compilation JIT
 * des fonctions mathématiques et de THREE.js sans affecter l'expérience utilisateur
 */
function precompileRotations() {
  // Créer des valeurs temporaires non-nulles
  const tempTargetPitch = 0.0001;
  const tempTargetRoll = 0.0001;
  
  // Force une première exécution de tous les calculs coûteux
  const dummyPitchDelta = tempTargetPitch - currentPitch;
  const dummyRollDelta = tempTargetRoll - currentRoll;
  
  // Exécute les calculs d'atténuation non linéaire
  const dummyPitchFactor = Math.pow(Math.min(1, Math.abs(dummyPitchDelta) / THREE.MathUtils.degToRad(5)), TILT_EASING);
  const dummyRollFactor = Math.pow(Math.min(1, Math.abs(dummyRollDelta) / THREE.MathUtils.degToRad(5)), TILT_EASING);
  
  // Applique une rotation de test au modèle fictif
  const dummyModel = new THREE.Object3D();
  dummyModel.rotation.set(0, 0, 0);
  dummyModel.rotateX(tempTargetPitch * dummyPitchFactor);
  dummyModel.rotateZ(tempTargetRoll * dummyRollFactor);
  
  // Réinitialise tout
  targetPitch = 0;
  targetAccelPitch = 0;
  targetRoll = 0;
  
  // Log pour confirmer la précompilation
  console.log('[SUBMARINE] Rotation calculations precompiled successfully');
}

// Listen for keydown events to increment/decrement palier (ONE per press)
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  let changed = false;
  const currentMaxSpeed = defaultPhysics.config.maxForwardSpeed;
  const currentMinSpeed = -1 * defaultPhysics.config.maxBackwardSpeed;

  if (key === 'z' || key === 'arrowup') {
    setTargetSpeed(targetSpeed + targetSpeedStep, currentMinSpeed, currentMaxSpeed);
    changed = true;
  } else if (key === 's' || key === 'arrowdown') {
    setTargetSpeed(targetSpeed - targetSpeedStep, currentMinSpeed, currentMaxSpeed);
    changed = true;
  } else if (key === '0') {
    setTargetSpeed(0, currentMinSpeed, currentMaxSpeed);
    changed = true;
  }
  if (changed) {
    updateSpeedLabel();
  }
});

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
  
  // console.log(`[SUBMARINE] Updated rotation params - speed: ${speed}, damping: ${damping || 'unchanged'}`);
}

/**
 * Update submarine mass/inertia parameter
 * @param {number} mass - Submarine mass value (affects momentum and handling)
 */
export function updateSubmarineMass(mass) {
  // Update the physics system mass directly
  if (defaultPhysics && defaultPhysics.config) {
    defaultPhysics.config.mass = mass;
    
    // Recalculate momentum factor based on the new 0-1 scale
    // À masse = 0.1 (minimum): momentumFactor = 1.0 (sous-marin léger)
    // À masse = 1.0 (maximum): momentumFactor = 3.0 (sous-marin lourd)
    defaultPhysics.momentumFactor = 1.0 + (mass * 2.0);
    
    // Store value globally
    window.submarineMass = mass;
    
    // console.log(`[SUBMARINE] Updated mass to ${mass} (momentum factor: ${defaultPhysics.momentumFactor.toFixed(2)})`);
  } else {
    console.warn('[SUBMARINE] Cannot update mass: physics system not initialized');
  }
}

/**
 * Update water resistance parameter (drag coefficient)
 * @param {number} resistance - Water resistance value (affects drag and handling)
 */
export function updateWaterResistance(resistance) {
  // Update the physics system water resistance directly
  if (defaultPhysics && defaultPhysics.config) {
    // Mettre à jour la valeur dans la configuration
    defaultPhysics.config.waterResistance = resistance;
    
    // Stocker la valeur au niveau global pour y accéder facilement
    window.waterResistance = resistance;
    
    // Activer temporairement le mode debug pour vérifier que les calculs sont affectés
    const prevDebug = defaultPhysics.debug;
    defaultPhysics.debug = true;
    
    // console.log(`[SUBMARINE] Updated water resistance to ${resistance}`);
    
    // Désactiver le mode debug après le premier log
    setTimeout(() => { defaultPhysics.debug = prevDebug; }, 500);
  } else {
    console.warn('[SUBMARINE] Cannot update water resistance: physics system not initialized');
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
  
  // Pré-compilation des rotations lors du premier appel pour éviter le freeze
  if (!rotationsPrecompiled) {
    console.log('[SUBMARINE] Pre-compiling rotation calculations on first call...');
    precompileRotations();
    rotationsPrecompiled = true;
  }
  
  // Store the submarine's current position before any updates
  // This will be used for collision detection to revert position if needed
  const previousPosition = playerSubmarine.position.clone();

  // Core submarine settings
  const verticalSpeed = 0.4;
  const surfaceY = 20;
  const maxDepth = 1000; // Increased maximum diving depth from 500 to 1000
  
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
    // console.log('[CONTROLS] Dive brake activated - forward disabled');
  }
  
  // REVERSE BRAKE: When at high forward speeds, pressing backward (S) acts as a pure brake
  // rather than trying to go backward (which can cause acceleration issues)
  if (backwardPressed && currentVelocityPct > 0.5) {
    // Apply special braking by disabling both forward and backward inputs
    // This lets natural drag slow the submarine down much faster
    effectiveForward = false;
    effectiveBackward = false;
    // console.log('[CONTROLS] Reverse brake activated - natural drag increased');
  }
  
  // Create the input object for the physics system with our modified inputs
  const input = {
    forward: false, // ignore direct forward/backward, use palier
    backward: false,
    left: Boolean(keys['q'] || keys['arrowleft']),
    right: Boolean(keys['d'] || keys['arrowright']),
    up: upPressed,
    down: downPressed,
    // Pass palier to physics
    palierTargetSpeed: targetSpeed
  };
  
  // --- PALIER: Set physics target velocity directly ---
  if (defaultPhysics) {
    // Définir la vitesse cible dans le système physique
    // La physique s'occupera de ralentir progressivement
    defaultPhysics.targetVelocity = targetSpeed;
  }

  // Update physics and get movement parameters
  // Using the shared physics instance 
  
  // Update physics (velocity, acceleration, forces)  
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
    
    // Détection de collision avec le fond marin
    if (window.scene && window.scene.obstacles && window.scene.obstacles.length > 0) {
      // Obtenir la position EXACTE dans l'espace mondial (crucial pour la détection)
      const submarineWorldPosition = new THREE.Vector3();
      playerSubmarine.getWorldPosition(submarineWorldPosition);
      
      // Ajouter l'offset de la position locale du sous-marin (sous-partie)
      submarineWorldPosition.y += sub.position.y;
      
      // Log seulement occasionnellement pour éviter de spammer la console
      if (Math.random() < 0.01) {
        // console.log('[COLLISION] Submarine position:', {
        //   x: submarineWorldPosition.x.toFixed(2),
        //   y: submarineWorldPosition.y.toFixed(2),
        //   z: submarineWorldPosition.z.toFixed(2)
        // });
      }
      
      // Vérifier la collision avec chaque obstacle
      for (const obstacle of window.scene.obstacles) {
        // --- New Terrain Collision Check ---
        if (obstacle.name === 'terrain') { // Check if it's the terrain group
            const collisionMargin = 5; // Margin like before
            const terrainHeight = getTerrainHeightAt(submarineWorldPosition.x, submarineWorldPosition.z);
            if (submarineWorldPosition.y < terrainHeight + collisionMargin) {
                // console.log(`[TERRAIN COLLISION] Submarine Y: ${submarineWorldPosition.y.toFixed(1)}, Terrain Height: ${terrainHeight.toFixed(1)}`); // Déjà en commentaire
                playerSubmarine.position.copy(previousPosition); // Revert position
                
                // Apply an upward bounce when colliding with terrain
                if (playerSubmarine.children && playerSubmarine.children[0]) {
                    // Apply an immediate upward impulse to the submarine
                    const bounceStrength = 0.8; // Adjust for desired bounce strength
                    playerSubmarine.children[0].position.y += bounceStrength;
                    
                    // Reduce forward velocity but don't stop completely
                    const brakeInput = {
                        forward: false,
                        backward: false,
                        left: false,
                        right: false,
                        palierTargetSpeed: targetSpeed * 0.5 // Reduce speed by 50% but don't stop
                    };
                    
                    // Update physics with reduced speed
                    updatePhysics(brakeInput);
                }
                
                // Optional: Add collision sound or visual effect here
                break; // Stop checking other obstacles if terrain collision detected
            }
        } else if (obstacle.isCollidable && obstacle.checkCollision) {
          // --- Keep check for other potential obstacles using the old method ---
          if (obstacle.checkCollision(submarineWorldPosition)) {
            // console.log('[COLLISION] Collision détectée avec un obstacle:', obstacle.name || 'Unnamed obstacle'); // Déjà en commentaire
            playerSubmarine.position.copy(previousPosition); // Revenir à la position précédente
            
            // Apply an upward bounce when colliding with obstacle
            if (playerSubmarine.children && playerSubmarine.children[0]) {
                // Apply an immediate upward impulse to the submarine
                const bounceStrength = 0.8; // Adjust for desired bounce strength
                playerSubmarine.children[0].position.y += bounceStrength;
                
                // Reduce forward velocity but don't stop completely
                const brakeInput = {
                    forward: false,
                    backward: false,
                    left: false,
                    right: false,
                    palierTargetSpeed: targetSpeed * 0.5 // Reduce speed by 50% but don't stop
                };
                
                // Update physics with reduced speed
                updatePhysics(brakeInput);
            }
            
            break; // Sortir de la boucle si collision détectée
          }
        }
      }
    } else {
      // console.log('[WARNING] Pas d\'obstacles définis dans la scène');
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
    
    // console.log(`[CONTROLS] Forced diving brake: ${horizontalComponent.toFixed(3)} -> ${combinedVelocity.toFixed(3)}`);
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
    
    // console.log(`[CONTROLS] Ascending: ${combinedVelocity.toFixed(3)} (h: ${horizontalComponent.toFixed(3)}, v: ${weightedVertical.toFixed(3)})`);
  } 
  // No vertical movement
  else {
    combinedVelocity = currentVelocity;
  }
  
  // Calculer les inclinaisons cibles basées sur le mouvement
  
  // 1. Inclinaison avant/arrière (pitch) basée sur le mouvement vertical
  if (verticalMovement > 0) {
    // Monter (touche A) - inclinaison vers l'arrière (nez qui monte)
    targetPitch = THREE.MathUtils.degToRad(TILT_ANGLE*1.5); // Positif = vers l'arrière
  } else if (verticalMovement < 0) {
    // Descendre (touche W) - inclinaison vers l'avant (nez qui descend)
    targetPitch = -THREE.MathUtils.degToRad(TILT_ANGLE*1.5); // Négatif = vers l'avant
  } else {
    // Pas de mouvement vertical - retour à l'horizontal
    targetPitch = 0;
  }
  
  // 2. Inclinaison avant/arrière proportionnelle à la vitesse
  // Calculer le pourcentage de la vitesse maximale (entre 0 et 1)
  const velocityPct = Math.abs(combinedVelocity / maxSpeed);
  
  // Vérifier les touches pour déterminer la direction
  if (forwardPressed) {
    // Marche avant - inclinaison vers l'avant (nez qui descend)
    // L'angle est proportionnel à la vitesse
    targetAccelPitch = -THREE.MathUtils.degToRad(TILT_ANGLE*1.5 * velocityPct);
  } else if (backwardPressed) {
    // Marche arrière - inclinaison vers l'arrière (nez qui monte)
    // L'angle est proportionnel à la vitesse
    targetAccelPitch = THREE.MathUtils.degToRad(TILT_ANGLE * velocityPct);
  } else {
    // Pas de mouvement avant/arrière - retour à l'horizontal
    targetAccelPitch = 0;
  }
  
  // Afficher le pourcentage de vitesse et l'angle d'inclinaison (pour débogage)
  // if (Math.random() < 0.01) { // Limiter les logs pour ne pas surcharger la console
  //   console.log(`Vitesse: ${(velocityPct * 100).toFixed(0)}%, Angle: ${(targetAccelPitch * 180 / Math.PI).toFixed(1)}°`);
  // }
  
  // Inclinaison gauche/droite (roll) basée directement sur les touches
  const leftPressed = Boolean(keys['q'] || keys['arrowleft']);
  const rightPressed = Boolean(keys['d'] || keys['arrowright']);
  
  if (leftPressed) {
    // Touche gauche pressée - inclinaison vers la droite (inversé)
    targetRoll = THREE.MathUtils.degToRad(TILT_ANGLE); // Inversé: positif = vers la droite
  } else if (rightPressed) {
    // Touche droite pressée - inclinaison vers la gauche (inversé)
    targetRoll = -THREE.MathUtils.degToRad(TILT_ANGLE); // Inversé: négatif = vers la gauche
  } else {
    // Pas de touche gauche/droite - retour à l'horizontal
    targetRoll = 0;
  }
  
  // Transition non linéaire vers les inclinaisons cibles
  // Application d'une interpolation non linéaire qui ralentit à l'approche de la cible
  
  // Calcul de la distance à la cible pour chaque axe de rotation
  const pitchDelta = targetPitch - currentPitch;
  const accelPitchDelta = targetAccelPitch - currentAccelPitch;
  const rollDelta = targetRoll - currentRoll;
  
  // Calcul de l'attenuation non linéaire (ralentit près de la cible)
  const pitchAttenuationFactor = Math.pow(Math.min(1, Math.abs(pitchDelta) / THREE.MathUtils.degToRad(5)), TILT_EASING);
  const accelPitchAttenuationFactor = Math.pow(Math.min(1, Math.abs(accelPitchDelta) / THREE.MathUtils.degToRad(5)), TILT_EASING);
  const rollAttenuationFactor = Math.pow(Math.min(1, Math.abs(rollDelta) / THREE.MathUtils.degToRad(5)), TILT_EASING);
  
  // Application de l'interpolation avec facteurs d'atténuation
  currentPitch += pitchDelta * TILT_SPEED * pitchAttenuationFactor;
  currentAccelPitch += accelPitchDelta * TILT_SPEED * accelPitchAttenuationFactor;
  currentRoll += rollDelta * TILT_SPEED * rollAttenuationFactor;
  
  // Mise à jour de la phase de tangage
  pitchPhase += PITCH_SPEED * 0.01;
  if (pitchPhase > Math.PI * 2) pitchPhase -= Math.PI * 2;
  
  // Calculer le tangage (pitch) supplémentaire basé sur une fonction sinusoïdale
  const pitchOscillation = Math.sin(pitchPhase) * THREE.MathUtils.degToRad(PITCH_AMPLITUDE);
  
  // Appliquer toutes les rotations au sous-marin
  const submarineModel = playerSubmarine.children[0];
  if (submarineModel) {
    // Appliquer les rotations au modèle du sous-marin tout en préservant la rotation de base (direction)
    
    // 1. Sauvegarder la rotation de direction (yaw) - c'est la rotation principale qui détermine où pointe le sous-marin
    const submarineYaw = submarineModel.rotation.y;
    
    // 2. Réinitialiser les autres rotations (pitch et roll) mais conserver la direction (yaw)
    submarineModel.rotation.set(0, submarineYaw, 0);
    
    // 3. Appliquer l'inclinaison avant/arrière (pitch) combinée:
    // - inclinaison de mouvement vertical (monter/descendre)
    // - inclinaison d'accélération/freinage
    // - tangage naturel
    submarineModel.rotateX(currentPitch + currentAccelPitch + pitchOscillation);
    
    // 4. Appliquer l'inclinaison lors des virages (roll) - c'est l'axe qui vous intéresse particulier
    // Dans l'orientation typique d'un sous-marin, rotateZ fait pencher le sous-marin vers la gauche/droite
    // (comme un avion qui penche ses ailes lors d'un virage)
    submarineModel.rotateZ(currentRoll);
    
    // Note: Dans Three.js, les axes sont:
    // X: de gauche à droite (pitch est la rotation autour de cet axe)
    // Y: de bas en haut (yaw/direction est la rotation autour de cet axe)
    // Z: d'avant en arrière (roll est la rotation autour de cet axe)
  }
  
  // Return data for external systems like the speedometer
  return {
    velocity: combinedVelocity, // Combined horizontal and vertical velocity
    maxSpeed: maxSpeed,
    // Include full movement data for advanced use
    movement: movement,
    verticalMovement: verticalMovement,
    targetSpeed: targetSpeed, // Expose palier for UI or debug
    // Nouvelles données d'inclinaison pour debugging
    tiltData: {
      pitch: currentPitch,           // Inclinaison verticale (monter/descendre)
      accelPitch: currentAccelPitch, // Inclinaison avant/arrière (accélération/freinage)
      roll: currentRoll,             // Inclinaison latérale (gauche/droite)
      oscillation: pitchOscillation  // Tangage naturel
    }
  };
}

// --- SUGGESTED: MODULARIZE PALIER LOGIC ---
// If this logic grows, move all palier-related code (targetSpeed, step, clamp, conversion, UI) to a new module:
// e.g. submarine/palierSpeed.js
// This keeps controls.js focused only on glue logic and not business rules.
