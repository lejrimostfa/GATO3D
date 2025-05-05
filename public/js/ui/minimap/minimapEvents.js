// ui/minimap/minimapEvents.js
// Connecte les événements de la minimap entre les nouveaux modules refactorisés et le module principal

import { setMinimapZoom, setMinimapRotating } from '../minimap.js';

/**
 * Initialise les écouteurs d'événements pour la minimap
 */
export function setupMinimapEventListeners() {
  // console.log('[UI:Minimap:Events] Setting up minimap event listeners');
  
  // Écouter l'événement de changement de zoom
  window.addEventListener('minimap-zoom-change', (event) => {
    if (event.detail && typeof event.detail.zoom === 'number') {
      // console.log(`[UI:Minimap:Events] Received zoom change event: ${event.detail.zoom}`);
      // Appeler la fonction dans le module minimap.js principal
      setMinimapZoom(event.detail.zoom);
    }
  });
  
  // Écouter l'événement de changement de rotation
  window.addEventListener('minimap-rotation-change', (event) => {
    if (event.detail && typeof event.detail.rotating === 'boolean') {
      // console.log(`[UI:Minimap:Events] Received rotation change event: ${event.detail.rotating ? 'enabled' : 'disabled'}`);
      // Appeler la fonction dans le module minimap.js principal
      setMinimapRotating(event.detail.rotating);
    }
  });
  
  // console.log('[UI:Minimap:Events] Minimap event listeners initialized');
}
