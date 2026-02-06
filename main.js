import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Logo URLs
const LOGOS = {
  aerointel: '/logos/aerointel.png',
  dutchdrones: '/logos/dutchdrones.png',
  datadividend: '/logos/datadividend.svg',
  textme: '/logos/textme.svg',
};

// ============================================================
// DATA
// ============================================================

const FACES = {
  front: {
    id: 'aerointel',
    name: 'AEROINTEL',
    tagline: 'Unjammable navigation for autonomous drones.',
    description: 'Pathfinder is a fully embedded visual navigation module that replaces GPS using on-board AI—satellite imagery matching, road/building recognition—designed to operate completely offline in GPS/RF-denied environments.',
    tags: ['Defense', 'Computer Vision', 'SLAM', 'Edge AI'],
  },
  back: {
    id: 'dutchdrones',
    name: 'Dutch Drones',
    tagline: 'Drone-based bridge cleaning and inspection.',
    description: 'Robotic systems that inspect and clean infrastructure—without personnel at height and with minimal road closures.',
    tags: ['Robotics', 'Infrastructure', 'Automation'],
  },
  right: {
    id: 'datadividend',
    name: 'DataDividend',
    tagline: 'Privacy-first marketplace for AI training data.',
    description: 'Contributors upload photos, videos, sensor streams. Our system prices each asset based on rarity, quality, and demand. Buyers get provenance-verified datasets with clean rights.',
    tags: ['Data Markets', 'AI/ML', 'Privacy'],
  },
  left: {
    id: 'textme',
    name: 'text.me',
    tagline: 'AI coaching that lives in WhatsApp.',
    description: 'Personal development, accountability, and guidance—delivered through the chat you already use every day.',
    tags: ['LLMs', 'Coaching', 'Conversational AI'],
  },
  top: {
    id: 'about',
    name: 'About',
    tagline: 'Aerospace engineer building autonomous systems and AI.',
    isAbout: true,
  },
  bottom: {
    id: 'contact',
    name: 'Contact',
    tagline: 'Let\'s build something.',
    isContact: true,
  },
};

// ============================================================
// SCENE SETUP
// ============================================================

let scene, camera, renderer, clock;
let cubeGroup, wireframe;
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };
let rotation = { x: 0.3, y: 0.5 };
let targetRotation = { x: 0.3, y: 0.5 };
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let abstractShapes = {};
let logoSprites = {};
const textureLoader = new THREE.TextureLoader();

function init() {
  clock = new THREE.Clock();

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);

  // Camera
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Group
  cubeGroup = new THREE.Group();
  scene.add(cubeGroup);

  // Create elements
  createWireframeCube();
  createAbstractShapes();
  createFacePlanes();
  createLogoPlanes();

  // Events
  setupEvents();

  // Hide loader
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 800);

  animate();
}

function createWireframeCube() {
  const size = 2;
  const geometry = new THREE.BoxGeometry(size, size, size);
  const edges = new THREE.EdgesGeometry(geometry);
  
  wireframe = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.15 
    })
  );
  cubeGroup.add(wireframe);

  // Corner points
  const corners = [
    [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
    [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1]
  ];

  corners.forEach(pos => {
    const point = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    );
    point.position.set(...pos);
    cubeGroup.add(point);
  });
}

