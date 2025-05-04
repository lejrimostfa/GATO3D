// game/gameInit.js
// Game initialization and core systems setup

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { setupSkyAndWater } from '../water-setup.js';
import { loadSubmarine } from '../submarine/model.js';
import { loadLevel } from '../levels/levelManager.js';
import { initTimeManager } from '../time/timeManager.js';
import { initCameraFollow } from '../camera/followCamera.js';
import { initMinimap } from '../ui/minimap.js';
import { initSettings } from '../ui/settings.js';
import { initUnderwaterEffects } from '../effects/underwater.js';
import { initSkyEffects } from '../effects/skyEffects.js';
import { initAnimationLoop } from '../animation/animateLoop.js';
import { initFpsCounter } from '../ui/fpsCounter.js';
import { initLighting } from '../lighting.js';
import { elements } from '../ui/domElements.js';
import { initResponsiveUI } from '../ui/responsiveUI.js';

// Core game state
export let scene = null;
export let camera = null;
export let renderer = null;
export let sceneHandles = null;
export let playerSubmarine = null;

/**
 * Initialize the game and all core systems
 * @param {Function} onComplete - Callback when initialization is complete
 */
export function initGame(onComplete) {
  console.log('[GAME] Initializing game systems');
  
  // Initialize renderer
  const rendererInitialized = initRenderer();
  
  // Stop initialization if renderer failed to initialize
  if (!rendererInitialized) {
    console.error('[GAME] Game initialization stopped due to renderer initialization failure');
    return;
  }
  
  // Initialize submarine speed controls
  initSubmarineSpeedControls();
  
  // Initialize FPS counter
  initFpsCounter();
  
  // Initialize time management with default day duration
  initTimeManager(120);
  
  // Preload the wave controls module
  preloadWaveControls();
  
  // Load the game level and continue initialization
  loadGameLevel(() => {
    if (onComplete) {
      onComplete();
    }
  });
}

/**
 * Initialize the WebGL renderer
 * @returns {boolean} Whether the renderer was successfully initialized
 */
function initRenderer() {
  // First check the elements cache
  const { gameCanvas } = elements;
  
  // Fallback to direct DOM access if needed
  const canvas = gameCanvas || document.getElementById('gameCanvas');
  
  if (!canvas) {
    console.error('[GAME] Game canvas not found in DOM or elements cache!');
    return false;
  }
  
  try {
    console.log('[GAME] Creating WebGL renderer with canvas:', canvas);
    
    renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      canvas: canvas
    });
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.21;
    
    // Set initial size
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('[GAME] Renderer initialized successfully');
    
    return true;
  } catch (error) {
    console.error('[GAME] Failed to initialize renderer:', error);
    return false;
  }
}

/**
 * Initialize the submarine control sliders (speed and rotation)
 */
