// enemies/modelTester.js
// Script pour tester le chargement de tous les modèles GLTF disponibles

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/GLTFLoader.js';
import { scene } from '../game/gameInit.js';

// Liste des modèles GLTF disponibles (un seul exemplaire de chaque)
// Échelles normalisées par rapport au sous-marin (qui est à 0.1)
const MODELS = [
  // Samidare Destroyer (Japon) - échelle ajustée pour être environ 2-3x plus grand que le sous-marin
  {
    name: "Samidare Destroyer (normalisé)",
    path: "./models/samidare_destroyer/scene.gltf",
    scale: 0.2, // 2x la taille du sous-marin
    position: { x: 200, y: 20, z: 300 },
    rotation: Math.PI * 0.25
  },
  
  // USS Lassen (USA) - échelle ajustée pour être environ 2-3x plus grand que le sous-marin
  {
    name: "USS Lassen DDG-82 (normalisé)",
    path: "./models/uss_lassen_ddg-82_class_destroyer/scene.gltf",
    scale: 0.25, // 2.5x la taille du sous-marin
    position: { x: -200, y: 20, z: 100 },
    rotation: Math.PI * 1.75
  },
  
  // Japanese Destroyer Kikuzuki - échelle ajustée pour être environ 2x plus grand que le sous-marin
  {
    name: "Japanese Destroyer Kikuzuki (normalisé)",
    path: "./models/japanese_destroyer_kikuzuki_in_1942/scene.gltf",
    scale: 0.2, // 2x la taille du sous-marin
    position: { x: 300, y: 20, z: -150 },
    rotation: Math.PI * 1.25
  },
  
  // Great White Shark - échelle ajustée pour être environ 0.7x la taille du sous-marin
  {
    name: "Great White Shark (normalisé)",
    path: "./models/great_white_shark/scene.gltf",
    scale: 0.07, // 0.7x la taille du sous-marin
    position: { x: -300, y: 10, z: -200 },
    rotation: Math.PI * 1.0
  }
  // Sous-marin et destroyer français retirés de la liste pour éviter les conflits
];

