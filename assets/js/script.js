'use strict';

// ── Loading splash ──────────────────────────────────────────────
const splashBar = document.getElementById('splash-bar');
const splashStatus = document.getElementById('splash-status');
const splashEl = document.getElementById('splash');
let prog = 0;
const msgs = ['LOADING ASSETS...','MAPPING PLANETS...','PLACING ORBS...','DOCKING SHIP...','READY'];
let mi = 0;
const splashTimer = setInterval(() => {
  prog += Math.random() * 18;
  if (prog >= 100) { prog = 100; clearInterval(splashTimer); }
  splashBar.style.width = prog + '%';
  splashStatus.textContent = msgs[Math.min(mi++, msgs.length - 1)];
}, 100);
// ── Renderer ─────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const W = () => window.innerWidth;
const H = () => window.innerHeight;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W(), H());
renderer.setClearColor(0x000408, 1);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000408, 0.022);
const camera = new THREE.PerspectiveCamera(65, W() / H(), 0.1, 400);
// ── Lights ────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x002244, 3));
const sun = new THREE.DirectionalLight(0x4488ff, 2);
sun.position.set(10, 10, 10);
scene.add(sun);
const ptC = new THREE.PointLight(0x00ffff, 3, 40);
ptC.position.set(0, 0, 0);
scene.add(ptC);
const ptM = new THREE.PointLight(0xff00ff, 2, 40);
ptM.position.set(5, -3, 5);
scene.add(ptM);
// ── Stars ─────────────────────────────────────────────────────────
const sg = new THREE.BufferGeometry();
const sp = new Float32Array(3000 * 3);
for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 350;
sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.8 })));
// ── Floating particles ────────────────────────────────────────────
const pg = new THREE.BufferGeometry();
const pp = new Float32Array(500 * 3);
for (let i = 0; i < pp.length; i++) pp[i] = (Math.random() - 0.5) * 100;
pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
const particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x00ffff, size: 0.05, transparent: true, opacity: 0.35 }));
scene.add(particles);
// ── Grid ──────────────────────────────────────────────────────────
const grid = new THREE.GridHelper(200, 100, 0x003366, 0x001133);
grid.position.y = -8;
grid.material.transparent = true;
grid.material.opacity = 0.28;
scene.add(grid);
// ── Spaceship ─────────────────────────────────────────────────────
const loader = new THREE.GLTFLoader();
const shipGroup = new THREE.Group();
scene.add(shipGroup);
loader.load('Objects/GalacticShip.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.2, 0.2, 0.2); 
  model.rotation.y = Math.PI / 2; 
  shipGroup.add(model);
}, undefined, (error) => {
  console.error("An error happened loading the ship:", error);
});
const ptShip = new THREE.PointLight(0xffffff, 3, 12);
ptShip.position.set(0, 2, 0);
shipGroup.add(ptShip);
// ── Helpers ───────────────────────────────────────────────────────
function makeTexture(drawFn, w, h) {
  const tc = document.createElement('canvas');
  tc.width = w; tc.height = h;
  drawFn(tc.getContext('2d'), w, h);
  return new THREE.CanvasTexture(tc);
}
function drawLabel(ctx, w, h, text) {
  ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#0ff'; ctx.font = 'bold 40px Courier New'; ctx.textAlign = 'center';
  ctx.fillText(text.toUpperCase(), w/2, h/2);
}
// ── Planets ───────────────────────────────────────────────────────
const panelDefs = [
  { pos: new THREE.Vector3(0,  3, -35), color: 0x00aaff, edge: 0x00ffff, r: 1.0, id: 'about', label: 'BIO', model: 'Objects/Earth.glb' },
  { pos: new THREE.Vector3(33.3, 3,  -10.8), color: 0xcc00ff, edge: 0xff44ff, r: 0.9, id: 'skills', label: 'SKILLS', model: 'Objects/Saturn.glb' },
  { pos: new THREE.Vector3(20.6, 3,  28.3), color: 0x00ff88, edge: 0x00ff88, r: 0.8, id: 'projects', label: 'WORK', model: 'Objects/Marte.glb' },
  { pos: new THREE.Vector3(-20.6,  3,  28.3), color: 0xffaa00, edge: 0xffcc44, r: 0.6, id: 'contact', label: 'CONTACT', model: 'Objects/Jupiter.glb' },
  { pos: new THREE.Vector3(-33.3, 3, -10.8), color: 0xff4466, edge: 0xff88aa, r: 1.6, id: 'blog', label: 'BLOG', model: 'Objects/Neptune.glb' },
];
const panelGroups = [];
const rayTargets = [];
panelDefs.forEach(pd => {
  const g = new THREE.Group();
  g.position.copy(pd.pos);
  g.userData.panelId = pd.id;
  g.userData.basePosY = pd.pos.y;
loader.load(pd.model, (gltf) => {
  const model = gltf.scene;
  model.name = "planetModel";
  model.scale.set(pd.r, pd.r, pd.r);
  g.add(model);
});
const planet = new THREE.Mesh(
  new THREE.SphereGeometry(2, 8, 8),
  new THREE.MeshBasicMaterial({ visible: false })
);
g.add(planet);
  rayTargets.push(planet);
  planet.userData.panelId = pd.id;
  const tex = makeTexture((ctx, w, h) => drawLabel(ctx, w, h, pd.label), 256, 128);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  label.name = "planetLabel";
  label.position.y = pd.r + 4.5;
  g.add(label);
  const beacon = new THREE.PointLight(pd.edge, 2, 15);
  g.add(beacon);
  scene.add(g);
  panelGroups.push(g);
});
// ── Input ─────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup',   e => { keys[e.key.toLowerCase()] = false; });
let shipVel = 0, shipAngle = 0;
const ACCEL = 0.007, DECEL = 0.96, MAX_VEL = 0.25, TURN_SPEED = 0.025;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
canvas.addEventListener('click', e => {
  if (document.getElementById('modal').classList.contains('open')) return;
  const rect = canvas.getBoundingClientRect();
  mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(rayTargets);
  if (hits.length > 0) openModal(hits[0].object.userData.panelId);
});
const mobileMapping = {'btn-up': 'w','btn-down': 's','btn-left': 'a','btn-right': 'd'};
Object.keys(mobileMapping).forEach(id => {
  const btn = document.getElementById(id);
  const key = mobileMapping[id];
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
  btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
});
// ── Modal content ─────────────────────────────────────────────────
window.openModal = function(id) {
  const tpl = document.getElementById('tpl-' + id);
  if (tpl) {
    document.getElementById('modal-content').innerHTML = tpl.innerHTML;
  }
  document.getElementById('modal').classList.add('open');
}
window.closeModal = function() {
  document.getElementById('modal').classList.remove('open');
}
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
// ── Animation loop ────────────────────────────────────────────────
const velEl = document.getElementById('vel');
const hdgEl = document.getElementById('hdg');
const clock  = new THREE.Clock();
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  elapsed += dt;
  if (keys['a'] || keys['arrowleft'])  shipAngle += TURN_SPEED;
  if (keys['d'] || keys['arrowright']) shipAngle -= TURN_SPEED;
  if (keys['w'] || keys['arrowup'])    shipVel = Math.min(shipVel + ACCEL, MAX_VEL);
  else if (keys['s'] || keys['arrowdown']) shipVel = Math.max(shipVel - ACCEL, -MAX_VEL * 0.5);
  else shipVel *= DECEL;
  if (Math.abs(shipVel) < 0.0004) shipVel = 0;
  const dir = new THREE.Vector3(Math.sin(shipAngle), 0, Math.cos(shipAngle));
  shipGroup.position.addScaledVector(dir, -shipVel);
  shipGroup.rotation.y = shipAngle;
  const offset = new THREE.Vector3(0, 1.2, 4.5).applyEuler(new THREE.Euler(0, shipAngle, 0));
  camera.position.lerp(shipGroup.position.clone().add(offset), 0.07);
  camera.lookAt(shipGroup.position.clone().add(new THREE.Vector3(0, 0.25, 0)));
  panelGroups.forEach((p, i) => {
    p.position.y = p.userData.basePosY + Math.sin(elapsed * 0.4 + i * 1.6) * 0.4;
    const model = p.getObjectByName("planetModel");
    if (model) model.rotation.y += 0.005; 
    const label = p.getObjectByName("planetLabel");
    if (label) label.lookAt(camera.position);
  });
  particles.rotation.y = elapsed * 0.009;
  ptC.intensity = 2.5 + Math.sin(elapsed * 1.6) * 0.6;
  ptM.intensity = 1.8 + Math.cos(elapsed * 2.1) * 0.5;
  velEl.textContent = (Math.abs(shipVel) * 100).toFixed(1);
  hdgEl.textContent = String(Math.round(((shipAngle * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, '0') + '°';
  renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
  camera.aspect = W() / H();
  camera.updateProjectionMatrix();
  renderer.setSize(W(), H());
});
setTimeout(() => {
  splashEl.classList.add('hide');
  setTimeout(() => splashEl.remove(), 900);
  animate();
}, 1400);