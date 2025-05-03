// editor.js - Scene d'édition de modèles 3D pour GATO3D
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/GLTFLoader.js';
import { createEditorLevel } from './levels/level_editor.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/controls/OrbitControls.js';

let editorScene, editorCamera, editorRenderer, selectedObject = null;
let modelList = [];
// Position et taille du modèle pour les contrôles caméra
let modelCenter = new THREE.Vector3();
let modelRadius = 1;
let raycaster, mouse;
// Slider value displays et helper de highlight
let transformValueSpans = [], highlightHelper = null;
let uniformCheckbox;
// UI Elements
let editorUI, modelSelect, hierarchyDiv, transformControls, transformTypeSelect, transformInputs;
// Map pour conserver les pivots d'objets
const pivotMap = new WeakMap();
let controls;

export function initEditor() {
  // Setup renderer
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    alert("Canvas #gameCanvas introuvable : la scène 3D ne peut pas être affichée.");
    return;
  }
  editorRenderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  editorRenderer.setClearColor(0x181c24);
  editorRenderer.setSize(window.innerWidth, window.innerHeight);

  // Vérifie si le canvas est masqué ou recouvert
  if (canvas.style.display === 'none' || canvas.offsetParent === null) {
    alert("Le canvas 3D est masqué ou recouvert. L'éditeur ne pourra pas afficher la scène.");
    console.warn('Canvas masqué ou recouvert', canvas);
  }

  // Utilise le level d'édition pour la scène/caméra
  const level = createEditorLevel(editorRenderer);
  controls = new OrbitControls(level.camera, editorRenderer.domElement);
  controls.enableDamping = true;
  controls.enableKeys = true;
  controls.keys = { LEFT:37, UP:38, RIGHT:39, BOTTOM:40 };
  editorScene = level.scene;
  editorCamera = level.camera;

  // Raycaster pour sélection par clic
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, editorCamera);
    if (currentModelRoot) {
      const intersects = raycaster.intersectObject(currentModelRoot, true);
      if (intersects.length > 0) selectObject(intersects[0].object);
    }
  });

  // Focus caméra sur objet sélectionné (touche F)
  window.addEventListener('keydown', e => {
    if (e.key === 'f' || e.key === 'F') {
      if (selectedObject) {
        const box = new THREE.Box3().setFromObject(selectedObject);
        const center = box.getCenter(new THREE.Vector3());
        // Conserver la distance actuelle
        const dir = editorCamera.position.clone().sub(controls.target).normalize();
        const distance = editorCamera.position.distanceTo(controls.target);
        const newPos = center.clone().add(dir.multiplyScalar(distance));
        editorCamera.position.copy(newPos);
        controls.target.copy(center);
        controls.update();
      }
    }
  });

  // UI setup
  createEditorUI();

  // Ajoute un bouton Reset Caméra dans l'UI
  let resetBtn = document.getElementById('editor-reset-cam');
  if (!resetBtn) {
    resetBtn = document.createElement('button');
    resetBtn.id = 'editor-reset-cam';
    resetBtn.textContent = 'Reset caméra';
    resetBtn.style.position = 'absolute';
    resetBtn.style.bottom = '16px';
    resetBtn.style.left = '16px';
    resetBtn.style.zIndex = '99';
    resetBtn.style.background = '#022';
    resetBtn.style.color = '#0ff';
    resetBtn.style.border = '1px solid #0ff';
    resetBtn.style.padding = '7px 18px';
    resetBtn.style.borderRadius = '8px';
    resetBtn.style.fontFamily = 'monospace';
    resetBtn.style.fontSize = '15px';
    resetBtn.onclick = () => {
      if (currentModelRoot) {
        const box = new THREE.Box3().setFromObject(currentModelRoot);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        editorCamera.position.set(center.x, center.y + maxDim * 0.4, center.z + maxDim * 2.2);
        editorCamera.lookAt(center);
      }
    };
    document.body.appendChild(resetBtn);
  }

  // List models
  fetchModelList();

  // Crée la boussole pour orienter la caméra
  createCompassUI();

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    // Flashing highlight pour l’objet sélectionné
    if (highlightHelper) {
      const t = Date.now() * 0.005;
      highlightHelper.visible = Math.sin(t) > 0;
      highlightHelper.update();
    }
    editorRenderer.render(editorScene, editorCamera);
    // Debug : vérifie si le canvas est masqué à chaque frame
    if (canvas.style.display === 'none' || canvas.offsetParent === null) {
      if (!document.getElementById('editor-canvas-alert')) {
        const warn = document.createElement('div');
        warn.id = 'editor-canvas-alert';
        warn.textContent = "Attention : la scène 3D n'est pas visible (canvas masqué ou recouvert).";
        warn.style.position = 'fixed';
        warn.style.top = '10px';
        warn.style.left = '50%';
        warn.style.transform = 'translateX(-50%)';
        warn.style.background = '#a00';
        warn.style.color = '#fff';
        warn.style.padding = '10px 22px';
        warn.style.zIndex = '999';
        warn.style.fontFamily = 'monospace';
        warn.style.borderRadius = '7px';
        document.body.appendChild(warn);
      }
    } else {
      const warn = document.getElementById('editor-canvas-alert');
      if (warn) warn.remove();
    }
  }
  animate();
}

