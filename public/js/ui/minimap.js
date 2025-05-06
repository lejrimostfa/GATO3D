// ui/minimap.js
// Gestion de la mini-map pour GATO3D
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// Import layer definitions
import { LAYERS } from '../water-setup.js';

export let minimapRenderer = null;
export let minimapCamera = null;

// Configure minimap zoom settings with fixed 500 unit increments
export const MINIMAP_ZOOM_MIN = 500;  // Minimum zoom level
export const MINIMAP_ZOOM_MAX = 5000; // Maximum zoom level

// Fixed 500 unit increment for minimap zoom
export function getZoomStep(currentZoom) {
  // Always return 500 as the fixed step size
  return 500;
}

export const MINIMAP_CAM_HEIGHT = 2000;

export let minimapZoom = 3000; // Default zoom level (will be rounded to nearest 500)
export function setMinimapZoom(val) {
  // Round to nearest 500
  const roundedVal = Math.round(val / 500) * 500;
  
  // Ensure zoom is always between min and max
  minimapZoom = Math.max(MINIMAP_ZOOM_MIN, Math.min(roundedVal, MINIMAP_ZOOM_MAX));
  // console.log(`[MINIMAP] Zoom set to ${minimapZoom} (rounded from ${val})`);
}

export let minimapRotating = false;
export function setMinimapRotating(val, playerSubmarine = null) {
  minimapRotating = val;
  if (!val && minimapCamera && playerSubmarine) {
    // Réaligne le nord en haut
    const center = playerSubmarine.localToWorld(new THREE.Vector3(0, 0, 0));
    minimapCamera.up.set(0, 0, -1);
    minimapCamera.lookAt(center.x, center.y, center.z);
    minimapCamera.updateProjectionMatrix();
  }
}


export function initMinimap() {
  // console.log('[MINIMAP] Initializing minimap');
  
  const minimapCanvas = document.getElementById('minimap');
  if (!minimapCanvas) {
    console.error('[MINIMAP] Cannot initialize minimap: canvas element not found');
    return;
  }
  
  minimapRenderer = new THREE.WebGLRenderer({ canvas: minimapCanvas, antialias: true, alpha: true });
  
  // Responsive: adapt size to window
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.22;
  minimapRenderer.setSize(size, size);
  minimapCanvas.width = size;
  minimapCanvas.height = size;
  minimapRenderer.setClearColor(0x111122, 1);
  
  // console.log(`[MINIMAP] Set size to ${size}x${size}`);
  
  // Fix minimap rotation toggle button position
  const minimapContainer = document.querySelector('.minimap-container');
  const rotationToggle = document.getElementById('minimap-rotation-toggle');
  
  if (rotationToggle && minimapContainer) {
    // Fix rotation toggle position
    rotationToggle.style.top = '10px';
    rotationToggle.style.right = '10px';
    rotationToggle.style.width = '24px';
    rotationToggle.style.height = '24px';
    rotationToggle.style.background = '#111c';
    rotationToggle.style.color = '#0ff';
    rotationToggle.style.border = '1px solid #0ff';
    rotationToggle.style.borderRadius = '6px';
    rotationToggle.style.cursor = 'pointer';
    rotationToggle.style.fontSize = '14px';
    rotationToggle.style.lineHeight = '22px';
    rotationToggle.style.textAlign = 'center';
  }

  // Style + and - buttons
  const zoomInBtn = document.getElementById('minimap-zoom-in');
  const zoomOutBtn = document.getElementById('minimap-zoom-out');
  
  if (zoomInBtn && zoomOutBtn) {
    [zoomInBtn, zoomOutBtn].forEach(btn => {
      btn.style.width = '24px';
      btn.style.height = '24px';
      btn.style.background = '#111c';
      btn.style.color = '#0ff';
      btn.style.border = '1px solid #0ff';
      btn.style.borderRadius = '6px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '14px';
      btn.style.lineHeight = '22px';
      btn.style.textAlign = 'center';
    });
  }
  
  // Resize dynamique minimap
  window.addEventListener('resize', () => {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.22;
    minimapRenderer.setSize(size, size);
    minimapCanvas.width = size;
    minimapCanvas.height = size;
  });
  
  // Create orthographic camera for minimap
  minimapCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 10000);
  minimapCamera.up.set(0, 0, -1);
  minimapCamera.lookAt(new THREE.Vector3(0, -1, 0));
  minimapCamera.position.set(0, 200, 0);
  
  // Configure minimap camera to only see appropriate layers
  // Reset all layers first
  minimapCamera.layers.mask = 0;
  // Enable default layer
  minimapCamera.layers.enable(LAYERS.DEFAULT);
  // Enable minimap-specific layer if needed
  minimapCamera.layers.enable(LAYERS.MINIMAP);
  // Explicitly disable the main camera layer to make sure the sun sphere is not visible
  minimapCamera.layers.disable(LAYERS.MAIN_CAMERA);
  
  // console.log('[MINIMAP] Minimap initialized successfully');
}

