// ui/minimap/minimapManager.js
// Module principal de gestion de la minimap

import { setupMinimapButtons } from './minimapButtons.js';
import { fixMinimapContainerLayout, fixMinimapButtonStyling } from './minimapLayout.js';
import { fixCompassPosition } from './compass.js';
import { setupMinimapEventListeners } from './minimapEvents.js';
import { elements, getElement } from '../domElements.js';

/**
 * Initialize all minimap components
 */
export function initMinimap() {
  // console.log('[UI:Minimap] Initializing minimap components');
  
  // Assurer que tous les éléments de minimap sont correctement référencés
  // Récupérer directement les éléments sans passer par elements qui peut être incomplet
  elements.minimap = elements.minimap || document.getElementById('minimap');
  elements.minimapZoomIn = elements.minimapZoomIn || document.getElementById('minimap-zoom-in');
  elements.minimapZoomOut = elements.minimapZoomOut || document.getElementById('minimap-zoom-out');
  elements.minimapRotationToggle = elements.minimapRotationToggle || document.getElementById('minimap-rotation-toggle');
  
  // Vérifier à nouveau si l'élément principal est disponible
  if (!elements.minimap) {
    console.warn('[UI:Minimap] Minimap canvas element not found');
    return;
  }
  
  // console.log('[UI:Minimap] Elements: minimap=' + (elements.minimap ? 'OK' : 'missing') + 
  //             ', zoom-in=' + (elements.minimapZoomIn ? 'OK' : 'missing') + 
  //             ', zoom-out=' + (elements.minimapZoomOut ? 'OK' : 'missing') + 
  //             ', rotation=' + (elements.minimapRotationToggle ? 'OK' : 'missing'));
  
  // Configurer le conteneur et le layout de la minimap
  fixMinimapContainerLayout();
  
  // Configurer la boussole
  fixCompassPosition();
  
  // Configurer les boutons de la minimap et leurs gestionnaires d'événements
  setupMinimapButtons();
  
  // Appliquer le style aux éléments de la minimap
  fixMinimapButtonStyling();
  
  // Configurer le gestionnaire d'événements pour l'adaptation responsive
  window.addEventListener('resize', () => {
    // console.log('[UI:Minimap] Window resize detected, adjusting minimap components');
    fixMinimapContainerLayout();
    fixCompassPosition();
    fixMinimapButtonStyling();
  });
  
  // Configurer les écouteurs d'événements pour connecter les boutons à la minimap.js principale
  setupMinimapEventListeners();
  
  // console.log('[UI:Minimap] Minimap initialization complete');
}
