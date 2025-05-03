

// public/js/submarine.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/GLTFLoader.js';

export function loadSubmarine(scene, onLoaded) {
  const loader = new GLTFLoader();
  loader.load(
    '/models/submarine0/scene.gltf',
    gltf => {
      const submarine = gltf.scene;
      submarine.scale.set(0.1, .1, .1);
      // Créer un pivot à 1/3 de la longueur à partir de l'arrière
      const pivot = new THREE.Object3D();
      // Calculer la bounding box du sous-marin
      const bbox = new THREE.Box3().setFromObject(submarine);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      // Calcul du point 2/3 depuis l'arrière
      const pivotZ = -size.z / 2 + size.z * (2 / 3);
      pivot.position.set(0, 10, 0);
      // Décale le mesh pour que ce point soit le centre de rotation
      submarine.position.set(0, 0, -pivotZ);
      pivot.add(submarine);
      scene.add(pivot);
      if (onLoaded) onLoaded(pivot);
    },
    undefined,
    error => {
      console.error('Erreur chargement du sous-marin :', error);
    }
  );
}