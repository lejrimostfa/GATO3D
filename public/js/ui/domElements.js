// ui/domElements.js
// Centralized DOM element references to avoid redundant queries

/**
 * Cached DOM element references used throughout the application
 * This reduces redundant document.getElementById calls and improves performance
 */
// Element reference object - will be populated in initDOMElements()
export const elements = {
  // Game container elements
  gameCanvas: null,
  overlay: null,
  uiMenus: null,
  uiBottomBar: null,
  
  // Main menu buttons
  btnCreate: null,
  btnJoin: null,
  btnEditor: null,
  
  // Speedometer
  speedometerCanvas: null,
  
  // Clock
  clockCanvas: null,
  
  // Sliders and their labels
  submarineSpeedSlider: null,
  submarineSpeedLabel: null,
  
  cameraSlider: null,
  cameraLabel: null,
  
  dampingSlider: null,
  dampingLabel: null,
  
  altitudeSlider: null,
  altitudeLabel: null,
  
  dayDurationSlider: null,
  dayDurationLabel: null,
  
  waveAmplitudeSlider: null,
  waveAmplitudeLabel: null,
  
  waveDirectionSlider: null,
  waveDirectionLabel: null,
  
  // Minimap elements
  minimapContainer: null,
  minimap: null,
  minimapZoomIn: null,
  minimapZoomOut: null,
  minimapRotationToggle: null,
  
  // HUD elements
  hud: null,
  depthIndicator: null,
  depthValue: null,
  compass: null
};

/**
 * Get a DOM element, using the cached reference if available or querying if needed
 * @param {string} id - The element ID to get
 * @returns {HTMLElement|null} - The DOM element or null if not found
 */
export function getElement(id) {
  // Return from cache if available
  if (elements[id]) {
    return elements[id];
  }
  
  // Otherwise, query and cache the result
  const element = document.getElementById(id);
  if (element) {
    elements[id] = element;
  }
  
  return element;
}

/**
 * Initialize the DOM element cache
 * Should be called when the DOM is fully loaded
 * @returns {boolean} - True if all critical elements were found
 */
export function initDOMElements() {
  console.log('[DOM] Initializing DOM elements...');
  
  // First, ensure the gameCanvas is assigned directly (it's our most critical element)
  const gameCanvas = document.getElementById('gameCanvas');
  if (gameCanvas) {
    console.log('[DOM] Found gameCanvas directly');
    elements.gameCanvas = gameCanvas;
  }
  
  // Then refresh all other element references
  Object.keys(elements).forEach(key => {
    if (key !== 'gameCanvas') { // Skip gameCanvas as we already handled it
      const elementId = toDOMId(key);
      elements[key] = document.getElementById(elementId);
    }
  });
  
  // Log results
  const foundCount = Object.entries(elements).filter(([k, v]) => v !== null).length;
  console.log(`[DOM] Elements initialized: ${foundCount}/${Object.keys(elements).length}`);
  
  // Check critical elements
  const criticalElements = [
    'gameCanvas'
  ];
  
  // Debug output for critical elements
  criticalElements.forEach(id => {
    console.log(`[DOM] Critical element '${id}': ${elements[id] ? 'FOUND ✓' : 'MISSING ✗'}`);
  });
  
  const missingCritical = criticalElements.filter(id => !elements[id]);
  if (missingCritical.length > 0) {
    console.error(`[DOM] Critical elements missing: ${missingCritical.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Convert a camelCase property name to a kebab-case DOM id
 * @param {string} property - The property name (e.g., 'submarineSpeedSlider')
 * @returns {string} - The DOM id (e.g., 'submarine-speed-slider')
 */
function toDOMId(property) {
  return property.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
