import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// --- Configuration ---
const TILE_SIZE = 12000; // Size of each terrain tile (légèrement augmenté pour couvrir plus d'espace)
const GRID_SIZE = 7;     // Number of tiles per side (e.g., 7x7 grid = 49 tuiles) - MUST BE ODD NUMBER
const TILE_SEGMENTS = 512; // Doubled resolution (512 vs 256) for extremely detailed terrain features
const DEPTH = -400;      // Base depth of the ocean floor (between -200 and -600 as specified)
const MAX_HEIGHT = 500;  // Max terrain elevation variation (allows for deep canyons and tall islands)
const OCEAN_SURFACE = 20; // Y-position of ocean surface (consistent with water plane)
const RENDER_DISTANCE = 3; // Distance de rendu (en nombre de tuiles depuis le centre)

// --- Texture Paths ---
const COLOR_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_Color.png';
const NORMAL_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_NormalDX.png';
const AO_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_AmbientOcclusion.png';
const DISPLACEMENT_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_Displacement.png';
const ROUGHNESS_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_Roughness.png';

// Noise parameters for dramatic underwater terrain and islands
const noiseScales = [
    // Large-scale terrain features (increased amplitude for deeper valleys/higher mountains)
    { scale: 0.002, amplitude: 0.8 },  // Very large features (continental shelf)
    { scale: 0.004, amplitude: 0.5 },  // Large features (ocean basins)
    
    // Medium-scale terrain features (for valleys and ridges)
    { scale: 0.008, amplitude: 0.3 },  // Medium features (underwater ridges)
    { scale: 0.015, amplitude: 0.2 },  // Medium-small features (canyons)
    
    // Fine detail layers
    { scale: 0.03, amplitude: 0.1 },   // Small details (rocky outcrops)
    { scale: 0.06, amplitude: 0.05 },  // Micro details (seafloor texture)
    
    // Island-specific noise layer with custom frequency
    { scale: 0.001, amplitude: 0.7, islandFactor: true } // Island placement layer
];

// Store tile references
let terrainTiles = [];
let terrainGroup = null;
let lastCameraTileX = null;
let lastCameraTileZ = null;

// Variables pour le suivi de la position du joueur
let lastCameraGridX = null;
let lastCameraGridZ = null;
let tilePositions = []; // Positions des tuiles dans la grille globale

// Configuration des seuils de mise à jour
const UPDATE_THRESHOLD = TILE_SIZE * 0.4; // Seuil de déplacement pour déclencher une mise à jour

// --- Helper Function: Calculate Terrain Height ---
// Decoupled height calculation for collision and tile updates
function calculateElevation(worldX, worldZ) {
    let elevation = 0;
    let islandPotential = 0;
    
    // Apply multiple noise layers for varied terrain
    for (const { scale, amplitude, islandFactor } of noiseScales) {
        // Calculate basic noise component
        const noiseComponent = (
            Math.sin(worldX * scale) * Math.cos(worldZ * scale) +
            Math.cos(worldX * scale * 0.8) * Math.sin(worldZ * scale * 0.9)
        ) * amplitude * MAX_HEIGHT;
        
        // Special handling for island factor layer
        if (islandFactor) {
            islandPotential = noiseComponent;
        } else {
            elevation += noiseComponent;
        }
    }
    
    // Apply canyon-forming algorithm (exponential shaping based on absolute height)
    // This creates sharper valleys where elevation is already low
    if (elevation < 0) {
        // Make deeper areas even deeper (canyons) by applying a curve
        const normalizedDepth = Math.abs(elevation) / MAX_HEIGHT;
        const canyonFactor = Math.pow(normalizedDepth, 1.5); // Exponential curve for canyon depth
        elevation = elevation * (1 + canyonFactor * 0.5); // Amplify existing depth in already-deep areas
    }
    
    // Island generation - creates scattered islands where islandPotential is strongly positive
    const islandThreshold = 0.65 * MAX_HEIGHT; // Threshold for island formation
    if (islandPotential > islandThreshold) {
        // Calculate how much this exceeds the threshold (0-1 scale)
        const excessFactor = (islandPotential - islandThreshold) / (MAX_HEIGHT - islandThreshold);
        
        // Add an island height component (up to 100 units above surface at maximum)
        const islandHeight = 100 * Math.pow(excessFactor, 2); // Quadratic curve for smoother island peaks
        
        // Add the island component to the elevation
        elevation = OCEAN_SURFACE + islandHeight; // Place above water level
    } 
    // Keep underwater terrain within specified range (-600 to -200)
    else {
        // Normal underwater terrain (scale to desired range)
        elevation = Math.max(-600, Math.min(-200, DEPTH + elevation));
    }
    
    return elevation;
}

