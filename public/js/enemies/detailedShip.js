// enemies/detailedShip.js
// Création d'un navire détaillé avec Three.js natif

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { scene } from '../game/gameInit.js';

export function createDetailedWarship(submarinePosition) {
  console.log('[DETAILED_SHIP] Creating detailed warship with native Three.js');
  
  if (!scene) {
    console.error('[DETAILED_SHIP] Scene not available');
    return null;
  }
  
  // Position par défaut si aucune position de sous-marin n'est fournie
  const waterLevel = 20;
  const shipDistance = 100;
  
  // Calculer la position devant le sous-marin
  let shipPosition = { x: 0, y: waterLevel, z: -shipDistance };
  let shipRotation = Math.PI; // Face au sous-marin par défaut
  
  if (submarinePosition) {
    // Utiliser la position et rotation du sous-marin pour placer le navire devant
    const submarineRotationY = submarinePosition.rotation ? submarinePosition.rotation.y : 0;
    
    // Placer le navire à une distance fixe devant le sous-marin
    shipPosition = {
      x: submarinePosition.x + Math.sin(submarineRotationY) * shipDistance,
      y: waterLevel,
      z: submarinePosition.z + Math.cos(submarineRotationY) * shipDistance
    };
    
    // Orienter le navire face au sous-marin
    shipRotation = submarineRotationY + Math.PI;
  }
  
  console.log('[DETAILED_SHIP] Creating warship at position:', shipPosition);
  
  // Créer un groupe pour le navire
  const shipGroup = new THREE.Group();
  
  // Matériaux
  const hullMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x2C3539, // Gris foncé
    specular: 0x111111,
    shininess: 30
  });
  
  const deckMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x36454F, // Gris charbon
    specular: 0x222222,
    shininess: 30
  });
  
  const cabinMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x778899, // Gris clair
    specular: 0x444444,
    shininess: 50
  });
  
  const detailMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x555555, // Gris moyen
    specular: 0x333333,
    shininess: 40
  });
  
  const metalMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B8878, // Beige grisâtre
    specular: 0x555555,
    shininess: 60
  });
  
  const darkMetalMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x2F4F4F, // Gris-vert foncé
    specular: 0x111111,
    shininess: 20
  });
  
  // 1. Coque principale (forme plus réaliste)
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-4, -15);
  hullShape.lineTo(4, -15);
  hullShape.lineTo(3, 15);
  hullShape.lineTo(-3, 15);
  hullShape.lineTo(-4, -15);
  
  const extrudeSettings = {
    steps: 1,
    depth: 4,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 1,
    bevelSegments: 3
  };
  
  const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
  hullGeometry.rotateX(Math.PI / 2);
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  hull.position.y = -2;
  shipGroup.add(hull);
  
  // 2. Pont principal
  const deckGeometry = new THREE.BoxGeometry(7, 1, 28);
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.y = 0;
  shipGroup.add(deck);
  
  // 3. Structure centrale (superstructure)
  const superstructureGeometry = new THREE.BoxGeometry(5, 3, 12);
  const superstructure = new THREE.Mesh(superstructureGeometry, cabinMaterial);
  superstructure.position.y = 2;
  superstructure.position.z = -2;
  shipGroup.add(superstructure);
  
  // 4. Tour de contrôle (passerelle)
  const bridgeGeometry = new THREE.BoxGeometry(3, 2, 4);
  const bridge = new THREE.Mesh(bridgeGeometry, cabinMaterial);
  bridge.position.y = 4.5;
  bridge.position.z = -2;
  shipGroup.add(bridge);
  
  // 5. Mât principal
  const mastGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
  const mast = new THREE.Mesh(mastGeometry, darkMetalMaterial);
  mast.position.y = 7.5;
  mast.position.z = -2;
  shipGroup.add(mast);
  
  // 6. Radar sur le mât
  const radarGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);
  const radar = new THREE.Mesh(radarGeometry, metalMaterial);
  radar.position.y = 10;
  radar.position.z = -2;
  radar.rotation.x = Math.PI / 2;
  shipGroup.add(radar);
  
  // 7. Cheminée
  const funnelGeometry = new THREE.CylinderGeometry(0.8, 1, 4, 8);
  const funnel = new THREE.Mesh(funnelGeometry, darkMetalMaterial);
  funnel.position.y = 3;
  funnel.position.z = 2;
  shipGroup.add(funnel);
  
  // 8. Canons avant
  const gunTurretGeometry = new THREE.BoxGeometry(3, 1, 3);
  const gunTurret1 = new THREE.Mesh(gunTurretGeometry, detailMaterial);
  gunTurret1.position.y = 0.5;
  gunTurret1.position.z = 10;
  shipGroup.add(gunTurret1);
  
  // Canon
  const gunBarrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
  const gunBarrel1 = new THREE.Mesh(gunBarrelGeometry, darkMetalMaterial);
  gunBarrel1.position.y = 1;
  gunBarrel1.position.z = 12;
  gunBarrel1.rotation.x = Math.PI / 2;
  shipGroup.add(gunBarrel1);
  
  // 9. Canons arrière
  const gunTurret2 = new THREE.Mesh(gunTurretGeometry, detailMaterial);
  gunTurret2.position.y = 0.5;
  gunTurret2.position.z = -10;
  shipGroup.add(gunTurret2);
  
  // Canon
  const gunBarrel2 = new THREE.Mesh(gunBarrelGeometry, darkMetalMaterial);
  gunBarrel2.position.y = 1;
  gunBarrel2.position.z = -12;
  gunBarrel2.rotation.x = -Math.PI / 2;
  shipGroup.add(gunBarrel2);
  
  // 10. Détails latéraux (canots de sauvetage)
  const lifeBoatGeometry = new THREE.CapsuleGeometry(0.5, 2, 4, 8);
  
  // Canots de sauvetage côté gauche
  const lifeBoat1 = new THREE.Mesh(lifeBoatGeometry, metalMaterial);
  lifeBoat1.position.set(-3, 1, 5);
  lifeBoat1.rotation.z = Math.PI / 2;
  shipGroup.add(lifeBoat1);
  
  const lifeBoat2 = new THREE.Mesh(lifeBoatGeometry, metalMaterial);
  lifeBoat2.position.set(-3, 1, 0);
  lifeBoat2.rotation.z = Math.PI / 2;
  shipGroup.add(lifeBoat2);
  
  // Canots de sauvetage côté droit
  const lifeBoat3 = new THREE.Mesh(lifeBoatGeometry, metalMaterial);
  lifeBoat3.position.set(3, 1, 5);
  lifeBoat3.rotation.z = Math.PI / 2;
  shipGroup.add(lifeBoat3);
  
  const lifeBoat4 = new THREE.Mesh(lifeBoatGeometry, metalMaterial);
  lifeBoat4.position.set(3, 1, 0);
  lifeBoat4.rotation.z = Math.PI / 2;
  shipGroup.add(lifeBoat4);
  
  // Positionner le navire
  shipGroup.position.set(shipPosition.x, shipPosition.y, shipPosition.z);
  shipGroup.rotation.y = shipRotation;
  
  // Ajouter à la scène
  scene.add(shipGroup);
  
  // Ajouter un éclairage dédié
  const spotLight = new THREE.SpotLight(0xffffff, 1);
  spotLight.position.set(shipPosition.x, shipPosition.y + 50, shipPosition.z);
  spotLight.target = shipGroup;
  spotLight.castShadow = true;
  scene.add(spotLight);
  
  console.log('[DETAILED_SHIP] Warship created successfully');
  
  // Retourner le groupe pour pouvoir le manipuler plus tard
  return shipGroup;
}
