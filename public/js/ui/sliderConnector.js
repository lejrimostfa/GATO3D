// ui/sliderConnector.js
// Script de reconnexion des sliders aux fonctions d'origine
// Ce fichier fixe les sliders déconnectés après la refactorisation

/**
 * Réinitialise les connexions entre les sliders et les fonctions qui doivent être appelées
 * quand les valeurs changent. Cette fonction corrige le problème des sliders déconnectés.
 */
export function reconnectSliders() {
  // console.log('[UI:SliderConnector] Reconnecting sliders to their handler functions...');
  
  // Note: La gestion des sliders caméra est maintenant entièrement gérée par le module cameraControls.js
  // et son initCameraSliders() qui est appelé automatiquement au démarrage
  
  // 1. Sliders vagues
  connectWaveSliders();
  
  // 2. Sliders du sous-marin (vitesse, rotation, masse) et checkboxes debug
  connectSubmarineSliders();
  
  // 3. Slider de résistance de l'eau (drag)
  connectWaterResistanceSlider();
  
  // 4. Sliders d'éclairage
  connectLightingSliders();
  
  // 5. Autres sliders
  connectMiscSliders();
  
  // console.log('[UI:SliderConnector] All sliders reconnected successfully');
}

// Note: La fonction connectCameraSliders() a été supprimée car elle créait un doublon avec le système dans cameraControls.js
// La gestion des contrôles caméra est maintenant entièrement centralisée dans le module ui/controls/cameraControls.js

/**
 * Connecte les sliders de vagues et d'océan à leurs fonctions appropriées
 */
function connectWaveSliders() {
  const waveAmplitudeSlider = document.getElementById('wave-amplitude-slider');
  const waveDirectionSlider = document.getElementById('wave-direction-slider');
  const waterTransparencySlider = document.getElementById('water-transparency-slider');
  
  // Importer les fonctions de gestion des vagues
  import('../ocean/waveControls.js').then(({ setWaveAmplitude, setWaveDirection, setWaterTransparency, updateWaterMaterial }) => {
    // Fonction de mise à jour pour l'amplitude
    if (waveAmplitudeSlider) {
      waveAmplitudeSlider.addEventListener('input', () => {
        const amplitude = parseFloat(waveAmplitudeSlider.value);
        setWaveAmplitude(amplitude);
        updateWaterMaterial(window.sceneHandles?.water);
        
        // Mettre à jour le texte d'affichage
        const amplitudeLabel = document.getElementById('wave-amplitude-label');
        if (amplitudeLabel) {
          amplitudeLabel.textContent = `Amplitude: ${amplitude.toFixed(1)}`;
        }
        
        // console.log(`[UI:Ocean] Updated wave amplitude: ${amplitude}`);
      });
      
      // Déclencher l'événement initialement
      waveAmplitudeSlider.dispatchEvent(new Event('input'));
    }
    
    // Fonction de mise à jour pour la direction
    if (waveDirectionSlider) {
      waveDirectionSlider.addEventListener('input', () => {
        const direction = parseFloat(waveDirectionSlider.value);
        setWaveDirection(direction);
        updateWaterMaterial(window.sceneHandles?.water);
        
        // Mettre à jour le texte d'affichage
        const directionLabel = document.getElementById('wave-direction-label');
        if (directionLabel) {
          directionLabel.textContent = `Direction: ${direction}°`;
        }
        
        // console.log(`[UI:Ocean] Updated wave direction: ${direction}°`);
      });
      
      // Déclencher l'événement initialement
      waveDirectionSlider.dispatchEvent(new Event('input'));
    }
    
    // Fonction de mise à jour pour la transparence de l'eau
    if (waterTransparencySlider) {
      waterTransparencySlider.addEventListener('input', () => {
        const transparency = parseFloat(waterTransparencySlider.value);
        setWaterTransparency(transparency);
        updateWaterMaterial(window.sceneHandles?.water);
        
        // Mettre à jour le texte d'affichage
        const transparencyLabel = document.getElementById('water-transparency-label');
        if (transparencyLabel) {
          transparencyLabel.textContent = `Transparence: ${transparency.toFixed(1)}`;
        }
        
        // console.log(`[UI:Ocean] Updated water transparency: ${transparency}`);
      });
      
      // Déclencher l'événement initialement
      waterTransparencySlider.dispatchEvent(new Event('input'));
    }
  });
  
  // Connecter le slider de résistance de l'eau au système physique du sous-marin
  // REMARQUE: Ce slider est géré séparément dans la fonction connectWaterResistanceSlider()
  // pour suivre la même structure que les autres contrôles du sous-marin
}

