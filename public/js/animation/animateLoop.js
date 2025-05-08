// animation/animateLoop.js - Main animation loop handler

import { updatePlayerSubmarine } from '../submarine/controls.js';
import { updateGameTime } from '../time/timeManager.js';
import { updateFollowCamera, findSubmarine } from '../camera/followCamera.js';
import { updateUnderwaterEffects } from '../effects/underwater.js';
import { updateFpsCounter } from '../ui/fpsCounter.js';
import { updateMinimap } from '../ui/minimap.js';
import { drawClockFace, drawTime } from '../ui/clock.js';
import { updateDepthHud } from '../ui/hud.js';
import { updateSun } from '../water-setup.js';
import { updateRayleighEffect } from '../effects/skyEffects.js';
import { updateTerrainWithSubmarine } from '../ocean/terrain.js'; // Import la nouvelle fonction de terrain avec préchargement
import { updateWaterMaterial, getWaveParameters } from '../ocean/waveControls.js'; // Ajout de l'importation
// Import centralized key management
import { keys } from '../input/inputManager.js';
// Import submarine status manager
import { updateStatus } from '../submarine/statusManager.js';

// Animation state
let animationState = {
  isRunning: false,
  scene: null,
  camera: null,
  renderer: null,
  playerSubmarine: null,
  sceneHandles: null,
  // No longer tracking keys here, using centralized input manager
  clockCanvas: null,
  clockCtx: null,
  cameraFrustumHelper: null
};

/**
 * Initialize the animation loop with required components
 * @param {Object} components - Essential components for animation
 */
export function initAnimationLoop({
  scene,
  camera,
  renderer,
  playerSubmarine,
  sceneHandles,
  clockCanvas = null,
  cameraFrustumHelper = null
}) {
  animationState = {
    isRunning: true,
    scene,
    camera,
    renderer,
    playerSubmarine,
    sceneHandles,
    clockCanvas,
    clockCtx: clockCanvas ? clockCanvas.getContext('2d') : null,
    cameraFrustumHelper
  };
  
  // Start the animation loop
  animate();
}

/**
 * Set whether the animation is running
 * @param {boolean} running - Whether animation should be running
 */
export function setAnimationRunning(running) {
  animationState.isRunning = running;
}

/**
 * Update key state for controls (Legacy function, left for compatibility)
 * @param {string} key - The key code
 * @param {boolean} pressed - Whether the key is pressed
 * @deprecated Use the inputManager.js module instead
 */
export function updateKeyState(key, pressed) {
  // This function is kept for backward compatibility
  // All key state management is now done in inputManager.js
  console.warn('updateKeyState in animateLoop.js is deprecated. Use inputManager.js instead.');
}

/**
 * The main animation loop
 */
