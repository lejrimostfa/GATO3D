// submarine/controls.js
// Contrôles et mouvements du sous-marin pour GATO3D

/**
 * Met à jour la position et la rotation du sous-marin en fonction des entrées clavier.
 * @param {THREE.Object3D} playerSubmarine
 * @param {Object} keys - dictionnaire des touches actives
 */
let currentSpeed = 0;
const acceleration = 15.0; // Unités/s^2
const deceleration = 10.0; // Friction/freinage
const reverseFactor = 0.6; // Marche arrière plus lente

export function updatePlayerSubmarine(playerSubmarine, keys, deltaTime = 1/60, maxSpeed = 12) {
  if (!playerSubmarine) return;

  // --- Calcul vitesse cible (avant/arrière) ---
  let targetSpeed = 0;
  if (keys['z'] || keys['arrowup']) {
    targetSpeed = maxSpeed;
  } else if (keys['s'] || keys['arrowdown']) {
    targetSpeed = -maxSpeed * reverseFactor;
  }

  // --- Application de l'accélération/décélération ---
  if (targetSpeed !== 0) {
    // Accélère vers la cible
    if (Math.sign(targetSpeed) === Math.sign(currentSpeed) || currentSpeed === 0) {
      currentSpeed += Math.sign(targetSpeed) * acceleration * deltaTime;
    } else {
      // Freine/Inverse plus vite si on change de direction
      currentSpeed += Math.sign(targetSpeed) * acceleration * 2 * deltaTime; 
    }
    // Clamp à la vitesse cible
    if (targetSpeed > 0) {
      currentSpeed = Math.min(currentSpeed, targetSpeed);
    } else {
      currentSpeed = Math.max(currentSpeed, targetSpeed);
    }
  } else {
    // Décélère vers 0 (friction)
    const decelAmount = deceleration * deltaTime;
    if (Math.abs(currentSpeed) <= decelAmount) {
      currentSpeed = 0;
    } else {
      currentSpeed -= Math.sign(currentSpeed) * decelAmount;
    }
  }

  // --- Application du mouvement ---
  if (currentSpeed !== 0) {
    playerSubmarine.translateZ(-currentSpeed * deltaTime);
  }

  // --- Rotation (reste instantanée pour l'instant) ---
  const rotSpeed = 1.2 * deltaTime; // radians/seconde, à ajuster
  const verticalSpeed = 8 * deltaTime; // 8 unités/seconde
  const surfaceY = 20;
  const maxDepth = 200;

  // Rotation : si on avance (même un peu), rotation normale.
  const isMovingForwardOrBackward = Math.abs(currentSpeed) > 0.1;
  const isLeft = keys['q'] || keys['arrowleft'];
  const isRight = keys['d'] || keys['arrowright'];

  if (isMovingForwardOrBackward) {
    if (isLeft) playerSubmarine.rotation.y += rotSpeed;
    if (isRight) playerSubmarine.rotation.y -= rotSpeed;
  } else {
    // Si immobile, petite poussée en tournant (on pourrait aussi l'inertiser)
    if (isLeft) {
      playerSubmarine.rotation.y += rotSpeed;
      // playerSubmarine.translateZ(-maxSpeed * 0.1 * deltaTime); // Optionnel
    }
    if (isRight) {
      playerSubmarine.rotation.y -= rotSpeed;
      // playerSubmarine.translateZ(-maxSpeed * 0.1 * deltaTime); // Optionnel
    }
  }

  // --- Contrôle vertical (reste instantané) ---
  if (playerSubmarine.children && playerSubmarine.children[0]) {
    const sub = playerSubmarine.children[0];
    if (keys['a']) sub.position.y += verticalSpeed;
    if (keys['w']) sub.position.y -= verticalSpeed;
    // Clamp la profondeur
    if (sub.position.y + playerSubmarine.position.y > surfaceY) sub.position.y = surfaceY - playerSubmarine.position.y;
    if (sub.position.y + playerSubmarine.position.y < surfaceY - maxDepth) sub.position.y = (surfaceY - maxDepth) - playerSubmarine.position.y;
  }

  // Retourne la vitesse actuelle pour le speedometer
  return currentSpeed;
}