function createEditorUI() {
  if (document.getElementById('editor-ui')) return;
  editorUI = document.createElement('div');
  editorUI.id = 'editor-ui';
  editorUI.style.position = 'fixed';
  editorUI.style.top = '0';
  editorUI.style.left = '0';
  editorUI.style.width = '340px';
  editorUI.style.height = '100vh';
  editorUI.style.background = 'rgba(24,28,36,0.97)';
  editorUI.style.color = '#0ff';
  editorUI.style.fontFamily = 'monospace';
  editorUI.style.zIndex = '50';
  editorUI.style.padding = '18px 12px 40px 12px'; // padding bas pour boutons
  editorUI.style.overflowY = 'auto';
  editorUI.style.boxSizing = 'border-box';
  editorUI.style.maxHeight = '100vh';

  // Model select
  const label = document.createElement('label');
  label.textContent = 'Choisir un modèle :';
  editorUI.appendChild(label);
  modelSelect = document.createElement('select');
  modelSelect.style.width = '100%';
  modelSelect.style.margin = '8px 0 18px 0';
  modelSelect.onchange = () => loadSelectedModel();
  editorUI.appendChild(modelSelect);

  // Hierarchy
  hierarchyDiv = document.createElement('div');
  hierarchyDiv.style.margin = '12px 0';
  hierarchyDiv.style.overflowX = 'auto';
  hierarchyDiv.style.maxWidth = '100%';
  hierarchyDiv.style.fontSize = '13px';
  hierarchyDiv.style.lineHeight = '1.3';
  hierarchyDiv.style.whiteSpace = 'nowrap';
  editorUI.appendChild(hierarchyDiv);

  document.body.appendChild(editorUI);

  // Overlay pour contrôles de transformation
  const transformOverlay = document.createElement('div');
  transformOverlay.id = 'transform-overlay';
  Object.assign(transformOverlay.style, {
    position:'fixed', top:'10px', left:'50%', transform:'translateX(-50%)',
    background:'rgba(24,28,36,0.9)', padding:'8px', borderRadius:'5px',
    display:'flex', flexDirection:'column', gap:'8px',
    zIndex:'60', color:'#0ff', fontFamily:'monospace', width:'200px'
  });
  const typeLabel = document.createElement('span');
  typeLabel.textContent = 'Transform : ';
  typeLabel.style.marginRight = '8px';
  transformOverlay.appendChild(typeLabel);

  transformTypeSelect = document.createElement('select');
  ['translation','rotation','scaling'].forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    transformTypeSelect.appendChild(opt);
  });
  transformTypeSelect.onchange = updateTransformUI;
  transformOverlay.appendChild(transformTypeSelect);

  // Création des sliders et affichage de leur valeur
  transformInputs = [];
  transformValueSpans = [];
  ['X','Y','Z'].forEach(axis => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex'; wrapper.style.alignItems = 'center'; wrapper.style.justifyContent = 'space-between'; wrapper.style.gap = '8px';
    const label = document.createElement('span'); label.textContent = axis; label.style.width = '12px';
    const input = document.createElement('input'); input.type = 'range'; input.min = '-10'; input.max = '10'; input.step = '0.01'; input.style.flex = '1';
    const valueSpan = document.createElement('span'); valueSpan.textContent = '0.000'; valueSpan.style.width = '50px';
    input.oninput = () => { applyTransform(); updateTransformUI(); };
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(valueSpan);
    transformOverlay.appendChild(wrapper);
    transformInputs.push(input);
    transformValueSpans.push(valueSpan);
  });

  // Checkbox uniform : appliquer même valeur sur X/Y/Z
  const uniWrapper = document.createElement('div');
  uniWrapper.style.display = 'flex'; uniWrapper.style.alignItems = 'center'; uniWrapper.style.gap = '4px';
  uniformCheckbox = document.createElement('input'); uniformCheckbox.type = 'checkbox'; uniformCheckbox.id = 'uniform-transform';
  const uniLabel = document.createElement('label'); uniLabel.htmlFor = 'uniform-transform'; uniLabel.textContent = 'Uniform'; uniLabel.style.cursor = 'pointer';
  uniWrapper.appendChild(uniformCheckbox); uniWrapper.appendChild(uniLabel);
  transformOverlay.appendChild(uniWrapper);

  // Bouton Default pour réinitialiser les transformations
  const defaultBtn = document.createElement('button');
  defaultBtn.textContent = 'Default';
  Object.assign(defaultBtn.style, { padding:'4px 8px', marginLeft:'8px', background:'transparent', border:'1px solid #0ff', borderRadius:'4px', color:'#0ff', cursor:'pointer', fontFamily:'monospace' });
  defaultBtn.onclick = () => {
    if (selectedObject) {
      const defPos = selectedObject.userData.defaultPosition.clone();
      const defRot = selectedObject.userData.defaultRotation.clone();
      const defScale = selectedObject.userData.defaultScale.clone();
      selectedObject.position.copy(defPos);
      selectedObject.rotation.copy(defRot);
      selectedObject.scale.copy(defScale);
      updateTransformUI();
    }
  };
  transformOverlay.appendChild(defaultBtn);

  document.body.appendChild(transformOverlay);
}

