

// public/js/water-setup.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { Water } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/objects/Water.js';
import { Sky } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/objects/Sky.js';

export function setupSkyAndWater(scene, renderer, camera) {
  const sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);

  // Configure sky atmosphere
  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 2;
  skyUniforms['rayleigh'].value = 6.0;
  skyUniforms['mieCoefficient'].value = 0.001;
  skyUniforms['mieDirectionalG'].value = 0.6;

  const sun = new THREE.Vector3();
  const phi = THREE.MathUtils.degToRad(90 - 45); // élévation plus haute
  const theta = THREE.MathUtils.degToRad(180);   // azimuth
  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms['sunPosition'].value.copy(sun);
  // Add a visible sun sphere
  const sunSphere = new THREE.Mesh(
    new THREE.SphereGeometry(50, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.3 })
  );
  sunSphere.position.copy(sun.clone().multiplyScalar(5000));
  scene.add(sunSphere);

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      '/textures/waternormals.jpg',
      tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
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
  // Return handles for dynamic update
  return { water, sky, sun, sunSphere, renderer };
}

export function updateSun(sceneHandles, hour) {
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
    sunOpacity = 0.3;
  } else if (elevNorm > 0) {
    const t = elevNorm * 2;
    sunColor = new THREE.Color().lerpColors(new THREE.Color(0xff4400), new THREE.Color(0xffffff), t);
    sunOpacity = 0.1 + 0.3 * t;
  } else {
    sunColor = new THREE.Color(0x000022);
    sunOpacity = 0.1;
  }
  // Update sun sphere
  sunSphere.material.color.copy(sunColor);
  sunSphere.material.opacity = sunOpacity;
  sunSphere.position.copy(sun.clone().multiplyScalar(5000));
  // Night sky: change clear color if sun below horizon
  if (elevNorm <= 0) {
    let renderer = sceneHandles.renderer;
    if (renderer) renderer.setClearColor(0x000011);
  }
}