// Met à jour l'opacité du sous-marin en fonction de sa profondeur
function updateSubmarineOpacity(submarine) {
  if (!submarine) return;
  
  // Récupérer la position Y (profondeur) du sous-marin
  const depth = -submarine.position.y; // Convertir en positif pour la profondeur
  
  // Calculer l'opacité en fonction de la profondeur
  // Pleine opacité à la surface (y = 0), transparence maximale à -100 units
  const maxDepth = 1000; // Profondeur maximale pour l'effet de transparence (increased for deeper dives)
  const opacity = Math.max(0.3, 1 - (depth / maxDepth));
  
  // Appliquer l'opacité à tous les meshes du sous-marin
  submarine.traverse((child) => {
    if (child.isMesh) {
      if (!child.material.originalOpacity) {
        child.material.originalOpacity = child.material.opacity;
      }
      child.material.transparent = true;
      child.material.opacity = opacity;
      child.material.needsUpdate = true;
    }
  });
}

export function updateMinimap(scene, playerSubmarine, cameraFrustumHelper) {
  if (!minimapRenderer || !minimapCamera || !playerSubmarine) return;
  
  // Mettre à jour l'opacité du sous-marin
  updateSubmarineOpacity(playerSubmarine);
  // Centre géométrique du sous-marin pour la mini-map
  let center = playerSubmarine.localToWorld(new THREE.Vector3(0, 0, 0));
  minimapCamera.top = minimapZoom / 2;
  minimapCamera.bottom = -minimapZoom / 2;
  minimapCamera.left = -minimapZoom / 2;
  minimapCamera.right = minimapZoom / 2;
  if (minimapRotating && playerSubmarine) {
    const angle = -playerSubmarine.rotation.y;
    const compass = document.getElementById('compass');
    if (compass) {
      compass.style.transform = `rotate(${playerSubmarine.rotation.y}rad)`;
    }
    const radius = MINIMAP_CAM_HEIGHT;
    const cx = center.x + Math.sin(angle) * 0;
    const cz = center.z + Math.cos(angle) * 0;
    minimapCamera.position.set(
      cx + Math.sin(angle) * 0,
      radius,
      cz + Math.cos(angle) * 0
    );
    minimapCamera.up.set(Math.sin(angle), 0, -Math.cos(angle));
    minimapCamera.lookAt(center.x, center.y, center.z);
  } else {
    minimapCamera.position.set(center.x, MINIMAP_CAM_HEIGHT, center.z);
    minimapCamera.up.set(0, 0, -1);
    minimapCamera.lookAt(center.x, center.y, center.z);
    const compass = document.getElementById('compass');
    if (compass) {
      compass.style.transform = 'rotate(0rad)';
    }
  }
  minimapCamera.updateProjectionMatrix();
  if (cameraFrustumHelper) {
    cameraFrustumHelper.visible = true;
    cameraFrustumHelper.update();
  }
  // Sauvegarder l'état du fog
  const originalFog = scene.fog;
  
  // Désactiver le fog pour le rendu de la minimap
  scene.fog = null;
  
  // Rendu de la minimap
  minimapRenderer.clear();
  minimapRenderer.render(scene, minimapCamera);
  
  // Restaurer le fog
  scene.fog = originalFog;
  
  if (cameraFrustumHelper) cameraFrustumHelper.visible = false;
}