// --- Helper Function: Update Tile Geometry ---
function updateTileGeometry(tile) {
    const geometry = tile.geometry;
    const vertices = geometry.attributes.position.array;
    // Use tile's world position directly if it's added to the scene root
    // If added to a group, calculate world position relative to the group
    const tileWorldPos = new THREE.Vector3();
    tile.getWorldPosition(tileWorldPos); // Get world position accurately

    for (let i = 0; i < vertices.length; i += 3) {
        const localX = vertices[i];
        const localZ = vertices[i + 2];

        // Calculate world coordinates for noise based on tile's actual world position
        const worldX = tileWorldPos.x + localX;
        const worldZ = tileWorldPos.z + localZ;

        const elevation = calculateElevation(worldX, worldZ);
        vertices[i + 1] = elevation; // Y component relative to tile's local origin
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
}


// --- Main Function: Create Terrain Grid ---
export function createTerrainGrid(scene) {
    console.log(`[TERRAIN] Creating ${GRID_SIZE}x${GRID_SIZE} terrain grid with tile size ${TILE_SIZE}`);
    terrainGroup = new THREE.Group();
    terrainGroup.position.y = DEPTH; // Set base depth for the whole group
    terrainTiles = []; // Reset tiles array

    const textureLoader = new THREE.TextureLoader();
    const textureRepeat = TILE_SEGMENTS / 8; // Adjust texture repetitions

    // --- Load Textures ---
    const colorTexture = textureLoader.load(COLOR_MAP_PATH);
    colorTexture.wrapS = colorTexture.wrapT = THREE.RepeatWrapping;
    colorTexture.repeat.set(textureRepeat, textureRepeat);

    const normalTexture = textureLoader.load(NORMAL_MAP_PATH);
    normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(textureRepeat, textureRepeat);

    const aoTexture = textureLoader.load(AO_MAP_PATH);
    aoTexture.wrapS = aoTexture.wrapT = THREE.RepeatWrapping;
    aoTexture.repeat.set(textureRepeat, textureRepeat);

    const displacementTexture = textureLoader.load(DISPLACEMENT_MAP_PATH);
    displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping;
    displacementTexture.repeat.set(textureRepeat, textureRepeat);

    const roughnessTexture = textureLoader.load(ROUGHNESS_MAP_PATH);
    roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;
    roughnessTexture.repeat.set(textureRepeat, textureRepeat);

    // --- Create Shared Material --- 
    const material = new THREE.MeshStandardMaterial({
        map: colorTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.8, 0.8), // Adjust normal map intensity
        aoMap: aoTexture,
        aoMapIntensity: 0.7, // Adjust AO intensity
        displacementMap: displacementTexture,
        displacementScale: 20.0, // Adjust displacement scale
        displacementBias: -10.0, // Adjust displacement bias
        roughnessMap: roughnessTexture,
        roughness: 0.8,       // Base roughness
        metalness: 0.1,       // Slightly metallic look
        side: THREE.FrontSide // Render front side only
    });

    const halfGrid = Math.floor(GRID_SIZE / 2);

    // Optimisation: Adapter la résolution des tuiles en fonction de leur distance
    function createTileWithOptimizedResolution(i, j) {
        // Calculate distance from center in grid units
        const distanceFromCenter = Math.sqrt(
            Math.pow(i - Math.floor(GRID_SIZE/2), 2) + 
            Math.pow(j - Math.floor(GRID_SIZE/2), 2)
        );
        
        // Improved progressive LOD system with more resolution tiers
        // Uses quadratic falloff for more gradual quality reduction at distance
        let segments = TILE_SEGMENTS;
        
        if (distanceFromCenter <= 1) {
            // Full resolution for nearby tiles
            segments = TILE_SEGMENTS;
        } else if (distanceFromCenter <= 2) {
            // 75% resolution for medium distance
            segments = Math.floor(TILE_SEGMENTS * 0.75);
        } else if (distanceFromCenter <= 3) {
            // 50% resolution for farther tiles
            segments = Math.floor(TILE_SEGMENTS * 0.5);
        } else {
            // Minimum 25% resolution for distant tiles
            segments = Math.max(Math.floor(TILE_SEGMENTS * 0.25), 128);
        }
        
        // Create a terrain tile geometry with optimized resolution
        const geometry = new THREE.PlaneGeometry(
            TILE_SIZE, 
            TILE_SIZE, 
            segments, 
            segments
        );
        
        geometry.rotateX(-Math.PI / 2); // Orient plane horizontally
        
        // Add uv2 attribute for AO map
        geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));
        
        return geometry;
    };

    // Créer toutes les tuiles
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const geometry = createTileWithOptimizedResolution(i, j);

            const tile = new THREE.Mesh(geometry, material);
            tile.receiveShadow = true;
            tile.castShadow = false; // Terrain usually receives, doesn't cast

            // Calculate tile position relative to the group center
            const tileX = (i - halfGrid) * TILE_SIZE;
            const tileZ = (j - halfGrid) * TILE_SIZE;
            tile.position.set(tileX, 0, tileZ); // Y is relative to the group's depth

            // Store grid indices
            tile.userData.gridX = i;
            tile.userData.gridZ = j;

            terrainGroup.add(tile);
            terrainTiles.push(tile);
            
            // Initial geometry update *after* adding tile to group to get world position
            updateTileGeometry(tile);
        }
    }

    terrainGroup.name = 'terrain'; // Assign name for identification
    scene.add(terrainGroup);
    console.log(`[TERRAIN] Terrain grid created with ${terrainTiles.length} tiles (${GRID_SIZE}x${GRID_SIZE})`);
    return terrainGroup;
}

