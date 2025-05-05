// camera/followCamera.js - Handles camera positioning, following, and damping

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

// Camera following state
const cameraState = {
  _lastRot: 0,
  _rotDelayTimer: 0,
  _rotDampingStart: null,
  _rotDampingDuration: 0,
  _lastXZ: { x: 0, z: 0, rot: 0 },
  damping: 0.001,
  distance: 150,
  altitude: 30
};

// Camera target visualization
let cameraTargetCube = null;

/**
 * Initialize the camera follow system
 * @param {THREE.Scene} scene - The THREE scene object
 * @returns {THREE.Mesh|null} - The target visualization cube
 */
export function initCameraFollow(scene) {
  // Check if scene is valid
  if (!scene) {
    console.warn('[CAMERA] Cannot initialize camera follow system: Scene is null or undefined');
    return null;
  }
  
  try {
    // Create the target cube for debugging (red cube)
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshBasicMaterial({color: 0xff0000});
    cameraTargetCube = new THREE.Mesh(geo, mat);
    scene.add(cameraTargetCube);
    cameraTargetCube.visible = false; // Hidden by default
    
    console.log('[CAMERA] Camera follow system initialized with debug cube');
    return cameraTargetCube;
  } catch (error) {
    console.error('[CAMERA] Error initializing camera follow system:', error);
    return null;
  }
}

/**
 * Set camera follow parameters
 * @param {number} distance - Distance behind the submarine
 * @param {number} damping - Camera movement damping value
 * @param {number} altitude - Camera height above the submarine
 */
export function setCameraFollowParams(distance, damping, altitude) {
  cameraState.distance = distance;
  cameraState.damping = damping;
  cameraState.altitude = altitude;
}

/**
 * Update the follow camera position based on the target
 * @param {THREE.Camera} camera - The camera to update
 * @param {THREE.Object3D} target - The target to follow (submarine)
 * @param {boolean} debugMode - Whether to show the target visualization
 */
export function updateFollowCamera(camera, target, debugMode = false) {
  if (!target || !camera) return;
  
  // Show/hide debug cube
  if (cameraTargetCube) {
    cameraTargetCube.visible = debugMode;
  }
  
  // Get camera parameters
  const camDist = cameraState.distance;
  const damping = cameraState.damping;
  const camAltitude = cameraState.altitude;
  
  // Detect rotation changes
  const rotChanged = Math.abs(cameraState._lastRot - target.rotation.y) > 1e-4;
  if (rotChanged) {
    cameraState._rotDelayTimer = performance.now();
    cameraState._rotDampingStart = null;
    cameraState._lastRot = target.rotation.y;
    cameraState._lastXZ.rot = target.rotation.y;
  }
  
  // Calculate target position behind the submarine
  let targetX = target.position.x + camDist * Math.sin(cameraState._lastXZ.rot);
  let targetZ = target.position.z + camDist * Math.cos(cameraState._lastXZ.rot);
  
  // If rotation delay elapsed, start damping
  if (performance.now() - cameraState._rotDelayTimer > 200 && rotChanged) {
    cameraState._rotDampingStart = performance.now();
    cameraState._rotDampingDuration = 400;
    cameraState._lastXZ.rot = target.rotation.y;
  }
  
  // Interpolate position during rotation
  if (cameraState._rotDampingStart) {
    let t = (performance.now() - cameraState._rotDampingStart) / cameraState._rotDampingDuration;
    if (t >= 1) {
      cameraState._rotDampingStart = null;
      cameraState._lastXZ.rot = target.rotation.y;
      targetX = target.position.x + camDist * Math.sin(target.rotation.y);
      targetZ = target.position.z + camDist * Math.cos(target.rotation.y);
    } else {
      // easeInOutQuad
      t = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      const fromX = target.position.x + camDist * Math.sin(cameraState._lastXZ.rot);
      const fromZ = target.position.z + camDist * Math.cos(cameraState._lastXZ.rot);
      const toX = target.position.x + camDist * Math.sin(target.rotation.y);
      const toZ = target.position.z + camDist * Math.cos(target.rotation.y);
      targetX = fromX + (toX - fromX) * t;
      targetZ = fromZ + (toZ - fromZ) * t;
    }
  } else {
    cameraState._lastXZ.rot = target.rotation.y;
    targetX = target.position.x + camDist * Math.sin(target.rotation.y);
    targetZ = target.position.z + camDist * Math.cos(target.rotation.y);
  }
  
  // Calculate vertical position
  let targetY = target.position.y;
  if (target.children && target.children[0]) {
    targetY += target.children[0].position.y;
  }
  const finalTargetY = targetY + camAltitude;
  
  // Apply camera movement with damping
  camera.position.x += (targetX - camera.position.x) * damping;
  camera.position.z += (targetZ - camera.position.z) * damping;
  camera.position.y += (finalTargetY - camera.position.y) * damping * 2; // Y more responsive
  
  // Look at target
  const lookAtTarget = target.position.clone();
  lookAtTarget.y = targetY;
  camera.lookAt(lookAtTarget);
  
  // Update debug visualization
  if (cameraTargetCube && debugMode) {
    cameraTargetCube.position.copy(lookAtTarget);
  }
}

/**
 * Try to find the submarine in the scene
 * @param {THREE.Scene} scene - The scene to search in
 * @returns {THREE.Object3D|null} - The submarine object if found
 */
export function findSubmarine(scene) {
  if (!scene) return null;
  return scene.children.find(obj => obj.name === 'Pivot' || obj.type === 'Group');
}
