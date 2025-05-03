// ui/time-slider.js
// Gestion du slider de durée du jour pour GATO3D

/**
 * Initialise le slider de durée de journée et son label.
 * @param {function(number):void} onDayDurationChange - callback appelé quand la durée change
 */
export function initDayDurationSlider(onDayDurationChange) {
  const daySlider = document.getElementById('day-duration-slider');
  const dayLabel = document.getElementById('day-duration-label');
  if (!daySlider || !dayLabel) return;

  // Valeur initiale
  const defaultVal = parseInt(daySlider.value) || 120;
  dayLabel.textContent = `${defaultVal} s`;

  daySlider.addEventListener('input', () => {
    const val = parseInt(daySlider.value);
    dayLabel.textContent = `${val} s`;
    if (typeof onDayDurationChange === 'function') onDayDurationChange(val);
  });
}

/**
 * Met à jour l'affichage du label si la valeur change ailleurs.
 * @param {number} val
 */
export function updateDayDurationLabel(val) {
  const dayLabel = document.getElementById('day-duration-label');
  if (dayLabel) dayLabel.textContent = `${val} s`;
}
