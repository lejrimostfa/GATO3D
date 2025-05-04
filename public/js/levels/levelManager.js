// levels/levelManager.js
// Gestionnaire de niveaux/scènes pour GATO3D

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

/**
 * Charge dynamiquement un niveau et initialise la scène.
 * @param {string} levelName - nom du module de niveau (ex: 'level1')
 * @param {THREE.WebGLRenderer} renderer
 * @param {function} onLoaded - callback({scene, camera, objects})
 */
export function loadLevel(levelName, renderer, onLoaded) {
  if (!renderer) {
    console.error(`[LEVEL] Cannot load level '${levelName}': renderer is null`);
    return;
  }
  
  try {
    console.log(`[LEVEL] Loading level '${levelName}'...`);
    
    import(`./${levelName}.js`)
      .then(module => {
        // Check if module and createLevel function exist
        if (!module || typeof module.createLevel !== 'function') {
          throw new Error(`Module for level '${levelName}' does not contain a createLevel function`);
        }
        
        const { createLevel } = module;
        
        try {
          // Call createLevel with better error handling
          const result = createLevel(renderer);
          
          // Validate returned object structure
          if (!result || !result.scene || !result.camera) {
            throw new Error(`Level '${levelName}' did not return required scene and camera objects`);
          }
          
          const { scene, camera, objects = {} } = result;
          
          console.log(`[LEVEL] Level '${levelName}' loaded successfully`);
          
          // Pass level data to callback
          if (onLoaded && typeof onLoaded === 'function') {
            onLoaded({ scene, camera, objects });
          }
        } catch (error) {
          console.error(`[LEVEL] Error initializing level '${levelName}':`, error);
          // Propagate the error to the promise chain
          throw error;
        }
      })
      .catch(error => {
        console.error(`[LEVEL] Error in level '${levelName}' loading process:`, error);
        // If we have a callback, call it with an error status
        if (onLoaded && typeof onLoaded === 'function') {
          // Create a minimal valid scene to prevent further errors
          const fallbackScene = new THREE.Scene();
          const fallbackCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
          onLoaded({ 
            scene: fallbackScene, 
            camera: fallbackCamera,
            objects: { error },
            isErrorState: true
          });
        }
      });
  } catch (error) {
    console.error(`[LEVEL] Critical failure loading level '${levelName}':`, error);
  }
}
