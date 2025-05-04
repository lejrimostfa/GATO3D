// ui/uiManager.js
// Centralized UI initialization and management

import { elements, initDOMElements } from './domElements.js';
import { initMenus } from './menus.js';
import { drawClockFace, drawTime } from './clock.js';
import { initDayDurationSlider } from './time-slider.js';
import { updateHudVisibility } from './hud.js';
import { setCameraFollowParams } from '../camera/followCamera.js';
import { setDayDuration } from '../time/timeManager.js';

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
  
  // Hide all UI elements initially
  hideAllUIElements();
  
  // Initialize UI components
  initMenuPanels();
  initClockUI();
  initSliders();
  initSpeedometer();
  setupMinimapButtons();
  
  // Initialize HUD visibility
  updateHudVisibility();
  
  // Setup visibility observer for the overlay
  setupOverlayObserver();
  
  if (onComplete) {
    onComplete();
  }
}

/**
 * Hide all UI elements on startup
 */
function hideAllUIElements() {
  console.log('[UI] Hiding all UI elements initially');
  
  // Get UI elements
  const { 
    uiMenus, 
    uiBottomBar, 
    hud, 
    depthIndicator,
    speedometerCanvas,
    clockCanvas
  } = elements;
  
  // Hide main UI containers
  if (uiMenus) {
    uiMenus.style.display = 'none';
  }
  
  if (uiBottomBar) {
    uiBottomBar.style.display = 'none';
  }
  
  // Hide individual UI components
  if (depthIndicator) {
    depthIndicator.style.display = 'none';
  }
  
  if (speedometerCanvas) {
    speedometerCanvas.style.display = 'none';
  }
  
  if (clockCanvas) {
    clockCanvas.style.display = 'none';
  }
  
  // Hide HUD
  if (hud) {
    hud.style.display = 'none';
  }
  
  // Also hide any minimap related elements
  const minimapArea = document.getElementById('ui-minimap-area');
  if (minimapArea) {
    minimapArea.style.display = 'none';
  }
  
  console.log('[UI] All UI elements are now hidden until overlay is closed');
}

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
function initSliders() {
  initCameraSliders();
  initDayDurationSlider(value => {
    setDayDuration(value);
  });
}

/**
 * Initialize camera control sliders
 */
function initCameraSliders() {
  const { 
    cameraSlider, dampingSlider, altitudeSlider,
    cameraLabel, dampingLabel, altitudeLabel 
  } = elements;
  
  // Set default values on the sliders
  if (cameraSlider) {
    cameraSlider.value = 250; // Camera distance
    if (cameraLabel) cameraLabel.textContent = `Camera: 250`;
  }
  
  if (dampingSlider) {
    dampingSlider.value = 0.005; // Damping value
    if (dampingLabel) dampingLabel.textContent = `Damping: 0.005`;
  }
  
  if (altitudeSlider) {
    altitudeSlider.value = 60; // Camera altitude
    if (altitudeLabel) altitudeLabel.textContent = `Altitude: 60`;
  }
  
  // Initialize the camera with these values
  updateCameraUIControls();
  
  // Add input event listener for camera controls
  window.addEventListener('input', event => {
    if (event.target && (
        event.target.id === 'camera-slider' ||
        event.target.id === 'damping-slider' ||
        event.target.id === 'altitude-slider'
      )) {
      updateCameraUIControls();
    }
  });
}

/**
 * Update camera controls based on slider values
 */
export function updateCameraUIControls() {
  const { 
    cameraSlider, dampingSlider, altitudeSlider, altitudeLabel 
  } = elements;
  
  // Read camera distance from slider
  let camDist = 130;
  if (cameraSlider) camDist = parseFloat(cameraSlider.value);
  
  // Read damping from slider
  let damping = 0.03;
  if (dampingSlider) damping = parseFloat(dampingSlider.value);
  
  // Read altitude from slider
  let camAltitude = 15;
  if (altitudeSlider) camAltitude = parseFloat(altitudeSlider.value);
  if (altitudeLabel) altitudeLabel.textContent = `Altitude: ${camAltitude}`;
  
  // Update camera follow parameters
  setCameraFollowParams(camDist, damping, camAltitude);
}

/**
 * Setup MutationObserver to watch overlay visibility changes
 */
function setupOverlayObserver() {
  const { overlay } = elements;
  
  if (overlay) {
    const observer = new MutationObserver((mutations) => {
      // Check if overlay is being hidden
      if (mutations.some(m => 
        m.type === 'attributes' && 
        m.attributeName === 'style' && 
        overlay.style.display === 'none'
      )) {
        console.log('[UI] Overlay hidden, showing UI elements');
        showAllUIElements();
      }
    });
    
    // Observe style changes on the overlay
    observer.observe(overlay, { 
      attributes: true, 
      attributeFilter: ['style'] 
    });
  }
}

/**
 * Show all UI elements when overlay is dismissed
 */