/**
 * Connecte spécifiquement le slider de résistance de l'eau au système physique
 * en utilisant la même approche que les autres sliders de contrôle du sous-marin
 */
function connectWaterResistanceSlider() {
  const waterResistanceSlider = document.getElementById('water-resistance-slider');
  
  if (waterResistanceSlider) {
    // Importer la fonction dédiée pour mettre à jour la résistance de l'eau
    import('../submarine/controls.js').then(({ updateWaterResistance }) => {
      waterResistanceSlider.addEventListener('input', () => {
        const resistance = parseFloat(waterResistanceSlider.value);
        
        // Appeler la fonction dédiée pour mettre à jour la résistance
        updateWaterResistance(resistance);
        
        // Mettre à jour l'affichage
        const resistanceLabel = document.getElementById('water-resistance-label');
        if (resistanceLabel) {
          resistanceLabel.textContent = `Résistance: ${resistance.toFixed(1)}`;
        }
        
        // console.log(`[UI:Ocean] Updated water resistance to ${resistance}`);
      });
      
      // Déclencher l'événement initialement
      waterResistanceSlider.dispatchEvent(new Event('input'));
    }).catch(err => {
      console.error('[UI:Ocean] Error loading submarine controls:', err);
    });
  }
}

/**
 * Connecte les sliders du sous-marin (vitesse, rotation, masse)
 */
function connectSubmarineSliders() {
  // Importer les fonctions de contrôle du sous-marin
  import('../submarine/controls.js').then(({ updateMaxSpeed, updateRotationParams, updateSubmarineMass }) => {
    // Slider de vitesse
    const submarineSpeedSlider = document.getElementById('submarine-speed-slider');
    if (submarineSpeedSlider) {
      submarineSpeedSlider.addEventListener('input', () => {
        const value = parseFloat(submarineSpeedSlider.value);
        updateMaxSpeed(value);
        
        // Mettre à jour le texte de vitesse maximale
        const maxSpeedText = document.getElementById('max-speed-value');
        if (maxSpeedText) {
          maxSpeedText.textContent = value.toFixed(1);
        }
        
        // Mettre à jour le label du slider
        const speedLabel = document.querySelector('label[for="submarine-speed-slider"]');
        if (speedLabel) {
          speedLabel.textContent = `Max Speed: ${value.toFixed(1)} knots`;
        }
        
        // Mettre à jour le compteur de vitesse
        const speedometer = document.getElementById('speedometer-needle');
        if (speedometer && window.controls && window.controls.currentSpeed !== undefined) {
          // Mettre à jour l'échelle du speedomètre en fonction de la vitesse max
          const maxAngle = 170; // Angle maximal en degrés
          const currentSpeedRatio = window.controls.currentSpeed / value;
          const angle = Math.min(currentSpeedRatio * maxAngle, maxAngle);
          speedometer.style.transform = `rotate(${angle}deg)`;
        }
        
        // console.log(`[UI:Submarine] Updated submarine max speed: ${value} knots`);
      });
      // Application initiale
      submarineSpeedSlider.dispatchEvent(new Event('input'));
    }
    
    // Slider de rotation
    const rotationSpeedSlider = document.getElementById('rotation-speed-slider');
    if (rotationSpeedSlider) {
      rotationSpeedSlider.addEventListener('input', () => {
        const value = parseFloat(rotationSpeedSlider.value);
        updateRotationParams(value);
        
        // Mettre à jour le texte du slider
        const rotationLabel = document.querySelector('label[for="rotation-speed-slider"]');
        if (rotationLabel) {
          rotationLabel.textContent = `Rotation Speed: ${value.toFixed(2)}`;
        }
        
        // console.log(`[UI:Submarine] Updated submarine rotation speed: ${value}`);
      });
      // Application initiale
      rotationSpeedSlider.dispatchEvent(new Event('input'));
    }
    
    // Slider de masse
    const massSlider = document.getElementById('submarine-mass-slider');
    if (massSlider) {
      // Fixer la valeur maximale à 1000
      massSlider.max = 1000;
      massSlider.addEventListener('input', () => {
        const value = parseFloat(massSlider.value);
        updateSubmarineMass(value);
        
        // Mettre à jour le texte de la masse
        const massText = document.getElementById('submarine-mass-value');
        if (massText) {
          massText.textContent = value.toFixed(0);
        }
        
        // Mettre à jour le label du slider
        // Mettre à jour le label de masse
        const massLabel = document.getElementById('submarine-mass-label');
        if (massLabel) {
          massLabel.textContent = `Masse: ${value.toFixed(1)}`;
        }
        
        // console.log(`[UI:Submarine] Updated submarine mass: ${value}`);
      });
      // Application initiale
      massSlider.dispatchEvent(new Event('input'));
    }
    

  }).catch(err => {
    console.error('[UI:Submarine] Error connecting submarine sliders:', err);
  });
}

