// ocean/terrain.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

export function createOceanFloor(scene, options = {}) {
    const {
        size = 50000, // Même taille que l'eau
        segments = 250, // Même résolution que l'eau
        depth = -100, // Profondeur fixe comme demandé
        maxHeight = 150 // Augmenté pour plus de relief
    } = options;
    
    // Chemin vers la texture du fond marin
    const SEAFLOOR_TEXTURE_PATH = './textures/terrain/seafloor.jpg';

    console.log('[TERRAIN] Creating ocean floor...');

    console.log('[TERRAIN] Creating geometry...');
    // Créer une géométrie plane pour le fond (inversé width/height pour la bonne orientation)
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2); // Rotation pour rendre le plan horizontal
    
    // Générer un terrain 3D avec plusieurs couches de bruit
    const vertices = geometry.attributes.position.array;
    
    // Paramètres de bruit pour différentes échelles (fréquence réduite pour un terrain plus lisse)
    const scales = [
        { scale: 0.005, amplitude: 1.0 },   // Grandes formations à basse fréquence
        { scale: 0.01, amplitude: 0.3 },    // Collines moyennes moins prononcées
        { scale: 0.02, amplitude: 0.1 }     // Petits détails atténués
    ];
    
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        
        // Combiner plusieurs couches de bruit avec une fréquence réduite
        let elevation = 0;
        for (const { scale, amplitude } of scales) {
            elevation += (
                Math.sin(x * scale) * Math.cos(z * scale) +
                Math.cos(x * scale * 0.8) * Math.sin(z * scale * 0.9)
            ) * amplitude * maxHeight;
        }
        
        // Variations aléatoires plus douces
        const random = Math.sin(x * 0.02) * Math.cos(z * 0.02) * maxHeight * 0.1;
        elevation += random;
        
        // Calculer la distance au centre pour l'atténuation
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const centerFactor = Math.max(0, 1 - distanceFromCenter / (size * 0.3));
        
        // Appliquer l'élévation finale
        vertices[i + 1] = elevation * (1 - centerFactor * 0.5);
    }
    
    // Mettre à jour la géométrie
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Charger la texture du fond marin
    const texture = new THREE.TextureLoader().load(SEAFLOOR_TEXTURE_PATH, (loadedTexture) => {
        console.log('[TERRAIN] Texture loaded successfully');
        // Configurer la texture pour qu'elle se répète
        loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(segments/10, segments/10); // Répétition basée sur le nombre de segments
    }, undefined, (error) => {
        console.error('[TERRAIN] Erreur de chargement de texture:', error);
    });
    
    // Créer un matériau avec texture
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
        flatShading: true // Pour mieux voir le relief
    });
    
    // Créer le mesh
    const oceanFloor = new THREE.Mesh(geometry, material);
    
    // Positionner le fond sous l'eau
    oceanFloor.position.y = depth;
    
    console.log('[TERRAIN] Ocean floor position:', oceanFloor.position);
    console.log('[TERRAIN] Ocean floor rotation:', oceanFloor.rotation);
    
    // Définir les couches de visibilité
    oceanFloor.layers.set(0); // Mettre uniquement sur la couche par défaut
    
    console.log('[TERRAIN] Ocean floor configuration:', {
        position: oceanFloor.position,
        rotation: oceanFloor.rotation,
        layers: oceanFloor.layers,
        geometry: {
            vertices: geometry.attributes.position.count,
            boundingBox: geometry.boundingBox
        }
    });
    
    console.log('[TERRAIN] Adding ocean floor to scene at depth:', depth);
    scene.add(oceanFloor);
    
    // Ajouter une propriété de collision
    oceanFloor.isCollidable = true;
    
    // Créer une boîte englobante pour la détection de collision
    oceanFloor.geometry.computeBoundingBox();
    oceanFloor.boundingBox = oceanFloor.geometry.boundingBox.clone();
    
    // Fonction de test de collision améliorée
    oceanFloor.checkCollision = function(objectPosition) {
        // Si l'objet est sous le niveau du terrain à cette position x,z
        const x = objectPosition.x;
        const z = objectPosition.z;
        const y = objectPosition.y;
        
        // Vérifier que l'objet est dans les limites horizontales du terrain (optimisation)
        const halfSize = size / 2;
        if (Math.abs(x) > halfSize || Math.abs(z) > halfSize) {
            return false; // En dehors des limites du terrain
        }
        
        // Utiliser les mêmes paramètres que la génération du terrain pour la cohérence
        const scales = [
            { scale: 0.005, amplitude: 1.0 },
            { scale: 0.01, amplitude: 0.3 },
            { scale: 0.02, amplitude: 0.1 }
        ];
        
        let elevation = 0;
        for (const { scale, amplitude } of scales) {
            elevation += (
                Math.sin(x * scale) * Math.cos(z * scale) +
                Math.cos(x * scale * 0.8) * Math.sin(z * scale * 0.9)
            ) * amplitude * maxHeight;
        }
        
        const random = Math.sin(x * 0.02) * Math.cos(z * 0.02) * maxHeight * 0.1;
        elevation += random;
        
        // Calculer la distance au centre pour l'atténuation
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const centerFactor = Math.max(0, 1 - distanceFromCenter / (size * 0.3));
        
        // Hauteur finale du terrain à cette position
        const terrainHeight = depth + elevation * (1 - centerFactor * 0.5);
        
        // Marge de collision (pour détecter avant de traverser)
        const collisionMargin = 5;
        const collision = y < terrainHeight + collisionMargin;
        
        // Log de débogage si collision détectée
        if (collision) {
            console.log(`[TERRAIN] Collision détectée - Sous-marin: ${y.toFixed(1)}, Terrain: ${terrainHeight.toFixed(1)}`);
        }
        
        return collision;
    };
    
    console.log('[TERRAIN] Collision detection enabled for ocean floor');
    return oceanFloor;
}