function showAllUIElements() {
  console.log('[UI] Showing all UI elements');
  
  // Get UI elements
  const { 
    uiMenus, 
    uiBottomBar, 
    hud, 
    depthIndicator,
    speedometerCanvas,
    clockCanvas
  } = elements;
  
  // Show main UI containers
  if (uiBottomBar) {
    uiBottomBar.style.display = 'flex';
    console.log('[UI] Bottom bar now visible');
  }
  
  if (uiMenus) {
    uiMenus.style.display = 'block';
    console.log('[UI] UI menus now visible');
  }
  
  // Show individual UI components
  if (depthIndicator) {
    depthIndicator.style.display = 'flex';
  }
  
  if (speedometerCanvas) {
    speedometerCanvas.style.display = 'block';
  }
  
  if (clockCanvas) {
    clockCanvas.style.display = 'block';
  }
  
  // Show HUD
  if (hud) {
    hud.style.display = 'block';
  }
  
  // Also show minimap related elements
  const minimapArea = document.getElementById('ui-minimap-area');
  if (minimapArea) {
    minimapArea.style.display = 'flex';
  }
  
  // Set up minimap layout
  const minimapContainer = document.querySelector('.minimap-container');
  const minimapGroup = document.querySelector('.minimap-group');
  const btnGroup = document.querySelector('.minimap-btns-group');
  
  if (minimapContainer) minimapContainer.style.display = 'flex';
  if (minimapGroup) minimapGroup.style.display = 'flex';
  if (btnGroup) btnGroup.style.display = 'flex';
  
  // Update HUD visibility (moved from overlay observer)
  updateHudVisibility();
  
  console.log('[UI] All UI elements are now visible');
}

/**
 * Setup minimap buttons and their functionality
 */
function setupMinimapButtons() {
  const { minimapZoomIn, minimapZoomOut, minimapRotationToggle, minimap } = elements;
  
  if (!minimapZoomIn || !minimapZoomOut || !minimapRotationToggle || !minimap) {
    console.warn('[UI] Some minimap buttons are missing, cannot initialize minimap controls');
    return;
  }
  
  console.log('[UI] Setting up minimap buttons');
  
  // Fix compass positioning
  fixCompassPosition();
  
  // Fix button container styling
  fixMinimapContainerLayout();
  
  // Import minimap control functions
  import('./minimap.js').then(({ setMinimapZoom, setMinimapRotating, minimapZoom, MINIMAP_ZOOM_MIN, MINIMAP_ZOOM_MAX, getZoomStep }) => {
    // Fix button positioning
    fixMinimapButtonStyling();
    
    // Add click handler for zoom in (fixed 500 unit steps)
    minimapZoomIn.onclick = () => {
      // Always use 500 as step size
      const zoomStep = 500;
      // Get the current zoom value from the module
      import('./minimap.js').then(module => {
        // Apply zoom, will be bounded by min/max in setMinimapZoom
        const currentZoom = module.minimapZoom;
        const newZoom = currentZoom - zoomStep;
        console.log(`[UI] Minimap zoom in: ${currentZoom} -> ${newZoom} (step: ${zoomStep})`);
        setMinimapZoom(newZoom);
      });
    };
    
    // Add click handler for zoom out (fixed 500 unit steps)
    minimapZoomOut.onclick = () => {
      // Always use 500 as step size
      const zoomStep = 500;
      // Get the current zoom value from the module
      import('./minimap.js').then(module => {
        // Apply zoom, will be bounded by min/max in setMinimapZoom
        const currentZoom = module.minimapZoom;
        const newZoom = currentZoom + zoomStep;
        console.log(`[UI] Minimap zoom out: ${currentZoom} -> ${newZoom} (step: ${zoomStep})`);
        setMinimapZoom(newZoom);
      });
    };
    
    // Keep track of rotation state
    let rotationActive = false;
    
    // Set initial styles for rotation toggle
    minimapRotationToggle.textContent = rotationActive ? 'O' : 'X';
    minimapRotationToggle.style.background = rotationActive ? '#0ff' : '#111c';
    minimapRotationToggle.style.color = rotationActive ? '#111' : '#0ff';
    
    // Add click handler for rotation toggle
    minimapRotationToggle.onclick = () => {
      rotationActive = !rotationActive;
      setMinimapRotating(rotationActive);
      
      // Visual feedback
      minimapRotationToggle.textContent = rotationActive ? 'O' : 'X';
      minimapRotationToggle.style.background = rotationActive ? '#0ff' : '#111c';
      minimapRotationToggle.style.color = rotationActive ? '#111' : '#0ff';
      
      console.log(`[UI] Minimap rotation ${rotationActive ? 'enabled' : 'disabled'}`);
    };
  }).catch(error => {
    console.error('[UI] Error setting up minimap buttons:', error);
  });
}

/**
 * Fix compass positioning on the minimap
 */
