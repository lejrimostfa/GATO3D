// enemies/shipManager.js
// Gestion des navires ennemis, leur chargement, déplacement et IA

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/GLTFLoader.js';

// Configuration globale
const SHIP_CONFIG = {
  modelPath: './models/french_destroyer_la_bourdonnais/scene.gltf',
  scale: 0.05,  // Échelle du modèle (ajuster selon la taille du modèle)
  waterLevel: 20, // Niveau de l'eau (doit correspondre à water.position.y)
  speed: {
    min: 0.05,
    max: 0.2
  },
  rotationSpeed: 0.01,
  patrolRadius: {
    min: 500,
    max: 2000
  },
  spawnDistance: {
    min: 500,
    max: 3000
  },
  maxShips: 5,  // Nombre maximum de navires simultanés
  detectionRange: 800 // Distance à laquelle les navires détectent le sous-marin
};

// Classe pour gérer un navire individuel
class EnemyShip {
  constructor(scene, position, shipManager) {
    // console.log('[ENEMY] Creating new ship at position:', position);
    this.scene = scene;
    this.shipManager = shipManager;
    this.position = position || new THREE.Vector3(0, SHIP_CONFIG.waterLevel, 0);
    this.rotation = Math.random() * Math.PI * 2;
    this.speed = THREE.MathUtils.randFloat(SHIP_CONFIG.speed.min, SHIP_CONFIG.speed.max);
    this.model = null;
    this.loaded = false;
    this.active = true;
    
    // Paramètres de patrouille
    this.patrolRadius = THREE.MathUtils.randFloat(SHIP_CONFIG.patrolRadius.min, SHIP_CONFIG.patrolRadius.max);
    this.patrolCenter = new THREE.Vector3(
      position.x + THREE.MathUtils.randFloatSpread(500),
      SHIP_CONFIG.waterLevel,
      position.z + THREE.MathUtils.randFloatSpread(500)
    );
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.patrolSpeed = THREE.MathUtils.randFloat(0.002, 0.01);
    
    // État de l'IA
    this.state = 'patrol'; // 'patrol', 'chase', 'flee'
    this.targetPosition = null;
    this.lastStateChange = Date.now();
    
    // Charger le modèle
    this.loadModel();
  }
  