function initSubmarineSpeedControls() {
  // Get references to elements
  const { submarineSpeedSlider, submarineSpeedLabel } = elements;
  const rotationSpeedSlider = document.getElementById('rotation-speed-slider');
  const rotationSpeedLabel = document.getElementById('rotation-speed-label');
  
  // Check if main speed elements exist
  if (!submarineSpeedSlider || !submarineSpeedLabel) {
    console.warn('[GAME] Submarine speed slider elements not found');
    // Continue to try rotation slider setup anyway
  }
  
  // Import modules we need for submarine control
  import('../submarine/controls.js').then(module => {
    const { updateMaxSpeed, updateRotationParams, updateSubmarineMass } = module;
    
    // --- SPEED SLIDER SETUP ---
    if (submarineSpeedSlider && submarineSpeedLabel) {
      // Get the initial slider value
      const initialSpeedValue = parseFloat(submarineSpeedSlider.value);
      
      // Set global max speed value for all systems to reference
      window.currentMaxSpeed = initialSpeedValue;
      
      // Update the label with the initial value
      submarineSpeedLabel.textContent = `Vitesse: ${initialSpeedValue} kn`;
      
      // Update submarine max speed in the physics system
      updateMaxSpeed(initialSpeedValue);
      
      // Listen for changes to the speed slider
      submarineSpeedSlider.addEventListener('input', () => {
        const value = parseFloat(submarineSpeedSlider.value);
        
        // Update the label
        submarineSpeedLabel.textContent = `Vitesse: ${value} kn`;
        
        // Update the global max speed value
        window.currentMaxSpeed = value;
        
        // Update submarine max speed in the physics system
        updateMaxSpeed(value);
        
        console.log(`[GAME] Updated submarine max speed to ${value} knots`);
      });
      
      console.log(`[GAME] Initialized submarine speed controls with max speed: ${initialSpeedValue} knots`);
    }
    
    // --- ROTATION SLIDER SETUP ---
    if (rotationSpeedSlider && rotationSpeedLabel) {
      // Get the initial rotation speed value
      const initialRotationValue = parseFloat(rotationSpeedSlider.value);
      
      // Set global rotation speed value
      window.submarineRotationSpeed = initialRotationValue;
      
      // Update the label with the initial value
      rotationSpeedLabel.textContent = `Rotation: ${initialRotationValue.toFixed(3)}`;
      
      // Update submarine rotation speed in the physics system
      updateRotationParams(initialRotationValue);
      
      // Listen for changes to the rotation slider
      rotationSpeedSlider.addEventListener('input', () => {
        const value = parseFloat(rotationSpeedSlider.value);
        
        // Update the label
        rotationSpeedLabel.textContent = `Rotation: ${value.toFixed(3)}`;
        
        // Update the global rotation speed value
        window.submarineRotationSpeed = value;
        
        // Update submarine rotation speed in the physics system
        updateRotationParams(value);
        
        console.log(`[GAME] Updated submarine rotation speed to ${value}`);
      });
      
      console.log(`[GAME] Initialized submarine rotation controls with speed: ${initialRotationValue}`);
    } else {
      console.warn('[GAME] Submarine rotation slider elements not found');
    }
    
    // --- MASS/INERTIA SLIDER SETUP ---
    const massSlider = document.getElementById('submarine-mass-slider');
    const massLabel = document.getElementById('submarine-mass-label');
    
    if (massSlider && massLabel) {
      // Get the initial mass value
      const initialMassValue = parseFloat(massSlider.value);
      
      // Set global mass value
      window.submarineMass = initialMassValue;
      
      // Update the label with the initial value
      massLabel.textContent = `Masse: ${initialMassValue.toFixed(1)}`;
      
      // Update submarine mass in the physics system
      updateSubmarineMass(initialMassValue);
      
      // Listen for changes to the mass slider
      massSlider.addEventListener('input', () => {
        const value = parseFloat(massSlider.value);
        
        // Update the label
        massLabel.textContent = `Masse: ${value.toFixed(1)}`;
        
        // Update the global mass value
        window.submarineMass = value;
        
        // Update submarine mass in the physics system
        updateSubmarineMass(value);
        
        console.log(`[GAME] Updated submarine mass to ${value}`);
      });
      
      console.log(`[GAME] Initialized submarine mass controls with value: ${initialMassValue}`);
    } else {
      console.warn('[GAME] Submarine mass slider elements not found');
    }
  }).catch(error => {
    console.error('[GAME] Error initializing submarine controls:', error);
  });
}

/**
 * Preload wave controls module for later use
 */
function preloadWaveControls() {
  import('../ocean/waveControls.js').then(waveModule => {
    console.log('[GAME] Wave controls module loaded');
    window.waveControlsModule = waveModule;
  });
}

/**
 * Load the game level and initialize dependent systems
 * @param {Function} onComplete - Callback when level is loaded
 */
function loadGameLevel(onComplete) {
  if (!renderer) {
    console.error('[GAME] Cannot load level: renderer is not initialized');
    return;
  }
  
  console.log('[GAME] Loading initial level...');
  loadLevel('level1', renderer, levelData => {
    console.log('[GAME] Level loaded:', levelData);
    
    // Check if we're in an error state
    if (levelData.isErrorState) {
      console.error('[GAME] Level loading encountered an error. Using fallback scene.');
    }
    
    // Destructure level data with proper defaults
    const { 
      scene: loadedScene = new THREE.Scene(), 
      camera: loadedCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000), 
      objects = {} 
    } = levelData;
    
    // Set global variables for use in other modules
    scene = loadedScene;
    camera = loadedCamera;
    
    // Ensure sceneHandles exists and update global reference
    sceneHandles = objects.sceneHandles || {};
    
    console.log('[GAME] Global scene and camera references updated');
    
    // Save key references to window for access by other components
    window.mainCamera = camera;
    window.currentScene = {
      scene: scene,
      camera: camera,
      objects: objects,
      playerSubmarine: null // Will be set when submarine is loaded
    };
    
    // Note: Camera movement is handled by the input manager
    
    // Initialize visual effects
    initSkyEffects();
    
    // Create ambient light if not available
    if (!sceneHandles || !sceneHandles.ambientLight) {
      console.log('[GAME] Creating ambient light for underwater effects');
      const ambientLight = new THREE.AmbientLight(0x555555);
      scene.add(ambientLight);
      
      // Add to sceneHandles for future reference
      if (sceneHandles) {
        sceneHandles.ambientLight = ambientLight;
      }
      
      // Initialize underwater effects with new ambient light
      initUnderwaterEffects(scene, ambientLight);
    } else {
      // Use existing ambient light
      initUnderwaterEffects(scene, sceneHandles.ambientLight);
    }
    
    // Load the submarine model
    loadSubmarine(scene, submarine => {
      // Store reference and enable updates
      playerSubmarine = submarine;
      
      // Store reference to window for access by other components
      window.currentScene = window.currentScene || {};
      window.currentScene.playerSubmarine = playerSubmarine;
      
      // Set submarine forward axis orientation
      const forward = new THREE.Vector3(0, 0, 1);
      playerSubmarine.userData.forward = forward;
      
      console.log('[GAME] Submarine model loaded successfully and connected to camera', playerSubmarine);
      
      // Initialize systems that depend on the submarine
      initSubmarineBasedSystems();
      
      // Initialize UI systems
      initUIComponents();
      
      // Initialize responsive UI system
      initResponsiveUI(renderer, camera);
      
      // Force responsive layouts to update
      window.dispatchEvent(new Event('resize'));
      
      // Initialize the main animation loop with relevant components
      initAnimationLoop({
        scene,
        camera,
        renderer,
        playerSubmarine,
        sceneHandles,
        clockCanvas: elements.clockCanvas,
        cameraFrustumHelper: null
      });
      
      if (onComplete) {
        onComplete();
      }
    });
  });
}