function createAbstractShapes() {
  // AEROINTEL - Trajectory/path (front, +z)
  const aerointelGroup = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.5, -0.3, 0),
    new THREE.Vector3(-0.2, 0.1, 0.1),
    new THREE.Vector3(0.1, -0.1, -0.1),
    new THREE.Vector3(0.4, 0.2, 0),
    new THREE.Vector3(0.6, 0, 0.1),
  ]);
  const points = curve.getPoints(50);
  const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const path = new THREE.Line(pathGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
  aerointelGroup.add(path);
  
  // Moving point on path
  const pathPoint = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  pathPoint.userData.curve = curve;
  pathPoint.userData.progress = 0;
  aerointelGroup.add(pathPoint);
  
  aerointelGroup.position.z = 0.3;
  aerointelGroup.userData.id = 'aerointel';
  abstractShapes.aerointel = aerointelGroup;
  cubeGroup.add(aerointelGroup);

  // Dutch Drones - Intersecting planes (back, -z)
  const dutchGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.6),
      new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.08,
        side: THREE.DoubleSide 
      })
    );
    plane.rotation.x = (i * Math.PI) / 3;
    plane.rotation.y = (i * Math.PI) / 4;
    dutchGroup.add(plane);
  }
  dutchGroup.position.z = -0.3;
  dutchGroup.rotation.y = Math.PI;
  dutchGroup.userData.id = 'dutchdrones';
  abstractShapes.dutchdrones = dutchGroup;
  cubeGroup.add(dutchGroup);

  // DataDividend - Connected nodes (right, +x)
  const dataGroup = new THREE.Group();
  const nodePositions = [
    [0, 0, 0],
    [0.3, 0.2, 0.1],
    [-0.2, 0.3, -0.1],
    [0.1, -0.3, 0.2],
    [-0.3, -0.1, -0.2],
    [0.25, -0.15, -0.15],
  ];
  
  const nodes = [];
  nodePositions.forEach((pos, i) => {
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(i === 0 ? 0.04 : 0.025, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: i === 0 ? 0.8 : 0.5 })
    );
    node.position.set(...pos);
    node.userData.originalPos = new THREE.Vector3(...pos);
    dataGroup.add(node);
    nodes.push(node);
  });
  
  // Lines connecting to center
  nodes.slice(1).forEach(node => {
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      node.position.clone()
    ]);
    const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }));
    line.userData.targetNode = node;
    dataGroup.add(line);
  });
  
  dataGroup.position.x = 0.3;
  dataGroup.rotation.y = Math.PI / 2;
  dataGroup.userData.id = 'datadividend';
  dataGroup.userData.nodes = nodes;
  abstractShapes.datadividend = dataGroup;
  cubeGroup.add(dataGroup);

  // text.me - Floating circles (left, -x)
  const textGroup = new THREE.Group();
  const circleRadii = [0.15, 0.25, 0.35];
  circleRadii.forEach((r, i) => {
    const circle = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0).getPoints(64)
      ),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 + i * 0.1 })
    );
    circle.rotation.x = Math.PI / 2;
    circle.userData.baseY = (i - 1) * 0.15;
    circle.position.y = circle.userData.baseY;
    textGroup.add(circle);
  });
  
  // Center dot
  const centerDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  textGroup.add(centerDot);
  
  textGroup.position.x = -0.3;
  textGroup.rotation.y = -Math.PI / 2;
  textGroup.userData.id = 'textme';
  abstractShapes.textme = textGroup;
  cubeGroup.add(textGroup);

  // About - Singular point with orbits (top, +y)
  const aboutGroup = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.06, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
  );
  aboutGroup.add(core);
  
  // Orbital rings
  [0.2, 0.35].forEach((r, i) => {
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0).getPoints(64)
      ),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 + i * 0.05 })
    );
    ring.rotation.x = Math.PI / 2 + i * 0.3;
    ring.rotation.z = i * 0.5;
    aboutGroup.add(ring);
  });
  
  aboutGroup.position.y = 0.3;
  aboutGroup.rotation.x = -Math.PI / 2;
  aboutGroup.userData.id = 'about';
  abstractShapes.about = aboutGroup;
  cubeGroup.add(aboutGroup);

  // Contact - Radiating lines (bottom, -y)
  const contactGroup = new THREE.Group();
  const rayCount = 8;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const length = 0.3 + Math.random() * 0.15;
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * length, Math.sin(angle) * length, 0)
    ]);
    const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
    line.userData.baseOpacity = 0.3;
    line.userData.phase = i / rayCount;
    contactGroup.add(line);
  }
  
  const contactCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  contactGroup.add(contactCore);
  
  contactGroup.position.y = -0.3;
  contactGroup.rotation.x = Math.PI / 2;
  contactGroup.userData.id = 'contact';
  abstractShapes.contact = contactGroup;
  cubeGroup.add(contactGroup);
}

