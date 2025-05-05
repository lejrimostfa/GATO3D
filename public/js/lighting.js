// lighting.js
// Centralise la création, la gestion et le contrôle des lumières et de l'atmosphère pour GATO3D
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { Sky } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/objects/Sky.js';

let sunLight = null;
let ambientLight = null;
let sky = null;
let sun = null;

export function initLighting(scene) {
  // Soleil directionnel
  sunLight = new THREE.DirectionalLight(0xffffff, 2);
  sunLight.position.set(0, 1000, 0);
  sunLight.castShadow = true;
  scene.add(sunLight);
  // Lumière ambiante
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  // Ciel
  sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);
  // Soleil
  sun = new THREE.Vector3();
  sun.setFromSphericalCoords = function(radius, phi, theta) {
    // Conversion des coordonnées sphériques en cartésiennes
    this.x = radius * Math.sin(phi) * Math.cos(theta);
    this.y = radius * Math.cos(phi);
    this.z = radius * Math.sin(phi) * Math.sin(theta);
    return this;
  };
  // Uniforms atmosphère
  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 8;
  skyUniforms['rayleigh'].value = 2.5;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.85;
  return { sunLight, ambientLight, sky, sun };
}

export function setSunIntensity(val) {
  if (sunLight) sunLight.intensity = val;
}
export function setAmbientIntensity(val) {
  if (ambientLight) ambientLight.intensity = val;
}
export function setSunColor(color) {
  if (sunLight) sunLight.color.set(color);
}
export function setSkyUniform(name, val) {
  if (sky && sky.material.uniforms[name]) sky.material.uniforms[name].value = val;
}
export function updateSunPosition(hour) {
  // Place le soleil selon l'heure (0..24)
  if (!sky || !sun) return;
  let phi = (hour <= 12)
    ? Math.PI * (1 - hour / 12)
    : Math.PI * ((hour - 12) / 12);
  const theta = THREE.MathUtils.degToRad(180);
  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms['sunPosition'].value.copy(sun);
  if (sunLight) sunLight.position.set(sun.x * 1000, sun.y * 1000, sun.z * 1000);
}
export function getLightingHandles() {
  return { sunLight, ambientLight, sky, sun };
}

export function getSunIntensity() {
  return sunLight ? sunLight.intensity : 0.21;
}
