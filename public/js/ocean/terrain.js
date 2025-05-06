import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// --- Configuration ---
const TILE_SIZE = 10000; // Size of each terrain tile
const GRID_SIZE = 3;     // Number of tiles per side (e.g., 3x3 grid)
const TILE_SEGMENTS = 50; // Resolution of each tile
const DEPTH = -320;       // Base depth of the ocean floor (200 units deeper than original -120)
const MAX_HEIGHT = 220;   // Max terrain elevation variation (+100 for islands above sea level, +120 for deeper ocean variations)

// --- Texture Paths ---
const COLOR_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_Color.png';
const NORMAL_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_NormalDX.png';
const AO_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_AmbientOcclusion.png';
const DISPLACEMENT_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_Displacement.png';
const ROUGHNESS_MAP_PATH = './textures/Ground054_1K-PNG/Ground054_1K-PNG_Roughness.png';

// Noise parameters (keep consistent with original)
const noiseScales = [
    { scale: 0.005, amplitude: 0.8 },
    { scale: 0.01, amplitude: 0.2 },
    { scale: 0.02, amplitude: 0.05 }
];

// Store tile references
let terrainTiles = [];
let terrainGroup = null;
let lastCameraTileX = null;
let lastCameraTileZ = null;

// --- Helper Function: Calculate Terrain Height ---
// Decoupled height calculation for collision and tile updates
function calculateElevation(worldX, worldZ) {
    let elevation = 0;
    for (const { scale, amplitude } of noiseScales) {
        elevation += (
            Math.sin(worldX * scale) * Math.cos(worldZ * scale) +
            Math.cos(worldX * scale * 0.8) * Math.sin(worldZ * scale * 0.9)
        ) * amplitude * MAX_HEIGHT;
    }
    const random = Math.sin(worldX * 0.02) * Math.cos(worldZ * 0.02) * MAX_HEIGHT * 0.05;
    elevation += random;
    
    // Create more pronounced islands by amplifying positive elevations
    if (elevation > 0) {
        // Create a bias for islands to rise above water
        const islandBias = 100; // Height above sea level for islands
        elevation = elevation * 0.9 + islandBias * Math.pow(elevation / MAX_HEIGHT, 2);
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
    // console.log(`[TERRAIN] Creating ${GRID_SIZE}x${GRID_SIZE} terrain grid with tile size ${TILE_SIZE}`);
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

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const geometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, TILE_SEGMENTS, TILE_SEGMENTS);
            geometry.rotateX(-Math.PI / 2); // Orient plane horizontally

            // Add uv2 attribute for AO map
            geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));

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
    // console.log('[TERRAIN] Terrain grid created and added to scene.');
    return terrainGroup;
}

// --- Update Function: Reposition Tiles ---
export function updateTerrainGrid(camera) {
    if (!terrainGroup || !camera || terrainTiles.length === 0) return;

    const camX = camera.position.x;
    const camZ = camera.position.z;

    // Calculate camera's current tile zone based on world coordinates
    const currentCameraTileX = Math.round(camX / TILE_SIZE);
    const currentCameraTileZ = Math.round(camZ / TILE_SIZE);

    if (currentCameraTileX === lastCameraTileX && currentCameraTileZ === lastCameraTileZ) {
        return; // Camera hasn't moved to a new tile zone
    }
    // console.log(`[TERRAIN UPDATE] Camera moved to tile zone: ${currentCameraTileX}, ${currentCameraTileZ}`);

    const halfGridWorld = GRID_SIZE * TILE_SIZE / 2;

    for (const tile of terrainTiles) {
        // Get tile's world position relative to the group's position
        const tileWorldPos = new THREE.Vector3();
        tile.getWorldPosition(tileWorldPos);

        const dx = tileWorldPos.x - camX;
        const dz = tileWorldPos.z - camZ;

        let needsUpdate = false;
        let newPosX = tile.position.x;
        let newPosZ = tile.position.z;

        // Check if tile needs to wrap around X axis
        if (dx > halfGridWorld + TILE_SIZE / 2) { // Tile is too far right, move it left
            newPosX -= GRID_SIZE * TILE_SIZE;
            needsUpdate = true;
             // console.log(`Tile ${tile.userData.gridX},${tile.userData.gridZ} wrap left`);
        } else if (dx < -halfGridWorld - TILE_SIZE / 2) { // Tile is too far left, move it right
            newPosX += GRID_SIZE * TILE_SIZE;
            needsUpdate = true;
            // console.log(`Tile ${tile.userData.gridX},${tile.userData.gridZ} wrap right`);
        }

        // Check if tile needs to wrap around Z axis
        if (dz > halfGridWorld + TILE_SIZE / 2) { // Tile is too far forward, move it back
            newPosZ -= GRID_SIZE * TILE_SIZE;
            needsUpdate = true;
            // console.log(`Tile ${tile.userData.gridX},${tile.userData.gridZ} wrap back`);
        } else if (dz < -halfGridWorld - TILE_SIZE / 2) { // Tile is too far back, move it forward
            newPosZ += GRID_SIZE * TILE_SIZE;
            needsUpdate = true;
            // console.log(`Tile ${tile.userData.gridX},${tile.userData.gridZ} wrap forward`);
        }

        // Apply position change and recalculate geometry if the tile was moved
        if (needsUpdate) {
            // console.log(`[TERRAIN] Updating tile geometry at [${tile.userData.gridX}, ${tile.userData.gridZ}]`);
            tile.position.set(newPosX, tile.position.y, newPosZ);
            updateTileGeometry(tile);
        }
    }

    lastCameraTileX = currentCameraTileX;
    lastCameraTileZ = currentCameraTileZ;
}

// --- Collision Function ---
export function getTerrainHeightAt(worldX, worldZ) {
    const elevation = calculateElevation(worldX, worldZ);
    return DEPTH + elevation;
}

// --- Deprecated Function (Original createOceanFloor) ---
/*
export function createOceanFloor(scene, options = {}) {
    // ... original code ...
}
*/
