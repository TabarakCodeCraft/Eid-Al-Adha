"use strict";
let currentScene = 0;
const TOTAL_SCENES = 5;
let isTransitioning = false, autoTimer = null;
const AUTO_MS = 10000;
let W = window.innerWidth, H = window.innerHeight;
let bgCanvas, bgCtx;
let canvases = {}, ctxs = {}, rafs = {};
let stars = [];

window.addEventListener("load", () => {
  W = window.innerWidth; H = window.innerHeight;
  initBg(); initDust(); initDots(); initAllCanvases();
  showScene(0, false); scheduleAuto(); initInput();
  window.addEventListener("resize", onResize);
  requestAnimationFrame(bgLoop);
});

function onResize() {
  W = window.innerWidth; H = window.innerHeight;
  bgCanvas.width = W; bgCanvas.height = H;
  document.querySelectorAll(".scene-canvas").forEach(c => { c.width = W; c.height = H; });
}

function initBg() {
  bgCanvas = document.getElementById("bgCanvas"); bgCtx = bgCanvas.getContext("2d");
  bgCanvas.width = W; bgCanvas.height = H;
  for (let i = 0; i < 280; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H * 0.7, r: Math.random() * 1.8,
      ph: Math.random() * Math.PI * 2, sp: 0.004 + Math.random() * 0.009
    });
  }
}
function bgLoop() {
  bgCtx.clearRect(0, 0, W, H);
  const t = Date.now() / 1000;
  stars.forEach(s => {
    const op = 0.25 + 0.75 * Math.abs(Math.sin(t * s.sp * 10 + s.ph));
    bgCtx.beginPath(); bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(255,255,220,${op.toFixed(2)})`; bgCtx.fill();
  });
  requestAnimationFrame(bgLoop);
}

function initDust() {
  const c = document.getElementById("goldDust");
  for (let i = 0; i < 35; i++) {
    const d = document.createElement("div"); d.className = "dust";
    const sz = 2 + Math.random() * 4, alpha = 0.4 + Math.random() * 0.6;
    d.style.cssText = `left:${Math.random() * 100}%;bottom:${Math.random() * 15}%;width:${sz}px;height:${sz}px;background:radial-gradient(circle,rgba(245,200,66,${alpha}),transparent);animation-duration:${9 + Math.random() * 16}s;animation-delay:-${Math.random() * 16}s;`;
    c.appendChild(d);
  }
}

function initDots() {
  const c = document.getElementById("sceneDots");
  const labels = ["الطواف", "عرفات", "مزدلفة", "الجمرات", "العيد"];
  for (let i = 0; i < TOTAL_SCENES; i++) {
    const d = document.createElement("div");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.title = labels[i]; d.onclick = () => goToScene(i); c.appendChild(d);
  }
}
function updateDots() {
  document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === currentScene));
}

function initAllCanvases() {
  ["tawaf", "arafat", "muzdalifa", "jamarat", "eid"].forEach(name => {
    const c = document.getElementById(name + "Canvas");
    c.width = W; c.height = H; canvases[name] = c; ctxs[name] = c.getContext("2d");
  });
}

function showScene(idx, animate = true) {
  document.querySelectorAll(".scene").forEach((s, i) => {
    s.classList.remove("entering", "exiting", "active");
    if (i === idx) {
      s.classList.add("active");
      if (animate) { s.classList.add("entering"); setTimeout(() => s.classList.remove("entering"), 1300); }
    }
  });
  currentScene = idx; updateDots(); startSceneLoop(idx); updateNavBtns();
}

function goToScene(idx) {
  if (isTransitioning || idx === currentScene) return;
  isTransitioning = true; clearAuto();
  const old = document.querySelectorAll(".scene")[currentScene];
  stopSceneLoop(currentScene); old.classList.add("exiting");
  setTimeout(() => {
    old.classList.remove("active", "exiting");
    showScene(idx, true); isTransitioning = false; scheduleAuto();
  }, 900);
}
function nextScene() { goToScene((currentScene + 1) % TOTAL_SCENES); }
function prevScene() { goToScene((currentScene - 1 + TOTAL_SCENES) % TOTAL_SCENES); }
function updateNavBtns() {
  document.getElementById("prevBtn").style.opacity = currentScene === 0 ? "0.25" : "1";
  document.getElementById("nextBtn").style.opacity = currentScene === TOTAL_SCENES - 1 ? "0.25" : "1";
}
function scheduleAuto() {
  clearAuto();
  autoTimer = setTimeout(() => { if (currentScene < TOTAL_SCENES - 1) nextScene(); }, AUTO_MS);
}
function clearAuto() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }

function initInput() {
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") nextScene();
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") prevScene();
  });
  let tx = 0;
  window.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  window.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 55) dx < 0 ? nextScene() : prevScene();
  }, { passive: true });
  let wc = false;
  window.addEventListener("wheel", e => {
    if (wc) return; wc = true; setTimeout(() => (wc = false), 1100);
    e.deltaY > 0 ? nextScene() : prevScene();
  }, { passive: true });
}

function startSceneLoop(idx) {
  stopSceneLoop(idx);
  const loops = [loopTawaf, loopArafat, loopMuzdalifa, loopJamarat, loopEid];
  if (loops[idx]) loops[idx]();
}
function stopSceneLoop(idx) {
  if (rafs[idx]) { cancelAnimationFrame(rafs[idx]); rafs[idx] = null; }
  if (idx === 4) stopFireworks();
}

function clamp(min, max, v) { return Math.min(max, Math.max(min, v)); }

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y); this.lineTo(x + w - r, y); this.arcTo(x + w, y, x + w, y + r, r);
    this.lineTo(x + w, y + h - r); this.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.lineTo(x + r, y + h); this.arcTo(x, y + h, x, y + h - r, r);
    this.lineTo(x, y + r); this.arcTo(x, y, x + r, y, r); this.closePath(); return this;
  };
}

// =====================================================================
// SCENE 1: TAWAF — Kaaba with clear circular tawaf (counter-clockwise)
// =====================================================================
const tawafState = { angle: 0, kaabaRot: 0, pilgrims: [], init: false };

function initTawaf() {
  if (tawafState.init) return;
  tawafState.init = true;
  // One clear ring of pilgrims moving counter-clockwise (negative speed)
  const mainRing = { r: 0.22, count: 40, sp: -0.008 };  // negative = counter-clockwise
  const ring2 = { r: 0.30, count: 52, sp: -0.006 };
  const ring3 = { r: 0.38, count: 62, sp: -0.0045 };
  [mainRing, ring2, ring3].forEach(ring => {
    for (let i = 0; i < ring.count; i++) {
      tawafState.pilgrims.push({
        ringR: ring.r, angle: (i / ring.count) * Math.PI * 2,
        speed: ring.sp,
        ihram: Math.random() > 0.3,
        colorized: Math.random() > 0.6,
        phase: Math.random() * Math.PI * 2,
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

    // Night sky gradient
    const sky = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.5, H);
    sky.addColorStop(0, "#1c0a3e"); sky.addColorStop(0.35, "#0d1840");
    sky.addColorStop(0.7, "#050d25"); sky.addColorStop(1, "#010308");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Stars in sky
    stars.slice(0, 150).forEach(s => {
      const op = 0.15 + 0.8 * Math.abs(Math.sin(t * s.sp * 10 + s.ph));
      ctx.beginPath(); ctx.arc(s.x, s.y * 0.7, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,220,${op})`; ctx.fill();
    });

    drawCrescent(ctx, W * 0.83, H * 0.08, t);

    const cX = W / 2, cY = H * 0.5;
    drawMarbleFloor(ctx, cX, cY, t);

    // Minarets
    [0.05, 0.2, 0.8, 0.95].forEach((xr, i) => drawMinaret(ctx, W * xr, H * [0.48, 0.55, 0.55, 0.48][i], i, t));

    tawafState.kaabaRot += 0.003;
    const kSize = clamp(70, W * 0.14, 165);
    drawRealisticKaaba(ctx, cX, cY * 0.9, kSize, tawafState.kaabaRot, t);

    // Draw tawaf rings — sorted by depth (y position) for painter's algo
    const baseR = clamp(100, W * 0.22, 240);
    const sorted = [...tawafState.pilgrims].sort((a, b) => {
      const ya = cY * 0.9 + (baseR * (a.ringR / 0.22) * 0.38) * Math.sin(a.angle);
      const yb = cY * 0.9 + (baseR * (b.ringR / 0.22) * 0.38) * Math.sin(b.angle);
      return ya - yb;
    });
    sorted.forEach(p => {
      p.angle += p.speed;
      const rx = baseR * (p.ringR / 0.22);
      const ry = rx * 0.38;
      const px = cX + rx * Math.cos(p.angle);
      const py = cY * 0.9 + ry * Math.sin(p.angle);
      const depth = 0.55 + 0.45 * ((Math.sin(p.angle) + 1) / 2);
      drawSimplePilgrim(ctx, px, py, depth * 0.85, p.ihram, p.colorized, t + p.phase);
    });

    // Ground ambient glow
    const radGlow = ctx.createRadialGradient(cX, cY * 0.95, 0, cX, cY * 0.95, clamp(80, W * 0.16, 180));
    radGlow.addColorStop(0, "rgba(180,130,20,.1)"); radGlow.addColorStop(1, "transparent");
    ctx.fillStyle = radGlow; ctx.fillRect(0, 0, W, H);
  }
  draw();
}

