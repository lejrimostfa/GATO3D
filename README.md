# GATO3D

[![Demo en ligne](https://img.shields.io/badge/DEMO-Jouer%20en%20ligne-blue?logo=github)](https://lejrimostfa.github.io/GATO3D/public/)

[![Aperçu vidéo](https://img.youtube.com/vi/ii6EluTBPtY/hqdefault.jpg)](https://youtu.be/ii6EluTBPtY)

*Aperçu vidéo du projet (cliquez sur l'image pour voir sur YouTube)*

---

## 📝 CHANGELOG RÉCENT / DETAILED CHANGELOG

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
- **Submarine Speed**: Slider in bottom panel
- **Time of Day**: Slider at bottom
- **Sunlight Intensity**: Slider at right
- **Visibility Toggles**: Buttons at top-right
- **Minimap Zoom**: + and - buttons on minimap
- **Minimap Rotation**: R button on minimap

## Development Status

✅ **Completed**
- **Submarine Physics System**
  - Realistic submarine movement with momentum and inertia
  - Special braking systems (dive brake, reverse brake) for intuitive control
  - Proper velocity calculation with combined horizontal and vertical movement
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
