// effects/underwater.js - Handles underwater environmental effects

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// Default fog settings
const fogSettings = {
  default: { 
    color: 0xbfd1e5, 
    density: 0.00015 
  },
  underwater: { 
    color: 0x226688, 
    density: 0.003 
  },
  surfaceLevel: 20, // Y-coordinate of water surface
  isUnderwater: false
};

/**
 * Initialize underwater effects system
 * @param {THREE.Scene} scene - The THREE scene
 * @param {THREE.AmbientLight} ambientLight - The ambient light to modify underwater
 * @param {Object} options - Custom options for underwater effects
 */
export function initUnderwaterEffects(scene, ambientLight, options = {}) {
  // Apply any custom options
  if (options.surfaceLevel !== undefined) {
    fogSettings.surfaceLevel = options.surfaceLevel;
  }
  if (options.underwaterColor) {
    fogSettings.underwater.color = options.underwaterColor;
  }
  if (options.underwaterDensity !== undefined) {
    fogSettings.underwater.density = options.underwaterDensity;
  }
  
  // Set initial fog to above water
  scene.fog = new THREE.FogExp2(
    fogSettings.default.color, 
    fogSettings.default.density
  );
  
  fogSettings.isUnderwater = false;
}

/**
 * Update the underwater effects based on camera position
 * @param {THREE.Scene} scene - The THREE scene
 * @param {THREE.Camera} camera - The camera to check position
 * @param {THREE.AmbientLight} ambientLight - The ambient light to modify
 * @param {boolean} userFogEnabled - Indicates if user-controlled fog is active
 * @returns {boolean} - Whether the camera is underwater
 */
export function updateUnderwaterEffects(scene, camera, ambientLight, userFogEnabled = false) {
  if (!scene || !camera) return false;
  
  const isUnderwater = camera.position.y < fogSettings.surfaceLevel;
  
  // Only update if crossing the surface
  if (isUnderwater !== fogSettings.isUnderwater) {
    if (isUnderwater) {
      // Transition to underwater effects
      if (!userFogEnabled) { // Seulement si le brouillard utilisateur n'est pas actif
        scene.fog = new THREE.FogExp2(
          fogSettings.underwater.color, 
          fogSettings.underwater.density
        );
      }
      
      if (ambientLight) {
        ambientLight.intensity = 0.18;
        ambientLight.color.set(0x226688);
      }
    } else {
      // Transition to above water effects
      if (!userFogEnabled) { // Seulement si le brouillard utilisateur n'est pas actif
        scene.fog = new THREE.FogExp2(
          fogSettings.default.color, 
          fogSettings.default.density
        );
      }
      
      if (ambientLight) {
        ambientLight.intensity = 0.5;
        ambientLight.color.set(0xffffff);
      }
    }
    
    fogSettings.isUnderwater = isUnderwater;
  }
  
  return isUnderwater;
}

/**
 * Set custom fog parameters
 * @param {Object} params - Parameters to update
 */
export function setFogParameters(params = {}) {
  if (params.defaultColor) fogSettings.default.color = params.defaultColor;
  if (params.defaultDensity) fogSettings.default.density = params.defaultDensity;
  if (params.underwaterColor) fogSettings.underwater.color = params.underwaterColor;
  if (params.underwaterDensity) fogSettings.underwater.density = params.underwaterDensity;
  if (params.surfaceLevel) fogSettings.surfaceLevel = params.surfaceLevel;
}

/**
 * Get current underwater status
 * @returns {boolean} - Whether currently underwater
 */
export function isUnderwater() {
  return fogSettings.isUnderwater;
}
