// ui/controls/cameraControls.js
// Gestion des contrôles de caméra via l'interface utilisateur

import { elements } from '../domElements.js';
import { setCameraFollowParams } from '../../camera/followCamera.js';

/**
 * Initialize camera control sliders
 */
export function initCameraSliders() {
  // console.log('[UI:Camera] Initializing camera control sliders');
  
  // Utiliser les nouveaux ID de sliders que nous avons ajoutés dans l'HTML
  const distanceSlider = document.getElementById('camera-distance-slider');
  const heightSlider = document.getElementById('camera-height-slider');
  const smoothnessSlider = document.getElementById('camera-smoothness-slider');
  
  // Vérifier que les sliders existent
  if (!distanceSlider || !heightSlider || !smoothnessSlider) {
    console.warn('[UI:Camera] Camera slider elements not found');
    // Appliquer des valeurs par défaut
    setCameraFollowParams(250, 0.005, 60);
    return;
  }
  
  // Mettre à jour les labels
  updateSliderLabels();
  
  // Ajouter les écouteurs d'événements
  distanceSlider.addEventListener('input', updateCameraUIControls);
  heightSlider.addEventListener('input', updateCameraUIControls);
  smoothnessSlider.addEventListener('input', updateCameraUIControls);
  
  // Appliquer les paramètres initiaux de la caméra
  updateCameraUIControls();
  
  // console.log('[UI:Camera] Camera sliders initialized successfully');
}

/**
 * Update camera controls based on slider values
 */
export function updateCameraUIControls() {
  // Utiliser directement les sliders avec les nouveaux ID
  const distanceSlider = document.getElementById('camera-distance-slider');
  const heightSlider = document.getElementById('camera-height-slider');
  const smoothnessSlider = document.getElementById('camera-smoothness-slider');
  
  // Skip si les éléments ne sont pas trouvés
  if (!distanceSlider || !heightSlider || !smoothnessSlider) {
    console.warn('[UI:Camera] Camera sliders not found in updateCameraUIControls');
    return;
  }
  
  // Récupérer les valeurs
  const distance = parseFloat(distanceSlider.value);
  const height = parseFloat(heightSlider.value);
  const smoothness = parseFloat(smoothnessSlider.value);
  
  // Mettre à jour les paramètres de la caméra
  setCameraFollowParams(distance, smoothness, height);
  
  // Mettre à jour les labels
  updateSliderLabels();
  
  // Log des nouvelles valeurs
  // console.log(`[UI:Camera] Updated: distance=${distance}, height=${height}, smoothness=${smoothness}`);
}

/**
 * Update slider labels with current values
 */
function updateSliderLabels() {
  // Récupérer directement les sliders avec leurs nouveaux ID
  const distanceSlider = document.getElementById('camera-distance-slider');
  const heightSlider = document.getElementById('camera-height-slider');
  const smoothnessSlider = document.getElementById('camera-smoothness-slider');
  
  // Récupérer les éléments d'affichage
  const distanceLabel = document.getElementById('camera-distance-value');
  const heightLabel = document.getElementById('camera-height-value');
  const smoothnessLabel = document.getElementById('camera-smoothness-value');
  
  // Mettre à jour les labels s'ils existent
  if (distanceLabel && distanceSlider) {
    distanceLabel.textContent = distanceSlider.value;
  }
  
  if (heightLabel && heightSlider) {
    heightLabel.textContent = heightSlider.value;
  }
  
  if (smoothnessLabel && smoothnessSlider) {
    // Formater la valeur avec 3 décimales pour le damping/smoothness
    smoothnessLabel.textContent = parseFloat(smoothnessSlider.value).toFixed(3);
  }
}
