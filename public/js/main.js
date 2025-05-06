// GATO3D - Main Entry Point
// Fully modular architecture
// console.log('main.js loaded - fully modular version');

// Import modular system components
import { initDOMElements, elements } from './ui/domElements.js';
import { initUI } from './ui/uiManager.js';
import { initInputManager } from './input/inputManager.js';
import { initGame } from './game/gameInit.js';
import { initResponsiveUI } from './ui/responsiveUI.js';
import { reconnectSliders } from './ui/sliderConnector.js';

// Application entry point
(function() {
  // console.log('[MAIN] Starting GATO3D application');
  
  // Ensure the DOM is fully loaded before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
  } else {
    // DOM already loaded, initialize immediately
    initializeApplication();
  }
  
  /**
   * Initialize the application with proper sequencing
   */
  function initializeApplication() {
    // console.log('[MAIN] DOM loaded, initializing components');
    
    // Directly access the game canvas to ensure it exists
    const gameCanvas = document.getElementById('gameCanvas');
    
    if (!gameCanvas) {
      console.error('[MAIN] Critical element gameCanvas not found on page');
      // console.log('[MAIN] Attempting to reinitialize in 100ms...');
      
      // Try again after a short delay (sometimes the DOM isn't fully ready)
      setTimeout(initializeApplication, 100);
      return;
    }
    
    // Now that we confirmed the canvas exists, initialize DOM elements
    const elementsInitialized = initDOMElements();
    
    if (!elementsInitialized) {
      console.error('[MAIN] Failed to initialize DOM elements. Critical elements missing.');
      displayErrorMessage('Failed to initialize application. Please ensure the page is properly loaded.');
      return;
    }
    
    // Step 2: Initialize input system
    initInputManager();
    
    // Step 3: Initialize UI components
    initUI();
    reconnectSliders();
    
    // Step 4: Initialize and start the game
    initGame(() => {
      // Step 5: Initialize responsive UI handling after game is loaded
      initResponsiveUI();
      // console.log('[MAIN] Application fully initialized');
    });
  }
  
  /**
   * Display an error message to the user
   * @param {string} message - The error message to display
   */
  function displayErrorMessage(message) {
    // Try to find the overlay element
    const overlay = document.getElementById('overlay');
    
    if (overlay) {
      // Create an error message element
      const errorDiv = document.createElement('div');
      errorDiv.style.color = 'red';
      errorDiv.style.fontSize = '18px';
      errorDiv.style.padding = '20px';
      errorDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
      errorDiv.style.borderRadius = '5px';
      errorDiv.style.maxWidth = '80%';
      errorDiv.style.margin = '0 auto';
      errorDiv.innerHTML = `<p>⚠️ ${message}</p><p>Please refresh the page or check the console for more details.</p>`;
      
      // Add it to the overlay
      overlay.appendChild(errorDiv);
    } else {
      // Fallback to an alert if overlay not found
      alert(message);
    }
  }
})();

// All the rest of the code has been removed and modularized into specialized modules
// See respective modules for implementation details:
// - UI components: /js/ui/*
// - Input handling: /js/input/*
// - Game initialization: /js/game/*
// - Responsive UI: /js/ui/responsiveUI.js