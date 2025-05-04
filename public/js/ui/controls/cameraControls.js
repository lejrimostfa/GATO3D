// ui/controls/cameraControls.js
// Gestion des contrôles de caméra via l'interface utilisateur

import { elements } from '../domElements.js';
import { setCameraFollowParams } from '../../camera/followCamera.js';

/**
 * Initialize camera control sliders
 */
export function initCameraSliders() {
  console.log('[UI:Camera] Initializing camera control sliders');
  
  const { 
    cameraDistanceSlider,
    cameraHeightSlider,
    cameraSmoothnessSlider
  } = elements;
  
  // Skip if elements not found
  if (!cameraDistanceSlider || !cameraHeightSlider || !cameraSmoothnessSlider) {
    console.warn('[UI:Camera] Camera slider elements not found');
    return;
  }
  
  // Set initial values
  cameraDistanceSlider.value = 30;
  cameraHeightSlider.value = 12;
  cameraSmoothnessSlider.value = 0.05;
  
  // Display initial values in labels
  updateSliderLabels();
  
  // Add event listeners
  cameraDistanceSlider.addEventListener('input', updateCameraUIControls);
  cameraHeightSlider.addEventListener('input', updateCameraUIControls);
  cameraSmoothnessSlider.addEventListener('input', updateCameraUIControls);
  
  // Apply initial camera settings
  updateCameraUIControls();
  
  console.log('[UI:Camera] Camera sliders initialized');
}

/**
 * Update camera controls based on slider values
 */
export function updateCameraUIControls() {
  const { 
    cameraDistanceSlider,
    cameraHeightSlider,
    cameraSmoothnessSlider
  } = elements;
  
  // Skip if elements not found
  if (!cameraDistanceSlider || !cameraHeightSlider || !cameraSmoothnessSlider) {
    return;
  }
  
  // Get values
  const distance = parseFloat(cameraDistanceSlider.value);
  const height = parseFloat(cameraHeightSlider.value);
  const smoothness = parseFloat(cameraSmoothnessSlider.value);
  
  // Update camera parameters
  setCameraFollowParams({
    distance,
    height,
    smoothness
  });
  
  // Update labels
  updateSliderLabels();
}

/**
 * Update slider labels with current values
 */
function updateSliderLabels() {
  const { 
    cameraDistanceSlider,
    cameraHeightSlider,
    cameraSmoothnessSlider
  } = elements;
  
  // Get label elements
  const distanceLabel = document.getElementById('camera-distance-value');
  const heightLabel = document.getElementById('camera-height-value');
  const smoothnessLabel = document.getElementById('camera-smoothness-value');
  
  // Update labels if they exist
  if (distanceLabel && cameraDistanceSlider) {
    distanceLabel.textContent = cameraDistanceSlider.value;
  }
  
  if (heightLabel && cameraHeightSlider) {
    heightLabel.textContent = cameraHeightSlider.value;
  }
  
  if (smoothnessLabel && cameraSmoothnessSlider) {
    smoothnessLabel.textContent = cameraSmoothnessSlider.value;
  }
}
