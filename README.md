# GATO3D

[![Aperçu vidéo](https://img.youtube.com/vi/ii6EluTBPtY/hqdefault.jpg)](https://youtu.be/ii6EluTBPtY)

*Aperçu vidéo du projet (cliquez sur l'image pour voir sur YouTube)*

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

✅ Completed:
- Basic scene setup with Three.js
- Water and sky environment
- Submarine movement
- UI controls
- Base server setup

🔜 Next Steps:
- Visual & Lighting Improvements
- Submarine UI Panel
- Basic Game Logic
- Camera Improvements

## License

ISC License
