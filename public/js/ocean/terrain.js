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
    
    // Paramètres de bruit pour différentes échelles
    const scales = [
        { scale: 0.005, amplitude: 1.0 },   // Grandes formations à basse fréquence
        { scale: 0.01, amplitude: 0.3 },    // Collines moyennes moins prononcées
        { scale: 0.02, amplitude: 0.1 }     // Petits détails atténués
    ];
    
    // Paramètres pour les îles
    const islandCount = 5; // Nombre d'îles
    const islandRadius = size * 0.05; // Rayon des îles
    const islandHeight = 200; // Hauteur maximale des îles
    
    // Positions aléatoires pour les îles
    const islandPositions = [];
    for (let i = 0; i < islandCount; i++) {
        const x = (Math.random() - 0.5) * size;
        const z = (Math.random() - 0.5) * size;
        islandPositions.push({ x, z });
    }
    
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        
        // Combiner plusieurs couches de bruit pour le fond marin
        let elevation = 0;
        for (const { scale, amplitude } of scales) {
            elevation += (
                Math.sin(x * scale) * Math.cos(z * scale) +
                Math.cos(x * scale * 0.8) * Math.sin(z * scale * 0.9)
            ) * amplitude * maxHeight;
        }
        
        // Ajouter les îles
        for (const island of islandPositions) {
            const dx = x - island.x;
            const dz = z - island.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < islandRadius) {
                // Calculer l'élévation de l'île en fonction de la distance
                const islandElevation = Math.max(0, 1 - distance / islandRadius);
                elevation += islandElevation * islandHeight;
            }
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
    
    // Charger toutes les textures nécessaires
    const textureLoader = new THREE.TextureLoader();
    
    // Texture principale de couleur
    const colorTexture = textureLoader.load('./textures/Ground054_1K-PNG/Ground054_1K-PNG_Color.png', 
        // Callback de succès
        (texture) => {
            console.log('Texture de couleur chargée avec succès');
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(segments/2, segments/2); // Augmentation de la répétition pour plus de détails
        },
        // Callback de progression
        (xhr) => {
            console.log('Chargement de la texture: ' + (xhr.loaded / xhr.total * 100) + '%');
        },
        // Callback d'erreur
        (error) => {
            console.error('Erreur lors du chargement de la texture:', error);
        }
    );
    
    // Map de normales (pour les effets 3D)
    const normalTexture = textureLoader.load('./textures/Ground054_1K-PNG/Ground054_1K-PNG_NormalDX.png');
    normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(segments/2, segments/2); // Augmentation de la répétition pour plus de détails
    
    // Map d'occlusion ambiante (pour les ombres)
    const aoTexture = textureLoader.load('./textures/Ground054_1K-PNG/Ground054_1K-PNG_AmbientOcclusion.png');
    aoTexture.wrapS = aoTexture.wrapT = THREE.RepeatWrapping;
    aoTexture.repeat.set(segments/2, segments/2); // Augmentation de la répétition pour plus de détails
    
    // Map de rugosité (pour les effets de lumière)
    const roughnessTexture = textureLoader.load('./textures/Ground054_1K-PNG/Ground054_1K-PNG_Roughness.png');
    roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;
    roughnessTexture.repeat.set(segments/2, segments/2); // Augmentation de la répétition pour plus de détails
    
    // Charger la map de déplacement
    const displacementTexture = textureLoader.load('/textures/Ground054_1K-PNG/Ground054_1K-PNG_Displacement.png');
    displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping;
    displacementTexture.repeat.set(segments/2, segments/2); // Augmentation de la répétition pour plus de détails

    // Créer un matériau avec toutes les textures
    const material = new THREE.MeshStandardMaterial({
        map: colorTexture,                // Texture principale
        normalMap: normalTexture,         // Normal map pour les détails 3D
        normalScale: new THREE.Vector2(1.0, 1.0), // Intensité réduite de la normal map
        aoMap: aoTexture,                 // Occlusion ambiante
        aoMapIntensity: 0.5,             // Intensité réduite de l'occlusion
        displacementMap: displacementTexture, // Déplacement
        displacementScale: 10.0,          // Échelle réduite du déplacement
        displacementBias: -5.0,           // Décalage réduit du déplacement
        roughnessMap: roughnessTexture,   // Rugosité
        roughness: 0.6,                   // Rugosité réduite
        metalness: 0.05,                  // Métallicité réduite
        side: THREE.FrontSide,            // Optimisation du rendu
        flatShading: false
    });

    // Ajouter les coordonnées UV2 pour l'occlusion ambiante
    geometry.setAttribute('uv2', geometry.attributes.uv);

    // Créer une seule lumière directionnelle puissante
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.name = 'submarineShadowLight';
    
    // Positionner la lumière au-dessus
    light.position.set(0, 2000, 0);
    light.target.position.set(0, 0, 0);
    
    // Configurer les ombres
    light.castShadow = true;
    light.shadow.mapSize.width = 8192; // Résolution maximale
    light.shadow.mapSize.height = 8192;
    
    // Paramètres de la caméra d'ombre
    light.shadow.camera.near = 100;
    light.shadow.camera.far = 4000;
    
    // Zone d'ombre très large
    const shadowSize = 3000;
    light.shadow.camera.left = -shadowSize;
    light.shadow.camera.right = shadowSize;
    light.shadow.camera.top = shadowSize;
    light.shadow.camera.bottom = -shadowSize;
    
    // Optimisation des ombres
    light.shadow.bias = -0.0001;
    light.shadow.normalBias = 0.001;
    light.shadow.radius = 1.5;
    
    // Créer un groupe pour la lumière et sa cible
    const lightGroup = new THREE.Group();
    lightGroup.name = 'submarineLightGroup';
    
    // Ajouter la lumière et sa cible au groupe
    lightGroup.add(light);
    lightGroup.add(light.target);
    
    // Ajouter le groupe à la scène
    scene.add(lightGroup);
    
    // Helper pour debug (décommenter pour visualiser)
    // const helper = new THREE.CameraHelper(light.shadow.camera);
    // scene.add(helper);
    
    // Fonction pour mettre à jour la position de la lumière
    function updateShadowLight(submarine) {
        if (!submarine) return;
        
        // Obtenir la position du sous-marin
        const submarinePos = submarine.position;
        
        // Déplacer le groupe pour suivre le sous-marin
        lightGroup.position.set(
            submarinePos.x,
            0,
            submarinePos.z
        );
        
        // Maintenir la lumière directement au-dessus du sous-marin
        light.position.set(0, 2000, 0);
        light.target.position.set(0, 0, 0);
        
        // Mettre à jour la matrice de projection
        light.shadow.camera.updateProjectionMatrix();
    }
    
    // Exporter la fonction de mise à jour
    window.updateShadowLight = updateShadowLight;
    
    // Créer le mesh
    const oceanFloor = new THREE.Mesh(geometry, material);
    
    // Configurer le terrain pour recevoir les ombres
    oceanFloor.receiveShadow = true;
    
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
