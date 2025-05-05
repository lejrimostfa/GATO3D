// public/js/water-setup.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { Water } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/objects/Water.js';
import { Sky } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/objects/Sky.js';
import { initLighting } from './lighting.js';
import { createOceanFloor } from './ocean/terrain.js';

// Define layer constants
export const LAYERS = {
  DEFAULT: 0,       // Default layer (0) - visible to all cameras
  MAIN_CAMERA: 1,   // Layer 1 - only visible to main camera
  MINIMAP: 2,       // Layer 2 - only visible to minimap camera
};

export function setupSkyAndWater(scene, renderer, camera) {
  if (!scene || !renderer) {
    console.error('[SETUP] Scene or renderer is missing');
    return null;
  }
  
  console.log('[SETUP] Initializing sky and water with:', {
    scene: scene instanceof THREE.Scene,
    renderer: renderer instanceof THREE.WebGLRenderer,
    camera: camera instanceof THREE.Camera
  });
  // Centralise la création des lumières et du ciel
  const { sunLight, ambientLight, sky, sun } = initLighting(scene);
  
  // Charger la texture du ciel nocturne
  const nightSkyTexture = new THREE.TextureLoader().load('./textures/sky/NightSkyHDRI001_4K-TONEMAPPED.jpg', (texture) => {
    console.log('Texture du ciel nocturne chargée avec succès');
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  });
  
  // Créer une sphère pour le ciel nocturne adaptée à la distance de rendu
  const nightSkyGeometry = new THREE.SphereGeometry(10000, 64, 64);
  const nightSkyMaterial = new THREE.MeshBasicMaterial({
    map: nightSkyTexture,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending
  });

  // S'assurer que la caméra peut voir le ciel
  if (camera) {
    camera.far = Math.max(camera.far, 15000);
  }

  // Fonction pour faire suivre les sphères du ciel au joueur
  function updateSkyPosition() {
    if (!camera) return;
    
    // Mettre à jour la position des deux sphères
    if (sky) sky.position.copy(camera.position);
    if (nightSky) nightSky.position.copy(camera.position);
  }

  // Ajouter la fonction à la boucle d'animation
  if (typeof window.gameLoop === 'undefined') {
    window.gameLoop = [];
  }
  window.gameLoop.push(updateSkyPosition);

  // Augmenter l'intensité de la texture
  nightSkyMaterial.map.encoding = THREE.sRGBEncoding;
  nightSkyMaterial.map.minFilter = THREE.LinearFilter;
  nightSkyMaterial.map.magFilter = THREE.LinearFilter;
  nightSkyMaterial.map.generateMipmaps = false; // Éviter le flou des étoiles
  

  
  const nightSky = new THREE.Mesh(nightSkyGeometry, nightSkyMaterial);
  nightSky.layers.set(LAYERS.MAIN_CAMERA);
  nightSky.renderOrder = -2; // Rendu avant le ciel de jour
  scene.add(nightSky);
  
  // S'assurer que le ciel de jour est au-dessus du ciel de nuit
  sky.renderOrder = -1;
  
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
  
  console.log('[WATER] Creating water surface at y=20');
  
  // Create a much larger water surface that extends beyond the visible area
  // Using higher vertex density (250x250) for more detailed waves
  const waterGeometry = new THREE.PlaneGeometry(50000, 50000, 250, 250);
  
  // Initialize wave parameters
  let waveAmplitude = 2.0; // Augmenté pour des vagues plus visibles
  let waveFrequency = 0.03; // Réduit pour des vagues plus larges
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
  
  // Créer une cubeCamera pour les réflexions
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    encoding: THREE.sRGBEncoding
  });
  const cubeCamera = new THREE.CubeCamera(1, 100000, cubeRenderTarget);
  scene.add(cubeCamera);

  // Create water with improved parameters
  const water = new Water(waterGeometry, {
    textureWidth: 2048,
    textureHeight: 2048,
    waterNormals: waterNormalTexture,
    alpha: 0.8,
    sunDirection: sun.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.0,
    fog: scene.fog !== undefined,
    clipBias: 0.0003,
    reflectivity: 0.8,
    time: 0.0
  });

  // Ajouter la réflexion du ciel
  water.material.envMap = cubeRenderTarget.texture;
  water.material.envMapIntensity = 0.5; // Intensité de la réflexion

  // Fonction pour mettre à jour les réflexions
  function updateReflections() {
    water.visible = false; // Cacher l'eau pendant le rendu de la réflexion
    cubeCamera.update(renderer, scene);
    water.visible = true;
  }

  // Ajouter updateReflections à la boucle d'animation
  if (typeof window.gameLoop === 'undefined') {
    window.gameLoop = [];
  }
  window.gameLoop.push(updateReflections);
  
  // Désactiver la réception d'ombres sur l'eau
  water.receiveShadow = false;
  water.material.shadowSide = THREE.FrontSide;
  
  // Ajuster les paramètres de rendu
  if (renderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  
  console.log('[WATER] Water material configuration:', {
    waterColor: water.material.uniforms.waterColor.value.getHexString(),
    distortionScale: water.material.uniforms.distortionScale.value
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
  
  // Ajuster les paramètres de rendu de l'eau
  water.material.transparent = true;
  water.material.opacity = 0.8;
  water.material.uniforms.distortionScale.value = 3.0;
  water.material.uniforms.size.value = 4.0;
  water.material.uniforms.reflectivity = { value: 0.8 };
  
  // Paramètres pour éviter les artefacts d'ombre
  water.material.depthWrite = false;
  water.material.depthTest = true;
  water.renderOrder = 1; // Assure que l'eau est rendue après les autres objets
  
  // Rendre la surface visible depuis le dessous
  water.material.side = THREE.DoubleSide; // CRUCIAL: permet de voir la surface depuis sous l'eau
  
  // Augmenter le contraste de la surface pour qu'elle soit plus visible par dessous
  water.material.uniforms.waterColor.value.setHex(0x0077be); // Bleu plus vif
  water.material.uniforms.sunColor.value.setHex(0xffffff); // Soleil plus brillant
  
  // Récupérer la taille de la surface d'eau
  const waterSize = 50000; // Identique à la taille définie pour waterGeometry
  const waterSegments = 250; // Identique à la résolution de waterGeometry
  
  // Ajouter le fond marin (mêmes dimensions que l'eau)
  console.log('[SETUP] Creating ocean floor matching water dimensions...');
  const oceanFloor = createOceanFloor(scene, {
    size: waterSize,     // Même taille que la surface d'eau
    segments: waterSegments, // Même résolution que l'eau
    depth: -100,        // Profondeur fixée à -100 comme demandé
    maxHeight: 60       // Réduit pour un relief plus doux
  });
  
  // Vérifier la configuration
  console.log('[SETUP] Ocean floor configuration:', {
    position: oceanFloor.position.toArray(),
    rotation: oceanFloor.rotation.toArray(),
    scale: oceanFloor.scale.toArray(),
    isCollidable: oceanFloor.isCollidable
  });
  
  // Ajouter le terrain comme obstacle dans la scène
  if (!scene.obstacles) scene.obstacles = [];
  scene.obstacles.push(oceanFloor);
  
  // S'assurer que la scène est accessible globalement pour la détection de collision
  window.scene = scene;  // CRUCIAL pour que le système de collision fonctionne
  console.log('[SETUP] Scene attached to window.scene with obstacles:', scene.obstacles.length);
  
  // Ajuster les paramètres de brouillard pour une meilleure visibilité
  scene.fog.density = 0.0002;

  // Retourne les éléments principaux + sunSphere + oceanFloor + nightSky
  return { water, sky, sun, sunLight, renderer, sunSphere, oceanFloor, nightSky };
}

export function updateSun(sceneHandles, hour) {
  if (!sceneHandles || !sceneHandles.sun) {
    console.warn('updateSun: sceneHandles ou sun manquant');
    return;
  }

  const { sky, water, sun, sunSphere, renderer, nightSky } = sceneHandles;
  
  // Calcul de la position du soleil
  const timeFraction = hour / 24;
  
  // Phi (élévation): 0 à PI (haut en bas)
  let phi;
  if (hour < 6 || hour > 18) {
    // Nuit: soleil sous l'horizon
    phi = Math.PI / 2 + Math.PI * 0.1; // Légèrement sous l'horizon
  } else {
    // Jour: de l'horizon (PI/2) au zénith (0) puis retour à l'horizon (PI/2)
    const dayProgress = (hour - 6) / 12; // 0 (6h) à 1 (18h)
    phi = Math.PI / 2 - Math.sin(dayProgress * Math.PI) * (Math.PI / 2);
  }
  
  // Theta (azimuth): 0 à 2*PI (Est -> Sud -> Ouest -> Nord)
  // On veut Est (PI/2) au lever (6h) et Ouest (3*PI/2) au coucher (18h)
  let theta;
  if (hour >= 6 && hour <= 18) {
    // Jour: de PI/2 à 3*PI/2
    theta = Math.PI/2 + (hour - 6) / 12 * Math.PI;
  } else {
    // Nuit: on continue la rotation pour être cohérent (facultatif visuellement)
    theta = hour > 18 ? (3*Math.PI/2 + (hour - 18) / 6 * Math.PI / 2) : (Math.PI/2 - (6 - hour) / 6 * Math.PI / 2);
    theta %= (2 * Math.PI); // Garder dans [0, 2*PI]
  }
  
  // Mise à jour de la position du soleil
  if (sun && sun.setFromSphericalCoords) {
    sun.setFromSphericalCoords(1, phi, theta);
  } else {
    console.warn('updateSun: sun.setFromSphericalCoords non disponible');
    return;
  }
  
  // Mise à jour du ciel
  if (sky && sky.material && sky.material.uniforms) {
    sky.material.uniforms['sunPosition'].value.copy(sun);
  }
  
  // Mise à jour de l'eau
  if (water && water.material && water.material.uniforms) {
    water.material.uniforms['sunDirection'].value.copy(sun.clone().normalize());
  }
  
  // Calcul de l'heure normalisée pour la nuit (0 = midi, 1 = minuit)
  let nightFactor;
  if (hour >= 18 || hour < 6) {
    // Nuit (18h-6h)
    nightFactor = hour >= 18 ? (hour - 18) / 6 : 1 - hour / 6;
  } else {
    // Jour (6h-18h)
    nightFactor = 0;
  }
  
  // Mise à jour du disque solaire
  if (sunSphere) {
    sunSphere.position.copy(sun.clone().multiplyScalar(1000));
    sunSphere.visible = hour >= 6 && hour <= 18;
  }
  
  if (sky && nightSky) {
    // Gestion du ciel étoilé et transition
    if (hour >= 19 || hour < 5) {
      // Nuit complète (19h-5h)
      sky.visible = false;
      nightSky.visible = true;
      nightSky.material.opacity = 1;
      if (renderer) renderer.setClearColor(0x000011, 1);
    } else if (hour >= 5 && hour < 6) {
      // Transition Aube (5h-6h)
      const t = hour - 5; // 0 à 1
      sky.visible = true; // Le ciel de jour devient visible
      nightSky.visible = true;
      nightSky.material.opacity = 1 - t; // Fade out étoiles
      if (renderer) {
        const dayColor = new THREE.Color(0x87ceeb);
        const nightColor = new THREE.Color(0x000011);
        const transitionColor = new THREE.Color().lerpColors(nightColor, dayColor, t);
        renderer.setClearColor(transitionColor, 1);
      }
    } else if (hour >= 18 && hour < 19) {
      // Transition Crépuscule (18h-19h)
      const t = hour - 18; // 0 à 1
      sky.visible = true; // Le ciel de jour reste visible pendant la transition
      nightSky.visible = true;
      nightSky.material.opacity = t; // Fade in étoiles
      if (renderer) {
        const dayColor = new THREE.Color(0x87ceeb);
        const nightColor = new THREE.Color(0x000011);
        const transitionColor = new THREE.Color().lerpColors(dayColor, nightColor, t);
        renderer.setClearColor(transitionColor, 1);
      }
    } else {
      // Jour complet (6h-18h)
      sky.visible = true;
      nightSky.visible = false;
      nightSky.material.opacity = 0;
      if (renderer) renderer.setClearColor(0x87ceeb, 1);
    }
  }
}