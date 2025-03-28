import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 10, 30);
camera.lookAt(50, 10, 0);

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

// Lighting variables
let ambientLight, directionalLight;

// Stars variables
let starsGroup;

// Day/Night Cycle Parameters
const dayNightCycleDuration = 20000; // 20 seconds for full cycle
let cycleStartTime = Date.now();

// Lighting Setup
ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Create more realistic stars
function createStars(density = 2000) {
  starsGroup = new THREE.Group();
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });

  const starPositions = [];
  for (let i = 0; i < density; i++) {
    const radius = 5000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    starPositions.push(x, y, z);
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  const stars = new THREE.Points(starGeometry, starMaterial);
  starsGroup.add(stars);
  scene.add(starsGroup);
}

// Create a more realistic moon
function createMoon() {
  const moonGeometry = new THREE.SphereGeometry(200, 64, 64);
  const moonTexture = new THREE.TextureLoader().load(
    "https://upload.wikimedia.org/wikipedia/commons/c/c1/Moon_map_natural_color_8k.jpg"
  );
  const moonMaterial = new THREE.MeshBasicMaterial({
    map: moonTexture,
    transparent: true,
    opacity: 0,
  });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(0, 2000, -5000);
  scene.add(moon);
  return moon;
}

let moon;

// Ocean / Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

const water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load(
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg",
    function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  ),
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
  fog: scene.fog !== undefined,
});

water.rotation.x = -Math.PI / 2;
scene.add(water);

// Sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;

skyUniforms["turbidity"].value = 10;
skyUniforms["rayleigh"].value = 2;
skyUniforms["mieCoefficient"].value = 0.005;
skyUniforms["mieDirectionalG"].value = 0.8;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
let renderTarget;

// Dynamic day/night cycle parameters
const dayParameters = {
  elevation: 45,
  azimuth: 180,
  backgroundColor: 0x87ceeb,
};

const nightParameters = {
  elevation: -10,
  azimuth: 0,
  backgroundColor: 0x000020,
};

const params = {
    waterSpeed: 1.0,
    shipSpeed: 0.5,
    dayNightSpeed: 1.0,
    weatherMode: 'Calm',
    waveIntensity: 3.7,
    pauseDayNight: false,
    shipRollIntensity: 0.05,
    shipPitchIntensity: 0.05,
    fogEnabled: false,
    fogDensity: 0.01,
    waterColor: '#001e0f',
    shipColor: '#333333',
    cameraMode: 'Orbit',
    shipWakeEnabled: true,
    moonSize: 200,
    starDensity: 2000,
    ambientLightIntensity: 1,
    enableParticles: true,
    enableCompass: true,
    enableSeagulls: true,
    enableAutoSail: false,
};

// Add these styles for the control panel
const guiStyles = `
  .lil-gui {
    background-color: rgba(30, 30, 30, 0.8) !important;
    border-radius: 8px !important;
    color: #fff !important;
    font-family: 'Arial', sans-serif !important;
  }
  .lil-gui .title {
    color: #ffcc00 !important;
  }
  .lil-gui .cr {
    display: none !important;
  }
`;

// Add this function to inject styles
function addGuiStyles() {
  const style = document.createElement('style');
  style.innerHTML = guiStyles;
  document.head.appendChild(style);
}

// Call this function before creating the control panel
addGuiStyles();

