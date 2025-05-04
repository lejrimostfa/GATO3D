// ui/settings/index.js
// Point d'entrée centralisé pour tous les modules de paramètres

import { initLightSettings, updateRayleighSlider } from './lightSettings.js';
import { initCameraSettings } from './cameraSettings.js';
import { initDayDurationSettings } from './dayDurationSettings.js';
import { initWaveSettings } from './waveSettings.js';

// Exporter la fonction updateRayleighSlider pour compatibilité avec l'ancien code
export { updateRayleighSlider };

/**
 * Initialise les sliders avancés de lumière (export pour compatibilité)
 * @param {object} sceneHandles - objets de la scène
 */
export function initLightSliders(sceneHandles) {
  console.log('[UI:Settings] Using compatibility wrapper for initLightSliders');
  return initLightSettings(sceneHandles);
}

/**
 * Initialise tous les paramètres et contrôles
 * @param {Object} sceneHandles - Objets de la scène (water, sky, etc.)
 * @param {Object} playerSubmarine - Référence au sous-marin
 * @param {Function} onDayDurationChange - Callback pour le changement de durée du jour
 */
export function initSettings(sceneHandles, playerSubmarine, onDayDurationChange) {
  console.log('[UI:Settings] Initializing all settings modules');
  
  // Initialiser les modules de paramètres
  initLightSettings(sceneHandles);
  initCameraSettings(playerSubmarine);
  initDayDurationSettings(onDayDurationChange);
  initWaveSettings(sceneHandles);
  
  console.log('[UI:Settings] All settings modules initialized');
}
