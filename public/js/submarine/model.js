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
    // Create pivot point for the submarine
    const pivot = new THREE.Object3D();
    pivot.name = 'Pivot';
    pivot.position.set(0, 20, 0); // Position de départ (surface)
    scene.add(pivot);

    // Helper function to safely log errors, handling empty error objects
    const safeErrorLog = (prefix, error) => {
        if (!error) {
            console.error(`${prefix}: Empty error object`); 
            return 'Empty error object';
        }
        if (typeof error === 'string') {
            console.error(`${prefix}: ${error}`);
            return error;
        }
        const message = error.message || error.toString() || 'Unknown error';
        console.error(`${prefix}: ${message}`, error);
        return message;
    };

    // Helper function to create a fallback submarine model
    const createFallbackSubmarine = () => {
        // console.log('[SUBMARINE] Creating fallback submarine model');
        
        // Main body
        const bodyGeometry = new THREE.CapsuleGeometry(5, 20, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2; // Rotate to align with forward direction
        body.castShadow = true;
        body.receiveShadow = true;
        pivot.add(body);
        
        // Conning tower (sail)
        const towerGeometry = new THREE.CylinderGeometry(2, 2, 5, 8);
        const towerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ddbb });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(0, 5, 0);
        tower.castShadow = true;
        tower.receiveShadow = true;
        pivot.add(tower);
        
        // Propeller
        const propGeometry = new THREE.CylinderGeometry(0.5, 2, 1, 8);
        const propMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const propeller = new THREE.Mesh(propGeometry, propMaterial);
        propeller.position.set(0, 0, -12);
        propeller.rotation.x = Math.PI / 2;
        propeller.castShadow = true;
        propeller.receiveShadow = true;
        pivot.add(propeller);
        
        // Add some basic lighting to the fallback model
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 10, 0);
        pivot.add(light);
        
        return pivot;
    };

    // Create a promise to handle both success and failure cleanly
    const loadModel = () => {
        return new Promise((resolve, reject) => {
            try {
                // Setup loader with proper error handling
                const loader = new GLTFLoader();
                const manager = new THREE.LoadingManager();
                
                // Handle general loading errors
                manager.onError = (url) => {
                    const errorMsg = `Failed to load resource: ${url}`;
                    console.error(`[SUBMARINE] ${errorMsg}`);
                    reject(new Error(errorMsg));
                };
                
                loader.manager = manager;
                
                // Paths to try in order
                const modelPaths = [
                    'models/submarine0/scene.gltf',
                    '/models/submarine0/scene.gltf',
                    '/public/models/submarine0/scene.gltf',
                    '../models/submarine0/scene.gltf'
                ];
                
                // Try loading from first path
                // console.log(`[SUBMARINE] Attempting to load model from ${modelPaths[0]}`);
                
                let currentPathIndex = 0;
                const tryNextPath = () => {
                    if (currentPathIndex >= modelPaths.length) {
                        // All paths failed
                        const error = new Error('Failed to load submarine model from all paths');
                        console.error('[SUBMARINE] All model loading attempts failed');
                        reject(error);
                        return;
                    }
                    
                    const currentPath = modelPaths[currentPathIndex];
                    // console.log(`[SUBMARINE] Trying path ${currentPathIndex + 1}/${modelPaths.length}: ${currentPath}`);
                    
                    loader.load(
                        currentPath,
                        (gltf) => {
                            // Success
                            const sub = gltf.scene;
                            sub.position.set(0, 0, 0);
                            sub.scale.set(0.1, 0.1, 0.1); // Scale down by factor of 10
                            
                            // Configurer les ombres pour le sous-marin
                            sub.traverse((child) => {
                                if (child.isMesh) {
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            });
                            
                            pivot.add(sub);
                            // console.log(`[SUBMARINE] Model loaded successfully from ${currentPath}`);
                            resolve(pivot);
                        },
                        (progressEvent) => {
                            // Loading progress
                            if (progressEvent.lengthComputable) {
                                const percent = (progressEvent.loaded / progressEvent.total) * 100;
                                // console.log(`[SUBMARINE] Loading progress (${currentPath}): ${percent.toFixed(2)}%`);
                            }
                        },
                        (error) => {
                            // Handle error and try next path
                            safeErrorLog(`[SUBMARINE] Failed loading from ${currentPath}`, error);
                            currentPathIndex++;
                            tryNextPath();
                        }
                    );
                };
                
                // Start the loading process with the first path
                tryNextPath();
                
            } catch (error) {
                // Handle unexpected errors
                safeErrorLog('[SUBMARINE] Exception during model loading', error);
                reject(new Error('Exception during submarine model loading'));
            }
        });
    };
    
    // Execute the loading process with proper error handling
    loadModel()
        .then((submarine) => {
            // Success case - model loaded
            if (typeof onLoaded === 'function') {
                onLoaded(submarine);
            }
        })
        .catch((error) => {
            // Log the error and use fallback model
            safeErrorLog('[SUBMARINE] Error loading submarine model', error);
            
            // Create and return fallback model
            const fallbackSubmarine = createFallbackSubmarine();
            if (typeof onLoaded === 'function') {
                onLoaded(fallbackSubmarine);
            }
        });
}
