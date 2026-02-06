import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';

// ============================================================
// CONFIGURATION
// ============================================================

const COMPANIES = {
  front: {
    id: 'aerointel',
    name: 'AEROINTEL',
    tagline: 'GPS-Denied Drone Navigation',
    color: 0xf97316,
    description: 'Defense-grade navigation for autonomous drones operating in contested environments. When GPS fails, AEROINTEL keeps flying.',
    stats: [
      { value: '€105K', label: 'MoD Contract' },
      { value: '2024', label: 'Founded' },
    ],
    tech: ['Computer Vision', 'Sensor Fusion', 'SLAM', 'Edge AI'],
  },
  back: {
    id: 'dutchdrones',
    name: 'Dutch Drones',
    tagline: 'Autonomous Bridge Maintenance',
    color: 0x22c55e,
    description: 'Robotic systems that inspect and clean the Netherlands\' 24,000+ bridges. Safer, faster, and more thorough than scaffolding crews.',
    stats: [
      { value: 'RWS', label: 'Pilot Target' },
      { value: '24K+', label: 'Dutch Bridges' },
    ],
    tech: ['Robotics', 'Drones', 'Computer Vision', 'Automation'],
  },
  right: {
    id: 'datadividend',
    name: 'DataDividend',
    tagline: 'AI Training Data Marketplace',
    color: 0x8b5cf6,
    description: 'A marketplace where individuals sell their data directly to AI companies. Fair compensation for the fuel that powers machine learning.',
    stats: [
      { value: 'B2B', label: 'Model' },
      { value: 'Mr Joseph', label: 'Also Known As' },
    ],
    tech: ['Data Markets', 'Privacy', 'AI/ML', 'Blockchain'],
  },
  left: {
    id: 'textme',
    name: 'text.me',
    tagline: 'WhatsApp-Native AI Coaching',
    color: 0x06b6d4,
    description: 'AI coaching bots that live where you already are — WhatsApp. Personal development, accountability, and guidance without another app.',
    stats: [
      { value: 'B2C', label: 'Model' },
      { value: 'WhatsApp', label: 'Platform' },
    ],
    tech: ['LLMs', 'WhatsApp API', 'Conversational AI', 'Coaching'],
  },
  top: {
    id: 'about',
    name: 'About',
    tagline: 'Aerospace Engineer → Founder',
    color: 0xec4899,
    isAbout: true,
  },
  bottom: {
    id: 'contact',
    name: 'Contact',
    tagline: 'Let\'s Build Something',
    color: 0xeab308,
    isContact: true,
  },
};

// ============================================================
// GLOBALS
// ============================================================

let scene, camera, renderer;
let cube, cubeGroup;
let particles;
let raycaster, mouse;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationVelocity = { x: 0, y: 0 };
let targetRotation = { x: 0, y: 0 };
let currentRotation = { x: 0, y: 0 };
let selectedFace = null;
let innerScenes = {};
let clock;

// ============================================================
// INITIALIZATION
// ============================================================

function init() {
  clock = new THREE.Clock();
  
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);
  scene.fog = new THREE.Fog(0x0a0a0f, 8, 25);

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 6;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Lighting
  setupLighting();

  // Create main cube group
  cubeGroup = new THREE.Group();
  scene.add(cubeGroup);

  // Create cube
  createCube();

  // Create inner scenes for each face
  createInnerScenes();

  // Create background particles
  createParticles();

  // Raycaster for interaction
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Event listeners
  setupEventListeners();

  // Hide loader
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 1500);

  // Start animation
  animate();
}

function setupLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // Main directional light
  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(5, 5, 5);
  scene.add(mainLight);

  // Accent lights
  const accentLight1 = new THREE.PointLight(0x6366f1, 2, 10);
  accentLight1.position.set(-3, 2, 3);
  scene.add(accentLight1);

  const accentLight2 = new THREE.PointLight(0xf97316, 1.5, 10);
  accentLight2.position.set(3, -2, 3);
  scene.add(accentLight2);

  // Rim light
  const rimLight = new THREE.DirectionalLight(0x22c55e, 0.5);
  rimLight.position.set(0, 0, -5);
  scene.add(rimLight);
}

