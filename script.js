'use strict';
/* ============================================
   EID AL-ADHA — ENHANCED SCRIPT v2
   All 3D rendering via Canvas 2D (perspective projection)
   ============================================ */

// ===== STATE =====
let currentScene = 0;
const TOTAL_SCENES = 4;
const SCENE_LABELS = ['الطواف حول الكعبة', 'وقفة عرفات', 'رمي الجمرات', 'عيد الأضحى'];
let isTransitioning = false;
let autoTimer = null;
const AUTO_MS = 9000;
let W = window.innerWidth, H = window.innerHeight;
let soundOn = false;
let audioCtx = null;
let ambientNodes = [];
let time = 0;

// Canvas references
let bgCanvas, bgCtx;
let canvases = {};
let ctxs = {};
let rafs = {};

// ===== INIT =====
window.addEventListener('load', () => {
  W = window.innerWidth; H = window.innerHeight;
  initBg();
  initDust();
  initDots();
  initAllCanvases();
  showScene(0, false);
  scheduleAuto();
  initInput();
  window.addEventListener('resize', onResize);
  requestAnimationFrame(bgLoop);
});

function onResize() {
  W = window.innerWidth; H = window.innerHeight;
  bgCanvas.width = W; bgCanvas.height = H;
  document.querySelectorAll('.scene-canvas').forEach(c => {
    c.width = W; c.height = H;
  });
}

// ===== BG STARS =====
let stars = [];
function initBg() {
  bgCanvas = document.getElementById('bgCanvas');
  bgCtx = bgCanvas.getContext('2d');
  bgCanvas.width = W; bgCanvas.height = H;
  for (let i = 0; i < 260; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H * .65,
      r: Math.random() * 1.8, ph: Math.random() * Math.PI * 2,
      sp: .004 + Math.random() * .009
    });
  }
}
function bgLoop() {
  bgCtx.clearRect(0, 0, W, H);
  const t = Date.now() / 1000;
  stars.forEach(s => {
    const op = .25 + .75 * Math.abs(Math.sin(t * s.sp * 10 + s.ph));
    bgCtx.beginPath();
    bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(255,255,220,${op.toFixed(2)})`;
    bgCtx.fill();
  });
  requestAnimationFrame(bgLoop);
}

// ===== GOLD DUST =====
function initDust() {
  const c = document.getElementById('goldDust');
  for (let i = 0; i < 35; i++) {
    const d = document.createElement('div');
    d.className = 'dust';
    const sz = 2 + Math.random() * 4;
    const alpha = .4 + Math.random() * .6;
    d.style.cssText = `
      left:${Math.random() * 100}%;bottom:${Math.random() * 15}%;
      width:${sz}px;height:${sz}px;
      background:radial-gradient(circle,rgba(245,200,66,${alpha}),transparent);
      animation-duration:${9 + Math.random() * 16}s;
      animation-delay:-${Math.random() * 16}s;
    `;
    c.appendChild(d);
  }
}

// ===== SCENE DOTS =====
function initDots() {
  const c = document.getElementById('sceneDots');
  const labels = ['الطواف', 'عرفات', 'الجمرات', 'العيد'];
  for (let i = 0; i < TOTAL_SCENES; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.title = labels[i]; d.onclick = () => goToScene(i);
    c.appendChild(d);
  }
  updateProgress(0);
}
function updateDots() {
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentScene));
}
function updateProgress(i) {
  document.getElementById('progressBar').style.width = `${(i / (TOTAL_SCENES - 1)) * 100}%`;
  document.getElementById('sceneLabel').textContent = SCENE_LABELS[i] || '';
}

// ===== CANVAS INIT =====
function initAllCanvases() {
  ['tawaf', 'arafat', 'jamarat', 'eid'].forEach(name => {
    const c = document.getElementById(name + 'Canvas');
    c.width = W; c.height = H;
    canvases[name] = c;
    ctxs[name] = c.getContext('2d');
  });
}

// ===== SCENE TRANSITIONS =====
function showScene(idx, animate = true) {
  document.querySelectorAll('.scene').forEach((s, i) => {
    s.classList.remove('entering', 'exiting', 'active');
    if (i === idx) {
      s.classList.add('active');
      if (animate) {
        s.classList.add('entering');
        setTimeout(() => s.classList.remove('entering'), 1300);
      }
    }
  });
  currentScene = idx;
  updateDots(); updateProgress(idx);
  startSceneLoop(idx);
  updateNavBtns();
}

function goToScene(idx) {
  if (isTransitioning || idx === currentScene) return;
  isTransitioning = true;
  clearAuto();
  const old = document.querySelectorAll('.scene')[currentScene];
  stopSceneLoop(currentScene);
  old.classList.add('exiting');
  setTimeout(() => {
    old.classList.remove('active', 'exiting');
    showScene(idx, true);
    isTransitioning = false;
    scheduleAuto();
  }, 900);
}

// FIXED: right = next (forward in RTL), left = prev
function nextScene() { goToScene((currentScene + 1) % TOTAL_SCENES); }
function prevScene() { goToScene((currentScene - 1 + TOTAL_SCENES) % TOTAL_SCENES); }
function skipToEid() { goToScene(3); }

function updateNavBtns() {
  document.getElementById('prevBtn').style.opacity = currentScene === 0 ? '0.25' : '1';
  document.getElementById('nextBtn').style.opacity = currentScene === TOTAL_SCENES - 1 ? '0.25' : '1';
}

// ===== AUTO ADVANCE =====
function scheduleAuto() {
  clearAuto();
  autoTimer = setTimeout(() => { if (currentScene < TOTAL_SCENES - 1) nextScene(); }, AUTO_MS);
}
function clearAuto() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }

// ===== INPUT =====
function initInput() {
  // Keyboard — fixed direction
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextScene();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevScene();
  });
  // Touch swipe
  let tx = 0;
  window.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  window.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 55) { dx < 0 ? nextScene() : prevScene(); }
  }, { passive: true });
  // Wheel
  let wc = false;
  window.addEventListener('wheel', e => {
    if (wc) return; wc = true;
    setTimeout(() => wc = false, 1100);
    e.deltaY > 0 ? nextScene() : prevScene();
  }, { passive: true });
}

// ===== SCENE LOOP MANAGER =====
function startSceneLoop(idx) {
  stopSceneLoop(idx);
  const loops = [loopTawaf, loopArafat, loopJamarat, loopEid];
  if (loops[idx]) loops[idx]();
}
function stopSceneLoop(idx) {
  if (rafs[idx]) { cancelAnimationFrame(rafs[idx]); rafs[idx] = null; }
  if (idx === 3) stopFireworks();
}

// ============================================================
//  SCENE 1: TAWAF — Full 3D perspective canvas
// ============================================================
const tawaf = {
  angle: 0, // rotation of the tawaf ring
  kaabaRot: 0,
  pilgrims: [],
  moons: [],
  lights: []
};

function initTawaf() {
  if (tawaf.pilgrims.length) return;
  // Two rings of pilgrims
  const rings = [{ r: 0.18, count: 22, sp: 0.008 }, { r: 0.13, count: 16, sp: -0.006 }, { r: 0.23, count: 28, sp: 0.005 }];
  rings.forEach(ring => {
    for (let i = 0; i < ring.count; i++) {
      tawaf.pilgrims.push({
        ringR: ring.r,
        angle: (i / ring.count) * Math.PI * 2,
        speed: ring.sp,
        hue: 20 + Math.random() * 30,
        scale: .7 + Math.random() * .5,
        phase: Math.random() * Math.PI * 2,
        sinA: .15 + Math.random() * .1
      });
    }
  });
}

function loopTawaf() {
  initTawaf();
  const ctx = ctxs.tawaf;
  function draw() {
    if (currentScene !== 0) return;
    rafs[0] = requestAnimationFrame(draw);
    const t = Date.now() / 1000;
    ctx.clearRect(0, 0, W, H);

    // --- Night sky ---
    const sky = ctx.createRadialGradient(W / 2, 0, 0, W / 2, H / 2, H);
    sky.addColorStop(0, '#1a0a3d');
    sky.addColorStop(.4, '#0a1a4a');
    sky.addColorStop(1, '#020510');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars shimmer
    stars.slice(0, 140).forEach(s => {
      const op = .2 + .8 * Math.abs(Math.sin(t * s.sp * 10 + s.ph));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,220,${op})`; ctx.fill();
    });

    // --- Crescent moon ---
    const mx = W * .82, my = H * .09;
    ctx.save();
    ctx.shadowBlur = 30; ctx.shadowColor = 'rgba(245,200,66,.8)';
    ctx.beginPath(); ctx.arc(mx, my + Math.sin(t * .3) * 6, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245,200,66,.95)'; ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 14, my + Math.sin(t * .3) * 6 - 4, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#0a1a4a'; ctx.fill();
    ctx.restore();

    // Star near moon
    const starAngle = t * .5;
    ctx.save();
    ctx.translate(mx + 32, my - 10 + Math.sin(t * .4) * 4);
    ctx.rotate(starAngle);
    ctx.fillStyle = 'rgba(245,200,66,.9)';
    ctx.font = `${clamp(10, 14, W / 80)}px serif`; ctx.textAlign = 'center';
    ctx.fillText('★', 0, 4); ctx.restore();

    // --- Marble ground ---
    const cX = W / 2, cY = H * .72;
    const gnd = ctx.createLinearGradient(0, cY, 0, H);
    gnd.addColorStop(0, 'rgba(200,180,150,.25)');
    gnd.addColorStop(.5, 'rgba(180,160,130,.55)');
    gnd.addColorStop(1, 'rgba(140,120,90,.9)');
    ctx.fillStyle = gnd; ctx.fillRect(0, cY, W, H);
    // Marble lines
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.globalAlpha = .06 + Math.sin(t * .2 + i) * .03;
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i * (W / 11), cY); ctx.lineTo(W / 2, H + 50);
      ctx.stroke(); ctx.restore();
    }

    // --- 3D Minarets ---
    const mPos = [.1, .22, .78, .9];
    const mH = [.45, .52, .52, .45];
    mPos.forEach((xr, i) => {
      draw3DMinaret(ctx, W * xr, H * mH[i], clamp(12, 24, W / 60), H * (.32 + .04 * (i % 2)), t);
    });

    // --- Masjid base arch ---
    draw3DMasjidBase(ctx, cX, H * .7, W * .6, H * .12, t);

    // --- 3D Kaaba ---
    tawaf.kaabaRot += .008;
    draw3DKaaba(ctx, cX, H * .48, clamp(55, 110, W * .12), tawaf.kaabaRot, t);

    // --- Tawaf pilgrim rings ---
    const baseR = clamp(70, W * .16, 160);
    tawaf.pilgrims.forEach(p => {
      p.angle += p.speed;
      const rx = baseR * (p.ringR / .18);
      const ry = rx * .35; // perspective squash
      const px = cX + rx * Math.cos(p.angle);
      // Ellipse y-projection
      const oy = ry * Math.sin(p.angle);
      const py = H * .62 + oy;
      const depthScale = .6 + .4 * ((Math.sin(p.angle) + 1) / 2);
      draw3DPilgrim(ctx, px, py - clamp(10, 22, W * .024), depthScale * p.scale, p.hue, t + p.phase);
    });

    // --- Kaaba glow on ground ---
    const radGlow = ctx.createRadialGradient(cX, H * .68, 0, cX, H * .68, clamp(60, W * .12, 130));
    radGlow.addColorStop(0, 'rgba(200,150,26,.18)');
    radGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radGlow; ctx.fillRect(0, 0, W, H);
  }
  draw();
}

