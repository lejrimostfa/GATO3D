

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
      submarine.position.set(0, 10, 0);
      scene.add(submarine);
      if (onLoaded) onLoaded(submarine);
    },
    undefined,
    error => {
      console.error('Erreur chargement du sous-marin :', error);
    }
  );
}