// ============================================================
// CUBE CREATION
// ============================================================

function createCube() {
  const size = 2;
  
  // Create glass cube geometry
  const geometry = new THREE.BoxGeometry(size, size, size);
  
  // Custom shader material for glass effect
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transmission: 0.95,
    thickness: 0.5,
    envMapIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    ior: 1.5,
    transparent: true,
    opacity: 0.3,
  });

  cube = new THREE.Mesh(geometry, glassMaterial);
  cubeGroup.add(cube);

  // Create edge glow
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: 0x6366f1,
    transparent: true,
    opacity: 0.6,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  cubeGroup.add(edges);

  // Create face indicators (colored corners)
  createFaceIndicators(size);
}

function createFaceIndicators(size) {
  const facePositions = {
    front: { pos: [0, 0, size / 2 + 0.01], rot: [0, 0, 0] },
    back: { pos: [0, 0, -size / 2 - 0.01], rot: [0, Math.PI, 0] },
    right: { pos: [size / 2 + 0.01, 0, 0], rot: [0, Math.PI / 2, 0] },
    left: { pos: [-size / 2 - 0.01, 0, 0], rot: [0, -Math.PI / 2, 0] },
    top: { pos: [0, size / 2 + 0.01, 0], rot: [-Math.PI / 2, 0, 0] },
    bottom: { pos: [0, -size / 2 - 0.01, 0], rot: [Math.PI / 2, 0, 0] },
  };

  Object.entries(facePositions).forEach(([face, { pos, rot }]) => {
    const company = COMPANIES[face];
    
    // Create face plane with subtle indicator
    const planeGeometry = new THREE.PlaneGeometry(size * 0.9, size * 0.9);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: company.color,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(...pos);
    plane.rotation.set(...rot);
    plane.userData = { face, company };
    cubeGroup.add(plane);

    // Add corner accent
    const cornerSize = 0.15;
    const cornerGeometry = new THREE.PlaneGeometry(cornerSize, cornerSize);
    const cornerMaterial = new THREE.MeshBasicMaterial({
      color: company.color,
      transparent: true,
      opacity: 0.8,
    });

    const corners = [
      [-size * 0.4, size * 0.4],
      [size * 0.4, size * 0.4],
      [-size * 0.4, -size * 0.4],
      [size * 0.4, -size * 0.4],
    ];

    corners.forEach(([x, y]) => {
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial.clone());
      corner.position.set(
        pos[0] + (rot[1] === 0 ? x : rot[1] === Math.PI / 2 ? 0 : rot[1] === -Math.PI / 2 ? 0 : -x),
        pos[1] + (rot[0] !== 0 ? (rot[0] < 0 ? 0 : 0) : y),
        pos[2] + (rot[1] === Math.PI / 2 ? -x : rot[1] === -Math.PI / 2 ? x : 0)
      );
      corner.rotation.set(...rot);
      corner.userData = { face, company, isCorner: true };
      cubeGroup.add(corner);
    });
  });
}

// ============================================================
// INNER SCENES (3D DIORAMAS)
// ============================================================

function createInnerScenes() {
  // AEROINTEL - Drone with navigation beams
  innerScenes.aerointel = createAerointelScene();
  
  // Dutch Drones - Bridge with drone
  innerScenes.dutchdrones = createDutchDronesScene();
  
  // DataDividend - Data streams
  innerScenes.datadividend = createDataDividendScene();
  
  // text.me - Chat bubbles
  innerScenes.textme = createTextMeScene();

  // About - Abstract representation
  innerScenes.about = createAboutScene();

  // Contact - Connection nodes
  innerScenes.contact = createContactScene();

  // Add all inner scenes to cube group
  Object.values(innerScenes).forEach(group => {
    group.scale.set(0.6, 0.6, 0.6);
    cubeGroup.add(group);
  });
}

