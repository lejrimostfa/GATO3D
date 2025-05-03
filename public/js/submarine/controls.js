// submarine/controls.js
// Contrôles et mouvements du sous-marin pour GATO3D

/**
 * Met à jour la position et la rotation du sous-marin en fonction des entrées clavier.
 * @param {THREE.Object3D} playerSubmarine
 * @param {Object} keys - dictionnaire des touches actives
 */
export function updatePlayerSubmarine(playerSubmarine, keys) {
  if (!playerSubmarine) return;

  const speed = 0.5;
  const rotSpeed = 0.02 / 3; // 3x plus lent
  const verticalSpeed = 0.4;
  const surfaceY = 20;
  const maxDepth = 200;

  // Forward/backward (pivot)
  if (keys['z'] || keys['arrowup']) {
    playerSubmarine.translateZ(-speed);
  }
  if (keys['s'] || keys['arrowdown']) {
    playerSubmarine.translateZ(speed);
  }

  // Rotation : si on avance, rotation normale. Sinon, rotation + petite poussée avant
  const isForward = keys['z'] || keys['arrowup'];
  const isLeft = keys['q'] || keys['arrowleft'];
  const isRight = keys['d'] || keys['arrowright'];
  if (isForward) {
    if (isLeft) playerSubmarine.rotation.y += rotSpeed;
    if (isRight) playerSubmarine.rotation.y -= rotSpeed;
  } else {
    if (isLeft) {
      playerSubmarine.rotation.y += rotSpeed;
      playerSubmarine.translateZ(-speed * 0.2);
    }
    if (isRight) {
      playerSubmarine.rotation.y -= rotSpeed;
      playerSubmarine.translateZ(-speed * 0.2);
    }
  }

  // Contrôle vertical (A = monter, W = descendre) sur le sous-marin enfant
  if (playerSubmarine.children && playerSubmarine.children[0]) {
    const sub = playerSubmarine.children[0];
    if (keys['a']) sub.position.y += verticalSpeed;
    if (keys['w']) sub.position.y -= verticalSpeed;
    // Clamp la profondeur
    if (sub.position.y + playerSubmarine.position.y > surfaceY) sub.position.y = surfaceY - playerSubmarine.position.y;
    if (sub.position.y + playerSubmarine.position.y < surfaceY - maxDepth) sub.position.y = (surfaceY - maxDepth) - playerSubmarine.position.y;
  }
}
