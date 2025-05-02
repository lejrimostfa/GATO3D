

import { setupSkyAndWater, updateSun } from './water-setup.js';
import { loadSubmarine } from './submarine.js';
console.log('main.js loaded');

// public/js/main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// Global variables
let scene, camera, renderer;
let sceneHandles = null;
let playerSubmarine;
let sunLight;

// UI elements
const overlay = document.getElementById('overlay');
const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');

// Initialize Three.js scene
function initScene() {
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('gameCanvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Set tone mapping for more cinematic rendering
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  // Set clear background color for debugging
  renderer.setClearColor(0x222244);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 50, 100);

  // Add ambient light
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  // Directional light
  sunLight = new THREE.DirectionalLight(0xffffff, 1.0); 
  scene.add(sunLight);

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



// Start game after overlay
function startGame() {
  console.log('startGame called');
  overlay.style.display = 'none';
  initScene();
  // Sun light intensity control (set after DOM and sunLight are ready)
  setTimeout(() => {
    const lightSlider = document.getElementById('light-slider');
    const lightLabel = document.getElementById('light-label');
    if (lightSlider && sunLight && renderer) {
      const updateLight = () => {
        const val = parseFloat(lightSlider.value);
        sunLight.intensity = val;
        renderer.toneMappingExposure = val; // <-- Ceci rend l'effet visible
        lightLabel.textContent = `Light: ${val.toFixed(2)}`;
      };
      lightSlider.addEventListener('input', updateLight);
      updateLight();
    } else {
      console.warn('Slider, sunLight, or renderer not found.');
    }
  }, 100);
  sceneHandles = setupSkyAndWater(scene, renderer, camera);
  const { water, sky, sun, sunSphere } = sceneHandles;
  loadSubmarine(scene, sub => {
    playerSubmarine = sub;
    // After loading submarine, initialize sun with slider default
    const slider = document.getElementById('time-slider');
    updateSun(sceneHandles, parseFloat(slider.value));
    document.getElementById('time-label').textContent = slider.value + ':00';
    // Add slider event listener
    slider.addEventListener('input', () => {
      const hour = parseFloat(slider.value);
      updateSun(sceneHandles, hour);
      document.getElementById('time-label').textContent = hour.toFixed(1) + ':00';
    });
    // (Light intensity control moved outside)

    // --- Visibility controls for water, sun, submarine ---
    document.getElementById('toggle-water').addEventListener('change', e => {
      if (sceneHandles && sceneHandles.water) sceneHandles.water.visible = e.target.checked;
    });
    document.getElementById('toggle-sun').addEventListener('change', e => {
      if (sceneHandles && sceneHandles.sunSphere) sceneHandles.sunSphere.visible = e.target.checked;
    });
    document.getElementById('toggle-sub').addEventListener('change', e => {
      if (playerSubmarine) playerSubmarine.visible = e.target.checked;
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
const keys = {};

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function updatePlayerSubmarine() {
  if (!playerSubmarine) return;

  const speed = 0.5;
  const rotSpeed = 0.02;

  // Forward/backward
  if (keys['z'] || keys['arrowup']) {
    playerSubmarine.translateZ(-speed);
  }
  if (keys['s'] || keys['arrowdown']) {
    playerSubmarine.translateZ(speed);
  }

  // Left/right rotation
  if (keys['q'] || keys['arrowleft']) {
    playerSubmarine.rotation.y += rotSpeed;
  }
  if (keys['d'] || keys['arrowright']) {
    playerSubmarine.rotation.y -= rotSpeed;
  }
}

// Patch animate to update player submarine before rendering
const _orig_animate = animate;
function animate() {
  requestAnimationFrame(animate);
  updatePlayerSubmarine();
  if (sceneHandles && sceneHandles.water) {
    sceneHandles.water.material.uniforms['time'].value += 1 / 60;
  }
  renderer.render(scene, camera);
}