function createAerointelScene() {
  const group = new THREE.Group();
  
  // Drone body
  const droneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.08, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 })
  );
  group.add(droneBody);

  // Drone arms and rotors
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const rotorMaterial = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.3 });

  const armPositions = [
    [0.2, 0, 0.2], [-0.2, 0, 0.2], [0.2, 0, -0.2], [-0.2, 0, -0.2]
  ];

  armPositions.forEach(pos => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.15),
      armMaterial
    );
    arm.position.set(pos[0] * 0.5, 0, pos[2] * 0.5);
    arm.rotation.z = Math.atan2(pos[2], pos[0]);
    arm.rotation.x = Math.PI / 2;
    group.add(arm);

    const rotor = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.01, 8, 16),
      rotorMaterial
    );
    rotor.position.set(...pos.map(p => p * 0.7));
    rotor.rotation.x = Math.PI / 2;
    rotor.userData.isRotor = true;
    group.add(rotor);
  });

  // Navigation beams
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.4,
  });

  for (let i = 0; i < 8; i++) {
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.6, 8),
      beamMaterial.clone()
    );
    const angle = (i / 8) * Math.PI * 2;
    beam.position.set(Math.cos(angle) * 0.1, -0.3, Math.sin(angle) * 0.1);
    beam.rotation.x = Math.PI;
    beam.userData.isBeam = true;
    beam.userData.angle = angle;
    group.add(beam);
  }

  // Terrain suggestion (low poly mountains)
  const terrainGeometry = new THREE.ConeGeometry(0.4, 0.3, 4);
  const terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    flatShading: true,
  });

  for (let i = 0; i < 5; i++) {
    const mountain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    mountain.position.set(
      (Math.random() - 0.5) * 1.2,
      -0.6 + Math.random() * 0.1,
      (Math.random() - 0.5) * 1.2
    );
    mountain.scale.set(
      0.5 + Math.random() * 0.5,
      0.5 + Math.random() * 1,
      0.5 + Math.random() * 0.5
    );
    group.add(mountain);
  }

  group.userData.name = 'aerointel';
  return group;
}

function createDutchDronesScene() {
  const group = new THREE.Group();

  // Bridge deck
  const deckMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.05, 0.4),
    deckMaterial
  );
  deck.position.y = 0.1;
  group.add(deck);

  // Bridge supports
  const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
  [-0.5, 0.5].forEach(x => {
    const support = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.5, 0.08),
      supportMaterial
    );
    support.position.set(x, -0.15, 0);
    group.add(support);
  });

  // Water
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 1.5),
    new THREE.MeshStandardMaterial({
      color: 0x0066aa,
      transparent: true,
      opacity: 0.6,
      metalness: 0.3,
      roughness: 0.2,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.5;
  group.add(water);

  // Cleaning drone on bridge
  const droneArm = new THREE.Group();
  
  const armBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.2 })
  );
  droneArm.add(armBase);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.3, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  arm.position.y = -0.15;
  droneArm.add(arm);

  const brush = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x22c55e })
  );
  brush.position.y = -0.3;
  brush.rotation.x = Math.PI / 2;
  brush.userData.isBrush = true;
  droneArm.add(brush);

  droneArm.position.set(0, 0.15, 0.15);
  droneArm.userData.isDroneArm = true;
  group.add(droneArm);

  // Cleaning particles
  for (let i = 0; i < 20; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.6 })
    );
    particle.position.set(
      (Math.random() - 0.5) * 0.3,
      0.15 + Math.random() * 0.1,
      0.15 + (Math.random() - 0.5) * 0.1
    );
    particle.userData.isCleaningParticle = true;
    particle.userData.offset = Math.random() * Math.PI * 2;
    group.add(particle);
  }

  group.userData.name = 'dutchdrones';
  return group;
}

function createDataDividendScene() {
  const group = new THREE.Group();

  // Central node
  const centralNode = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.15, 1),
    new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.5,
      metalness: 0.5,
      roughness: 0.2,
    })
  );
  centralNode.userData.isCentralNode = true;
  group.add(centralNode);

  // Orbiting data nodes
  const nodeGeometry = new THREE.OctahedronGeometry(0.05);
  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    emissive: 0x8b5cf6,
    emissiveIntensity: 0.3,
  });

  for (let i = 0; i < 12; i++) {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    const phi = Math.acos(-1 + (2 * i) / 12);
    const theta = Math.sqrt(12 * Math.PI) * phi;
    
    node.position.setFromSphericalCoords(0.5, phi, theta);
    node.userData.isDataNode = true;
    node.userData.originalPos = node.position.clone();
    node.userData.offset = i * 0.5;
    group.add(node);

    // Connection line to center
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      node.position.clone()
    ]);
    const line = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.3 })
    );
    line.userData.isDataLine = true;
    line.userData.nodeIndex = i;
    group.add(line);
  }

  // Floating data particles
  for (let i = 0; i < 30; i++) {
    const particle = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.02, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    );
    particle.position.set(
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.2
    );
    particle.userData.isFloatingData = true;
    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01
    );
    group.add(particle);
  }

  group.userData.name = 'datadividend';
  return group;
}

