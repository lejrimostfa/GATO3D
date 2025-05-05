// basic.js - Module de fonctionnalités minimales pour fonctionner

console.log('Cascade: Module de base chargé');

// Exportations vides pour compatibilité
export function noop() {}

// Pour underwater effects
export const initUnderwaterEffects = noop;
export const updateUnderwaterEffects = noop;
export const setUnderwaterBlur = noop;
export const setUnderwaterFog = noop;
export const setUnderwaterDistortion = noop;
export const setUnderwaterDistortionSpeed = noop;
export const setUnderwaterDistortionScale = noop;

// Indiquer que le module est prêt
console.log('Cascade: Module basic.js prêt');