// --- Update Function: Reposition Tiles ---
export function updateTerrainGrid(camera, playerSubmarine = null) {
    if (!terrainGroup || !camera || terrainTiles.length === 0) return;

    // Obtenir la position de la caméra
    const camX = camera.position.x;
    const camZ = camera.position.z;
    
    // Calculer la position de la tuile actuelle en coordonnées de grille
    const cameraGridX = Math.floor(camX / TILE_SIZE);
    const cameraGridZ = Math.floor(camZ / TILE_SIZE);
    
    // Si la position est la même qu'avant, aucune mise à jour n'est nécessaire
    if (cameraGridX === lastCameraGridX && cameraGridZ === lastCameraGridZ) {
        return;
    }
    
    // Initialiser les positions de tuiles si c'est la première fois
    if (tilePositions.length === 0) {
        // Initialiser le tableau de positions pour chaque tuile
        for (let i = 0; i < terrainTiles.length; i++) {
            tilePositions.push({ 
                x: cameraGridX + (i % GRID_SIZE) - Math.floor(GRID_SIZE / 2), 
                z: cameraGridZ + Math.floor(i / GRID_SIZE) - Math.floor(GRID_SIZE / 2) 
            });
        }
    }
    
    // Calculer le déplacement de la caméra depuis la dernière mise à jour
    const deltaX = cameraGridX - lastCameraGridX;
    const deltaZ = cameraGridZ - lastCameraGridZ;
    
    // Mettre à jour les positions de la grille seulement si la caméra s'est déplacée
    if (lastCameraGridX !== null && lastCameraGridZ !== null) {
        // Identifier les tuiles qui doivent être déplacées (celles qui sont maintenant trop loin)
        // Utilisation d'un algorithme déterministe pour garantir la cohérence
        
        // Pour chaque tuile, vérifier si elle doit être déplacée
        for (let i = 0; i < terrainTiles.length; i++) {
            const tilePos = tilePositions[i];
            
            // Calculer la distance en tuiles entre cette tuile et la caméra
            const distX = tilePos.x - cameraGridX;
            const distZ = tilePos.z - cameraGridZ;
            const halfGrid = Math.floor(GRID_SIZE / 2);
            
            // Si la tuile est trop loin dans l'axe X, la déplacer
            if (distX > halfGrid) {
                tilePos.x -= GRID_SIZE;
            } else if (distX < -halfGrid) {
                tilePos.x += GRID_SIZE;
            }
            
            // Si la tuile est trop loin dans l'axe Z, la déplacer
            if (distZ > halfGrid) {
                tilePos.z -= GRID_SIZE;
            } else if (distZ < -halfGrid) {
                tilePos.z += GRID_SIZE;
            }
            
            // Mettre à jour la position de la tuile dans le monde 3D
            terrainTiles[i].position.x = tilePos.x * TILE_SIZE;
            terrainTiles[i].position.z = tilePos.z * TILE_SIZE;
            
            // Mettre à jour la géométrie de la tuile à sa nouvelle position
            updateTileGeometry(terrainTiles[i]);
        }
    }

    // Mettre à jour les références pour la prochaine fois
    lastCameraGridX = cameraGridX;
    lastCameraGridZ = cameraGridZ;
    
    // Log pour debug
    // console.log(`[TERRAIN] Camera at tile (${cameraGridX}, ${cameraGridZ}) - ${terrainTiles.length} tiles actives`);
    
    // Aucun code à ajouter ici - tout est déjà géré dans la partie précédente
    // Cette ligne est intentionnellement vide pour maintenir la structure du fichier
    // et éviter les erreurs.
}

// --- Collision Function ---
export function getTerrainHeightAt(worldX, worldZ) {
    const elevation = calculateElevation(worldX, worldZ);
    return DEPTH + elevation;
}

// --- Helper function to get the submarine direction ---
// Cette fonction est utilisée par main.js pour fournir la direction du sous-marin
export function updateTerrainWithSubmarine(camera, submarine) {
    // Appeler updateTerrainGrid avec le sous-marin en paramètre
    // La direction du sous-marin n'est plus nécessaire dans l'algorithme simplifié
    updateTerrainGrid(camera, submarine);
}

// --- Deprecated Function (Original createOceanFloor) ---
/*
export function createOceanFloor(scene, options = {}) {
    // ... original code ...
}
*/
