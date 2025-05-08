// submarine/statusManager.js
// Gestion des statuts du sous-marin (santé, oxygène, batterie)

import { updateHealth, updateOxygen, updateBattery, getCurrentValues } from '../ui/submarineStatus.js';

// Constantes de configuration
const CONFIG = {
  // Taux de consommation d'oxygène (% par seconde)
  oxygenConsumptionRate: 0.15,  // 0.15% par seconde = environ 11 minutes d'oxygène
  
  // Taux de consommation de batterie (% par seconde)
  batteryConsumptionBase: 0.01, // Consommation de base (très faible au repos)
  batteryConsumptionMoving: 0.2, // Consommation supplémentaire en mouvement (plus élevée)
  
  // Dommages
  collisionDamageMultiplier: 2.0, // Multiplicateur de dommages lors des collisions (augmenté)
  collisionDamageMinimum: 5.0,   // Dommage minimum lors d'une collision
  depthDamageThreshold: 800,    // Profondeur à partir de laquelle la coque commence à subir des dommages
  depthDamageRate: 0.1,         // Taux de dommages par seconde à grande profondeur
  
  // Régénération
  surfaceOxygenRegenRate: 2.0,  // Taux de régénération d'oxygène en surface (% par seconde) (plus rapide)
  batteryRechargeRate: 0.0      // Pas de recharge automatique de la batterie
};

// Variables d'état
let lastUpdateTime = 0;
let isUnderwater = false;
let isMoving = false;
let currentDepth = 0;
let currentVelocity = 0;

/**
 * Initialise le gestionnaire de statut
 */
export function initStatusManager() {
  lastUpdateTime = performance.now();
  console.log('[Submarine:Status] Gestionnaire de statut initialisé');
}

/**
 * Met à jour les statuts du sous-marin en fonction du temps écoulé et des actions
 * @param {Object} submarine - L'objet sous-marin
 * @param {number} depth - Profondeur actuelle
 * @param {number} velocity - Vitesse actuelle
 */
export function updateStatus(submarine, depth, velocity) {
  if (!submarine) return;
  
  const now = performance.now();
  const deltaTime = (now - lastUpdateTime) / 1000; // Convertir en secondes
  lastUpdateTime = now;
  
  // Mettre à jour les variables d'état
  currentDepth = depth;
  currentVelocity = velocity;
  isUnderwater = depth > 1; // Considéré sous l'eau si profondeur > 1m
  isMoving = Math.abs(velocity) > 0.1; // Considéré en mouvement si vitesse > 0.1
  
  // Récupérer les valeurs actuelles
  const { health, oxygen, battery } = getCurrentValues();
  
  // Mettre à jour l'oxygène
  updateOxygenLevel(deltaTime);
  
  // Mettre à jour la batterie
  updateBatteryLevel(deltaTime);
  
  // Vérifier les dommages liés à la profondeur
  checkDepthDamage(deltaTime);
  
  // Limiter la vitesse du sous-marin en fonction de la batterie
  limitSubmarineSpeed(submarine, battery);
}

/**
 * Limite la vitesse du sous-marin en fonction du niveau de batterie
 * @param {Object} submarine - L'objet sous-marin
 * @param {number} batteryLevel - Niveau de batterie actuel (0-100)
 */
function limitSubmarineSpeed(submarine, batteryLevel) {
  if (!submarine || !submarine.userData) return;
  
  // Si batterie épuisée, arrêter le sous-marin
  if (batteryLevel <= 0) {
    // Accéder aux propriétés de contrôle du sous-marin
    if (submarine.userData.targetVelocity !== undefined) {
      submarine.userData.targetVelocity = 0;
    }
    
    // Accéder aux propriétés de vitesse actuelle si disponibles
    if (submarine.userData.currentVelocity !== undefined) {
      submarine.userData.currentVelocity = 0;
    }
    
    // Accéder aux propriétés de physique si disponibles
    if (submarine.userData.physics) {
      submarine.userData.physics.velocity = 0;
      submarine.userData.physics.targetVelocity = 0;
    }
    
    console.log('[Submarine:Status] Batterie épuisée! Le sous-marin est immobilisé.');
  } else if (batteryLevel < 20) {
    // Batterie faible, limiter la vitesse à 50% du maximum
    const maxSpeed = submarine.userData.maxSpeed || 1.0;
    const limitedSpeed = maxSpeed * 0.5;
    
    if (submarine.userData.targetVelocity !== undefined && 
        Math.abs(submarine.userData.targetVelocity) > limitedSpeed) {
      // Limiter la vitesse tout en conservant la direction
      const direction = Math.sign(submarine.userData.targetVelocity);
      submarine.userData.targetVelocity = direction * limitedSpeed;
    }
  }
}

/**
 * Met à jour le niveau d'oxygène
 * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
 */
