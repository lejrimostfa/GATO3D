// ui/hud.js
// Module HUD pour GATO3D

/**
 * Met à jour l'affichage de la profondeur dans l'HUD.
 * @param {THREE.Object3D} submarine
 */
export function updateDepthHud(submarine) {
  const depthSlider = document.getElementById('depth-slider');
  const depthValue = document.getElementById('depth-value');
  if (!submarine || !depthSlider || !depthValue) return;
  const surfaceY = 20;
  let depth = surfaceY - submarine.position.y;
  if (submarine.children && submarine.children[0]) {
    depth -= submarine.children[0].position.y;
  }
  depth = Math.max(0, Math.round(depth));
  depthSlider.value = depth;
  depthValue.textContent = depth + ' m';


}

/**
 * Masque ou affiche les éléments du HUD selon l'overlay actif.
 */
export function updateHudVisibility() {
  const hudIds = [
    'time-slider', 'time-label',
    'slider-toggle', 'slider-panel', 'depth-slider-container',
    'hud-panel', 'fps-counter', 'minimap-container',
    'clock-canvas', 'compass-canvas', 'hud-overlay',
    'hud-panel', 'hud-panel2'
  ];
  for (const id of hudIds) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  }
}