function fixCompassPosition() {
  const compass = document.getElementById('compass');
  const minimap = document.getElementById('minimap');
  
  if (!compass || !minimap) {
    console.warn('[UI] Compass or minimap not found, cannot fix compass positioning');
    return;
  }
  
  console.log('[UI] Fixing compass positioning');
  
  // Get minimap dimensions and calculate compass size & position
  const minimapWidth = minimap.width || 200;
  const compassSize = Math.max(38, minimapWidth * 0.15);
  
  // Set compass attributes and position
  compass.setAttribute('width', compassSize);
  compass.setAttribute('height', compassSize);
  compass.style.position = 'absolute';
  compass.style.bottom = '10px';
  compass.style.right = '10px';
  
  // Update compass SVG elements
  const circle = compass.querySelector('circle');
  const polygon = compass.querySelector('polygon');
  const text = compass.querySelector('text');
  
  if (circle && polygon && text) {
    // Center point for the SVG elements
    const center = compassSize / 2;
    const radius = (compassSize / 2) - 2;
    
    // Update circle attributes
    circle.setAttribute('cx', center);
    circle.setAttribute('cy', center);
    circle.setAttribute('r', radius);
    
    // Update north pointer (triangle)
    const topY = center - radius + 2;
    const bottomY = center;
    const leftX = center - 4;
    const rightX = center + 4;
    polygon.setAttribute('points', `${center},${topY} ${leftX},${bottomY} ${rightX},${bottomY}`);
    
    // Update text position
    text.setAttribute('x', center);
    text.setAttribute('y', center + radius + 8);
    text.setAttribute('font-size', compassSize * 0.25);
  }
}

/**
 * Fix minimap container layout
 */
function fixMinimapContainerLayout() {
  const minimapContainer = document.querySelector('.minimap-container');
  const minimapGroup = document.querySelector('.minimap-group');
  const btnGroup = document.querySelector('.minimap-btns-group');
  
  if (!minimapContainer || !minimapGroup) {
    console.warn('[UI] Minimap container or group not found');
    return;
  }
  
  console.log('[UI] Fixing minimap container layout');
  
  // Setup proper container styling (but don't change visibility yet)
  minimapContainer.style.position = 'relative';
  minimapContainer.style.alignItems = 'center';
  minimapContainer.style.justifyContent = 'center';
  
  // Fix minimap group styling
  minimapGroup.style.alignItems = 'center';
  minimapGroup.style.justifyContent = 'center';
  minimapGroup.style.gap = '16px';
  
  // Fix button group styling if it exists
  if (btnGroup) {
    btnGroup.style.flexDirection = 'column';
    btnGroup.style.alignItems = 'center';
    btnGroup.style.justifyContent = 'center';
    btnGroup.style.gap = '8px';
  }
  
  // Don't force display properties here - let the overlay observer handle those
  // We'll set display styles only after the overlay is closed
}

/**
 * Fix minimap button styling and positioning
 */
function fixMinimapButtonStyling() {
  const { minimapZoomIn, minimapZoomOut, minimapRotationToggle, minimap } = elements;
  
  if (!minimap) return;
  
  // Get dimensions
  const minimapSize = minimap.width || 200;
  const btnSize = Math.max(24, minimapSize * 0.18);
  
  console.log(`[UI] Fixing minimap button styling: map size=${minimapSize}, btn size=${btnSize}`);
  
  // Style zoom buttons
  if (minimapZoomIn && minimapZoomOut) {
    // Style for + and - buttons
    [minimapZoomIn, minimapZoomOut].forEach(btn => {
      btn.style.width = btn.style.height = btnSize + 'px';
      btn.style.fontSize = (btnSize * 0.55) + 'px';
      btn.style.lineHeight = btnSize + 'px';
      btn.style.textAlign = 'center';
      btn.style.borderRadius = (btnSize * 0.28) + 'px';
      btn.style.backgroundColor = '#111c';
      btn.style.color = '#0ff';
      btn.style.border = '1px solid #0ff';
      btn.style.cursor = 'pointer';
    });
  }
  
  // Style rotation toggle button
  if (minimapRotationToggle) {
    minimapRotationToggle.style.position = 'absolute';
    minimapRotationToggle.style.top = '10px';
    minimapRotationToggle.style.right = '10px';
    minimapRotationToggle.style.width = minimapRotationToggle.style.height = btnSize + 'px';
    minimapRotationToggle.style.fontSize = (btnSize * 0.48) + 'px';
    minimapRotationToggle.style.lineHeight = btnSize + 'px';
    minimapRotationToggle.style.textAlign = 'center';
    minimapRotationToggle.style.borderRadius = (btnSize * 0.28) + 'px';
    minimapRotationToggle.style.backgroundColor = '#111c';
    minimapRotationToggle.style.color = '#0ff';
    minimapRotationToggle.style.border = '1px solid #0ff';
    minimapRotationToggle.style.cursor = 'pointer';
  }
}
