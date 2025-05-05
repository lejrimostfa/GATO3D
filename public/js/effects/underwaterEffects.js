// underwaterEffects.js
// Effets visuels pour l'expérience sous-marine dans GATO3D

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// État des effets sous-marins
let isUnderwater = false;
let underwaterEffectsEnabled = true;

// Paramètres des effets
const underwaterParams = {
  blurIntensity: 0.5,    // 0.0 à 1.0
  fogDensity: 0.03,      // 0.0 à 0.1
  distortionIntensity: 0.3,  // 0.0 à 1.0
  fogColor: new THREE.Color(0x0044aa)  // Bleu océan
};

// Variables pour stocker l'état original
let originalFog = null;
let originalBackgroundColor = null;
let originalLights = new Map(); // Pour stocker l'intensité et la couleur originale des lumières

/**
 * Initialiser le système d'effets sous-marins
 * @param {THREE.Scene} scene - La scène Three.js
 * @param {THREE.Camera} camera - La caméra principale
 * @param {THREE.WebGLRenderer} renderer - Le renderer WebGL
 * @param {Object} waterSurface - L'objet eau avec sa position y
 */
export function initUnderwaterEffects(scene, camera, renderer, waterSurface) {
  console.log('[EFFECTS] Initializing underwater effects system');
  
  // Stocker les valeurs originales pour pouvoir les restaurer
  if (scene.fog) {
    originalFog = {
      type: scene.fog.isFogExp2 ? 'exp2' : 'linear',
      density: scene.fog.isFogExp2 ? scene.fog.density : null,
      near: scene.fog.isFogExp2 ? null : scene.fog.near,
      far: scene.fog.isFogExp2 ? null : scene.fog.far,
      color: scene.fog.color.clone()
    };
  }
  
  // Stocker la couleur d'arrière-plan originale
  originalBackgroundColor = scene.background ? scene.background.clone() : new THREE.Color(0x87ceeb);
  
  // Marquer le niveau d'eau pour la détection
  if (waterSurface) {
    waterSurface.userData.isWater = true;
  }
  
  // Stocker l'état original des lumières
  scene.traverse(obj => {
    if (obj.isLight) {
      originalLights.set(obj.uuid, {
        intensity: obj.intensity,
        color: obj.color.clone()
      });
    }
  });
  
  // Vérification initiale
  if (camera && waterSurface) {
    isUnderwater = checkUnderwaterState(camera, waterSurface);
  }
  
  console.log('[EFFECTS] Underwater effects system initialized with:');
  console.log(`- Blur intensity: ${underwaterParams.blurIntensity}`);
  console.log(`- Fog density: ${underwaterParams.fogDensity}`);
  console.log(`- Distortion intensity: ${underwaterParams.distortionIntensity}`);
  
  return {
    underwaterParams,
    isUnderwater: () => isUnderwater,
    setEnabled: (enabled) => {
      underwaterEffectsEnabled = enabled;
      console.log(`[EFFECTS] Underwater effects ${enabled ? 'enabled' : 'disabled'}`);
    }
  };
}

// Variable pour suivre le temps
let time = 0;

/**
 * Mettre à jour les effets à chaque frame
 * @param {THREE.Scene} scene - La scène
 * @param {number} deltaTime - Temps écoulé depuis la dernière frame
 */