function draw3DMinaret(ctx, x, y, w, h, t) {
  const sw = Math.sin(t * .5) * .02;
  ctx.save();
  ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(200,150,26,.3)';
  // Body
  const g = ctx.createLinearGradient(x - w / 2, y - h, x + w / 2, y);
  g.addColorStop(0, '#c8961a'); g.addColorStop(.5, '#8a6010'); g.addColorStop(1, '#3a2000');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w / 2 * 0.6, y - h); ctx.lineTo(x - w / 2 * 0.6, y - h);
  ctx.fill();
  // Balcony
  ctx.fillStyle = 'rgba(200,150,26,.6)';
  ctx.fillRect(x - w * .7, y - h * .55, w * 1.4, h * .05);
  // Spire
  ctx.beginPath();
  ctx.moveTo(x - 2, y - h); ctx.lineTo(x + 2, y - h); ctx.lineTo(x, y - h - 30);
  ctx.fillStyle = '#f5c842'; ctx.fill();
  // Crescent on top
  ctx.save(); ctx.translate(x, y - h - 38 + Math.sin(t * .4) * 3);
  ctx.rotate(sw);
  ctx.fillStyle = 'rgba(245,200,66,.9)';
  ctx.font = `${Math.round(w)}px serif`; ctx.textAlign = 'center';
  ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(245,200,66,.8)';
  ctx.fillText('☪', 0, 5); ctx.restore();
  ctx.restore();
}