// Fonction pour tester le chargement de tous les modèles
export function testAllModels() {
  // console.log('[MODEL_TESTER] Starting to test all available models');
  
  if (!scene) {
    console.error('[MODEL_TESTER] Scene not available, cannot test models');
    return;
  }
  
  // Créer un loader GLTF
  const loader = new GLTFLoader();
  
  // Tableau pour stocker les résultats
  const results = [];
  
  // Fonction pour charger un modèle
  function loadModel(model, index) {
    // console.log(`[MODEL_TESTER] Testing model ${index+1}/${MODELS.length}: ${model.name}`);
    
    // Créer un marqueur pour la position du modèle
    const markerGeometry = new THREE.BoxGeometry(10, 10, 10);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(model.position.x, model.position.y, model.position.z);
    scene.add(marker);
    
    // Ajouter un texte pour identifier le modèle
    const textDiv = document.createElement('div');
    textDiv.id = `model-label-${index}`;
    textDiv.style.position = 'absolute';
    textDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    textDiv.style.color = '#0f0';
    textDiv.style.padding = '5px';
    textDiv.style.borderRadius = '5px';
    textDiv.style.fontFamily = 'monospace';
    textDiv.style.fontSize = '12px';
    textDiv.style.pointerEvents = 'none';
    textDiv.innerHTML = `${index+1}: ${model.name}`;
    document.body.appendChild(textDiv);
    
    // Position du texte (sera mis à jour dans la boucle d'animation)
    const labelPosition = new THREE.Vector3(
      model.position.x,
      model.position.y + 20,
      model.position.z
    );
    
    // Fonction pour mettre à jour la position du texte
    function updateLabelPosition() {
      if (!textDiv) return;
      
      // Convertir la position 3D en position 2D à l'écran
      const camera = scene.userData.camera;
      if (!camera) return;
      
      const vector = labelPosition.clone().project(camera);
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
      
      textDiv.style.left = `${x}px`;
      textDiv.style.top = `${y}px`;
    }
    
    // Ajouter la fonction de mise à jour à la boucle d'animation
    const updateInterval = setInterval(updateLabelPosition, 100);
    
    // Charger le modèle
    const startTime = Date.now();
    
    loader.load(
      model.path,
      (gltf) => {
        // Modèle chargé avec succès
        const loadTime = Date.now() - startTime;
        // console.log(`[MODEL_TESTER] Success: ${model.name} loaded in ${loadTime}ms`);
        
        // Configurer le modèle
        const modelObject = gltf.scene;
        modelObject.scale.set(model.scale, model.scale, model.scale);
        modelObject.position.set(model.position.x, model.position.y, model.position.z);
        modelObject.rotation.y = model.rotation;
        
        // Ajouter à la scène
        scene.add(modelObject);
        
        // Supprimer le marqueur
        scene.remove(marker);
        
        // Mettre à jour le texte
        textDiv.style.backgroundColor = 'rgba(0,128,0,0.7)';
        textDiv.innerHTML = `✓ ${index+1}: ${model.name}`;
        
        // Ajouter un éclairage dédié
        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(
          model.position.x, 
          model.position.y + 50, 
          model.position.z
        );
        spotLight.target = modelObject;
        scene.add(spotLight);
        
        // Ajouter le résultat
        results.push({
          name: model.name,
          success: true,
          loadTime: loadTime,
          model: modelObject
        });
        
        // Exporter le modèle pour y accéder ailleurs
        window.loadedModels = window.loadedModels || {};
        window.loadedModels[model.name] = modelObject;
      },
      (xhr) => {
        // Progression du chargement
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          // console.log(`[MODEL_TESTER] Loading ${model.name}: ${Math.round(percentComplete)}%`);
          
          // Mettre à jour le texte avec la progression
          textDiv.innerHTML = `${index+1}: ${model.name} (${Math.round(percentComplete)}%)`;
        }
      },
      (error) => {
        // Erreur de chargement
        const loadTime = Date.now() - startTime;
        console.error(`[MODEL_TESTER] Error loading ${model.name}:`, error);
        
        // Changer la couleur du marqueur
        marker.material.color.set(0xff00ff);
        marker.material.wireframe = false;
        marker.material.opacity = 0.7;
        
        // Mettre à jour le texte
        textDiv.style.backgroundColor = 'rgba(255,0,0,0.7)';
        textDiv.innerHTML = `✗ ${index+1}: ${model.name} (Error)`;
        
        // Ajouter le résultat
        results.push({
          name: model.name,
          success: false,
          error: error.message,
          loadTime: loadTime
        });
      }
    );
    
    // Retourner une fonction pour nettoyer
    return function cleanup() {
      clearInterval(updateInterval);
      if (textDiv && textDiv.parentNode) {
        textDiv.parentNode.removeChild(textDiv);
      }
    };
  }
  
  // Charger tous les modèles avec un délai entre chaque
  let cleanupFunctions = [];
  
  MODELS.forEach((model, index) => {
    setTimeout(() => {
      const cleanup = loadModel(model, index);
      cleanupFunctions.push(cleanup);
    }, index * 1000); // 1 seconde entre chaque chargement
  });
  
  // Afficher un résumé après le chargement de tous les modèles
  setTimeout(() => {
    // console.log('[MODEL_TESTER] Test results:');
    console.table(results.map(r => ({
      name: r.name,
      success: r.success,
      loadTime: r.loadTime + 'ms',
      error: r.error || '-'
    })));
    
    // Afficher un résumé à l'écran
    const summaryDiv = document.createElement('div');
    summaryDiv.style.position = 'fixed';
    summaryDiv.style.bottom = '10px';
    summaryDiv.style.right = '10px';
    summaryDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    summaryDiv.style.color = '#0f0';
    summaryDiv.style.padding = '10px';
    summaryDiv.style.borderRadius = '5px';
    summaryDiv.style.fontFamily = 'monospace';
    summaryDiv.style.fontSize = '14px';
    summaryDiv.style.maxWidth = '400px';
    summaryDiv.style.maxHeight = '300px';
    summaryDiv.style.overflow = 'auto';
    summaryDiv.style.zIndex = '1000';
    
    const successCount = results.filter(r => r.success).length;
    summaryDiv.innerHTML = `
      <h3>Model Test Results</h3>
      <p>Successful: ${successCount}/${MODELS.length}</p>
      <ul>
        ${results.map(r => `
          <li style="color: ${r.success ? '#0f0' : '#f00'}">
            ${r.success ? '✓' : '✗'} ${r.name} (${r.loadTime}ms)
            ${r.error ? `<br><small>${r.error}</small>` : ''}
          </li>
        `).join('')}
      </ul>
      <button id="close-summary" style="background:#333; color:#0f0; border:1px solid #0f0; padding:5px 10px; cursor:pointer; margin-top:10px;">Close</button>
    `;
    
    document.body.appendChild(summaryDiv);
    
    // Bouton pour fermer le résumé
    document.getElementById('close-summary').addEventListener('click', () => {
      document.body.removeChild(summaryDiv);
      
      // Nettoyer les étiquettes
      cleanupFunctions.forEach(cleanup => cleanup());
    });
  }, MODELS.length * 1000 + 2000); // Attendre que tous les modèles soient chargés + 2 secondes
  
  return MODELS.length;
}