// Simpler, clearer pilgrim silhouette for tawaf
function drawSimplePilgrim(ctx, x, y, scale, isIhram, colorized, t) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  const bodyColor = isIhram ? "rgba(250,248,242,0.95)"
    : colorized ? `hsla(${200 + Math.floor(t * 5) % 60},50%,75%,0.9)` : "rgba(180,160,140,0.9)";
  // Body robe
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-5, 14); ctx.lineTo(-7, 0); ctx.lineTo(0, -6); ctx.lineTo(7, 0); ctx.lineTo(5, 14);
  ctx.closePath(); ctx.fill();
  // Head
  ctx.fillStyle = isIhram ? "rgba(245,235,215,0.95)" : "rgba(180,130,80,0.9)";
  ctx.beginPath(); ctx.arc(0, -9, 5.5, 0, Math.PI * 2); ctx.fill();
  // Head cover
  if (isIhram) {
    ctx.fillStyle = "rgba(255,255,250,0.7)";
    ctx.beginPath(); ctx.arc(0, -9, 5, Math.PI, 0); ctx.fill();
  }
  ctx.restore();
}

function drawCrescent(ctx, mx, my, t) {
  const bob = Math.sin(t * 0.25) * 4;
  ctx.save(); ctx.shadowBlur = 35; ctx.shadowColor = "rgba(245,200,66,.75)";
  ctx.beginPath(); ctx.arc(mx, my + bob, clamp(18, 32, W * 0.028), 0, Math.PI * 2);
  ctx.fillStyle = "rgba(245,210,80,.98)"; ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath(); ctx.arc(mx + clamp(10, 18, W * 0.014), my + bob - 3, clamp(15, 26, W * 0.022), 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,1)"; ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.save(); ctx.translate(mx + clamp(26, 38, W * 0.032), my - 10 + bob); ctx.rotate(t * 0.4);
  ctx.fillStyle = "rgba(245,210,80,.95)"; ctx.font = `${clamp(9, 13, W * 0.011)}px serif`;
  ctx.textAlign = "center"; ctx.fillText("★", 0, 4); ctx.restore(); ctx.restore();
}

function drawMarbleFloor(ctx, cX, cY, t) {
  const floorW = clamp(200, W * 0.6, 750);
  const fg = ctx.createRadialGradient(cX, cY * 0.95, 0, cX, cY * 0.95, floorW * 0.8);
  fg.addColorStop(0, "rgba(220,200,160,.55)"); fg.addColorStop(0.5, "rgba(190,170,130,.4)");
  fg.addColorStop(1, "rgba(140,120,90,.15)");
  ctx.save(); ctx.fillStyle = fg;
  ctx.beginPath(); ctx.ellipse(cX, cY * 0.95, floorW * 0.8, floorW * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = -8; i <= 8; i++) {
    ctx.globalAlpha = 0.04 + Math.sin(t * 0.1 + i) * 0.02;
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cX + i * (floorW * 0.1), cY * 0.78);
    ctx.lineTo(cX + i * (floorW * 0.06), cY * 1.05); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();
}

function drawMinaret(ctx, x, y, idx, t) {
  const w = clamp(10, 20, W * 0.018), h = clamp(80, H * 0.32, 280);
  ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = "rgba(180,130,20,.3)";
  const mg = ctx.createLinearGradient(x - w / 2, 0, x + w, 0);
  mg.addColorStop(0, "#8a6010"); mg.addColorStop(0.4, "#c8961a");
  mg.addColorStop(0.7, "#a07820"); mg.addColorStop(1, "#4a3008");
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w * 0.38, y - h); ctx.lineTo(x - w * 0.38, y - h); ctx.fill();
  [0.25, 0.5, 0.7].forEach(fr => {
    ctx.fillStyle = "rgba(200,150,40,.5)"; ctx.fillRect(x - w * 0.55, y - h * fr - 2, w * 1.1, 4);
  });
  ctx.fillStyle = "rgba(200,150,40,.7)"; ctx.fillRect(x - w * 0.75, y - h * 0.65, w * 1.5, h * 0.04);
  ctx.beginPath(); ctx.moveTo(x - 1.5, y - h); ctx.lineTo(x + 1.5, y - h); ctx.lineTo(x, y - h - 28);
  ctx.fillStyle = "#f5c842"; ctx.fill();
  ctx.save(); ctx.translate(x, y - h - 36 + Math.sin(t * 0.35 + idx) * 0.5);
  ctx.rotate(Math.sin(t * 0.2 + idx) * 0.02);
  ctx.font = `${clamp(9, 14, W * 0.012)}px serif`; ctx.textAlign = "center";
  ctx.fillStyle = "rgba(245,200,66,.95)"; ctx.shadowBlur = 6; ctx.shadowColor = "rgba(245,200,66,.8)";
  ctx.fillText("☪", 0, 5); ctx.restore(); ctx.restore();
}

