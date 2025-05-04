// ui/components/visibility.js
// Gestion de la visibilité des éléments UI

import { elements } from '../domElements.js';

/**
 * Hide all UI elements on startup
 */
export function hideAllUIElements(forceHide = false) {
  // Ne pas executer si cette fonction est appelée pendant le chargement initial et que l'overlay est visible
  // sauf si forceHide est true
  if (!forceHide) {
    const overlay = document.getElementById('overlay');
    if (overlay && (overlay.style.display !== 'none' && overlay.style.display !== '')) {
      console.log('[UI:Visibility] Skipping hide UI while overlay is active');
      return;
    }
  }
  console.log('[UI:Visibility] Hiding all UI elements initially');
  
  // Get UI elements
  const { 
    uiMenus, 
    uiBottomBar, 
    hud, 
    depthIndicator,
    speedometerCanvas,
    clockCanvas
  } = elements;
  
  // Hide main UI containers and set proper z-index
  if (uiMenus) {
    uiMenus.style.display = 'none';
    uiMenus.style.zIndex = '100'; // valeur inférieure à celle de l'overlay (1000)
  }
  
  if (uiBottomBar) {
    uiBottomBar.style.display = 'none';
    uiBottomBar.style.zIndex = '100';
  }
  
  // Hide individual UI components
  if (depthIndicator) {
    depthIndicator.style.display = 'none';
    depthIndicator.style.zIndex = '100';
  }
  
  if (speedometerCanvas) {
    speedometerCanvas.style.display = 'none';
    speedometerCanvas.style.zIndex = '100';
  }
  
  if (clockCanvas) {
    clockCanvas.style.display = 'none';
    clockCanvas.style.zIndex = '100';
  }
  
  // Hide HUD
  if (hud) {
    hud.style.display = 'none';
    hud.style.zIndex = '100';
  }
  
  // Also hide any minimap related elements
  const minimapArea = document.getElementById('ui-minimap-area');
  if (minimapArea) {
    minimapArea.style.display = 'none';
  }
  
  console.log('[UI:Visibility] All UI elements are now hidden until overlay is closed');
}

/**
 * Show all UI elements when overlay is dismissed
 */
export function showAllUIElements() {
  // Ne pas exécuter si cette fonction est appelée au chargement initial et que l'overlay est visible
  const overlay = document.getElementById('overlay');
  if (overlay && overlay.style.display !== 'none') {
    console.log('[UI:Visibility] Skipping show UI while overlay is active');
    return;
  }
  console.log('[UI:Visibility] Showing all UI elements');
  
  // Get UI elements
  const { 
    uiMenus, 
    uiBottomBar, 
    hud, 
    depthIndicator,
    speedometerCanvas,
    clockCanvas
  } = elements;
  
  // Show main UI containers with flex display - z-index déjà défini dans hideAllUIElements
  if (uiMenus) {
    uiMenus.style.display = 'flex';
  }
  
  if (uiBottomBar) {
    uiBottomBar.style.display = 'flex';
  }
  
  // Show individual UI components
  if (depthIndicator) {
    depthIndicator.style.display = 'block';
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
  
  // Show minimap related elements
  const minimapArea = document.getElementById('ui-minimap-area');
  if (minimapArea) {
    minimapArea.style.display = 'flex';
  }
  
  // Fix any styling/positioning that might be needed
  import('../minimap/minimapManager.js').then(module => {
    // Re-apply minimap styling after showing
    if (typeof module.initMinimap === 'function') {
      module.initMinimap();
    }
  });
  
  console.log('[UI:Visibility] All UI elements are now visible');
}

/**
 * Initialize UI visibility
 */
export function initUIVisibility() {
  // Initially hide all elements
  hideAllUIElements();
  
  // We'll show them when the overlay observer triggers
}
