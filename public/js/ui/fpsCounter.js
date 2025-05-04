// ui/fpsCounter.js - Handles FPS counting and display

// FPS tracking state
const fpsState = {
  lastUpdate: 0,
  frameCount: 0,
  fps: 0,
  updateInterval: 500 // Update interval in ms
};

/**
 * Initialize the FPS counter
 * @param {number} updateInterval - Interval in ms between FPS updates
 */
export function initFpsCounter(updateInterval = 500) {
  fpsState.lastUpdate = performance.now();
  fpsState.frameCount = 0;
  fpsState.fps = 0;
  fpsState.updateInterval = updateInterval;
  
  // Create FPS counter element if it doesn't exist
  if (!document.getElementById('fps-counter')) {
    const fpsDiv = document.createElement('div');
    fpsDiv.id = 'fps-counter';
    fpsDiv.style.position = 'absolute';
    fpsDiv.style.top = '10px';
    fpsDiv.style.left = '10px';
    fpsDiv.style.color = 'white';
    fpsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    fpsDiv.style.padding = '5px';
    fpsDiv.style.borderRadius = '3px';
    fpsDiv.style.zIndex = '1000';
    fpsDiv.textContent = 'FPS: 0';
    document.body.appendChild(fpsDiv);
  }
}

/**
 * Update the FPS counter
 * @returns {number} - Current FPS value
 */
export function updateFpsCounter() {
  fpsState.frameCount++;
  
  const now = performance.now();
  const elapsed = now - fpsState.lastUpdate;
  
  if (elapsed > fpsState.updateInterval) {
    fpsState.fps = Math.round(fpsState.frameCount * 1000 / elapsed);
    fpsState.lastUpdate = now;
    fpsState.frameCount = 0;
    
    // Update the FPS counter element
    const fpsElement = document.getElementById('fps-counter');
    if (fpsElement) {
      fpsElement.textContent = `FPS: ${fpsState.fps}`;
    }
  }
  
  return fpsState.fps;
}

/**
 * Get the current FPS
 * @returns {number} - Current FPS value
 */
export function getCurrentFps() {
  return fpsState.fps;
}

/**
 * Enable or disable FPS display
 * @param {boolean} visible - Whether the FPS counter should be visible
 */
export function setFpsCounterVisible(visible) {
  const fpsElement = document.getElementById('fps-counter');
  if (fpsElement) {
    fpsElement.style.display = visible ? 'block' : 'none';
  }
}
