// levels/level_editor.js
// Scène d'édition minimaliste pour l'éditeur de modèles GATO3D
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

/**
 * Initialise la scène d'édition pour l'éditeur de modèles
 * @param {THREE.WebGLRenderer} renderer
 * @returns {{scene:THREE.Scene, camera:THREE.Camera, objects:Object}}
 */
export function createEditorLevel(renderer) {
  const scene = new THREE.Scene();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Sol grille
  const grid = new THREE.GridHelper(1000, 40, 0x0ff0ff, 0x0ff0ff);
  grid.position.y = 0;
  scene.add(grid);
  // Lumière douce
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  scene.add(dirLight);
  // Caméra
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(0, 80, 250);
  camera.lookAt(0, 0, 0);
  return { scene, camera, objects: {} };
}
