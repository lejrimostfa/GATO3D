

// public/js/water-setup.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { Water } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/objects/Water.js';
import { Sky } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/objects/Sky.js';

import { initLighting } from './lighting.js';

// Define layer constants
export const LAYERS = {
  DEFAULT: 0,       // Default layer (0) - visible to all cameras
  MAIN_CAMERA: 1,   // Layer 1 - only visible to main camera
  MINIMAP: 2,       // Layer 2 - only visible to minimap camera
};

export function setupSkyAndWater(scene, renderer, camera) {
  // Centralise la création des lumières et du ciel
  const { sunLight, ambientLight, sky, sun } = initLighting(scene);
  
  // Ajoute un mesh sphérique pour le soleil visible
  const sunSphere = new THREE.Mesh(
    new THREE.SphereGeometry(3500, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffee })
  );
  sunSphere.position.copy(sun.clone().multiplyScalar(1000));
  
  // Set the sun sphere to only be visible to the main camera (not the minimap)
  sunSphere.layers.set(LAYERS.MAIN_CAMERA);
  
  // Add to scene
  scene.add(sunSphere);
  
  // Configure main camera to see both default and main camera layers
  if (camera) {
    camera.layers.enable(LAYERS.DEFAULT);
    camera.layers.enable(LAYERS.MAIN_CAMERA);
  }
  const phi = THREE.MathUtils.degToRad(90 - 45); // élévation plus haute
  const theta = THREE.MathUtils.degToRad(180);   // azimuth
  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms['sunPosition'].value.copy(sun);


  console.log('[DEBUG] Creating dynamic water surface with 3D waves');
  
  // Create a much larger water surface that extends beyond the visible area
  // Using higher vertex density (250x250) for more detailed waves
  const waterGeometry = new THREE.PlaneGeometry(50000, 50000, 250, 250);
  
  // Initialize wave parameters
  let waveAmplitude = 1.0;
  let waveFrequency = 0.05;
  let waveTime = 0;
  
  // Create a reference to the original vertices for wave animation
  const originalVertices = [];
  for (let i = 0; i < waterGeometry.attributes.position.count; i++) {
    originalVertices.push(new THREE.Vector3(
      waterGeometry.attributes.position.getX(i),
      waterGeometry.attributes.position.getY(i),
      waterGeometry.attributes.position.getZ(i)
    ));
  }
  
  // Load the water normal texture with higher resolution and repeat
  // Utiliser plusieurs chemins possibles pour la texture (pour compatibilité GitHub Pages)
  const texturePaths = [
    './textures/waternormals.jpg',           // Chemin relatif (préféré)
    '../textures/waternormals.jpg',          // Autre chemin relatif possible
    '/textures/waternormals.jpg',            // Chemin absolu depuis la racine
    'https://threejs.org/examples/textures/waternormals.jpg' // Fallback externe
  ];
  
  // Fonction pour essayer de charger la texture avec différents chemins
  function tryLoadTexture(paths, index = 0) {
    if (index >= paths.length) {
      console.error('❌ Tous les chemins de texture ont échoué!');
      return new THREE.Texture(); // Texture vide comme dernier recours
    }
    
    console.log(`[WATER] Tentative de chargement de la texture: ${paths[index]}`);
    
    return new THREE.TextureLoader().load(
      paths[index],
      tex => {
        console.log(`✅ Texture d'eau chargée avec succès depuis: ${paths[index]}`);
        // Set repeat wrapping for infinite tiling
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        // Increase the repeat factor for more detail
        tex.repeat.set(20, 20);
        tex.flipY = false; // Required to avoid WebGL errors with 3D textures
        // Set anisotropy for better texture quality at grazing angles
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      },
      undefined,
      err => {
        console.warn(`❌ Échec du chargement de la texture depuis ${paths[index]}:`, err);
        // Essayer le chemin suivant
        return tryLoadTexture(paths, index + 1);
      }
    );
  }
  
  // Essayer de charger la texture avec tous les chemins possibles
  const waterNormalTexture = tryLoadTexture(texturePaths);
  
  // Create water with improved parameters
  const water = new Water(waterGeometry, {
    textureWidth: 1024, // Higher resolution for better detail
    textureHeight: 1024,
    waterNormals: waterNormalTexture,
    alpha: 1.0,
    sunDirection: sun.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x0066cc,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  });
  
  // Add custom uniforms for our wave system
  water.material.uniforms.waveAmplitude = { value: waveAmplitude };
  water.material.uniforms.waveFrequency = { value: waveFrequency };
  water.material.uniforms.waveTime = { value: waveTime };
  water.material.uniforms.waveDirection = { value: new THREE.Vector2(1, 0) };
  
  // Custom function to update wave geometry
  water.updateWaves = function(amplitude, direction, time) {
    waveAmplitude = amplitude;
    waveTime = time;
    
    // Convert direction from degrees to radians
    const dirRad = direction * (Math.PI / 180);
    const dirX = Math.cos(dirRad);
    const dirZ = Math.sin(dirRad);
    
    // Update vertex positions to create real 3D waves
    const positions = this.geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const vertex = originalVertices[i];
      
      // Skip center vertices to keep submarine area more stable
      const distanceFromCenter = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
      if (distanceFromCenter < 500) continue; // Leave center area flatter
      
      // Calculate wave effect based on position and direction
      const waveFactor = Math.sin(
        (vertex.x * dirX + vertex.z * dirZ) * waveFrequency + waveTime
      );
      
      // Apply wave height - scale amplitude by distance from center
      const scaledAmplitude = waveAmplitude * (1.0 - Math.min(1.0, 500 / distanceFromCenter));
      const waveHeight = waveFactor * scaledAmplitude * 20; // Scale for better visual effect
      
      // Update vertex Y position with wave height
      positions.setY(i, vertex.y + waveHeight);
    }
    
    // Mark geometry for update
    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  };
  
  // Initial wave update
  water.updateWaves(waveAmplitude, 0, 0);

  water.rotation.x = -Math.PI / 2;
  scene.add(water);
  water.position.y = 20;
  // Add mild fog for atmosphere
  if (!scene.fog) {
    scene.fog = new THREE.FogExp2(0xbfd1e5, 0.00015);
  }
  // Retourne les éléments principaux + sunSphere
  return { water, sky, sun, sunLight, renderer, sunSphere };
}

