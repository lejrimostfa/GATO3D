// ocean/waveControls.js
// Controls for ocean waves in GATO3D

// Import THREE.js for vector operations
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// Default wave parameters
let waveAmplitude = 1.0;
let waveDirection = 0; // degrees (0-360)

/**
 * Set the wave amplitude
 * @param {number} amplitude - Wave amplitude value (0-5)
 */
export function setWaveAmplitude(amplitude) {
  waveAmplitude = amplitude;
  return waveAmplitude;
}

/**
 * Set the wave direction
 * @param {number} direction - Wave direction in degrees (0-360)
 */
export function setWaveDirection(direction) {
  waveDirection = direction;
  return waveDirection;
}

/**
 * Get the current wave parameters
 * @returns {Object} - Current wave settings
 */
export function getWaveParameters() {
  return {
    amplitude: waveAmplitude,
    direction: waveDirection,
    directionRadians: waveDirection * (Math.PI / 180)
  };
}

/**
 * Apply wave settings to the water material
 * @param {THREE.Water} water - Water object from Three.js
 */
// Global wave animation state
let waveTime = 0;
let lastUpdateTime = Date.now();

/**
 * Update the water material and geometry to create real 3D waves
 * @param {THREE.Water} water - Water object from Three.js
 */
export function updateWaterMaterial(water) {
  if (!water || !water.material || !water.material.uniforms) {
    console.log('[DEBUG] Water material not found or incomplete');
    return;
  }
  
  // Update wave timing
  const now = Date.now();
  const deltaTime = (now - lastUpdateTime) / 1000; // Convert to seconds
  lastUpdateTime = now;
  
  // Advance wave time based on amplitude (higher waves move faster)
  waveTime += deltaTime * (0.5 + waveAmplitude * 0.3);
  
  console.log(`[DEBUG] Updating 3D waves: Amplitude=${waveAmplitude}, Direction=${waveDirection}°, Time=${waveTime.toFixed(2)}`);
  
  // Basic material adjustments
  // Apply wave amplitude to the water distortion scale
  const distortionScale = 1 + waveAmplitude * 2;
  water.material.uniforms['distortionScale'].value = distortionScale;
  
  // Change water color based on wave amplitude (deeper blue with higher waves)
  if (water.material.uniforms['waterColor']) {
    const intensityFactor = 0.3 + waveAmplitude * 0.1;
    water.material.uniforms['waterColor'].value.setRGB(
      0.0 * intensityFactor, 
      0.3 * intensityFactor, 
      0.5 * intensityFactor
    );
  }
  
  // Force material update
  water.material.needsUpdate = true;
  
  // IMPORTANT: Update the actual 3D wave geometry if the function exists
  if (water.updateWaves && typeof water.updateWaves === 'function') {
    // Call the custom wave update function we defined in water-setup.js
    water.updateWaves(waveAmplitude, waveDirection, waveTime);
    console.log('[DEBUG] Updated 3D wave geometry');
  } else {
    console.log('[DEBUG] No updateWaves function found on water object');
  }
  
  return {
    distortionScale,
    direction: waveDirection
  };
}
