# GATO3D

[![Demo en ligne](https://img.shields.io/badge/DEMO-Jouer%20en%20ligne-blue?logo=github)](https://lejrimostfa.github.io/GATO3D/public/)

[![Aperçu vidéo](https://img.youtube.com/vi/ii6EluTBPtY/hqdefault.jpg)](https://youtu.be/ii6EluTBPtY)

*Aperçu vidéo du projet (cliquez sur l'image pour voir sur YouTube)*

---

## 📝 CHANGELOG RÉCENT / DETAILED CHANGELOG

### [2025-05-05] Submarine Speed Control & Help System
- **Stepped Speed Control (Palier)**
  - Implemented a stepped speed control system that allows for precise speed adjustments
  - Added key controls for incrementing/decrementing target speed (Z/↑ and S/↓)
  - Added "0" key to set target speed to zero (gradual stop with inertia)
  - Submarine now accelerates/decelerates smoothly toward the target speed
- **Enhanced Speedometer**
  - Added a second orange needle to show target speed (palier)
  - Improved speed display with real-time updates in knots
  - Visual distinction between current speed (white) and target speed (orange)
- **Help System**
  - Added a "?" button in the top-left corner showing keyboard controls on hover
  - Interactive layout toggle between AZERTY and QWERTY keyboard layouts
  - Auto-hiding after 2 seconds or when clicking elsewhere
- **Improved Submarine Handling**
  - Enhanced turning capability at high speeds for better control
  - Reduced speed-based turning resistance for more responsive steering
  - More gradual deceleration when stopping for realistic inertia

### [2025-05-05] Day/Night Cycle Improvements
- **Realistic Sun Path**
  - Sun now follows a natural East-West trajectory
  - Sunrise at 6:00 AM and sunset at 6:00 PM
  - Smooth elevation arc from horizon to zenith
- **Smooth Star Transition**
  - Star sky fades in/out over one hour (5:00-6:00 AM/PM)
  - Progressive opacity change for natural transitions
  - Smooth color gradient from day to night
- **Camera and Sky Synchronization**
  - Sky spheres follow camera position for infinite effect
  - Proper distance management for visibility
  - Real-time sky updates with camera movement

### [2025-05-05] Terrain & Water Surface Improvements
- **Terrain Generation**
  - Implemented a large-scale ocean floor matching the water surface dimensions
  - Added realistic terrain generation with multiple noise layers
  - Terrain now acts as a solid obstacle for the submarine
- **Water Surface Visibility**
  - Fixed water surface visibility from below using THREE.DoubleSide material
  - Added proper collision detection between submarine and terrain
  - Terrain now has a realistic texture and smoother relief
- **Collision System**
  - Added robust collision detection system for the submarine
  - Submarine cannot pass through the ocean floor
  - Added visual feedback when colliding with terrain

### [2025-05-05] Submarine Control UI Overhaul & Settings Panels
- **Unified Top Bar UI**
  - All menu buttons are now organized into a single top bar, positioned at the top right for easy access.
  - Consistent button styling: uniform size, spacing, color, and hover effects for a modern look.
- **Panel Improvements**
  - Menu panels now open directly below their corresponding buttons and never overflow the screen.
  - Each panel is clearly labeled and organized for intuitive navigation.
- **Dedicated Submarine Settings Panel**
  - Submarine-specific controls (speed, rotation, mass) are grouped in a dedicated panel with clear titles.
  - Sliders update submarine physics in real-time for immediate feedback.
- **Visibility, Wave, and Camera Panels**
  - Added a visibility panel to manage scene object visibility.
  - Integrated wave and camera settings into their own panels with appropriate controls.
- **General UI/UX Enhancements**
  - Improved overall consistency, responsiveness, and accessibility for all controls and panels.

### [2025-05-04] Submarine Physics & Velocity Improvements
- **Submarine Speed Controls**
  - Fixed velocity behavior when changing direction (forward to backward or vice versa)
  - Added special "dive brake" system - pressing down (W) at high speed now properly decelerates
  - Implemented "reverse brake" for pressing backward (S) at high speeds
  - Set default maximum submarine speed to 10 knots (previously 130 knots)
- **Minimap Zoom Controls**
  - Enhanced flexibility with dynamic zoom step based on current zoom level
  - Changed minimum zoom level to 250 and maximum to 15,000 for better usability
- **Speedometer**
  - Improved to accurately show combined velocity from both horizontal and vertical movement
  - Fixed velocity reporting for vertical movement

### [2025-05-03] UI/UX & Minimap Improvements
- **Minimap**
  - Correction : la minimap s’initialise correctement au lancement du jeu (plus besoin de resize)
  - Responsive et taille dynamique dès le chargement
  - Boutons (+, -, rotation) groupés, accessibles et responsives
- **Horloge**
  - Agrandissement du canvas horloge pour une meilleure visibilité
  - Affichage toujours lisible, responsive
- **Panels de menu**
  - Exclusivité : un seul panel ouvert à la fois (fermeture auto des autres)
  - Les panels s’ouvrent à gauche des boutons (plus d’overlap)
- **Robustesse UI**
  - Correction de bugs d’initialisation, accès DOM, et synchronisation
  - Refactoring et nettoyage du code d’initialisation UI

### [2025-05-03] Refactoring & Modularisation Lumière
- **Centralisation complète de la gestion des lumières et de l'atmosphère** dans `public/js/lighting.js`
- Suppression du code dupliqué : tous les scripts utilisent désormais le module unique pour créer, modifier et piloter la lumière, le ciel et l'atmosphère
- Nettoyage de `main.js`, `water-setup.js`, `ui/settings.js` : plus de gestion locale de la lumière
- Correction de l'import dynamique dans `settings.js` (ES6 only)
- Par défaut : intensité du soleil (DirectionalLight) à 2

---

## 🐛 PROBLEMES CONNUS ET SOLUTIONS

### 🌊 Problème de l'eau grise sur GitHub Pages

**Symptôme :**
L'eau apparaît comme une surface grise sur GitHub Pages mais fonctionne correctement en localhost.

**Cause :**
Le problème est lié au chargement des textures de l'eau. GitHub Pages applique des restrictions strictes sur les chemins d'accès aux ressources, ce qui peut empêcher le chargement correct des textures.

**Solution :**
1. Assurez-vous que la texture `waternormals.jpg` est présente dans le dossier `/public/textures/`
2. Utilisez un système de chargement de texture robuste qui essaie plusieurs chemins :
   - Chemin relatif depuis le dossier du projet
   - Chemin absolu depuis la racine du site
   - URL externe de secours (Three.js CDN)

**Code de référence :**
```javascript
// Dans water-setup.js
const texturePaths = [
    './textures/waternormals.jpg',           // Chemin relatif (préféré)
    '../textures/waternormals.jpg',          // Autre chemin relatif possible
    '/textures/waternormals.jpg',            // Chemin absolu depuis la racine
    'https://threejs.org/examples/textures/waternormals.jpg' // Fallback externe
];

function tryLoadTexture(paths, index = 0) {
    if (index >= paths.length) {
        console.error('❌ Tous les chemins de texture ont échoué!');
        return new THREE.Texture();
    }
    
    console.log(`[WATER] Tentative de chargement de la texture: ${paths[index]}`);
    
    return new THREE.TextureLoader().load(
        paths[index],
        tex => {
            console.log(`✅ Texture d'eau chargée avec succès depuis: ${paths[index]}`);
            // Configuration de la texture
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(20, 20);
            tex.flipY = false;
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        },
        undefined,
        err => tryLoadTexture(paths, index + 1)
    );
}
```

**Prévention :**
1. Toujours vérifier que les textures sont présentes dans le dépôt
2. Utiliser des chemins relatifs plutôt que des chemins absolus
3. Ajouter des messages de débogage pour faciliter le diagnostic

---

## 🚀 PLAN DE CONTINUATION / NEXT DEVELOPMENT PLAN

- **Modularisation à terminer**
  - Migration des sliders Rayleigh, Turbidity, Mie, etc. vers `lighting.js` (actuellement partiellement dans `settings.js`)
  - Extraction finale de tout contrôle lumière/atmosphère dans le module central
  - Gestion centralisée des entrées clavier/souris
  - Modularisation complète des panneaux UI
- **UI/UX & Accessibilité**
  - Amélioration responsive sur tous les panels et boutons
  - Accessibilité (navigation clavier, ARIA, contrastes)
  - Polish visuel : icônes, feedback, animations légères
- **Tests & Robustesse**
  - Tests unitaires sur modules critiques (minimap, panels, sliders, lighting)
  - Validation multi-plateforme (desktop/mobile)
- **Gameplay & Logic**
  - Ajout de la logique de jeu (objectifs, scoring, etc.)
  - Synchronisation UI ↔ gameplay
- **Multijoueur**
  - Intégration WebRTC (étape 2)
  - Synchronisation d’état et interpolation client
- **Documentation**
  - Mise à jour continue du README et des commentaires code
  - Tutoriels d’utilisation et guides contributeurs

---

GATO3D est un prototype de jeu 3D sous-marin interactif en JavaScript (Three.js).

GATO3D is an interactive 3D submarine game prototype written in JavaScript (Three.js).

---

## Fonctionnalités principales / Main Features
- Contrôle d'un sous-marin dans un environnement 3D avec physique réaliste
- Système avancé de contrôle de vitesse avec freins de plongée et marche arrière
- Interface utilisateur (UI) réactive : profondeur, minimap, horloge, compteur de vitesse
- Minimap avec contrôles de zoom dynamiques adaptés au niveau de zoom actuel
- Cycle jour/nuit dynamique avec position du soleil ajustable
- Synchronisation UI ↔ gameplay (slider de vitesse, profondeur, horloge, etc.)

- Control a submarine in a 3D environment with realistic physics
- Advanced velocity control system with dive brakes and reverse braking
- Responsive UI: depth indicator, minimap, clock, speedometer
- Minimap with dynamic zoom controls that adapt to current zoom level
- Dynamic day/night cycle with adjustable sun position
- UI ↔ gameplay synchronization (speed slider, depth, clock, etc.)

---

## Installation
1. Clonez ce dépôt
2. Ouvrez le dossier `public/` dans un serveur local (ex : `npx serve public/` ou extension Live Server)

## Installation
1. Clone this repository
2. Open the `public/` folder in a local server (e.g. `npx serve public/` or using Live Server extension)

---

## Utilisation / Usage
- Les commandes du sous-marin et de la caméra sont accessibles via l'UI et le clavier.
- Le cycle du soleil est décalé de -3h et l'horloge effectue 2 tours pour 24h.

- Submarine and camera controls are accessible via the UI and keyboard.
- The sun's cycle is shifted by -3h and the clock makes 2 revolutions for 24h.

---

## Dépendances / Dependencies
- [Three.js](https://threejs.org/)

---

## Licence / License
Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus d'informations.

This project is licensed under the MIT License. See the LICENSE file for details.
 - Multiplayer Submarine Game

A 3D multiplayer submarine game built with Three.js, WebRTC, and Node.js.

## Project Structure

```
GATO3D/
├── public/              # Frontend assets
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   ├── models/         # 3D models
│   ├── shaders/        # Custom shaders
│   └── textures/       # Image textures
├── server.js           # Main server file
└── package.json        # Project dependencies
```

## Features

- Real-time 3D submarine simulation
- Day-night cycle with dynamic lighting
- Multiplayer support using WebRTC
- Interactive UI controls
- Submarine movement controls (ZQSD/Arrows)
- Environment effects (water, sky, sun)

## Development Phases

### Phase 1 - Solo Game

- Visual & Lighting Improvements
- Submarine UI Panel (MCP)
- Basic Game Logic
- Camera Improvements

### Phase 2 - Multiplayer

- Networking Base (WebRTC)
- State Synchronization
- Client-side Interpolation

### Optional Features

- Developer Tools
- UI Enhancements
- DevOps Setup

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Controls

### Submarine Movement
- **Forward**: Z or Up Arrow
- **Backward/Brake**: S or Down Arrow (also acts as brake at high speeds)
- **Turn Left**: Q or Left Arrow
- **Turn Right**: D or Right Arrow
- **Ascend**: A (move submarine upward)
- **Descend/Brake**: W (also acts as dive brake at high speeds)

### UI Controls

#### Minimap Controls
- **Zoom In**: Click the **+** button on the minimap
- **Zoom Out**: Click the **-** button on the minimap
- **Rotate/Compass**: Click the compass (🧭/🔄) button to toggle minimap rotation (auto-rotate/fixed north)

#### UI/Overlay Behavior
- The game UI is now fully modular and will only appear after the title overlay is dismissed.
- All minimap controls are now robust and should work regardless of load order.

#### Developer Notes
- The UI and minimap system have been refactored for modularity:
  - UI logic is split into `/public/js/ui/components/`, `/public/js/ui/controls/`, `/public/js/ui/minimap/`
  - Minimap controls communicate via custom DOM events (`minimap-zoom-change`, `minimap-rotation-change`)
  - The compass is always visible and rotates with the submarine if auto-rotate is enabled.
- If you encounter UI issues, check the browser console for `[UI:Minimap]` or `[UI:Visibility]` logs for diagnostics.

- **Unified Top Bar**: All menu buttons (game settings, submarine settings, visibility, light, wave, camera) are now in a single top bar at the top right.
- **Submarine Settings**: Speed, rotation, and mass sliders in a dedicated submarine panel (opens below the submarine button in the top bar).
- **Visibility Panel**: Manage visibility of scene objects via the top bar.
- **Wave & Camera Panels**: Access wave and camera settings from their dedicated top bar buttons.
- **Consistent Button Styling**: All buttons have uniform appearance and responsive hover feedback.
- **Panel Positioning**: All panels open directly under their respective buttons and are clearly labeled.
- **Minimap Zoom**: + and - buttons on minimap
- **Minimap Rotation**: R button on minimap

## IMPORTANT NOTES

### UI Component Initialization and Event Connection

#### Camera Controls Implementation
We've implemented a modular camera control system with the following features:
- Distance control (50-500 units)
- Altitude/height control (10-200 units)
- Smoothness/damping control (0.001-0.05)

#### Diagnosed Issues
When implementing new UI controls (sliders, buttons), we identified the following critical issues:

1. **DOM Element References**: Using cached element references via a central element registry can be problematic if elements are dynamically added, removed, or replaced during runtime. This affected camera controls when UI was reinitialized.

2. **Event Listener Connection**: The application has two separate systems for connecting UI controls:
   - The `sliderConnector.js` module (which is called manually and not automatically on startup)
   - The module-specific initialization functions (like `initCameraSliders()` in `cameraControls.js`)

3. **Function Parameter Order**: Inconsistent parameter order in key functions like `setCameraFollowParams()` caused confusion. Some places expected (distance, damping, height) while others used (distance, height, smoothness).

#### Implementation Solution
To address these issues, we:

1. **Direct DOM Queries**: Modified control handlers to directly query DOM elements by ID at each update, making them more resilient to DOM changes:
   ```javascript
   // Instead of using cached references
   const distanceSlider = document.getElementById('camera-distance-slider');
   ```

2. **Standardized Parameter Order**: Ensured consistent parameter ordering across all camera control functions.

3. **Added Validation and Fallbacks**: All control functions now check for missing elements and apply sensible defaults when needed.

4. **Improved Logging**: Added detailed console logging to track UI control state changes.

#### Developer Guidelines
When adding new UI controls:

1. Always connect your controls in **both** the relevant module (e.g., `cameraControls.js`) AND in `sliderConnector.js` for redundancy
2. Use direct DOM queries for more resilient event handling
3. Add fallback logic for missing elements
4. Follow consistent parameter order in related function calls
5. Provide detailed console logs for debugging

## Development Status

✅ **Completed**
- **Unified Top Bar for Menu Buttons**
  - All menu controls are now grouped in a single top bar with consistent styling and placement.
- **Panel System Overhaul**
  - Panels open under their respective buttons, are clearly labeled, and never overflow the screen.
- **Submarine Settings Panel**
  - Dedicated panel for submarine controls (speed, rotation, mass) with real-time feedback.
- **Visibility, Wave, and Camera Panels**
  - Dedicated panels for visibility, wave, and camera settings, accessible from the top bar.
- **Consistent Button & Panel Styling**
  - Uniform appearance, spacing, and hover effects across all UI controls.
- **Submarine Physics System**
  - Realistic submarine movement with momentum and inertia
  - Special braking systems (dive brake, reverse brake) for intuitive control
  - Proper velocity calculation with combined horizontal and vertical movement
  - Stepped speed control (palier) with visual feedback on speedometer
  - Improved turning mechanics at high speeds
  - Realistic maximum speed (10 knots) with adjustable slider
- **Minimap & UI Improvements**
  - Dynamic zoom controls based on current zoom level
  - Enhanced minimap visibility and usability
  - Accurate speedometer that accounts for all movement directions
- Modularisation complète du code JS (minimap, horloge, HUD, panels, **lumière/atmosphère**)
- Centralisation de la gestion lumière/atmosphère dans `lighting.js`
- UI réactive et responsive (minimap, horloge, boutons, panels)
- Panels de menu exclusifs et ergonomiques
- Correction des bugs d'initialisation UI/minimap
- Base serveur Node.js opérationnelle
- Contrôles sous-marin (ZQSD/Flèches)
- Cycle jour/nuit dynamique

🚧 **En cours**
- Migration des sliders Rayleigh, Turbidity, Mie, etc. vers `lighting.js`
- Polish UI/UX (feedback, accessibilité, animations)
- Refactoring & documentation continue

🔜 **Next Steps**
- Ajout logique gameplay (objectifs, scoring)
- Tests unitaires et validation multi-plateforme
- Intégration multijoueur (WebRTC)
- Tutoriels et guides contributeurs

## License

ISC License
