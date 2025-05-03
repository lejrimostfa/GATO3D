import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// ui/minimap.js
// Gestion de la mini-map pour GATO3D

export let minimapOverlayCanvas = null; // Nouveau canvas pour le 2D
export let minimapOverlayCtx = null; // Contexte 2D de l'overlay
export let minimapCanvas = null; // Canvas principal pour le rendu 3D
export let minimapContainer = null; // Le div conteneur

// Éléments Three.js pour la minimap 3D
let minimapScene = null;
let minimapCamera = null;
let minimapRenderer = null;
let minimapSubmarineRef = null; // Référence au sous-marin (ou son clone) dans la minimapScene
let currentMinimapGridClone = null; // Référence au clone actuel de la grille dans la minimapScene

export const MINIMAP_ZOOM_MIN = 4000; // Nouveau min
export const MINIMAP_ZOOM_MAX = 100000; // Nouveau max
export const MINIMAP_ZOOM_STEP = 200;

export let minimapZoom = 4000; // Met à jour le zoom initial pour être dans la nouvelle plage
export function setMinimapZoom(newZoomValue) {
  minimapZoom = Math.max(MINIMAP_ZOOM_MIN, Math.min(newZoomValue, MINIMAP_ZOOM_MAX));
  // Ajuste la taille du frustum de la caméra ortho inversement au zoom
  // Plus le zoom est grand (valeur numérique), plus on voit large (frustum grand)
  if (minimapCamera) {
    const aspect = minimapCamera.right / minimapCamera.top; // Conserve l'aspect ratio
    minimapCamera.userData.frustumSize = minimapZoom; // Lie la taille au zoom
    minimapCamera.left   = minimapCamera.userData.frustumSize * aspect / - 2;
    minimapCamera.right  = minimapCamera.userData.frustumSize * aspect / 2;
    minimapCamera.top    = minimapCamera.userData.frustumSize / 2;
    minimapCamera.bottom = minimapCamera.userData.frustumSize / - 2;
    minimapCamera.updateProjectionMatrix();
    console.log("[Minimap] Zoom set to:", minimapZoom, "Frustum Size:", minimapCamera.userData.frustumSize);
  }
}

export function changeMinimapZoom(delta) {
  setMinimapZoom(minimapZoom + delta);
}

export let minimapRotating = true; // La minimap suit toujours le sous-marin

/**
 * Initialise la minimap 3D avec une scène, caméra et renderer dédiés.
 * @param {THREE.WebGLRenderer} rendererMain Référence au renderer principal (peut être utilisé pour des optimisations?)
 * @param {THREE.GridHelper} gridHelperFromMain Référence à la grille créée dans main.js
 */
