// ui/settings.js
// Gestion des sliders et contrôles de paramètres (lumière, caméra, damping, etc.)

/**
 * Initialise les sliders avancés de lumière dans le menu Réglages lumières.
 * @param {object} sceneHandles - objets de la scène (water, sky, sun, sunLight, renderer...)
 */
export function initLightSliders(sceneHandles) {
  // Déclaration unique des éléments Rayleigh slider/label accessibles partout dans la fonction
  const raySlider = document.getElementById('rayleigh-slider');
  const rayLabel = document.getElementById('rayleigh-label');
  // Slider DirectionalLight
  const sunSlider = document.getElementById('sunlight-slider');
  const sunLabel = document.getElementById('sunlight-label');
  if (sunSlider && sunLabel && sceneHandles.sunLight) {
    sunSlider.value = sceneHandles.sunLight.intensity;
    sunLabel.textContent = `Soleil: ${parseFloat(sunSlider.value).toFixed(2)}`;
    sunSlider.addEventListener('input', () => {
      sceneHandles.sunLight.intensity = parseFloat(sunSlider.value);
      sunLabel.textContent = `Soleil: ${parseFloat(sunSlider.value).toFixed(2)}`;
    });
  }
  // Slider Exposure
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
      // Place le label sous le slider
      const periodLabelDiv = document.createElement('div');
      periodLabelDiv.appendChild(periodLabel);
      periodLabelDiv.style.marginTop = '2px';
      periodWrap.appendChild(periodLabelDiv);
      if (panel) panel.appendChild(periodWrap);
    }
    periodSlider.addEventListener('input', () => {
      periodLabel.textContent = `Période sinusoïde : ${periodSlider.value}h`;
      window.drawRayleighGraph && window.drawRayleighGraph();
    });
    window.getRayleighPeriod = () => parseFloat(periodSlider.value);

    // Ajout du slider de phase
    let phaseSlider = document.getElementById('rayleigh-phase-slider');
    let phaseLabel = document.getElementById('rayleigh-phase-label');
    if (!phaseSlider) {
      phaseSlider = document.createElement('input');
      phaseSlider.type = 'range';
      phaseSlider.id = 'rayleigh-phase-slider';
      phaseSlider.min = '0';
      phaseSlider.max = '24';
      phaseSlider.step = '0.1';
      phaseSlider.value = '16.0';
      phaseSlider.style.width = '120px';
      phaseSlider.style.marginLeft = '8px';
      phaseLabel = document.createElement('span');
      phaseLabel.id = 'rayleigh-phase-label';
      phaseLabel.style.color = '#0ff';
      phaseLabel.style.fontFamily = 'monospace';
      phaseLabel.style.marginLeft = '8px';
      phaseLabel.textContent = 'Phase : 16.0h';
      const phaseWrap = document.createElement('div');
      phaseWrap.style.display = 'flex';
      phaseWrap.style.flexDirection = 'column';
      phaseWrap.style.alignItems = 'flex-start';
      phaseWrap.style.marginTop = '6px';
      const phaseText = document.createElement('span');
      phaseText.textContent = 'Phase (h)';
      phaseText.style.color = '#0f0';
      phaseText.style.fontFamily = 'monospace';
      phaseWrap.appendChild(phaseText);
      phaseWrap.appendChild(phaseSlider);
      // Place le label sous le slider
      const phaseLabelDiv = document.createElement('div');
      phaseLabelDiv.appendChild(phaseLabel);
      phaseLabelDiv.style.marginTop = '2px';
      phaseWrap.appendChild(phaseLabelDiv);
      if (panel) panel.appendChild(phaseWrap);
    }
    phaseSlider.addEventListener('input', () => {
      phaseLabel.textContent = `Phase : ${parseFloat(phaseSlider.value).toFixed(1)}h`;
      window.drawRayleighGraph && window.drawRayleighGraph();
    });
    window.getRayleighPhase = () => parseFloat(phaseSlider.value);

    // Ajout du mini-graphique en bas du panneau
    let graph = document.getElementById('rayleigh-graph');
    if (!graph) {
      graph = document.createElement('canvas');
      graph.id = 'rayleigh-graph';
      graph.width = 180;
      graph.height = 48;
      graph.style.marginTop = '18px';
      graph.style.background = '#111';
      graph.style.borderRadius = '8px';
      if (panel) panel.appendChild(graph);
    }
  }
  rayleighModeSelect.addEventListener('change', () => {
    rayleighMode = rayleighModeSelect.value;
  });
  window.getRayleighMode = () => rayleighMode;

  // Fonction de dessin du graphique Rayleigh
  window.drawRayleighGraph = function() {
    const canvas = document.getElementById('rayleigh-graph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Axes
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height-1);
    ctx.lineTo(canvas.width, canvas.height-1);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    // Courbe
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const mode = typeof window.getRayleighMode === 'function' ? window.getRayleighMode() : 'auto';
    const period = (typeof window.getRayleighPeriod === 'function') ? window.getRayleighPeriod() : 24;
    const steps = 180;
    const phase = (typeof window.getRayleighPhase === 'function') ? window.getRayleighPhase() : 21;
    for (let h = 0; h <= 24; h += 24/steps) {
      let y;
      if (mode === 'auto' || mode === 'sin') {
        y = 0.5 + (6-0.5)*0.5*(1 - Math.cos(2*Math.PI*((h-phase)/period)));
      } else if (mode === 'manual') {
        y = document.getElementById('rayleigh-slider') ? parseFloat(document.getElementById('rayleigh-slider').value) : 2.5;
      } else {
        y = 2.5;
      }
      // Normalise y: 0.5-6 → canvas.height (bas=0.5, haut=6)
      const yNorm = canvas.height - ((y-0.5)/(6-0.5)) * (canvas.height-4) - 2;
      const x = (h/24)*canvas.width;
      if (h === 0) ctx.moveTo(x, yNorm);
      else ctx.lineTo(x, yNorm);
    }
    ctx.stroke();
    // Ligne blanche verticale = temps courant
    let gameHour = (typeof window._rayleighGraphHour === 'number') ? window._rayleighGraphHour : 0;
    const xNow = (gameHour/24)*canvas.width;
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xNow, 0);
    ctx.lineTo(xNow, canvas.height);
    ctx.stroke();
    ctx.restore();

    // Légende
    ctx.fillStyle = '#0ff';
    ctx.font = '10px monospace';
    ctx.fillText('0h', 2, canvas.height-4);
    ctx.fillText('6h', canvas.width*6/24-8, canvas.height-4);
    ctx.fillText('12h', canvas.width/2-10, canvas.height-4);
    ctx.fillText('18h', canvas.width*18/24-12, canvas.height-4);
    ctx.fillText('24h', canvas.width-22, canvas.height-4);


  }

  // Redessine au changement de mode
  if (rayleighModeSelect) rayleighModeSelect.addEventListener('change', window.drawRayleighGraph);
  // Redessine aussi au changement du slider
  if (raySlider) raySlider.addEventListener('input', window.drawRayleighGraph);
  setTimeout(window.drawRayleighGraph, 200);

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

  // Slider Rayleigh (utilise la même variable)
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


