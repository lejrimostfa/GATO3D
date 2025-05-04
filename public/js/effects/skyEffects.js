// effects/skyEffects.js - Handles sky coloration and atmosphere effects

// Sky effect state
const skyState = {
  rayleighMode: 'auto',
  rayleighPeriod: 24,
  rayleighPhase: 21,
};

/**
 * Initialize sky effects 
 * @param {Object} options - Sky effect options
 */
export function initSkyEffects(options = {}) {
  if (options.mode) skyState.rayleighMode = options.mode;
  if (options.period) skyState.rayleighPeriod = options.period;
  if (options.phase) skyState.rayleighPhase = options.phase;
  
  // Create global functions for other modules to access
  window.getRayleighMode = () => skyState.rayleighMode;
  window.getRayleighPeriod = () => skyState.rayleighPeriod;
  window.getRayleighPhase = () => skyState.rayleighPhase;
}

/**
 * Update the Rayleigh effect based on the current time of day
 * @param {THREE.Sky} sky - The Three.js sky object
 * @param {number} currentHour - Current hour (0-24)
 * @returns {number} - The calculated Rayleigh value
 */
export function updateRayleighEffect(sky, currentHour) {
  if (!sky || !sky.material || !sky.material.uniforms || !sky.material.uniforms.rayleigh) {
    return 2.5; // Default fallback
  }
  
  // Get current mode and parameters
  const mode = window.getRayleighMode ? window.getRayleighMode() : skyState.rayleighMode;
  const period = window.getRayleighPeriod ? window.getRayleighPeriod() : skyState.rayleighPeriod;
  const phase = window.getRayleighPhase ? window.getRayleighPhase() : skyState.rayleighPhase;
  
  // Time in the current period
  let t = currentHour % period;
  let rayleigh;
  
  // Calculate Rayleigh value based on mode
  switch (mode) {
    case 'auto':
    case 'sin':
      // Cosine curve: Rayleigh max at sunrise/sunset, min at midnight/noon
      rayleigh = 0.5 + (6 - 0.5) * 0.5 * (1 - Math.cos(2 * Math.PI * ((t - phase) / period)));
      break;
    case 'manual':
      // Don't modify the value when in manual mode
      rayleigh = sky.material.uniforms.rayleigh.value;
      break;
    default:
      // Fallback value
      rayleigh = 2.5;
  }
  
  // Update sky material
  sky.material.uniforms.rayleigh.value = rayleigh;
  
  // Update the slider UI if available
  if (window.updateRayleighSlider) {
    window.updateRayleighSlider(rayleigh);
  } else if (!window._rayleighSliderInjected) {
    window._rayleighSliderInjected = true;
    // Dynamically load settings module to avoid circular dependencies
    import('../ui/settings.js').then(mod => {
      window.updateRayleighSlider = mod.updateRayleighSlider;
      if (window.updateRayleighSlider) mod.updateRayleighSlider(rayleigh);
    });
  }
  
  // Update rayleigh graph if available
  if (window.setRayleighGraphHour) {
    window.setRayleighGraphHour(currentHour);
  }
  
  return rayleigh;
}

/**
 * Set the Rayleigh mode
 * @param {string} mode - Mode ('auto', 'sin', 'manual')
 */
export function setRayleighMode(mode) {
  if (['auto', 'sin', 'manual'].includes(mode)) {
    skyState.rayleighMode = mode;
  }
}

/**
 * Set Rayleigh parameters
 * @param {Object} params - Parameters to set
 */
export function setRayleighParameters(params = {}) {
  if (params.period !== undefined) skyState.rayleighPeriod = params.period;
  if (params.phase !== undefined) skyState.rayleighPhase = params.phase;
}

/**
 * Get current Rayleigh parameters
 * @returns {Object} - Current parameters
 */
export function getRayleighParameters() {
  return { ...skyState };
}
