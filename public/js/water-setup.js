

// public/js/water-setup.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { Water } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/objects/Water.js';
import { Sky } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/objects/Sky.js';

import { initLighting } from './lighting.js';

export function setupSkyAndWater(scene, renderer, camera) {
  // Centralise la création des lumières et du ciel
  const { sunLight, ambientLight, sky, sun } = initLighting(scene);
  const phi = THREE.MathUtils.degToRad(90 - 45); // élévation plus haute
  const theta = THREE.MathUtils.degToRad(180);   // azimuth
  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms['sunPosition'].value.copy(sun);


  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      '/textures/waternormals.jpg',
      tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.flipY = false; // Correction obligatoire pour éviter l'erreur WebGL sur les textures 3D
      },
      undefined,
      err => console.warn('Water normals not found:', err)
    ),
    alpha: 1.0,
    sunDirection: sun.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x0066cc,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  });

  water.rotation.x = -Math.PI / 2;
  scene.add(water);
  water.position.y = 20;
  // Add mild fog for atmosphere
  if (!scene.fog) {
    scene.fog = new THREE.FogExp2(0xbfd1e5, 0.00015);
  }
  // Retourne uniquement les éléments principaux (sans soleil)
  return { water, sky, sun, sunLight, renderer };
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
  // Plus de mise à jour de sunSphere (aucun soleil visible)
  // Night sky: change clear color if sun below horizon
  if (elevNorm <= 0) {
    let renderer = sceneHandles.renderer;
    if (renderer) renderer.setClearColor(0x000011);
  }
}