/**
 * Met à jour la position et le label du slider Rayleigh selon la valeur dynamique.
 * @param {number} val
 */
function updateRayleighSlider(val) {
  const raySlider = document.getElementById('rayleigh-slider');
  const rayLabel = document.getElementById('rayleigh-label');
  if (raySlider && rayLabel) {
    raySlider.value = val;
    rayLabel.textContent = `Rayleigh: ${parseFloat(val).toFixed(2)}`;
  }
}

// Exposition globale pour usage cross-fichier (si pas import ES module)
window.updateRayleighSlider = updateRayleighSlider;

}


/**
 * Initialise tous les sliders et leurs callbacks.
 * @param {object} sceneHandles - objets de la scène (water, sky, sun, sunSphere...)
 * @param {object} playerSubmarine
 * @param {function} onDayDurationChange
 */
export function initSettings(sceneHandles, playerSubmarine, onDayDurationChange) {

  // Durée du jour
  const daySlider = document.getElementById('day-duration-slider');
  const dayLabel = document.getElementById('day-duration-label');
  if (daySlider && dayLabel) {
    const defaultVal = parseInt(daySlider.value) || 120;
    dayLabel.textContent = `${defaultVal} s`;
    daySlider.addEventListener('input', () => {
      const val = parseInt(daySlider.value);
      dayLabel.textContent = `${val} s`;
      if (typeof onDayDurationChange === 'function') onDayDurationChange(val);
    });
  }

  // Caméra
  const camSlider = document.getElementById('camera-slider');
  const camLabel = document.getElementById('camera-label');
  if (camSlider && camLabel) {
    camSlider.value = 130;
    camLabel.textContent = `Camera: 130`;
    camSlider.addEventListener('input', () => {
      camLabel.textContent = `Camera: ${camSlider.value}`;
    });
  }

  // Damping
  const dampingSlider = document.getElementById('damping-slider');
  const dampingLabel = document.getElementById('damping-label');
  if (dampingSlider && dampingLabel) {
    dampingSlider.value = 0.005;
    dampingLabel.textContent = `Damping: ${parseFloat(dampingSlider.value).toFixed(3)}`;
    dampingSlider.addEventListener('input', () => {
      dampingLabel.textContent = `Damping: ${parseFloat(dampingSlider.value).toFixed(3)}`;
    });
  }

  // Altitude caméra
  const altitudeSlider = document.getElementById('altitude-slider');
  const altitudeLabel = document.getElementById('altitude-label');
  if (altitudeSlider && altitudeLabel) {
    altitudeSlider.value = 40;
    altitudeLabel.textContent = `Altitude: 40`;
    altitudeSlider.addEventListener('input', () => {
      altitudeLabel.textContent = `Altitude: ${altitudeSlider.value}`;
    });
  }
}