function createFacePlanes() {
  const size = 2;
  const faceConfigs = {
    front: { pos: [0, 0, 1.01], rot: [0, 0, 0] },
    back: { pos: [0, 0, -1.01], rot: [0, Math.PI, 0] },
    right: { pos: [1.01, 0, 0], rot: [0, Math.PI / 2, 0] },
    left: { pos: [-1.01, 0, 0], rot: [0, -Math.PI / 2, 0] },
    top: { pos: [0, 1.01, 0], rot: [-Math.PI / 2, 0, 0] },
    bottom: { pos: [0, -1.01, 0], rot: [Math.PI / 2, 0, 0] },
  };

  Object.entries(faceConfigs).forEach(([face, config]) => {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0,
        side: THREE.DoubleSide 
      })
    );
    plane.position.set(...config.pos);
    plane.rotation.set(...config.rot);
    plane.userData = { face, data: FACES[face] };
    cubeGroup.add(plane);
  });
}

function createLogoPlanes() {
  const logoConfigs = {
    front: { id: 'aerointel', pos: [0, 0, 0.5], rot: [0, 0, 0] },
    back: { id: 'dutchdrones', pos: [0, 0, -0.5], rot: [0, Math.PI, 0] },
    right: { id: 'datadividend', pos: [0.5, 0, 0], rot: [0, Math.PI / 2, 0] },
    left: { id: 'textme', pos: [-0.5, 0, 0], rot: [0, -Math.PI / 2, 0] },
  };

  Object.entries(logoConfigs).forEach(([face, config]) => {
    const logoUrl = LOGOS[config.id];
    if (!logoUrl) return;

    textureLoader.load(logoUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Calculate aspect ratio
      const aspect = texture.image.width / texture.image.height;
      const height = 0.5;
      const width = height * aspect;
      
      const logoPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.min(width, 1.2), height),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        })
      );
      
      logoPlane.position.set(...config.pos);
      logoPlane.rotation.set(...config.rot);
      logoSprites[config.id] = logoPlane;
      cubeGroup.add(logoPlane);
    });
  });
}

// ============================================================
// EVENTS
// ============================================================

function setupEvents() {
  const canvas = document.getElementById('canvas');
  
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (isDragging) {
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      velocity = { x: dy * 0.003, y: dx * 0.003 };
      targetRotation.x += dy * 0.003;
      targetRotation.y += dx * 0.003;
      targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.x));
      prevMouse = { x: e.clientX, y: e.clientY };
    }
    
    updateFaceLabel();
  });

  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mouseleave', () => isDragging = false);

  canvas.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(cubeGroup.children);
    const faceHit = hits.find(h => h.object.userData.data);
    if (faceHit) openPanel(faceHit.object.userData.data);
  });

  // Touch
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - prevMouse.x;
      const dy = e.touches[0].clientY - prevMouse.y;
      targetRotation.x += dy * 0.003;
      targetRotation.y += dx * 0.003;
      targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.x));
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => isDragging = false);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.getElementById('panel-close').addEventListener('click', closePanel);

  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const face = link.dataset.face;
      if (face === 'about') gsap.to(targetRotation, { x: -Math.PI / 2, y: 0, duration: 1.2, ease: 'power2.inOut' });
      if (face === 'contact') gsap.to(targetRotation, { x: Math.PI / 2, y: 0, duration: 1.2, ease: 'power2.inOut' });
    });
  });
}

// ============================================================
// UI
// ============================================================

function updateFaceLabel() {
  const normals = {
    front: new THREE.Vector3(0, 0, 1),
    back: new THREE.Vector3(0, 0, -1),
    right: new THREE.Vector3(1, 0, 0),
    left: new THREE.Vector3(-1, 0, 0),
    top: new THREE.Vector3(0, 1, 0),
    bottom: new THREE.Vector3(0, -1, 0),
  };

  const camDir = new THREE.Vector3(0, 0, 1);
  let maxDot = -Infinity;
  let facing = null;

  Object.entries(normals).forEach(([face, normal]) => {
    const rotated = normal.clone().applyEuler(cubeGroup.rotation);
    const dot = rotated.dot(camDir);
    if (dot > maxDot) { maxDot = dot; facing = face; }
  });

  const label = document.getElementById('face-label');
  if (facing && maxDot > 0.6) {
    const data = FACES[facing];
    label.querySelector('h2').textContent = data.name;
    label.querySelector('p').textContent = data.tagline;
    label.classList.add('visible');
  } else {
    label.classList.remove('visible');
  }
}

