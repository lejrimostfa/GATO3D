// ui/submarineStatus.js
// Module de gestion des jauges de statut du sous-marin (santé, oxygène, batterie)

// Valeurs par défaut et limites
const DEFAULT_VALUES = {
  health: 100,
  oxygen: 100,
  battery: 100
};

// Configuration des jauges
const CONFIG = {
  batterySegments: 10,  // Nombre de segments pour la batterie
  batteryColors: {
    high: '#0f0',      // Vert pour niveau élevé
    medium: '#ff0',    // Jaune pour niveau moyen
    low: '#f00'        // Rouge pour niveau bas
  },
  healthFlashDuration: 500,  // Durée du flash de santé en ms lors d'une collision
  healthFlashColor: '#f00'   // Couleur du flash de santé
};

// Variables de suivi des valeurs actuelles
let currentHealth = DEFAULT_VALUES.health;
let currentOxygen = DEFAULT_VALUES.oxygen;
let currentBattery = DEFAULT_VALUES.battery;

// Références aux éléments DOM
let healthBar, healthValue;
let oxygenBar, oxygenValue;
let batterySegmentsContainer, batteryValue;
let batterySegments = [];  // Tableau pour stocker les références aux segments

// Événements pour la communication avec d'autres modules
const events = {
  onHealthChange: null,
  onOxygenChange: null,
  onBatteryChange: null
};

/**
 * Initialise les jauges de statut du sous-marin
 */
export function initSubmarineStatus() {
  // Récupérer les références DOM
  healthBar = document.getElementById('health-bar');
  healthValue = document.getElementById('health-value');
  oxygenBar = document.getElementById('oxygen-bar');
  oxygenValue = document.getElementById('oxygen-value');
  batterySegmentsContainer = document.getElementById('battery-segments');
  batteryValue = document.getElementById('battery-value');

  // Vérifier que les éléments essentiels sont présents
  if (!healthBar || !healthValue || !oxygenBar || !oxygenValue || !batterySegmentsContainer || !batteryValue) {
    console.warn('[UI:SubmarineStatus] Certains éléments de jauge sont manquants');
    return;
  }

  // Créer les segments de batterie
  createBatterySegments();

  // Initialiser les valeurs par défaut
  updateHealth(DEFAULT_VALUES.health);
  updateOxygen(DEFAULT_VALUES.oxygen);
  updateBattery(DEFAULT_VALUES.battery);

  console.log('[UI:SubmarineStatus] Jauges de statut initialisées');
}

/**
 * Crée les segments de batterie (carrés verts distincts)
 */
function createBatterySegments() {
  // Vider le conteneur
  batterySegmentsContainer.innerHTML = '';
  batterySegments = [];
  
  // Créer les segments (10 carrés représentant 10% chacun)
  for (let i = 0; i < CONFIG.batterySegments; i++) {
    const segment = document.createElement('div');
    // Styles pour créer des carrés distincts
    segment.style.width = '12px';
    segment.style.height = '18px';
    segment.style.margin = '1px';
    segment.style.backgroundColor = CONFIG.batteryColors.high;
    segment.style.borderRadius = '2px';
    segment.style.border = '1px solid rgba(0,255,0,0.3)';
    segment.style.boxShadow = '0 0 3px rgba(0,255,0,0.3)';
    segment.style.transition = 'background-color 0.3s ease, opacity 0.3s ease';
    
    // Ajouter au conteneur et au tableau de références
    batterySegmentsContainer.appendChild(segment);
    batterySegments.push(segment);
  }
  
  // Ajuster le style du conteneur pour les segments
  batterySegmentsContainer.style.display = 'flex';
  batterySegmentsContainer.style.justifyContent = 'center';
  batterySegmentsContainer.style.alignItems = 'center';
}

/**
 * Met à jour la jauge de santé
 * @param {number} value - Valeur de santé (0-100)
 * @param {boolean} flashEffect - Si true, ajoute un effet de flash (pour les collisions)
 */
export function updateHealth(value, flashEffect = false) {
  if (!healthBar || !healthValue) return;
  
  // Vérifier si c'est une diminution de santé (dommage)
  const isDamage = value < currentHealth;
  
  // Limiter la valeur entre 0 et 100
  value = Math.max(0, Math.min(100, value));
  currentHealth = value;
  
  // Mettre à jour l'affichage
  healthBar.style.height = `${value}%`;
  healthValue.textContent = `${Math.round(value)}%`;
  
  // Changer la couleur en fonction du niveau de santé
  if (value < 20) {
    healthBar.style.backgroundColor = '#f00'; // Rouge vif pour critique
  } else if (value < 50) {
    healthBar.style.background = 'linear-gradient(to top, #f00, #f70)'; // Dégradé rouge-orange pour danger
  } else {
    healthBar.style.background = 'linear-gradient(to top, #f70, #0f0)'; // Dégradé orange-vert pour normal
  }
  
  // Effet de flash pour les dommages
  if (flashEffect && isDamage) {
    const originalBorder = healthBar.parentElement.style.border;
    healthBar.parentElement.style.border = `2px solid ${CONFIG.healthFlashColor}`;
    healthBar.parentElement.style.boxShadow = `0 0 10px ${CONFIG.healthFlashColor}`;
    
    setTimeout(() => {
      healthBar.parentElement.style.border = originalBorder;
      healthBar.parentElement.style.boxShadow = 'none';
    }, CONFIG.healthFlashDuration);
  }
  
  // Déclencher l'événement si défini
  if (events.onHealthChange) {
    events.onHealthChange(value);
  }
}