/**
 * Initialize systems that depend on the submarine being loaded
 */
function initSubmarineBasedSystems() {
  // Verify scene is valid
  if (!scene) {
    console.warn('[GAME] Cannot initialize submarine-based systems: Scene is null');
    return;
  }
  
  try {
    // Initialize camera follow system
    console.log('[GAME] Initializing camera follow system with scene:', !!scene);
    initCameraFollow(scene);
    
    // Initialize minimap
    initMinimap();
  } catch (error) {
    console.error('[GAME] Error initializing submarine-based systems:', error);
  }
}

/**
 * Initialize UI components that interact with the game
 */
function initUIComponents() {
  // Initialize settings UI
  initSettings(sceneHandles, playerSubmarine);
  
  // Initialize advanced light sliders
  import('../ui/settings.js').then(mod => { 
    mod.initLightSliders(sceneHandles); 
  });
  
  // Initialize visibility panel with scene objects
  import('../ui/visibility.js').then(({ initVisibilityPanel }) => {
    console.log('[GAME] Initializing visibility panel');
    const visibilityManager = initVisibilityPanel(scene);
    
    // Add important objects if panel was initialized
    if (visibilityManager) {
      addObjectsToVisibilityPanel(visibilityManager);
    }
  });
  
  // Setup wave control sliders
  initWaveControls();
}

/**
 * Add important scene objects to the visibility panel
 * @param {Object} visibilityManager - The visibility panel manager
 */
function addObjectsToVisibilityPanel(visibilityManager) {
  // Add submarine
  visibilityManager.addObject(playerSubmarine, 'Sous-marin');
  
  // Add water
  if (sceneHandles.water) {
    visibilityManager.addObject(sceneHandles.water, 'Océan');
  }
  
  // Add sky and sun
  if (sceneHandles.sky) {
    visibilityManager.addObject(sceneHandles.sky, 'Ciel');
  }
  
  if (sceneHandles.sunSphere) {
    visibilityManager.addObject(sceneHandles.sunSphere, 'Soleil');
  }
  
  // Add lights
  if (sceneHandles.sunLight) {
    visibilityManager.addObject(sceneHandles.sunLight, 'Lumière directionnelle');
  }
  
  // Add any remaining named objects
  visibilityManager.addNamedObjectsFromScene(scene);
}

/**
 * Initialize wave control sliders
 */
function initWaveControls() {
  import('../ocean/waveControls.js').then(({ setWaveAmplitude, setWaveDirection, updateWaterMaterial }) => {
    console.log('[GAME] Setting up wave control sliders');
    const { 
      waveAmplitudeSlider, waveAmplitudeLabel,
      waveDirectionSlider, waveDirectionLabel
    } = elements;
    
    if (waveAmplitudeSlider && waveAmplitudeLabel) {
      // Initialize with default value
      setWaveAmplitude(parseFloat(waveAmplitudeSlider.value));
      
      // Add event listener
      waveAmplitudeSlider.addEventListener('input', () => {
        const amplitude = parseFloat(waveAmplitudeSlider.value);
        waveAmplitudeLabel.textContent = `Amplitude: ${amplitude.toFixed(1)}`;
        setWaveAmplitude(amplitude);
        
        // Update water material if available
        if (sceneHandles && sceneHandles.water) {
          updateWaterMaterial(sceneHandles.water);
        }
      });
      
      // Manually trigger an update to apply initial settings
      waveAmplitudeSlider.dispatchEvent(new Event('input'));
    }
    
    if (waveDirectionSlider && waveDirectionLabel) {
      // Initialize with default value
      setWaveDirection(parseFloat(waveDirectionSlider.value));
      
      // Add event listener
      waveDirectionSlider.addEventListener('input', () => {
        const direction = parseFloat(waveDirectionSlider.value);
        waveDirectionLabel.textContent = `Direction: ${direction}°`;
        setWaveDirection(direction);
        
        // Update water material if available
        if (sceneHandles && sceneHandles.water) {
          updateWaterMaterial(sceneHandles.water);
        }
      });
      
      // Manually trigger an update to apply initial settings
      waveDirectionSlider.dispatchEvent(new Event('input'));
    }
  });
}
