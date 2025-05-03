// levels/levelManager.js
// Gestionnaire de niveaux/scènes pour GATO3D

/**
 * Charge dynamiquement un niveau et initialise la scène.
 * @param {string} levelName - nom du module de niveau (ex: 'level1')
 * @param {THREE.WebGLRenderer} renderer
 * @param {function} onLoaded - callback({scene, camera, objects})
 */
export function loadLevel(levelName, renderer, onLoaded) {
  import(`./${levelName}.js`).then(module => {
    const { createLevel } = module;
    const { scene, camera, objects } = createLevel(renderer);
    if (onLoaded) onLoaded({ scene, camera, objects });
  });
}
