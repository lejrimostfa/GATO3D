import { setupSkyAndWater, updateSun } from './water-setup.js';
import { loadSubmarine } from './submarine/model.js';
console.log('main.js loaded');

// public/js/main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// Global variables
let scene, camera, renderer;
let sceneHandles = null;
let minimapRenderer = null;
let minimapCamera = null;
let cameraFrustumHelper = null;
let playerSubmarine; // C'est maintenant le pivot (l'objet parent du sous-marin)
let cameraTarget = new THREE.Vector3(); // Pour le lag caméra
let cameraTargetCube = null; // Cube rouge pour debug du point visé par la caméra
let sunLight;
let ambientLight = null; // Pour contrôle dynamique sous l'eau
let fogDefault = { color: 0xbfd1e5, density: 0.00015 };
let fogUnderwater = { color: 0x226688, density: 0.003 };
let underwaterMode = false;

// Mini-map zoom state
let minimapZoom = 2000; // taille du frustum visible sur la mini-map
const MINIMAP_ZOOM_MIN = 200;
const MINIMAP_ZOOM_MAX = 5000;
const MINIMAP_ZOOM_STEP = 200;
const MINIMAP_CAM_HEIGHT = 2000; // hauteur constante de la caméra minimap
// Mini-map rotation toggle
let minimapRotating = false;

// Durée d'une journée (en secondes, modifiable par slider)
let dayDurationSeconds = 120;

// UI elements

const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');

// Clock UI elements
let clockCanvas = null;
let clockCtx = null;
let radius = 50; // Default radius, moved here

// Initialize Three.js scene
function initScene() {
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('gameCanvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // --- Mini-map renderer ---
  const minimapCanvas = document.getElementById('minimap');
  minimapRenderer = new THREE.WebGLRenderer({ canvas: minimapCanvas, antialias: true, alpha: true });
  minimapRenderer.setSize(200, 200);
  minimapRenderer.setClearColor(0x111122, 1);
  // Caméra orthographique vue de dessus
  minimapCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 10000);
  minimapCamera.up.set(0,0,-1); // Z vers le bas sur la mini-map
  minimapCamera.lookAt(new THREE.Vector3(0,-1,0));
  minimapCamera.position.set(0, 200, 0);


  // Set tone mapping for more cinematic rendering
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  // Set clear background color for debugging
  renderer.setClearColor(0x222244);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 50, 100);

  // Repère frustum pour la caméra principale (après initialisation !)
  cameraFrustumHelper = new THREE.CameraHelper(camera);
  scene.add(cameraFrustumHelper);

  // Add ambient light (référence globale)
  ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
  // Directional light (sun)
  sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunLight.position.set(0, 100, 0);
  sunLight.target.position.set(0, 0, 0);
  scene.add(sunLight);
  scene.add(sunLight.target);

  // Debug test cube
  const cubeGeo = new THREE.BoxGeometry(10, 10, 10);
  const cubeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(cubeGeo, cubeMat);
  cube.position.set(0, 10, 0);
  scene.add(cube);

  window.addEventListener('resize', onWindowResize);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Clock Drawing Functions ---
// --- Clock Drawing Functions ---
import { drawClockFace, drawTime } from './ui/clock.js';

// (Les fonctions drawClockFace et drawTime sont maintenant importées du module ui/clock.js)



