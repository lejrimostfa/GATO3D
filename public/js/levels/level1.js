// levels/level1.js
// Premier niveau/scène de GATO3D
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { setupSkyAndWater } from '../water-setup.js';

/**
 * Initialise la scène du niveau 1 (pour l'instant, scène unique)
 * @param {THREE.WebGLRenderer} renderer
 * @returns {{scene:THREE.Scene, camera:THREE.Camera, objects:Object}}
 */
export function createLevel(renderer) {
  const scene = new THREE.Scene();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Sky/water setup
  const sceneHandles = setupSkyAndWater(scene, renderer, null);
  // Caméra principale
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 50, 100);
  // Autres objets à ajouter ici
  return { scene, camera, objects: { sceneHandles } };
}