export function initMinimap(rendererMain, gridHelperFromMain) { 
  minimapContainer = document.getElementById('minimap-container-id'); // Récupère le conteneur
  minimapCanvas = document.getElementById('minimap'); // Canvas principal (3D)
  minimapOverlayCanvas = document.getElementById('minimap-overlay'); // Canvas overlay (2D)
  if (!minimapCanvas || !minimapOverlayCanvas) {
    console.error('Minimap canvases not found!');
    return;
  }
  minimapOverlayCtx = minimapOverlayCanvas.getContext('2d');

  // Responsive : adapte la taille à la fenêtre
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.22;
  // Assure que l'overlay et le conteneur ont la même taille initiale
  if (minimapOverlayCanvas) {
    minimapOverlayCanvas.width = size;
    minimapOverlayCanvas.height = size;
  }
  if (minimapContainer) {
      minimapContainer.style.width = `${size}px`;
      minimapContainer.style.height = `${size}px`;
  }

  // Récupère le canvas et contexte pour l'overlay 2D
  if (minimapOverlayCanvas) {
    minimapOverlayCtx = minimapOverlayCanvas.getContext('2d');
  } else {
    console.error("Canvas #minimap-overlay non trouvé !");
    return; // Arrêter si le canvas overlay n'existe pas
  }

  // Initialisation de la scène et du rendu 3D pour la minimap
  minimapScene = new THREE.Scene();
  // Ajoute une lumière ambiante pour voir le modèle
  const minimapAmbientLight = new THREE.AmbientLight(0xffffff, 1.5); // Lumière blanche assez forte
  minimapScene.add(minimapAmbientLight);

  // Ajoute la grille (créée dans main.js) à la scène de la minimap
  if (gridHelperFromMain) {
      currentMinimapGridClone = gridHelperFromMain; // Store the initial clone
      minimapScene.add(currentMinimapGridClone);
      console.log('[Minimap] Initial GridHelper clone added to minimapScene.');
  } else {
      console.warn('[Minimap] GridHelper non reçu de main.js');
  }

  // Caméra Orthographique regardant vers le bas (-Z)
  const aspect = minimapCanvas.width / minimapCanvas.height;
  const frustumSize = 500; // Taille initiale de la vue, sera ajustée par le zoom
  minimapCamera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      1, // Near plane
      2000 // Far plane (assez loin pour voir le sous-marin depuis le dessus)
  );
  minimapCamera.position.set(0, 500, 0); // Position initiale au-dessus
  minimapCamera.lookAt(0, 0, 0); // Regarde l'origine initiale
  minimapScene.add(minimapCamera);

  // Renderer pour la minimap
  minimapRenderer = new THREE.WebGLRenderer({ canvas: minimapCanvas, antialias: true, alpha: true });
  minimapRenderer.setSize(minimapCanvas.width, minimapCanvas.height);
  minimapRenderer.setClearColor(0x000000, 0); // Fond transparent

  // Redimensionnement responsive (assure-toi que initMinimap est appelé après que les éléments existent)
  window.addEventListener('resize', () => {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.22;

    if (minimapContainer) {
      minimapContainer.style.width = `${size}px`;
      minimapContainer.style.height = `${size}px`;
    }
    if (minimapOverlayCanvas) {
      minimapOverlayCanvas.width = size;
      minimapOverlayCanvas.height = size;
      if(minimapOverlayCtx) minimapOverlayCtx.clearRect(0, 0, size, size); // Nettoie au resize
    }
    if (minimapCanvas && minimapRenderer && minimapCamera) {
      minimapCanvas.width = size;
      minimapCanvas.height = size;
      minimapRenderer.setSize(size, size);
      // Met à jour l'aspect ratio de la caméra ortho
      const aspect = size / size;
      minimapCamera.left = minimapCamera.userData.frustumSize * aspect / -2;
      minimapCamera.right = minimapCamera.userData.frustumSize * aspect / 2;
      minimapCamera.top = minimapCamera.userData.frustumSize / 2;
      minimapCamera.bottom = minimapCamera.userData.frustumSize / -2;
      minimapCamera.updateProjectionMatrix();
    }
  });

  // Initialise le zoom et stocke la taille du frustum pour le resize
  minimapCamera.userData.frustumSize = 500; // Taille initiale liée au zoom
  setMinimapZoom(4000); // Applique le zoom initial (qui ajustera la caméra)

  // Event listeners pour les boutons zoom
  document.getElementById('minimap-zoom-in')?.addEventListener('click', () => changeMinimapZoom(-200));
  document.getElementById('minimap-zoom-out')?.addEventListener('click', () => changeMinimapZoom(200));

  // TODO: Ajouter event listener pour close-minimap
  document.getElementById('close-minimap')?.addEventListener('click', () => {
    const minimapArea = document.getElementById('ui-minimap-area');
    if (minimapArea) minimapArea.style.display = 'none';
  });
}

// Fonction pour ajouter le sous-marin (ou son clone) à la scène minimap
export function setMinimapSubmarine(submarineObject) {
  if (minimapScene) {
    // Supprime l'ancienne référence si elle existe
    if (minimapSubmarineRef) {
      minimapScene.remove(minimapSubmarineRef);
    }
    // Clone le sous-marin, le met à l'échelle et l'ajoute à la couche 0
    minimapSubmarineRef = submarineObject.clone(); 
    minimapSubmarineRef.scale.set(20, 20, 20); // Ajuste l'échelle pour la visibilité
    minimapSubmarineRef.layers.set(0); // Assure qu'il est sur la couche par défaut
    // Assure que le clone et ses enfants sont sur la couche 0
    minimapSubmarineRef.traverse((child) => {
        child.layers.set(0);
    });
    minimapScene.add(minimapSubmarineRef);
    console.log("[Minimap] Submarine added to minimap scene.");
  } else {
    console.error("[Minimap] Minimap scene not initialized.");
  }
}

// Fonction pour mettre à jour la rotation de la boussole SVG
function updateCompassRotation(playerSubmarine) {
    const compass = document.getElementById('compass');
    if (compass && playerSubmarine) {
        const rotationRad = playerSubmarine.rotation.y;
        // La boussole tourne TOUJOURS avec le joueur car la minimap suit
        compass.style.transform = `rotate(${rotationRad}rad)`; 
        // console.log(`Compass rotating: ${rotationRad}rad`); // Décommenter si besoin
    }
}

/**
 * Dessine la minimap (maintenant uniquement en 2D sur l'overlay)
 * @param {THREE.Object3D} playerSubmarine - L'objet sous-marin (pour position/rotation)
 */