function updateOxygenLevel(deltaTime) {
  // Récupérer le niveau d'oxygène actuel
  const { oxygen } = getCurrentValues();
  
  // L'oxygène diminue sous l'eau et se recharge en surface
  
  // Vérifier si le sous-marin est sous l'eau (profondeur > 1m)
  if (currentDepth > 1) {
    // Forcer l'état sous-marin à vrai
    isUnderwater = true;
    
    // Consommation d'oxygène sous l'eau
    // La consommation augmente avec la profondeur
    const depthFactor = 1.0 + (currentDepth / 500); // +100% à 500m de profondeur
    const consumptionRate = CONFIG.oxygenConsumptionRate * depthFactor * deltaTime;
    
    // Consommation plus rapide si en mouvement
    const movementMultiplier = isMoving ? 1.2 : 1.0;
    const totalConsumption = consumptionRate * movementMultiplier;
    
    // Calculer le nouveau niveau d'oxygène
    const newOxygen = Math.max(0, oxygen - totalConsumption);
    

    
    // Mettre à jour l'oxygène
    updateOxygen(newOxygen);
    
    // Alerte si oxygène critique
    if (newOxygen < 15 && newOxygen > 14.9) {
      console.warn('[Submarine:Status] Niveau d\'oxygène critique! Remontez à la surface!');
    }
  } else {
    // Le sous-marin est en surface
    isUnderwater = false;
    
    // Régénération d'oxygène en surface
    const regenRate = CONFIG.surfaceOxygenRegenRate * deltaTime;
    const newOxygen = Math.min(100, oxygen + regenRate);
    

    
    // Mettre à jour l'oxygène
    updateOxygen(newOxygen);
  }
}

/**
 * Met à jour le niveau de batterie
 * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
 */
function updateBatteryLevel(deltaTime) {
  // Récupérer le niveau de batterie actuel
  const { battery } = getCurrentValues();
  
  // La batterie est directement liée au mouvement et s'épuise avec la vitesse
  
  // Consommation de base (même à l'arrêt)
  let consumptionRate = CONFIG.batteryConsumptionBase * deltaTime;
  
  // Vérifier si le sous-marin est en mouvement (vitesse > 0.1)
  if (Math.abs(currentVelocity) > 0.1) {
    // Forcer l'état en mouvement à vrai
    isMoving = true;
    
    // La consommation augmente de façon exponentielle avec la vitesse
    // Cela encourage une vitesse modérée pour économiser la batterie
    const velocityFactor = Math.pow(Math.abs(currentVelocity), 2);
    const movingConsumption = CONFIG.batteryConsumptionMoving * velocityFactor * deltaTime;
    consumptionRate += movingConsumption;
    
    // Consommation supplémentaire en profondeur (pression)
    if (currentDepth > 100) {
      const depthFactor = 1.0 + ((currentDepth - 100) / 900); // +100% à 1000m
      consumptionRate *= depthFactor;
    }
  } else {
    // Le sous-marin est à l'arrêt
    isMoving = false;
  }
  
  // Appliquer la consommation
  const newBatteryLevel = Math.max(0, battery - consumptionRate);
  
  // Une fois la batterie épuisée, le sous-marin s'immobilisera automatiquement
  
  // Mettre à jour la batterie
  updateBattery(newBatteryLevel);
  
  // Alerte si batterie faible
  if (newBatteryLevel < 20 && newBatteryLevel > 19.9) {
    console.warn('[Submarine:Status] Batterie faible! Vitesse réduite.');
  } else if (newBatteryLevel < 5 && newBatteryLevel > 4.9) {
    console.warn('[Submarine:Status] Batterie critique! Arrêt imminent.');
  }
}

/**
 * Vérifie les dommages liés à la profondeur
 * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
 */
function checkDepthDamage(deltaTime) {
  const { health } = getCurrentValues();
  
  // Dommages liés à la profondeur
  if (currentDepth > CONFIG.depthDamageThreshold) {
    const depthExcess = currentDepth - CONFIG.depthDamageThreshold;
    const damageRate = (depthExcess / 100) * CONFIG.depthDamageRate * deltaTime;
    updateHealth(health - damageRate);
  }
}

/**
 * Applique des dommages au sous-marin lors d'une collision
 * @param {number} impactForce - Force de l'impact
 */
export function applyCollisionDamage(impactForce) {
  // Récupérer la santé actuelle
  const { health } = getCurrentValues();
  
  // S'assurer que la force d'impact est un nombre valide
  if (isNaN(impactForce) || impactForce <= 0) {
    console.warn('[Submarine:Status] Force d\'impact invalide:', impactForce);
    impactForce = 1.0; // Valeur par défaut minimale
  }
  
  // Calculer les dommages avec un minimum garanti
  let damage = Math.max(
    CONFIG.collisionDamageMinimum,
    impactForce * CONFIG.collisionDamageMultiplier
  );
  
  // Arrondir pour plus de lisibilité
  damage = Math.round(damage);
  
  // Appliquer les dommages avec effet visuel (true pour activer le flash)
  updateHealth(health - damage, true);
}

/**
 * Réinitialise tous les statuts (après une mort ou un nouveau jeu)
 */
export function resetAllStatus() {
  updateHealth(100);
  updateOxygen(100);
  updateBattery(100);
}
