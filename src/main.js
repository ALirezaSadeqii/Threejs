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
  // Create a group to hold our ship
  const shipGroup = new THREE.Group();
  
  // Ship hull (base)
  const hullGeometry = new THREE.BoxGeometry(5, 2, 12);
  const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  hull.position.y = 1;
  shipGroup.add(hull);
  
  // Main deck
  const deckGeometry = new THREE.BoxGeometry(4.5, 0.5, 11);
  const deckMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D }); // Sienna
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.y = 2.25;
  shipGroup.add(deck);
  
  // Main mast
  const mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
  const mastMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
  const mast = new THREE.Mesh(mastGeometry, mastMaterial);
  mast.position.y = 8;
  mast.position.z = 0;
  shipGroup.add(mast);
  
  // Simple sail
  const sailGeometry = new THREE.PlaneGeometry(5, 8);
  const sailMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf0f0f0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const sail = new THREE.Mesh(sailGeometry, sailMaterial);
  sail.rotation.y = Math.PI / 2;
  sail.position.y = 6;
  sail.position.z = 0;
  shipGroup.add(sail);
  
  // Position the entire ship on the water
  shipGroup.position.y = 0.25;
  
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