export function updateUnderwaterEffects(scene, deltaTime = 0.016) {
  // Mettre à jour le temps pour les animations
  time += deltaTime;
  
  // Obtenir la caméra principale et l'eau depuis l'état global d'animation
  let camera = null;
  let waterSurface = null;
  
  if (window.getAnimationState) {
    const state = window.getAnimationState();
    if (state) {
      camera = state.camera;
      waterSurface = state.sceneHandles?.water;
    }
  }
  
  // Vérifier manuellement si la caméra est sous l'eau
  if (camera && waterSurface) {
    const waterLevel = waterSurface.position?.y || 0;
    const newUnderwater = camera.position.y < waterLevel;
    
    // Afficher l'état dans la console à chaque changement
    if (newUnderwater !== isUnderwater) {
      isUnderwater = newUnderwater;
      console.log(`[EFFECTS] Camera position Y: ${camera.position.y.toFixed(2)}, Water level: ${waterLevel.toFixed(2)}`);
      console.log(`[EFFECTS] Camera is now ${isUnderwater ? 'UNDERWATER' : 'ABOVE WATER'} !!`);
    }
  }
  
  // Appliquer les effets seulement si activés et sous l'eau
  const effectsActive = isUnderwater && underwaterEffectsEnabled;
  
  if (effectsActive) {
    // 1. Appliquer un brouillard bleu dense
    scene.fog = new THREE.FogExp2(
      underwaterParams.fogColor,
      underwaterParams.fogDensity
    );
    
    // 2. Teinter l'arrière-plan pour un effet immersif
    scene.background = new THREE.Color(0x0055aa);
    
    // 3. Modifier les lumières pour un effet sous-marin
    scene.traverse(obj => {
      if (obj.isLight) {
        // Si c'est une lumière ambiante, ajouter une teinte bleue
        if (obj.isAmbientLight) {
          obj.intensity = 0.3; // Réduire l'intensité
          obj.color.setRGB(0.1, 0.3, 0.7); // Teinte bleue
        } 
        // Réduire l'intensité des autres lumières
        else if (obj.isDirectionalLight || obj.isPointLight) {
          obj.intensity *= 0.6; 
        }
      }
    });
  } else {
    // Restaurer l'état original
    
    // 1. Restaurer le brouillard original
    if (originalFog) {
      if (originalFog.type === 'exp2') {
        scene.fog = new THREE.FogExp2(originalFog.color, originalFog.density);
      } else {
        scene.fog = new THREE.Fog(originalFog.color, originalFog.near, originalFog.far);
      }
    } else {
      // Brouillard par défaut
      scene.fog = new THREE.FogExp2(new THREE.Color(0xbfd1e5), 0.00015);
    }
    
    // 2. Restaurer la couleur d'arrière-plan
    scene.background = originalBackgroundColor;
    
    // 3. Restaurer les lumières
    scene.traverse(obj => {
      if (obj.isLight && originalLights.has(obj.uuid)) {
        const original = originalLights.get(obj.uuid);
        obj.intensity = original.intensity;
        obj.color.copy(original.color);
      }
    });
  }
}

/**
 * Vérifier si la caméra est sous l'eau
 * @param {THREE.Camera} camera - La caméra
 * @param {Object} waterSurface - L'objet eau avec sa position y
 * @returns {boolean} Vrai si la caméra est sous l'eau
 */
function checkUnderwaterState(camera, waterSurface) {
  if (!camera || !waterSurface) return false;
  
  const waterLevel = waterSurface.position ? waterSurface.position.y : 0;
  const cameraY = camera.position ? camera.position.y : 1000;
  
  return cameraY < waterLevel;
}

/**
 * Définir l'intensité du flou sous-marin
 * @param {number} intensity - Intensité du flou (0.0 à 1.0)
 */
export function setUnderwaterBlur(intensity) {
  underwaterParams.blurIntensity = Math.max(0, Math.min(1, intensity));
  console.log(`[EFFECTS] Underwater blur set to ${underwaterParams.blurIntensity.toFixed(2)}`);
  return underwaterParams.blurIntensity;
}

/**
 * Définir la densité du brouillard sous-marin
 * @param {number} density - Densité du brouillard (0.0 à 0.1)
 */
export function setUnderwaterFog(density) {
  underwaterParams.fogDensity = Math.max(0, Math.min(0.1, density));
  console.log(`[EFFECTS] Underwater fog density set to ${underwaterParams.fogDensity.toFixed(3)}`);
  return underwaterParams.fogDensity;
}

/**
 * Définir l'intensité des distorsions sous-marines
 * @param {number} intensity - Intensité des distorsions (0.0 à 1.0)
 */
export function setUnderwaterDistortion(intensity) {
  underwaterParams.distortionIntensity = Math.max(0, Math.min(1, intensity));
  console.log(`[EFFECTS] Underwater distortion set to ${underwaterParams.distortionIntensity.toFixed(2)}`);
  return underwaterParams.distortionIntensity;
}