function createControlPanel() {
    const gui = new GUI({ title: 'Ship & Environment Controls' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.left = '10px';
    gui.domElement.style.bottom = '10px';
    gui.domElement.style.top = 'auto';
    gui.domElement.style.maxHeight = '80vh';
    gui.domElement.style.overflowY = 'auto';

    // Weather & Environment folder
    const weatherFolder = gui.addFolder('Weather & Environment');
    weatherFolder.add(params, 'weatherMode', ['Calm', 'Stormy', 'Foggy', 'Sunset']).onChange((value) => {
        if (value === 'Stormy') {
            water.material.uniforms['distortionScale'].value = 8.0;
            params.waveIntensity = 8.0;
            params.waterSpeed = 2.0;
            skyUniforms['turbidity'].value = 20;
            params.fogEnabled = false;
            scene.fog = null;
            water.material.uniforms['waterColor'].value.set(0x001e0f);
        } else if (value === 'Foggy') {
            water.material.uniforms['distortionScale'].value = 2.5;
            params.waveIntensity = 2.5;
            params.waterSpeed = 0.7;
            skyUniforms['turbidity'].value = 15;
            params.fogEnabled = true;
            scene.fog = new THREE.FogExp2(0xcccccc, params.fogDensity);
            water.material.uniforms['waterColor'].value.set(0x5f9ea0);
        } else if (value === 'Sunset') {
            water.material.uniforms['distortionScale'].value = 3.0;
            params.waveIntensity = 3.0;
            params.waterSpeed = 0.8;
            skyUniforms['turbidity'].value = 5;
            skyUniforms['rayleigh'].value = 4;
            params.fogEnabled = false;
            scene.fog = null;
            water.material.uniforms['waterColor'].value.set(0x0066ff);
            water.material.uniforms['sunColor'].value.set(0xff8c00);
        } else {
            water.material.uniforms['distortionScale'].value = 3.7;
            params.waveIntensity = 3.7;
            params.waterSpeed = 1.0;
            skyUniforms['turbidity'].value = 10;
            skyUniforms['rayleigh'].value = 2;
            params.fogEnabled = false;
            scene.fog = null;
            water.material.uniforms['waterColor'].value.set(0x001e0f);
            water.material.uniforms['sunColor'].value.set(0xffffff);
        }
    });

    weatherFolder.add(params, 'waveIntensity', 0, 10).onChange((value) => {
        water.material.uniforms['distortionScale'].value = value;
    });
    
    weatherFolder.add(params, 'fogEnabled').name('Enable Fog').onChange((value) => {
        if (value) {
            scene.fog = new THREE.FogExp2(0xcccccc, params.fogDensity);
        } else {
            scene.fog = null;
        }
    });
    
    weatherFolder.add(params, 'fogDensity', 0.001, 0.05).name('Fog Density').onChange((value) => {
        if (params.fogEnabled) {
            scene.fog = new THREE.FogExp2(0xcccccc, value);
        }
    });
    
    weatherFolder.addColor(params, 'waterColor').name('Water Color').onChange((value) => {
        water.material.uniforms['waterColor'].value.set(value);
    });

    // Time Control folder
    const timeFolder = gui.addFolder('Time Control');
    timeFolder.add(params, 'dayNightSpeed', 0.1, 5).name('Day/Night Speed');
    timeFolder.add(params, 'pauseDayNight').name('Pause Day/Night');
    timeFolder.add(params, 'ambientLightIntensity', 0, 2).name('Ambient Light').onChange((value) => {
        ambientLight.intensity = value;
    });

    // Ship Control folder
    const shipFolder = gui.addFolder('Ship Control');
    shipFolder.add(params, 'shipSpeed', 0.1, 2).name('Ship Speed');
    shipFolder.add(params, 'shipRollIntensity', 0, 0.2).name('Roll Intensity');
    shipFolder.add(params, 'shipPitchIntensity', 0, 0.2).name('Pitch Intensity');
    shipFolder.add(params, 'shipWakeEnabled').name('Ship Wake');
    shipFolder.addColor(params, 'shipColor').name('Ship Color').onChange((value) => {
        if (ship) {
            ship.traverse((node) => {
                if (node.isMesh) {
                    node.material.color.set(value);
                }
            });
        }
    });

    // Camera Control folder
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(params, 'cameraMode', ['Orbit', 'Follow', 'First Person']).onChange((value) => {
        if (value === 'Follow' && ship) {
            controls.target.copy(ship.position);
        } else if (value === 'First Person' && ship) {
            camera.position.set(0, 0, 10);
            camera.lookAt(0, 0, -10);
            ship.add(camera);
        } else {
            if (ship && ship.children.includes(camera)) {
                scene.attach(camera);
            }
            camera.position.set(0, 10, 30);
            controls.target.set(0, 0, 0);
        }
    });

    // Sky & Space folder
    const skyFolder = gui.addFolder('Sky & Space');
    skyFolder.add(params, 'moonSize', 50, 500).name('Moon Size').onChange((value) => {
        if (moon) {
            moon.scale.set(value/200, value/200, value/200);
        }
    });
    
    skyFolder.add(params, 'starDensity', 500, 5000, 500).name('Star Density').onChange((value) => {
        scene.remove(starsGroup);
        createStars(value);
    });

    // Add a new Effects folder
    const effectsFolder = gui.addFolder('Effects');
    effectsFolder.add(params, 'enableParticles').name('Sea Spray').onChange((value) => {
        if (value && !particles) {
            createSeaSprayParticles();
        } else if (particles) {
            particles.mesh.visible = value;
        }
    });
    
    effectsFolder.add(params, 'enableCompass').name('Show Compass');
    
    effectsFolder.add(params, 'enableSeagulls').name('Seagulls').onChange((value) => {
        createSeagulls();
    });
    
    effectsFolder.add(params, 'enableAutoSail').name('Auto-Sail');
    
    // Open the effects folder
    effectsFolder.open();

    weatherFolder.open();
    timeFolder.open();
    shipFolder.open();
    cameraFolder.open();
    skyFolder.open();
}

function updateDayNightCycle() {
    if (params.pauseDayNight) return;

    const currentTime = Date.now();
    const elapsedTime = (currentTime - cycleStartTime) % (dayNightCycleDuration / params.dayNightSpeed);
    const progress = elapsedTime / dayNightCycleDuration;

    // Interpolate between day and night parameters
    const elevation = THREE.MathUtils.lerp(
        dayParameters.elevation,
        nightParameters.elevation,
        progress
    );
    const azimuth = THREE.MathUtils.lerp(
        dayParameters.azimuth,
        nightParameters.azimuth,
        progress
    );

    // Update sky color
    const backgroundColor = new THREE.Color();
    backgroundColor.lerpColors(
        new THREE.Color(dayParameters.backgroundColor),
        new THREE.Color(nightParameters.backgroundColor),
        progress
    );
    scene.background = backgroundColor;

    // Update stars and moon
    if (starsGroup) {
        starsGroup.children[0].material.opacity = Math.max(0, (progress - 0.5) * 2);
    }

    if (moon) {
        moon.material.opacity = Math.max(0, (progress - 0.5) * 2);
    }

    // Update light
    ambientLight.intensity = 1 - progress;
    directionalLight.intensity = 1 - progress;

    // Update sun/sky position
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    const sunPosition = new THREE.Vector3();
    sunPosition.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms["sunPosition"].value.copy(sunPosition);
    water.material.uniforms["sunDirection"].value.copy(sunPosition).normalize();

    if (renderTarget !== undefined) renderTarget.dispose();

    renderTarget = pmremGenerator.fromScene(sky);
    scene.environment = renderTarget.texture;
}

// Rest of the previous code for ship loading and movement remains the same...
let ship;
const loader = new GLTFLoader();
loader.load(
  "/Threejs/models/liberty_ship.glb",
  function (gltf) {
    ship = gltf.scene;

    ship.scale.set(1000, 1000, 1000);

    const box = new THREE.Box3().setFromObject(ship);
    const newSize = box.getSize(new THREE.Vector3());

    ship.position.set(0, -7.8, 0);

    ship.traverse((node) => {
      if (node.isMesh) {
        node.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(params.shipColor),
          metalness: 0.7,
          roughness: 0.3,
        });
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    scene.add(ship);

    camera.position.set(0, newSize.y * 1.5, newSize.z * 3);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  },
  undefined,
  function (error) {
    console.error("An error occurred loading the model:", error);
  }
);

// Movement controls (same as before)
const keyStates = {};

window.addEventListener("keydown", (event) => {
  keyStates[event.code] = true;
});

window.addEventListener("keyup", (event) => {
  keyStates[event.code] = false;
});

function updateShipPosition() {
    if (!ship) return;

    const currentSpeed = params.shipSpeed;
    const rollIntensity = params.shipRollIntensity || 0.05;
    const pitchIntensity = params.shipPitchIntensity || 0.05;

    if (keyStates["ArrowUp"] || keyStates["KeyW"]) {
        ship.position.z -= currentSpeed;
        ship.rotation.x = THREE.MathUtils.lerp(ship.rotation.x, pitchIntensity, 0.1);
    } else if (keyStates["ArrowDown"] || keyStates["KeyS"]) {
        ship.position.z += currentSpeed;
        ship.rotation.x = THREE.MathUtils.lerp(ship.rotation.x, -pitchIntensity, 0.1);
    } else {
        ship.rotation.x = THREE.MathUtils.lerp(ship.rotation.x, 0, 0.1);
    }

    if (keyStates["ArrowLeft"] || keyStates["KeyA"]) {
        ship.position.x -= currentSpeed;
        ship.rotation.y = THREE.MathUtils.lerp(ship.rotation.y, Math.PI * 0.1, 0.1);
        ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, rollIntensity, 0.1);
    } else if (keyStates["ArrowRight"] || keyStates["KeyD"]) {
        ship.position.x += currentSpeed;
        ship.rotation.y = THREE.MathUtils.lerp(ship.rotation.y, -Math.PI * 0.1, 0.1);
        ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, -rollIntensity, 0.1);
    } else {
        ship.rotation.y = THREE.MathUtils.lerp(ship.rotation.y, 0, 0.1);
        ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, 0, 0.1);
    }
}

