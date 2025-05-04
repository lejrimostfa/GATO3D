// ui/minimap/minimapLayout.js
// Gestion du layout et du styling de la minimap

import { elements } from '../domElements.js';

/**
 * Fix minimap container layout
 */
export function fixMinimapContainerLayout() {
  // Utiliser des sélecteurs plus stricts et faire un fallback sur getElementById si nécessaire
  const minimapContainer = document.querySelector('.minimap-container') || document.querySelector('#ui-minimap-area .minimap-container');
  const minimapGroup = document.querySelector('.minimap-group') || document.querySelector('#ui-minimap-area .minimap-group');
  const btnGroup = document.querySelector('.minimap-btns-group') || document.querySelector('#ui-minimap-area .minimap-btns-group');
  
  if (!minimapContainer || !minimapGroup) {
    console.warn('[UI:Minimap] Minimap container or group not found');
    return;
  }
  
  console.log('[UI:Minimap] Fixing minimap container layout');
  
  // Setup proper container styling (but don't change visibility yet)
  minimapContainer.style.position = 'relative';
  minimapContainer.style.alignItems = 'center';
  minimapContainer.style.justifyContent = 'center';
  minimapContainer.style.zIndex = '100'; // S'assurer que la minimap reste sous l'overlay (z-index 1000)
  
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
export function fixMinimapButtonStyling() {
  // S'assurer que nous avons les éléments directement si nécessaire
  const minimapZoomIn = elements.minimapZoomIn || document.getElementById('minimap-zoom-in');
  const minimapZoomOut = elements.minimapZoomOut || document.getElementById('minimap-zoom-out');
  const minimapRotationToggle = elements.minimapRotationToggle || document.getElementById('minimap-rotation-toggle');
  const minimap = elements.minimap || document.getElementById('minimap');
  
  if (!minimap) {
    console.warn('[UI:Minimap] Minimap element not found, cannot style buttons');
    return;
  }
  
  // Mettre à jour elements si nécessaire
  if (!elements.minimapZoomIn && minimapZoomIn) elements.minimapZoomIn = minimapZoomIn;
  if (!elements.minimapZoomOut && minimapZoomOut) elements.minimapZoomOut = minimapZoomOut;
  if (!elements.minimapRotationToggle && minimapRotationToggle) elements.minimapRotationToggle = minimapRotationToggle;
  
  // Get dimensions
  const minimapSize = minimap.width || 200;
  const btnSize = Math.max(24, minimapSize * 0.18);
  
  console.log(`[UI:Minimap] Fixing minimap button styling: map size=${minimapSize}, btn size=${btnSize}`);
  
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
    // Assurer que le bouton est visible et clickable  
    minimapRotationToggle.style.position = 'absolute';
    minimapRotationToggle.style.top = '10px';
    minimapRotationToggle.style.right = '10px';
    minimapRotationToggle.style.width = btnSize + 'px';
    minimapRotationToggle.style.height = btnSize + 'px';
    minimapRotationToggle.style.fontSize = (btnSize * 0.48) + 'px';
    minimapRotationToggle.style.lineHeight = btnSize + 'px';
    minimapRotationToggle.style.textAlign = 'center';
    minimapRotationToggle.style.borderRadius = (btnSize * 0.28) + 'px';
    minimapRotationToggle.style.backgroundColor = '#111c';
    minimapRotationToggle.style.color = '#0ff';
    minimapRotationToggle.style.border = '1px solid #0ff';
    minimapRotationToggle.style.cursor = 'pointer';
    minimapRotationToggle.style.zIndex = '150'; // S'assurer que le bouton est au-dessus de la minimap
    minimapRotationToggle.style.display = 'block'; // Forcer l'affichage
  }
}