function draw3DMasjidBase(ctx, cx, y, w, h, t) {
  ctx.save();
  const g = ctx.createLinearGradient(cx - w / 2, y - h, cx + w / 2, y);
  g.addColorStop(0, '#8a6010'); g.addColorStop(1, '#3a2000');
  ctx.fillStyle = g;
  ctx.fillRect(cx - w / 2, y - h, w, h);
  // Arches
  const arcCount = 7;
  const arcW = w / arcCount;
  for (let i = 0; i < arcCount; i++) {
    const ax = cx - w / 2 + i * arcW + arcW / 2;
    ctx.beginPath();
    ctx.arc(ax, y - h + arcW * .6, arcW * .42, Math.PI, 0, true);
    ctx.fillStyle = 'rgba(10,5,30,.85)'; ctx.fill();
    ctx.strokeStyle = 'rgba(200,150,26,.3)'; ctx.lineWidth = 1; ctx.stroke();
  }
  // Dome on top
  const domeCX = cx, domeCY = y - h - 2;
  const dW = w * .18, dH = h * .65;
  ctx.beginPath(); ctx.ellipse(domeCX, domeCY, dW, dH, 0, Math.PI, 0, true);
  const dg = ctx.createLinearGradient(domeCX - dW, domeCY, domeCX + dW, domeCY);
  dg.addColorStop(0, '#8a6010'); dg.addColorStop(.5, '#c8961a'); dg.addColorStop(1, '#8a6010');
  ctx.fillStyle = dg; ctx.fill();
  ctx.restore();
}

function draw3DKaaba(ctx, cx, cy, size, rot, t) {
  ctx.save();
  ctx.shadowBlur = 40; ctx.shadowColor = 'rgba(200,150,26,.4)';
  // Glow aura
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 1.8);
  aura.addColorStop(0, 'rgba(200,150,26,.1)');
  aura.addColorStop(.5, 'rgba(200,150,26,.05)');
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(cx, cy, size * 1.8, 0, Math.PI * 2); ctx.fill();

  // 3D box faces using rotation
  const s = size, hs = s * .55; // half depth for side face width
  // Compute face vertices
  const cosR = Math.cos(rot), sinR = Math.sin(rot);
  const pts = { // four corners of Kaaba top-down
    fl: [-s / 2, -s / 2], fr: [s / 2, -s / 2], br: [s / 2, s / 2], bl: [-s / 2, s / 2]
  };
  // Project to screen (simple perspective-lite)
  const project = (x, z) => {
    const rx = x * cosR - z * sinR;
    const rz = x * sinR + z * cosR;
    const pers = 1 / (1 + rz * .0005);
    return { x: cx + rx * pers, z: rz };
  };

  const TL = project(pts.fl[0], pts.fl[1]);
  const TR = project(pts.fr[0], pts.fr[1]);
  const BR = project(pts.br[0], pts.br[1]);
  const BL = project(pts.bl[0], pts.bl[1]);
  const h3d = s * 1.1; // height of Kaaba

  const face = (pts2d, fill, stroke) => {
    ctx.beginPath();
    pts2d.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  };

  // Front face (z negative = toward viewer)
  const frontBright = TR.z < BL.z; // determine which face is front
  // Bottom faces
  const base = { y: cy + s * .55 };
  // Draw visible faces
  // Left face
  face([
    { x: TL.x, y: cy + TL.z * .1 - s * .55 }, { x: TR.x, y: cy + TR.z * .1 - s * .55 },
    { x: TR.x, y: cy + TR.z * .1 + s * .55 }, { x: TL.x, y: cy + TL.z * .1 + s * .55 }
  ], '#111', 'rgba(200,150,26,.3)');
  // Right face
  face([
    { x: TR.x, y: cy + TR.z * .1 - s * .55 }, { x: BR.x, y: cy + BR.z * .1 - s * .55 },
    { x: BR.x, y: cy + BR.z * .1 + s * .55 }, { x: TR.x, y: cy + TR.z * .1 + s * .55 }
  ], '#0e0e0e', 'rgba(200,150,26,.2)');
  // Front face (facing viewer most of the time)
  face([
    { x: BL.x, y: cy + BL.z * .1 - s * .55 }, { x: TL.x, y: cy + TL.z * .1 - s * .55 },
    { x: TL.x, y: cy + TL.z * .1 + s * .55 }, { x: BL.x, y: cy + BL.z * .1 + s * .55 }
  ], '#1a1a1a', 'rgba(200,150,26,.35)');
  // Top face
  face([
    { x: TL.x, y: cy + TL.z * .1 - s * .55 }, { x: TR.x, y: cy + TR.z * .1 - s * .55 },
    { x: BR.x, y: cy + BR.z * .1 - s * .55 }, { x: BL.x, y: cy + BL.z * .1 - s * .55 }
  ], '#141414', 'rgba(200,150,26,.4)');

  // Kiswa gold band on front face
  const kiswaY = cy + TL.z * .1 - s * .25;
  ctx.save();
  ctx.beginPath();
  const fL = BL.x, fR = TL.x;
  ctx.rect(Math.min(fL, fR) - 2, kiswaY - 8, Math.abs(fR - fL) + 4, 16);
  ctx.clip();
  const kg = ctx.createLinearGradient(fL, 0, fR, 0);
  kg.addColorStop(0, '#c8961a'); kg.addColorStop(.3, '#f5c842');
  kg.addColorStop(.6, '#c8961a'); kg.addColorStop(1, '#f5c842');
  ctx.fillStyle = kg; ctx.fillRect(Math.min(fL, fR) - 2, kiswaY - 8, Math.abs(fR - fL) + 4, 16);
  ctx.restore();

  // Door
  const doorX = (BL.x + TL.x) / 2, doorY = cy + TL.z * .1 + s * .1;
  const doorW = s * .18, doorH = s * .3;
  ctx.fillStyle = '#c8961a';
  ctx.fillRect(doorX - doorW / 2, doorY - doorH, doorW, doorH);
  ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1;
  ctx.strokeRect(doorX - doorW / 2, doorY - doorH, doorW, doorH);
  ctx.restore();
}

function draw3DPilgrim(ctx, x, y, scale, hue, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(0,0,0,.5)';
  // Ihram (white robe)
  ctx.fillStyle = `hsl(${hue},15%,92%)`;
  ctx.beginPath();
  ctx.ellipse(0, 8, 5, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = `hsl(${hue + 10},20%,78%)`;
  ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.fill();
  // Dua arms raised slightly
  const armAng = Math.sin(t * .8) * .2;
  ctx.strokeStyle = `hsl(${hue},15%,92%)`; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, 2); ctx.lineTo(-8 + armAng * 5, -4 - armAng * 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, 2); ctx.lineTo(8 - armAng * 5, -4 - armAng * 3); ctx.stroke();
  ctx.restore();
}