function createTextMeScene() {
  const group = new THREE.Group();

  // Phone outline
  const phoneOutline = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.5, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.5,
      roughness: 0.5,
    })
  );
  group.add(phoneOutline);

  // Screen
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.44),
    new THREE.MeshBasicMaterial({ color: 0x0d1117 })
  );
  screen.position.z = 0.011;
  group.add(screen);

  // Chat bubbles
  const bubbleData = [
    { text: 'user', y: 0.15, align: 'right', color: 0x06b6d4 },
    { text: 'ai', y: 0.05, align: 'left', color: 0x22c55e },
    { text: 'user', y: -0.05, align: 'right', color: 0x06b6d4 },
    { text: 'ai', y: -0.15, align: 'left', color: 0x22c55e },
  ];

  bubbleData.forEach((data, i) => {
    const bubble = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.06, 1, 1),
      new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.8,
      })
    );
    bubble.position.set(data.align === 'right' ? 0.05 : -0.05, data.y, 0.012);
    bubble.userData.isBubble = true;
    bubble.userData.originalY = data.y;
    bubble.userData.delay = i * 0.3;
    group.add(bubble);
  });

  // Floating emoji/icons around
  const emojis = ['💬', '🤖', '💡', '✨'];
  emojis.forEach((_, i) => {
    const emojiDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 })
    );
    const angle = (i / emojis.length) * Math.PI * 2;
    emojiDot.position.set(
      Math.cos(angle) * 0.4,
      Math.sin(angle) * 0.3,
      0
    );
    emojiDot.userData.isEmoji = true;
    emojiDot.userData.angle = angle;
    group.add(emojiDot);
  });

  group.userData.name = 'textme';
  return group;
}

function createAboutScene() {
  const group = new THREE.Group();

  // Abstract human figure (geometric)
  const headGeometry = new THREE.IcosahedronGeometry(0.12, 1);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    emissive: 0xec4899,
    emissiveIntensity: 0.2,
    metalness: 0.3,
    roughness: 0.5,
  });

  const head = new THREE.Mesh(headGeometry, bodyMaterial);
  head.position.y = 0.3;
  group.add(head);

  // Body (abstract)
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.4, 5),
    bodyMaterial
  );
  body.position.y = 0;
  body.rotation.x = Math.PI;
  group.add(body);

  // Orbiting skills/interests
  const skills = [
    { color: 0xf97316, label: 'Aerospace' },
    { color: 0x22c55e, label: 'Robotics' },
    { color: 0x8b5cf6, label: 'AI' },
    { color: 0x06b6d4, label: 'Startups' },
  ];

  skills.forEach((skill, i) => {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshStandardMaterial({
        color: skill.color,
        emissive: skill.color,
        emissiveIntensity: 0.5,
      })
    );
    const angle = (i / skills.length) * Math.PI * 2;
    orb.position.set(
      Math.cos(angle) * 0.4,
      0.1,
      Math.sin(angle) * 0.4
    );
    orb.userData.isSkillOrb = true;
    orb.userData.baseAngle = angle;
    group.add(orb);
  });

  group.userData.name = 'about';
  return group;
}

