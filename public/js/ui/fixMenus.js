// Script pour réparer tous les menus immédiatement
document.addEventListener('DOMContentLoaded', () => {
  console.log('[FixMenus] Applying emergency fix to all menu panels');
  
  // Liste de tous les identifiants de panneaux connus
  const panelIds = [
    'game-settings-panel',
    'submarine-settings-panel',
    'visibility-panel',
    'light-settings-panel',
    'atmosphere-panel',
    'wave-settings-panel',
    'underwater-settings-panel',
    'slider-panel'
  ];
  
  // Appliquer un style CSS direct pour garantir que les menus s'affichent correctement
  const style = document.createElement('style');
  style.textContent = `
    .menu-panel {
      transform: none !important;
      right: 10px !important;
      left: auto !important;
      position: absolute !important;
      z-index: 1000 !important;
      max-height: 80vh !important;
      overflow-y: auto !important;
      display: none;
    }
    
    .menu-panel.visible {
      display: block !important;
    }
  `;
  document.head.appendChild(style);
  
  // Réparer les gestionnaires d'événements pour tous les boutons de menu
  document.querySelectorAll('.menu-button').forEach(button => {
    // Trouver le panneau associé
    const buttonId = button.id;
    const prefix = buttonId.replace('-toggle', '');
    
    // Déterminer l'ID du panneau cible
    let panelId = '';
    if (prefix === 'slider') {
      panelId = 'slider-panel';
    } else if (prefix === 'visibility') {
      panelId = 'visibility-panel';
    } else if (prefix === 'light') {
      panelId = 'light-settings-panel';
    } else if (prefix === 'atmosphere') {
      panelId = 'atmosphere-panel';
    } else {
      panelId = `${prefix}-settings-panel`;
    }
    
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    // Remplacer tous les gestionnaires d'événements existants
    button.replaceWith(button.cloneNode(true));
    const newButton = document.getElementById(buttonId);
    
    // Ajouter le nouveau gestionnaire simple
    newButton.addEventListener('click', () => {
      const isVisible = panel.classList.contains('visible');
      
      // Masquer tous les panneaux
      document.querySelectorAll('.menu-panel').forEach(p => {
        p.classList.remove('visible');
      });
      
      // Afficher ou masquer ce panneau
      if (!isVisible) {
        panel.classList.add('visible');
      }
    });
  });
  
  console.log('[FixMenus] All menu panels repaired');
});