  loadModel() {
    // console.log('[ENEMY] Loading ship model from path:', SHIP_CONFIG.modelPath);
    const loader = new GLTFLoader();
    
    loader.load(
      SHIP_CONFIG.modelPath,
      (gltf) => {
        this.model = gltf.scene;
        
        // Appliquer l'échelle et la position
        this.model.scale.set(SHIP_CONFIG.scale, SHIP_CONFIG.scale, SHIP_CONFIG.scale);
        this.model.position.copy(this.position);
        this.model.rotation.y = this.rotation;
        
        // Ajouter à la scène
        this.scene.add(this.model);
        this.loaded = true;
        
        // console.log('[ENEMY] Ship model loaded successfully');
      },
      (xhr) => {
        // Progression du chargement
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          // console.log(`[ENEMY] Ship model loading: ${Math.round(percentComplete)}%`);
        }
      },
      (error) => {
        console.error('[ENEMY] Error loading ship model:', error);
      }
    );
  }
  
  update(deltaTime, submarinePosition) {
    if (!this.loaded || !this.active) return;
    
    // Calculer la distance au sous-marin
    const distanceToSubmarine = submarinePosition ? 
      this.position.distanceTo(submarinePosition) : Infinity;
    
    // Mettre à jour l'état de l'IA en fonction de la distance
    this.updateAIState(distanceToSubmarine, submarinePosition);
    
    // Comportement basé sur l'état
    switch (this.state) {
      case 'patrol':
        this.updatePatrolMovement(deltaTime);
        break;
      case 'chase':
        this.updateChaseMovement(deltaTime, submarinePosition);
        break;
      case 'flee':
        this.updateFleeMovement(deltaTime, submarinePosition);
        break;
    }
    
    // Appliquer la position et rotation au modèle
    if (this.model) {
      this.model.position.copy(this.position);
      this.model.rotation.y = this.rotation;
    }
  }
  
  updateAIState(distanceToSubmarine, submarinePosition) {
    const now = Date.now();
    const timeSinceLastChange = now - this.lastStateChange;
    
    // Ne pas changer d'état trop fréquemment (minimum 3 secondes)
    if (timeSinceLastChange < 3000) return;
    
    // Si le sous-marin est trop profond, le navire ne peut pas le détecter
    const submarineIsVisible = submarinePosition && 
                              submarinePosition.y > -50 && 
                              distanceToSubmarine < SHIP_CONFIG.detectionRange;
    
    // Changer d'état en fonction de la distance et de la profondeur
    let newState = this.state;
    
    if (submarineIsVisible) {
      // Le sous-marin est détecté et à portée
      if (submarinePosition.y > 0) {
        // Le sous-marin est en surface, le navire le poursuit
        newState = 'chase';
      } else {
        // Le sous-marin est sous l'eau mais détectable, le navire se positionne au-dessus
        newState = 'chase';
      }
    } else {
      // Pas de sous-marin détecté, patrouille normale
      newState = 'patrol';
    }
    
    // Si l'état a changé, enregistrer le moment du changement
    if (newState !== this.state) {
      this.state = newState;
      this.lastStateChange = now;
      // console.log(`[ENEMY] Ship changed state to: ${this.state}`);
    }
  }
  
  updatePatrolMovement(deltaTime) {
    // Mouvement de patrouille circulaire autour d'un point central
    this.patrolAngle += this.patrolSpeed * deltaTime;
    
    // Calculer la nouvelle position cible sur le cercle de patrouille
    const targetX = this.patrolCenter.x + Math.cos(this.patrolAngle) * this.patrolRadius;
    const targetZ = this.patrolCenter.z + Math.sin(this.patrolAngle) * this.patrolRadius;
    const targetPosition = new THREE.Vector3(targetX, SHIP_CONFIG.waterLevel, targetZ);
    
    // Orienter le navire vers la cible
    this.rotateTowardsTarget(targetPosition, deltaTime);
    
    // Avancer dans la direction de la rotation
    this.moveForward(deltaTime);
  }
  
  updateChaseMovement(deltaTime, submarinePosition) {
    if (!submarinePosition) return;
    
    // Créer une position cible à la surface au-dessus du sous-marin
    const targetPosition = new THREE.Vector3(
      submarinePosition.x,
      SHIP_CONFIG.waterLevel,
      submarinePosition.z
    );
    
    // Orienter le navire vers la cible
    this.rotateTowardsTarget(targetPosition, deltaTime);
    
    // Avancer dans la direction de la rotation
    this.moveForward(deltaTime);
  }
  
  updateFleeMovement(deltaTime, submarinePosition) {
    if (!submarinePosition) return;
    
    // Créer une position cible à l'opposé du sous-marin
    const direction = new THREE.Vector3().subVectors(this.position, submarinePosition).normalize();
    const targetPosition = new THREE.Vector3().addVectors(
      this.position,
      direction.multiplyScalar(500) // Fuir à 500 unités dans la direction opposée
    );
    targetPosition.y = SHIP_CONFIG.waterLevel; // Rester à la surface
    
    // Orienter le navire vers la cible
    this.rotateTowardsTarget(targetPosition, deltaTime);
    
    // Avancer dans la direction de la rotation, plus rapidement en fuyant
    this.moveForward(deltaTime, 1.5); // 1.5x la vitesse normale
  }
  
  rotateTowardsTarget(targetPosition, deltaTime) {
    // Calculer l'angle vers la cible
    const dx = targetPosition.x - this.position.x;
    const dz = targetPosition.z - this.position.z;
    const targetAngle = Math.atan2(dx, dz);
    
    // Calculer la différence d'angle (en tenant compte du cercle)
    let angleDiff = targetAngle - this.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Rotation progressive vers la cible
    const rotationAmount = Math.min(
      Math.abs(angleDiff),
      SHIP_CONFIG.rotationSpeed * deltaTime
    ) * Math.sign(angleDiff);
    
    this.rotation += rotationAmount;
  }
  
  moveForward(deltaTime, speedMultiplier = 1) {
    // Calculer le déplacement en fonction de la rotation
    const distance = this.speed * speedMultiplier * deltaTime;
    this.position.x += Math.sin(this.rotation) * distance;
    this.position.z += Math.cos(this.rotation) * distance;
    
    // Assurer que le navire reste à la surface de l'eau
    this.position.y = SHIP_CONFIG.waterLevel;
  }
  
  remove() {
    if (this.model && this.scene) {
      this.scene.remove(this.model);
      this.active = false;
      // console.log('[ENEMY] Ship removed from scene');
    }
  }
}

