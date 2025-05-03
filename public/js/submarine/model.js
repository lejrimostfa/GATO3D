// submarine/model.js
// Chargement et gestion du modèle 3D du sous-marin pour GATO3D
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/GLTFLoader.js';

/**
 * Charge le modèle du sous-marin (GLTF) et l'ajoute à la scène.
 * @param {THREE.Scene} scene
 * @param {function(THREE.Object3D):void} onLoaded - callback appelé avec le pivot du sous-marin
 */
export function loadSubmarine(scene, onLoaded) {
    const pivot = new THREE.Object3D();
    pivot.name = 'Pivot';
    pivot.position.set(0, 20, 0); // Position de départ (surface)
    scene.add(pivot);

    const loader = new GLTFLoader();
    loader.load(
        'models/submarine0/scene.gltf', // <-- chemin adapté selon l'organisation du projet
        (gltf) => {
            const sub = gltf.scene;
            sub.position.set(0, 0, 0);
            sub.scale.set(0.1, 0.1, 0.1); // Divise la taille par 10
            pivot.add(sub);
            console.log('[SUBMARINE] GLTF chargé et ajouté au pivot', sub, pivot.children);
            if (typeof onLoaded === 'function') {
                onLoaded(pivot);
            }
        },
        undefined,
        (error) => {
            console.error('Erreur chargement du sous-marin:', error);
            // Fallback : cube temporaire si échec
            const geometry = new THREE.BoxGeometry(10, 5, 30);
            const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
            const submarineMesh = new THREE.Mesh(geometry, material);
            submarineMesh.position.y = 0;
            pivot.add(submarineMesh);
            if (typeof onLoaded === 'function') {
                onLoaded(pivot);
            }
        }
    );
}
