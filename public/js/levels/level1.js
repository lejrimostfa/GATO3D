// levels/level1.js
// Premier niveau/scène de GATO3D
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { setupSkyAndWater, updateSun } from '../water-setup.js';

/**
 * Initialise la scène du niveau 1 (pour l'instant, scène unique)
 * @param {THREE.WebGLRenderer} renderer
 * @returns {{scene:THREE.Scene, camera:THREE.Camera, objects:Object}}
 */
export function createLevel(renderer) {
  // console.log('[LEVEL1] Creating level scene...');
  
  // Check if renderer is valid
  if (!renderer) {
    console.error('[LEVEL1] Cannot create level: renderer is null');
    throw new Error('Renderer is required to create level');
  }
  
  // Create scene
  const scene = new THREE.Scene();
  
  // Set renderer size
  try {
    renderer.setSize(window.innerWidth, window.innerHeight);
  } catch (error) {
    console.error('[LEVEL1] Error setting renderer size:', error);
    throw error;
  }
  
  // Caméra principale
  // console.log('[LEVEL1] Setting up camera...');
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 50, 100);
  
  // Sky/water setup
  // console.log('[LEVEL1] Setting up sky and water...');
  const sceneHandles = setupSkyAndWater(scene, renderer, camera);
  
  // Correction : place le soleil à midi par défaut
  if (sceneHandles && sceneHandles.sun && sceneHandles.sky) {
    // console.log('[LEVEL1] Setting initial sun position...');
    updateSun(sceneHandles, 12);
  } else {
    console.warn('[LEVEL1] Cannot set initial sun position: missing components');
  }
  
  // Autres objets à ajouter ici
  // console.log('[LEVEL1] Level created successfully');
  return { scene, camera, objects: { sceneHandles } };
}