// =====================================================================
// IMPROVED KAABA — bigger, clearer, more realistic
// =====================================================================
function drawRealisticKaaba(ctx, cx, cy, size, rot, t) {
  ctx.save();
  // Atmospheric aura
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 3.5);
  aura.addColorStop(0, "rgba(200,160,40,.18)"); aura.addColorStop(0.4, "rgba(160,110,20,.07)");
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(cx, cy, size * 3.5, 0, Math.PI * 2); ctx.fill();

  const s = size, cosR = Math.cos(rot), sinR = Math.sin(rot);
  const kH = s * 1.15;
  const proj = (x, z) => { const rx = x * cosR - z * sinR, rz = x * sinR + z * cosR; return { sx: cx + rx, sz: rz }; };
  const hs = s * 0.54;
  const C = [proj(-hs, -hs), proj(hs, -hs), proj(hs, hs), proj(-hs, hs)];
  const sy = (pt, yOffset) => cy + yOffset + pt.sz * 0.06;

  const faces = [
    { i0: 0, i1: 1, light: 0.65 },
    { i0: 1, i1: 2, light: 0.52 },
    { i0: 2, i1: 3, light: 0.42 },
    { i0: 3, i1: 0, light: 0.58 },
  ].sort((a, b) => (C[a.i0].sz + C[a.i1].sz) / 2 - (C[b.i0].sz + C[b.i1].sz) / 2);

  faces.forEach(({ i0, i1, light }) => {
    const c0 = C[i0], c1 = C[i1];
    const isVisible = (c0.sz + c1.sz) / 2 < 0;
    const faceW = Math.abs(c1.sx - c0.sx);
    const bv = Math.round(8 + light * 20), bg = Math.round(7 + light * 17), bb = Math.round(9 + light * 18);

    // Kiswa — black velvet
    ctx.beginPath();
    ctx.moveTo(c0.sx, sy(c0, -kH / 2)); ctx.lineTo(c1.sx, sy(c1, -kH / 2));
    ctx.lineTo(c1.sx, sy(c1, kH / 2)); ctx.lineTo(c0.sx, sy(c0, kH / 2)); ctx.closePath();
    const vg = ctx.createLinearGradient(c0.sx, 0, c1.sx, 0);
    vg.addColorStop(0, `rgba(${bv},${bg},${bb},1)`);
    vg.addColorStop(0.35, `rgba(${bv + 14},${bg + 11},${bb + 13},1)`);
    vg.addColorStop(0.5, `rgba(${bv + 24},${bg + 20},${bb + 22},1)`);
    vg.addColorStop(0.65, `rgba(${bv + 14},${bg + 11},${bb + 13},1)`);
    vg.addColorStop(1, `rgba(${bv},${bg},${bb},1)`);
    ctx.fillStyle = vg; ctx.fill();

    // Fabric texture
    if (isVisible && faceW > 20) {
      ctx.save(); ctx.clip();
      ctx.globalAlpha = 0.06 * light; ctx.strokeStyle = "rgba(180,140,40,1)"; ctx.lineWidth = 0.5;
      const fTop = Math.min(sy(c0, -kH / 2), sy(c1, -kH / 2));
      const fBot = Math.max(sy(c0, kH / 2), sy(c1, kH / 2));
      for (let fy = fTop; fy < fBot; fy += 3.5) { ctx.beginPath(); ctx.moveTo(c0.sx, fy); ctx.lineTo(c1.sx, fy); ctx.stroke(); }
      ctx.restore();
    }

    // Golden Hizam belt
    const beltTopOff = -kH * 0.14, beltBotOff = kH * 0.08;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c0.sx, sy(c0, beltTopOff)); ctx.lineTo(c1.sx, sy(c1, beltTopOff));
    ctx.lineTo(c1.sx, sy(c1, beltBotOff)); ctx.lineTo(c0.sx, sy(c0, beltBotOff));
    ctx.closePath(); ctx.clip();
    const kg = ctx.createLinearGradient(c0.sx, sy(c0, beltTopOff), c0.sx, sy(c0, beltBotOff));
    kg.addColorStop(0, "rgba(80,55,5,.9)"); kg.addColorStop(0.08, "rgba(200,155,25,.95)");
    kg.addColorStop(0.25, "rgba(245,205,70,1)"); kg.addColorStop(0.5, "rgba(255,220,80,1)");
    kg.addColorStop(0.75, "rgba(240,195,55,1)"); kg.addColorStop(0.92, "rgba(185,140,18,.95)");
    kg.addColorStop(1, "rgba(70,48,4,.9)");
    const bH2 = sy(c0, beltBotOff) - sy(c0, beltTopOff);
    ctx.fillStyle = kg; ctx.fillRect(Math.min(c0.sx, c1.sx) - 2, sy(c0, beltTopOff), faceW + 4, bH2);
    // Belt calligraphy
    if (isVisible && faceW > 40) {
      const beltCy = sy(c0, (beltTopOff + beltBotOff) / 2);
      const fs = clamp(7, faceW * 0.12, 15);
      ctx.font = `bold ${fs}px Scheherazade New,serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(40,25,0,.8)";
      ctx.fillText("بسم الله الرحمن الرحيم", (c0.sx + c1.sx) / 2 + 1, beltCy + 1);
      ctx.fillStyle = "rgba(255,240,160,.95)";
      ctx.fillText("بسم الله الرحمن الرحيم", (c0.sx + c1.sx) / 2, beltCy);
      ctx.fillStyle = "rgba(255,235,150,.9)";
      ctx.fillText("لا إله إلا الله", (c0.sx + c1.sx) / 2, beltCy - fs);
    }
    ctx.restore();

    // Upper band (Shahada)
    const upTopOff = -kH * 0.40, upBotOff = -kH * 0.24;
    if (isVisible && faceW > 30) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(c0.sx, sy(c0, upTopOff)); ctx.lineTo(c1.sx, sy(c1, upTopOff));
      ctx.lineTo(c1.sx, sy(c1, upBotOff)); ctx.lineTo(c0.sx, sy(c0, upBotOff));
      ctx.closePath(); ctx.clip();
      const ug = ctx.createLinearGradient(c0.sx, 0, c1.sx, 0);
      ug.addColorStop(0, "rgba(160,120,15,.7)"); ug.addColorStop(0.5, "rgba(220,175,40,.85)");
      ug.addColorStop(1, "rgba(160,120,15,.7)");
      ctx.fillStyle = ug; ctx.fillRect(Math.min(c0.sx, c1.sx), sy(c0, upTopOff), faceW, sy(c0, upBotOff) - sy(c0, upTopOff));
      if (faceW > 45) {
        const ubCy = sy(c0, (upTopOff + upBotOff) / 2), ufs = clamp(6, faceW * 0.1, 12);
        ctx.font = `bold ${ufs}px Scheherazade New,serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillText("لا إله إلا الله محمد رسول الله", (c0.sx + c1.sx) / 2 + 0.5, ubCy + 0.5);
        ctx.fillStyle = "rgba(255,240,140,.92)"; ctx.fillText("لا إله إلا الله محمد رسول الله", (c0.sx + c1.sx) / 2, ubCy);
      }
      ctx.restore();
    }

    // Face edge
    ctx.strokeStyle = `rgba(${Math.round(light * 180)},${Math.round(light * 130)},${Math.round(light * 20)},.3)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(c0.sx, sy(c0, -kH / 2)); ctx.lineTo(c1.sx, sy(c1, -kH / 2));
    ctx.lineTo(c1.sx, sy(c1, kH / 2)); ctx.lineTo(c0.sx, sy(c0, kH / 2)); ctx.closePath(); ctx.stroke();

    // Door
    if (isVisible && (c0.sz + c1.sz) / 2 < -s * 0.08 && faceW > 32) {
      const doorCx = (c0.sx + c1.sx) / 2, doorCy = sy({ sz: (c0.sz + c1.sz) / 2 }, kH * 0.18);
      const doorW = Math.max(12, faceW * 0.3), doorH = kH * 0.4;
      ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = "rgba(245,200,50,.6)";
      const dfg = ctx.createLinearGradient(doorCx - doorW / 2, doorCy - doorH, doorCx + doorW / 2, doorCy);
      dfg.addColorStop(0, "rgba(80,55,5,1)"); dfg.addColorStop(0.15, "rgba(200,155,25,1)");
      dfg.addColorStop(0.5, "rgba(245,205,70,1)"); dfg.addColorStop(0.85, "rgba(200,155,25,1)");
      dfg.addColorStop(1, "rgba(80,55,5,1)");
      ctx.fillStyle = dfg;
      ctx.beginPath(); ctx.roundRect(doorCx - doorW / 2 - 2, doorCy - doorH - 2, doorW + 4, doorH + 4, doorW * 0.18); ctx.fill();
      ctx.fillStyle = "rgba(30,20,8,.95)";
      ctx.beginPath(); ctx.roundRect(doorCx - doorW / 2 + 2, doorCy - doorH + 2, doorW - 4, doorH - 2, doorW * 0.14); ctx.fill();
      ctx.fillStyle = "rgba(245,200,60,.9)";
      ctx.beginPath(); ctx.arc(doorCx, doorCy - doorH * 0.5, doorW * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  });

  // Roof
  ctx.beginPath();
  C.forEach((c, i) => i === 0 ? ctx.moveTo(c.sx, sy(c, -kH / 2)) : ctx.lineTo(c.sx, sy(c, -kH / 2)));
  ctx.closePath();
  const rg = ctx.createLinearGradient(C[0].sx, sy(C[0], -kH / 2), C[2].sx, sy(C[2], -kH / 2));
  rg.addColorStop(0, "rgba(18,14,10,1)"); rg.addColorStop(0.5, "rgba(28,22,14,1)");
  rg.addColorStop(1, "rgba(16,12,8,1)"); ctx.fillStyle = rg; ctx.fill();
  ctx.strokeStyle = "rgba(180,135,20,.6)"; ctx.lineWidth = 1.5; ctx.stroke();

  // Black Stone
  const bsC = C[1];
  const bsX = bsC.sx, bsY = sy(bsC, kH * 0.42);
  ctx.save(); ctx.shadowBlur = 6; ctx.shadowColor = "rgba(200,180,120,.5)";
  ctx.fillStyle = "rgba(160,140,100,.8)"; ctx.beginPath();
  ctx.arc(bsX, bsY, clamp(5, 9, s * 0.08), 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(15,10,8,.95)"; ctx.beginPath();
  ctx.arc(bsX, bsY, clamp(3.5, 6.5, s * 0.058), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

// =====================================================================
// SCENE 2: ARAFAT
// =====================================================================
const arafatState = { crowd: [], init: false };
function initArafat() {
  if (arafatState.init) return; arafatState.init = true;
  for (let i = 0; i < 200; i++) {
    arafatState.crowd.push({
      x: Math.random() * W, row: Math.random(), ph: Math.random() * Math.PI * 2,
      sp: 0.3 + Math.random() * 0.5, sc: 0.45 + Math.random() * 0.7, hue: 15 + Math.random() * 20
    });
  }
}
function loopArafat() {
  initArafat(); const ctx = ctxs.arafat;
  function draw() {
    if (currentScene !== 1) return; rafs[1] = requestAnimationFrame(draw);
    const t = Date.now() / 1000; ctx.clearRect(0, 0, W, H);
    const sk = ctx.createLinearGradient(0, 0, 0, H);
    sk.addColorStop(0, "#e8700a"); sk.addColorStop(0.2, "#f09040");
    sk.addColorStop(0.5, "#f0b060"); sk.addColorStop(0.8, "#d8b070"); sk.addColorStop(1, "#c09060");
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    drawArafatSun(ctx, t); drawArafatMountainLayers(ctx, t);
    const gnd = ctx.createLinearGradient(0, H * 0.58, 0, H);
    gnd.addColorStop(0, "#c8a060"); gnd.addColorStop(0.4, "#b89050"); gnd.addColorStop(1, "#9a7840");
    ctx.fillStyle = gnd; ctx.fillRect(0, H * 0.58, W, H);
    drawRealisticTents(ctx, t); drawJabalRahmaRealistic(ctx, W * 0.6, H * 0.42, t);
    drawArafatCrowd(ctx, arafatState.crowd, t); drawDuaHands(ctx, W * 0.5, H * 0.48, t);
  }
  draw();
}
function drawArafatSun(ctx, t) {
  const sx = W * 0.48, sy = H * 0.11 + Math.sin(t * 0.15) * 4;
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const ang = (i * Math.PI) / 10 + t * 0.03, r1 = clamp(55, 85, W * 0.07), r2 = clamp(90, 140, W * 0.12);
    ctx.beginPath(); ctx.moveTo(sx + r1 * Math.cos(ang), sy + r1 * Math.sin(ang));
    ctx.lineTo(sx + r2 * Math.cos(ang), sy + r2 * Math.sin(ang));
    ctx.strokeStyle = `rgba(255,230,100,${0.1 + 0.07 * Math.sin(t + i)})`; ctx.lineWidth = clamp(3, 6, W * 0.005); ctx.stroke();
  }
  const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, clamp(45, 75, W * 0.065));
  sg.addColorStop(0, "rgba(255,255,230,1)"); sg.addColorStop(0.3, "rgba(255,235,80,.95)");
  sg.addColorStop(0.7, "rgba(255,180,50,.5)"); sg.addColorStop(1, "rgba(255,150,0,0)");
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, clamp(45, 75, W * 0.065), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawArafatMountainLayers(ctx, t) {
  [[0.2, 0.18, "#c08050"], [-0.05, 0.22, "#b07040"], [0.6, 0.15, "#c08858"], [0.75, 0.2, "#b07848"]].forEach(([xo, h, col]) => {
    ctx.beginPath(); ctx.moveTo(0, H * 0.6);
    for (let x = 0; x <= W; x += 20) {
      const ny = H * (0.6 - h * Math.max(0, 1 - Math.abs((x / W - (0.5 - xo / 0.5)) / 0.4)));
      x === 0 ? ctx.moveTo(x, H * 0.6) : ctx.lineTo(x, Math.min(H * 0.6, ny + Math.sin(x * 0.05 + t * 0.02) * 3));
    }
    ctx.lineTo(W, H * 0.6); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  });
}
function drawJabalRahmaRealistic(ctx, x, y, t) {
  ctx.save();
  const mx = x, bY = H * 0.58, mW = clamp(80, W * 0.18, 200), mH = clamp(80, H * 0.22, 200);
  ctx.beginPath(); ctx.moveTo(mx - mW, bY);
  for (let i = 0; i <= 20; i++) { const lx = mx - mW + i * (mW / 20), ly = bY - mH * (i / 20) ** 1.5 + Math.sin(i * 0.8) * 8; ctx.lineTo(lx, ly); }
  for (let i = 20; i >= 0; i--) { const lx = mx + i * (mW / 20), ly = bY - mH * (i / 20) ** 1.6 + Math.sin(i * 0.7 + 1) * 7; ctx.lineTo(lx, ly); }
  ctx.closePath();
  const mg = ctx.createLinearGradient(mx - mW, bY, mx + mW, y);
  mg.addColorStop(0, "#7a5830"); mg.addColorStop(0.4, "#a07848");
  mg.addColorStop(0.7, "#8a6838"); mg.addColorStop(1, "#5a3818");
  ctx.fillStyle = mg; ctx.fill();
  const pillarH = clamp(50, H * 0.1, 90);
  const pg = ctx.createLinearGradient(mx - 5, y - pillarH, mx + 5, y);
  pg.addColorStop(0, "#f0e8d0"); pg.addColorStop(1, "#c0b090");
  ctx.fillStyle = pg; ctx.fillRect(mx - 5, y - pillarH, 10, pillarH);
  ctx.fillStyle = "rgba(245,200,66,.9)"; ctx.fillRect(mx - 9, y - pillarH - 6, 18, 6);
  ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = "rgba(245,200,66,.9)";
  ctx.fillStyle = "#f5c842"; ctx.beginPath();
  ctx.arc(mx, y - pillarH - 14 + Math.sin(t * 0.5) * 3, clamp(8, 14, W * 0.012), 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.restore();
}
function drawRealisticTents(ctx, t) {
  const n = 12, y = H * 0.6;
  for (let i = 0; i < n; i++) {
    const tx2 = W * ((i / (n - 1)) * 0.85 + 0.08), tw = clamp(22, 42, W * 0.04), th = clamp(18, 32, W * 0.03);
    ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.beginPath();
    ctx.ellipse(tx2, y + 4, tw * 0.8, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx2 - tw, y); ctx.lineTo(tx2, y - th); ctx.lineTo(tx2 + tw, y); ctx.closePath();
    const tg = ctx.createLinearGradient(tx2 - tw, y, tx2 + tw, y);
    tg.addColorStop(0, "#d8d0c0"); tg.addColorStop(0.5, "#f0ece0"); tg.addColorStop(1, "#c8c0b0");
    ctx.fillStyle = tg; ctx.fill(); ctx.strokeStyle = "rgba(160,140,110,.4)"; ctx.lineWidth = 0.8; ctx.stroke();
  }
}
function drawArafatCrowd(ctx, crowd, t) {
  crowd.forEach(p => {
    const gy = H * 0.62 + p.row * H * 0.1, sc = p.sc * (0.45 + p.row * 0.6);
    ctx.save(); ctx.translate(p.x, gy); ctx.scale(sc, sc);
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -11, 3.5, 0, Math.PI * 2); ctx.fill();
    const armA = Math.sin(t * p.sp + p.ph) * 0.35 + 0.2;
    ctx.strokeStyle = "rgba(245,240,230,.9)"; ctx.lineWidth = 1.8; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-2, -1); ctx.lineTo(-8, -8 - armA * 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -1); ctx.lineTo(8, -8 - armA * 5); ctx.stroke();
    ctx.restore();
  });
}
function drawDuaHands(ctx, x, y, t) {
  ctx.save(); const raise = Math.sin(t * 0.45) * 6; ctx.globalAlpha = 0.8;
  const handW = clamp(22, 34, W * 0.028), handH = clamp(40, 60, H * 0.065);
  const lhg = ctx.createLinearGradient(-handW / 2, -handH / 2, handW / 2, handH / 2);
  lhg.addColorStop(0, "#d4a070"); lhg.addColorStop(0.6, "#c09060"); lhg.addColorStop(1, "#b08050");
  ctx.save(); ctx.translate(x - handW - 8, y - raise);
  ctx.fillStyle = lhg; ctx.beginPath(); ctx.roundRect(-handW / 2, -handH / 2, handW, handH, 7); ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = lhg; ctx.beginPath(); ctx.roundRect(-handW * 0.4 + i * handW * 0.27, -handH / 2 - handH * 0.22, handW * 0.22, handH * 0.25, 5); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.translate(x + handW + 8, y - raise + 1);
  ctx.fillStyle = lhg; ctx.beginPath(); ctx.roundRect(-handW / 2, -handH / 2, handW, handH, 7); ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = lhg; ctx.beginPath(); ctx.roundRect(-handW * 0.4 + i * handW * 0.27, -handH / 2 - handH * 0.22, handW * 0.22, handH * 0.25, 5); ctx.fill(); }
  ctx.restore();
  ctx.restore();
}

// =====================================================================
// SCENE 3: MUZDALIFA
// =====================================================================
const muzdalifaState = { pilgrims: [], init: false };
function initMuzdalifa() {
  if (muzdalifaState.init) return; muzdalifaState.init = true;
  for (let i = 0; i < 90; i++) { muzdalifaState.pilgrims.push({ x: Math.random() * W, y: H * 0.65 + Math.random() * H * 0.15, sc: 0.5 + Math.random() * 0.5, ph: Math.random() * Math.PI * 2, action: Math.floor(Math.random() * 3) }); }
}
function loopMuzdalifa() {
  initMuzdalifa(); const ctx = ctxs.muzdalifa;
  function draw() {
    if (currentScene !== 2) return; rafs[2] = requestAnimationFrame(draw); const t = Date.now() / 1000;
    ctx.clearRect(0, 0, W, H);
    const sk = ctx.createLinearGradient(0, 0, 0, H);
    sk.addColorStop(0, "#030008"); sk.addColorStop(0.3, "#08000f"); sk.addColorStop(0.6, "#050008"); sk.addColorStop(1, "#030005");
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    stars.forEach(s => { const op = 0.3 + 0.7 * Math.abs(Math.sin(t * s.sp * 8 + s.ph)); ctx.beginPath(); ctx.arc(s.x, s.y * 0.72, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,220,${op})`; ctx.fill(); });
    drawFullMoon(ctx, W * 0.15, H * 0.08, t); drawMuzdalifaMountains(ctx);
    const gnd = ctx.createLinearGradient(0, H * 0.62, 0, H);
    gnd.addColorStop(0, "#1a1410"); gnd.addColorStop(0.5, "#121008"); gnd.addColorStop(1, "#0a0806");
    ctx.fillStyle = gnd; ctx.fillRect(0, H * 0.62, W, H);
    drawPebbles(ctx, t); drawCampfires(ctx, t);
    muzdalifaState.pilgrims.forEach(p => drawMuzdalifaPilgrim(ctx, p, t));
    drawNightTents(ctx, t);
  }
  draw();
}
function drawFullMoon(ctx, mx, my, t) {
  ctx.save(); const bob = Math.sin(t * 0.2) * 3; ctx.shadowBlur = 40; ctx.shadowColor = "rgba(220,200,140,.5)";
  const mg = ctx.createRadialGradient(mx, my + bob, 0, mx, my + bob, clamp(30, 50, W * 0.044));
  mg.addColorStop(0, "rgba(240,230,190,1)"); mg.addColorStop(0.6, "rgba(220,210,160,.9)"); mg.addColorStop(1, "rgba(180,160,100,0)");
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my + bob, clamp(30, 50, W * 0.044), 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function drawMuzdalifaMountains(ctx) {
  [[0.0, 0.25, "#0e0a06"], [-0.1, 0.3, "#0a0804"], [0.65, 0.22, "#0e0a06"], [0.8, 0.28, "#080604"]].forEach(([xo, h, col]) => {
    ctx.beginPath(); ctx.moveTo(0, H * 0.65);
    for (let x = 0; x <= W; x += 25) { const hi = h * Math.max(0, Math.sin((x / W - xo) * Math.PI)); ctx.lineTo(x, H * (0.65 - hi)); }
    ctx.lineTo(W, H * 0.65); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  });
}
function drawPebbles(ctx, t) {
  for (let i = 0; i < 80; i++) {
    const px = ((i * 173.7) % 1) * W, py = H * 0.65 + ((i * 89.3) % 1) * H * 0.2, ps = 1 + ((i * 37) % 1) * 3;
    ctx.fillStyle = `rgba(${80 + (Math.floor(i * 1.5) % 40)},${70 + (Math.floor(i * 1.2) % 30)},${60 + (Math.floor(i * 0.9) % 25)},.7)`;
    ctx.beginPath(); ctx.ellipse(px, py, ps, ps * 0.7, ((i * 23) % 1) * Math.PI, 0, Math.PI * 2); ctx.fill();
  }
}
function drawCampfires(ctx, t) {
  [[0.15, 0.67], [0.4, 0.69], [0.7, 0.68], [0.88, 0.67]].forEach(([xr, yr], i) => {
    const fx = W * xr, fy = H * yr;
    const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, clamp(20, 40, W * 0.035));
    fg.addColorStop(0, `rgba(255,160,30,${0.3 + Math.sin(t * 4 + i) * 0.15})`); fg.addColorStop(1, "transparent");
    ctx.fillStyle = fg; ctx.fillRect(fx - 40, fy - 40, 80, 60);
    ctx.fillStyle = "rgba(40,20,10,.9)"; ctx.save(); ctx.translate(fx, fy); ctx.rotate(0.5);
    ctx.fillRect(-12, -2, 24, 5); ctx.rotate(-1); ctx.fillRect(-12, -2, 24, 5); ctx.restore();
    for (let fl = 0; fl < 3; fl++) {
      const fa = 0.5 + 0.5 * Math.abs(Math.sin(t * 7 + i + fl));
      ctx.save(); ctx.translate(fx + fl * 4 - 4, fy - 2);
      ctx.fillStyle = `rgba(${255},${100 + fl * 40},${20 * fl},${fa * 0.9})`;
      ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(-5, -12 + Math.sin(t * 8 + fl) * 3, 0, -20 - fl * 5 - Math.sin(t * 6 + fl) * 4);
      ctx.quadraticCurveTo(5, -12 + Math.cos(t * 7 + fl) * 3, 3, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  });
}
function drawMuzdalifaPilgrim(ctx, p, t) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.sc, p.sc);
  if (p.action === 0) { ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(0, 4, 14, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(15, 0, 4.5, 0, Math.PI * 2); ctx.fill(); }
  else if (p.action === 1) {
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -10, 4.5, 0, Math.PI * 2); ctx.fill();
    const armA = Math.sin(t * p.sp + p.ph) * 0.4 + 0.3;
    ctx.strokeStyle = "rgba(245,240,230,.9)"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(12, 6 + armA * 4); ctx.stroke();
    ctx.fillStyle = "rgba(100,80,60,.8)"; ctx.beginPath(); ctx.arc(14, 8 + armA * 4, 2.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(0, 4, 5, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -9, 5, 0, Math.PI * 2); ctx.fill();
    const armA = Math.sin(t * 0.5 + p.ph) * 0.2;
    ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-10, -6 - armA * 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(10, -6 - armA * 4); ctx.stroke();
  }
  ctx.restore();
}
function drawNightTents(ctx, t) {
  for (let i = 0; i < 6; i++) {
    const tx = W * (0.1 + i * 0.16), ty = H * 0.65, tw = clamp(25, 38, W * 0.033), th = clamp(16, 26, W * 0.022);
    ctx.fillStyle = "rgba(20,16,12,.85)"; ctx.beginPath(); ctx.moveTo(tx - tw, ty); ctx.lineTo(tx, ty - th); ctx.lineTo(tx + tw, ty); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(100,80,50,.3)"; ctx.lineWidth = 1; ctx.stroke();
  }
}

// =====================================================================
// SCENE 4: JAMARAT
// =====================================================================
const jamaratState = { stones: [], sparks: [], throwers: [], init: false };
function initJamarat() {
  if (jamaratState.init) return; jamaratState.init = true;
  [0.08, 0.18, 0.28, 0.38, 0.62, 0.72, 0.82, 0.92, 0.5].forEach((xr, i) => { jamaratState.throwers.push({ xr, ph: i * 0.7, hue: 15 + i * 10 }); });
}
function loopJamarat() {
  initJamarat(); const ctx = ctxs.jamarat; let lastStone = 0;
  function draw() {
    if (currentScene !== 3) return; rafs[3] = requestAnimationFrame(draw); const t = Date.now() / 1000;
    ctx.clearRect(0, 0, W, H);
    const sk = ctx.createLinearGradient(0, 0, 0, H);
    sk.addColorStop(0, "#07021a"); sk.addColorStop(0.3, "#160635"); sk.addColorStop(0.6, "#240858"); sk.addColorStop(1, "#120430");
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    stars.slice(0, 180).forEach(s => { const op = 0.1 + 0.8 * Math.abs(Math.sin(t * s.sp * 8 + s.ph)); ctx.beginPath(); ctx.arc(s.x, s.y * 0.6, s.r * 0.9, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,220,${op})`; ctx.fill(); });
    drawJamaratBridge(ctx, t);
    const pillarX = W * 0.5, pillarY = H * 0.35;
    drawJamaratPillar(ctx, pillarX, pillarY, t);
    const gg = ctx.createLinearGradient(0, H * 0.68, 0, H);
    gg.addColorStop(0, "#1a1230"); gg.addColorStop(1, "#080614");
    ctx.fillStyle = gg; ctx.fillRect(0, H * 0.68, W, H);
    jamaratState.throwers.forEach(th => drawRealisticThrower(ctx, W * th.xr, H * 0.7, t + th.ph, th.hue));
    if (t - lastStone > 0.15) { lastStone = t; jamaratState.stones.push({ x: W * (0.28 + Math.random() * 0.44), y: H * 0.58 + Math.random() * H * 0.08, vx: (pillarX - W * (0.28 + Math.random() * 0.44)) * 0.05, vy: -3.5 - Math.random() * 4.5, life: 1 }); }
    jamaratState.stones = jamaratState.stones.filter(s => {
      s.x += s.vx; s.vy += 0.22; s.y += s.vy; s.life -= 0.02; if (s.life <= 0) return false;
      ctx.save(); ctx.globalAlpha = s.life; ctx.fillStyle = `hsl(0,0%,${50 + Math.floor(Math.random() * 25)}%)`; ctx.shadowBlur = 3; ctx.shadowColor = "rgba(255,180,80,.3)";
      ctx.beginPath(); ctx.ellipse(s.x, s.y, clamp(3, 5, W * 0.004), clamp(2, 3.5, W * 0.003), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (Math.abs(s.x - pillarX) < clamp(22, 42, W * 0.038) && s.y > H * 0.38 && s.y < H * 0.64) {
        for (let i = 0; i < 5; i++)jamaratState.sparks.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 5.5, vy: (Math.random() - 0.5) * 5.5, life: 1 });
        return false;
      }
      return true;
    });
    jamaratState.sparks = jamaratState.sparks.filter(sp => {
      sp.x += sp.vx; sp.y += sp.vy; sp.vy += 0.08; sp.life -= 0.055; if (sp.life <= 0) return false;
      ctx.save(); ctx.globalAlpha = sp.life; ctx.fillStyle = `hsl(${25 + Math.floor(Math.random() * 25)},100%,68%)`; ctx.beginPath(); ctx.arc(sp.x, sp.y, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      return true;
    });
  }
  draw();
}
function drawJamaratBridge(ctx, t) {
  [[0.58, 0.022], [0.62, 0.022], [0.66, 0.022]].forEach(([yr, hR], level) => {
    const bY = H * yr, bH = clamp(10, 18, H * hR);
    [[0.15, H * 0.72], [0.85, H * 0.72]].forEach(([xr, py]) => {
      const bx = W * xr; ctx.fillStyle = "#2a2040"; ctx.fillRect(bx - clamp(8, 15, W * 0.012), bY, clamp(16, 30, W * 0.024), py - bY);
    });
    const bdg = ctx.createLinearGradient(0, bY, 0, bY + bH);
    bdg.addColorStop(0, "#504070"); bdg.addColorStop(1, "#302848");
    ctx.fillStyle = bdg; ctx.beginPath(); ctx.roundRect(W * 0.08, bY, W * 0.84, bH, 3); ctx.fill();
  });
  const bY = H * 0.58;
  for (let i = 0; i < 10; i++) {
    const lx = W * 0.1 + i * W * 0.09; ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = "rgba(255,200,60,.85)";
    ctx.fillStyle = "rgba(255,215,70,.95)"; ctx.beginPath(); ctx.arc(lx, bY - 2, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
function drawJamaratPillar(ctx, x, y, t) {
  const pw = clamp(32, 50, W * 0.042), ph = clamp(110, 170, H * 0.2);
  ctx.save(); ctx.shadowBlur = 25; ctx.shadowColor = "rgba(180,130,50,.3)";
  const gr = clamp(32, 55, W * 0.048) + Math.sin(t * 2) * 3;
  const gl = ctx.createRadialGradient(x, y + ph * 0.5, gr * 0.25, x, y + ph * 0.5, gr);
  gl.addColorStop(0, "rgba(180,130,50,.18)"); gl.addColorStop(1, "transparent");
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y + ph * 0.5, gr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#5a5248"; ctx.beginPath();
  ctx.moveTo(x - pw / 2, y); ctx.lineTo(x - pw / 2 - pw * 0.28, y + 9); ctx.lineTo(x - pw / 2 - pw * 0.28, y + ph + 9); ctx.lineTo(x - pw / 2, y + ph); ctx.fill();
  const pg = ctx.createLinearGradient(x - pw / 2, y, x + pw / 2, y);
  pg.addColorStop(0, "#8a8270"); pg.addColorStop(0.5, "#c8c0a8"); pg.addColorStop(1, "#8a8270");
  ctx.fillStyle = pg; ctx.fillRect(x - pw / 2, y, pw, ph);
  ctx.fillStyle = "#b0a890"; ctx.beginPath(); ctx.roundRect(x - pw * 0.65, y - clamp(9, 15, H * 0.02), pw * 1.3, clamp(9, 15, H * 0.02), 3); ctx.fill();
  ctx.restore();
}
function drawRealisticThrower(ctx, x, y, t, hue) {
  ctx.save(); ctx.translate(x, y); ctx.scale(0.85, 0.85);
  ctx.fillStyle = "rgba(245,242,235,.92)"; ctx.beginPath(); ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `hsl(${hue + 10},20%,72%)`; ctx.beginPath(); ctx.arc(0, -16, 5.5, 0, Math.PI * 2); ctx.fill();
  const throwPhase = (t % 2) / 2;
  const armAng = -Math.PI * 0.7 + Math.sin(throwPhase * Math.PI * 2) * 0.9;
  ctx.strokeStyle = "rgba(245,242,235,.9)"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(5 + 14 * Math.cos(armAng), -8 + 14 * Math.sin(armAng)); ctx.stroke();
  if (throwPhase < 0.6) { ctx.fillStyle = "rgba(100,80,60,.9)"; ctx.beginPath(); ctx.arc(5 + 14 * Math.cos(armAng), -8 + 14 * Math.sin(armAng), 2.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// =====================================================================
// SCENE 5: EID — Realistic 3D Sheep + Fireworks
// =====================================================================
const eidState = { fireworks: [], fwParts: [], confetti: [], init: false };
let fwInterval = null;
function stopFireworks() { if (fwInterval) { clearInterval(fwInterval); fwInterval = null; } }

function initEid() {
  if (eidState.init) return; eidState.init = true;
  const colors = ["#f5c842", "#ff6b1a", "#2a8a3a", "#e84a4a", "#4a8ae8", "#e84ae8", "#ffffff", "#ffd700"];
  for (let i = 0; i < 130; i++) {
    eidState.confetti.push({
      x: Math.random() * W, y: -Math.random() * H, vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2,
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.08, w: 5 + Math.random() * 10, h: 5 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)], isCircle: Math.random() > 0.5
    });
  }
}
function loopEid() {
  initEid(); stopFireworks();
  fwInterval = setInterval(() => { if (currentScene !== 4) return; spawnFirework(); }, 450);
  const ctx = ctxs.eid;
  function draw() {
    if (currentScene !== 4) return; rafs[4] = requestAnimationFrame(draw); const t = Date.now() / 1000;
    ctx.clearRect(0, 0, W, H);
    const sk = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, H * 1.2);
    sk.addColorStop(0, "#1a3a0a"); sk.addColorStop(0.4, "#0d2200"); sk.addColorStop(0.8, "#060f00"); sk.addColorStop(1, "#020800");
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    stars.slice(0, 200).forEach(s => { const op = 0.2 + 0.7 * Math.abs(Math.sin(t * s.sp * 8 + s.ph)); ctx.beginPath(); ctx.arc(s.x, s.y * 0.7, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,220,${op})`; ctx.fill(); });
    const mdw = ctx.createLinearGradient(0, H * 0.65, 0, H);
    mdw.addColorStop(0, "#1e5a1a"); mdw.addColorStop(0.4, "#0e3a0c"); mdw.addColorStop(1, "#06200a");
    ctx.fillStyle = mdw;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.72);
    for (let i = 0; i <= W; i += 25)ctx.lineTo(i, H * 0.72 - 9 * Math.sin((i / W) * Math.PI * 5 + t * 0.4));
    ctx.lineTo(W, H); ctx.fill();
    drawEidLanterns(ctx, t);
    updateEidConfetti(ctx, t); updateEidFireworks(ctx);
    const sx = W * 0.5 + Math.sin(t * 0.28) * clamp(12, 28, W * 0.025);
    const sy2 = H * 0.74 + Math.sin(t * 0.45) * clamp(4, 8, H * 0.01);
    drawRealisticSheep3D(ctx, sx, sy2, t);
    drawEidDecorations(ctx, t);
  }
  draw();
}

