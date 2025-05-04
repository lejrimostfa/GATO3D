// time/timeManager.js - Manages game time, day/night cycle and related effects

// Time tracking state
const timeState = {
  timeStart: 0,
  dayDurationSeconds: 120, // Default duration of day in seconds
  isTimePaused: false,
  pausedHour: 0,
  currentGameHour: 0,
  lastTimeValue: 0,
  pausedAt: 0
};

/**
 * Initialize the time manager
 * @param {number} dayDuration - Duration of a full day in seconds
 */
export function initTimeManager(dayDuration = 120) {
  timeState.dayDurationSeconds = dayDuration;
  timeState.timeStart = performance.now();
  timeState.isTimePaused = false;
}

/**
 * Toggle the pause state of the time
 * @returns {boolean} - The new pause state
 */
export function toggleTimePause() {
  if (timeState.isTimePaused) {
    // Resume time - restart from where we left off
    timeState.isTimePaused = false;
    const pauseDuration = performance.now() - timeState.pausedAt;
    timeState.timeStart += pauseDuration;
  } else {
    // Pause time
    timeState.pausedHour = timeState.currentGameHour;
    timeState.pausedAt = performance.now();
    timeState.isTimePaused = true;
  }
  
  return timeState.isTimePaused;
}

/**
 * Set the day duration
 * @param {number} durationSeconds - The new day duration in seconds
 */
export function setDayDuration(durationSeconds) {
  if (durationSeconds > 0) {
    timeState.dayDurationSeconds = durationSeconds;
  }
}

/**
 * Update the game time
 * @returns {Object} - Current time state information
 */
export function updateGameTime() {
  let elapsedTime = performance.now() - timeState.timeStart;
  let timeOfDay = 0;
  
  if (timeState.isTimePaused) {
    timeState.currentGameHour = timeState.pausedHour;
  } else {
    timeState.currentGameHour = ((elapsedTime / (timeState.dayDurationSeconds * 1000)) * 24) % 24;
    timeOfDay = (elapsedTime / (timeState.dayDurationSeconds * 1000)) % 1; // 0-1 fraction of day
  }
  
  return {
    currentGameHour: timeState.currentGameHour,
    timeOfDay: timeOfDay,
    isTimePaused: timeState.isTimePaused
  };
}

/**
 * Get the current hour (0-24)
 * @returns {number} - The current game hour
 */
export function getCurrentHour() {
  return timeState.currentGameHour;
}

/**
 * Get the pause state
 * @returns {boolean} - Whether time is paused
 */
export function isTimePaused() {
  return timeState.isTimePaused;
}

/**
 * Set the current game hour directly (useful for debug/UI controls)
 * @param {number} hour - The hour to set (0-24)
 */
export function setCurrentHour(hour) {
  if (hour >= 0 && hour < 24) {
    if (!timeState.isTimePaused) {
      toggleTimePause(); // Pause time when manually setting hour
    }
    timeState.pausedHour = hour;
    timeState.currentGameHour = hour;
  }
}
