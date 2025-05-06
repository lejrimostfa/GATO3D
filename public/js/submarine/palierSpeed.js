// submarine/palierSpeed.js
// Handles palier (target speed) logic for GATO3D submarine

// Target speed (palier), step size, and min/max (in knots or m/s as needed)
export let targetSpeed = 0;
export const targetSpeedStep = 0.1; // Pas de 0.2 m/s par appui (environ 0.4 noeuds)

// Utility: clamp value between min/max
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Convert m/s to knots
export function toKnots(speed) {
  return speed * 1.94384;
}

// Update the target speed and optionally update the UI
export function setTargetSpeed(newSpeed, minSpeed, maxSpeed) {
  targetSpeed = clamp(newSpeed, minSpeed, maxSpeed);
  updateSpeedLabel();
}

// Update the submarine speed label in the UI
export function updateSpeedLabel() {
  if (window.elements && window.elements.submarineSpeedLabel) {
    const knots = toKnots(targetSpeed);
    window.elements.submarineSpeedLabel.textContent = `Cible: ${knots.toFixed(1)} kn`;
  }
}