function drawEidLanterns(ctx, t) {
  [[0.05, "#ff6b1a", "#7a0000"], [0.2, "#f5c842", "#7a5000"], [0.5, "#2a8a3a", "#0a3a10"], [0.8, "#8b1a8b", "#380038"], [0.95, "#1a4a8b", "#0a1040"]].forEach(([xr, c, c2], i) => {
    const lx = W * xr, swing = Math.sin(t * 0.4 + i) * 0.1;
    ctx.save(); ctx.translate(lx, 0);
    ctx.strokeStyle = "rgba(180,140,50,.35)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(Math.sin(swing) * 18, clamp(38, 65, H * 0.065)); ctx.stroke();
    ctx.translate(Math.sin(swing) * 18, clamp(38, 65, H * 0.065));
    const lw = clamp(24, 38, W * 0.032), lh = clamp(44, 62, H * 0.07);
    ctx.save(); ctx.rotate(swing);
    ctx.fillStyle = c2; ctx.beginPath(); ctx.roundRect(-lw / 2, -lh / 2, lw, lh, 7); ctx.fill();
    ctx.shadowBlur = 25 + Math.sin(t * 0.7 + i) * 8; ctx.shadowColor = c; ctx.globalAlpha = 0.75;
    ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(-lw / 2 + 2, -lh / 2 + 2, lw - 4, lh - 4, 6); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(200,160,40,.7)"; ctx.fillRect(-lw * 0.6, -lh / 2 - 5, lw * 1.2, 5); ctx.fillRect(-lw * 0.6, lh / 2, lw * 1.2, 5);
    ctx.restore(); ctx.restore();
  });
}
function updateEidConfetti(ctx, t) {
  eidState.confetti.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.rot += p.vr; if (p.y > H + 20) p.y = -20;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 0.78; ctx.fillStyle = p.color;
    if (p.isCircle) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
    ctx.restore();
  });
}
function spawnFirework() {
  eidState.fireworks.push({ x: W * (0.1 + Math.random() * 0.8), y: H, tx: W * (0.1 + Math.random() * 0.8), ty: H * (0.08 + Math.random() * 0.42), vy: -13 - Math.random() * 8, vx: (Math.random() - 0.5) * 3, color: `hsl(${Math.random() * 360},100%,70%)`, trail: [], exploded: false });
}
function updateEidFireworks(ctx) {
  eidState.fireworks = eidState.fireworks.filter(fw => {
    fw.trail.push({ x: fw.x, y: fw.y }); if (fw.trail.length > 10) fw.trail.shift();
    fw.x += fw.vx; fw.y += fw.vy; fw.vy += 0.32;
    fw.trail.forEach((p, i) => { ctx.save(); ctx.globalAlpha = (i / fw.trail.length) * 0.65; ctx.fillStyle = fw.color; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = fw.color; ctx.fillStyle = fw.color; ctx.beginPath(); ctx.arc(fw.x, fw.y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    if (fw.vy >= 0 || fw.y <= fw.ty + 18) { explodeFirework(fw); return false; }
    return true;
  });
  eidState.fwParts = eidState.fwParts.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.055; p.vx *= 0.97; p.vy *= 0.97; p.alpha -= 0.011; if (p.alpha <= 0) return false;
    ctx.save(); ctx.globalAlpha = p.alpha; ctx.shadowBlur = 5; ctx.shadowColor = p.color; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    return true;
  });
}
function explodeFirework(fw) {
  const n = 90 + Math.floor(Math.random() * 60);
  const cols = [fw.color, "#fff", "#ffd700", "#ff8c00", "#ff4488"];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + Math.random() * 0.3, sp = 0.5 + Math.random() * 7;
    eidState.fwParts.push({ x: fw.x, y: fw.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, color: cols[Math.floor(Math.random() * cols.length)], alpha: 1, r: 1 + Math.random() * 2.5 });
  }
}


