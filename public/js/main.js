import { setupSkyAndWater, updateSun } from './water-setup.js';
import { loadSubmarine } from './submarine/model.js';
import { updatePlayerSubmarine } from './submarine/controls.js';
import { initMenus } from './ui/menus.js';
import { initSettings } from './ui/settings.js';
import { initLighting } from './lighting.js';
import { loadLevel } from './levels/levelManager.js';
import { drawClockFace, drawTime } from './ui/clock.js';
import { initSpeedometer, updateSpeedometer } from './ui/speedometer.js';
import * as settingsUI from './ui/settings.js'; // Importer tout le module sous l'alias settingsUI
console.log('main.js loaded');

// public/js/main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// Global variables
let scene, camera, renderer;
let sceneHandles = null;
let pausedHour = 0;
let currentGameHour = 0;
let cameraFrustumHelper = null;
let playerSubmarine; // C'est maintenant le pivot (l'objet parent du sous-marin)
let cameraTarget = new THREE.Vector3(); // Pour le lag caméra
let cameraTargetCube = null; // Cube rouge pour debug du point visé par la caméra
let sunLight;
let ambientLight = null; // Pour contrôle dynamique sous l'eau
let fogDefault = { color: 0xbfd1e5, density: 0.00015 };
let fogUnderwater = { color: 0x226688, density: 0.003 };
let underwaterMode = false;

import { initMinimap, updateMinimap, minimapZoom, minimapRotating, setMinimapZoom, setMinimapSubmarine, MINIMAP_ZOOM_MIN, MINIMAP_ZOOM_MAX, MINIMAP_ZOOM_STEP } from './ui/minimap.js';
// Import new functions for grid management (will be created in minimap.js)
import { setMinimapGrid, removeMinimapGrid } from './ui/minimap.js'; 
 
// Import new function for grid visibility (will be created in minimap.js)
import { setMinimapGridVisibility } from './ui/minimap.js'; 
 
// Durée d'une journée (en secondes, modifiable par slider)
let dayDurationSeconds = 120;
let maxSpeed = 300; // Vitesse max initiale (unités/seconde)

// --- Grid Helper Reference (accessible globally) ---
let gridHelper = null;
const GRID_SIZE = 100000; // Keep size constant
const GRID_INITIAL_Y = 100;

import { initDayDurationSlider } from './ui/time-slider.js';
import { updateHudVisibility } from './ui/hud.js';

// UI elements

const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const btnEditor = document.getElementById('btn-editor');

// Clock UI elements
let clockCanvas = null;
let clockCtx = null;
let radius = 50; // Default radius, moved here

