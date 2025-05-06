// Code d'injection directe pour créer une capsule visible
// COPIER ET COLLER CE CODE DANS LA CONSOLE DU NAVIGATEUR

(function() {
  // Couleurs très visibles
  const CAPSULE_COLOR = 0xff00ff; // Rose fuchsia
  const SOLID_COLOR = 0xff0000;   // Rouge vif
  
  // Dimensions énormes
  const RADIUS = 300;  // Rayon très large
  const HEIGHT = 200;  // Hauteur importante
  
  console.log("[DEBUG DIRECT] Création d'une capsule GÉANTE...");
  
  // Créer les géométries
  const cylinderGeo = new THREE.CylinderGeometry(RADIUS, RADIUS, HEIGHT - 2*RADIUS, 32);
  const sphereGeo = new THREE.SphereGeometry(RADIUS, 32, 24);
  
  // Matériau wireframe très visible
  const wireMat = new THREE.MeshBasicMaterial({
    color: CAPSULE_COLOR,
    wireframe: true,
    transparent: false,
    opacity: 1.0,
    depthTest: false
  });
  
  // Matériau solide
  const solidMat = new THREE.MeshBasicMaterial({
    color: SOLID_COLOR,
    transparent: true,
    opacity: 0.2,
    depthTest: false,
    side: THREE.DoubleSide
  });
  
  // Créer le groupe
  const capsule = new THREE.Group();
  
  // Ajouter le cylindre (à la fois wireframe et solide)
  const cylinder = new THREE.Mesh(cylinderGeo, wireMat);
  const cylinderSolid = new THREE.Mesh(cylinderGeo, solidMat);
  capsule.add(cylinder);
  capsule.add(cylinderSolid);
  
  // Ajouter les sphères du haut et du bas
  const topSphere = new THREE.Mesh(sphereGeo, wireMat);
  topSphere.position.y = (HEIGHT - 2*RADIUS) / 2;
  capsule.add(topSphere);
  
  const bottomSphere = new THREE.Mesh(sphereGeo, wireMat);
  bottomSphere.position.y = -(HEIGHT - 2*RADIUS) / 2;
  capsule.add(bottomSphere);
  
  // Fonction pour ajouter la capsule au sous-marin
  function attachToSubmarine() {
    if (!window.playerSubmarine) {
      console.error("[DEBUG DIRECT] Sous-marin non trouvé!");
      return false;
    }
    
    window.playerSubmarine.add(capsule);
    console.log("[DEBUG DIRECT] Capsule attachée au sous-marin:", window.playerSubmarine);
    return true;
  }
  
  // Fonction pour ajouter à la scène
  function addToScene() {
    if (!window.sceneHandles || !window.sceneHandles.scene) {
      console.error("[DEBUG DIRECT] Scène non trouvée!");
      return false;
    }
    
    window.sceneHandles.scene.add(capsule);
    
    // Suivre le sous-marin
    function updatePosition() {
      if (window.playerSubmarine) {
        capsule.position.copy(window.playerSubmarine.position);
        
        // Ajuster pour la hauteur du sous-marin
        if (window.playerSubmarine.children && window.playerSubmarine.children[0]) {
          capsule.position.y += window.playerSubmarine.children[0].position.y;
        }
      }
      
      requestAnimationFrame(updatePosition);
    }
    
    updatePosition();
    console.log("[DEBUG DIRECT] Capsule ajoutée à la scène:", window.sceneHandles.scene);
    return true;
  }
  
  // Tenter d'abord d'attacher au sous-marin
  if (!attachToSubmarine()) {
    // Si ça ne marche pas, ajouter à la scène
    addToScene();
  }
  
  // Stockage global
  window.debugDirectCapsule = capsule;
  
  console.log("[DEBUG DIRECT] Capsule de debug créée - elle devrait être TRÈS visible!");
  console.log("[DEBUG DIRECT] Utilisez window.debugDirectCapsule.visible = true/false pour contrôler la visibilité");
})();