// Start game after overlay
function startGame() {
  console.log('startGame called');
  overlay.style.display = 'none';
  initScene();

  // Get clock canvas context
  clockCanvas = document.getElementById('clock-canvas');
  if (clockCanvas) {
      clockCtx = clockCanvas.getContext('2d');
      radius = clockCanvas.height / 2; // RE-ADD assignment based on canvas height
  } else {
      console.error("Clock canvas element not found!");
  }

  // Sun light intensity control (set after DOM and sunLight are ready)
  setTimeout(() => {
    // Prend le slider/light-label du menu paramètres de jeu (dans game-settings-panel)
    const panel = document.getElementById('game-settings-panel');
    let lightSlider = null, lightLabel = null;
    let daySlider = null, dayLabel = null;
    if (panel) {
      lightSlider = panel.querySelector('#light-slider');
      lightLabel = panel.querySelector('#light-label');
      daySlider = panel.querySelector('#day-duration-slider');
      dayLabel = panel.querySelector('#day-duration-label');
    }
    if (lightSlider && sunLight && renderer) {
      // Valeur par défaut
      lightSlider.value = 0.21;
      sunLight.intensity = 0.21;
      renderer.toneMappingExposure = 0.21;
      if (lightLabel) lightLabel.textContent = `Light: 0.21`;
      const updateLight = () => {
        const val = parseFloat(lightSlider.value);
        sunLight.intensity = val;
        renderer.toneMappingExposure = val;
        if (lightLabel) lightLabel.textContent = `Light: ${val.toFixed(2)}`;
      };
      lightSlider.addEventListener('input', updateLight);
    }
    // Slider durée de la journée
    if (daySlider && dayLabel) {
      daySlider.value = dayDurationSeconds;
      dayLabel.textContent = `Jour: ${(dayDurationSeconds/60).toFixed(2)} min`;
      daySlider.addEventListener('input', () => {
        dayDurationSeconds = parseInt(daySlider.value);
        dayLabel.textContent = `Jour: ${(dayDurationSeconds/60).toFixed(2)} min`;
      });
    }
    // Synchronise les valeurs par défaut sliders et labels
    const camSlider = document.getElementById('camera-slider');
    const camLabel = document.getElementById('camera-label');
    const dampingSlider = document.getElementById('damping-slider');
    const dampingLabel = document.getElementById('damping-label');
    const altitudeSlider = document.getElementById('altitude-slider');
    const altitudeLabel = document.getElementById('altitude-label');
    if (camSlider && camLabel) {
      camSlider.value = 130;
      camLabel.textContent = `Camera: 130`;
    }
    if (dampingSlider && dampingLabel) {
      dampingSlider.value = 0.03;
      dampingLabel.textContent = `Damping: 0.03`;
    }
    if (altitudeSlider && altitudeLabel) {
      altitudeSlider.value = 40;
      altitudeLabel.textContent = `Altitude: 40`;
    } else {
      console.warn('Slider, sunLight, or renderer not found.');
    }
    // --- Ajout : gestion sliders menu rétractable ---
    const sliderToggle = document.getElementById('slider-toggle');
    const sliderPanel = document.getElementById('slider-panel');
    if (sliderToggle && sliderPanel) {
      sliderToggle.addEventListener('click', () => {
        sliderPanel.style.display = sliderPanel.style.display === 'none' ? 'flex' : 'none';
      });
    }
    // --- Ajout : gestion visibilité menu rétractable ---
    const visToggle = document.getElementById('visibility-toggle');
    const visPanel = document.getElementById('visibility-panel');
    if (visToggle && visPanel) {
      visToggle.addEventListener('click', () => {
        visPanel.style.display = visPanel.style.display === 'none' ? 'flex' : 'none';
      });
    }
    // --- Ajout : injection dynamique des checkboxes dans visibility-panel ---
    if (visPanel) visPanel.innerHTML = '';
    const visibilityControls = visPanel;
    // Liste des objets principaux à contrôler
    const objects = [
      { id: 'water', label: 'Eau', ref: () => sceneHandles.water },
      { id: 'sub', label: 'Sous-marin', ref: () => playerSubmarine }
    ];
    objects.forEach(obj => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'toggle-' + obj.id;
      checkbox.checked = true;
      checkbox.addEventListener('change', e => {
        const target = obj.ref();
        if (target) target.visible = e.target.checked;
      });
      const label = document.createElement('label');
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + obj.label));
      visibilityControls.appendChild(label);
      visibilityControls.appendChild(document.createElement('br'));
    });
    // --- Ajout : gestion boutons zoom mini-map ---
    const btnZoomIn = document.getElementById('minimap-zoom-in');
    const btnZoomOut = document.getElementById('minimap-zoom-out');
    if (btnZoomIn && btnZoomOut) {
      btnZoomIn.onclick = () => {
        minimapZoom = Math.max(MINIMAP_ZOOM_MIN, minimapZoom - MINIMAP_ZOOM_STEP);
        console.log('[MiniMap +] minimapZoom =', minimapZoom);
      };
      btnZoomOut.onclick = () => {
        minimapZoom = Math.min(MINIMAP_ZOOM_MAX, minimapZoom + MINIMAP_ZOOM_STEP);
        console.log('[MiniMap -] minimapZoom =', minimapZoom);
      };
    }
    // Toggle rotation mini-map
    const btnToggle = document.getElementById('minimap-rotation-toggle');
    if (btnToggle) {
      btnToggle.onclick = () => {
        minimapRotating = !minimapRotating;
        if (minimapRotating) {
          btnToggle.style.background = '#0ff';
          btnToggle.style.color = '#111';
          btnToggle.textContent = 'O';
        } else {
          btnToggle.style.background = '#111c';
          btnToggle.style.color = '#0ff';
          btnToggle.textContent = 'X';
        }
      };
      btnToggle.textContent = 'X';
    }
  }, 100);
  sceneHandles = setupSkyAndWater(scene, renderer, camera);
  const { water, sky, sun, sunSphere } = sceneHandles;
  loadSubmarine(scene, sub => {
    playerSubmarine = sub;
    // After loading submarine, initialize sun with slider default
    // REMOVED obsolete slider initialization and event listener code below
    // // After loading submarine, initialize sun with slider default
    // const slider = document.getElementById('time-slider');
    // updateSun(sceneHandles, parseFloat(slider.value));
    // document.getElementById('time-label').textContent = slider.value + ':00';
    // // Add slider event listener
    // slider.addEventListener('input', () => {
    //   const hour = parseFloat(slider.value);
    //   updateSun(sceneHandles, hour);
    //   document.getElementById('time-label').textContent = hour.toFixed(1) + ':00';
    // });
    // (Light intensity control moved outside)

    // --- Visibility controls: Génération dynamique du menu ---
    const visibilityControls = document.getElementById('visibility-panel');
    // Nettoyer le menu
    visibilityControls.innerHTML = '';
    // Liste des objets principaux à contrôler
    const objects = [
      { id: 'water', label: 'Eau', ref: () => sceneHandles.water },
      { id: 'sub', label: 'Sous-marin', ref: () => playerSubmarine }
    ];
    objects.forEach(obj => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'toggle-' + obj.id;
      checkbox.checked = true;
      checkbox.addEventListener('change', e => {
        const target = obj.ref();
        if (target) target.visible = e.target.checked;
      });
      const label = document.createElement('label');
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + obj.label));
      visibilityControls.appendChild(label);
      visibilityControls.appendChild(document.createElement('br'));
    });
  });
  animate();
}

