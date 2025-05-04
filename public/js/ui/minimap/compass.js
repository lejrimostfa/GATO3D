// ui/minimap/compass.js
// Gestion de la boussole sur la minimap

/**
 * Fix compass positioning on the minimap
 */
export function fixCompassPosition() {
  // Vérifier d'abord avec l'ID 'compass' (original) puis avec 'minimap-compass' (refactorisé)
  let compass = document.getElementById('compass');
  
  // Si non trouvé, essayer avec l'autre ID possible
  if (!compass) {
    compass = document.getElementById('minimap-compass');
  }
  
  // Si toujours pas trouvé, tenter de créer l'élément dans le minimap
  if (!compass) {
    console.log('[UI:Minimap] Compass not found, creating it');
    const minimapContainer = document.querySelector('.minimap-container');
    if (minimapContainer) {
      compass = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      compass.id = 'compass'; // Utiliser l'ID original pour compatibilité
      compass.style.position = 'absolute';
      compass.style.bottom = '10px';
      compass.style.right = '10px';
      compass.style.width = '40px';
      compass.style.height = '40px';
      compass.style.zIndex = '150';
      
      // Créer les éléments SVG nécessaires
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      
      // Ajouter au SVG
      compass.appendChild(circle);
      compass.appendChild(polygon);
      compass.appendChild(text);
      
      // Ajouter le SVG au conteneur
      minimapContainer.appendChild(compass);
    }
  }
  if (!compass) {
    console.warn('[UI:Minimap] Compass element not found');
    return;
  }
  
  console.log('[UI:Minimap] Fixing compass positioning');
  
  // Define compass size as a percentage of the minimap or fixed value
  const compassSize = 40;
  
  // Fix compass dimensions
  compass.setAttribute('width', compassSize);
  compass.setAttribute('height', compassSize);
  compass.style.width = compassSize + 'px';
  compass.style.height = compassSize + 'px';
  
  // Position the compass within the minimap
  compass.style.position = 'absolute';
  compass.style.bottom = '10px';
  compass.style.right = '10px';
  
  // Update compass SVG elements
  const circle = compass.querySelector('circle');
  const polygon = compass.querySelector('polygon');
  const text = compass.querySelector('text');
  
  if (circle && polygon && text) {
    // Center point for the SVG elements
    const center = compassSize / 2;
    const radius = (compassSize / 2) - 2;
    
    // Update circle attributes
    circle.setAttribute('cx', center);
    circle.setAttribute('cy', center);
    circle.setAttribute('r', radius);
    
    // Update north pointer (triangle)
    const topY = center - radius + 2;
    const bottomY = center;
    const leftX = center - 4;
    const rightX = center + 4;
    polygon.setAttribute('points', `${center},${topY} ${leftX},${bottomY} ${rightX},${bottomY}`);
    
    // Update text position
    text.setAttribute('x', center);
    text.setAttribute('y', center + radius + 8);
    text.setAttribute('font-size', compassSize * 0.25);
  }
}
