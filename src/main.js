import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 30);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 10;
controls.maxDistance = 100;
controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Ocean / Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

const water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }),
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
  fog: scene.fog !== undefined
});

water.rotation.x = -Math.PI / 2;
scene.add(water);

// Sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;

skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const parameters = {
  elevation: 2,
  azimuth: 180
};

const pmremGenerator = new THREE.PMREMGenerator(renderer);
let renderTarget;

function updateSun() {
  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  const sunPosition = new THREE.Vector3();
  sunPosition.setFromSphericalCoords(1, phi, theta);

  sky.material.uniforms['sunPosition'].value.copy(sunPosition);
  water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();

  if (renderTarget !== undefined) renderTarget.dispose();

  renderTarget = pmremGenerator.fromScene(sky);
  scene.environment = renderTarget.texture;
}

updateSun();

// Add a ship (placeholder - will be replaced with a detailed model)
function createSimpleShip() {
  const shipGroup = new THREE.Group();

  // Ship hull (base)
  const hullGeometry = new THREE.BoxGeometry(10, 4, 24);
  const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  hull.position.y = 2;
  shipGroup.add(hull);

  // Main deck
  const deckGeometry = new THREE.BoxGeometry(9.5, 0.5, 23);
  const deckMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D }); // Sienna
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.y = 4.25;
  shipGroup.add(deck);

  // Bow (front part of the ship)
  const bowGeometry = new THREE.CylinderGeometry(2, 3, 6, 16, 1, true);
  const bowMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const bow = new THREE.Mesh(bowGeometry, bowMaterial);
  bow.rotation.z = Math.PI / 2;
  bow.position.x = -5;
  bow.position.y = 4;
  bow.position.z = -12;
  shipGroup.add(bow);

  // Stern (back part of the ship)
  const sternGeometry = new THREE.BoxGeometry(4, 6, 6);
  const sternMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const stern = new THREE.Mesh(sternGeometry, sternMaterial);
  stern.position.x = 5;
  stern.position.y = 5;
  stern.position.z = 12;
  shipGroup.add(stern);

  // Main mast
  const mastGeometry = new THREE.CylinderGeometry(0.5, 0.5, 24, 16);
  const mastMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const mast = new THREE.Mesh(mastGeometry, mastMaterial);
  mast.position.y = 16;
  mast.position.z = 0;
  shipGroup.add(mast);

  // Crow's nest
  const nestGeometry = new THREE.CylinderGeometry(2, 2, 1, 16);
  const nestMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const nest = new THREE.Mesh(nestGeometry, nestMaterial);
  nest.position.y = 24;
  shipGroup.add(nest);

  // Main sail
  const mainSailGeometry = new THREE.PlaneGeometry(10, 16);
  const mainSailMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf0f0f0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const mainSail = new THREE.Mesh(mainSailGeometry, mainSailMaterial);
  mainSail.rotation.y = Math.PI / 2;
  mainSail.position.y = 12;
  mainSail.position.z = 0;
  shipGroup.add(mainSail);

  // Fore sail
  const foreSailGeometry = new THREE.PlaneGeometry(8, 12);
  const foreSailMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf0f0f0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const foreSail = new THREE.Mesh(foreSailGeometry, foreSailMaterial);
  foreSail.rotation.y = Math.PI / 2;
  foreSail.position.y = 12;
  foreSail.position.z = -8;
  shipGroup.add(foreSail);

  // Rear sail
  const rearSailGeometry = new THREE.PlaneGeometry(8, 12);
  const rearSailMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf0f0f0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const rearSail = new THREE.Mesh(rearSailGeometry, rearSailMaterial);
  rearSail.rotation.y = Math.PI / 2;
  rearSail.position.y = 12;
  rearSail.position.z = 8;
  shipGroup.add(rearSail);

  // Cannons
  const cannonGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
  const cannonMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Gray
  const cannonPositions = [
    { x: -4, y: 2.5, z: -8 },
    { x: -4, y: 2.5, z: 8 },
    { x: 4, y: 2.5, z: -8 },
    { x: 4, y: 2.5, z: 8 }
  ];

  cannonPositions.forEach(pos => {
    const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    cannon.rotation.z = Math.PI / 2;
    cannon.position.set(pos.x, pos.y, pos.z);
    shipGroup.add(cannon);
  });

  // Ship wheel
  const wheelGeometry = new THREE.TorusGeometry(1, 0.2, 16, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.position.x = 4;
  wheel.position.y = 6;
  wheel.position.z = 10;
  wheel.rotation.x = Math.PI / 2;
  shipGroup.add(wheel);

  // Position the entire ship on the water
  shipGroup.position.y = 0.5;

  return shipGroup;
}

// Add temporary ship to the scene
const ship = createSimpleShip();
scene.add(ship);

// ToDo: Replace with detailed model in the future
// const loader = new GLTFLoader();
// loader.load('path/to/ship.gltf', function(gltf) {
//   const model = gltf.scene;
//   model.position.y = 0;
//   scene.add(model);
// });

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const time = clock.getElapsedTime();
  
  // Animate water
  water.material.uniforms['time'].value += 1.0 / 60.0;
  
  // Animate ship bobbing on the waves
  ship.position.y = 0.25 + Math.sin(time * 0.5) * 0.2;
  ship.rotation.x = Math.sin(time * 0.4) * 0.02;
  ship.rotation.z = Math.sin(time * 0.3) * 0.01;
  
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