// ============================================================
//  SCENE 2: ARAFAT
// ============================================================
const arafat = {
  crowd: [],
  heat: 0,
  t: 0
};

function initArafat() {
  if (arafat.crowd.length) return;
  for (let i = 0; i < 120; i++) {
    arafat.crowd.push({
      x: Math.random() * W, row: Math.random(),
      ph: Math.random() * Math.PI * 2, sp: .3 + Math.random() * .5,
      sc: .5 + Math.random() * .8
    });
  }
}

function loopArafat() {
  initArafat();
  const ctx = ctxs.arafat;
  function draw() {
    if (currentScene !== 1) return;
    rafs[1] = requestAnimationFrame(draw);
    const t = Date.now() / 1000;
    ctx.clearRect(0, 0, W, H);

    // Desert sky
    const sk = ctx.createLinearGradient(0, 0, 0, H);
    sk.addColorStop(0, '#ff7a0a'); sk.addColorStop(.3, '#ff9a3c');
    sk.addColorStop(.6, '#e8a84a'); sk.addColorStop(1, '#c8955a');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);

    // Sun
    const sunX = W * .5, sunY = H * .12 + Math.sin(t * .2) * 5;
    ctx.save();
    // Rays
    for (let i = 0; i < 16; i++) {
      const ang = i * Math.PI / 8 + t * .05;
      const r1 = clamp(50, 80, W * .07), r2 = clamp(80, 130, W * .12);
      ctx.beginPath();
      ctx.moveTo(sunX + r1 * Math.cos(ang), sunY + r1 * Math.sin(ang));
      ctx.lineTo(sunX + r2 * Math.cos(ang), sunY + r2 * Math.sin(ang));
      ctx.strokeStyle = `rgba(255,220,80,${.15 + .1 * Math.sin(t + i)})`;
      ctx.lineWidth = clamp(2, 5, W * .004); ctx.stroke();
    }
    const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, clamp(40, 70, W * .065));
    sg.addColorStop(0, '#fff9d0'); sg.addColorStop(.4, '#ffec5a'); sg.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sunX, sunY, clamp(40, 70, W * .065), 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Mountains
    drawArafatMountains(ctx, t);

    // Desert ground
    const gnd = ctx.createLinearGradient(0, H * .55, 0, H);
    gnd.addColorStop(0, '#c8a96e'); gnd.addColorStop(.5, '#b8905a'); gnd.addColorStop(1, '#9a7840');
    ctx.fillStyle = gnd; ctx.fillRect(0, H * .55, W, H);
    // Sand waves
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(200,160,100,${.08 + i * .04})`;
      const wy = H * (.57 + i * .04 + Math.sin(t * .3 + i) * .005);
      ctx.ellipse(W / 2 + Math.sin(t * .2 + i) * 20, wy, W * .7, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tents
    drawTents(ctx, t);

    // Crowd
    arafat.crowd.forEach(p => {
      const gy = H * .55 + p.row * H * .12;
      const sc = p.sc * (0.5 + p.row * .6);
      drawPilgrimFig(ctx, p.x, gy, sc, p.ph, t);
    });

    // Jabal al-Rahma
    drawJabalRahma(ctx, W * .62, H * .38, t);

    // Dua hands big center
    drawDuaHands(ctx, W * .5, H * .5, t);

    // Heat shimmer
    ctx.save(); ctx.globalAlpha = .04 + Math.sin(t * 3) * .02;
    ctx.fillStyle = 'rgba(255,200,100,.3)';
    ctx.fillRect(0, H * .48, W, 30); ctx.restore();
  }
  draw();
}

function drawArafatMountains(ctx, t) {
  const peaks = [
    { x: .05, w: .18, h: .22, c: '#7a5030' },
    { x: .18, w: .24, h: .28, c: '#8b6040' },
    { x: .7, w: .2, h: .24, c: '#7a5030' },
    { x: .85, w: .2, h: .2, c: '#6a4020' }
  ];
  peaks.forEach(p => {
    ctx.beginPath();
    ctx.moveTo(W * p.x, H * .56);
    ctx.lineTo(W * (p.x + p.w * .5), H * (1 - p.h - .44));
    ctx.lineTo(W * (p.x + p.w), H * .56);
    ctx.fillStyle = p.c; ctx.fill();
  });
}

function drawJabalRahma(ctx, x, y, t) {
  ctx.save();
  // Mountain
  ctx.beginPath();
  ctx.moveTo(x - clamp(40, 60, W * .06), H * .56);
  ctx.lineTo(x, y);
  ctx.lineTo(x + clamp(40, 60, W * .06), H * .56);
  ctx.fillStyle = '#a07048'; ctx.fill();
  // Pillar
  const ph = clamp(40, 70, H * .1);
  const g = ctx.createLinearGradient(x, y - ph, x, y);
  g.addColorStop(0, '#e8c87a'); g.addColorStop(1, '#a07030');
  ctx.fillStyle = g;
  ctx.fillRect(x - 4, y - ph, 8, ph);
  // Golden orb
  const glow = ctx.createRadialGradient(x, y - ph - 10, 0, x, y - ph - 10, 20);
  glow.addColorStop(0, '#f5c842'); glow.addColorStop(.5, '#c8961a'); glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y - ph - 10 + Math.sin(t * .6) * 3, clamp(8, 14, W * .012), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawTents(ctx, t) {
  const n = 9, y = H * .58;
  for (let i = 0; i < n; i++) {
    const tx2 = W * (i / (n - 1) * .8 + .1);
    const tw = clamp(28, 50, W * .05), th = clamp(22, 38, W * .04);
    // Tent body
    ctx.beginPath();
    ctx.moveTo(tx2 - tw, y); ctx.lineTo(tx2, y - th); ctx.lineTo(tx2 + tw, y); ctx.closePath();
    const tg = ctx.createLinearGradient(tx2 - tw, y, tx2 + tw, y);
    tg.addColorStop(0, '#e8e0d0'); tg.addColorStop(.5, '#f5f0e8'); tg.addColorStop(1, '#d8d0c0');
    ctx.fillStyle = tg; ctx.fill();
    // Flag
    const flagY = y - th - 15 + Math.sin(t * 1.5 + i) * .5;
    ctx.strokeStyle = '#c8961a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(tx2, y - th); ctx.lineTo(tx2, flagY - 12); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx2, flagY - 12); ctx.lineTo(tx2 + 10, flagY - 8); ctx.lineTo(tx2, flagY - 4);
    ctx.fillStyle = '#1a6a28'; ctx.fill();
  }
}

function drawPilgrimFig(ctx, x, y, scale, ph, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.ellipse(0, 0, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); ctx.fill();
  // Arms raised in dua
  const armAng = Math.sin(t * ph) * .3 + .3;
  ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(-10, -9 - armAng * 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -2); ctx.lineTo(10, -9 - armAng * 4); ctx.stroke();
  ctx.restore();
}

function drawDuaHands(ctx, x, y, t) {
  ctx.save();
  const raise = Math.sin(t * .5) * 8;
  ctx.globalAlpha = .85;
  // Left hand
  ctx.save(); ctx.translate(x - 40, y - raise);
  const lhg = ctx.createLinearGradient(-15, 0, 15, 40);
  lhg.addColorStop(0, '#d4a070'); lhg.addColorStop(1, '#b07848');
  ctx.fillStyle = lhg;
  ctx.beginPath(); ctx.roundRect(-14, -30, 28, 50, 6); ctx.fill();
  // Fingers
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-10 + i * 7, -38, 5, 14);
  }
  ctx.restore();
  // Right hand
  ctx.save(); ctx.translate(x + 40, y - raise + 2);
  ctx.fillStyle = lhg;
  ctx.beginPath(); ctx.roundRect(-14, -30, 28, 50, 6); ctx.fill();
  for (let i = 0; i < 4; i++) ctx.fillRect(-10 + i * 7, -38, 5, 14);
  ctx.restore();
  // Glow
  const dg = ctx.createRadialGradient(x, y - 30, 0, x, y - 30, 80);
  dg.addColorStop(0, `rgba(255,220,100,${.15 + .1 * Math.sin(t * .8)})`);
  dg.addColorStop(1, 'transparent');
  ctx.fillStyle = dg;
  ctx.beginPath(); ctx.arc(x, y - 30, 80, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ============================================================
//  SCENE 3: JAMARAT
// ============================================================
const jamarat = {
  stones: [],
  throwers: [],
  sparks: []
};

function initJamarat() {
  if (jamarat.throwers.length) return;
  const xpos = [.08, .18, .28, .38, .62, .72, .82, .92, .50];
  xpos.forEach((xr, i) => {
    jamarat.throwers.push({ xr, delay: i * .3, ph: i * .7 });
  });
}

function loopJamarat() {
  initJamarat();
  const ctx = ctxs.jamarat;
  let lastStone = 0;
  function draw() {
    if (currentScene !== 2) return;
    rafs[2] = requestAnimationFrame(draw);
    const t = Date.now() / 1000;
    ctx.clearRect(0, 0, W, H);

    // Night/dusk sky
    const sk = ctx.createLinearGradient(0, 0, 0, H);
    sk.addColorStop(0, '#08021a'); sk.addColorStop(.35, '#1a0838');
    sk.addColorStop(.6, '#2d1260'); sk.addColorStop(1, '#160830');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);

    // Stars
    stars.slice(0, 180).forEach(s => {
      const op = .1 + .8 * Math.abs(Math.sin(t * s.sp * 8 + s.ph));
      ctx.beginPath(); ctx.arc(s.x, s.y * .65, s.r * .9, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,220,${op})`; ctx.fill();
    });

    // Purple clouds
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.globalAlpha = .09 + .05 * Math.sin(t * .1 + i);
      ctx.fillStyle = `hsl(${270 + i * 15},60%,40%)`;
      const cx2 = ((W * .2 * i + t * 8 * ((i % 2) - .5) * 15) % W + W) % W;
      ctx.beginPath(); ctx.ellipse(cx2, H * .2 + i * H * .06, clamp(100, 200, W * .2), 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Bridge structure
    draw3DBridge(ctx, t);

    // Jamarat pillar
    const pillarX = W * .5, pillarY = H * .35;
    draw3DPillar(ctx, pillarX, pillarY, t);

    // Ground
    const gg = ctx.createLinearGradient(0, H * .7, 0, H);
    gg.addColorStop(0, '#1e1432'); gg.addColorStop(1, '#0a0816');
    ctx.fillStyle = gg; ctx.fillRect(0, H * .7, W, H);
    // Ground glow under pillar
    const pg = ctx.createRadialGradient(pillarX, H * .72, 0, pillarX, H * .72, clamp(80, 140, W * .12));
    pg.addColorStop(0, 'rgba(200,150,66,.12)'); pg.addColorStop(1, 'transparent');
    ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);

    // Throwers
    jamarat.throwers.forEach(th => {
      drawThrower(ctx, W * th.xr, H * .72, t + th.ph);
    });

    // Spawn stones
    if (t - lastStone > .18) {
      lastStone = t;
      const tx = W * (.3 + Math.random() * .4);
      jamarat.stones.push({
        x: tx, y: H * .6 + Math.random() * H * .08,
        vx: (pillarX - tx) * .04, vy: -3 - Math.random() * 4,
        life: 1
      });
    }

    // Update + draw stones
    jamarat.stones = jamarat.stones.filter(s => {
      s.x += s.vx; s.vy += .25; s.y += s.vy; s.life -= .025;
      if (s.life <= 0) return false;
      ctx.save(); ctx.globalAlpha = s.life;
      ctx.fillStyle = `hsl(0,0%,${55 + Math.random() * 20}%)`;
      ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(255,200,100,.3)';
      ctx.beginPath(); ctx.ellipse(s.x, s.y, clamp(3, 6, W * .005), clamp(2, 4, W * .004), 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Spark on hit near pillar
      if (Math.abs(s.x - pillarX) < clamp(20, 40, W * .035) && s.y > H * .4 && s.y < H * .65) {
        for (let i = 0; i < 4; i++) {
          jamarat.sparks.push({ x: s.x, y: s.y, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, life: 1 });
        }
        return false;
      }
      return true;
    });

    // Sparks
    jamarat.sparks = jamarat.sparks.filter(sp => {
      sp.x += sp.vx; sp.y += sp.vy; sp.vy += .1; sp.life -= .06;
      if (sp.life <= 0) return false;
      ctx.save(); ctx.globalAlpha = sp.life;
      ctx.fillStyle = `hsl(${30 + Math.random() * 30},100%,70%)`;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return true;
    });
  }
  draw();
}