function createContactScene() {
  const group = new THREE.Group();

  // Connection hub
  const hub = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.15, 0.05, 64, 8),
    new THREE.MeshStandardMaterial({
      color: 0xeab308,
      emissive: 0xeab308,
      emissiveIntensity: 0.3,
      metalness: 0.6,
      roughness: 0.3,
    })
  );
  hub.userData.isHub = true;
  group.add(hub);

  // Connection points
  const connectionPoints = [
    { icon: 'email', angle: 0 },
    { icon: 'linkedin', angle: Math.PI / 2 },
    { icon: 'twitter', angle: Math.PI },
    { icon: 'github', angle: Math.PI * 1.5 },
  ];

  connectionPoints.forEach(cp => {
    const point = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xeab308,
        emissiveIntensity: 0.2,
      })
    );
    point.position.set(
      Math.cos(cp.angle) * 0.5,
      0,
      Math.sin(cp.angle) * 0.5
    );
    point.userData.isConnectionPoint = true;
    point.userData.baseAngle = cp.angle;
    group.add(point);

    // Connection line
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      point.position.clone()
    ]);
    const line = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: 0xeab308, transparent: true, opacity: 0.4 })
    );
    group.add(line);
  });

  // Pulse rings
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3 + i * 0.15, 0.32 + i * 0.15, 32),
      new THREE.MeshBasicMaterial({
        color: 0xeab308,
        transparent: true,
        opacity: 0.2 - i * 0.05,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.userData.isPulseRing = true;
    ring.userData.ringIndex = i;
    group.add(ring);
  }

  group.userData.name = 'contact';
  return group;
}

// ============================================================
// BACKGROUND PARTICLES
// ============================================================

function createParticles() {
  const particleCount = 500;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const colorPalette = [
    new THREE.Color(0x6366f1),
    new THREE.Color(0xf97316),
    new THREE.Color(0x22c55e),
    new THREE.Color(0x8b5cf6),
  ];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  const canvas = document.getElementById('canvas');

  // Mouse events
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('click', onClick);

  // Touch events
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);

  // Window resize
  window.addEventListener('resize', onWindowResize);

  // Close panel button
  document.getElementById('close-panel').addEventListener('click', closePanel);

  // Nav links
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const face = link.dataset.face;
      rotateTofFace(face);
    });
  });
}

function onMouseDown(event) {
  isDragging = true;
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY,
  };
}

function onMouseMove(event) {
  if (isDragging) {
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    rotationVelocity.y = deltaX * 0.005;
    rotationVelocity.x = deltaY * 0.005;

    targetRotation.y += deltaX * 0.005;
    targetRotation.x += deltaY * 0.005;

    // Clamp X rotation
    targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.x));

    previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  // Update mouse for raycaster
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  updateFaceLabel();
}

function onMouseUp() {
  isDragging = false;
}

function onClick(event) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubeGroup.children, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    if (clickedObject.userData.company) {
      openPanel(clickedObject.userData.company);
    }
  }
}

function onTouchStart(event) {
  event.preventDefault();
  if (event.touches.length === 1) {
    isDragging = true;
    previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }
}

function onTouchMove(event) {
  event.preventDefault();
  if (isDragging && event.touches.length === 1) {
    const deltaX = event.touches[0].clientX - previousMousePosition.x;
    const deltaY = event.touches[0].clientY - previousMousePosition.y;

    targetRotation.y += deltaX * 0.005;
    targetRotation.x += deltaY * 0.005;
    targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.x));

    previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }
}

