// enemies/simpleShip.js
// Création d'un navire simple avec Three.js natif (sans modèle externe)

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { scene } from '../game/gameInit.js';

export function createSimpleShips() {
  // console.log('[SIMPLE_SHIP] Creating simple ships with native Three.js');
  
  if (!scene) {
    console.error('[SIMPLE_SHIP] Scene not available');
    return;
  }
  
  // Créer un groupe pour le navire
  const shipGroup = new THREE.Group();
  
  // Coque principale (gris foncé)
  const hullGeometry = new THREE.BoxGeometry(8, 4, 30);
  const hullMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    specular: 0x111111,
    shininess: 30
  });
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  hull.position.y = 1;
  shipGroup.add(hull);
  
  // Pont supérieur (gris clair)
  const deckGeometry = new THREE.BoxGeometry(6, 1, 20);
  const deckMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x666666,
    specular: 0x222222,
    shininess: 30
  });
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.y = 3.5;
  shipGroup.add(deck);
  
  // Cabine de commandement (blanc)
  const cabinGeometry = new THREE.BoxGeometry(4, 4, 6);
  const cabinMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xCCCCCC,
    specular: 0x444444,
    shininess: 50
  });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.y = 6;
  cabin.position.z = -2;
  shipGroup.add(cabin);
  
  // Mât (cylindre vertical)
  const mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
  const mastMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x111111,
    specular: 0x222222,
    shininess: 30
  });
  const mast = new THREE.Mesh(mastGeometry, mastMaterial);
  mast.position.y = 10;
  mast.position.z = -2;
  shipGroup.add(mast);
  
  // Cheminée
  const chimneyGeometry = new THREE.CylinderGeometry(1, 1, 4, 8);
  const chimneyMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x222222,
    specular: 0x111111,
    shininess: 10
  });
  const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
  chimney.position.y = 6;
  chimney.position.z = 4;
  shipGroup.add(chimney);
  
  // Créer plusieurs navires
  const ships = [];
  const waterLevel = 20; // Niveau de l'eau
  
  // Positions des navires
  const positions = [
    { x: 100, z: 100 },
    { x: 200, z: -100 },
    { x: -150, z: 200 },
    { x: -200, z: -200 }
  ];
  
  // Créer un navire à chaque position
  positions.forEach((pos, index) => {
    const shipCopy = shipGroup.clone();
    
    // Positionner le navire à la surface de l'eau
    shipCopy.position.set(pos.x, waterLevel, pos.z);
    
    // Rotation aléatoire
    shipCopy.rotation.y = Math.random() * Math.PI * 2;
    
    // Ajouter à la scène
    scene.add(shipCopy);
    ships.push(shipCopy);
    
    // console.log(`[SIMPLE_SHIP] Created ship ${index+1} at position (${pos.x}, ${waterLevel}, ${pos.z})`);
  });
  
  // Retourner les navires pour pouvoir les animer plus tard
  return ships;
}