// Initialise le jeu et charge la scène du niveau 1
function initGame() {
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('gameCanvas') });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.21; // Valeur initiale, sera contrôlée par le slider
  loadLevel('level1', renderer, ({scene: loadedScene, camera: loadedCamera, objects}) => {
    scene = loadedScene;
    camera = loadedCamera;
    camera.layers.set(0); // Assure que la caméra principale ne voit que la couche 0

    // --- Vérification et ajustement du Frustum Caméra Principale ---
    console.log(`[Camera Frustum] Initial - Near: ${camera.near}, Far: ${camera.far}`);
    camera.far = 150000; // Augmente pour voir la grille large
    camera.updateProjectionMatrix(); // Important après changement de frustum
    console.log(`[Camera Frustum] Ajusté - Near: ${camera.near}, Far: ${camera.far}`);
    // --- Fin ajustement Frustum ---

    sceneHandles = objects.sceneHandles;
    // Utilise les lumières déjà créées par setupSkyAndWater
    ambientLight = sceneHandles.ambientLight;
    // Initialisation UI, sous-marin, etc. ici
    loadSubmarine(scene, sub => {
      // Reconnexion explicite : la caméra suit toujours ce pivot parent du sous-marin
      playerSubmarine = sub;
      console.log('[CAMERA] Caméra reconnectée au sous-marin', playerSubmarine);
      // --- Initial Grid Creation ---
      const initialResolution = 10;
      gridHelper = new THREE.GridHelper(GRID_SIZE, initialResolution, 0x00ff00, 0x004400); // Assign to global reference
      gridHelper.position.y = GRID_INITIAL_Y; // Nettement au-dessus de Y=0
      gridHelper.layers.set(0); // Couche par défaut
      scene.add(gridHelper);
      // Initialise la minimap and pass the INITIAL grid CLONE
      initMinimap(sceneHandles.renderer, gridHelper.clone()); 
 
      // Correction bug : force la minimap à s'initialiser à la bonne taille dès le lancement
      window.dispatchEvent(new Event('resize'));

      // --- Initialize Grid Resolution Slider ---
      const gridResolutionSlider = document.getElementById('grid-resolution-slider');
      const gridResolutionLabel = document.getElementById('grid-resolution-label');

      if (gridResolutionSlider && gridResolutionLabel) {
        gridResolutionSlider.addEventListener('input', (event) => {
          const newResolution = parseInt(event.target.value, 10);
          gridResolutionLabel.textContent = `Résolution Grille: ${newResolution}`;

          // 1. Remove old grids
          if (gridHelper) {
            scene.remove(gridHelper); // Remove from main scene
            removeMinimapGrid();     // Remove clone from minimap (function to be added in minimap.js)
          }

          // 2. Create new grid
          gridHelper = new THREE.GridHelper(GRID_SIZE, newResolution, 0x00ff00, 0x004400);
          gridHelper.position.y = GRID_INITIAL_Y; 
          gridHelper.layers.set(0); 

          // 3. Add new grids
          scene.add(gridHelper);                 // Add to main scene
          setMinimapGrid(gridHelper.clone());   // Add new clone to minimap (function to be added in minimap.js)

          console.log(`[GRID] Resolution changed to: ${newResolution}`);
        });
      } else {
        console.warn('Grid resolution slider elements not found.');
      }

      // --- Initialize Grid Visibility Checkbox ---
      const gridVisibilityCheckbox = document.getElementById('grid-visibility-checkbox');

      if (gridVisibilityCheckbox) {
          // Set initial visibility based on default checked state (which is true)
          if (gridHelper) gridHelper.visible = gridVisibilityCheckbox.checked;
          setMinimapGridVisibility(gridVisibilityCheckbox.checked); // Toggle minimap clone too

          gridVisibilityCheckbox.addEventListener('change', (event) => {
              const isVisible = event.target.checked;
              if (gridHelper) {
                  gridHelper.visible = isVisible;
              }
              setMinimapGridVisibility(isVisible); // Toggle minimap clone too
              console.log(`[GRID] Visibility set to: ${isVisible}`);
          });
      } else {
          console.warn('Grid visibility checkbox not found.');
      }

      // --- End Grid Visibility Checkbox Init ---

      // --- Ajoute le sous-marin à la minimap --- 
      if (playerSubmarine) {
        setMinimapSubmarine(playerSubmarine); // Transmet le pivot contenant le modèle
      }

      // Initialisation des sliders et paramètres UI
      initSettings(
          sceneHandles, 
          playerSubmarine, 
          val => { dayDurationSeconds = val; }, // Callback for day duration
          newSpeed => { 
            maxSpeed = newSpeed; 
            console.log(`[SETTINGS] Max Speed updated to: ${maxSpeed}`); // Add log here
          }     
       );
      // Active les sliders avancés de lumière (nouveau menu)
      import('./ui/settings.js').then(mod => { mod.initLightSliders(sceneHandles); });

      // Démarre la boucle d'animation principale une fois tout chargé
      animate();
    });
    // ...
  });
}

// Appel au démarrage
const uiMenus = document.getElementById('ui-menus');
if (uiMenus) uiMenus.style.display = 'none';
initGame();