export function updateMinimap(playerSubmarine) {
  if (!minimapOverlayCtx || !minimapOverlayCanvas || !playerSubmarine) return;

  // --- Rendu 3D --- 
  if (minimapRenderer && minimapScene && minimapCamera && minimapSubmarineRef) {
      // Met à jour la position de la référence du sous-marin dans la scène minimap
      minimapSubmarineRef.position.copy(playerSubmarine.position);
      minimapSubmarineRef.rotation.copy(playerSubmarine.rotation);

      // Positionne la caméra au-dessus du sous-marin
      const cameraOffset = 500; // Distance au-dessus
      minimapCamera.position.set(
          playerSubmarine.position.x,
          playerSubmarine.position.y + cameraOffset,
          playerSubmarine.position.z
      );
      // Garde la caméra orientée vers le bas mais alignée avec le sous-marin
      minimapCamera.lookAt(playerSubmarine.position);
      // Définit le 'haut' de la caméra pour correspondre à l'avant du sous-marin
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(playerSubmarine.quaternion);
      minimapCamera.up.copy(forward);

      minimapRenderer.render(minimapScene, minimapCamera);

      // --- DEBUGGING POSITIONS ---
      console.log(`Positions - Cam: ${minimapCamera.position.x.toFixed(1)}, ${minimapCamera.position.z.toFixed(1)} | Clone: ${minimapSubmarineRef.position.x.toFixed(1)}, ${minimapSubmarineRef.position.z.toFixed(1)}`);
      // --- FIN DEBUGGING ---
  } else if (!minimapSubmarineRef) {
      // Si le sous-marin n'est pas encore chargé, on nettoie juste
      minimapRenderer?.clear();
  }

  // --- Rendu 2D (Overlay) --- 
  const minimapCtx = minimapOverlayCtx;
  const minimapWidth = minimapOverlayCanvas.width;
  const minimapHeight = minimapOverlayCanvas.height;
  const minimapCenterX = minimapWidth / 2;
  const minimapCenterY = minimapHeight / 2;
  const playerPos = playerSubmarine.position; // Utilise directement la position

  // Nettoyer l'overlay avant de redessiner
  minimapCtx.clearRect(0, 0, minimapWidth, minimapHeight);

  // Dessin du sous-marin (toujours au centre, orienté vers le haut si minimap fixe,
  // ou selon sa propre orientation si minimap rotative)
  minimapCtx.save();
  minimapCtx.translate(minimapCenterX, minimapCenterY);

  // Si la minimap tourne (minimapRotating = true), le marqueur reste pointé vers le 'haut'
  // du canvas, car c'est le contexte global (grille) qui a tourné.
  // -> Aucune rotation locale du marqueur nécessaire ici.

  minimapCtx.restore();

  // Met à jour la rotation de la boussole SVG séparément
  updateCompassRotation(playerSubmarine);
}

/**
 * Ajoute un nouveau clone de grille à la scène de la minimap.
 * @param {THREE.GridHelper} newGridClone Le nouveau clone de la grille à ajouter.
 */
export function setMinimapGrid(newGridClone) {
    if (currentMinimapGridClone) {
        console.warn('[Minimap] Trying to set a new grid while an old one might still exist. Call removeMinimapGrid first.');
        removeMinimapGrid(); // Attempt removal just in case
    }
    if (newGridClone && minimapScene) {
        currentMinimapGridClone = newGridClone;
        // Ensure clone settings
        currentMinimapGridClone.material.depthTest = true; 
        currentMinimapGridClone.layers.set(0);
        minimapScene.add(currentMinimapGridClone);
        console.log('[Minimap] New grid clone added.');
    } else {
        console.error('[Minimap] Cannot set new grid clone. Invalid clone or scene.');
    }
}

/**
 * Définit la visibilité du clone de la grille dans la minimap.
 * @param {boolean} isVisible Vrai pour afficher, faux pour cacher.
 */
export function setMinimapGridVisibility(isVisible) {
    if (currentMinimapGridClone) {
        currentMinimapGridClone.visible = isVisible;
        console.log(`[Minimap Grid] Visibility set to: ${isVisible}`);
    } else {
        console.log('[Minimap Grid] No current grid clone to set visibility.');
    }
}

/**
 * Supprime le clone actuel de la grille de la scène de la minimap.
 */
export function removeMinimapGrid() {
    if (currentMinimapGridClone && minimapScene) {
        minimapScene.remove(currentMinimapGridClone);
        // Dispose geometry/material if necessary? GridHelper might be simple enough not to need it.
        currentMinimapGridClone = null; // Clear reference
        console.log('[Minimap] Current grid clone removed.');
    } else {
        console.log('[Minimap] No current grid clone to remove or scene not ready.');
    }
}
