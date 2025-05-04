// ui/settings/lightSettings.js
// Gestion des paramètres d'éclairage (soleil, Rayleigh, exposition)

import { setSunIntensity, setSkyUniform, getLightingHandles, getSunIntensity } from '../../lighting.js';

/**
 * Initialise les sliders avancés de lumière
 * @param {object} sceneHandles - objets de la scène (water, sky, sun, sunLight, renderer...)
 */
export function initLightSettings(sceneHandles) {
  console.log('[UI:Settings:Light] Initializing light controls');
  
  // Slider DirectionalLight (intensité du soleil)
  const sunSlider = document.getElementById('sunlight-slider');
  const sunLabel = document.getElementById('sunlight-label');
  if (sunSlider && sunLabel) {
    sunSlider.value = getSunIntensity(); 
    sunLabel.textContent = `Soleil: ${parseFloat(sunSlider.value).toFixed(2)}`;
    sunSlider.addEventListener('input', () => {
      sunLabel.textContent = `Soleil: ${parseFloat(sunSlider.value).toFixed(2)}`;
      setSunIntensity(parseFloat(sunSlider.value));
    });
  }
  
  // Slider Exposure (exposition du renderer)
  const expSlider = document.getElementById('exposure-slider');
  const expLabel = document.getElementById('exposure-label');
  if (expSlider && expLabel && sceneHandles.renderer) {
    expSlider.value = sceneHandles.renderer.toneMappingExposure;
    expLabel.textContent = `Exposure: ${parseFloat(expSlider.value).toFixed(2)}`;
    expSlider.addEventListener('input', () => {
      sceneHandles.renderer.toneMappingExposure = parseFloat(expSlider.value);
      expLabel.textContent = `Exposure: ${parseFloat(expSlider.value).toFixed(2)}`;
    });
  }
  
  // Ajout du sélecteur de mode Rayleigh
  initRayleighModeSelector(sceneHandles);
  
  // Slider Rayleigh (dispersion atmosphérique)
  const raySlider = document.getElementById('rayleigh-slider');
  const rayLabel = document.getElementById('rayleigh-label');
  if (raySlider && rayLabel && sceneHandles.sky && sceneHandles.sky.material && sceneHandles.sky.material.uniforms.rayleigh) {
    raySlider.value = sceneHandles.sky.material.uniforms.rayleigh.value;
    rayLabel.textContent = `Rayleigh: ${parseFloat(raySlider.value).toFixed(2)}`;
    raySlider.addEventListener('input', () => {
      sceneHandles.sky.material.uniforms.rayleigh.value = parseFloat(raySlider.value);
      rayLabel.textContent = `Rayleigh: ${parseFloat(raySlider.value).toFixed(2)}`;
      window.drawRayleighGraph && window.drawRayleighGraph();
    });
    // Redessine aussi au changement du slider (évite double déclaration)
    raySlider.addEventListener('input', window.drawRayleighGraph);
  }
  
  // Initialiser le graphique Rayleigh et les contrôles associés
  setupRayleighGraph(sceneHandles);
  
  console.log('[UI:Settings:Light] Light controls initialized');
}

/**
 * Initialise le sélecteur de mode Rayleigh
 */
function initRayleighModeSelector(sceneHandles) {
  let rayleighMode = 'auto'; // 'auto', 'sin', 'manual'
  let rayleighModeSelect = document.getElementById('rayleigh-mode-select');
  if (!rayleighModeSelect) {
    // Création dynamique si absent
    const panel = document.getElementById('light-settings-panel');
    rayleighModeSelect = document.createElement('select');
    rayleighModeSelect.id = 'rayleigh-mode-select';
    rayleighModeSelect.style.marginTop = '10px';
    rayleighModeSelect.innerHTML = `
      <option value="auto">Automatique 24h</option>
      <option value="sin">Sinus</option>
      <option value="manual">Manuel (slider)</option>
    `;
    const label = document.createElement('label');
    label.textContent = 'Courbe Rayleigh :';
    label.style.color = '#0f0';
    label.style.fontFamily = 'monospace';
    label.style.marginTop = '10px';
    label.appendChild(rayleighModeSelect);
    if (panel) panel.appendChild(label);
    
    // Ajout du slider de période de la sinusoïde
    setupRayleighPeriodSlider(panel);
  }
  
  // Redessine au changement de mode
  if (rayleighModeSelect) rayleighModeSelect.addEventListener('change', window.drawRayleighGraph);
}

/**
 * Initialise le slider de période pour le mode sinusoïde
 */