export function updateSun(sceneHandles, hour) {
  // Lever du soleil à 6h (aucun décalage)
  // hour = hour;
  const { sky, water, sun, sunSphere } = sceneHandles;
  // Compute polar angle phi from hour [0..24]
  let phi;
  if (hour <= 12) {
    phi = Math.PI * (1 - hour / 12);
  } else {
    phi = Math.PI * ((hour - 12) / 12);
  }
  const theta = THREE.MathUtils.degToRad(180);
  sun.setFromSphericalCoords(1, phi, theta);
  // Update sky
  sky.material.uniforms['sunPosition'].value.copy(sun);
  // Update water reflection
  water.material.uniforms['sunDirection'].value.copy(sun.clone().normalize());
  // Compute elevation normalized (0 at horizon, 1 at zenith)
  const elevNorm = 1 - Math.abs(phi - Math.PI/2) / (Math.PI/2);
  let sunColor, sunOpacity;
  if (elevNorm > 0.5) {
    sunColor = new THREE.Color(0xffffff);
    sunOpacity = 0.8;
  } else if (elevNorm > 0) {
    const t = elevNorm * 2;
    sunColor = new THREE.Color().lerpColors(new THREE.Color(0xff4400), new THREE.Color(0xffffff), t);
    sunOpacity = 0.1 + 0.3 * t;
  } else {
    sunColor = new THREE.Color(0x000022);
    sunOpacity = 0.1;
  }
  // Met à jour la position du disque solaire
  if (sceneHandles.sunSphere) {
    sceneHandles.sunSphere.position.copy(sun.clone().multiplyScalar(1000));
    sceneHandles.sunSphere.visible = elevNorm > 0;
  }
  // Plus de mise à jour de sunSphere (aucun soleil visible)
  // Night sky: change clear color if sun below horizon
  if (elevNorm <= 0) {
    let renderer = sceneHandles.renderer;
    if (renderer) renderer.setClearColor(0x000011);
  }
}