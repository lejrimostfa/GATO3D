// ui/settings/waveSettings.js
// Contrôles des paramètres de vagues

import { setWaveAmplitude, setWaveDirection, updateWaterMaterial } from '../../ocean/waveControls.js';

/**
 * Initialise les contrôles de vagues
 * @param {Object} sceneHandles - Objets de la scène incluant water
 */
export function initWaveSettings(sceneHandles) {
  console.log('[UI:Settings:Wave] Initializing wave controls');
  
  const waveAmplitudeSlider = document.getElementById('wave-amplitude-slider');
  const waveAmplitudeLabel = document.getElementById('wave-amplitude-label');
  const waveDirectionSlider = document.getElementById('wave-direction-slider');
  const waveDirectionLabel = document.getElementById('wave-direction-label');
  
  if (!waveAmplitudeSlider || !waveAmplitudeLabel) {
    console.warn('[UI:Settings:Wave] Wave amplitude controls not found');
  }
  
  if (!waveDirectionSlider || !waveDirectionLabel) {
    console.warn('[UI:Settings:Wave] Wave direction controls not found');
  }
  
  // Configurer le slider d'amplitude
  if (waveAmplitudeSlider && waveAmplitudeLabel) {
    // Initialiser avec la valeur par défaut
    setWaveAmplitude(parseFloat(waveAmplitudeSlider.value));
    
    waveAmplitudeSlider.addEventListener('input', () => {
      const amplitude = parseFloat(waveAmplitudeSlider.value);
      waveAmplitudeLabel.textContent = `Amplitude: ${amplitude.toFixed(1)}`;
      setWaveAmplitude(amplitude);
      
      // Mettre à jour le matériau de l'eau si disponible
      if (sceneHandles && sceneHandles.water) {
        updateWaterMaterial(sceneHandles.water);
      }
    });
    
    // Déclencher une mise à jour pour appliquer les paramètres initiaux
    waveAmplitudeSlider.dispatchEvent(new Event('input'));
  }
  
  // Configurer le slider de direction
  if (waveDirectionSlider && waveDirectionLabel) {
    // Initialiser avec la valeur par défaut
    setWaveDirection(parseFloat(waveDirectionSlider.value));
    
    waveDirectionSlider.addEventListener('input', () => {
      const direction = parseFloat(waveDirectionSlider.value);
      waveDirectionLabel.textContent = `Direction: ${direction}°`;
      setWaveDirection(direction);
      
      // Mettre à jour le matériau de l'eau si disponible
      if (sceneHandles && sceneHandles.water) {
        updateWaterMaterial(sceneHandles.water);
      }
    });
    
    // Déclencher une mise à jour pour appliquer les paramètres initiaux
    waveDirectionSlider.dispatchEvent(new Event('input'));
  }
  
  console.log('[UI:Settings:Wave] Wave controls initialized');
}