function onTouchEnd() {
  isDragging = false;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================
// UI FUNCTIONS
// ============================================================

function updateFaceLabel() {
  // Determine which face is most facing the camera
  const faceNormals = {
    front: new THREE.Vector3(0, 0, 1),
    back: new THREE.Vector3(0, 0, -1),
    right: new THREE.Vector3(1, 0, 0),
    left: new THREE.Vector3(-1, 0, 0),
    top: new THREE.Vector3(0, 1, 0),
    bottom: new THREE.Vector3(0, -1, 0),
  };

  const cameraDirection = new THREE.Vector3(0, 0, 1);
  let maxDot = -Infinity;
  let facingFace = null;

  Object.entries(faceNormals).forEach(([face, normal]) => {
    const rotatedNormal = normal.clone().applyEuler(cubeGroup.rotation);
    const dot = rotatedNormal.dot(cameraDirection);
    if (dot > maxDot) {
      maxDot = dot;
      facingFace = face;
    }
  });

  const faceLabel = document.getElementById('face-label');
  const faceName = faceLabel.querySelector('.face-name');
  const faceTagline = faceLabel.querySelector('.face-tagline');

  if (facingFace && maxDot > 0.5) {
    const company = COMPANIES[facingFace];
    faceName.textContent = company.name;
    faceName.style.color = `#${company.color.toString(16).padStart(6, '0')}`;
    faceTagline.textContent = company.tagline;
    faceLabel.classList.add('visible');
  } else {
    faceLabel.classList.remove('visible');
  }
}

function rotateTofFace(faceId) {
  const rotations = {
    about: { x: -Math.PI / 2, y: 0 },
    contact: { x: Math.PI / 2, y: 0 },
  };

  if (rotations[faceId]) {
    gsap.to(targetRotation, {
      x: rotations[faceId].x,
      y: rotations[faceId].y,
      duration: 1,
      ease: 'power2.inOut',
    });
  }
}

function openPanel(company) {
  const panel = document.getElementById('info-panel');
  const content = document.getElementById('panel-content');

  let html = '';

  if (company.isAbout) {
    html = `
      <h2><span class="icon" style="background: #${company.color.toString(16)}"></span>${company.name}</h2>
      <p class="tagline">${company.tagline}</p>
      
      <div class="bio-section">
        <h3>Background</h3>
        <p class="description">Aerospace engineer turned multi-founder. Building autonomous systems, AI products, and defense technology across four active ventures.</p>
      </div>
      
      <div class="bio-section">
        <h3>Journey</h3>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-date">2024 - Present</div>
            <div class="timeline-title">Founder × 4</div>
            <div class="timeline-desc">AEROINTEL, Dutch Drones, DataDividend, text.me</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-date">2020 - Present</div>
            <div class="timeline-title">System Engineer</div>
            <div class="timeline-desc">Capgemini Engineering</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-date">Education</div>
            <div class="timeline-title">Aerospace Engineering</div>
            <div class="timeline-desc">TU Delft</div>
          </div>
        </div>
      </div>
    `;
  } else if (company.isContact) {
    html = `
      <h2><span class="icon" style="background: #${company.color.toString(16)}"></span>${company.name}</h2>
      <p class="tagline">${company.tagline}</p>
      
      <div class="contact-links">
        <a href="mailto:jasper@lortije.com" class="contact-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>jasper@lortije.com</span>
        </a>
        <a href="https://linkedin.com/in/jasperlortije" target="_blank" class="contact-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect x="2" y="9" width="4" height="12"/>
            <circle cx="4" cy="4" r="2"/>
          </svg>
          <span>LinkedIn</span>
        </a>
        <a href="https://twitter.com/jasperlortije" target="_blank" class="contact-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
          </svg>
          <span>Twitter</span>
        </a>
        <a href="https://github.com/jasperlortije" target="_blank" class="contact-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    `;
  } else {
    html = `
      <h2><span class="icon" style="background: #${company.color.toString(16)}"></span>${company.name}</h2>
      <p class="tagline">${company.tagline}</p>
      
      <div class="stats">
        ${company.stats.map(stat => `
          <div class="stat">
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
          </div>
        `).join('')}
      </div>
      
      <p class="description">${company.description}</p>
      
      <div class="tech-stack">
        ${company.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
      </div>
    `;
  }

  content.innerHTML = html;
  panel.classList.remove('hidden');
  panel.classList.add('visible');
  selectedFace = company.id;
}

function closePanel() {
  const panel = document.getElementById('info-panel');
  panel.classList.remove('visible');
  panel.classList.add('hidden');
  selectedFace = null;
}

// ============================================================
// ANIMATION
// ============================================================

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();
  const delta = clock.getDelta();

  // Smooth rotation
  if (!isDragging) {
    // Auto-rotate slowly when not interacting
    targetRotation.y += 0.001;

    // Apply momentum
    rotationVelocity.x *= 0.95;
    rotationVelocity.y *= 0.95;
    targetRotation.x += rotationVelocity.x;
    targetRotation.y += rotationVelocity.y;
  }

  // Lerp rotation
  currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
  currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;

  cubeGroup.rotation.x = currentRotation.x;
  cubeGroup.rotation.y = currentRotation.y;

  // Animate inner scenes
  animateInnerScenes(time);

  // Animate particles
  if (particles) {
    particles.rotation.y = time * 0.02;
    particles.rotation.x = time * 0.01;
  }

  // Update face label
  updateFaceLabel();

  renderer.render(scene, camera);
}