// Add a ship wake effect function
let shipWake;
function createShipWake() {
    if (shipWake) scene.remove(shipWake);
    
    const wakeGeometry = new THREE.PlaneGeometry(5, 20, 10, 10);
    const wakeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        emissive: 0xffffff,
        emissiveIntensity: 0.2,
    });
    
    shipWake = new THREE.Mesh(wakeGeometry, wakeMaterial);
    shipWake.rotation.x = -Math.PI / 2;
    shipWake.position.y = -7.7;
    shipWake.position.z = 10;
    scene.add(shipWake);
}

// Create a compass to help with navigation
let compass;
function createCompass() {
  // Create a div for the compass instead of a 3D object
  const compassDiv = document.createElement('div');
  compassDiv.style.position = 'absolute';
  compassDiv.style.right = '20px';
  compassDiv.style.top = '20px';
  compassDiv.style.width = '100px';
  compassDiv.style.height = '100px';
  compassDiv.style.backgroundImage = 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Compass_Rose_English_North.svg/1024px-Compass_Rose_English_North.svg.png")';
  compassDiv.style.backgroundSize = 'cover';
  compassDiv.style.opacity = '0.8';
  compassDiv.style.display = params.enableCompass ? 'block' : 'none';
  document.body.appendChild(compassDiv);
  
  return compassDiv;
}

