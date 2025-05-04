// ui/responsiveUI.js
// Responsive UI handling for window resize and responsive layouts

import { elements } from './domElements.js';

// References to renderer and camera (will be set during initialization)
let renderer = null;
let camera = null;

/**
 * Initialize the responsive UI system
 * @param {THREE.WebGLRenderer} rendererRef - The THREE.js renderer
 * @param {THREE.Camera} cameraRef - The THREE.js camera
 */
export function initResponsiveUI(rendererRef, cameraRef) {
  renderer = rendererRef;
  camera = cameraRef;
  
  // Add resize event listener
  window.addEventListener('resize', handleResize);
  
  // Initial resize to set everything up
  handleResize();
}

/**
 * Main resize event handler
 */
function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  
  // Update core rendering systems if available
  updateRenderer(w, h);
  
  // Update UI elements
  updateMinimapControls(w, h);
  updateHUDElements(w, h);
}

/**
 * Update THREE.js renderer and camera on resize
 */
function updateRenderer(w, h) {
  if (!renderer || !camera) return;
  
  // Update renderer size
  renderer.setSize(w, h);
  
  // Update camera aspect ratio
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/**
 * Update minimap and related controls on resize
 */
function updateMinimapControls(w, h) {
  const { 
    minimapZoomIn, minimapZoomOut, minimapRotationToggle, 
    minimapCanvas, compass 
  } = elements;
  
  // Skip if required elements are missing
  if (!minimapZoomIn || !minimapZoomOut || !minimapRotationToggle || !minimapCanvas) return;
  
  // Calculate minimap size based on screen dimensions
  const miniSize = minimapCanvas.offsetWidth || minimapCanvas.width || Math.min(w, h) * 0.22;
  const btnMini = Math.max(24, miniSize * 0.18);
  
  // Apply sizes to minimap controls
  applyMinimapButtonStyles(minimapZoomIn, btnMini, miniSize, 'bottom', 'right');
  applyMinimapButtonStyles(minimapZoomOut, btnMini, miniSize, 'bottom', 'left');
  applyMinimapButtonStyles(minimapRotationToggle, btnMini, miniSize, 'top', 'right');
  
  // Update compass size and position
  if (compass) {
    const compassSize = Math.floor(miniSize * 0.2);
    compass.setAttribute('width', compassSize);
    compass.setAttribute('height', compassSize);
    compass.style.position = 'absolute';
    compass.style.left = (miniSize * 0.04) + 'px';
    compass.style.top = (miniSize * 0.04) + 'px';
  }
}

/**
 * Apply styles to minimap buttons
 */
function applyMinimapButtonStyles(button, size, containerSize, vPos, hPos) {
  button.style.width = size + 'px';
  button.style.height = size + 'px';
  button.style.lineHeight = size + 'px';
  button.style.fontSize = (size * 0.48) + 'px';
  button.style.borderRadius = (size * 0.28) + 'px';
  button.style.position = 'absolute';
  button.style[vPos] = (containerSize * 0.04) + 'px';
  button.style[hPos] = (containerSize * 0.04) + 'px';
}

/**
 * Update HUD elements on resize
 */
function updateHUDElements(w, h) {
  const { minimapContainer, minimap } = elements;
  
  // Update minimap container and canvas
  if (minimapContainer && minimap) {
    const minSize = Math.min(w, h) * 0.22;
    minimapContainer.style.width = minSize + 'px';
    minimapContainer.style.height = minSize + 'px';
    minimap.width = minSize;
    minimap.height = minSize;
  }
}
