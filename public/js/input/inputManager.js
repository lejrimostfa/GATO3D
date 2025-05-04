// input/inputManager.js
// Centralized input management for keyboard and game controls

import { elements } from '../ui/domElements.js';

// Key state tracking
export const keys = {};

/**
 * Initialize the input management system
 */
export function initInputManager() {
  console.log('[INPUT] Initializing input manager');
  
  // Set up keyboard events
  setupKeyboardEvents();
  
  // Set up button handlers
  setupButtonEvents();
}

/**
 * Set up keyboard event handlers
 */
function setupKeyboardEvents() {
  // Key down handler
  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    
    // Skip if key is already pressed (prevents key repeat)
    if (keys[key]) return;
    
    // Update key state in centralized location
    keys[key] = true;
    
    // For special game controls (like pause)
    handleSpecialKeys(key, true);
  });
  
  // Key up handler
  window.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    
    // Update key state in centralized location
    keys[key] = false;
  });
}

/**
 * Handle special key actions like pause
 * @param {string} key - The key that was pressed
 * @param {boolean} isDown - Whether the key is pressed down
 */
function handleSpecialKeys(key, isDown) {
  // Only process on key down
  if (!isDown) return;
  
  // Toggle pause when P is pressed
  if (key === 'p') {
    import('../time/timeManager.js').then(module => {
      if (module.toggleTimePause) {
        module.toggleTimePause();
      }
    });
  }
}

/**
 * Set up button event handlers
 */
function setupButtonEvents() {
  const { btnCreate, btnJoin, btnEditor } = elements;
  
  // Create game button
  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      startGame();
      // future: initP2P(true);
    });
  }
  
  // Join game button
  if (btnJoin) {
    btnJoin.addEventListener('click', () => {
      startGame();
      // future: initP2P(false);
    });
  }
  
  // Editor button
  if (btnEditor) {
    btnEditor.addEventListener('click', async () => {
      await launchEditor();
    });
  }
}

/**
 * Start the game
 */
function startGame() {
  const { overlay, uiBottomBar } = elements;
  
  // Hide overlay
  if (overlay) {
    overlay.style.display = 'none';
  }
  
  // Show UI
  if (uiBottomBar) {
    uiBottomBar.style.display = 'flex';
  }
}

/**
 * Launch the editor
 */
async function launchEditor() {
  const { 
    overlay, uiBottomBar, uiMinimap, uiMenus, 
    hud, depthIndicator 
  } = elements;
  
  // Hide overlay
  if (overlay) {
    overlay.style.display = 'none';
  }
  
  // Hide all game UI elements
  if (uiBottomBar) uiBottomBar.style.display = 'none';
  if (uiMinimap) uiMinimap.style.display = 'none';
  if (uiMenus) uiMenus.style.display = 'none';
  if (hud) hud.style.display = 'none';
  if (depthIndicator) depthIndicator.style.display = 'none';
  
  // Safety: force periodic hiding of UI
  window.__editorHideUIInterval = setInterval(() => {
    if (uiBottomBar) uiBottomBar.style.display = 'none';
    if (uiMinimap) uiMinimap.style.display = 'none';
    if (uiMenus) uiMenus.style.display = 'none';
    if (hud) hud.style.display = 'none';
    if (depthIndicator) depthIndicator.style.display = 'none';
  }, 500);
  
  // Launch the editor
  const editor = await import('../editor.js');
  if (editor && editor.initEditor) editor.initEditor();
}
