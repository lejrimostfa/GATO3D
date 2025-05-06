// ocean/waveControls.js
// Controls for ocean waves in GATO3D

// Import THREE.js for vector operations
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// Default wave parameters
let waveAmplitude = 1.0;
let waveDirection = 0; // degrees (0-360)
let waterTransparency = 0.1; // 0.1 (opaque) to 1.0 (transparent)
let waterReflections = 0.5; // 0.0 (none) to 1.0 (maximum)
let waterRefractions = 0.7; // 0.0 (none) to 1.0 (maximum)

// Default fog parameters
let fogEnabled = true;      // Enable/disable fog
let fogDensity = 0.01;     // 0.001 (light fog) to 0.05 (heavy fog)
let fogColor = '#004566';  // Underwater fog color
let fogNear = 100;         // Near clipping distance for fog
let fogFar = 2000;         // Far clipping distance for fog

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
 * Set the water transparency
 * @param {number} transparency - Water transparency value (0.1-1.0)
 */
export function setWaterTransparency(transparency) {
  waterTransparency = transparency;
  return waterTransparency;
}

/**
 * Set the water reflections intensity
 * @param {number} reflections - Water reflections value (0.0-1.0)
 */
export function setWaterReflections(reflections) {
  waterReflections = reflections;
  return waterReflections;
}

/**
 * Set the water refractions intensity
 * @param {number} refractions - Water refractions value (0.0-1.0)
 */
export function setWaterRefractions(refractions) {
  waterRefractions = refractions;
  return waterRefractions;
}

/**
 * Toggle fog on/off
 * @param {boolean} enabled - Whether fog should be enabled
 */
export function setFogEnabled(enabled) {
  fogEnabled = enabled;
  return fogEnabled;
}

/**
 * Set fog density
 * @param {number} density - Fog density value (0.001-0.05)
 */
export function setFogDensity(density) {
  fogDensity = density;
  return fogDensity;
}

/**
 * Set fog color
 * @param {string} color - Fog color in hex format
 */
export function setFogColor(color) {
  fogColor = color;
  return fogColor;
}

/**
 * Set fog near distance
 * @param {number} near - Near clipping distance for fog
 */
export function setFogNear(near) {
  fogNear = near;
  return fogNear;
}

/**
 * Set fog far distance
 * @param {number} far - Far clipping distance for fog
 */
export function setFogFar(far) {
  fogFar = far;
  return fogFar;
}

/**
 * Get the current wave parameters
 * @returns {Object} - Current wave settings
 */
export function getWaveParameters() {
  return {
    amplitude: waveAmplitude,
    direction: waveDirection,
    directionRadians: waveDirection * (Math.PI / 180),
    transparency: waterTransparency,
    reflections: waterReflections,
    refractions: waterRefractions,
    // Include fog parameters
    fogEnabled: fogEnabled,
    fogDensity: fogDensity,
    fogColor: fogColor,
    fogNear: fogNear,
    fogFar: fogFar
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
    // console.log('[DEBUG] Water material not found or incomplete');
    return;
  }
  
  // Update wave timing
  const now = Date.now();
  const deltaTime = (now - lastUpdateTime) / 1000; // Convert to seconds
  lastUpdateTime = now;
  
  // Advance wave time based on amplitude (higher waves move faster)
  waveTime += deltaTime * (0.5 + waveAmplitude * 0.3);
  
  // console.log(`[DEBUG] Updating 3D waves: Amplitude=${waveAmplitude}, Direction=${waveDirection}°, Transparency=${waterTransparency.toFixed(1)}, Time=${waveTime.toFixed(2)}`);
  
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
  
  // Appliquer la transparence de l'eau - doit utiliser l'uniform 'alpha' spécifique au shader Water
  if (water.material && water.material.uniforms) {
    // Les shaders Water utilisent un uniform 'alpha' au lieu de material.opacity
    if (water.material.uniforms['alpha']) {
      // La valeur alpha est inversée par rapport à la transparence (1.0 = complètement opaque)
      // On veut que notre slider de transparence soit intuitif (1.0 = très transparent)
      const alphaValue = 1.0 - (waterTransparency * 0.8);
      
      // Définir le niveau de transparence
      water.material.uniforms['alpha'].value = alphaValue;
      
      // Assurer que le matériau est marqué comme transparent
      water.material.transparent = true;
      
      // console.log(`[DEBUG] Updated water transparency: alpha=${alphaValue.toFixed(2)}, transparency=${waterTransparency.toFixed(2)}`);
    } else {
      // console.log('[DEBUG] Water material does not have alpha uniform, trying opacity');
      // Tenter d'utiliser l'approche standard d'opacité comme plan B
      water.material.transparent = true;
      water.material.opacity = 1.0 - (waterTransparency * 0.8);
    }
    
    // Appliquer les réflexions de l'eau (en utilisant le bon uniform)
    if (water.material.uniforms['reflectivity']) {
      water.material.uniforms['reflectivity'].value = waterReflections;
      // console.log(`[DEBUG] Updated water reflections: ${waterReflections.toFixed(2)}`);
    }
    
    // Appliquer les réfractions de l'eau
    if (water.material.uniforms['refractionRatio']) {
      // La valeur de réfraction est typiquement entre 0.02 (forte) et 0.5 (faible)
      // On doit donc l'inverser par rapport à notre slider (slider à 1.0 = réfraction forte)
      const refractionValue = 0.5 - (waterRefractions * 0.48);
      water.material.uniforms['refractionRatio'].value = refractionValue;
      // console.log(`[DEBUG] Updated water refractions: ratio=${refractionValue.toFixed(2)}, value=${waterRefractions.toFixed(2)}`);
    }
  }
  
  // Force material update
  water.material.needsUpdate = true;
  
  // IMPORTANT: Update the actual 3D wave geometry if the function exists
  if (water.updateWaves && typeof water.updateWaves === 'function') {
    // Call the custom wave update function we defined in water-setup.js
    water.updateWaves(waveAmplitude, waveDirection, waveTime);
    // console.log('[DEBUG] Updated 3D wave geometry');
  } else {
    // console.log('[DEBUG] No updateWaves function found on water object');
  }
  
  // Update fog if scene is available
  if (window.scene) {
    if (fogEnabled) {
      // Apply fog settings
      window.scene.fog = new THREE.FogExp2(new THREE.Color(fogColor), fogDensity);
    } else {
      // Remove fog if disabled
      window.scene.fog = null;
    }
  }
  
  return {
    distortionScale,
    direction: waveDirection,
    fogEnabled,
    fogDensity
  };
}