// Classe principale pour gérer tous les navires
export class ShipManager {
  constructor(scene) {
    this.scene = scene;
    this.ships = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 10000; // 10 secondes entre les spawns
    this.submarinePosition = null;
  }
  
  initialize() {
    // console.log('[ENEMY] Initializing ship manager');
    // Spawn initial ships
    const ship = this.spawnShip();
    // console.log('[ENEMY] Initial ship spawned:', ship);
    
    // Spawn a ship at a fixed position for testing
    const testPosition = new THREE.Vector3(100, SHIP_CONFIG.waterLevel, 100);
    const testShip = this.spawnShip(testPosition);
    // console.log('[ENEMY] Test ship spawned at fixed position:', testPosition);
  }
  
  spawnShip(forcedPosition = null) {
    // Limiter le nombre de navires
    if (this.ships.length >= SHIP_CONFIG.maxShips) return;
    
    // Position de spawn (loin du sous-marin)
    let position;
    
    if (forcedPosition) {
      position = forcedPosition;
    } else if (this.submarinePosition) {
      // Spawn à une distance aléatoire du sous-marin
      const angle = Math.random() * Math.PI * 2;
      const distance = THREE.MathUtils.randFloat(
        SHIP_CONFIG.spawnDistance.min,
        SHIP_CONFIG.spawnDistance.max
      );
      
      position = new THREE.Vector3(
        this.submarinePosition.x + Math.sin(angle) * distance,
        SHIP_CONFIG.waterLevel,
        this.submarinePosition.z + Math.cos(angle) * distance
      );
    } else {
      // Pas de sous-marin, spawn aléatoire
      position = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(3000),
        SHIP_CONFIG.waterLevel,
        THREE.MathUtils.randFloatSpread(3000)
      );
    }
    
    // Créer et ajouter le navire
    const ship = new EnemyShip(this.scene, position, this);
    this.ships.push(ship);
    
    // console.log(`[ENEMY] Spawned new ship at (${position.x.toFixed(0)}, ${position.z.toFixed(0)}), total: ${this.ships.length}`);
    
    return ship;
  }
  
  update(deltaTime, submarinePosition) {
    // Mettre à jour la position du sous-marin
    this.submarinePosition = submarinePosition;
    
    // Vérifier si on doit spawn un nouveau navire
    const now = Date.now();
    if (now - this.lastSpawnTime > this.spawnInterval && this.ships.length < SHIP_CONFIG.maxShips) {
      this.spawnShip();
      this.lastSpawnTime = now;
    }
    
    // Mettre à jour tous les navires
    for (let i = this.ships.length - 1; i >= 0; i--) {
      const ship = this.ships[i];
      
      // Mettre à jour le navire
      ship.update(deltaTime, submarinePosition);
      
      // Vérifier si le navire est toujours actif
      if (!ship.active) {
        this.ships.splice(i, 1);
      }
    }
  }
  
  // Supprimer tous les navires (utile pour le nettoyage/reset)
  removeAllShips() {
    for (const ship of this.ships) {
      ship.remove();
    }
    this.ships = [];
    // console.log('[ENEMY] All ships removed');
  }
  
  // Obtenir les positions de tous les navires (utile pour le radar)
  getShipPositions() {
    return this.ships
      .filter(ship => ship.active)
      .map(ship => ({
        position: ship.position.clone(),
        rotation: ship.rotation,
        state: ship.state
      }));
  }
}

// Fonction d'initialisation pour créer et configurer le gestionnaire de navires
export function initShipManager(scene) {
  const shipManager = new ShipManager(scene);
  shipManager.initialize();
  return shipManager;
}