// Button handlers
btnCreate.addEventListener('click', () => {
  startGame();
  // future: initP2P(true);
});
btnJoin.addEventListener('click', () => {
  startGame();
  // future: initP2P(false);
});

// --- Submarine movement controls ---

// --- Depth slider sync ---
const depthSlider = document.getElementById('depth-slider');
const depthValue = document.getElementById('depth-value');
if (depthSlider) depthSlider.disabled = false;

function updateDepthSlider() {
  if (!playerSubmarine || !depthSlider || !depthValue) return;
  // Calcul de la profondeur réelle (axe Y négatif)
  let y = playerSubmarine.position.y;
  if (playerSubmarine.children && playerSubmarine.children[0]) {
    y += playerSubmarine.children[0].position.y;
  }
  const depth = Math.round(y);
  depthSlider.value = depth;
  depthValue.textContent = depth + ' m';
}

const keys = {};

window.addEventListener('DOMContentLoaded', () => {
  // Fonction pour masquer/afficher les HUD selon overlay
  function updateHudVisibility() {
    
    const hudIds = [
      'minimap', 'minimap-zoom-in', 'minimap-zoom-out', 'minimap-rotation-toggle', 'compass',
      'time-slider', 'time-label',
      'visibility-toggle', 'visibility-panel', 'fps-counter',
      'slider-toggle', 'slider-panel', 'depth-slider-container',
      'game-settings-toggle', 'game-settings-panel'
    ];
    const hidden = overlay && overlay.style.display !== 'none';
    for (const id of hudIds) {
      const el = document.getElementById(id);
      if (el) el.style.display = hidden ? 'none' : '';
    }
  }

  // Menu rétractable "Paramètres de jeu"
  const btnGameSettings = document.getElementById('game-settings-toggle');
  const panelGameSettings = document.getElementById('game-settings-panel');
  if (btnGameSettings && panelGameSettings) {
    btnGameSettings.addEventListener('click', () => {
      if (panelGameSettings.style.display === 'none' || panelGameSettings.style.display === '') {
        panelGameSettings.style.display = 'flex';
      } else {
        panelGameSettings.style.display = 'none';
      }
    });
    // Par défaut, fermé
    panelGameSettings.style.display = 'none';
  }

  // Observer pour afficher le layout flex dès que l'overlay disparaît
  
  var uiBottomBar = document.getElementById('ui-bottom-bar');
  if (overlay && uiBottomBar) {
    const observer = new MutationObserver(() => {
      if (overlay.style.display === 'none') {
        uiBottomBar.style.display = 'flex';
        console.log('[DEBUG] ui-bottom-bar affiché');
      }
      if (overlay.style.display === 'none' && uiBottomBar.style.display !== 'flex') {
        uiBottomBar.style.display = 'flex';
        console.log('[DEBUG] ui-bottom-bar forcé visible (timeout)');
      }
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ['style'] });
  } else {
    console.error('[DEBUG] overlay ou ui-bottom-bar introuvable');
  }

  // Dès le chargement, et à chaque changement d'overlay
  updateHudVisibility();
  
  if (overlay) {
    const observer = new MutationObserver(updateHudVisibility);
    observer.observe(overlay, { attributes: true, attributeFilter: ['style'] });
  }
});

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function updatePlayerSubmarine() {
  if (!playerSubmarine) return;

  const speed = 0.5;
  const rotSpeed = 0.02 / 3; // 3x plus lent
  const verticalSpeed = 0.4;
  const surfaceY = 20;
  const maxDepth = 200;

  // Forward/backward (pivot)
  if (keys['z'] || keys['arrowup']) {
    playerSubmarine.translateZ(-speed);
  }
  if (keys['s'] || keys['arrowdown']) {
    playerSubmarine.translateZ(speed);
  }

  // Rotation : si on avance, rotation normale. Sinon, rotation + petite poussée avant
  const isForward = keys['z'] || keys['arrowup'];
  const isLeft = keys['q'] || keys['arrowleft'];
  const isRight = keys['d'] || keys['arrowright'];
  if (isForward) {
    if (isLeft) playerSubmarine.rotation.y += rotSpeed;
    if (isRight) playerSubmarine.rotation.y -= rotSpeed;
  } else {
    if (isLeft) {
      playerSubmarine.rotation.y += rotSpeed;
      playerSubmarine.translateZ(-speed * 0.2);
    }
    if (isRight) {
      playerSubmarine.rotation.y -= rotSpeed;
      playerSubmarine.translateZ(-speed * 0.2);
    }
  }

  // Contrôle vertical (A = monter, W = descendre) sur le sous-marin enfant
  if (playerSubmarine.children && playerSubmarine.children[0]) {
    const sub = playerSubmarine.children[0];
    if (keys['a']) sub.position.y += verticalSpeed;
    if (keys['w']) sub.position.y -= verticalSpeed;
    // Clamp la profondeur
    if (sub.position.y + playerSubmarine.position.y > surfaceY) sub.position.y = surfaceY - playerSubmarine.position.y;
    if (sub.position.y + playerSubmarine.position.y < surfaceY - maxDepth) sub.position.y = (surfaceY - maxDepth) - playerSubmarine.position.y;
  }
}

