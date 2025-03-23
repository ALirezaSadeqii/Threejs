import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 50;

// Lights setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Create ocean
const oceanGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
const oceanMaterial = new THREE.MeshPhongMaterial({
    color: 0x0077be,
    shininess: 60,
    side: THREE.DoubleSide
});
const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
ocean.rotation.x = -Math.PI / 2;
ocean.receiveShadow = true;
scene.add(ocean);

// Create ship
const shipGroup = new THREE.Group();

// Ship hull
const hullGeometry = new THREE.BoxGeometry(8, 2, 3);
const hullMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
const hull = new THREE.Mesh(hullGeometry, hullMaterial);
hull.position.y = 1;
hull.castShadow = true;
shipGroup.add(hull);

// Ship deck
const deckGeometry = new THREE.BoxGeometry(7, 0.5, 2.5);
const deckMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C });
const deck = new THREE.Mesh(deckGeometry, deckMaterial);
deck.position.y = 2.25;
deck.castShadow = true;
shipGroup.add(deck);

// Ship cabin
const cabinGeometry = new THREE.BoxGeometry(3, 1.5, 2);
const cabinMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
cabin.position.y = 3.25;
cabin.position.x = -1.5;
cabin.castShadow = true;
shipGroup.add(cabin);

// Ship mast
const mastGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
const mastMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
const mast = new THREE.Mesh(mastGeometry, mastMaterial);
mast.position.y = 5.25;
mast.position.x = 1;
mast.castShadow = true;
shipGroup.add(mast);

// Ship sail
const sailGeometry = new THREE.PlaneGeometry(3, 4);
const sailMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide
});
const sail = new THREE.Mesh(sailGeometry, sailMaterial);
sail.position.y = 5;
sail.position.x = 1;
sail.position.z = 0;
sail.rotation.y = Math.PI / 2;
sail.castShadow = true;
shipGroup.add(sail);

// Position ship
shipGroup.position.y = 1;
scene.add(shipGroup);

// Animation state
let time = 0;
const shipMovementRadius = 20;
const shipMovementSpeed = 0.0005;
const waveSpeed = 0.5;
const waveHeight = 0.2;

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    time += 0.01;
    
    // Move ship in a circle
    shipGroup.position.x = Math.cos(time * shipMovementSpeed) * shipMovementRadius;
    shipGroup.position.z = Math.sin(time * shipMovementSpeed) * shipMovementRadius;
    
    // Rotate ship to face movement direction
    shipGroup.rotation.y = -time * shipMovementSpeed + Math.PI / 2;
    
    // Make ship bob up and down
    shipGroup.position.y = 1 + Math.sin(time * waveSpeed) * waveHeight;
    
    // Animate ocean waves
    const oceanVertices = oceanGeometry.attributes.position.array;
    for (let i = 0; i < oceanVertices.length; i += 3) {
        const x = oceanGeometry.attributes.position.getX(i / 3);
        const z = oceanGeometry.attributes.position.getZ(i / 3);
        const distance = Math.sqrt(x * x + z * z);
        
        oceanVertices[i + 1] = Math.sin(distance * 0.3 + time * waveSpeed) * waveHeight;
    }
    oceanGeometry.attributes.position.needsUpdate = true;
    
    controls.update();
    renderer.render(scene, camera);
}

animate(); 