function animateInnerScenes(time) {
  // AEROINTEL animations
  if (innerScenes.aerointel) {
    innerScenes.aerointel.children.forEach(child => {
      if (child.userData.isRotor) {
        child.rotation.z = time * 10;
      }
      if (child.userData.isBeam) {
        child.material.opacity = 0.2 + Math.sin(time * 3 + child.userData.angle) * 0.2;
        child.scale.y = 1 + Math.sin(time * 2 + child.userData.angle) * 0.2;
      }
    });
  }

  // Dutch Drones animations
  if (innerScenes.dutchdrones) {
    innerScenes.dutchdrones.children.forEach(child => {
      if (child.userData.isDroneArm) {
        child.position.x = Math.sin(time * 0.5) * 0.3;
        child.rotation.z = Math.sin(time * 2) * 0.1;
      }
      if (child.userData.isBrush) {
        child.rotation.z = time * 5;
      }
      if (child.userData.isCleaningParticle) {
        child.position.y = 0.15 + Math.sin(time * 3 + child.userData.offset) * 0.05;
        child.material.opacity = 0.3 + Math.sin(time * 5 + child.userData.offset) * 0.3;
      }
    });
  }

  // DataDividend animations
  if (innerScenes.datadividend) {
    innerScenes.datadividend.children.forEach(child => {
      if (child.userData.isCentralNode) {
        child.rotation.x = time * 0.5;
        child.rotation.y = time * 0.3;
      }
      if (child.userData.isDataNode) {
        const offset = child.userData.offset;
        child.position.copy(child.userData.originalPos);
        child.position.multiplyScalar(1 + Math.sin(time * 2 + offset) * 0.1);
        child.rotation.x = time + offset;
        child.rotation.y = time * 0.5 + offset;
      }
      if (child.userData.isFloatingData) {
        child.position.add(child.userData.velocity);
        // Wrap around
        ['x', 'y', 'z'].forEach(axis => {
          if (Math.abs(child.position[axis]) > 0.6) {
            child.position[axis] *= -1;
          }
        });
      }
    });
  }

  // text.me animations
  if (innerScenes.textme) {
    innerScenes.textme.children.forEach(child => {
      if (child.userData.isBubble) {
        const delay = child.userData.delay;
        child.position.y = child.userData.originalY + Math.sin(time * 2 + delay) * 0.01;
        child.material.opacity = 0.6 + Math.sin(time * 3 + delay) * 0.2;
      }
      if (child.userData.isEmoji) {
        const angle = child.userData.angle + time * 0.5;
        child.position.x = Math.cos(angle) * 0.4;
        child.position.y = Math.sin(angle) * 0.3;
      }
    });
  }

  // About animations
  if (innerScenes.about) {
    innerScenes.about.children.forEach(child => {
      if (child.userData.isSkillOrb) {
        const angle = child.userData.baseAngle + time * 0.5;
        child.position.x = Math.cos(angle) * 0.4;
        child.position.z = Math.sin(angle) * 0.4;
        child.position.y = 0.1 + Math.sin(time * 2 + child.userData.baseAngle) * 0.05;
      }
    });
  }

  // Contact animations
  if (innerScenes.contact) {
    innerScenes.contact.children.forEach(child => {
      if (child.userData.isHub) {
        child.rotation.x = time * 0.5;
        child.rotation.y = time * 0.3;
      }
      if (child.userData.isConnectionPoint) {
        const pulse = Math.sin(time * 3 + child.userData.baseAngle);
        child.scale.setScalar(1 + pulse * 0.2);
      }
      if (child.userData.isPulseRing) {
        const scale = 1 + (time * 0.3 + child.userData.ringIndex * 0.5) % 1;
        child.scale.setScalar(scale);
        child.material.opacity = 0.3 * (1 - ((time * 0.3 + child.userData.ringIndex * 0.5) % 1));
      }
    });
  }
}

// ============================================================
// START
// ============================================================

init();
