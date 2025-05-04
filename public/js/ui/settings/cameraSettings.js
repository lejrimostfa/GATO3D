// ui/settings/cameraSettings.js
// Gestion des paramètres de caméra (distance, hauteur, smoothness)

import { setCameraFollowParams } from '../../camera/followCamera.js';

/**
 * Initialise les contrôles de caméra
 * @param {Object} playerSubmarine - Référence au sous-marin du joueur
 */
export function initCameraSettings(playerSubmarine) {
  console.log('[UI:Settings:Camera] Initializing camera settings');
  
  const camSlider = document.getElementById('camera-slider');
  const camLabel = document.getElementById('camera-label');
  const dampingSlider = document.getElementById('damping-slider');
  const dampingLabel = document.getElementById('damping-label');
  const altitudeSlider = document.getElementById('altitude-slider');
  const altitudeLabel = document.getElementById('altitude-label');
  
  // Caméra distance
  if (camSlider && camLabel) {
    camSlider.value = 130; // Valeur par défaut
    camLabel.textContent = `Camera: 130`;
    camSlider.addEventListener('input', () => {
      camLabel.textContent = `Camera: ${camSlider.value}`;
      updateCameraParams();
    });
  }
  
  // Damping (amortissement)
  if (dampingSlider && dampingLabel) {
    dampingSlider.value = 0.005; // Valeur par défaut
    dampingLabel.textContent = `Damping: ${parseFloat(dampingSlider.value).toFixed(3)}`;
    dampingSlider.addEventListener('input', () => {
      dampingLabel.textContent = `Damping: ${parseFloat(dampingSlider.value).toFixed(3)}`;
      updateCameraParams();
    });
  }
  
  // Altitude
  if (altitudeSlider && altitudeLabel) {
    altitudeSlider.value = 40; // Valeur par défaut
    altitudeLabel.textContent = `Altitude: 40`;
    altitudeSlider.addEventListener('input', () => {
      altitudeLabel.textContent = `Altitude: ${altitudeSlider.value}`;
      updateCameraParams();
    });
  }
  
  /**
   * Met à jour les paramètres de caméra en fonction des valeurs des sliders
   */
  function updateCameraParams() {
    // Récupérer les valeurs actuelles des sliders
    const distance = parseFloat(camSlider?.value || 130);
    const height = parseFloat(altitudeSlider?.value || 40);
    const smoothness = parseFloat(dampingSlider?.value || 0.005);
    
    // Mettre à jour les paramètres de la caméra
    setCameraFollowParams({
      distance,
      height,
      smoothness
    });
  }
  
  // Applique les paramètres par défaut
  updateCameraParams();
  
  console.log('[UI:Settings:Camera] Camera settings initialized');
}