function openPanel(data) {
  const panel = document.getElementById('panel');
  const content = document.getElementById('panel-content');

  let html = '';

  if (data.isAbout) {
    html = `
      <h3>About</h3>
      <h2>Jasper Lortije</h2>
      <p class="tagline">${data.tagline}</p>
      <p class="description">Aerospace engineering background. Building four ventures across defense, infrastructure, data, and consumer AI.</p>
      <div class="tags">
        <span class="tag">TU Delft</span>
        <span class="tag">Aerospace</span>
        <span class="tag">Founder</span>
      </div>
    `;
  } else if (data.isContact) {
    html = `
      <h3>Contact</h3>
      <h2>Let's connect</h2>
      <p class="tagline">${data.tagline}</p>
      <div class="links">
        <a href="mailto:jasper@lortije.com" class="link">
          <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          jasper@lortije.com
        </a>
        <a href="https://linkedin.com/in/jasperlortije" target="_blank" class="link">
          <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
          </svg>
          LinkedIn
        </a>
        <a href="https://twitter.com/jasperlortije" target="_blank" class="link">
          <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5 0-.28-.03-.56-.08-.83A7.72 7.72 0 0 0 23 3z"/>
          </svg>
          Twitter
        </a>
      </div>
    `;
  } else {
    html = `
      <h3>Venture</h3>
      <h2>${data.name}</h2>
      <p class="tagline">${data.tagline}</p>
      <p class="description">${data.description}</p>
      <div class="tags">
        ${data.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
    `;
  }

  content.innerHTML = html;
  panel.classList.add('visible');
}

function closePanel() {
  document.getElementById('panel').classList.remove('visible');
}

// ============================================================
// ANIMATION
// ============================================================

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Auto-rotate when idle
  if (!isDragging) {
    targetRotation.y += 0.0008;
    velocity.x *= 0.95;
    velocity.y *= 0.95;
  }

  // Smooth rotation
  rotation.x += (targetRotation.x - rotation.x) * 0.06;
  rotation.y += (targetRotation.y - rotation.y) * 0.06;
  cubeGroup.rotation.x = rotation.x;
  cubeGroup.rotation.y = rotation.y;

  // Animate abstract shapes
  animateShapes(t);

  renderer.render(scene, camera);
}

function animateShapes(t) {
  // AEROINTEL - point along path
  if (abstractShapes.aerointel) {
    abstractShapes.aerointel.children.forEach(child => {
      if (child.userData.curve) {
        child.userData.progress = (child.userData.progress + 0.003) % 1;
        const pos = child.userData.curve.getPoint(child.userData.progress);
        child.position.copy(pos);
      }
    });
  }

  // Dutch Drones - rotating planes
  if (abstractShapes.dutchdrones) {
    abstractShapes.dutchdrones.rotation.z = t * 0.1;
  }

  // DataDividend - pulsing nodes
  if (abstractShapes.datadividend) {
    const nodes = abstractShapes.datadividend.userData.nodes;
    if (nodes) {
      nodes.slice(1).forEach((node, i) => {
        const pulse = 1 + Math.sin(t * 2 + i) * 0.1;
        node.position.copy(node.userData.originalPos).multiplyScalar(pulse);
      });
    }
    // Update lines
    abstractShapes.datadividend.children.forEach(child => {
      if (child.userData.targetNode) {
        const positions = child.geometry.attributes.position.array;
        positions[3] = child.userData.targetNode.position.x;
        positions[4] = child.userData.targetNode.position.y;
        positions[5] = child.userData.targetNode.position.z;
        child.geometry.attributes.position.needsUpdate = true;
      }
    });
  }

  // text.me - floating circles
  if (abstractShapes.textme) {
    abstractShapes.textme.children.forEach((child, i) => {
      if (child.userData.baseY !== undefined) {
        child.position.y = child.userData.baseY + Math.sin(t * 0.8 + i) * 0.03;
      }
    });
  }

  // About - rotating
  if (abstractShapes.about) {
    abstractShapes.about.children[0].rotation.x = t * 0.3;
    abstractShapes.about.children[0].rotation.y = t * 0.2;
  }

  // Contact - pulsing rays
  if (abstractShapes.contact) {
    abstractShapes.contact.children.forEach(child => {
      if (child.userData.phase !== undefined) {
        const pulse = 0.2 + Math.sin(t * 2 + child.userData.phase * Math.PI * 2) * 0.15;
        child.material.opacity = pulse;
      }
    });
  }
}

// ============================================================
// START
// ============================================================

init();