function fetchModelList() {
  // Pour le prototype, hardcode la liste (sinon il faut serveur ou API)
  modelList = [
    'submarine0/scene.gltf',
    // Ajouter d'autres modèles ici si besoin
  ];
  modelSelect.innerHTML = '';
  modelList.forEach(model => {
    const opt = document.createElement('option');
    opt.value = model;
    opt.textContent = model.split('/')[0];
    modelSelect.appendChild(opt);
  });
  loadSelectedModel();
  // Clean hierarchy
  hierarchyDiv.innerHTML = '';
}

let currentModelRoot = null;
function loadSelectedModel() {
  if (currentModelRoot) {
    editorScene.remove(currentModelRoot);
    currentModelRoot = null;
    hierarchyDiv.innerHTML = '';
  }
  const loader = new GLTFLoader();
  const infoMsg = document.getElementById('editor-info-msg') || (() => {
    const msg = document.createElement('div');
    msg.id = 'editor-info-msg';
    msg.style.color = '#ff0';
    msg.style.margin = '8px 0';
    hierarchyDiv.parentNode.insertBefore(msg, hierarchyDiv);
    return msg;
  })();
  infoMsg.textContent = 'Chargement du modèle...';
  loader.load('models/' + modelSelect.value, gltf => {
    currentModelRoot = gltf.scene;
    editorScene.add(currentModelRoot);
    // Centrer la caméra automatiquement sur le modèle
    const box = new THREE.Box3().setFromObject(currentModelRoot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    // Log de debug
    console.log('BoundingBox:', box, 'center:', center, 'size:', size, 'maxDim:', maxDim);
    if (maxDim < 1e-3) {
      infoMsg.textContent = 'Modèle chargé mais taille nulle ou très petite : invisible. Vérifiez le fichier GLTF.';
      console.warn('Modèle chargé mais taille nulle ou très petite.');
    } else {
      editorCamera.position.set(center.x, center.y + maxDim * 0.4, center.z + maxDim * 2.2);
      editorCamera.lookAt(center);
      infoMsg.textContent = 'Modèle chargé avec succès.';
    }
    // Affiche uniquement les enfants de la racine dans l'arborescence
    hierarchyDiv.innerHTML = '';
    currentModelRoot.children.forEach(child => showHierarchy(child));
    // Log arborescence
    function logHierarchy(obj, depth = 0) {
      let pad = ' '.repeat(depth*2);
      console.log(pad + (obj.name || obj.type), obj);
      if (obj.children) obj.children.forEach(child => logHierarchy(child, depth+1));
    }
    logHierarchy(currentModelRoot);
    console.log('Modèle chargé:', modelSelect.value, currentModelRoot);
    // Sauvegarde du centre et rayon pour le compass
    modelCenter.copy(center);
    modelRadius = maxDim;
  }, undefined, err => {
    infoMsg.textContent = "Erreur lors du chargement du modèle : " + err.message;
    console.error('Erreur de chargement du modèle', err);
  });
}

function showHierarchy(obj, parentDiv = null, depth = 0) {
  const div = document.createElement('div');
  div.style.marginLeft = (depth * 18) + 'px';
  div.style.cursor = 'pointer';
  div.style.padding = '2px 6px';
  div.style.borderRadius = '5px';
  div.style.userSelect = 'none';
  div.textContent = obj.name || obj.type;
  div.onclick = (e) => {
    e.stopPropagation();
    selectObject(obj);
  };
  div.onmouseenter = () => { div.style.background = '#0ff3'; };
  div.onmouseleave = () => {
    if (selectedObject !== obj) div.style.background = '';
  };
  if (parentDiv) parentDiv.appendChild(div); else hierarchyDiv.appendChild(div);
  if (obj.children) obj.children.forEach(child => showHierarchy(child, div, depth + 1));
}

function updateHierarchyHighlight() {
  Array.from(hierarchyDiv.querySelectorAll('div')).forEach(d => d.style.background = '');
  if (!selectedObject) return;
  // Recherche récursive de la div correspondant à l'objet sélectionné
  function findDivForObj(obj, parentDiv = hierarchyDiv) {
    for (const child of parentDiv.children) {
      if (child.textContent === (obj.name || obj.type)) {
        child.style.background = '#0ff7';
        return true;
      }
      if (findDivForObj(obj, child)) return true;
    }
    return false;
  }
  findDivForObj(selectedObject);
}

function selectObject(obj) {
  // Pivot total sur le modèle chargé, pas un sous-mesh
  const root = currentModelRoot;
  if (!root) return;
  let pivot = pivotMap.get(root);
  if (!pivot) {
    // Calcul du centre global
    const bbox = new THREE.Box3().setFromObject(root);
    const center = bbox.getCenter(new THREE.Vector3());
    pivot = new THREE.Group();
    pivot.position.copy(center);
    editorScene.add(pivot);
    // Reparent du root au pivot en préservant la position
    pivot.attach(root);
    // Sauvegarde des valeurs par défaut
    pivot.userData.defaultPosition = pivot.position.clone();
    pivot.userData.defaultRotation = pivot.rotation.clone();
    pivot.userData.defaultScale = pivot.scale.clone();
    pivotMap.set(root, pivot);
  }
  selectedObject = pivot;
  // Focus caméra sur le pivot
  controls.target.copy(pivot.position);
  controls.update();
  // Highlight clignotant
  if (highlightHelper) editorScene.remove(highlightHelper);
  highlightHelper = new THREE.BoxHelper(selectedObject, 0xffff00);
  editorScene.add(highlightHelper);
  updateHierarchyHighlight();
  updateTransformUI();
}

function updateTransformUI() {
  if (!selectedObject) return;
  let vals;
  switch (transformTypeSelect.value) {
    case 'translation':
      vals = [selectedObject.position.x, selectedObject.position.y, selectedObject.position.z];
      break;
    case 'rotation':
      vals = [selectedObject.rotation.x, selectedObject.rotation.y, selectedObject.rotation.z];
      break;
    case 'scaling':
      vals = [selectedObject.scale.x, selectedObject.scale.y, selectedObject.scale.z];
      break;
  }
  transformInputs.forEach((input, i) => {
    let v = vals[i].toFixed(3);
    if (uniformCheckbox && uniformCheckbox.checked) {
      // même valeur sur tous
      v = vals[0].toFixed(3);
      input.value = v;
      transformValueSpans[i].textContent = v;
    } else {
      input.value = v;
      transformValueSpans[i].textContent = v;
    }
  });
}

function applyTransform() {
  if (!selectedObject) return;
  let vals = transformInputs.map(i => parseFloat(i.value));
  if (uniformCheckbox && uniformCheckbox.checked) {
    const u = parseFloat(transformInputs[0].value);
    vals = [u, u, u];
    // synchronise sliders/affichage
    transformInputs.forEach(i => i.value = u);
    transformValueSpans.forEach(s => s.textContent = u.toFixed(3));
  }
  switch (transformTypeSelect.value) {
    case 'translation':
      selectedObject.position.set(...vals);
      break;
    case 'rotation':
      selectedObject.rotation.set(...vals);
      break;
    case 'scaling':
      selectedObject.scale.set(...vals);
      break;
  }
}

export function destroyEditor() {
  // Nettoyer la scène et l'UI
  if (editorUI) editorUI.remove();
  if (editorRenderer) editorRenderer.dispose();
  if (currentModelRoot) editorScene.remove(currentModelRoot);
  selectedObject = null;
}

window.addEventListener('resize', () => {
  if (editorRenderer && editorCamera) {
    editorRenderer.setSize(window.innerWidth, window.innerHeight);
    editorCamera.aspect = window.innerWidth / window.innerHeight;
    editorCamera.updateProjectionMatrix();
  }
});

// Crée une boussole pour sélectionner les plans de caméra
function createCompassUI() {
  if (document.getElementById('editor-compass')) return;
  const compassDiv = document.createElement('div');
  compassDiv.id = 'editor-compass';
  Object.assign(compassDiv.style, {
    position:'fixed', top:'10px', right:'10px',
    width:'150px', padding:'8px', background:'rgba(24,28,36,0.9)',
    borderRadius:'8px', display:'grid',
    gridTemplateColumns:'repeat(3,1fr)', gridTemplateRows:'repeat(2,1fr)',
    gap:'4px', justifyItems:'center', alignItems:'center', zIndex:'60', color:'#0ff', fontFamily:'monospace'
  });
  ['Front','Top','Back','Left','Bottom','Right'].forEach(dir => {
    const btn = document.createElement('button');
    btn.textContent = dir;
    btn.style.padding = '4px'; btn.style.background='transparent'; btn.style.color='#0ff';
    btn.style.border='1px solid #0ff'; btn.style.borderRadius='4px'; btn.style.cursor='pointer';
    btn.onclick = () => {
      const dist = modelRadius * 2 || 10;
      switch(dir) {
        case 'Front': editorCamera.position.set(modelCenter.x, modelCenter.y, modelCenter.z + dist); break;
        case 'Back': editorCamera.position.set(modelCenter.x, modelCenter.y, modelCenter.z - dist); break;
        case 'Left': editorCamera.position.set(modelCenter.x - dist, modelCenter.y, modelCenter.z); break;
        case 'Right': editorCamera.position.set(modelCenter.x + dist, modelCenter.y, modelCenter.z); break;
        case 'Top': editorCamera.position.set(modelCenter.x, modelCenter.y + dist, modelCenter.z); break;
        case 'Bottom': editorCamera.position.set(modelCenter.x, modelCenter.y - dist, modelCenter.z); break;
      }
      editorCamera.lookAt(modelCenter);
      controls.update();
    };
    compassDiv.appendChild(btn);
  });
  document.body.appendChild(compassDiv);
}
