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
// Import centralized key management
import { keys } from '../input/inputManager.js';

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
    updatePlayerSubmarine(playerSubmarine);
    updateDepthHud(playerSubmarine);
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
  if (sceneHandles) {
    updateSun(sceneHandles, currentGameHour);
  }
  
  // Update camera following submarine
  if (playerSubmarine && camera) {
    updateFollowCamera(camera, playerSubmarine);
  }
  
  // Update underwater effects
  if (scene && camera && sceneHandles && sceneHandles.ambientLight) {
    updateUnderwaterEffects(scene, camera, sceneHandles.ambientLight);
  }
  
  // Update water animation
  if (sceneHandles && sceneHandles.water) {
    sceneHandles.water.material.uniforms['time'].value += 1 / 60;
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
