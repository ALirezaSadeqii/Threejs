import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 30);
camera.lookAt(0, 0, 0);

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

let ship; // Declare a variable to hold the ship model

// Load the detailed ship model
const loader = new GLTFLoader();
loader.load('./models/liberty_ship.glb', function(gltf) {
  ship = gltf.scene;
  
  // Get model dimensions for debugging
  const box = new THREE.Box3().setFromObject(ship);
  const size = box.getSize(new THREE.Vector3());
  console.log('Model size before scaling:', size);
  
  // Apply a much larger scale - 500x larger (10x larger than previous 50x)
  ship.scale.set(500, 500, 500);
  
  // Update the bounding box after scaling
  box.setFromObject(ship);
  const newSize = box.getSize(new THREE.Vector3());
  console.log('Model size after scaling:', newSize);
  
  // Position the ship to float on the water
  // The y position should be set so that roughly 1/3 to 1/2 of the ship's height is below water
  const floatHeight = newSize.y * 0.3; // Put ~30% below water
  ship.position.set(0, -floatHeight, 0);
  
  // Use standard materials that will respond to lighting
  ship.traverse((node) => {
    if (node.isMesh) {
      // Create a new standard material with a dark gray color
      node.material = new THREE.MeshStandardMaterial({ 
        color: 0x333333,  // Dark gray
        metalness: 0.7,   // Make it look metallic
        roughness: 0.3    // Make it somewhat shiny
      });
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  scene.add(ship);
  console.log('Model loaded successfully:', ship);
  
  // Adjust camera to better view the larger ship
  camera.position.set(0, newSize.y * 1.5, newSize.z * 3);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
  
}, undefined, function(error) {
  console.error('An error occurred loading the model:', error);
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const time = clock.getElapsedTime();
  
  // Animate water
  water.material.uniforms['time'].value += 1.0 / 60.0;
  
  // Animate ship bobbing on the waves - gentler movement for a large ship
  if (ship) {
    // Get the current base position (which might be negative to be partly underwater)
    const baseY = ship.position.y;
    
    // Add small wave movement
    ship.position.y = baseY + Math.sin(time * 0.5) * 0.5;
    ship.rotation.x = Math.sin(time * 0.4) * 0.01;
    ship.rotation.z = Math.sin(time * 0.3) * 0.005;
  }
  
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