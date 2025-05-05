// enemies/shipDebug.js
// Module de débogage pour ajouter un navire directement dans la scène

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/GLTFLoader.js';
import { scene } from '../game/gameInit.js';

// Fonction pour ajouter un navire de test directement dans la scène
export function addTestShip() {
  // console.log('[DEBUG] Adding test ship directly to scene');
  
  if (!scene) {
    console.error('[DEBUG] Scene not available, cannot add test ship');
    return;
  }
  
  // Créer un cube rouge comme marqueur de position
  const cubeGeometry = new THREE.BoxGeometry(10, 10, 30);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(100, 25, 100); // Position à la surface de l'eau
  scene.add(cube);
  // console.log('[DEBUG] Added red cube marker at position (100, 25, 100)');
  
  // Charger le modèle du navire
  const loader = new GLTFLoader();
  const modelPath = './models/french_destroyer_la_bourdonnais/scene.gltf';
  
  // console.log('[DEBUG] Loading ship model from:', modelPath);
  
  loader.load(
    modelPath,
    (gltf) => {
      const shipModel = gltf.scene;
      
      // Appliquer l'échelle et la position
      shipModel.scale.set(0.05, 0.05, 0.05);
      shipModel.position.set(100, 20, 100);
      
      // Ajouter à la scène
      scene.add(shipModel);
      // console.log('[DEBUG] Ship model loaded successfully and added to scene');
    },
    (xhr) => {
      // Progression du chargement
      if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        // console.log(`[DEBUG] Ship model loading: ${Math.round(percentComplete)}%`);
      }
    },
    (error) => {
      console.error('[DEBUG] Error loading ship model:', error);
    }
  );
  
  // Créer un navire simple avec une géométrie de base (comme fallback)
  const shipGeometry = new THREE.BoxGeometry(5, 3, 15);
  const shipMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
  const simpleShip = new THREE.Mesh(shipGeometry, shipMaterial);
  simpleShip.position.set(150, 21.5, 150); // Position à la surface de l'eau
  scene.add(simpleShip);
  // console.log('[DEBUG] Added simple ship at position (150, 21.5, 150)');
}