// Patch animate to update player submarine before rendering
const _orig_animate = animate;
// --- FPS counter ---
let lastFpsUpdate = performance.now();
let frameCount = 0;
let fps = 0;
const hud = document.getElementById('hud');

// --- Défilement automatique du temps ---
let timeStart = performance.now();
let lastTimeValue = 0;

function animate() {
  requestAnimationFrame(animate);
  updatePlayerSubmarine();
  updateDepthSlider();

  // --- FPS counter ---
  frameCount++;
  const now = performance.now();
  if (now - lastFpsUpdate > 500) {
    fps = Math.round(frameCount * 1000 / (now - lastFpsUpdate));
    lastFpsUpdate = now;
    frameCount = 0;
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) fpsCounter.textContent = `FPS: ${fps}`;
  }

  // --- Défilement automatique du temps (0 à 24h en 300s = 5min) ---
  const elapsedTime = performance.now() - timeStart;
  const timeOfDay = (elapsedTime / (dayDurationSeconds * 1000)) % 1; // Fraction of day (0-1)
  const currentGameHour = timeOfDay * 24; // Hour (0-24)

  // Update sun position based on time
  if (sceneHandles) { // Ensure sceneHandles is initialized
    updateSun(sceneHandles, currentGameHour); // Pass sceneHandles and currentGameHour
  }

  // --- Update Clock UI --- 
  if (clockCtx && clockCanvas) {
    const currentRadius = clockCanvas.height / 2; // Use current radius
    clockCtx.clearRect(0, 0, clockCanvas.width, clockCanvas.height);
    drawClockFace(clockCtx, currentRadius);
    drawTime(clockCtx, currentRadius, currentGameHour); // Pass currentGameHour
  } else if (!clockCanvas) {
    // Try to get canvas again if it wasn't found initially
    clockCanvas = document.getElementById('clock-canvas');
    if (clockCanvas) {
      clockCtx = clockCanvas.getContext('2d');
    }
  }

  // --- FPS counter ---
  frameCount++;
  if (now - lastFpsUpdate > 400) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    const fpsDiv = document.getElementById('fps-counter');
    if (fpsDiv) fpsDiv.textContent = `FPS: ${fps}`;
    lastFpsUpdate = now;
    frameCount = 0;
  }

  // Créer le cube rouge une seule fois
  if (!cameraTargetCube && scene) {
    const geo = new THREE.BoxGeometry(2,2,2);
    const mat = new THREE.MeshBasicMaterial({color:0xff0000});
    cameraTargetCube = new THREE.Mesh(geo, mat);
    scene.add(cameraTargetCube);
  }

  // Caméra de poursuite avec lag (centrée sur le pivot du sous-marin)
  if (playerSubmarine) {
    // Lire la distance caméra depuis le slider
    const cameraSlider = document.getElementById('camera-slider');
    let camDist = 130;
    if (cameraSlider) camDist = parseFloat(cameraSlider.value);
    const dampingSlider = document.getElementById('damping-slider');
    let damping = 0.03;
    if (dampingSlider) damping = parseFloat(dampingSlider.value);
    const altitudeSlider = document.getElementById('altitude-slider');
    const altitudeLabel = document.getElementById('altitude-label');
    let camAltitude = 15;
    if (altitudeSlider) camAltitude = parseFloat(altitudeSlider.value);
    if (altitudeLabel) altitudeLabel.textContent = `Altitude: ${camAltitude}`;
    // Calcul de la position verticale réelle du sous-marin (pivot + enfant)
    let subY = playerSubmarine.position.y;
    if (playerSubmarine.children && playerSubmarine.children[0]) {
      subY += playerSubmarine.children[0].position.y;
    }
    // --- Correction 1 : caméra derrière le sous-marin (third person classique) ---
    // Place la caméra derrière le sous-marin selon son orientation
    const idealCamPos = playerSubmarine.position.clone();
    idealCamPos.x += camDist * Math.sin(playerSubmarine.rotation.y); // + pour être derrière
    idealCamPos.z += camDist * Math.cos(playerSubmarine.rotation.y);
    idealCamPos.y = subY + camAltitude;

    // --- Correction ultime : délai 200ms uniquement sur la rotation horizontale (X/Z), suivi vertical (Y) immédiat ---
    if (!window._lastRot) window._lastRot = playerSubmarine.rotation.y;
    if (!window._rotDelayTimer) window._rotDelayTimer = 0;
    if (!window._rotDampingStart) window._rotDampingStart = null;
    if (!window._rotDampingDuration) window._rotDampingDuration = 0;
    if (!window._lastXZ) window._lastXZ = { x: playerSubmarine.position.x, z: playerSubmarine.position.z, rot: playerSubmarine.rotation.y };

    // Détection rotation
    const rotChanged = Math.abs(window._lastRot - playerSubmarine.rotation.y) > 1e-4;
    if (rotChanged) {
      window._rotDelayTimer = performance.now();
      window._rotDampingStart = null;
      window._lastRot = playerSubmarine.rotation.y;
      window._lastXZ.rot = playerSubmarine.rotation.y;
    }
    // Calcul de la cible XZ derrière le sub selon la rotation
    const camDistX = camDist * Math.sin(window._lastXZ.rot);
    const camDistZ = camDist * Math.cos(window._lastXZ.rot);
    let targetX = playerSubmarine.position.x + camDistX;
    let targetZ = playerSubmarine.position.z + camDistZ;
    // Si délai rotation écoulé, on lance le damping easeInOut
    if (performance.now() - window._rotDelayTimer > 200 && rotChanged) {
      window._rotDampingStart = performance.now();
      window._rotDampingDuration = 400;
      window._lastXZ.rot = playerSubmarine.rotation.y;
    }
    // Interpolation easeInOutQuad sur la rotation (XZ) si damping en cours
    if (window._rotDampingStart) {
      let t = (performance.now() - window._rotDampingStart) / window._rotDampingDuration;
      if (t >= 1) {
        window._rotDampingStart = null;
        window._lastXZ.rot = playerSubmarine.rotation.y;
        targetX = playerSubmarine.position.x + camDist * Math.sin(playerSubmarine.rotation.y);
        targetZ = playerSubmarine.position.z + camDist * Math.cos(playerSubmarine.rotation.y);
      } else {
        // easeInOutQuad
        t = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
        const fromX = playerSubmarine.position.x + camDist * Math.sin(window._lastXZ.rot);
        const fromZ = playerSubmarine.position.z + camDist * Math.cos(window._lastXZ.rot);
        const toX = playerSubmarine.position.x + camDist * Math.sin(playerSubmarine.rotation.y);
        const toZ = playerSubmarine.position.z + camDist * Math.cos(playerSubmarine.rotation.y);
        targetX = fromX + (toX - fromX) * t;
        targetZ = fromZ + (toZ - fromZ) * t;
      }
    } else {
      window._lastXZ.rot = playerSubmarine.rotation.y;
      targetX = playerSubmarine.position.x + camDist * Math.sin(playerSubmarine.rotation.y);
      targetZ = playerSubmarine.position.z + camDist * Math.cos(playerSubmarine.rotation.y);
    }
    // Suivi vertical immédiat (Y)
    let camSubY = playerSubmarine.position.y;
    if (playerSubmarine.children && playerSubmarine.children[0]) {
      camSubY += playerSubmarine.children[0].position.y;
    }
    const targetY = camSubY + camAltitude;
    // Lerp caméra vers la cible (XZ interpolé, Y immédiat)
    camera.position.x += (targetX - camera.position.x) * damping;
    camera.position.z += (targetZ - camera.position.z) * damping;
    camera.position.y += (targetY - camera.position.y) * damping * 2; // Y plus réactif

    // Toujours regarder le centre du sous-marin (pivot + enfant)
    const lookAtTarget = playerSubmarine.position.clone();
    lookAtTarget.y = camSubY;
    camera.lookAt(lookAtTarget);
  } else if (cameraTargetCube) {
    cameraTargetCube.visible = false;
  }
  if (sceneHandles && sceneHandles.water) {
    sceneHandles.water.material.uniforms['time'].value += 1 / 60;
  }
  // --- Ambiance sous-marine dynamique ---
  if (camera) {
    const surfaceY = 20;
    if (camera.position.y < surfaceY) {
      // Sous l'eau : fog bleu-vert + lumière faible
      if (!underwaterMode) {
        scene.fog = new THREE.FogExp2(fogUnderwater.color, fogUnderwater.density);
        if (ambientLight) {
          ambientLight.intensity = 0.18;
          ambientLight.color.set(0x226688);
        }
        underwaterMode = true;
      }
    } else {
      // Au-dessus : fog normal + lumière normale
      if (underwaterMode) {
        scene.fog = new THREE.FogExp2(fogDefault.color, fogDefault.density);
        if (ambientLight) {
          ambientLight.intensity = 0.5;
          ambientLight.color.set(0xffffff);
        }
        underwaterMode = false;
      }
    }
  }
  // --- Ambiance sous-marine dynamique ---
  if (camera) {
    const surfaceY = 20;
    if (camera.position.y < surfaceY) {
      // Sous l'eau : fog bleu-vert + lumière faible
      if (!underwaterMode) {
        scene.fog = new THREE.FogExp2(fogUnderwater.color, fogUnderwater.density);
        if (ambientLight) {
          ambientLight.intensity = 0.18;
          ambientLight.color.set(0x226688);
        }
        underwaterMode = true;
      }
    } else {
      // Au-dessus : fog normal + lumière normale
      if (underwaterMode) {
        scene.fog = new THREE.FogExp2(fogDefault.color, fogDefault.density);
        if (ambientLight) {
          ambientLight.intensity = 0.5;
          ambientLight.color.set(0xffffff);
        }
        underwaterMode = false;
      }
    }
  }
  // --- Frustum helper : visible uniquement dans la mini-map ---
  if (cameraFrustumHelper) cameraFrustumHelper.visible = false;
  renderer.render(scene, camera);

  // --- Mini-map ---
  if (minimapRenderer && minimapCamera && playerSubmarine) {
    // Centrer la caméra mini-map sur le pivot du sous-marin (pas de rotation)
    // Centre géométrique du sous-marin pour la mini-map
    let center = playerSubmarine.localToWorld(new THREE.Vector3(0, 0, 0));
    // Position Y constante, zoom via le frustum
    minimapCamera.top = minimapZoom / 2;
    minimapCamera.bottom = -minimapZoom / 2;
    minimapCamera.left = -minimapZoom / 2;
    minimapCamera.right = minimapZoom / 2;
    if (minimapRotating && playerSubmarine) {
      // Vue qui tourne autour du sub : la caméra pivote selon -rotation.y
      const angle = -playerSubmarine.rotation.y;
      // --- Synchronisation boussole ---
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
      // On regarde le sub, mais on tourne la caméra autour de Y
      minimapCamera.up.set(Math.sin(angle), 0, -Math.cos(angle));
      minimapCamera.lookAt(center.x, center.y, center.z);
    } else {
      // Nord en haut
      minimapCamera.position.set(center.x, MINIMAP_CAM_HEIGHT, center.z);
      minimapCamera.up.set(0, 0, -1);
      minimapCamera.lookAt(center.x, center.y, center.z);
    }
    minimapCamera.updateProjectionMatrix();
    // Frustum helper visible uniquement pour la mini-map
    if (cameraFrustumHelper) {
      cameraFrustumHelper.visible = true;
      cameraFrustumHelper.update();
    }
    minimapRenderer.clear();
    minimapRenderer.render(scene, minimapCamera);
    if (cameraFrustumHelper) cameraFrustumHelper.visible = false;
  }
}