function draw3DBridge(ctx, t) {
  const bY = H * .62, bH = clamp(12, 20, H * .025);
  // Pillar supports
  [[.22, H * .68], [.78, H * .68]].forEach(([xr, py]) => {
    const bx = W * xr;
    ctx.fillStyle = '#3a2a5a';
    ctx.fillRect(bx - clamp(10, 18, W * .015), bY, clamp(20, 36, W * .03), py - bY);
    // Window detail
    ctx.fillStyle = 'rgba(150,80,255,.12)';
    ctx.fillRect(bx - 6, bY + 10, 12, 20);
  });
  // Bridge deck
  const bdg = ctx.createLinearGradient(0, bY, 0, bY + bH);
  bdg.addColorStop(0, '#5a4a7a'); bdg.addColorStop(1, '#3a2a5a');
  ctx.fillStyle = bdg;
  ctx.beginPath(); ctx.roundRect(W * .1, bY, W * .8, bH, 3); ctx.fill();
  // Rails
  ctx.strokeStyle = 'rgba(180,130,255,.2)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W * .1, bY - 5); ctx.lineTo(W * .9, bY - 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * .1, bY - 10); ctx.lineTo(W * .9, bY - 10); ctx.stroke();
  // Lights along bridge
  for (let i = 0; i < 8; i++) {
    const lx = W * .12 + i * W * .095;
    ctx.save();
    ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(255,200,50,.8)';
    ctx.fillStyle = 'rgba(255,220,80,.9)';
    ctx.beginPath(); ctx.arc(lx, bY - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function draw3DPillar(ctx, x, y, t) {
  const pw = clamp(35, 55, W * .045), ph = clamp(120, 180, H * .22);
  ctx.save();
  ctx.shadowBlur = 30; ctx.shadowColor = 'rgba(200,150,66,.35)';
  // Glow ring animated
  const gr = clamp(35, 60, W * .05) + Math.sin(t * 2) * 4;
  const gl = ctx.createRadialGradient(x, y + ph * .5, gr * .3, x, y + ph * .5, gr);
  gl.addColorStop(0, 'rgba(200,150,66,.15)'); gl.addColorStop(1, 'transparent');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y + ph * .5, gr, 0, Math.PI * 2); ctx.fill();

  // 3D sides
  // Left shadow face
  ctx.fillStyle = '#7a7060';
  ctx.beginPath(); ctx.moveTo(x - pw / 2, y); ctx.lineTo(x - pw / 2 - pw * .3, y + 10);
  ctx.lineTo(x - pw / 2 - pw * .3, y + ph + 10); ctx.lineTo(x - pw / 2, y + ph); ctx.fill();
  // Main face
  const pg = ctx.createLinearGradient(x - pw / 2, y, x + pw / 2, y);
  pg.addColorStop(0, '#a09880'); pg.addColorStop(.5, '#d0c8b8'); pg.addColorStop(1, '#9a9280');
  ctx.fillStyle = pg;
  ctx.fillRect(x - pw / 2, y, pw, ph);

  // Cap
  const capG = ctx.createLinearGradient(x - pw * .7, y, x + pw * .7, y);
  capG.addColorStop(0, '#b0a890'); capG.addColorStop(.5, '#e0d8c8'); capG.addColorStop(1, '#a09880');
  ctx.fillStyle = capG;
  ctx.beginPath(); ctx.roundRect(x - pw * .7, y - clamp(10, 18, H * .022), pw * 1.4, clamp(10, 18, H * .022), 3); ctx.fill();

  // Impact marks / scuffs
  ctx.save(); ctx.globalAlpha = .3;
  ctx.fillStyle = '#666';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(x - pw * .3 + Math.sin(i * 2.1) * pw * .5, y + ph * .2 + i * ph * .1 + Math.sin(i) * 15, clamp(2, 4, W * .003), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

function drawThrower(ctx, x, y, t) {
  const bob = Math.sin(t * 1.2) * .3;
  ctx.save(); ctx.translate(x, y);
  ctx.scale(.8, .8);
  // Robe
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.beginPath(); ctx.arc(0, -16, 5.5, 0, Math.PI * 2); ctx.fill();
  // Throwing arm
  const armAng = -1.2 + Math.sin(t * 1.5) * .8;
  ctx.strokeStyle = 'white'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(5, -8);
  ctx.lineTo(5 + 14 * Math.cos(armAng), -8 + 14 * Math.sin(armAng)); ctx.stroke();
  ctx.restore();
}

// ============================================================
//  SCENE 4: EID
// ============================================================
const eid = {
  fireworks: [],
  fwParts: [],
  confetti: [],
  sheep: { x: 0, y: 0, legph: 0, eyeBlink: 0, tailph: 0 }
};

let fwInterval = null;

function stopFireworks() {
  if (fwInterval) { clearInterval(fwInterval); fwInterval = null; }
}

function initEid() {
  if (eid.confetti.length) return;
  eid.sheep.x = W / 2; eid.sheep.y = H * .68;
  const colors = ['#f5c842', '#ff6b1a', '#2a8a3a', '#e84a4a', '#4a8ae8', '#e84ae8', '#ffffff', '#ffd700'];
  for (let i = 0; i < 120; i++) {
    eid.confetti.push({
      x: Math.random() * W,
      y: -Math.random() * H,
      vx: (Math.random() - .5) * 2,
      vy: 1.5 + Math.random() * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - .5) * .08,
      w: 5 + Math.random() * 10, h: 5 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      isCircle: Math.random() > .5
    });
  }
}

function loopEid() {
  initEid();
  stopFireworks();
  fwInterval = setInterval(() => {
    if (currentScene !== 3) return;
    spawnFirework();
  }, 500);
  const ctx = ctxs.eid;
  function draw() {
    if (currentScene !== 3) return;
    rafs[3] = requestAnimationFrame(draw);
    const t = Date.now() / 1000;
    ctx.clearRect(0, 0, W, H);

    // Night green sky
    const sk = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, H * 1.2);
    sk.addColorStop(0, '#1a3a0a'); sk.addColorStop(.4, '#0d2200');
    sk.addColorStop(.8, '#060f00'); sk.addColorStop(1, '#020800');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);

    // Stars
    stars.slice(0, 200).forEach(s => {
      const op = .2 + .7 * Math.abs(Math.sin(t * s.sp * 8 + s.ph));
      ctx.beginPath(); ctx.arc(s.x, s.y * .7, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,220,${op})`; ctx.fill();
    });

    // Green meadow
    const mdw = ctx.createLinearGradient(0, H * .65, 0, H);
    mdw.addColorStop(0, '#1e5a1a'); mdw.addColorStop(.4, '#0e3a0c'); mdw.addColorStop(1, '#06200a');
    ctx.fillStyle = mdw;
    ctx.beginPath();
    ctx.moveTo(0, H); ctx.lineTo(0, H * .7);
    // Wavy grass top
    for (let i = 0; i <= W; i += 30) {
      ctx.lineTo(i, H * .7 - 8 * Math.sin((i / W) * Math.PI * 4 + t * .5));
    }
    ctx.lineTo(W, H); ctx.fill();

    // Lanterns
    drawLanterns(ctx, t);

    // Confetti
    updateConfetti(ctx, t);

    // Fireworks
    updateFireworks(ctx);

    // 3D Sheep
    const sx = W * .5 + Math.sin(t * .3) * clamp(10, 30, W * .025);
    const sy = H * .72 + Math.sin(t * .5) * clamp(4, 8, H * .012);
    eid.sheep.x = sx; eid.sheep.y = sy;
    draw3DSheep(ctx, sx, sy, t);

    // Floating crescents/stars
    drawEidDecorations(ctx, t);
  }
  draw();
}

function drawLanterns(ctx, t) {
  const lans = [
    { xr: .05, c: '#ff6b1a', c2: '#8b0000' },
    { xr: .2, c: '#f5c842', c2: '#8b6010' },
    { xr: .5, c: '#2a8a3a', c2: '#0a3a10' },
    { xr: .8, c: '#8b1a8b', c2: '#3a0a3a' },
    { xr: .95, c: '#1a4a8b', c2: '#0a1a4a' }
  ];
  lans.forEach((l, i) => {
    const lx = W * l.xr, swing = Math.sin(t * .4 + i) * .12;
    ctx.save(); ctx.translate(lx, 0);
    // String
    ctx.strokeStyle = 'rgba(200,150,50,.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(Math.sin(swing) * 20, clamp(40, 70, H * .07)); ctx.stroke();
    ctx.translate(Math.sin(swing) * 20, clamp(40, 70, H * .07));
    // Lantern body
    const lw = clamp(28, 42, W * .035), lh = clamp(48, 68, H * .075);
    ctx.save(); ctx.rotate(swing);
    const lg = ctx.createLinearGradient(-lw / 2, -lh / 2, lw / 2, lh / 2);
    lg.addColorStop(0, l.c); lg.addColorStop(1, l.c2);
    ctx.shadowBlur = 30 + Math.sin(t * .7 + i) * 10; ctx.shadowColor = l.c;
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.roundRect(-lw / 2, -lh / 2, lw, lh, 8); ctx.fill();
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath(); ctx.roundRect(-lw / 2 + 4, -lh / 2 + 4, lw / 3, lh / 3, 4); ctx.fill();
    // Flame
    const fa = .6 + Math.sin(t * 8 + i) * .4;
    ctx.fillStyle = `rgba(255,240,100,${fa})`;
    ctx.beginPath(); ctx.ellipse(0, lh * .5 + 8, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); ctx.restore();
  });
}

function updateConfetti(ctx, t) {
  eid.confetti.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    if (p.y > H + 20) p.y = -20;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.globalAlpha = .8;
    ctx.fillStyle = p.color;
    if (p.isCircle) {
      ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  });
}

// Fireworks system
function spawnFirework() {
  eid.fireworks.push({
    x: W * (.1 + Math.random() * .8), y: H,
    tx: W * (.1 + Math.random() * .8), ty: H * (.1 + Math.random() * .45),
    vy: -12 - Math.random() * 8, vx: (Math.random() - .5) * 3,
    color: `hsl(${Math.random() * 360},100%,70%)`,
    trail: [], exploded: false
  });
}

function updateFireworks(ctx) {
  eid.fireworks = eid.fireworks.filter(fw => {
    fw.trail.push({ x: fw.x, y: fw.y });
    if (fw.trail.length > 10) fw.trail.shift();
    fw.x += fw.vx; fw.y += fw.vy; fw.vy += .35;
    // Trail
    fw.trail.forEach((p, i) => {
      ctx.save();
      ctx.globalAlpha = (i / fw.trail.length) * .7;
      ctx.fillStyle = fw.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    // Firework head
    ctx.save();
    ctx.shadowBlur = 12; ctx.shadowColor = fw.color;
    ctx.fillStyle = fw.color;
    ctx.beginPath(); ctx.arc(fw.x, fw.y, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (fw.vy >= 0 || fw.y <= fw.ty + 20) {
      fw.exploded = true;
      explodeFirework(fw);
      return false;
    }
    return true;
  });
  // Particles
  eid.fwParts = eid.fwParts.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += .06; p.vx *= .97; p.vy *= .97;
    p.alpha -= .012;
    if (p.alpha <= 0) return false;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.shadowBlur = 6; ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return true;
  });
}

function explodeFirework(fw) {
  const n = 80 + Math.floor(Math.random() * 60);
  const cols = [fw.color, '#fff', '#ffd700', '#ff8c00'];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + Math.random() * .3;
    const sp = .5 + Math.random() * 7;
    eid.fwParts.push({
      x: fw.x, y: fw.y,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      color: cols[Math.floor(Math.random() * cols.length)],
      alpha: 1, r: 1 + Math.random() * 2.5
    });
  }
}

function draw3DSheep(ctx, x, y, t) {
  ctx.save();
  // Shadow
  const shadowW = clamp(80, 140, W * .11), shadowH = 16;
  const sg = ctx.createRadialGradient(x, y + shadowH * .3, 0, x, y, shadowW);
  sg.addColorStop(0, 'rgba(0,0,0,.25)'); sg.addColorStop(1, 'transparent');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.ellipse(x, y + 4, shadowW * .7, shadowH, 0, 0, Math.PI * 2); ctx.fill();

  const bounce = Math.sin(t * 2.5) * (clamp(3, 6, H * .008));
  ctx.translate(x, y + bounce);
  const wiggle = Math.sin(t * .7) * .04;

  // Body - 3D fluffy sphere
  const bw = clamp(70, 120, W * .1), bh = clamp(55, 90, H * .1);
  // Multiple wool layers for 3D fluffiness
  [[0, 0, bw, bh, 1], [0, -8, bw * .82, bh * .82, .96], [-8, -14, bw * .65, bh * .65, .93], [10, -5, bw * .55, bh * .5, .9]].forEach(([ox, oy, w, h, br]) => {
    const wg = ctx.createRadialGradient(ox, oy - h * .2, 0, ox, oy, Math.max(w, h));
    wg.addColorStop(0, `hsl(0,0%,${Math.round(br * 100)}%)`);
    wg.addColorStop(.7, `hsl(0,0%,${Math.round(br * 88)}%)`);
    wg.addColorStop(1, `hsl(30,10%,${Math.round(br * 80)}%)`);
    ctx.save(); ctx.rotate(wiggle);
    ctx.fillStyle = wg; ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(0,0,0,.15)';
    ctx.beginPath(); ctx.ellipse(ox, oy, w, h, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Flowers on body
  [[-30, -15, '🌸'], [10, -22, '🌼'], [35, -5, '🌺']].forEach(([ox, oy, em]) => {
    ctx.font = `${clamp(12, 18, W * .015)}px serif`;
    ctx.textAlign = 'center'; ctx.fillText(em, ox + Math.sin(t + ox) * .5, oy);
  });

  // Head
  ctx.save(); ctx.translate(bw * .7 + clamp(10, 18, W * .015), -bh * .3 - clamp(5, 10, H * .012));
  ctx.rotate(Math.sin(t * .5) * .08);
  const hw = clamp(28, 42, W * .035), hh = clamp(26, 38, H * .042);
  const hg = ctx.createRadialGradient(0, -5, 0, 0, 0, hw);
  hg.addColorStop(0, '#f0e0c8'); hg.addColorStop(.7, '#d4b090'); hg.addColorStop(1, '#c09878');
  ctx.fillStyle = hg; ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(0,0,0,.2)';
  ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2); ctx.fill();

  // Ears
  [[-(hw * .9), -5, -20], [hw * .9, -5, 20]].forEach(([ex, ey, rot]) => {
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(rot * Math.PI / 180);
    const eg = ctx.createRadialGradient(0, 0, 0, 0, 0, clamp(10, 16, W * .013));
    eg.addColorStop(0, '#e8b090'); eg.addColorStop(1, '#c07858');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.ellipse(0, 0, clamp(9, 13, W * .01), clamp(13, 20, H * .022), 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Horns
  [[-(hw * .4), -hh * .8, -30], [hw * .4, -hh * .8, 30]].forEach(([hx, hy, rot]) => {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(rot * Math.PI / 180);
    ctx.fillStyle = '#c8a878';
    ctx.beginPath(); ctx.ellipse(0, -8, 4, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Eyes
  const eyeBlinkSc = (t % 4 > 3.7) ? Math.max(.05, 1 - (t % 4 - 3.7) * 10) : 1;
  [[-hw * .38, 0], [hw * .38, 0]].forEach(([ex, ey]) => {
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath(); ctx.ellipse(ex, ey, clamp(5, 8, W * .007), clamp(5, 8, W * .007) * eyeBlinkSc, 0, 0, Math.PI * 2); ctx.fill();
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.arc(ex - 2, ey - 2, clamp(2, 3, W * .003), 0, Math.PI * 2); ctx.fill();
  });

  // Nose
  ctx.fillStyle = '#c08868';
  ctx.beginPath(); ctx.ellipse(0, hh * .3, clamp(8, 12, W * .01), clamp(6, 9, H * .01), 0, 0, Math.PI * 2); ctx.fill();
  // Smile
  ctx.strokeStyle = '#a06848'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, hh * .45, clamp(6, 9, W * .008), 0, Math.PI); ctx.stroke();
  ctx.restore();

  // Legs (4 animated)
  const legPh = [0, .5, .25, .75];
  const legX = [-bw * .45, -bw * .15, bw * .15, bw * .45];
  legX.forEach((lx, i) => {
    const legSwing = Math.sin(t * 3 + legPh[i] * Math.PI * 2) * .15;
    ctx.save(); ctx.translate(lx, bh * .7); ctx.rotate(legSwing);
    const lh2 = clamp(22, 36, H * .04);
    ctx.fillStyle = '#d4b090';
    ctx.beginPath(); ctx.roundRect(-5, 0, 10, lh2, 3); ctx.fill();
    // Hoof
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath(); ctx.roundRect(-6, lh2 - 6, 12, 8, 3); ctx.fill();
    ctx.restore();
  });

  // Tail
  ctx.save(); ctx.translate(-bw * .7, bh * .1);
  ctx.rotate(Math.sin(t * 5) * .3);
  const tg = ctx.createRadialGradient(0, 0, 0, 0, 0, clamp(10, 16, W * .012));
  tg.addColorStop(0, '#fff'); tg.addColorStop(1, '#e0d8c8');
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.arc(0, 0, clamp(10, 16, W * .012), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore(); // sheep group
}

function drawEidDecorations(ctx, t) {
  const decos = ['✨', '⭐', '🌙', '☪️', '🌟', '💫', '✦'];
  const positions = [
    [.08, .15], [.92, .12], [.15, .45], [.85, .4], [.05, .65], [.93, .6],
    [.3, .08], [.7, .1], [.5, .05], [.2, .3], [.8, .28]
  ];
  positions.forEach(([xr, yr], i) => {
    const bob = Math.sin(t * .6 + i) * (clamp(6, 12, H * .015));
    const rot = Math.sin(t * .3 + i) * .2;
    ctx.save();
    ctx.translate(W * xr, H * yr + bob);
    ctx.rotate(rot);
    ctx.font = `${clamp(14, 22, W * .018)}px serif`;
    ctx.textAlign = 'center';
    ctx.globalAlpha = .5 + .4 * Math.abs(Math.sin(t * .4 + i));
    ctx.fillText(decos[i % decos.length], 0, 0);
    ctx.restore();
  });
}

// ===== SOUND =====
function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('soundBtn').textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startAmbientSound();
  } else {
    stopAmbientSound();
  }
}

function startAmbientSound() {
  stopAmbientSound();
  if (!audioCtx || !soundOn) return;
  // Layered ambient: low drone + harmonics
  const freqs = [174.6, 261.6, 349.2, 440];
  const master = audioCtx.createGain();
  master.gain.setValueAtTime(0, audioCtx.currentTime);
  master.gain.linearRampToValueAtTime(.08, audioCtx.currentTime + 2);
  master.connect(audioCtx.destination);

  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.frequency.value = f;
    osc.type = i === 0 ? 'sine' : 'sine';
    g.gain.value = i === 0 ? .06 : .015 - i * .003;
    osc.connect(g); g.connect(master);
    osc.start();
    ambientNodes.push(osc, g);
  });
  ambientNodes.push(master);

  // Soft wind-like noise
  try {
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .015;
    const src = audioCtx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 400;
    const ng = audioCtx.createGain(); ng.gain.value = .3;
    src.connect(lp); lp.connect(ng); ng.connect(master);
    src.start();
    ambientNodes.push(src, lp, ng);
  } catch (e) { }
}

function stopAmbientSound() {
  ambientNodes.forEach(n => { try { if (n.stop) n.stop(); if (n.disconnect) n.disconnect(); } catch (e) { } });
  ambientNodes = [];
}

// ===== UTILS =====
function clamp(min, max, v) { return Math.min(max, Math.max(min, v)); }

// Polyfill roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.arcTo(x + w, y, x + w, y + r, r);
    this.lineTo(x + w, y + h - r);
    this.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.lineTo(x + r, y + h);
    this.arcTo(x, y + h, x, y + h - r, r);
    this.lineTo(x, y + r);
    this.arcTo(x, y, x + r, y, r);
    this.closePath();
    return this;
  };
}