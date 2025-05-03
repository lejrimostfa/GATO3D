// ui/minimap.js
// Gestion de la mini-map pour GATO3D
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

export let minimapRenderer = null;
export let minimapCamera = null;

export const MINIMAP_ZOOM_MIN = 200;
export const MINIMAP_ZOOM_MAX = 5000;
export const MINIMAP_ZOOM_STEP = 200;
export const MINIMAP_CAM_HEIGHT = 2000;

export let minimapZoom = 2000;
export function setMinimapZoom(val) {
  minimapZoom = val;
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
  const minimapCanvas = document.getElementById('minimap');
  minimapRenderer = new THREE.WebGLRenderer({ canvas: minimapCanvas, antialias: true, alpha: true });
  // Responsive : adapte la taille à la fenêtre
const size = Math.min(window.innerWidth, window.innerHeight) * 0.22;
minimapRenderer.setSize(size, size);
minimapCanvas.width = size;
minimapCanvas.height = size;
  minimapRenderer.setClearColor(0x111122, 1);

  // Resize dynamique minimap
  window.addEventListener('resize', () => {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.22;
    minimapRenderer.setSize(size, size);
    minimapCanvas.width = size;
    minimapCanvas.height = size;
  });

  // Resize dynamique minimap
  window.addEventListener('resize', () => {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.22;
    minimapRenderer.setSize(size, size);
    minimapCanvas.width = size;
    minimapCanvas.height = size;
  });
  minimapCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 10000);
  minimapCamera.up.set(0,0,-1);
  minimapCamera.lookAt(new THREE.Vector3(0,-1,0));
  minimapCamera.position.set(0, 200, 0);
}

export function updateMinimap(scene, playerSubmarine, cameraFrustumHelper) {
  if (!minimapRenderer || !minimapCamera || !playerSubmarine) return;
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
  minimapRenderer.clear();
  minimapRenderer.render(scene, minimapCamera);
  if (cameraFrustumHelper) cameraFrustumHelper.visible = false;
}