/**
 * Connecte les sliders d'éclairage (soleil, exposure, rayleigh)
 */
function connectLightingSliders() {
  // Importer les fonctions de gestion de l'éclairage
  import('../lighting.js').then(({ setSunIntensity, setDirectionalLightIntensity }) => {
    // Slider d'intensité du soleil
    const sunSlider = document.getElementById('sunlight-slider');
    if (sunSlider) {
      sunSlider.addEventListener('input', () => {
        const value = parseFloat(sunSlider.value);
        setSunIntensity(value);
        // console.log(`[UI:Light] Updated sun intensity: ${value}`);
      });
      // Application initiale
      sunSlider.dispatchEvent(new Event('input'));
    }
    
    // Slider d'exposition
    const exposureSlider = document.getElementById('exposure-slider');
    const renderer = window.sceneHandles?.renderer;
    if (exposureSlider && renderer) {
      exposureSlider.addEventListener('input', () => {
        const value = parseFloat(exposureSlider.value);
        renderer.toneMappingExposure = value;
        // console.log(`[UI:Light] Updated exposure: ${value}`);
      });
      // Application initiale
      exposureSlider.dispatchEvent(new Event('input'));
    }
    
    // Slider Rayleigh
    const rayleighSlider = document.getElementById('rayleigh-slider');
    const sky = window.sceneHandles?.sky;
    if (rayleighSlider && sky && sky.material && sky.material.uniforms.rayleigh) {
      // Fixer la valeur maximale à 10
      rayleighSlider.max = 10;
      rayleighSlider.addEventListener('input', () => {
        const value = parseFloat(rayleighSlider.value);
        sky.material.uniforms.rayleigh.value = value;
        // Redessiner le graphique si la fonction existe
        if (window.drawRayleighGraph) {
          window.drawRayleighGraph();
        }
        
        // Mettre à jour le texte
        const rayleighText = document.getElementById('rayleigh-value');
        if (rayleighText) {
          rayleighText.textContent = value.toFixed(2);
        }
        
        // console.log(`[UI:Light] Updated rayleigh: ${value}`);
      });
      // Application initiale
      rayleighSlider.dispatchEvent(new Event('input'));
    }
    
    // Slider de lumière directionnelle
    const directionalLightSlider = document.getElementById('directional-light-slider');
    if (directionalLightSlider) {
      // Fixer la valeur maximale à 5
      directionalLightSlider.max = 5;
      directionalLightSlider.addEventListener('input', () => {
        const value = parseFloat(directionalLightSlider.value);
        setDirectionalLightIntensity(value);
        
        // Mettre à jour le texte
        const directionalLightText = document.getElementById('directional-light-value');
        if (directionalLightText) {
          directionalLightText.textContent = value.toFixed(2);
        }
        
        // Mettre à jour le label du slider
        const directionalLightLabel = document.querySelector('label[for="directional-light-slider"]');
        if (directionalLightLabel) {
          directionalLightLabel.textContent = `Directional Light: ${value.toFixed(2)}`;
        }
        
        // console.log(`[UI:Light] Updated directional light intensity: ${value}`);
      });
      // Application initiale
      directionalLightSlider.dispatchEvent(new Event('input'));
    }
  }).catch(err => {
    console.error('[UI:Light] Error connecting lighting sliders:', err);
  });
}

/**
 * Connecte les autres sliders (jour, etc.)
 */
function connectMiscSliders() {
  // Slider de durée du jour
  const daySlider = document.getElementById('day-duration-slider');
  if (daySlider) {
    // Redéclencher l'événement input pour s'assurer que la fonction est appelée
    daySlider.dispatchEvent(new Event('input'));
  }
  
  // Autres sliders pourraient être ajoutés ici
}
