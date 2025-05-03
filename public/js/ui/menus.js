// ui/menus.js
// Gestion centralisée des menus overlays (ouverture/fermeture, exclusivité, auto-close, clic extérieur)

let menuTimeout = null;
let menuButtons = [];

/**
 * Initialise la gestion des menus overlays.
 * @param {Array<{btnId: string, panelId: string}>} menuConfig
 */
export function initMenus(menuConfig) {

  menuButtons = menuConfig.map(({btnId, panelId}) => {
    const btn = document.getElementById(btnId);
    const panel = document.getElementById(panelId);
    if (!btn) console.warn(`[UI] Bouton menu manquant: #${btnId}`);
    if (!panel) console.warn(`[UI] Panel menu manquant: #${panelId}`);
    return {btn, panel};
  });

  menuButtons.forEach(({btn, panel}) => {
    if (!btn || !panel) return;
    panel.style.display = 'none';
    btn.addEventListener('click', e => {
      menuButtons.forEach(({panel: p}) => { if (p && p !== panel) p.style.display = 'none'; });
      if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'flex';
        clearTimeout(menuTimeout);
        menuTimeout = setTimeout(() => { panel.style.display = 'none'; }, 10000);
      } else {
        panel.style.display = 'none';
        clearTimeout(menuTimeout);
      }
      e.stopPropagation();
    });
    panel.addEventListener('click', e => { e.stopPropagation(); });
  });
  window.addEventListener('click', () => {
    menuButtons.forEach(({panel}) => { if(panel) panel.style.display = 'none'; });
    clearTimeout(menuTimeout);
  });
}