// Create sea spray particles
let particles;
function createSeaSprayParticles() {
  const particleCount = 500;
  const particleGeometry = new THREE.BufferGeometry();
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = Math.random() * 5 - 7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    
    velocities.push({
      x: (Math.random() - 0.5) * 0.1,
      y: Math.random() * 0.2,
      z: (Math.random() - 0.5) * 0.1,
      life: Math.random() * 2
    });
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles = {
    mesh: new THREE.Points(particleGeometry, particleMaterial),
    velocities: velocities,
    positions: positions
  };
  
  scene.add(particles.mesh);
}

// Create seagulls
let seagulls = [];
function createSeagulls() {
  // Clear existing seagulls if any
  seagulls.forEach(seagull => {
    if (seagull.mesh) scene.remove(seagull.mesh);
  });
  seagulls = [];
  
  const seagullCount = 10;
  
  for (let i = 0; i < seagullCount; i++) {
    try {
      const seagullGeometry = new THREE.BufferGeometry();
      
      // Create a simple bird shape with lines
      const points = [
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 1)
      ];
      
      seagullGeometry.setFromPoints(points);
      
      const seagullMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        linewidth: 2
      });
      
      const seagull = new THREE.Line(seagullGeometry, seagullMaterial);
      seagull.scale.set(2, 2, 2);
      
      // Random position around the scene
      seagull.position.set(
        (Math.random() - 0.5) * 200,
        50 + Math.random() * 50,
        (Math.random() - 0.5) * 200
      );
      
      // Random flight parameters
      const flightParams = {
        speed: 0.2 + Math.random() * 0.3,
        radius: 50 + Math.random() * 100,
        height: 50 + Math.random() * 30,
        phase: Math.random() * Math.PI * 2,
        wingPhase: 0
      };
      
      seagulls.push({ mesh: seagull, params: flightParams });
      scene.add(seagull);
    } catch (error) {
      console.error("Error creating seagull:", error);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  water.material.uniforms['time'].value += params.waterSpeed / 60.0;
  
  // Add ship bobbing and wake effects
  if (ship) {
    const time = Date.now() * 0.001;
    ship.position.y = -7.8 + Math.sin(time) * (params.waveIntensity * 0.1);
    
    // Add natural rolling even when not turning
    const naturalRoll = Math.sin(time * 0.3) * (params.waveIntensity * 0.005);
    ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, naturalRoll, 0.1);
    
    // Update ship wake position
    if (shipWake && params.shipWakeEnabled) {
        shipWake.position.x = ship.position.x;
        shipWake.position.z = ship.position.z + 10;
        shipWake.rotation.y = ship.rotation.y;
        shipWake.material.opacity = 0.8 * (params.shipSpeed / 2);
        shipWake.visible = true;
    } else if (shipWake) {
        shipWake.visible = false;
    }
    
    // Update camera if in follow mode
    if (params.cameraMode === 'Follow') {
        controls.target.copy(ship.position);
        controls.update();
    }
    
    // Update compass rotation based on ship orientation
    if (compass && params.enableCompass) {
        compass.style.display = 'block';
        compass.style.transform = `rotate(${ship ? ship.rotation.y * (180/Math.PI) : 0}deg)`;
    } else if (compass) {
        compass.style.display = 'none';
    }
    
    // Update sea spray particles
    if (particles && params.enableParticles) {
        const positions = particles.positions;
        const velocities = particles.velocities;
        
        for (let i = 0; i < velocities.length; i++) {
            // Only show particles when ship is moving
            const isMoving = keyStates["ArrowUp"] || keyStates["KeyW"] || 
                            keyStates["ArrowDown"] || keyStates["KeyS"] ||
                            keyStates["ArrowLeft"] || keyStates["KeyA"] ||
                            keyStates["ArrowRight"] || keyStates["KeyD"];
            
            if (isMoving || params.weatherMode === 'Stormy') {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
                
                velocities[i].life -= 0.01;
                
                if (velocities[i].life <= 0) {
                    // Reset particle
                    positions[i * 3] = ship.position.x + (Math.random() - 0.5) * 10;
                    positions[i * 3 + 1] = -7 + Math.random() * 2;
                    positions[i * 3 + 2] = ship.position.z + (Math.random() - 0.5) * 10;
                    velocities[i].life = Math.random() * 2;
                }
            }
        }
        
        particles.mesh.geometry.attributes.position.needsUpdate = true;
    }
    
    // Auto-sail feature
    if (params.enableAutoSail) {
        // Simple auto-sailing logic - move forward and avoid edges
        const edgeDistance = 100;
        if (ship.position.x > edgeDistance) {
            keyStates["ArrowLeft"] = true;
            keyStates["ArrowRight"] = false;
        } else if (ship.position.x < -edgeDistance) {
            keyStates["ArrowLeft"] = false;
            keyStates["ArrowRight"] = true;
        } else {
            keyStates["ArrowLeft"] = false;
            keyStates["ArrowRight"] = false;
        }
        
        if (ship.position.z > edgeDistance) {
            keyStates["ArrowUp"] = true;
            keyStates["ArrowDown"] = false;
        } else if (ship.position.z < -edgeDistance) {
            keyStates["ArrowUp"] = false;
            keyStates["ArrowDown"] = true;
        } else {
            // Keep moving forward by default
            keyStates["ArrowUp"] = true;
            keyStates["ArrowDown"] = false;
        }
    }
  }
  
  // Rotate the moon
  if (moon) {
    moon.rotation.y += 0.001;
  }

  // Twinkle stars
  if (starsGroup && starsGroup.children[0]) {
    const starTime = Date.now() * 0.0005;
    starsGroup.children[0].material.opacity = 0.5 + Math.sin(starTime) * 0.5;
    starsGroup.rotation.y += 0.0001;
  }

  // Update seagulls
  if (params.enableSeagulls) {
    seagulls.forEach(seagull => {
        const time = Date.now() * 0.001;
        const params = seagull.params;
        
        // Circular flight pattern
        seagull.mesh.position.x = Math.cos(time * params.speed + params.phase) * params.radius;
        seagull.mesh.position.z = Math.sin(time * params.speed + params.phase) * params.radius;
        
        // Gentle up and down motion
        seagull.mesh.position.y = params.height + Math.sin(time * params.speed * 2) * 10;
        
        // Rotate to face direction of travel
        seagull.mesh.rotation.y = Math.atan2(
            Math.cos(time * params.speed + params.phase + 0.1) - Math.cos(time * params.speed + params.phase),
            Math.sin(time * params.speed + params.phase + 0.1) - Math.sin(time * params.speed + params.phase)
        );
        
        // Wing flapping
        params.wingPhase += 0.1;
        const wingPos = Math.sin(params.wingPhase) * 0.5;
        seagull.mesh.geometry.attributes.position.array[4] = wingPos;  // Left wing
        seagull.mesh.geometry.attributes.position.array[10] = wingPos; // Right wing
        seagull.mesh.geometry.attributes.position.needsUpdate = true;
    });
  }

  updateDayNightCycle();
  updateShipPosition();

  renderer.render(scene, camera);
}

// Resize and instructions (same as before)
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const instructionDiv = document.createElement("div");
instructionDiv.style.position = "absolute";
instructionDiv.style.top = "10px";
instructionDiv.style.left = "10px";
instructionDiv.style.color = "white";
instructionDiv.style.backgroundColor = "rgba(0,0,0,0.5)";
instructionDiv.style.padding = "10px";
instructionDiv.innerHTML = "Use Arrow Keys or WASD to move ship";
document.body.appendChild(instructionDiv);

// Initialize stars and moon
createStars(params.starDensity);
moon = createMoon();

// Start animation
createControlPanel();
animate();

// Call this function to create the ship wake
createShipWake();

// Initialize new features
createCompass();
createSeagulls();

export { scene, renderer, camera, controls };