function setupRayleighPeriodSlider(panel) {
  let periodSlider = document.getElementById('rayleigh-period-slider');
  let periodLabel = document.getElementById('rayleigh-period-label');
  if (!periodSlider) {
    periodSlider = document.createElement('input');
    periodSlider.type = 'range';
    periodSlider.id = 'rayleigh-period-slider';
    periodSlider.min = '2';
    periodSlider.max = '48';
    periodSlider.step = '0.5';
    periodSlider.value = '14';
    periodSlider.style.width = '120px';
    periodSlider.style.marginLeft = '8px';
    periodLabel = document.createElement('span');
    periodLabel.id = 'rayleigh-period-label';
    periodLabel.style.color = '#0ff';
    periodLabel.style.fontFamily = 'monospace';
    periodLabel.style.marginLeft = '8px';
    periodLabel.textContent = 'Période sinusoïde : 24h';
    const periodWrap = document.createElement('div');
    periodWrap.style.display = 'flex';
    periodWrap.style.flexDirection = 'column';
    periodWrap.style.alignItems = 'flex-start';
    periodWrap.style.marginTop = '6px';
    const periodText = document.createElement('span');
    periodText.textContent = 'Période sinusoïde (h)';
    periodText.style.color = '#0f0';
    periodText.style.fontFamily = 'monospace';
    periodWrap.appendChild(periodText);
    periodWrap.appendChild(periodSlider);
    periodWrap.appendChild(periodLabel);
    if (panel) panel.appendChild(periodWrap);

    // Ajouter l'event listener
    periodSlider.addEventListener('input', () => {
      const period = parseFloat(periodSlider.value);
      periodLabel.textContent = `Période sinusoïde : ${period.toFixed(1)}h`;
      window.drawRayleighGraph && window.drawRayleighGraph();
    });
  }
}

/**
 * Initialise le graphique Rayleigh et ses fonctions associées
 */
function setupRayleighGraph(sceneHandles) {
  // Fonctions pour dessiner et animer le graphique
  window.drawRayleighGraph = function() {
    // Récupérer le canvas ou le créer
    let canvas = document.getElementById('rayleigh-graph');
    if (!canvas) {
      const panel = document.getElementById('light-settings-panel');
      if (!panel) return;
      
      const graphContainer = document.createElement('div');
      graphContainer.style.marginTop = '10px';
      
      canvas = document.createElement('canvas');
      canvas.id = 'rayleigh-graph';
      canvas.width = 200;
      canvas.height = 80;
      canvas.style.backgroundColor = '#001';
      canvas.style.border = '1px solid #0ff';
      
      graphContainer.appendChild(canvas);
      panel.appendChild(graphContainer);
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mode et paramètres
    const mode = document.getElementById('rayleigh-mode-select')?.value || 'auto';
    const period = parseFloat(document.getElementById('rayleigh-period-slider')?.value || '24');
    const sliderVal = parseFloat(document.getElementById('rayleigh-slider')?.value || '1');
    
    // Dessiner le graphique selon le mode
    const points = [];
    for (let x = 0; x < canvas.width; x++) {
      const h = (x / canvas.width) * 24; // heure (0-24)
      let val = 1;
      
      if (mode === 'auto') {
        // Mode auto: cycle de 24h
        val = 0.5 + 0.5 * Math.sin((h / 24) * Math.PI * 2 - Math.PI/2);
      } else if (mode === 'sin') {
        // Mode sinus: période personnalisée
        val = 0.5 + 0.5 * Math.sin((h / period) * Math.PI * 2);
      } else {
        // Mode manuel: valeur fixe du slider
        val = sliderVal;
      }
      
      // Limiter entre 0.1-3 (plage du slider)
      val = 0.1 + val * 2.9;
      points.push({ x, y: canvas.height - (val / 3) * canvas.height });
    }
    
    // Tracer la courbe
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Ligne blanche montrant l'heure actuelle
    const hourX = ((window._rayleighGraphHour || 12) / 24) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(hourX, 0);
    ctx.lineTo(hourX, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  
  // Animation de la ligne blanche temps réel
  function animateRayleighGraphLine() {
    window.drawRayleighGraph && window.drawRayleighGraph();
    requestAnimationFrame(animateRayleighGraphLine);
  }
  animateRayleighGraphLine();
  
  // Permet à main.js de piloter la barre blanche du minigraphique
  window.setRayleighGraphHour = function(h) {
    window._rayleighGraphHour = h;
  };
  
  // Déclenchement initial du dessin
  setTimeout(window.drawRayleighGraph, 200);
}

/**
 * Met à jour la position et le label du slider Rayleigh selon la valeur dynamique
 * @param {number} val
 */
export function updateRayleighSlider(val) {
  const raySlider = document.getElementById('rayleigh-slider');
  const rayLabel = document.getElementById('rayleigh-label');
  if (raySlider && rayLabel) {
    raySlider.value = val;
    rayLabel.textContent = `Rayleigh: ${parseFloat(val).toFixed(2)}`;
  }
}

// Exposer pour compatibilité avec le code existant
window.updateRayleighSlider = updateRayleighSlider;
