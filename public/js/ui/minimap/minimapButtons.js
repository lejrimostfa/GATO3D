// ui/minimap/minimapButtons.js
// Gestion des boutons de la minimap

import { elements } from '../domElements.js';

/**
 * Setup minimap buttons and their functionality
 */
export function setupMinimapButtons() {
  // Récupérer directement les éléments DOM si nécessaire
  let minimapZoomIn = elements.minimapZoomIn || document.getElementById('minimap-zoom-in');
  let minimapZoomOut = elements.minimapZoomOut || document.getElementById('minimap-zoom-out');
  let minimapRotationToggle = elements.minimapRotationToggle || document.getElementById('minimap-rotation-toggle');
  let minimap = elements.minimap || document.getElementById('minimap');
  
  // Vérifier que tous les éléments nécessaires sont disponibles
  if (!minimap) {
    console.warn('[UI:Minimap] Minimap canvas element not found');
    return;
  }
  
  // Si un des boutons est manquant, essayer de les récupérer à nouveau
  if (!minimapZoomIn || !minimapZoomOut || !minimapRotationToggle) {
    console.warn('[UI:Minimap] Some buttons are missing, trying alternative selectors');
    minimapZoomIn = minimapZoomIn || document.querySelector('#minimap-zoom-in');
    minimapZoomOut = minimapZoomOut || document.querySelector('#minimap-zoom-out');
    minimapRotationToggle = minimapRotationToggle || document.querySelector('#minimap-rotation-toggle');
    
    // Mettre à jour elements si des éléments ont été trouvés
    if (minimapZoomIn && !elements.minimapZoomIn) elements.minimapZoomIn = minimapZoomIn;
    if (minimapZoomOut && !elements.minimapZoomOut) elements.minimapZoomOut = minimapZoomOut;
    if (minimapRotationToggle && !elements.minimapRotationToggle) elements.minimapRotationToggle = minimapRotationToggle;
  }
  
  // Vérifier à nouveau après avoir essayé d'autres sélecteurs
  if (!minimapZoomIn || !minimapZoomOut || !minimapRotationToggle) {
    console.error('[UI:Minimap] Critical minimap buttons still missing after fallback attempts');
    return;
  }
  
  // console.log('[UI:Minimap] All minimap elements found, setting up button handlers');
  
  // console.log('[UI:Minimap] Setting up minimap buttons');
  
  // Initialize minimap zoom with default values
  let minimapZoom = 2000;
  let isRotating = false; // Start in fixed north mode
  
  // Update button styles to reflect initial state
  if (minimapRotationToggle) {
    minimapRotationToggle.innerHTML = isRotating ? '🔄' : '🧭';
    minimapRotationToggle.title = isRotating ? 'Switch to fixed north' : 'Switch to auto-rotate';
  }
  
  // Add click handler for zoom in (fixed 500 unit steps)
  minimapZoomIn.onclick = () => {
    minimapZoom = Math.max(500, minimapZoom - 500);
    // console.log(`[UI:Minimap] Zoom in: ${minimapZoom} units`);
    
    // Dispatch custom event to notify the minimap renderer
    window.dispatchEvent(new CustomEvent('minimap-zoom-change', {
      detail: { zoom: minimapZoom }
    }));
  };
  
  // Add click handler for zoom out (fixed 500 unit steps)
  minimapZoomOut.onclick = () => {
    minimapZoom = Math.min(5000, minimapZoom + 500);
    // console.log(`[UI:Minimap] Zoom out: ${minimapZoom} units`);
    
    // Dispatch custom event to notify the minimap renderer
    window.dispatchEvent(new CustomEvent('minimap-zoom-change', {
      detail: { zoom: minimapZoom }
    }));
  };
  
  // Add click handler for rotation toggle
  minimapRotationToggle.onclick = () => {
    isRotating = !isRotating;
    // console.log(`[UI:Minimap] Rotation mode: ${isRotating ? 'auto-rotate' : 'fixed north'}`);
    
    // Update button display
    minimapRotationToggle.innerHTML = isRotating ? '🔄' : '🧭';
    minimapRotationToggle.title = isRotating ? 'Switch to fixed north' : 'Switch to auto-rotate';
    
    // Dispatch custom event to notify the minimap renderer
    window.dispatchEvent(new CustomEvent('minimap-rotation-change', {
      detail: { rotating: isRotating }
    }));
  };
  
  // Set initial zoom level
  window.dispatchEvent(new CustomEvent('minimap-zoom-change', {
    detail: { zoom: minimapZoom }
  }));
  
  // Set initial rotation mode
  window.dispatchEvent(new CustomEvent('minimap-rotation-change', {
    detail: { rotating: isRotating }
  }));
}
