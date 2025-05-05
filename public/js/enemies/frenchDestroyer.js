// enemies/frenchDestroyer.js
// Module dédié au chargement et positionnement du destroyer français

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/GLTFLoader.js';
import { scene } from '../game/gameInit.js';

// Configuration du modèle
const DESTROYER_CONFIG = {
  modelPath: './models/french_destroyer_la_bourdonnais/scene.gltf',
  scale: 0.05,
  waterLevel: 20,
  distance: 100, // Distance devant le sous-marin
  // Nous n'utilisons plus de positions prédéfinies
};

// Fonction pour charger et positionner un destroyer français devant le sous-marin
export function loadFrenchDestroyers(submarinePosition = null) {
  // console.log('[DESTROYER] Loading French destroyer model directly in front of submarine');
  
  if (!scene) {
    console.error('[DESTROYER] Scene not available, cannot load destroyer');
    return 0;
  }
  
  // Position par défaut si aucune position de sous-marin n'est fournie
  const defaultPosition = { x: 0, y: DESTROYER_CONFIG.waterLevel, z: -DESTROYER_CONFIG.distance };
  
  // Calculer la position devant le sous-marin
  let destroyerPosition;
  let destroyerRotation = Math.PI; // Face au sous-marin par défaut
  
  if (submarinePosition) {
    // Utiliser la position et rotation du sous-marin pour placer le destroyer devant
    const submarineRotationY = submarinePosition.rotation ? submarinePosition.rotation.y : 0;
    
    // Placer le destroyer à une distance fixe devant le sous-marin dans la direction où il regarde
    destroyerPosition = {
      x: submarinePosition.x + Math.sin(submarineRotationY) * DESTROYER_CONFIG.distance,
      y: DESTROYER_CONFIG.waterLevel,
      z: submarinePosition.z + Math.cos(submarineRotationY) * DESTROYER_CONFIG.distance
    };
    
    // Orienter le destroyer face au sous-marin (rotation opposée)
    destroyerRotation = submarineRotationY + Math.PI;
  } else {
    // Utiliser la position par défaut
    destroyerPosition = defaultPosition;
  }
  
  // console.log('[DESTROYER] Calculated position:', destroyerPosition);
  
  // Créer un marqueur temporaire (cube rouge) à la position
  const markerGeometry = new THREE.BoxGeometry(5, 5, 15);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.set(destroyerPosition.x, destroyerPosition.y + 2.5, destroyerPosition.z);
  marker.rotation.y = destroyerRotation;
  scene.add(marker);
  
  // console.log(`[DESTROYER] Added marker at position (${destroyerPosition.x.toFixed(1)}, ${destroyerPosition.y.toFixed(1)}, ${destroyerPosition.z.toFixed(1)})`);
  
  // Créer un loader GLTF
  const loader = new GLTFLoader();
  
  // Charger le modèle GLTF
  loader.load(
    DESTROYER_CONFIG.modelPath,
    (gltf) => {
      // Modèle chargé avec succès
      const model = gltf.scene;
      
      // Appliquer l'échelle
      model.scale.set(
        DESTROYER_CONFIG.scale, 
        DESTROYER_CONFIG.scale, 
        DESTROYER_CONFIG.scale
      );
      
      // Positionner le modèle
      model.position.set(
        destroyerPosition.x,
        destroyerPosition.y,
        destroyerPosition.z
      );
      
      // Appliquer la rotation
      model.rotation.y = destroyerRotation;
      
      // Ajouter à la scène
      scene.add(model);
      
      // Supprimer le marqueur temporaire
      scene.remove(marker);
      
      // console.log(`[DESTROYER] Successfully loaded destroyer at (${destroyerPosition.x.toFixed(1)}, ${destroyerPosition.y.toFixed(1)}, ${destroyerPosition.z.toFixed(1)})`);
      
      // Ajouter des lumières pour mieux voir le modèle
      const spotLight = new THREE.SpotLight(0xffffff, 1);
      spotLight.position.set(destroyerPosition.x, destroyerPosition.y + 50, destroyerPosition.z);
      spotLight.target = model;
      spotLight.castShadow = true;
      scene.add(spotLight);
      
      // Exporter le modèle pour y accéder ailleurs
      window.destroyerModel = model;
    },
    (xhr) => {
      // Progression du chargement
      if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        // console.log(`[DESTROYER] Loading destroyer: ${Math.round(percentComplete)}%`);
      }
    },
    (error) => {
      // Erreur de chargement
      console.error('[DESTROYER] Error loading destroyer:', error);
      
      // Garder le marqueur visible en cas d'erreur, mais changer sa couleur
      if (marker) {
        marker.material.color.set(0xff00ff);
        marker.material.wireframe = false;
      }
    }
  );
  
  return 1; // Un seul destroyer chargé
}