function animate() {
  requestAnimationFrame(animate);
  
  if (!animationState.isRunning) return;
  
  const { 
    scene, 
    camera, 
    renderer, 
    playerSubmarine, 
    sceneHandles, 
    clockCanvas,
    clockCtx,
    cameraFrustumHelper
  } = animationState;
  
  // If submarine is not found, try to find it
  if (!playerSubmarine && scene) {
    animationState.playerSubmarine = findSubmarine(scene);
  }
  
  // Update submarine controls
  if (playerSubmarine) {
    // Récupérer les données de mouvement du sous-marin
    const movementData = updatePlayerSubmarine(playerSubmarine);
    
    // Mettre à jour les statuts du sous-marin (santé, oxygène, batterie)
    // Calculer la profondeur réelle (distance depuis la surface de l'eau à Y=20)
    const surfaceY = 20;
    const depth = playerSubmarine.position.y < surfaceY ? surfaceY - playerSubmarine.position.y : 0;
    
    // Mettre à jour le statut du sous-marin avec les valeurs actuelles
    if (movementData) {
      // Afficher les valeurs pour débogage
      console.log(`[Status Update] Depth: ${depth.toFixed(2)}m, Velocity: ${movementData.velocity ? movementData.velocity.toFixed(2) : 'N/A'}`);
      
      // Utiliser une valeur par défaut si velocity est undefined
      const velocity = (movementData.velocity !== undefined) ? movementData.velocity : 0;
      
      // Mettre à jour explicitement le statut
      updateStatus(playerSubmarine, depth, velocity);
    } else {
      console.warn('[Animation] Données de mouvement non disponibles pour mise à jour du statut');
    }
    
    // Mettre à jour la position de la lumière d'ombre pour suivre le sous-marin
    if (window.updateShadowLight) {
      window.updateShadowLight(playerSubmarine);
    }
  }
  
  // Update FPS counter
  updateFpsCounter();
  
  // Update game time and get current hour
  const { currentGameHour } = updateGameTime();
  
  // Update Rayleigh sky effect based on time
  if (sceneHandles && sceneHandles.sky) {
    updateRayleighEffect(sceneHandles.sky, currentGameHour);
  }
  
  // Update sun position based on time
  if (sceneHandles && sceneHandles.sun && sceneHandles.sky && sceneHandles.nightSky) {
    // console.log('[ANIMATION] Updating sun position for hour:', currentGameHour);
    updateSun(sceneHandles, currentGameHour);
  } else {
    console.warn('[ANIMATION] Missing required components for sun update');
  }
  
  // Update camera following submarine
  if (playerSubmarine && camera) {
    updateFollowCamera(camera, playerSubmarine);
  }
  
  // Update terrain grid based on camera position and submarine direction for intelligent preloading
  if (camera && playerSubmarine) {
    // Nouvelle fonction qui prend en compte la direction du sous-marin pour précharger les terrains
    updateTerrainWithSubmarine(camera, playerSubmarine);
  }
  
  // Update underwater effects
  if (scene && camera && sceneHandles && sceneHandles.ambientLight) {
    const waveParams = getWaveParameters(); // Obtenir les paramètres actuels des vagues/brouillard
    updateUnderwaterEffects(scene, camera, sceneHandles.ambientLight, waveParams.fogEnabled);
  }
  
  // Update water animation
  if (sceneHandles && sceneHandles.water) {
    sceneHandles.water.material.uniforms['time'].value += 1 / 60;
    updateWaterMaterial(sceneHandles.water); // Appel de la fonction de mise à jour
  }
  
  // Update clock UI
  if (clockCtx && clockCanvas) {
    const currentRadius = clockCanvas.height / 2;
    clockCtx.clearRect(0, 0, clockCanvas.width, clockCanvas.height);
    drawClockFace(clockCtx, currentRadius);
    drawTime(clockCtx, currentRadius, currentGameHour);
  } else if (!clockCanvas) {
    // Try to get canvas again if it wasn't found initially
    animationState.clockCanvas = document.getElementById('clock-canvas');
    if (animationState.clockCanvas) {
      animationState.clockCtx = animationState.clockCanvas.getContext('2d');
    }
  }
  
  // Hide frustum helper in main view
  if (cameraFrustumHelper) {
    cameraFrustumHelper.visible = false;
  }
  
  // Render the scene
  if (renderer && scene && camera) {
    // Exécuter les fonctions du gameLoop
    if (window.gameLoop && Array.isArray(window.gameLoop)) {
      for (const fn of window.gameLoop) {
        try {
          fn();
        } catch (error) {
          console.error('[ANIMATION] Error in gameLoop function:', error);
        }
      }
    }

    // Render
    renderer.render(scene, camera);
  }
  
  // Update minimap
  if (scene && playerSubmarine) {
    updateMinimap(scene, playerSubmarine, cameraFrustumHelper);
  }
}

/**
 * Get the current animation state
 * @returns {Object} - Current animation state
 */
export function getAnimationState() {
  return { ...animationState };
}
