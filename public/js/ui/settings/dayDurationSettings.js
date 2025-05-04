// ui/settings/dayDurationSettings.js
// Gestion du slider de durée de la journée

/**
 * Initialise le slider de durée de journée et son label
 * @param {Function} onDayDurationChange - Callback appelé quand la durée change
 */
export function initDayDurationSettings(onDayDurationChange) {
  console.log('[UI:Settings:DayDuration] Initializing day duration settings');
  
  const daySlider = document.getElementById('day-duration-slider');
  const dayLabel = document.getElementById('day-duration-label');
  
  if (!daySlider || !dayLabel) {
    console.warn('[UI:Settings:DayDuration] Day duration controls not found');
    return;
  }
  
  // Valeur initiale
  const defaultVal = parseInt(daySlider.value) || 120;
  dayLabel.textContent = `${defaultVal} s`;
  
  // Ajouter l'écouteur d'événement
  daySlider.addEventListener('input', () => {
    const val = parseInt(daySlider.value);
    dayLabel.textContent = `${val} s`;
    
    // Appeler le callback avec la nouvelle valeur
    if (typeof onDayDurationChange === 'function') {
      onDayDurationChange(val);
    }
  });
  
  console.log('[UI:Settings:DayDuration] Day duration settings initialized with value:', defaultVal);
}

/**
 * Met à jour l'affichage du label si la valeur change ailleurs
 * @param {number} val
 */
export function updateDayDurationLabel(val) {
  const dayLabel = document.getElementById('day-duration-label');
  if (dayLabel) {
    dayLabel.textContent = `${val} s`;
  }
}