// --- Resize dynamique ---
window.addEventListener('resize', () => {
  if (renderer && camera) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
      gameCanvas.width = w;
      gameCanvas.height = h;
    }
    // --- Responsive HUD ---
    // Minimap
    const minimapContainer = document.getElementById('minimap-container');
    const minimap = document.getElementById('minimap');
    if (minimapContainer && minimap) {
      const minSize = Math.min(w, h) * 0.22;
      minimapContainer.style.width = minSize + 'px';
      minimapContainer.style.height = minSize + 'px';
      minimap.width = minSize;
      minimap.height = minSize;
    }
    // Horloge
    const clockCanvas = document.getElementById('clock-canvas');
    if (clockCanvas) {
      const clockSize = Math.min(w, h) * 0.14;
      clockCanvas.width = clockSize;
      clockCanvas.height = clockSize;
    }
  }
});
// --- Responsive boutons menus (corrigé) ---
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const menuButtons = document.querySelectorAll('.menu-btn, .hud-btn');
  if (menuButtons) {
    const btnSize = Math.max(32, Math.min(w, h) * 0.045);
    menuButtons.forEach(btn => {
      btn.style.fontSize = (btnSize * 0.5) + 'px';
      btn.style.width = btn.style.height = btnSize + 'px';
      btn.style.padding = (btnSize * 0.12) + 'px';
    });
  }
  // --- Responsive boutons minimap ---
  const minimapZoomIn = document.getElementById('minimap-zoom-in');
  const minimapZoomOut = document.getElementById('minimap-zoom-out');
  const minimapCanvas = document.getElementById('minimap');
  if (minimapZoomIn && minimapZoomOut && minimapCanvas) {
    // Utilise la taille réelle du canvas minimap pour le scaling
    const miniSize = minimapCanvas.offsetWidth || minimapCanvas.width || Math.min(w, h) * 0.22;
    const btnMini = Math.max(24, miniSize * 0.18);
    // Boutons + et - (hors overlay, à droite de la minimap)
    minimapZoomIn.style.width = minimapZoomOut.style.width = btnMini + 'px';
    minimapZoomIn.style.height = minimapZoomOut.style.height = btnMini + 'px';
    minimapZoomIn.style.fontSize = minimapZoomOut.style.fontSize = (btnMini * 0.55) + 'px';
    minimapZoomIn.style.borderRadius = minimapZoomOut.style.borderRadius = (btnMini * 0.28) + 'px';
    minimapZoomIn.style.position = minimapZoomOut.style.position = 'static';
    minimapZoomIn.style.margin = minimapZoomOut.style.margin = (btnMini * 0.12) + 'px 0';

    // Centrage vertical dynamique du groupe de boutons
    const btnsGroup = document.querySelector('.minimap-btns-group');
    if (btnsGroup) {
      btnsGroup.style.gap = (btnMini * 0.18) + 'px';
      btnsGroup.style.justifyContent = 'center';
      btnsGroup.style.height = miniSize + 'px';
    }

    // Boussole responsive en haut-gauche
    const compass = document.getElementById('compass');
    if (compass) {
      const compassSize = Math.max(28, miniSize * 0.19);
      compass.setAttribute('width', compassSize);
      compass.setAttribute('height', compassSize);
      compass.style.position = 'absolute';
      compass.style.left = (miniSize * 0.04) + 'px';
      compass.style.top = (miniSize * 0.04) + 'px';
    }
  }
});


// (Les fonctions drawClockFace et drawTime sont maintenant importées du module ui/clock.js)



