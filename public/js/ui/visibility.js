// ui/visibility.js
// Manages the visibility controls for scene objects in GATO3D

/**
 * Initialize the visibility panel with scene objects
 * @param {THREE.Scene} scene - The scene containing objects to control
 * @returns {Function} - Update function to refresh the panel
 */
export function initVisibilityPanel(scene) {
  const visibilityPanel = document.getElementById('visibility-panel');
  if (!visibilityPanel) {
    console.error("Visibility panel not found in the DOM");
    return null;
  }
  
  // Store object references for later updates
  const trackedObjects = [];
  
  // Create and populate the visibility panel
  function updatePanel() {
    // Clear the current panel
    visibilityPanel.innerHTML = '';
    
    // Title for the panel
    const title = document.createElement('h3');
    title.textContent = 'Objets Visibles';
    title.style.margin = '0 0 10px 0';
    title.style.color = '#0ff';
    title.style.fontFamily = 'monospace';
    title.style.fontSize = '14px';
    visibilityPanel.appendChild(title);
    
    // No objects to display
    if (!scene || trackedObjects.length === 0) {
      const noObjects = document.createElement('div');
      noObjects.textContent = 'Aucun objet contrôlable';
      noObjects.style.color = '#0f0';
      noObjects.style.fontFamily = 'monospace';
      noObjects.style.fontSize = '12px';
      noObjects.style.padding = '5px 0';
      visibilityPanel.appendChild(noObjects);
      return;
    }
    
    // Create checkbox for each tracked object
    trackedObjects.forEach((obj, index) => {
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.marginBottom = '8px';
      
      // Create checkbox input
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `visibility-checkbox-${index}`;
      checkbox.checked = obj.visible;
      checkbox.style.marginRight = '8px';
      checkbox.style.cursor = 'pointer';
      
      // Add event listener to toggle visibility
      checkbox.addEventListener('change', () => {
        obj.visible = checkbox.checked;
        // Also toggle visibility of child objects
        if (obj.children && obj.children.length > 0) {
          obj.children.forEach(child => {
            child.visible = checkbox.checked;
          });
        }
      });
      
      // Create label for the checkbox
      const label = document.createElement('label');
      label.htmlFor = `visibility-checkbox-${index}`;
      label.textContent = obj.name || `Object ${index + 1}`;
      label.style.color = '#0f0';
      label.style.fontFamily = 'monospace';
      label.style.fontSize = '12px';
      label.style.cursor = 'pointer';
      
      // Append elements to container
      container.appendChild(checkbox);
      container.appendChild(label);
      
      // Add to panel
      visibilityPanel.appendChild(container);
    });
  }
  
  /**
   * Add an object to the visibility tracking list
   * @param {THREE.Object3D} object - The object to track
   * @param {string} name - Custom name for the object
   */
  function addObject(object, name) {
    if (!object) return;
    
    // Set a name if provided
    if (name) {
      object.name = name;
    }
    
    // Add to tracked objects if not already present
    if (!trackedObjects.includes(object)) {
      trackedObjects.push(object);
      updatePanel();
    }
  }
  
  /**
   * Find all named objects in the scene and add them to the panel
   * @param {THREE.Scene} scene - The scene to process
   */
  function addNamedObjectsFromScene(scene) {
    if (!scene) return;
    
    // List of important object types to track
    const keyObjectTypes = ['Mesh', 'Group', 'Light', 'Camera'];
    
    // Process all objects in the scene
    scene.traverse(object => {
      // Only track objects with names or of specific types
      if (object.name && object.name !== '' && 
          (keyObjectTypes.some(type => object.type.includes(type)) || 
           object.children.length > 0)) {
        
        // Don't add child objects of already tracked objects
        let isChildOfTracked = false;
        for (const tracked of trackedObjects) {
          if (object !== tracked && object.isDescendantOf && object.isDescendantOf(tracked)) {
            isChildOfTracked = true;
            break;
          }
        }
        
        // Add if not a child of an already tracked object
        if (!isChildOfTracked && !trackedObjects.includes(object)) {
          trackedObjects.push(object);
        }
      }
    });
    
    // Update the panel with the found objects
    updatePanel();
  }
  
  // Initial panel setup
  updatePanel();
  
  // Return interface for updating the panel
  return {
    addObject,
    addNamedObjectsFromScene,
    updatePanel
  };
}
