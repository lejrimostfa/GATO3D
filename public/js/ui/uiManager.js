// ui/uiManager.js
// Centralized UI initialization and management

import { elements, initDOMElements } from './domElements.js';
import { initMenus } from './menus.js';
import { drawClockFace, drawTime } from './clock.js';
import { updateHudVisibility } from './hud.js';
import { initUIVisibility, hideAllUIElements } from './components/visibility.js';
import { setupOverlayObserver } from './components/overlayObserver.js';
import { initAllSliders } from './controls/sliders.js';
import { initMinimap } from './minimap/minimapManager.js';

// UI state variables
let speedometerInstance = null;

/**
 * Initialize all UI components
 * @param {Function} onComplete - Callback when all UI is initialized
 */
export function initUI(onComplete) {
  console.log('[UI] Initializing UI components');
  
  // Initialize DOM element cache
  initDOMElements();
  
  // Force hiding all UI elements initially
  const forceHide = true;
  hideAllUIElements(forceHide);
  
  // Ensure overlay has the highest z-index
  const overlay = document.getElementById('overlay');
  if (overlay) {
    // Appliquer un z-index élevé à l'overlay
    overlay.style.zIndex = '9999';
    
    // Forcer le display block
    if (overlay.style.display === '') {
      overlay.style.display = 'flex';
    }
  }
  
  // Initialize UI components (invisibles initialement)
  initMenuPanels();
  initClockUI();
  initAllSliders();
  initSpeedometer();
  initMinimap();
  
  // Initialize HUD visibility
  updateHudVisibility();
  
  // Setup visibility observer for the overlay
  setupOverlayObserver();
  
  // Ajouter un délai pour être sûr que les composants UI sont initialisés cachés
  setTimeout(() => {
    hideAllUIElements(forceHide);
    
    if (onComplete) {
      onComplete();
    }
  }, 100);
}

// hideAllUIElements est maintenant dans components/visibility.js

/**
 * Initialize centralized menu panels
 */
function initMenuPanels() {
  initMenus([
    {btnId: 'game-settings-toggle', panelId: 'game-settings-panel'},
    {btnId: 'submarine-settings-toggle', panelId: 'submarine-settings-panel'},
    {btnId: 'slider-toggle', panelId: 'slider-panel'},
    {btnId: 'visibility-toggle', panelId: 'visibility-panel'},
    {btnId: 'light-settings-toggle', panelId: 'light-settings-panel'},
    {btnId: 'wave-settings-toggle', panelId: 'wave-settings-panel'}
  ]);
}

/**
 * Initialize the clock UI
 */
function initClockUI() {
  const { clockCanvas } = elements;
  
  if (clockCanvas) {
    const clockCtx = clockCanvas.getContext('2d');
    // Increased clock size by 1.5x
    const clockSize = Math.min(window.innerWidth, window.innerHeight) * 0.21;
    clockCanvas.width = clockSize;
    clockCanvas.height = clockSize;
    
    // Draw initial clock
    drawClockFace(clockCtx, clockCanvas.width / 2);
    drawTime(clockCtx, clockCanvas.width / 2, 0);
  }
}

/**
 * Initialize the speedometer UI
 */
function initSpeedometer() {
  import('./speedometer.js').then(module => {
    console.log('[UI] Initializing speedometer');
    speedometerInstance = module.initSpeedometer();
    
    // Start updating speedometer with submarine velocity
    import('../submarine/controls.js').then(submarineModule => {
      // Cache for submarine instance
      let submarineInstance = null;
      
      // Update the speedometer every frame
      function updateSpeedometer() {
        if (speedometerInstance) {
          // Get the global max speed value
          const displayMaxSpeed = window.currentMaxSpeed || 10; // Default to 10 knots
          
          // Try to get velocity from submarine instance if available
          let velocity;
          
          // Check if we have a submarine controls update result
          if (submarineInstance && submarineInstance.velocity !== undefined) {
            // Use the combined velocity calculation from controls
            velocity = submarineInstance.velocity;
          } else {
            // Fallback to the global current velocity
            velocity = submarineModule.currentVelocity;
          }
          
          // Make sure velocity is clamped to a valid range
          velocity = Math.min(1.0, Math.max(0, velocity));
          
          // Update speedometer with velocity and current max speed
          speedometerInstance.update(velocity, displayMaxSpeed);
        }
        
        // Try to get latest submarine update
        try {
          // Get the submarine object from the most recent updatePlayerSubmarine call
          // This gives us the most accurate velocity including vertical movement
          const scene = window.currentScene;
          if (scene && scene.playerSubmarine) {
            submarineInstance = submarineModule.updatePlayerSubmarine(scene.playerSubmarine);
          }
        } catch (error) {
          // Ignore errors, we'll just use the global velocity
        }
        
        requestAnimationFrame(updateSpeedometer);
      }
      
      // Start the update loop
      updateSpeedometer();
    });
  });
}

/**
 * Initialize all slider controls with default values
 */
// initSliders est maintenant dans controls/sliders.js

/**
 * Initialize camera control sliders
 */
// initCameraSliders, updateCameraUIControls et updateSliderLabels
// sont maintenant dans controls/cameraControls.js

/**
 * Setup MutationObserver to watch overlay visibility changes
 */
// setupOverlayObserver est maintenant dans components/overlayObserver.js

/**
 * Show all UI elements when overlay is dismissed
 */
// showAllUIElements est maintenant dans components/visibility.js

/**
 * Setup minimap buttons and their functionality
 */
// setupMinimapButtons est maintenant dans minimap/minimapButtons.js

/**
 * Fix compass positioning on the minimap
 */
// fixCompassPosition est maintenant dans minimap/compass.js

/**
 * Fix minimap container layout
 */
// fixMinimapContainerLayout est maintenant dans minimap/minimapLayout.js

/**
 * Fix minimap button styling
 */
// fixMinimapButtonStyling est maintenant dans minimap/minimapLayout.js
