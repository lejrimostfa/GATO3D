// ui/components/overlayObserver.js
// Gestion de l'observation de l'overlay pour afficher/masquer l'UI

import { showAllUIElements } from './visibility.js';

/**
 * Setup MutationObserver to watch overlay visibility changes
 */
export function setupOverlayObserver() {
  console.log('[UI:Overlay] Setting up overlay visibility observer');
  
  const overlay = document.getElementById('overlay');
  if (!overlay) {
    console.warn('[UI:Overlay] Could not find overlay element');
    // Still show UI elements in case the overlay was already removed
    showAllUIElements();
    return;
  }
  
  // Ensure overlay has proper z-index to stay on top
  overlay.style.zIndex = '1000'; // Valeur élevée pour être au-dessus de tous les éléments UI
  
  // Create a new observer to watch for class or style changes on the overlay
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        (mutation.type === 'attributes' && 
         (mutation.attributeName === 'style' || mutation.attributeName === 'class'))
      ) {
        // Check if overlay is now hidden/removed
        const overlayHidden = 
          overlay.style.display === 'none' || 
          overlay.classList.contains('hidden') ||
          overlay.classList.contains('dismissed');
        
        if (overlayHidden) {
          console.log('[UI:Overlay] Overlay dismissed, showing UI elements');
          observer.disconnect(); // Stop observing once overlay is dismissed
          showAllUIElements();
        }
      }
    });
  });
  
  // Start observing the overlay element
  observer.observe(overlay, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  console.log('[UI:Overlay] Overlay observer setup complete');
}
