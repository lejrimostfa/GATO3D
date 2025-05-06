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
import { initHelpOverlay } from './helpOverlay.js';

// UI state variables
let speedometerInstance = null;
let depthMeterInstance = null;

/**
 * Initialize all UI components
 * @param {Function} onComplete - Callback when all UI is initialized
 */
export function initUI(onComplete) {
  // console.log('[UI] Initializing UI components');
  
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
  initDepthMeter(); // Ajout du depth meter
  initMinimap();
  
  // Initialiser l'overlay d'aide (bouton "?") - toujours visible
  initHelpOverlay();
  
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
    
    // Définir une taille fixe pour l'horloge et le speedomètre (la même pour les deux)
    const uiComponentSize = Math.min(window.innerWidth, window.innerHeight) * 0.18;
    
    // Définir la même taille pour les deux composants
    clockCanvas.width = uiComponentSize;
    clockCanvas.height = uiComponentSize;
    
    // Stocker la taille comme variable globale pour l'utiliser dans le speedomètre
    window.uiComponentSize = uiComponentSize;
    
    // console.log(`[UI:Clock] Initialized with size ${uiComponentSize}px`);
    
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
    // console.log('[UI] Initializing speedometer');
    speedometerInstance = module.initSpeedometer();
    
    // Start updating speedometer with submarine velocity and target speed
    import('../submarine/controls.js').then(submarineModule => {
      // Ne pas importer targetSpeed comme une constante locale puisqu'elle peut changer
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
          
          // Preserve the sign for direction (negative = backward, positive = forward)
          // but clamp the absolute value to a valid range
          if (velocity > 0) {
            velocity = Math.min(1.0, velocity);
          } else {
            velocity = Math.max(-1.0, velocity);
          }
          
          // Get normalized target speed for the second needle (palier)
          // Convert targetSpeed to 0-1 range for the speedometer
          // Obtenir la valeur targetSpeed depuis l'instance de sous-marin ou utiliser une valeur de secours
          let normalizedTargetSpeed = null;
          
          // Récupérer le targetSpeed depuis l'instance submarine si disponible
          let targetSpeedValue = null;
          if (submarineInstance && typeof submarineInstance.targetSpeed === 'number') {
            targetSpeedValue = submarineInstance.targetSpeed;
          } 
          
          // La valeur est valide et le displayMaxSpeed est supérieur à 0
          if (targetSpeedValue !== null && !isNaN(targetSpeedValue) && displayMaxSpeed > 0) {
            // Preserve the sign to indicate direction (negative for backward)
            const targetSpeedSign = Math.sign(targetSpeedValue);
            // Normalize the absolute value
            const normalizedAbsValue = Math.abs(targetSpeedValue) / displayMaxSpeed;
            // Apply the sign to keep direction information
            normalizedTargetSpeed = normalizedAbsValue * targetSpeedSign;
            
            // Ensure the normalized value is within valid range but preserve sign
            if (normalizedTargetSpeed > 0) {
              normalizedTargetSpeed = Math.min(1.0, normalizedTargetSpeed);
            } else {
              normalizedTargetSpeed = Math.max(-1.0, normalizedTargetSpeed);
            }
            
            // Pour le debug
            console.log(`[SPEEDOMETER] Target speed: ${targetSpeedValue}, Normalized: ${normalizedTargetSpeed}`);
          }
          
          // Update speedometer with velocity, current max speed, and target velocity (palier)
          // Only pass normalizedTargetSpeed if it's a valid number
          speedometerInstance.update(velocity, Math.max(0.1, displayMaxSpeed), normalizedTargetSpeed);
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
 * Initialize the depth meter UI
 */
function initDepthMeter() {
  import('./depthMeter.js').then(module => {
    // console.log('[UI] Initializing depth meter');
    depthMeterInstance = module.initDepthMeter();
    
    // Start updating depth meter with submarine depth
    import('../submarine/controls.js').then(submarineModule => {
      // Cache for submarine instance
      let submarineInstance = null;
      
      // Update the depth meter every frame
      function updateDepthMeter() {
        if (depthMeterInstance) {
          // Default max depth is 200 meters
          const maxDepth = 500; // Updated to match new maximum diving depth
          
          // Try to get depth from submarine instance
          let depth = 0;
          
          // Get submarine position if available
          try {
            const scene = window.currentScene;
            if (scene && scene.playerSubmarine) {
              // Dans notre système, la surface de l'eau est à Y=20
              const surfaceY = 20;
              
              // Calcul correct de la profondeur
              depth = surfaceY - scene.playerSubmarine.position.y;
              
              // Ajustement pour prendre en compte la position des enfants du sous-marin
              if (scene.playerSubmarine.children && scene.playerSubmarine.children[0]) {
                depth -= scene.playerSubmarine.children[0].position.y;
              }
              
              // Make sure depth is never negative (above water)
              depth = Math.max(0, depth);
              
              // Cache the submarine for additional data
              submarineInstance = submarineModule.updatePlayerSubmarine(scene.playerSubmarine);
            }
          } catch (error) {
            console.warn('[UI:DepthMeter] Error accessing submarine depth', error);
            // Keep last depth value if error
          }
          
          // Update the global depth value for other UI components
          window.currentDepth = depth;
          
          // Update depth meter display
          depthMeterInstance.update(depth, maxDepth);
        }
        
        requestAnimationFrame(updateDepthMeter);
      }
      
      // Start the update loop
      updateDepthMeter();
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
