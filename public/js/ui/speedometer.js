// public/js/ui/speedometer.js

let speedometerCanvas = null;
let speedometerCtx = null;

/**
 * Initialise le canvas du compteur de vitesse.
 */
export function initSpeedometer() {
  speedometerCanvas = document.getElementById('speedometer');
  if (speedometerCanvas) {
    speedometerCtx = speedometerCanvas.getContext('2d');
    console.log('[UI] Speedometer initialisé.');
  } else {
    console.error('Speedometer canvas not found!');
  }
}

/**
 * Met à jour l'affichage du compteur de vitesse.
 * @param {number} currentSpeed - Vitesse actuelle du sous-marin.
 * @param {number} maxSpeed - Vitesse maximale possible.
 */
export function updateSpeedometer(currentSpeed, maxSpeed) {
  if (!speedometerCtx || !speedometerCanvas) return;

  const ctx = speedometerCtx;
  const canvas = speedometerCanvas;
  const width = canvas.width;
  const height = canvas.height;
  const radius = Math.min(width, height) / 2 * 0.9;
  const centerX = width / 2;
  const centerY = height / 2;

  // Nettoyer le canvas
  ctx.clearRect(0, 0, width, height);

  // Dessiner le fond (optionnel)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(0, 10, 0, 0.6)'; // Fond vert foncé semi-transparent
  ctx.fill();
  ctx.strokeStyle = '#0f0'; // Bordure verte
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dessiner les graduations
  const numTicks = 10;
  const angleRange = Math.PI * 1.5; // Graduations sur 270 degrés
  const startAngle = Math.PI * 0.75; // Départ à -135 degrés

  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 2;
  for (let i = 0; i <= numTicks; i++) {
    const angle = startAngle + (i / numTicks) * angleRange;
    const tickLength = (i % (numTicks / 2) === 0) ? radius * 0.15 : radius * 0.08;
    const x1 = centerX + (radius - tickLength) * Math.cos(angle);
    const y1 = centerY + (radius - tickLength) * Math.sin(angle);
    const x2 = centerX + radius * Math.cos(angle);
    const y2 = centerY + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Calculer l'angle de l'aiguille
  // Normaliser la vitesse entre 0 et 1 (pour l'angle)
  // Gère la marche arrière en limitant la vitesse affichée à 0 minimum
  const displaySpeed = Math.max(0, currentSpeed);
  const speedRatio = Math.min(displaySpeed / maxSpeed, 1.0);
  const needleAngle = startAngle + speedRatio * angleRange;

  // Dessiner l'aiguille
  const needleLength = radius * 0.8;
  const needleEndX = centerX + needleLength * Math.cos(needleAngle);
  const needleEndY = centerY + needleLength * Math.sin(needleAngle);

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(needleEndX, needleEndY);
  ctx.strokeStyle = '#ff4444'; // Rouge pour l'aiguille
  ctx.lineWidth = 3;
  ctx.stroke();

  // Petit cercle central
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.05, 0, 2 * Math.PI);
  ctx.fillStyle = '#ff4444';
  ctx.fill();

  // Afficher la vitesse en texte (optionnel)
  ctx.fillStyle = '#0f0';
  ctx.font = `${radius * 0.2}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(currentSpeed)} u/s`, centerX, centerY + radius * 0.6);
}
