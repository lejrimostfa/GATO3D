# GATO3D

[![Aperçu vidéo](https://img.youtube.com/vi/ii6EluTBPtY/hqdefault.jpg)](https://youtu.be/ii6EluTBPtY)

*Aperçu vidéo du projet (cliquez sur l'image pour voir sur YouTube)*

---

## 📝 CHANGELOG RÉCENT / DETAILED CHANGELOG

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
- Contrôle d'un sous-marin dans un environnement 3D
- Interface utilisateur (UI) réactive : profondeur, minimap, horloge
- Cycle jour/nuit dynamique avec position du soleil ajustable
- Synchronisation UI ↔ gameplay (slider de profondeur, horloge, etc.)

- Control a submarine in a 3D environment
- Responsive UI: depth, minimap, clock
- Dynamic day/night cycle with adjustable sun position
- UI ↔ gameplay synchronization (depth slider, clock, etc.)

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

- Movement: ZQSD or Arrow Keys
- Time of Day: Slider at bottom
- Sunlight Intensity: Slider at right
- Visibility Toggles: Buttons at top-right

## Development Status

✅ **Completed**
- Modularisation complète du code JS (minimap, horloge, HUD, panels, **lumière/atmosphère**)
- Centralisation de la gestion lumière/atmosphère dans `lighting.js`
- UI réactive et responsive (minimap, horloge, boutons, panels)
- Panels de menu exclusifs et ergonomiques
- Correction des bugs d’initialisation UI/minimap
- Base serveur Node.js opérationnelle
- Contrôles sous-marin (ZQSD/Flèches)
- Cycle jour/nuit dynamique

🚧 **En cours**
- Migration des sliders Rayleigh, Turbidity, etc. vers `lighting.js`
- Polish UI/UX (feedback, accessibilité, animations)
- Refactoring & documentation continue

🔜 **Next Steps**
- Ajout logique gameplay (objectifs, scoring)
- Tests unitaires et validation multi-plateforme
- Intégration multijoueur (WebRTC)
- Tutoriels et guides contributeurs

## License

ISC License