// Start game after overlay
function startGame() {
  console.log('startGame called');
  overlay.style.display = 'none';
  const uiMenus = document.getElementById('ui-menus');
  if (uiMenus) uiMenus.style.display = 'block';
  initGame();

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

    // Initialisation du slider de durée de journée via module
    initDayDurationSlider(val => { dayDurationSeconds = val; });
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
      dampingSlider.value = 0.005;
      dampingLabel.textContent = `Damping: ${parseFloat(dampingSlider.value).toFixed(3)}`;
      dampingSlider.addEventListener('input', () => {
        dampingLabel.textContent = `Damping: ${parseFloat(dampingSlider.value).toFixed(3)}`;
      });
    }
    if (altitudeSlider && altitudeLabel) {
      altitudeSlider.value = 40;
      altitudeLabel.textContent = `Altitude: 40`;
    } else {
      console.warn('Slider, sunLight, or renderer not found.');
    }
    // --- Ajout : gestion sliders menu rétractable ---
    // --- Initialisation des sliders et contrôles (centralisée) ---
    initSettings(
        sceneHandles, 
        playerSubmarine, 
        val => { dayDurationSeconds = val; }, // Callback for day duration
        newSpeed => { 
          maxSpeed = newSpeed; 
          console.log(`[SETTINGS] Max Speed updated to: ${maxSpeed}`); // Add log here
        }
    );
    // --- Ajout : gestion boutons zoom mini-map ---
    const btnZoomIn = document.getElementById('minimap-zoom-in');
    const btnZoomOut = document.getElementById('minimap-zoom-out');
    if (btnZoomIn && btnZoomOut) {
      btnZoomIn.onclick = () => {
        setMinimapZoom(Math.max(MINIMAP_ZOOM_MIN, minimapZoom - MINIMAP_ZOOM_STEP));
        console.log('[MiniMap +] minimapZoom =', minimapZoom);
      };
      btnZoomOut.onclick = () => {
        setMinimapZoom(Math.min(MINIMAP_ZOOM_MAX, minimapZoom + MINIMAP_ZOOM_STEP));
        console.log('[MiniMap -] minimapZoom =', minimapZoom);
      };
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

if (btnEditor) {
  btnEditor.addEventListener('click', async () => {
    // Masquer overlay
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'none';
    // Masquer toutes les UI du jeu
    const uiMenus = document.getElementById('ui-menus');
    if (uiMenus) uiMenus.style.display = 'none';
    const uiBottomBar = document.getElementById('ui-bottom-bar');
    if (uiBottomBar) uiBottomBar.style.display = 'none';
    const uiMinimap = document.getElementById('ui-minimap-area');
    if (uiMinimap) uiMinimap.style.display = 'none';
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
    const depthIndicator = document.getElementById('ui-depth-indicator');
    if (depthIndicator) depthIndicator.style.display = 'none';
    // Sécurité : forcer le masquage périodique
    window.__editorHideUIInterval = setInterval(() => {
      if (uiBottomBar) uiBottomBar.style.display = 'none';
      if (uiMinimap) uiMinimap.style.display = 'none';
      if (uiMenus) uiMenus.style.display = 'none';
      if (hud) hud.style.display = 'none';
      if (depthIndicator) depthIndicator.style.display = 'none';
    }, 500);
    // Lancer l'éditeur
    const editor = await import('./editor.js');
    if (editor && editor.initEditor) editor.initEditor();
  });
}


// --- Submarine movement controls ---
const keys = {};

window.addEventListener('DOMContentLoaded', () => {
  // Initialise la gestion des menus (centralisée)
  initMenus([
    {btnId: 'game-settings-toggle', panelId: 'game-settings-panel'},
    {btnId: 'slider-toggle', panelId: 'slider-panel'},
    {btnId: 'light-settings-toggle', panelId: 'light-settings-panel'}
  ]);
  initSpeedometer();
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

  window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'p') {
      if (!isTimePaused) {
        // On passe en pause : capture l'heure courante
        pausedHour = currentGameHour;
        console.log('[DEBUG] pausedHour capturé à', pausedHour);
        pausedAt = performance.now();
        isTimePaused = true;
        console.log('[PAUSE] Temps du jeu en pause (P)');
      } else {
        // On quitte la pause
        isTimePaused = false;
        // Décale timeStart pour que le temps ne saute pas
        timeStart += performance.now() - pausedAt;
        console.log('[RESUME] Temps du jeu repris (P)');
      }
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;

});

  // Masquer les menus initiaux avant le démarrage
  const uiMenus = document.getElementById('ui-menus');
  if (uiMenus) uiMenus.style.display = 'none';
});

// Contrôles du sous-marin déplacés dans submarine/controls.js


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
let isTimePaused = false;
let pausedAt = 0;

let lastFrameTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1); // clamp à 0.1s
  lastFrameTime = now;

  const currentSubSpeed = updatePlayerSubmarine(playerSubmarine, keys, deltaTime, maxSpeed);

  updateSpeedometer(currentSubSpeed, maxSpeed);

  // --- FPS counter ---
  frameCount++;
  const nowFps = performance.now();
  if (nowFps - lastFpsUpdate > 500) {
    fps = Math.round(frameCount * 1000 / (nowFps - lastFpsUpdate));
    lastFpsUpdate = nowFps;
    frameCount = 0;
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) fpsCounter.textContent = `FPS: ${fps}`;
  }

  // --- Défilement automatique du temps (0 à 24h en 300s = 5min) ---
  let elapsedTime = performance.now() - timeStart;
  currentGameHour = ((elapsedTime / (dayDurationSeconds * 1000)) * 24) % 24;
  if (isTimePaused) {
    currentGameHour = pausedHour;
    if (typeof window.setRayleighGraphHour === 'function') {
      window.setRayleighGraphHour(pausedHour);
      // DEBUG: log la valeur envoyée pendant la pause
      // console.log('[SYNC PAUSE] minigraph <-', pausedHour);
    }
  } else {
    if (typeof window.setRayleighGraphHour === 'function') {
      window.setRayleighGraphHour(currentGameHour);
      // DEBUG: log la valeur envoyée en temps réel
      // console.log('[SYNC RUN] minigraph <-', currentGameHour);
    }
  }
  const timeOfDay = (elapsedTime / (dayDurationSeconds * 1000)) % 1; // Fraction of day (0-1)

  // --- Rayleigh dynamique (ciel rouge matin/soir, bleu pâle midi/minuit) ---
  if (sceneHandles && sceneHandles.sky && sceneHandles.sky.material && sceneHandles.sky.material.uniforms.rayleigh) {
    // Synchronise la barre blanche du minigraphique avec l'heure courante
    if (typeof window.setRayleighGraphHour === 'function') {
      window.setRayleighGraphHour(currentGameHour);
    }

    // Mode sélectionné par l'utilisateur
    let rayleigh;
    const mode = (typeof window.getRayleighMode === 'function') ? window.getRayleighMode() : 'auto';
    const period = (typeof window.getRayleighPeriod === 'function') ? window.getRayleighPeriod() : 24;
    const phase = (typeof window.getRayleighPhase === 'function') ? window.getRayleighPhase() : 21;
    let t = currentGameHour % period;
    if (mode === 'auto') {
      // Courbe en cloche : Rayleigh max à 6h/18h, min à 0h/12h/24h
      // Utilise cosinus sur période et phase paramétrables
      rayleigh = 0.5 + (6 - 0.5) * 0.5 * (1 - Math.cos(2 * Math.PI * ((t - phase) / period)));
    } else if (mode === 'sin') {
      // Sinus simple : max à 6h/18h, min à 0h/12h/24h
      rayleigh = 0.5 + (6 - 0.5) * 0.5 * (1 - Math.cos(2 * Math.PI * ((t - phase) / period)));
    } else if (mode === 'manual') {
      // Contrôle manuel : ne pas écraser la valeur du slider
      rayleigh = sceneHandles.sky.material.uniforms.rayleigh.value;
    } else {
      // fallback
      rayleigh = 2.5;
    }
    sceneHandles.sky.material.uniforms.rayleigh.value = rayleigh;
    // Met à jour le slider Rayleigh si la fonction est dispo
    settingsUI.updateRayleighSlider(rayleigh); // Appel via le namespace
  }

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
  if (!playerSubmarine) {
    // Tentative de reconnexion automatique : cherche un objet nommé 'Pivot' dans la scène
    if (scene) {
      const found = scene.children.find(obj => obj.name === 'Pivot' || obj.type === 'Group');
      if (found) {
        playerSubmarine = found;
        console.warn('[CAMERA][AUTO] Pivot du sous-marin retrouvé et reconnecté', playerSubmarine);
      } else {
        console.warn('[CAMERA][WARN] Pivot du sous-marin introuvable dans la scène !');
      }
    }
  }
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
    // --- Suivi caméra du sous-marin ---
    if (playerSubmarine && camera) {
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
    }
    // --- Fin suivi caméra ---
  } else if (cameraTargetCube) {
    cameraTargetCube.visible = false;
  }
  if (sceneHandles && sceneHandles.water) {
    sceneHandles.water.material.uniforms['time'].value += 1 / 60;
  }
  // --- Mise à jour brouillard --- 
  const targetFog = underwaterMode ? fogUnderwater : fogDefault;
  if (scene.fog) {
      scene.fog.color.lerp(new THREE.Color(targetFog.color), 0.05);
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetFog.density, 0.05);
  } else {
      // S'il n'y a pas de brouillard, en créer un directement avec les bonnes valeurs
      scene.fog = new THREE.FogExp2(targetFog.color, targetFog.density);
  }
  // --- Rendu --- 
  renderer.render(scene, camera);
}