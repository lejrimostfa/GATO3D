// ui/controls/sliders.js
// Gestion centralisée des sliders

import { initCameraSliders } from './cameraControls.js';
import { initDayDurationSlider } from '../time-slider.js';
import { setDayDuration } from '../../time/timeManager.js';

/**
 * Initialize all slider controls with default values
 */
export function initAllSliders() {
  console.log('[UI:Sliders] Initializing all slider controls');
  
  // Initialize camera sliders
  initCameraSliders();
  
  // Initialize day duration slider
  initDayDurationSlider((value) => {
    setDayDuration(value);
  });
  
  // Add other sliders here as needed
  
  console.log('[UI:Sliders] All sliders initialized');
}