/**
 * Met à jour la jauge d'oxygène
 * @param {number} value - Valeur d'oxygène (0-100)
 */
export function updateOxygen(value) {
  if (!oxygenBar || !oxygenValue) return;
  
  // Limiter la valeur entre 0 et 100
  value = Math.max(0, Math.min(100, value));
  currentOxygen = value;
  
  // Mettre à jour l'affichage
  oxygenBar.style.height = `${value}%`;
  oxygenValue.textContent = `${Math.round(value)}%`;
  
  // Changer la couleur en fonction du niveau d'oxygène
  if (value < 20) {
    oxygenBar.style.backgroundColor = '#f00'; // Rouge pour critique
  } else if (value < 50) {
    oxygenBar.style.background = 'linear-gradient(to top, #f00, #0af)'; // Dégradé rouge-bleu pour danger
  } else {
    oxygenBar.style.background = 'linear-gradient(to top, #0af, #0ff)'; // Dégradé bleu-cyan pour normal
  }
  
  // Déclencher l'événement si défini
  if (events.onOxygenChange) {
    events.onOxygenChange(value);
  }
}

/**
 * Met à jour la jauge de batterie avec des segments
 * @param {number} value - Valeur de batterie (0-100)
 */
export function updateBattery(value) {
  if (!batterySegmentsContainer || !batteryValue || batterySegments.length === 0) return;
  
  // Limiter la valeur entre 0 et 100
  value = Math.max(0, Math.min(100, value));
  currentBattery = value;
  
  // Mettre à jour l'affichage du texte
  batteryValue.textContent = `${Math.round(value)}%`;
  
  // Changer la couleur du texte pour indiquer l'état de la batterie
  if (value < 20) {
    batteryValue.style.color = CONFIG.batteryColors.low;
    // Faire clignoter l'affichage si très faible
    if (value < 5) {
      batteryValue.style.animation = 'blink 1s infinite';
    } else {
      batteryValue.style.animation = 'none';
    }
  } else if (value < 50) {
    batteryValue.style.color = CONFIG.batteryColors.medium;
    batteryValue.style.animation = 'none';
  } else {
    batteryValue.style.color = CONFIG.batteryColors.high;
    batteryValue.style.animation = 'none';
  }
  
  // Calculer combien de segments doivent être actifs
  const segmentsToActivate = Math.ceil((value / 100) * CONFIG.batterySegments);
  
  // Déterminer la couleur des segments en fonction du niveau
  let segmentColor;
  if (value < 20) {
    segmentColor = CONFIG.batteryColors.low;
  } else if (value < 50) {
    segmentColor = CONFIG.batteryColors.medium;
  } else {
    segmentColor = CONFIG.batteryColors.high;
  }
  
  // Mettre à jour chaque segment
  for (let i = 0; i < batterySegments.length; i++) {
    const segment = batterySegments[i];
    
    if (i < segmentsToActivate) {
      // Segment actif - visible avec la couleur appropriée
      segment.style.backgroundColor = segmentColor;
      segment.style.opacity = '1';
      // Ajouter une bordure de la même couleur mais plus claire
      segment.style.border = `1px solid ${segmentColor}80`; // 80 = 50% opacité en hex
      // Ajouter un effet de glow pour les segments actifs
      segment.style.boxShadow = `0 0 5px ${segmentColor}80`;
    } else {
      // Segment inactif - transparence avec bordure visible
      segment.style.backgroundColor = 'rgba(0,0,0,0.1)';
      segment.style.opacity = '0.3';
      segment.style.border = '1px solid rgba(0,50,0,0.2)';
      segment.style.boxShadow = 'none';
    }
  }
  
  // Déclencher l'événement si défini
  if (events.onBatteryChange) {
    events.onBatteryChange(value);
  }
}

/**
 * Récupère les valeurs actuelles des jauges
 * @returns {Object} Objet contenant les valeurs actuelles
 */
export function getCurrentValues() {
  return {
    health: currentHealth,
    oxygen: currentOxygen,
    battery: currentBattery
  };
}

/**
 * Définit un gestionnaire d'événement pour les changements de santé
 * @param {Function} callback - Fonction à appeler lors du changement
 */
export function onHealthChange(callback) {
  events.onHealthChange = callback;
}

/**
 * Définit un gestionnaire d'événement pour les changements d'oxygène
 * @param {Function} callback - Fonction à appeler lors du changement
 */
export function onOxygenChange(callback) {
  events.onOxygenChange = callback;
}

/**
 * Définit un gestionnaire d'événement pour les changements de batterie
 * @param {Function} callback - Fonction à appeler lors du changement
 */
export function onBatteryChange(callback) {
  events.onBatteryChange = callback;
}

/**
 * Applique des dommages au sous-marin avec effet visuel
 * @param {number} amount - Quantité de dommages (0-100)
 */
export function takeDamage(amount) {
  updateHealth(currentHealth - amount, true);
}

/**
 * Simule la consommation d'oxygène (pour tests)
 * @param {number} amount - Quantité d'oxygène consommée (0-100)
 */
export function consumeOxygen(amount) {
  updateOxygen(currentOxygen - amount);
}

/**
 * Simule la consommation de batterie (pour tests)
 * @param {number} amount - Quantité de batterie consommée (0-100)
 */
export function consumeBattery(amount) {
  updateBattery(currentBattery - amount);
}

/**
 * Réinitialise toutes les jauges aux valeurs par défaut
 */
export function resetAllGauges() {
  updateHealth(DEFAULT_VALUES.health);
  updateOxygen(DEFAULT_VALUES.oxygen);
  updateBattery(DEFAULT_VALUES.battery);
}
