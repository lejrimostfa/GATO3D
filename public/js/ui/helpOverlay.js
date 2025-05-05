// ui/helpOverlay.js
// Overlay d'aide pour afficher les contrôles du jeu

/**
 * Initialise l'overlay d'aide qui affiche les contrôles du clavier
 */
// État global pour la disposition du clavier (AZERTY par défaut pour la France)
let isAzerty = true;

// Variables pour gérer le timer de fermeture automatique
let hideTimeout = null;
let isMouseOverHelp = false;

export function initHelpOverlay() {
  // Créer le bouton d'aide
  const helpButton = document.createElement('div');
  helpButton.id = 'help-button';
  helpButton.innerHTML = '?';
  helpButton.title = 'Afficher les contrôles';
  
  // Styles pour le bouton d'aide
  Object.assign(helpButton.style, {
    position: 'fixed',
    top: '15px',
    left: '15px',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
    color: '#000',
    fontSize: '20px',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: '1000',
    boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
    transition: 'all 0.3s ease'
  });
  
  // Créer l'overlay des contrôles (initialement caché)
  const controlsOverlay = document.createElement('div');
  controlsOverlay.id = 'controls-overlay';
  
  // Styles pour l'overlay
  Object.assign(controlsOverlay.style, {
    position: 'fixed',
    top: '60px',
    left: '15px',
    padding: '15px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: '1px solid #0f0',
    borderRadius: '5px',
    color: '#fff',
    zIndex: '999',
    display: 'none',
    maxWidth: '400px',
    boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)'
  });
  
  // Fonction pour mettre à jour le contenu de l'overlay en fonction de la disposition du clavier
  function updateKeyboardLayout() {
    // Déterminer les touches à afficher en fonction de la disposition du clavier
    const forwardKey = isAzerty ? 'Z' : 'W';
    const leftKey = isAzerty ? 'Q' : 'A';
    const backwardKey = 'S';
    const rightKey = 'D';
    const upKey = isAzerty ? 'A' : 'Q';
    const downKey = isAzerty ? 'W' : 'E';
    
    // Contenu de l'overlay - représentation visuelle du clavier
    controlsOverlay.innerHTML = `
    <h3 style="margin-top: 0; color: #0f0; text-align: center;">Contrôles du jeu</h3>
    <div style="display: flex; flex-direction: column; gap: 15px;">
      <!-- Touches de mouvement -->
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="display: flex; justify-content: center; gap: 5px;">
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">${forwardKey}</div>
        </div>
        <div style="display: flex; justify-content: center; gap: 5px; margin-top: 5px;">
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">${leftKey}</div>
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">${backwardKey}</div>
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">${rightKey}</div>
        </div>
        <div style="margin-top: 5px; text-align: center; color: #0f0;">Déplacement du sous-marin</div>
      </div>
      
      <!-- Flèches directionnelles -->
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="display: flex; justify-content: center; gap: 5px;">
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">↑</div>
        </div>
        <div style="display: flex; justify-content: center; gap: 5px; margin-top: 5px;">
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">←</div>
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">↓</div>
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">→</div>
        </div>
        <div style="margin-top: 5px; text-align: center; color: #0f0;">Alternative: Flèches directionnelles</div>
      </div>
      
      <!-- Touches spéciales -->
      <div style="display: flex; justify-content: space-between; margin-top: 10px;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">${upKey}</div>
          <div style="margin-top: 5px; text-align: center; color: #0f0;">Monter</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">${downKey}</div>
          <div style="margin-top: 5px; text-align: center; color: #0f0;">Descendre</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 40px; height: 40px; background: #333; border: 2px solid #0f0; border-radius: 5px; display: flex; justify-content: center; align-items: center;">0</div>
          <div style="margin-top: 5px; text-align: center; color: #0f0;">Arrêt</div>
        </div>
      </div>
      
      <!-- Bouton pour changer de disposition de clavier -->
      <div style="margin-top: 15px; display: flex; justify-content: center;">
        <button id="keyboard-toggle" style="background: #333; border: 2px solid #0f0; color: #0f0; padding: 5px 10px; cursor: pointer; border-radius: 5px;">
          ${isAzerty ? 'Passer en QWERTY' : 'Passer en AZERTY'}
        </button>
      </div>
      
      <!-- Légende des paliers -->
      <div style="margin-top: 15px; border-top: 1px solid #0f0; padding-top: 10px;">
        <div style="color: #0f0; margin-bottom: 5px;">Paliers de vitesse:</div>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <div style="width: 15px; height: 15px; background: #fff; margin-right: 10px;"></div>
          <span>Vitesse actuelle</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 15px; height: 15px; background: #ff7700; margin-right: 10px;"></div>
          <span>Vitesse cible (palier)</span>
        </div>
      </div>
    </div>
  `;
    
    // Ajouter l'événement au bouton de changement de disposition
    setTimeout(() => {
      const keyboardToggle = document.getElementById('keyboard-toggle');
      if (keyboardToggle) {
        keyboardToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          isAzerty = !isAzerty;
          updateKeyboardLayout();
        });
      }
    }, 0);
  }
  
  // Initialiser le contenu
  updateKeyboardLayout();
  
  // Ajouter les éléments au DOM
  document.body.appendChild(helpButton);
  document.body.appendChild(controlsOverlay);
  
  // Événements pour afficher/masquer l'overlay
  helpButton.addEventListener('mouseenter', () => {
    controlsOverlay.style.display = 'block';
    clearTimeout(hideTimeout);
    isMouseOverHelp = true;
    startHideTimer();
  });
  
  helpButton.addEventListener('mouseleave', () => {
    isMouseOverHelp = false;
    // Délai pour permettre de passer la souris sur l'overlay
    setTimeout(() => {
      if (!isMouseOverElement(controlsOverlay)) {
        controlsOverlay.style.display = 'none';
      }
    }, 300);
  });
  
  controlsOverlay.addEventListener('mouseenter', () => {
    controlsOverlay.style.display = 'block';
    clearTimeout(hideTimeout);
    isMouseOverHelp = true;
  });
  
  controlsOverlay.addEventListener('mouseleave', () => {
    isMouseOverHelp = false;
    startHideTimer();
  });
  
  // Fermer le menu si on clique ailleurs sur la page
  document.addEventListener('click', (e) => {
    if (!helpButton.contains(e.target) && !controlsOverlay.contains(e.target)) {
      controlsOverlay.style.display = 'none';
    }
  });
  
  // Fonction pour démarrer le timer de fermeture automatique
  function startHideTimer() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!isMouseOverHelp) {
        controlsOverlay.style.display = 'none';
      }
    }, 2000); // 2 secondes
  }
  
  // Fonction utilitaire pour vérifier si la souris est sur un élément
  function isMouseOverElement(element) {
    const rect = element.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    return (
      mouseX >= rect.left &&
      mouseX <= rect.right &&
      mouseY >= rect.top &&
      mouseY <= rect.bottom
    );
  }
  
  // Retourner une référence pour permettre des mises à jour ultérieures
  return {
    updateControls: (controlsConfig) => {
      // Fonction pour mettre à jour les contrôles si nécessaire
      // controlsConfig pourrait contenir de nouvelles mappings de touches
      updateKeyboardLayout();
    },
    toggleKeyboardLayout: () => {
      isAzerty = !isAzerty;
      updateKeyboardLayout();
    }
  };
}