// ===============================
// CUTE SHEEP IMAGE
// ===============================
const sheepImg = new Image();
sheepImg.src = "sheep.png"; 

function drawRealisticSheep3D(ctx, x, y, t) {
  if (!sheepImg.complete) return;

  ctx.save();

  // حركة خفيفة
  const floatY = Math.sin(t * 2) * 4;

  // حجم الخروف
  const sheepW = clamp(140, 220, W * 0.16);
  const sheepH = sheepW * 0.78;

  // ظل
  const shadow = ctx.createRadialGradient(
    x,
    y + sheepH * 0.42,
    10,
    x,
    y + sheepH * 0.42,
    sheepW * 0.55
  );

  shadow.addColorStop(0, "rgba(0,0,0,.28)");
  shadow.addColorStop(1, "transparent");

  ctx.fillStyle = shadow;

  ctx.beginPath();
  ctx.ellipse(
    x,
    y + sheepH * 0.42,
    sheepW * 0.38,
    sheepH * 0.12,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // رسم الصورة
  ctx.drawImage(
    sheepImg,
    x - sheepW / 2,
    y - sheepH / 2 + floatY,
    sheepW,
    sheepH
  );

  ctx.restore();
}

function drawEidDecorations(ctx, t) {
  const decos = ["✨", "⭐", "🌙", "☪️", "🌟", "💫", "✦"];
  [[0.07, 0.14], [0.93, 0.11], [0.14, 0.43], [0.86, 0.38], [0.04, 0.63], [0.94, 0.58], [0.3, 0.07], [0.72, 0.09], [0.5, 0.04], [0.22, 0.28], [0.78, 0.26]].forEach(([xr, yr], i) => {
    const bob = Math.sin(t * 0.55 + i) * clamp(5, 11, H * 0.013);
    ctx.save(); ctx.translate(W * xr, H * yr + bob); ctx.rotate(Math.sin(t * 0.28 + i) * 0.18);
    ctx.font = `${clamp(13, 20, W * 0.017)}px serif`; ctx.textAlign = "center";
    ctx.globalAlpha = 0.45 + 0.45 * Math.abs(Math.sin(t * 0.38 + i));
    ctx.fillText(decos[i % decos.length], 0, 0); ctx.restore();
  });
}