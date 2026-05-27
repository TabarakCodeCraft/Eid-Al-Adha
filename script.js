
      "use strict";
      let currentScene = 0;
      const TOTAL_SCENES = 5;
      const SCENE_LABELS = [
        "الطواف حول الكعبة",
        "وقفة عرفات",
        "مزدلفة",
        "رمي الجمرات",
        "عيد الأضحى",
      ];
      let isTransitioning = false,
        autoTimer = null;
      const AUTO_MS = 10000;
      let W = window.innerWidth,
        H = window.innerHeight;
      let soundOn = false,
        audioCtx = null,
        ambientNodes = [];
      let bgCanvas, bgCtx;
      let canvases = {},
        ctxs = {},
        rafs = {};
      let stars = [];

      // ===================== INIT =====================
      window.addEventListener("load", () => {
        W = window.innerWidth;
        H = window.innerHeight;
        initBg();
        initDust();
        initDots();
        initAllCanvases();
        showScene(0, false);
        scheduleAuto();
        initInput();
        window.addEventListener("resize", onResize);
        requestAnimationFrame(bgLoop);
      });

      function onResize() {
        W = window.innerWidth;
        H = window.innerHeight;
        bgCanvas.width = W;
        bgCanvas.height = H;
        document.querySelectorAll(".scene-canvas").forEach((c) => {
          c.width = W;
          c.height = H;
        });
      }

      // ===================== BG STARS =====================
      function initBg() {
        bgCanvas = document.getElementById("bgCanvas");
        bgCtx = bgCanvas.getContext("2d");
        bgCanvas.width = W;
        bgCanvas.height = H;
        for (let i = 0; i < 280; i++) {
          stars.push({
            x: Math.random() * W,
            y: Math.random() * H * 0.7,
            r: Math.random() * 1.8,
            ph: Math.random() * Math.PI * 2,
            sp: 0.004 + Math.random() * 0.009,
          });
        }
      }
      function bgLoop() {
        bgCtx.clearRect(0, 0, W, H);
        const t = Date.now() / 1000;
        stars.forEach((s) => {
          const op = 0.25 + 0.75 * Math.abs(Math.sin(t * s.sp * 10 + s.ph));
          bgCtx.beginPath();
          bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          bgCtx.fillStyle = `rgba(255,255,220,${op.toFixed(2)})`;
          bgCtx.fill();
        });
        requestAnimationFrame(bgLoop);
      }

      // ===================== GOLD DUST =====================
      function initDust() {
        const c = document.getElementById("goldDust");
        for (let i = 0; i < 35; i++) {
          const d = document.createElement("div");
          d.className = "dust";
          const sz = 2 + Math.random() * 4,
            alpha = 0.4 + Math.random() * 0.6;
          d.style.cssText = `left:${Math.random() * 100}%;bottom:${Math.random() * 15}%;width:${sz}px;height:${sz}px;background:radial-gradient(circle,rgba(245,200,66,${alpha}),transparent);animation-duration:${9 + Math.random() * 16}s;animation-delay:-${Math.random() * 16}s;`;
          c.appendChild(d);
        }
      }

      // ===================== DOTS =====================
      function initDots() {
        const c = document.getElementById("sceneDots");
        const labels = ["الطواف", "عرفات", "مزدلفة", "الجمرات", "العيد"];
        for (let i = 0; i < TOTAL_SCENES; i++) {
          const d = document.createElement("div");
          d.className = "dot" + (i === 0 ? " active" : "");
          d.title = labels[i];
          d.onclick = () => goToScene(i);
          c.appendChild(d);
        }
        updateProgress(0);
      }
      function updateDots() {
        document
          .querySelectorAll(".dot")
          .forEach((d, i) => d.classList.toggle("active", i === currentScene));
      }
      function updateProgress(i) {
        document.getElementById("progressBar").style.width =
          `${(i / (TOTAL_SCENES - 1)) * 100}%`;
        document.getElementById("sceneLabel").textContent =
          SCENE_LABELS[i] || "";
      }

      // ===================== CANVAS INIT =====================
      function initAllCanvases() {
        ["tawaf", "arafat", "muzdalifa", "jamarat", "eid"].forEach((name) => {
          const c = document.getElementById(name + "Canvas");
          c.width = W;
          c.height = H;
          canvases[name] = c;
          ctxs[name] = c.getContext("2d");
        });
      }

      // ===================== SCENE TRANSITIONS =====================
      function showScene(idx, animate = true) {
        document.querySelectorAll(".scene").forEach((s, i) => {
          s.classList.remove("entering", "exiting", "active");
          if (i === idx) {
            s.classList.add("active");
            if (animate) {
              s.classList.add("entering");
              setTimeout(() => s.classList.remove("entering"), 1300);
            }
          }
        });
        currentScene = idx;
        updateDots();
        updateProgress(idx);
        startSceneLoop(idx);
        updateNavBtns();
        if (soundOn) updateAmbientForScene(idx);
      }

      function goToScene(idx) {
        if (isTransitioning || idx === currentScene) return;
        isTransitioning = true;
        clearAuto();
        const old = document.querySelectorAll(".scene")[currentScene];
        stopSceneLoop(currentScene);
        old.classList.add("exiting");
        setTimeout(() => {
          old.classList.remove("active", "exiting");
          showScene(idx, true);
          isTransitioning = false;
          scheduleAuto();
        }, 900);
      }
      function nextScene() {
        goToScene((currentScene + 1) % TOTAL_SCENES);
      }
      function prevScene() {
        goToScene((currentScene - 1 + TOTAL_SCENES) % TOTAL_SCENES);
      }
      function skipToEid() {
        goToScene(4);
      }
      function updateNavBtns() {
        document.getElementById("prevBtn").style.opacity =
          currentScene === 0 ? "0.25" : "1";
        document.getElementById("nextBtn").style.opacity =
          currentScene === TOTAL_SCENES - 1 ? "0.25" : "1";
      }
      function scheduleAuto() {
        clearAuto();
        autoTimer = setTimeout(() => {
          if (currentScene < TOTAL_SCENES - 1) nextScene();
        }, AUTO_MS);
      }
      function clearAuto() {
        if (autoTimer) {
          clearTimeout(autoTimer);
          autoTimer = null;
        }
      }

      // ===================== INPUT =====================
      function initInput() {
        window.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") nextScene();
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") prevScene();
        });
        let tx = 0;
        window.addEventListener(
          "touchstart",
          (e) => {
            tx = e.touches[0].clientX;
          },
          { passive: true },
        );
        window.addEventListener(
          "touchend",
          (e) => {
            const dx = e.changedTouches[0].clientX - tx;
            if (Math.abs(dx) > 55) {
              dx < 0 ? nextScene() : prevScene();
            }
          },
          { passive: true },
        );
        let wc = false;
        window.addEventListener(
          "wheel",
          (e) => {
            if (wc) return;
            wc = true;
            setTimeout(() => (wc = false), 1100);
            e.deltaY > 0 ? nextScene() : prevScene();
          },
          { passive: true },
        );
      }

      // ===================== SCENE LOOP MANAGER =====================
      function startSceneLoop(idx) {
        stopSceneLoop(idx);
        const loops = [
          loopTawaf,
          loopArafat,
          loopMuzdalifa,
          loopJamarat,
          loopEid,
        ];
        if (loops[idx]) loops[idx]();
      }
      function stopSceneLoop(idx) {
        if (rafs[idx]) {
          cancelAnimationFrame(rafs[idx]);
          rafs[idx] = null;
        }
        if (idx === 4) stopFireworks();
      }

      // ===================== UTILS =====================
      function clamp(min, max, v) {
        return Math.min(max, Math.max(min, v));
      }
      if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (
          x,
          y,
          w,
          h,
          r,
        ) {
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

      // ============================================================
      // SCENE 1: TAWAF — Realistic Kaaba with GSAP-style animation
      // ============================================================
      const tawafState = { angle: 0, kaabaRot: 0, pilgrims: [], init: false };

      function initTawaf() {
        if (tawafState.init) return;
        tawafState.init = true;
        const rings = [
          { r: 0.18, count: 28, sp: 0.007 },
          { r: 0.13, count: 20, sp: -0.005 },
          { r: 0.24, count: 36, sp: 0.004 },
          { r: 0.09, count: 14, sp: 0.009 },
        ];
        rings.forEach((ring) => {
          for (let i = 0; i < ring.count; i++) {
            tawafState.pilgrims.push({
              ringR: ring.r,
              angle: (i / ring.count) * Math.PI * 2,
              speed: ring.sp,
              hue: 15 + Math.random() * 25,
              scale: 0.6 + Math.random() * 0.6,
              phase: Math.random() * Math.PI * 2,
              ihram: Math.random() > 0.7,
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
          // Deep night sky gradient
          const sky = ctx.createRadialGradient(
            W / 2,
            H * 0.3,
            0,
            W / 2,
            H * 0.5,
            H,
          );
          sky.addColorStop(0, "#1c0a3e");
          sky.addColorStop(0.35, "#0d1840");
          sky.addColorStop(0.7, "#050d25");
          sky.addColorStop(1, "#010308");
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, W, H);
          // Stars
          stars.slice(0, 150).forEach((s) => {
            const op = 0.15 + 0.8 * Math.abs(Math.sin(t * s.sp * 10 + s.ph));
            ctx.beginPath();
            ctx.arc(s.x, s.y * 0.7, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,220,${op})`;
            ctx.fill();
          });
          // Moon with crescent
          drawCrescent(ctx, W * 0.83, H * 0.08, t);
          // Center point
          const cX = W / 2,
            cY = H * 0.5;
          // Marble courtyard floor
          drawMarbleFloor(ctx, cX, cY, t);
          // Minarets
          const mX = [0.05, 0.2, 0.8, 0.95],
            mH = [0.48, 0.55, 0.55, 0.48];
          mX.forEach((xr, i) => drawMinaret(ctx, W * xr, H * mH[i], i, t));
          // Masjid al-Haram facade
          drawMasjidFacade(ctx, cX, cY, t);
          // Kaaba — realistic
          tawafState.kaabaRot += 0.006;
          drawRealisticKaaba(
            ctx,
            cX,
            cY * 0.92,
            clamp(60, W * 0.13, 150),
            tawafState.kaabaRot,
            t,
          );
          // Tawaf crowd rings
          const baseR = clamp(80, W * 0.18, 200);
          tawafState.pilgrims.forEach((p) => {
            p.angle += p.speed;
            const rx = baseR * (p.ringR / 0.18);
            const ry = rx * 0.38;
            const px = cX + rx * Math.cos(p.angle);
            const oy = ry * Math.sin(p.angle);
            const py = cY * 0.92 + oy;
            const depthScale = 0.55 + 0.45 * ((Math.sin(p.angle) + 1) / 2);
            if (depthScale > 0.5)
              drawRealisticPilgrim(
                ctx,
                px,
                py - clamp(12, 24, W * 0.025),
                depthScale * p.scale,
                p.hue,
                t + p.phase,
                p.ihram,
              );
          });
          // Ground ambient glow
          const radGlow = ctx.createRadialGradient(
            cX,
            cY * 0.95,
            0,
            cX,
            cY * 0.95,
            clamp(70, W * 0.14, 160),
          );
          radGlow.addColorStop(0, "rgba(180,130,20,.12)");
          radGlow.addColorStop(1, "transparent");
          ctx.fillStyle = radGlow;
          ctx.fillRect(0, 0, W, H);
        }
        draw();
      }

      function drawCrescent(ctx, mx, my, t) {
        const bob = Math.sin(t * 0.25) * 4;
        ctx.save();
        ctx.shadowBlur = 35;
        ctx.shadowColor = "rgba(245,200,66,.75)";
        // Moon disc
        ctx.beginPath();
        ctx.arc(mx, my + bob, clamp(18, 32, W * 0.028), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245,210,80,.98)";
        ctx.fill();
        // Shadow to make crescent
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(
          mx + clamp(10, 18, W * 0.014),
          my + bob - 3,
          clamp(15, 26, W * 0.022),
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        // Star
        ctx.save();
        ctx.translate(mx + clamp(26, 38, W * 0.032), my - 10 + bob);
        ctx.rotate(t * 0.4);
        ctx.fillStyle = "rgba(245,210,80,.95)";
        ctx.font = `${clamp(9, 13, W * 0.011)}px serif`;
        ctx.textAlign = "center";
        ctx.fillText("★", 0, 4);
        ctx.restore();
        ctx.restore();
      }

      function drawMarbleFloor(ctx, cX, cY, t) {
        // Elliptical floor
        const floorW = clamp(200, W * 0.55, 700),
          floorH = flamp(60, W * 0.1, 160);
        function flamp(a, b, c) {
          return clamp(a, c, b);
        }
        const fg = ctx.createRadialGradient(
          cX,
          cY * 0.95,
          0,
          cX,
          cY * 0.95,
          floorW * 0.8,
        );
        fg.addColorStop(0, "rgba(220,200,160,.55)");
        fg.addColorStop(0.5, "rgba(190,170,130,.4)");
        fg.addColorStop(1, "rgba(140,120,90,.15)");
        ctx.save();
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.ellipse(
          cX,
          cY * 0.95,
          floorW * 0.8,
          floorW * 0.22,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        // Marble tile lines
        for (let i = -8; i <= 8; i++) {
          ctx.globalAlpha = 0.04 + Math.sin(t * 0.1 + i) * 0.02;
          ctx.strokeStyle = "rgba(255,255,255,.7)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(cX + i * (floorW * 0.1), cY * 0.78);
          ctx.lineTo(cX + i * (floorW * 0.06), cY * 1.05);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      function drawMasjidFacade(ctx, cx, cy, t) {
        const bW = clamp(200, W * 0.65, 700),
          bY = cy * 0.55,
          bH = clamp(40, H * 0.08, 90);
        ctx.save();
        // Main facade
        const fg = ctx.createLinearGradient(
          cx - bW / 2,
          bY,
          cx + bW / 2,
          bY + bH,
        );
        fg.addColorStop(0, "#6a4a18");
        fg.addColorStop(0.4, "#9a7830");
        fg.addColorStop(1, "#3a2508");
        ctx.fillStyle = fg;
        ctx.fillRect(cx - bW / 2, bY, bW, bH);
        // Arches
        const arcCount = 9,
          arcW = bW / arcCount;
        for (let i = 0; i < arcCount; i++) {
          const ax = cx - bW / 2 + i * arcW + arcW / 2;
          // Inner dark arch
          ctx.beginPath();
          ctx.arc(ax, bY + arcW * 0.55, arcW * 0.4, Math.PI, 0, true);
          ctx.fillStyle = "rgba(8,4,20,.9)";
          ctx.fill();
          ctx.strokeStyle = "rgba(200,150,26,.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Arch keystone
          ctx.fillStyle = "rgba(200,150,40,.6)";
          ctx.fillRect(ax - 3, bY + arcW * 0.15, 6, arcW * 0.15);
        }
        // Large center dome
        const dR = clamp(30, bH * 0.9, 70);
        ctx.beginPath();
        ctx.ellipse(cx, bY, dR * 1.3, dR * 0.9, 0, Math.PI, 0, true);
        const dg = ctx.createLinearGradient(cx - dR, bY, cx + dR, bY);
        dg.addColorStop(0, "#7a5820");
        dg.addColorStop(0.5, "#c8961a");
        dg.addColorStop(1, "#7a5820");
        ctx.fillStyle = dg;
        ctx.fill();
        // Side domes
        [-1, 1].forEach((side) => {
          const dx = cx + side * bW * 0.2;
          ctx.beginPath();
          ctx.ellipse(dx, bY, dR * 0.7, dR * 0.6, 0, Math.PI, 0, true);
          ctx.fillStyle = dg;
          ctx.fill();
        });
        ctx.restore();
      }

      function drawMinaret(ctx, x, y, idx, t) {
        const w = clamp(10, 20, W * 0.018),
          h = clamp(80, H * 0.32, 280);
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(180,130,20,.3)";
        // Body gradient (3D effect)
        const mg = ctx.createLinearGradient(x - w / 2, 0, x + w, 0);
        mg.addColorStop(0, "#8a6010");
        mg.addColorStop(0.4, "#c8961a");
        mg.addColorStop(0.7, "#a07820");
        mg.addColorStop(1, "#4a3008");
        ctx.fillStyle = mg;
        // Tapered body
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w * 0.38, y - h);
        ctx.lineTo(x - w * 0.38, y - h);
        ctx.fill();
        // Decorative bands
        [0.25, 0.5, 0.7].forEach((fr) => {
          ctx.fillStyle = "rgba(200,150,40,.5)";
          ctx.fillRect(x - w * 0.55, y - h * fr - 2, w * 1.1, 4);
        });
        // Balcony
        ctx.fillStyle = "rgba(200,150,40,.7)";
        ctx.fillRect(x - w * 0.75, y - h * 0.65, w * 1.5, h * 0.04);
        // Spire
        ctx.beginPath();
        ctx.moveTo(x - 1.5, y - h);
        ctx.lineTo(x + 1.5, y - h);
        ctx.lineTo(x, y - h - 28);
        ctx.fillStyle = "#f5c842";
        ctx.fill();
        // Crescent
        ctx.save();
        ctx.translate(x, y - h - 36 + Math.sin(t * 0.35 + idx) * 0.5);
        ctx.rotate(Math.sin(t * 0.2 + idx) * 0.02);
        ctx.font = `${clamp(9, 14, W * 0.012)}px serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(245,200,66,.95)";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(245,200,66,.8)";
        ctx.fillText("☪", 0, 5);
        ctx.restore();
        ctx.restore();
      }

      function drawRealisticKaaba(ctx, cx, cy, size, rot, t) {
        ctx.save();
        // ── Atmospheric halo (light spilling from Masjid lamps) ──
        const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 3.2);
        aura.addColorStop(0, "rgba(200,160,40,.22)");
        aura.addColorStop(0.4, "rgba(160,110,20,.08)");
        aura.addColorStop(1, "transparent");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 3.2, 0, Math.PI * 2);
        ctx.fill();

        const s = size,
          cosR = Math.cos(rot),
          sinR = Math.sin(rot);
        const kH = s * 1.08; // slightly taller than wide — realistic proportions

        // Project a 3D point [x,z] to screen
        const proj = (x, z) => {
          const rx = x * cosR - z * sinR;
          const rz = x * sinR + z * cosR;
          return { sx: cx + rx, sz: rz };
        };
        // Four top-down corners of Kaaba (half-size offsets)
        const hs = s * 0.52;
        const C = [proj(-hs, -hs), proj(hs, -hs), proj(hs, hs), proj(-hs, hs)];
        // Screen y with perspective tilt factor
        const sy = (pt, yOffset) => cy + yOffset + pt.sz * 0.055;

        // ── Faces sorted back→front (painter's algo) ──
        const faces = [
          { i0: 0, i1: 1, light: 0.62 }, // north face
          { i0: 1, i1: 2, light: 0.5 }, // east  face
          { i0: 2, i1: 3, light: 0.4 }, // south face
          { i0: 3, i1: 0, light: 0.55 }, // west  face
        ].sort(
          (a, b) =>
            (C[a.i0].sz + C[a.i1].sz) / 2 - (C[b.i0].sz + C[b.i1].sz) / 2,
        );

        faces.forEach(({ i0, i1, light }) => {
          const c0 = C[i0],
            c1 = C[i1];
          const isVisible = (c0.sz + c1.sz) / 2 < 0; // faces toward camera
          const faceW = Math.abs(c1.sx - c0.sx);

          // ── KISWA: Black velvet with realistic sheen ──
          // Base black — slightly blue-tinted like real velvet
          const bv = Math.round(8 + light * 18),
            bg = Math.round(7 + light * 15),
            bb = Math.round(9 + light * 16);
          ctx.beginPath();
          ctx.moveTo(c0.sx, sy(c0, -kH / 2));
          ctx.lineTo(c1.sx, sy(c1, -kH / 2));
          ctx.lineTo(c1.sx, sy(c1, kH / 2));
          ctx.lineTo(c0.sx, sy(c0, kH / 2));
          ctx.closePath();
          // Velvet gradient — brighter at center, dark at edges
          const vg = ctx.createLinearGradient(c0.sx, 0, c1.sx, 0);
          vg.addColorStop(0, `rgba(${bv},${bg},${bb},1)`);
          vg.addColorStop(0.35, `rgba(${bv + 12},${bg + 10},${bb + 12},1)`);
          vg.addColorStop(0.5, `rgba(${bv + 22},${bg + 18},${bb + 20},1)`);
          vg.addColorStop(0.65, `rgba(${bv + 12},${bg + 10},${bb + 12},1)`);
          vg.addColorStop(1, `rgba(${bv},${bg},${bb},1)`);
          ctx.fillStyle = vg;
          ctx.fill();

          // ── SUBTLE EMBROIDERY TEXTURE on visible faces ──
          if (isVisible && faceW > 20) {
            ctx.save();
            ctx.clip(); // clip to this face
            // Fine horizontal weave lines (fabric texture)
            ctx.globalAlpha = 0.07 * light;
            ctx.strokeStyle = "rgba(180,140,40,1)";
            ctx.lineWidth = 0.6;
            const faceTop = Math.min(sy(c0, -kH / 2), sy(c1, -kH / 2));
            const faceBot = Math.max(sy(c0, kH / 2), sy(c1, kH / 2));
            for (let fy = faceTop; fy < faceBot; fy += 4) {
              ctx.beginPath();
              ctx.moveTo(c0.sx, fy);
              ctx.lineTo(c1.sx, fy);
              ctx.stroke();
            }
            ctx.restore();
          }

          // ── HIZAM AL-KAABA: The golden embroidered belt ──
          // Positioned ~1/3 from top — authentic position
          const beltTopOff = -kH * 0.12;
          const beltBotOff = kH * 0.07;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(c0.sx, sy(c0, beltTopOff));
          ctx.lineTo(c1.sx, sy(c1, beltTopOff));
          ctx.lineTo(c1.sx, sy(c1, beltBotOff));
          ctx.lineTo(c0.sx, sy(c0, beltBotOff));
          ctx.closePath();
          ctx.clip();
          // Gold belt — layered for depth
          const kg = ctx.createLinearGradient(
            c0.sx,
            sy(c0, beltTopOff),
            c0.sx,
            sy(c0, beltBotOff),
          );
          kg.addColorStop(0, "rgba(80,55,5,.9)");
          kg.addColorStop(0.08, "rgba(200,155,25,.95)");
          kg.addColorStop(0.25, "rgba(245,205,70,1)");
          kg.addColorStop(0.5, "rgba(255,220,80,1)");
          kg.addColorStop(0.75, "rgba(240,195,55,1)");
          kg.addColorStop(0.92, "rgba(185,140,18,.95)");
          kg.addColorStop(1, "rgba(70,48,4,.9)");
          ctx.fillRect(
            Math.min(c0.sx, c1.sx) - 2,
            sy(c0, beltTopOff),
            faceW + 4,
            sy(c0, beltBotOff) - sy(c0, beltTopOff),
          );
          ctx.fillStyle = kg;
          ctx.fillRect(
            Math.min(c0.sx, c1.sx) - 2,
            sy(c0, beltTopOff),
            faceW + 4,
            sy(c0, beltBotOff) - sy(c0, beltTopOff),
          );
          // Embroidery calligraphy on belt
          if (isVisible && faceW > 35) {
            const beltCy = sy(c0, (beltTopOff + beltBotOff) / 2);
            const fontSize = clamp(6, faceW * 0.11, 14);
            ctx.font = `bold ${fontSize}px Scheherazade New,serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // Dark outline for depth
            ctx.fillStyle = "rgba(40,25,0,.8)";
            ctx.fillText(
              "بسم الله الرحمن الرحيم",
              (c0.sx + c1.sx) / 2 + 1,
              beltCy + 1,
            );
            ctx.fillStyle = "rgba(20,12,0,.9)";
            ctx.fillText(
              "لا إله إلا الله",
              (c0.sx + c1.sx) / 2 + 1,
              beltCy - fontSize - 1,
            );
            // Gold text
            ctx.fillStyle = "rgba(255,240,160,.95)";
            ctx.fillText("بسم الله الرحمن الرحيم", (c0.sx + c1.sx) / 2, beltCy);
            ctx.fillStyle = "rgba(255,235,150,.9)";
            ctx.fillText(
              "لا إله إلا الله",
              (c0.sx + c1.sx) / 2,
              beltCy - fontSize,
            );
          }
          ctx.restore();

          // ── UPPER BAND: Shahada / Quranic verses ──
          const upTopOff = -kH * 0.38;
          const upBotOff = -kH * 0.22;
          if (isVisible && faceW > 25) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(c0.sx, sy(c0, upTopOff));
            ctx.lineTo(c1.sx, sy(c1, upTopOff));
            ctx.lineTo(c1.sx, sy(c1, upBotOff));
            ctx.lineTo(c0.sx, sy(c0, upBotOff));
            ctx.closePath();
            ctx.clip();
            const ug = ctx.createLinearGradient(c0.sx, 0, c1.sx, 0);
            ug.addColorStop(0, "rgba(160,120,15,.7)");
            ug.addColorStop(0.5, "rgba(220,175,40,.85)");
            ug.addColorStop(1, "rgba(160,120,15,.7)");
            ctx.fillStyle = ug;
            ctx.fillRect(
              Math.min(c0.sx, c1.sx),
              sy(c0, upTopOff),
              faceW,
              sy(c0, upBotOff) - sy(c0, upTopOff),
            );
            if (faceW > 40) {
              const ubCy = sy(c0, (upTopOff + upBotOff) / 2);
              const ufs = clamp(5, faceW * 0.09, 11);
              ctx.font = `bold ${ufs}px Scheherazade New,serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "rgba(0,0,0,.7)";
              ctx.fillText(
                "لا إله إلا الله محمد رسول الله",
                (c0.sx + c1.sx) / 2 + 0.5,
                ubCy + 0.5,
              );
              ctx.fillStyle = "rgba(255,240,140,.92)";
              ctx.fillText(
                "لا إله إلا الله محمد رسول الله",
                (c0.sx + c1.sx) / 2,
                ubCy,
              );
            }
            ctx.restore();
          }

          // Face edge shading (3D depth)
          ctx.strokeStyle = `rgba(${Math.round(light * 180)},${Math.round(light * 130)},${Math.round(light * 20)},.25)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(c0.sx, sy(c0, -kH / 2));
          ctx.lineTo(c1.sx, sy(c1, -kH / 2));
          ctx.lineTo(c1.sx, sy(c1, kH / 2));
          ctx.lineTo(c0.sx, sy(c0, kH / 2));
          ctx.closePath();
          ctx.stroke();

          // ── DOOR (باب الكعبة) on most visible front face ──
          if (isVisible && (c0.sz + c1.sz) / 2 < -s * 0.1 && faceW > 28) {
            const doorCx = (c0.sx + c1.sx) / 2;
            const doorCy = sy({ sz: (c0.sz + c1.sz) / 2 }, kH * 0.15);
            const doorW = Math.max(10, faceW * 0.28);
            const doorH = kH * 0.38;
            // Door threshold stone (white marble)
            ctx.fillStyle = "rgba(220,210,190,.7)";
            ctx.beginPath();
            ctx.roundRect(doorCx - doorW * 0.6, doorCy + 8, doorW * 1.2, 6, 2);
            ctx.fill();
            // Door outer gold frame — ornate
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(245,200,50,.6)";
            const dfg = ctx.createLinearGradient(
              doorCx - doorW / 2,
              doorCy - doorH,
              doorCx + doorW / 2,
              doorCy,
            );
            dfg.addColorStop(0, "rgba(80,55,5,1)");
            dfg.addColorStop(0.15, "rgba(200,155,25,1)");
            dfg.addColorStop(0.5, "rgba(245,205,70,1)");
            dfg.addColorStop(0.85, "rgba(200,155,25,1)");
            dfg.addColorStop(1, "rgba(80,55,5,1)");
            ctx.fillStyle = dfg;
            ctx.beginPath();
            ctx.roundRect(
              doorCx - doorW / 2 - 2,
              doorCy - doorH - 2,
              doorW + 4,
              doorH + 4,
              doorW * 0.18,
            );
            ctx.fill();
            // Door inner dark wood/metal
            ctx.fillStyle = "rgba(30,20,8,.95)";
            ctx.beginPath();
            ctx.roundRect(
              doorCx - doorW / 2 + 2,
              doorCy - doorH + 2,
              doorW - 4,
              doorH - 2,
              doorW * 0.14,
            );
            ctx.fill();
            // Door panels (two panels)
            [
              [-doorW * 0.22, 0],
              [doorW * 0.22, 0],
            ].forEach(([ox]) => {
              ctx.fillStyle = "rgba(45,30,8,.9)";
              ctx.beginPath();
              ctx.roundRect(
                doorCx + ox - doorW * 0.18,
                doorCy - doorH + 6,
                doorW * 0.36,
                doorH * 0.42,
                2,
              );
              ctx.fill();
              ctx.beginPath();
              ctx.roundRect(
                doorCx + ox - doorW * 0.18,
                doorCy - doorH * 0.5,
                doorW * 0.36,
                doorH * 0.42,
                2,
              );
              ctx.fill();
              // Panel knob
              ctx.fillStyle = "rgba(200,155,25,.9)";
              ctx.beginPath();
              ctx.arc(
                doorCx + ox,
                doorCy - doorH * 0.55 + doorH * 0.21,
                doorW * 0.04,
                0,
                Math.PI * 2,
              );
              ctx.fill();
            });
            // Door lock / ornament center
            ctx.fillStyle = "rgba(245,200,60,.9)";
            ctx.beginPath();
            ctx.arc(doorCx, doorCy - doorH * 0.5, doorW * 0.07, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(80,55,5,1)";
            ctx.beginPath();
            ctx.arc(doorCx, doorCy - doorH * 0.5, doorW * 0.04, 0, Math.PI * 2);
            ctx.fill();
            // Door step platform
            ctx.fillStyle = "rgba(200,185,155,.85)";
            ctx.beginPath();
            ctx.roundRect(doorCx - doorW * 0.65, doorCy + 3, doorW * 1.3, 8, 2);
            ctx.fill();
            ctx.restore();
          }
        });

        // ── ROOF: flat top with subtle marble/stone ──
        ctx.beginPath();
        C.forEach((c, i) =>
          i === 0
            ? ctx.moveTo(c.sx, sy(c, -kH / 2))
            : ctx.lineTo(c.sx, sy(c, -kH / 2)),
        );
        ctx.closePath();
        const rg = ctx.createLinearGradient(
          C[0].sx,
          sy(C[0], -kH / 2),
          C[2].sx,
          sy(C[2], -kH / 2),
        );
        rg.addColorStop(0, "rgba(18,14,10,1)");
        rg.addColorStop(0.5, "rgba(28,22,14,1)");
        rg.addColorStop(1, "rgba(16,12,8,1)");
        ctx.fillStyle = rg;
        ctx.fill();
        // Roof edge gold trim
        ctx.strokeStyle = "rgba(180,135,20,.55)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // ── BLACK STONE CORNER (الحجر الأسود) ──
        // Located at northeast corner (corner between front and right face)
        const bsC = C[1]; // corner 1 = northeast
        const bsX = bsC.sx,
          bsY = sy(bsC, kH * 0.42);
        // Silver frame
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(200,180,120,.5)";
        ctx.fillStyle = "rgba(160,140,100,.8)";
        ctx.beginPath();
        ctx.arc(bsX, bsY, clamp(5, 9, s * 0.075), 0, Math.PI * 2);
        ctx.fill();
        // Black stone
        ctx.fillStyle = "rgba(15,10,8,.95)";
        ctx.beginPath();
        ctx.arc(bsX, bsY, clamp(3.5, 6.5, s * 0.055), 0, Math.PI * 2);
        ctx.fill();
        // Stone shimmer
        ctx.fillStyle = "rgba(80,60,40,.5)";
        ctx.beginPath();
        ctx.arc(bsX - 1, bsY - 1.5, clamp(1.5, 3, s * 0.025), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ── MUQAM IBRAHIM shadow on ground ──
        const mbX = cx + s * 0.4,
          mbY = cy + kH * 0.5 + s * 0.1;
        ctx.fillStyle = "rgba(180,140,30,.25)";
        ctx.beginPath();
        ctx.arc(mbX, mbY, clamp(8, 14, s * 0.12), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      function drawRealisticPilgrim(ctx, x, y, scale, hue, t, isIhram) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(0,0,0,.5)";
        const skinH = hue + 10,
          skinS = 20,
          skinL = 68 + Math.sin(t * 0.3) * 3;
        // Robe (ihram white or colored)
        const robeColor = isIhram
          ? "rgba(245,242,235,.95)"
          : `hsla(${hue + 200},40%,82%,.9)`;
        ctx.fillStyle = robeColor;
        // Body shape
        ctx.beginPath();
        ctx.ellipse(0, 7, 5.5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head with skin tone
        ctx.fillStyle = `hsl(${skinH},${skinS}%,${skinL}%)`;
        ctx.beginPath();
        ctx.arc(0, -5, 5.5, 0, Math.PI * 2);
        ctx.fill();
        // Ihram head cover or kufi
        if (isIhram) {
          ctx.fillStyle = "rgba(245,242,235,.7)";
          ctx.beginPath();
          ctx.arc(0, -5.5, 5, Math.PI, 0);
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(30,30,30,.8)";
          ctx.beginPath();
          ctx.arc(0, -8, 4.5, Math.PI, 0);
          ctx.fill();
        }
        // Arms raised in dua/tawaf
        const armA = Math.sin(t * 0.6) * 0.15 + 0.1;
        ctx.strokeStyle = robeColor;
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-4, 1);
        ctx.lineTo(-9 - armA * 3, -5 - armA * 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, 1);
        ctx.lineTo(9 + armA * 3, -5 - armA * 4);
        ctx.stroke();
        ctx.restore();
      }

      // ============================================================
      // SCENE 2: ARAFAT — Realistic mountain & massive crowd
      // ============================================================
      const arafatState = { crowd: [], init: false };
      function initArafat() {
        if (arafatState.init) return;
        arafatState.init = true;
        for (let i = 0; i < 200; i++) {
          arafatState.crowd.push({
            x: Math.random() * W,
            row: Math.random(),
            ph: Math.random() * Math.PI * 2,
            sp: 0.3 + Math.random() * 0.5,
            sc: 0.45 + Math.random() * 0.7,
            hue: 15 + Math.random() * 20,
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
          // Warm afternoon sky
          const sk = ctx.createLinearGradient(0, 0, 0, H);
          sk.addColorStop(0, "#e8700a");
          sk.addColorStop(0.2, "#f09040");
          sk.addColorStop(0.5, "#f0b060");
          sk.addColorStop(0.8, "#d8b070");
          sk.addColorStop(1, "#c09060");
          ctx.fillStyle = sk;
          ctx.fillRect(0, 0, W, H);
          // Heat haze shimmer
          ctx.save();
          ctx.globalAlpha = 0.03 + Math.sin(t * 4) * 0.02;
          ctx.fillStyle = "rgba(255,200,100,.4)";
          ctx.fillRect(0, H * 0.4, W, H * 0.15);
          ctx.restore();
          // Sun with rays
          drawArafatSun(ctx, t);
          // Layered distant mountains
          drawArafatMountainLayers(ctx, t);
          // Desert floor
          const gnd = ctx.createLinearGradient(0, H * 0.58, 0, H);
          gnd.addColorStop(0, "#c8a060");
          gnd.addColorStop(0.4, "#b89050");
          gnd.addColorStop(1, "#9a7840");
          ctx.fillStyle = gnd;
          ctx.fillRect(0, H * 0.58, W, H);
          // Sand texture ripples
          for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.globalAlpha = 0.05 + i * 0.015;
            ctx.strokeStyle = "rgba(200,160,90,.6)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let x = 0; x <= W; x += 15) {
              const y =
                H * (0.6 + i * 0.04) +
                Math.sin((x / W) * Math.PI * 6 + t * 0.3 + i) * 4;
              x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
          }
          // White tents
          drawRealisticTents(ctx, t);
          // Jabal al-Rahma (prominent)
          drawJabalRahmaRealistic(ctx, W * 0.6, H * 0.42, t);
          // Crowd
          drawArafatCrowd(ctx, arafatState.crowd, t);
          // Dua hands
          drawDuaHands(ctx, W * 0.5, H * 0.48, t);
          // Atmospheric haze at horizon
          const hz = ctx.createLinearGradient(0, H * 0.55, 0, H * 0.65);
          hz.addColorStop(0, "transparent");
          hz.addColorStop(1, "rgba(200,170,110,.18)");
          ctx.fillStyle = hz;
          ctx.fillRect(0, H * 0.55, W, H * 0.1);
        }
        draw();
      }

      function drawArafatSun(ctx, t) {
        const sx = W * 0.48,
          sy = H * 0.11 + Math.sin(t * 0.15) * 4;
        ctx.save();
        for (let i = 0; i < 20; i++) {
          const ang = (i * Math.PI) / 10 + t * 0.03;
          const r1 = clamp(55, 85, W * 0.07),
            r2 = clamp(90, 140, W * 0.12);
          ctx.beginPath();
          ctx.moveTo(sx + r1 * Math.cos(ang), sy + r1 * Math.sin(ang));
          ctx.lineTo(sx + r2 * Math.cos(ang), sy + r2 * Math.sin(ang));
          ctx.strokeStyle = `rgba(255,230,100,${0.1 + 0.07 * Math.sin(t + i)})`;
          ctx.lineWidth = clamp(3, 6, W * 0.005);
          ctx.stroke();
        }
        const sg = ctx.createRadialGradient(
          sx,
          sy,
          0,
          sx,
          sy,
          clamp(45, 75, W * 0.065),
        );
        sg.addColorStop(0, "rgba(255,255,230,1)");
        sg.addColorStop(0.3, "rgba(255,235,80,.95)");
        sg.addColorStop(0.7, "rgba(255,180,50,.5)");
        sg.addColorStop(1, "rgba(255,150,0,0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, clamp(45, 75, W * 0.065), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      function drawArafatMountainLayers(ctx, t) {
        // Far hazy mountains
        [
          [0.2, 0.18, "#c08050"],
          [-0.05, 0.22, "#b07040"],
          [0.6, 0.15, "#c08858"],
          [0.75, 0.2, "#b07848"],
        ].forEach(([xo, h, col]) => {
          ctx.beginPath();
          ctx.moveTo(W * xo, H * 0.6);
          for (let x = 0; x <= W; x += 20) {
            const nx = xo + x / W;
            const ny =
              H *
              (0.6 -
                h *
                  Math.max(0, 1 - Math.abs((x / W - (0.5 - xo / 0.5)) / 0.4)));
            x === 0
              ? ctx.moveTo(x, H * 0.6)
              : ctx.lineTo(
                  x,
                  Math.min(H * 0.6, ny + Math.sin(x * 0.05 + t * 0.02) * 3),
                );
          }
          ctx.lineTo(W, H * 0.6);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
        });
      }

      function drawJabalRahmaRealistic(ctx, x, y, t) {
        ctx.save();
        // Mountain base — rocky
        const mx = x,
          bY = H * 0.58;
        const mW = clamp(80, W * 0.18, 200),
          mH = clamp(80, H * 0.22, 200);
        // Main mountain shape
        ctx.beginPath();
        ctx.moveTo(mx - mW, bY);
        // Left slope with rocks
        for (let i = 0; i <= 20; i++) {
          const lx = mx - mW + i * (mW / 20);
          const ly = bY - mH * (i / 20) ** 1.5 + Math.sin(i * 0.8) * 8;
          ctx.lineTo(lx, ly);
        }
        // Right slope
        for (let i = 20; i >= 0; i--) {
          const lx = mx + i * (mW / 20);
          const ly = bY - mH * (i / 20) ** 1.6 + Math.sin(i * 0.7 + 1) * 7;
          ctx.lineTo(lx, ly);
        }
        ctx.closePath();
        const mg = ctx.createLinearGradient(mx - mW, bY, mx + mW, y);
        mg.addColorStop(0, "#7a5830");
        mg.addColorStop(0.4, "#a07848");
        mg.addColorStop(0.7, "#8a6838");
        mg.addColorStop(1, "#5a3818");
        ctx.fillStyle = mg;
        ctx.fill();
        // Rock details (shading patches)
        ctx.save();
        ctx.globalAlpha = 0.3;
        [
          [mx - mW * 0.3, y + mH * 0.2, "#4a2808", 18],
          [mx + mW * 0.1, y + mH * 0.4, "#3a1808", 14],
          [mx - mW * 0.1, y + mH * 0.1, "#6a3818", 10],
        ].forEach(([rx, ry, rc, rs]) => {
          ctx.fillStyle = rc;
          ctx.beginPath();
          ctx.ellipse(rx, ry, rs, rs * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        // Summit white marker pillar
        const pillarH = clamp(50, H * 0.1, 90);
        const pg = ctx.createLinearGradient(mx - 5, y - pillarH, mx + 5, y);
        pg.addColorStop(0, "#f0e8d0");
        pg.addColorStop(1, "#c0b090");
        ctx.fillStyle = pg;
        ctx.fillRect(mx - 5, y - pillarH, 10, pillarH);
        // Pillar cap
        ctx.fillStyle = "rgba(245,200,66,.9)";
        ctx.fillRect(mx - 9, y - pillarH - 6, 18, 6);
        // Golden orb on top
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(245,200,66,.9)";
        ctx.fillStyle = "#f5c842";
        ctx.beginPath();
        ctx.arc(
          mx,
          y - pillarH - 14 + Math.sin(t * 0.5) * 3,
          clamp(8, 14, W * 0.012),
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
        // Pilgrims climbing the mountain
        for (let i = 0; i < 8; i++) {
          const px = mx - mW * 0.4 + i * mW * 0.1 + Math.sin(t * 0.3 + i) * 0.5;
          const py = bY - mH * (i / 8) ** 0.8 * 1.1 + Math.sin(i * 0.8) * 5;
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(0.45 + i * 0.015, 0.45 + i * 0.015);
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, -11, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      function drawRealisticTents(ctx, t) {
        const n = 12,
          y = H * 0.6;
        for (let i = 0; i < n; i++) {
          const tx2 = W * ((i / (n - 1)) * 0.85 + 0.08);
          const tw = clamp(22, 42, W * 0.04),
            th = clamp(18, 32, W * 0.03);
          // Tent shadow
          ctx.fillStyle = "rgba(0,0,0,.15)";
          ctx.beginPath();
          ctx.ellipse(tx2, y + 4, tw * 0.8, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          // Tent body
          ctx.beginPath();
          ctx.moveTo(tx2 - tw, y);
          ctx.lineTo(tx2, y - th);
          ctx.lineTo(tx2 + tw, y);
          ctx.closePath();
          const tg = ctx.createLinearGradient(tx2 - tw, y, tx2 + tw, y);
          tg.addColorStop(0, "#d8d0c0");
          tg.addColorStop(0.5, "#f0ece0");
          tg.addColorStop(1, "#c8c0b0");
          ctx.fillStyle = tg;
          ctx.fill();
          ctx.strokeStyle = "rgba(160,140,110,.4)";
          ctx.lineWidth = 0.8;
          ctx.stroke();
          // Tent pole flag
          ctx.strokeStyle = "rgba(180,130,20,.6)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tx2, y - th);
          ctx.lineTo(tx2, y - th - 14);
          ctx.stroke();
          // Flag
          ctx.fillStyle =
            i % 3 === 0 ? "#0a4a1a" : i % 3 === 1 ? "#1a2a6a" : "#8a1a1a";
          ctx.beginPath();
          ctx.moveTo(tx2, y - th - 14);
          ctx.lineTo(tx2 + 9, y - th - 10 + Math.sin(t * 1.8 + i) * 0.5);
          ctx.lineTo(tx2, y - th - 6);
          ctx.fill();
          // AC unit hint
          if (i % 2 === 0) {
            ctx.fillStyle = "rgba(140,130,120,.5)";
            ctx.fillRect(tx2 - tw * 0.4, y - 4, tw * 0.8, 4);
          }
        }
      }

      function drawArafatCrowd(ctx, crowd, t) {
        crowd.forEach((p) => {
          const gy = H * 0.62 + p.row * H * 0.1;
          const sc = p.sc * (0.45 + p.row * 0.6);
          ctx.save();
          ctx.translate(p.x, gy);
          ctx.scale(sc, sc);
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.5, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, -11, 3.5, 0, Math.PI * 2);
          ctx.fill();
          // Raised arms in dua
          const armA = Math.sin(t * p.sp + p.ph) * 0.35 + 0.2;
          ctx.strokeStyle = "rgba(245,240,230,.9)";
          ctx.lineWidth = 1.8;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-2, -1);
          ctx.lineTo(-8, -8 - armA * 5);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(2, -1);
          ctx.lineTo(8, -8 - armA * 5);
          ctx.stroke();
          ctx.restore();
        });
      }

      function drawDuaHands(ctx, x, y, t) {
        ctx.save();
        const raise = Math.sin(t * 0.45) * 6;
        ctx.globalAlpha = 0.8;
        const handW = clamp(22, 34, W * 0.028),
          handH = clamp(40, 60, H * 0.065);
        // Left palm
        ctx.save();
        ctx.translate(x - handW - 8, y - raise);
        const lhg = ctx.createLinearGradient(
          -handW / 2,
          -handH / 2,
          handW / 2,
          handH / 2,
        );
        lhg.addColorStop(0, "#d4a070");
        lhg.addColorStop(0.6, "#c09060");
        lhg.addColorStop(1, "#b08050");
        ctx.fillStyle = lhg;
        ctx.beginPath();
        ctx.roundRect(-handW / 2, -handH / 2, handW, handH, 7);
        ctx.fill();
        // Palm lines
        ctx.strokeStyle = "rgba(100,60,20,.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-handW * 0.3, 0);
        ctx.quadraticCurveTo(0, -handH * 0.2, handW * 0.3, 0);
        ctx.stroke();
        // Fingers
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = lhg;
          ctx.beginPath();
          ctx.roundRect(
            -handW * 0.4 + i * handW * 0.27,
            -handH / 2 - handH * 0.22,
            handW * 0.22,
            handH * 0.25,
            5,
          );
          ctx.fill();
        }
        ctx.restore();
        // Right palm
        ctx.save();
        ctx.translate(x + handW + 8, y - raise + 1);
        ctx.fillStyle = lhg;
        ctx.beginPath();
        ctx.roundRect(-handW / 2, -handH / 2, handW, handH, 7);
        ctx.fill();
        ctx.strokeStyle = "rgba(100,60,20,.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-handW * 0.3, 0);
        ctx.quadraticCurveTo(0, -handH * 0.2, handW * 0.3, 0);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = lhg;
          ctx.beginPath();
          ctx.roundRect(
            -handW * 0.4 + i * handW * 0.27,
            -handH / 2 - handH * 0.22,
            handW * 0.22,
            handH * 0.25,
            5,
          );
          ctx.fill();
        }
        ctx.restore();
        // Divine light between hands
        const dg = ctx.createRadialGradient(
          x,
          y - 30,
          0,
          x,
          y - 30,
          clamp(60, 100, W * 0.08),
        );
        dg.addColorStop(
          0,
          `rgba(255,230,120,${0.12 + 0.08 * Math.sin(t * 0.7)})`,
        );
        dg.addColorStop(1, "transparent");
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(x, y - 30, clamp(60, 100, W * 0.08), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ============================================================
      // SCENE 3: MUZDALIFA — Night camping, stone collection
      // ============================================================
      const muzdalifaState = { pilgrims: [], init: false };
      function initMuzdalifa() {
        if (muzdalifaState.init) return;
        muzdalifaState.init = true;
        for (let i = 0; i < 90; i++) {
          muzdalifaState.pilgrims.push({
            x: Math.random() * W,
            y: H * 0.65 + Math.random() * H * 0.15,
            sc: 0.5 + Math.random() * 0.5,
            ph: Math.random() * Math.PI * 2,
            action: Math.floor(Math.random() * 3),
          });
        }
      }
      function loopMuzdalifa() {
        initMuzdalifa();
        const ctx = ctxs.muzdalifa;
        function draw() {
          if (currentScene !== 2) return;
          rafs[2] = requestAnimationFrame(draw);
          const t = Date.now() / 1000;
          ctx.clearRect(0, 0, W, H);
          // Deep night sky
          const sk = ctx.createLinearGradient(0, 0, 0, H);
          sk.addColorStop(0, "#030008");
          sk.addColorStop(0.3, "#08000f");
          sk.addColorStop(0.6, "#050008");
          sk.addColorStop(1, "#030005");
          ctx.fillStyle = sk;
          ctx.fillRect(0, 0, W, H);
          // Milky way band
          ctx.save();
          ctx.globalAlpha = 0.07;
          const mw = ctx.createLinearGradient(0, H * 0.1, W, H * 0.4);
          mw.addColorStop(0, "transparent");
          mw.addColorStop(0.3, "rgba(180,150,255,.5)");
          mw.addColorStop(0.6, "rgba(200,180,255,.4)");
          mw.addColorStop(1, "transparent");
          ctx.fillStyle = mw;
          ctx.fillRect(0, 0, W, H * 0.5);
          ctx.restore();
          // Stars — many more for night
          stars.forEach((s) => {
            const op = 0.3 + 0.7 * Math.abs(Math.sin(t * s.sp * 8 + s.ph));
            ctx.beginPath();
            ctx.arc(s.x, s.y * 0.72, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,220,${op})`;
            ctx.fill();
          });
          // Extra bright stars
          for (let i = 0; i < 30; i++) {
            const bx = ((i * 137.5) % 1) * W,
              by = ((i * 97.3) % 1) * H * 0.5;
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(255,255,200,.9)";
            ctx.fillStyle = "rgba(255,255,230,.9)";
            ctx.beginPath();
            ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          // Moon (full, Muzdalifa is before 10th Dhul Hijja)
          drawFullMoon(ctx, W * 0.15, H * 0.08, t);
          // Mountains silhouette in distance
          drawMuzdalifaMountains(ctx);
          // Rocky desert ground
          const gnd = ctx.createLinearGradient(0, H * 0.62, 0, H);
          gnd.addColorStop(0, "#1a1410");
          gnd.addColorStop(0.5, "#121008");
          gnd.addColorStop(1, "#0a0806");
          ctx.fillStyle = gnd;
          ctx.fillRect(0, H * 0.62, W, H);
          // Scattered rocks/pebbles
          drawPebbles(ctx, t);
          // Campfires
          drawCampfires(ctx, t);
          // Pilgrims sleeping, sitting, collecting stones
          muzdalifaState.pilgrims.forEach((p) =>
            drawMuzdalifaPilgrim(ctx, p, t),
          );
          // Tents
          drawNightTents(ctx, t);
        }
        draw();
      }
      function drawFullMoon(ctx, mx, my, t) {
        ctx.save();
        const bob = Math.sin(t * 0.2) * 3;
        ctx.shadowBlur = 40;
        ctx.shadowColor = "rgba(220,200,140,.5)";
        // Moon glow
        const mg = ctx.createRadialGradient(
          mx,
          my + bob,
          0,
          mx,
          my + bob,
          clamp(30, 50, W * 0.044),
        );
        mg.addColorStop(0, "rgba(240,230,190,1)");
        mg.addColorStop(0.6, "rgba(220,210,160,.9)");
        mg.addColorStop(1, "rgba(180,160,100,0)");
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my + bob, clamp(30, 50, W * 0.044), 0, Math.PI * 2);
        ctx.fill();
        // Moon craters (subtle)
        ctx.globalAlpha = 0.08;
        [
          [mx - 8, my + bob - 5, 6],
          [mx + 10, my + bob + 8, 4],
          [mx + 5, my + bob - 10, 3],
        ].forEach(([cx, cy, cr]) => {
          ctx.fillStyle = "rgba(100,80,40,.6)";
          ctx.beginPath();
          ctx.arc(cx, cy, cr, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }
      function drawMuzdalifaMountains(ctx) {
        [
          [0.0, 0.25, "#0e0a06"],
          [-0.1, 0.3, "#0a0804"],
          [0.65, 0.22, "#0e0a06"],
          [0.8, 0.28, "#080604"],
        ].forEach(([xo, h, col]) => {
          ctx.beginPath();
          ctx.moveTo(0, H * 0.65);
          for (let x = 0; x <= W; x += 25) {
            const hi = h * Math.max(0, Math.sin((x / W - xo) * Math.PI));
            ctx.lineTo(x, H * (0.65 - hi));
          }
          ctx.lineTo(W, H * 0.65);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
        });
      }
      function drawPebbles(ctx, t) {
        for (let i = 0; i < 80; i++) {
          const px = ((i * 173.7) % 1) * W,
            py = H * 0.65 + ((i * 89.3) % 1) * H * 0.2;
          const ps = 1 + ((i * 37) % 1) * 3;
          ctx.fillStyle = `rgba(${80 + (Math.floor(i * 1.5) % 40)},${70 + (Math.floor(i * 1.2) % 30)},${60 + (Math.floor(i * 0.9) % 25)},.7)`;
          ctx.beginPath();
          ctx.ellipse(
            px,
            py,
            ps,
            ps * 0.7,
            ((i * 23) % 1) * Math.PI,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      function drawCampfires(ctx, t) {
        [
          [0.15, 0.67],
          [0.4, 0.69],
          [0.7, 0.68],
          [0.88, 0.67],
        ].forEach(([xr, yr], i) => {
          const fx = W * xr,
            fy = H * yr;
          // Fire glow on ground
          const fg = ctx.createRadialGradient(
            fx,
            fy,
            0,
            fx,
            fy,
            clamp(20, 40, W * 0.035),
          );
          fg.addColorStop(
            0,
            `rgba(255,160,30,${0.3 + Math.sin(t * 4 + i) * 0.15})`,
          );
          fg.addColorStop(1, "transparent");
          ctx.fillStyle = fg;
          ctx.fillRect(fx - 40, fy - 40, 80, 60);
          // Logs
          ctx.fillStyle = "rgba(40,20,10,.9)";
          ctx.save();
          ctx.translate(fx, fy);
          ctx.rotate(0.5);
          ctx.fillRect(-12, -2, 24, 5);
          ctx.rotate(-1);
          ctx.fillRect(-12, -2, 24, 5);
          ctx.restore();
          // Flames
          for (let fl = 0; fl < 3; fl++) {
            const fa = 0.5 + 0.5 * Math.abs(Math.sin(t * 7 + i + fl));
            ctx.save();
            ctx.translate(fx + fl * 4 - 4, fy - 2);
            ctx.fillStyle = `rgba(${255},${100 + fl * 40},${20 * fl},${fa * 0.9})`;
            ctx.beginPath();
            ctx.moveTo(-3, 0);
            ctx.quadraticCurveTo(
              -5,
              -12 + Math.sin(t * 8 + fl) * 3,
              0,
              -20 - fl * 5 - Math.sin(t * 6 + fl) * 4,
            );
            ctx.quadraticCurveTo(5, -12 + Math.cos(t * 7 + fl) * 3, 3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        });
      }
      function drawMuzdalifaPilgrim(ctx, p, t) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.sc, p.sc);
        if (p.action === 0) {
          // sleeping
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.ellipse(0, 4, 14, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(15, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.action === 1) {
          // sitting
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, -10, 4.5, 0, Math.PI * 2);
          ctx.fill();
          // Picking stone
          const armA = Math.sin(t * p.sp + p.ph) * 0.4 + 0.3;
          ctx.strokeStyle = "rgba(245,240,230,.9)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(4, 0);
          ctx.lineTo(12, 6 + armA * 4);
          ctx.stroke();
          // Stone
          ctx.fillStyle = "rgba(100,80,60,.8)";
          ctx.beginPath();
          ctx.arc(14, 8 + armA * 4, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // standing praying
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.ellipse(0, 4, 5, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, -9, 5, 0, Math.PI * 2);
          ctx.fill();
          const armA = Math.sin(t * 0.5 + p.ph) * 0.2;
          ctx.strokeStyle = "white";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-3, 0);
          ctx.lineTo(-10, -6 - armA * 4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(3, 0);
          ctx.lineTo(10, -6 - armA * 4);
          ctx.stroke();
        }
        ctx.restore();
      }
      function drawNightTents(ctx, t) {
        for (let i = 0; i < 6; i++) {
          const tx = W * (0.1 + i * 0.16),
            ty = H * 0.65;
          const tw = clamp(25, 38, W * 0.033),
            th = clamp(16, 26, W * 0.022);
          ctx.fillStyle = "rgba(20,16,12,.85)";
          ctx.beginPath();
          ctx.moveTo(tx - tw, ty);
          ctx.lineTo(tx, ty - th);
          ctx.lineTo(tx + tw, ty);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(100,80,50,.3)";
          ctx.lineWidth = 1;
          ctx.stroke();
          // Interior light glow
          const ilg = ctx.createRadialGradient(
            tx,
            ty - th * 0.4,
            0,
            tx,
            ty - th * 0.4,
            tw * 0.5,
          );
          ilg.addColorStop(
            0,
            `rgba(255,180,50,${0.08 + Math.sin(t * 1.5 + i) * 0.04})`,
          );
          ilg.addColorStop(1, "transparent");
          ctx.fillStyle = ilg;
          ctx.beginPath();
          ctx.moveTo(tx - tw + 4, ty - 2);
          ctx.lineTo(tx, ty - th + 4);
          ctx.lineTo(tx + tw - 4, ty - 2);
          ctx.closePath();
          ctx.fill();
        }
      }

      // ============================================================
      // SCENE 4: JAMARAT — Realistic bridge + pillar + throwers
      // ============================================================
      const jamaratState = {
        stones: [],
        sparks: [],
        throwers: [],
        init: false,
      };
      function initJamarat() {
        if (jamaratState.init) return;
        jamaratState.init = true;
        [0.08, 0.18, 0.28, 0.38, 0.62, 0.72, 0.82, 0.92, 0.5].forEach(
          (xr, i) => {
            jamaratState.throwers.push({ xr, ph: i * 0.7, hue: 15 + i * 10 });
          },
        );
      }

      function loopJamarat() {
        initJamarat();
        const ctx = ctxs.jamarat;
        let lastStone = 0;
        function draw() {
          if (currentScene !== 3) return;
          rafs[3] = requestAnimationFrame(draw);
          const t = Date.now() / 1000;
          ctx.clearRect(0, 0, W, H);
          // Night sky
          const sk = ctx.createLinearGradient(0, 0, 0, H);
          sk.addColorStop(0, "#07021a");
          sk.addColorStop(0.3, "#160635");
          sk.addColorStop(0.6, "#240858");
          sk.addColorStop(1, "#120430");
          ctx.fillStyle = sk;
          ctx.fillRect(0, 0, W, H);
          // Stars
          stars.slice(0, 180).forEach((s) => {
            const op = 0.1 + 0.8 * Math.abs(Math.sin(t * s.sp * 8 + s.ph));
            ctx.beginPath();
            ctx.arc(s.x, s.y * 0.6, s.r * 0.9, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,220,${op})`;
            ctx.fill();
          });
          // Moving clouds
          for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.globalAlpha = 0.07 + 0.04 * Math.sin(t * 0.1 + i);
            ctx.fillStyle = `hsl(${265 + i * 12},55%,38%)`;
            const cx2 =
              (((W * 0.22 * i + t * 8 * (i % 2 === 0 ? 1 : -1) * 12) % W) + W) %
              W;
            ctx.beginPath();
            ctx.ellipse(
              cx2,
              H * 0.18 + i * H * 0.06,
              clamp(80, 180, W * 0.17),
              28,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.restore();
          }
          // Modern Jamarat Bridge (multi-level)
          drawJamaratBridge(ctx, t);
          // Three Jamarat pillars (Aqaba, Wusta, Sughra)
          const pillarX = W * 0.5,
            pillarY = H * 0.35;
          drawJamaratPillar(ctx, pillarX, pillarY, t);
          // Ground
          const gg = ctx.createLinearGradient(0, H * 0.68, 0, H);
          gg.addColorStop(0, "#1a1230");
          gg.addColorStop(1, "#080614");
          ctx.fillStyle = gg;
          ctx.fillRect(0, H * 0.68, W, H);
          // Pillar ground glow
          const pg = ctx.createRadialGradient(
            pillarX,
            H * 0.7,
            0,
            pillarX,
            H * 0.7,
            clamp(70, 130, W * 0.11),
          );
          pg.addColorStop(0, "rgba(180,130,50,.15)");
          pg.addColorStop(1, "transparent");
          ctx.fillStyle = pg;
          ctx.fillRect(0, 0, W, H);
          // Throwers
          jamaratState.throwers.forEach((th) =>
            drawRealisticThrower(ctx, W * th.xr, H * 0.7, t + th.ph, th.hue),
          );
          // Spawn stones
          if (t - lastStone > 0.15) {
            lastStone = t;
            jamaratState.stones.push({
              x: W * (0.28 + Math.random() * 0.44),
              y: H * 0.58 + Math.random() * H * 0.08,
              vx: (pillarX - W * (0.28 + Math.random() * 0.44)) * 0.05,
              vy: -3.5 - Math.random() * 4.5,
              life: 1,
            });
          }
          // Stones
          jamaratState.stones = jamaratState.stones.filter((s) => {
            s.x += s.vx;
            s.vy += 0.22;
            s.y += s.vy;
            s.life -= 0.02;
            if (s.life <= 0) return false;
            ctx.save();
            ctx.globalAlpha = s.life;
            ctx.fillStyle = `hsl(0,0%,${50 + Math.floor(Math.random() * 25)}%)`;
            ctx.shadowBlur = 3;
            ctx.shadowColor = "rgba(255,180,80,.3)";
            ctx.beginPath();
            ctx.ellipse(
              s.x,
              s.y,
              clamp(3, 5, W * 0.004),
              clamp(2, 3.5, W * 0.003),
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.restore();
            if (
              Math.abs(s.x - pillarX) < clamp(22, 42, W * 0.038) &&
              s.y > H * 0.38 &&
              s.y < H * 0.64
            ) {
              for (let i = 0; i < 5; i++)
                jamaratState.sparks.push({
                  x: s.x,
                  y: s.y,
                  vx: (Math.random() - 0.5) * 5.5,
                  vy: (Math.random() - 0.5) * 5.5,
                  life: 1,
                });
              return false;
            }
            return true;
          });
          // Sparks
          jamaratState.sparks = jamaratState.sparks.filter((sp) => {
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.vy += 0.08;
            sp.life -= 0.055;
            if (sp.life <= 0) return false;
            ctx.save();
            ctx.globalAlpha = sp.life;
            ctx.fillStyle = `hsl(${25 + Math.floor(Math.random() * 25)},100%,68%)`;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return true;
          });
        }
        draw();
      }

      function drawJamaratBridge(ctx, t) {
        // Multi-level modern bridge
        [
          [0.58, 0.022],
          [0.62, 0.022],
          [0.66, 0.022],
        ].forEach(([yr, hR], level) => {
          const bY = H * yr,
            bH = clamp(10, 18, H * hR);
          // Side columns
          [
            [0.15, H * 0.72],
            [0.85, H * 0.72],
          ].forEach(([xr, py]) => {
            const bx = W * xr;
            ctx.fillStyle = "#2a2040";
            ctx.fillRect(
              bx - clamp(8, 15, W * 0.012),
              bY,
              clamp(16, 30, W * 0.024),
              py - bY,
            );
            // Window
            ctx.fillStyle = "rgba(140,60,255,.08)";
            ctx.fillRect(bx - 5, bY + 10, 10, 18);
          });
          // Deck
          const bdg = ctx.createLinearGradient(0, bY, 0, bY + bH);
          bdg.addColorStop(0, "#504070");
          bdg.addColorStop(1, "#302848");
          ctx.fillStyle = bdg;
          ctx.beginPath();
          ctx.roundRect(W * 0.08, bY, W * 0.84, bH, 3);
          ctx.fill();
          ctx.strokeStyle = "rgba(160,120,255,.15)";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
        // Bridge lights
        const bY = H * 0.58;
        for (let i = 0; i < 10; i++) {
          const lx = W * 0.1 + i * W * 0.09;
          ctx.save();
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(255,200,60,.85)";
          ctx.fillStyle = "rgba(255,215,70,.95)";
          ctx.beginPath();
          ctx.arc(lx, bY - 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      function drawJamaratPillar(ctx, x, y, t) {
        const pw = clamp(32, 50, W * 0.042),
          ph = clamp(110, 170, H * 0.2);
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(180,130,50,.3)";
        // Animated ring glow
        const gr = clamp(32, 55, W * 0.048) + Math.sin(t * 2) * 3;
        const gl = ctx.createRadialGradient(
          x,
          y + ph * 0.5,
          gr * 0.25,
          x,
          y + ph * 0.5,
          gr,
        );
        gl.addColorStop(0, "rgba(180,130,50,.18)");
        gl.addColorStop(1, "transparent");
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(x, y + ph * 0.5, gr, 0, Math.PI * 2);
        ctx.fill();
        // 3D side face (shadow)
        ctx.fillStyle = "#5a5248";
        ctx.beginPath();
        ctx.moveTo(x - pw / 2, y);
        ctx.lineTo(x - pw / 2 - pw * 0.28, y + 9);
        ctx.lineTo(x - pw / 2 - pw * 0.28, y + ph + 9);
        ctx.lineTo(x - pw / 2, y + ph);
        ctx.fill();
        // Main face
        const pg = ctx.createLinearGradient(x - pw / 2, y, x + pw / 2, y);
        pg.addColorStop(0, "#8a8270");
        pg.addColorStop(0.5, "#c8c0a8");
        pg.addColorStop(1, "#8a8270");
        ctx.fillStyle = pg;
        ctx.fillRect(x - pw / 2, y, pw, ph);
        // Top cap
        ctx.fillStyle = "#b0a890";
        ctx.beginPath();
        ctx.roundRect(
          x - pw * 0.65,
          y - clamp(9, 15, H * 0.02),
          pw * 1.3,
          clamp(9, 15, H * 0.02),
          3,
        );
        ctx.fill();
        // Impact marks
        ctx.save();
        ctx.globalAlpha = 0.28;
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = "#555";
          ctx.beginPath();
          ctx.arc(
            x - pw * 0.3 + Math.sin(i * 2.1) * pw * 0.55,
            y + ph * 0.15 + i * ph * 0.09 + Math.sin(i) * 12,
            clamp(2, 4, W * 0.003),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
        ctx.restore();
      }

      function drawRealisticThrower(ctx, x, y, t, hue) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.85, 0.85);
        // Robe
        ctx.fillStyle = "rgba(245,242,235,.92)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = `hsl(${hue + 10},20%,72%)`;
        ctx.beginPath();
        ctx.arc(0, -16, 5.5, 0, Math.PI * 2);
        ctx.fill();
        // Throwing arm arc
        const throwPhase = (t % 2) / 2;
        const armAng =
          -Math.PI * 0.7 + Math.sin(throwPhase * Math.PI * 2) * 0.9;
        ctx.strokeStyle = "rgba(245,242,235,.9)";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(5, -8);
        ctx.lineTo(5 + 14 * Math.cos(armAng), -8 + 14 * Math.sin(armAng));
        ctx.stroke();
        // Stone in hand (when not released)
        if (throwPhase < 0.6) {
          ctx.fillStyle = "rgba(100,80,60,.9)";
          ctx.beginPath();
          ctx.arc(
            5 + 14 * Math.cos(armAng),
            -8 + 14 * Math.sin(armAng),
            2.5,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
      }

      // ============================================================
      // SCENE 5: EID — Fireworks + 3D sheep
      // ============================================================
      const eidState = {
        fireworks: [],
        fwParts: [],
        confetti: [],
        init: false,
      };
      let fwInterval = null;
      function stopFireworks() {
        if (fwInterval) {
          clearInterval(fwInterval);
          fwInterval = null;
        }
      }

      function initEid() {
        if (eidState.init) return;
        eidState.init = true;
        const colors = [
          "#f5c842",
          "#ff6b1a",
          "#2a8a3a",
          "#e84a4a",
          "#4a8ae8",
          "#e84ae8",
          "#ffffff",
          "#ffd700",
        ];
        for (let i = 0; i < 130; i++) {
          eidState.confetti.push({
            x: Math.random() * W,
            y: -Math.random() * H,
            vx: (Math.random() - 0.5) * 2,
            vy: 1.5 + Math.random() * 2,
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.08,
            w: 5 + Math.random() * 10,
            h: 5 + Math.random() * 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            isCircle: Math.random() > 0.5,
          });
        }
      }

      function loopEid() {
        initEid();
        stopFireworks();
        fwInterval = setInterval(() => {
          if (currentScene !== 4) return;
          spawnFirework();
        }, 450);
        const ctx = ctxs.eid;
        function draw() {
          if (currentScene !== 4) return;
          rafs[4] = requestAnimationFrame(draw);
          const t = Date.now() / 1000;
          ctx.clearRect(0, 0, W, H);
          // Night sky green-tinted
          const sk = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, H * 1.2);
          sk.addColorStop(0, "#1a3a0a");
          sk.addColorStop(0.4, "#0d2200");
          sk.addColorStop(0.8, "#060f00");
          sk.addColorStop(1, "#020800");
          ctx.fillStyle = sk;
          ctx.fillRect(0, 0, W, H);
          // Stars
          stars.slice(0, 200).forEach((s) => {
            const op = 0.2 + 0.7 * Math.abs(Math.sin(t * s.sp * 8 + s.ph));
            ctx.beginPath();
            ctx.arc(s.x, s.y * 0.7, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,220,${op})`;
            ctx.fill();
          });
          // Green meadow with waves
          const mdw = ctx.createLinearGradient(0, H * 0.65, 0, H);
          mdw.addColorStop(0, "#1e5a1a");
          mdw.addColorStop(0.4, "#0e3a0c");
          mdw.addColorStop(1, "#06200a");
          ctx.fillStyle = mdw;
          ctx.beginPath();
          ctx.moveTo(0, H);
          ctx.lineTo(0, H * 0.72);
          for (let i = 0; i <= W; i += 25)
            ctx.lineTo(
              i,
              H * 0.72 - 9 * Math.sin((i / W) * Math.PI * 5 + t * 0.4),
            );
          ctx.lineTo(W, H);
          ctx.fill();
          // Lanterns
          drawEidLanterns(ctx, t);
          // Fireworks + confetti
          updateEidConfetti(ctx, t);
          updateEidFireworks(ctx);
          // 3D Sheep (main attraction)
          const sx = W * 0.5 + Math.sin(t * 0.28) * clamp(12, 28, W * 0.025);
          const sy = H * 0.74 + Math.sin(t * 0.45) * clamp(4, 8, H * 0.01);
          drawDetailedSheep(ctx, sx, sy, t);
          // Eid decorations
          drawEidDecorations(ctx, t);
        }
        draw();
      }

      function drawEidLanterns(ctx, t) {
        [
          [0.05, "#ff6b1a", "#7a0000"],
          [0.2, "#f5c842", "#7a5000"],
          [0.5, "#2a8a3a", "#0a3a10"],
          [0.8, "#8b1a8b", "#380038"],
          [0.95, "#1a4a8b", "#0a1040"],
        ].forEach(([xr, c, c2], i) => {
          const lx = W * xr,
            swing = Math.sin(t * 0.4 + i) * 0.1;
          ctx.save();
          ctx.translate(lx, 0);
          // String from top
          ctx.strokeStyle = "rgba(180,140,50,.35)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(Math.sin(swing) * 18, clamp(38, 65, H * 0.065));
          ctx.stroke();
          ctx.translate(Math.sin(swing) * 18, clamp(38, 65, H * 0.065));
          const lw = clamp(24, 38, W * 0.032),
            lh = clamp(44, 62, H * 0.07);
          ctx.save();
          ctx.rotate(swing);
          // Lantern body
          ctx.fillStyle = c2;
          ctx.beginPath();
          ctx.roundRect(-lw / 2, -lh / 2, lw, lh, 7);
          ctx.fill();
          ctx.shadowBlur = 25 + Math.sin(t * 0.7 + i) * 8;
          ctx.shadowColor = c;
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.roundRect(-lw / 2 + 2, -lh / 2 + 2, lw - 4, lh - 4, 6);
          ctx.fill();
          ctx.globalAlpha = 1;
          // Top/bottom caps
          ctx.fillStyle = "rgba(200,160,40,.7)";
          ctx.fillRect(-lw * 0.6, -lh / 2 - 5, lw * 1.2, 5);
          ctx.fillRect(-lw * 0.6, lh / 2, lw * 1.2, 5);
          // Tassel
          ctx.strokeStyle = "rgba(200,160,40,.6)";
          ctx.lineWidth = 1;
          for (let j = 0; j < 4; j++) {
            ctx.beginPath();
            ctx.moveTo(-lw * 0.3 + j * lw * 0.2, lh / 2 + 5);
            ctx.lineTo(
              -lw * 0.2 + j * lw * 0.15 + Math.sin(t * 2 + j) * 2,
              lh / 2 + 14,
            );
            ctx.stroke();
          }
          // Flame
          const fa = 0.55 + Math.sin(t * 8 + i) * 0.4;
          ctx.fillStyle = `rgba(255,240,100,${fa})`;
          ctx.beginPath();
          ctx.ellipse(0, lh * 0.45 + 8, 4, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          ctx.restore();
        });
      }

      function updateEidConfetti(ctx, t) {
        eidState.confetti.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          if (p.y > H + 20) p.y = -20;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = 0.78;
          ctx.fillStyle = p.color;
          if (p.isCircle) {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }
          ctx.restore();
        });
      }

      function spawnFirework() {
        eidState.fireworks.push({
          x: W * (0.1 + Math.random() * 0.8),
          y: H,
          tx: W * (0.1 + Math.random() * 0.8),
          ty: H * (0.08 + Math.random() * 0.42),
          vy: -13 - Math.random() * 8,
          vx: (Math.random() - 0.5) * 3,
          color: `hsl(${Math.random() * 360},100%,70%)`,
          trail: [],
          exploded: false,
        });
      }

      function updateEidFireworks(ctx) {
        eidState.fireworks = eidState.fireworks.filter((fw) => {
          fw.trail.push({ x: fw.x, y: fw.y });
          if (fw.trail.length > 10) fw.trail.shift();
          fw.x += fw.vx;
          fw.y += fw.vy;
          fw.vy += 0.32;
          fw.trail.forEach((p, i) => {
            ctx.save();
            ctx.globalAlpha = (i / fw.trail.length) * 0.65;
            ctx.fillStyle = fw.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = fw.color;
          ctx.fillStyle = fw.color;
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (fw.vy >= 0 || fw.y <= fw.ty + 18) {
            explodeFirework(fw);
            return false;
          }
          return true;
        });
        eidState.fwParts = eidState.fwParts.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.055;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.alpha -= 0.011;
          if (p.alpha <= 0) return false;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = 5;
          ctx.shadowColor = p.color;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return true;
        });
      }

      function explodeFirework(fw) {
        const n = 90 + Math.floor(Math.random() * 60);
        const cols = [fw.color, "#fff", "#ffd700", "#ff8c00", "#ff4488"];
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + Math.random() * 0.3;
          const sp = 0.5 + Math.random() * 7;
          eidState.fwParts.push({
            x: fw.x,
            y: fw.y,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp,
            color: cols[Math.floor(Math.random() * cols.length)],
            alpha: 1,
            r: 1 + Math.random() * 2.5,
          });
        }
      }

      function drawDetailedSheep(ctx, x, y, t) {
        ctx.save();
        // Shadow
        const sg = ctx.createRadialGradient(
          x,
          y + 8,
          0,
          x,
          y,
          clamp(70, 110, W * 0.09),
        );
        sg.addColorStop(0, "rgba(0,0,0,.22)");
        sg.addColorStop(1, "transparent");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.ellipse(x, y + 6, clamp(70, 100, W * 0.085), 14, 0, 0, Math.PI * 2);
        ctx.fill();
        const bounce = Math.sin(t * 2.2) * clamp(3, 6, H * 0.008);
        ctx.translate(x, y + bounce);
        const bw = clamp(65, 110, W * 0.095),
          bh = clamp(50, 85, H * 0.095);
        // Wool body — layered for fluffy 3D look
        const woolLayers = [
          [0, 0, bw, bh],
          [-10, -8, bw * 0.78, bh * 0.78],
          [12, -4, bw * 0.62, bh * 0.58],
          [-8, -14, bw * 0.55, bh * 0.52],
          [6, -18, bw * 0.42, bh * 0.4],
        ];
        woolLayers.forEach(([ox, oy, w, h], li) => {
          const bright = 1 - 0.04 * li;
          const wg = ctx.createRadialGradient(
            ox,
            oy - h * 0.2,
            0,
            ox,
            oy,
            Math.max(w, h),
          );
          wg.addColorStop(0, `hsl(30,15%,${Math.round(bright * 98)}%)`);
          wg.addColorStop(0.65, `hsl(30,12%,${Math.round(bright * 88)}%)`);
          wg.addColorStop(1, `hsl(30,10%,${Math.round(bright * 78)}%)`);
          ctx.save();
          ctx.fillStyle = wg;
          ctx.shadowBlur = 5;
          ctx.shadowColor = "rgba(0,0,0,.12)";
          ctx.beginPath();
          ctx.ellipse(ox, oy, w, h, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        // Flower decorations
        [
          [-28, -12, "pink"],
          [8, -20, "gold"],
          [32, -4, "coral"],
        ].forEach(([ox, oy, fc]) => {
          const fc2 =
            fc === "pink" ? "#ffb0c8" : fc === "gold" ? "#ffd700" : "#ff8060";
          for (let p = 0; p < 5; p++) {
            ctx.fillStyle = fc2;
            ctx.beginPath();
            ctx.ellipse(
              ox + Math.cos(p * Math.PI * 0.4) * 5,
              oy + Math.sin(p * Math.PI * 0.4) * 5,
              3,
              3.5,
              p * Math.PI * 0.4,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
          ctx.fillStyle = "#fff59d";
          ctx.beginPath();
          ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
        // HEAD
        ctx.save();
        ctx.translate(
          bw * 0.72 + clamp(8, 16, W * 0.014),
          -bh * 0.3 - clamp(4, 9, H * 0.011),
        );
        ctx.rotate(Math.sin(t * 0.45) * 0.08);
        const hw = clamp(26, 40, W * 0.034),
          hh = clamp(24, 36, H * 0.04);
        const hg = ctx.createRadialGradient(0, -4, 0, 0, 0, hw);
        hg.addColorStop(0, "#f2dfc0");
        hg.addColorStop(0.7, "#d4b888");
        hg.addColorStop(1, "#b89060");
        ctx.fillStyle = hg;
        ctx.shadowBlur = 5;
        ctx.shadowColor = "rgba(0,0,0,.2)";
        ctx.beginPath();
        ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        [
          [-hw * 0.88, -4, -22],
          [hw * 0.88, -4, 22],
        ].forEach(([ex, ey, rd]) => {
          ctx.save();
          ctx.translate(ex, ey);
          ctx.rotate((rd * Math.PI) / 180);
          const eg = ctx.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            clamp(9, 14, W * 0.012),
          );
          eg.addColorStop(0, "#e8b088");
          eg.addColorStop(1, "#b87858");
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            clamp(8, 12, W * 0.01),
            clamp(12, 18, H * 0.02),
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          // Inner ear
          ctx.fillStyle = "rgba(220,130,130,.5)";
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            clamp(4, 7, W * 0.006),
            clamp(7, 11, H * 0.012),
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.restore();
        });
        // Horns (small curled)
        [
          [-hw * 0.38, -hh * 0.82, -35],
          [hw * 0.38, -hh * 0.82, 35],
        ].forEach(([hx, hy, rot]) => {
          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate((rot * Math.PI) / 180);
          ctx.fillStyle = "#c8a870";
          ctx.beginPath();
          ctx.arc(0, 0, clamp(6, 10, W * 0.009), Math.PI, Math.PI * 2 - 0.2);
          ctx.lineTo(2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
        // Eyes with blink
        const blinkSc =
          t % 4 > 3.7 ? Math.max(0.05, 1 - ((t % 4) - 3.7) * 10) : 1;
        [
          [-hw * 0.38, 0],
          [hw * 0.38, 0],
        ].forEach(([ex, ey]) => {
          // Eye white
          ctx.fillStyle = "rgba(255,255,255,.9)";
          ctx.beginPath();
          ctx.ellipse(
            ex,
            ey,
            clamp(5, 8, W * 0.007) * 1.2,
            clamp(5, 8, W * 0.007) * blinkSc * 1.2,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          // Iris
          ctx.fillStyle = "#2a1400";
          ctx.beginPath();
          ctx.ellipse(
            ex,
            ey,
            clamp(4, 6, W * 0.005),
            clamp(4, 6, W * 0.005) * blinkSc,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          // Pupil highlight
          ctx.fillStyle = "rgba(255,255,255,.9)";
          ctx.beginPath();
          ctx.arc(
            ex - 1.5,
            ey - 1.5,
            clamp(1.5, 2.5, W * 0.002),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        });
        // Nose
        ctx.fillStyle = "#c09070";
        ctx.beginPath();
        ctx.ellipse(
          0,
          hh * 0.28,
          clamp(7, 11, W * 0.009),
          clamp(5, 8, H * 0.009),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = "rgba(100,50,30,.7)";
        ctx.beginPath();
        ctx.arc(-3, hh * 0.28, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, hh * 0.28, 2, 0, Math.PI * 2);
        ctx.fill();
        // Smile
        ctx.strokeStyle = "#b07848";
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, hh * 0.42, clamp(5, 8, W * 0.007), 0, Math.PI);
        ctx.stroke();
        ctx.restore(); // end head
        // Legs
        [
          [-bw * 0.42, -bw * 0.14, bw * 0.14, bw * 0.42].map((lx, i) => ({
            lx,
            ph: [0, 0.5, 0.25, 0.75][i],
          })),
        ]
          .flat()
          .forEach(({ lx, ph }) => {
            const ls = Math.sin(t * 2.8 + ph * Math.PI * 2) * 0.14;
            ctx.save();
            ctx.translate(lx, bh * 0.72);
            ctx.rotate(ls);
            const lh2 = clamp(20, 34, H * 0.038);
            const lg = ctx.createLinearGradient(0, 0, 0, lh2);
            lg.addColorStop(0, "#d4b890");
            lg.addColorStop(1, "#c0a070");
            ctx.fillStyle = lg;
            ctx.beginPath();
            ctx.roundRect(-4.5, 0, 9, lh2, 3);
            ctx.fill();
            // Hoof
            ctx.fillStyle = "#1a1008";
            ctx.beginPath();
            ctx.roundRect(-5, lh2 - 5, 10, 7, 3);
            ctx.fill();
            ctx.restore();
          });
        // Tail
        ctx.save();
        ctx.translate(-bw * 0.72, bh * 0.12);
        ctx.rotate(Math.sin(t * 4.5) * 0.28);
        ctx.fillStyle = "rgba(255,255,255,.9)";
        ctx.beginPath();
        ctx.arc(0, 0, clamp(9, 14, W * 0.011), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore(); // sheep
      }

      function drawEidDecorations(ctx, t) {
        const decos = ["✨", "⭐", "🌙", "☪️", "🌟", "💫", "✦"];
        [
          [0.07, 0.14],
          [0.93, 0.11],
          [0.14, 0.43],
          [0.86, 0.38],
          [0.04, 0.63],
          [0.94, 0.58],
          [0.3, 0.07],
          [0.72, 0.09],
          [0.5, 0.04],
          [0.22, 0.28],
          [0.78, 0.26],
        ].forEach(([xr, yr], i) => {
          const bob = Math.sin(t * 0.55 + i) * clamp(5, 11, H * 0.013);
          ctx.save();
          ctx.translate(W * xr, H * yr + bob);
          ctx.rotate(Math.sin(t * 0.28 + i) * 0.18);
          ctx.font = `${clamp(13, 20, W * 0.017)}px serif`;
          ctx.textAlign = "center";
          ctx.globalAlpha = 0.45 + 0.45 * Math.abs(Math.sin(t * 0.38 + i));
          ctx.fillText(decos[i % decos.length], 0, 0);
          ctx.restore();
        });
      }

      // ============================================================
      // ============================================================
      // SOUND — Synthesized Arabic Takbeer + Talbiyah using Web Audio
      // Each scene has its own authentic Islamic audio character
      // ============================================================
      let masterGain = null,
        activeOscs = [],
        soundTimers = [];

      // Arabic vocal formant frequencies for male voice simulation
      // Formants approximate the vowel sounds of Arabic
      const ARABIC_FORMANTS = {
        // "الله" — deep resonant
        allah: [
          { f: 200, bw: 80 },
          { f: 900, bw: 120 },
          { f: 2200, bw: 200 },
        ],
        // "أكبر" — bright open
        akbar: [
          { f: 250, bw: 90 },
          { f: 1200, bw: 150 },
          { f: 2800, bw: 250 },
        ],
        // "لبيك" — medium
        labbayk: [
          { f: 220, bw: 85 },
          { f: 1050, bw: 140 },
          { f: 2500, bw: 220 },
        ],
      };

      // Synthesize a single Arabic word/phrase utterance
      function synthArabicSyllable(
        ac,
        dest,
        startTime,
        pitch,
        duration,
        formants,
        gain = 0.18,
      ) {
        const nds = [];
        // Fundamental — human male voice base
        const fund = ac.createOscillator();
        const fundG = ac.createGain();
        fund.type = "sawtooth"; // rich harmonics like vocal cords
        fund.frequency.setValueAtTime(pitch, startTime);
        // Natural pitch contour (rises then falls like real speech)
        fund.frequency.linearRampToValueAtTime(
          pitch * 1.05,
          startTime + duration * 0.3,
        );
        fund.frequency.linearRampToValueAtTime(
          pitch * 0.96,
          startTime + duration * 0.85,
        );
        fund.frequency.linearRampToValueAtTime(
          pitch * 0.88,
          startTime + duration,
        );
        fundG.gain.setValueAtTime(0, startTime);
        fundG.gain.linearRampToValueAtTime(gain, startTime + 0.06);
        fundG.gain.setValueAtTime(gain, startTime + duration * 0.7);
        fundG.gain.linearRampToValueAtTime(0, startTime + duration);
        fund.connect(fundG);
        fundG.connect(dest);
        fund.start(startTime);
        fund.stop(startTime + duration + 0.05);
        nds.push(fund, fundG);
        // Formant filters to shape vocal character
        formants.forEach(({ f, bw }) => {
          const bp = ac.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.value = f;
          bp.Q.value = f / bw;
          fund.connect(bp);
          bp.connect(dest);
          // Also connect through the gain envelope
          nds.push(bp);
        });
        // Breathiness layer
        const noise = ac.createOscillator(); // use triangle for softer breath
        noise.type = "triangle";
        noise.frequency.setValueAtTime(pitch * 2.1, startTime);
        noise.frequency.linearRampToValueAtTime(
          pitch * 1.9,
          startTime + duration,
        );
        const noiseG = ac.createGain();
        noiseG.gain.setValueAtTime(0, startTime);
        noiseG.gain.linearRampToValueAtTime(gain * 0.12, startTime + 0.08);
        noiseG.gain.linearRampToValueAtTime(0, startTime + duration);
        noise.connect(noiseG);
        noiseG.connect(dest);
        noise.start(startTime);
        noise.stop(startTime + duration + 0.05);
        nds.push(noise, noiseG);
        activeOscs.push(...nds);
      }

      // Build a mosque reverb impulse response
      function buildMosqueReverb(ac) {
        const rate = ac.sampleRate,
          dur = 3.5;
        const len = Math.floor(rate * dur);
        const buf = ac.createBuffer(2, len, rate);
        for (let ch = 0; ch < 2; ch++) {
          const d = buf.getChannelData(ch);
          for (let i = 0; i < len; i++) {
            const t = i / len;
            // Early reflections (0-80ms) + late reverb tail
            const early = i < rate * 0.08 ? Math.random() * 2 - 1 : 0;
            const late = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.8);
            d[i] = early * 0.5 * Math.exp(-t * 2) + late * 0.5;
          }
        }
        const conv = ac.createConvolver();
        conv.buffer = buf;
        return conv;
      }

      // ─── SCENE SOUND DEFINITIONS ───────────────────────────────
      // Each array entry: [pitch, duration, formant_set, pause_after]
      // Talbiyah: لبيك اللهم لبيك
      const TALBIYAH_SEQ = [
        [130, 0.45, "labbayk", 0.08],
        [145, 0.55, "allah", 0.05],
        [155, 0.7, "labbayk", 0.25],
        [130, 0.45, "labbayk", 0.08],
        [145, 0.55, "allah", 0.05],
        [155, 0.7, "labbayk", 0.5],
        [148, 0.5, "allah", 0.06],
        [152, 0.4, "akbar", 0.06],
        [145, 0.6, "allah", 0.5],
      ];
      // Takbeer: الله أكبر الله أكبر لا إله إلا الله
      const TAKBEER_SEQ = [
        [138, 0.5, "allah", 0.06],
        [155, 0.45, "akbar", 0.06],
        [138, 0.5, "allah", 0.06],
        [155, 0.45, "akbar", 0.4],
        [138, 0.5, "allah", 0.06],
        [155, 0.45, "akbar", 0.06],
        [138, 0.5, "allah", 0.06],
        [155, 0.45, "akbar", 0.4],
        [130, 0.4, "labbayk", 0.05],
        [145, 0.35, "allah", 0.05],
        [152, 0.6, "akbar", 0.5],
      ];
      // Dua Arafat: سبحانك اللهم — gentle, contemplative
      const DUA_SEQ = [
        [118, 0.6, "labbayk", 0.1],
        [125, 0.5, "allah", 0.08],
        [130, 0.7, "labbayk", 0.4],
        [122, 0.55, "allah", 0.08],
        [128, 0.65, "akbar", 0.08],
        [125, 0.75, "labbayk", 0.6],
      ];
      // Night dhikr: سبحان الله — slow, quiet
      const DHIKR_SEQ = [
        [112, 0.7, "labbayk", 0.15],
        [118, 0.6, "allah", 0.1],
        [112, 0.8, "labbayk", 0.7],
        [115, 0.65, "akbar", 0.1],
        [112, 0.75, "labbayk", 0.8],
      ];
      // Eid Takbeer: الله أكبر — joyful, high energy
      const EID_TAKBEER_SEQ = [
        [148, 0.45, "allah", 0.05],
        [165, 0.4, "akbar", 0.05],
        [148, 0.45, "allah", 0.05],
        [165, 0.4, "akbar", 0.3],
        [148, 0.45, "allah", 0.05],
        [165, 0.4, "akbar", 0.05],
        [148, 0.45, "allah", 0.05],
        [165, 0.4, "akbar", 0.3],
        [138, 0.35, "labbayk", 0.04],
        [148, 0.3, "allah", 0.04],
        [155, 0.5, "akbar", 0.04],
        [138, 0.35, "labbayk", 0.04],
        [148, 0.3, "allah", 0.04],
        [155, 0.5, "allah", 0.5],
      ];

      const SCENE_SEQS = [
        TALBIYAH_SEQ,
        DUA_SEQ,
        DHIKR_SEQ,
        TAKBEER_SEQ,
        EID_TAKBEER_SEQ,
      ];

      function playSequence(ac, dest, seq, baseVol, startOffset = 0) {
        let t = ac.currentTime + startOffset;
        seq.forEach(([pitch, dur, fset, pause]) => {
          const formants = ARABIC_FORMANTS[fset] || ARABIC_FORMANTS.allah;
          synthArabicSyllable(ac, dest, t, pitch, dur, formants, baseVol);
          t += dur + pause;
        });
        return t - ac.currentTime; // total duration
      }

      function startSceneSound(idx) {
        stopAllSound();
        if (!audioCtx || !soundOn) return;
        // Master chain
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.2);
        // Mosque reverb
        const reverb = buildMosqueReverb(audioCtx);
        const dryG = audioCtx.createGain();
        dryG.gain.value = 0.45;
        const wetG = audioCtx.createGain();
        wetG.gain.value = 0.55;
        masterGain.connect(dryG);
        dryG.connect(audioCtx.destination);
        masterGain.connect(reverb);
        reverb.connect(wetG);
        wetG.connect(audioCtx.destination);
        activeOscs.push(dryG, wetG, reverb);

        // Ambient drone underneath (subtle, doesn't overpower vocals)
        const droneFreqs = [
          [65.4, 0.04],
          [98, 0.025],
          [130.8, 0.018],
        ]; // C2,G2,C3
        droneFreqs.forEach(([f, g]) => {
          const osc = audioCtx.createOscillator();
          const og = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.value = f;
          og.gain.value = g;
          osc.connect(og);
          og.connect(masterGain);
          osc.start();
          activeOscs.push(osc, og);
        });

        const seq = SCENE_SEQS[idx] || SCENE_SEQS[0];
        const vol = idx === 4 ? 0.22 : idx === 3 ? 0.2 : 0.16; // Eid louder
        // Play sequence + loop it
        function scheduleLoop(offset) {
          const totalDur = playSequence(
            audioCtx,
            masterGain,
            seq,
            vol,
            offset + 0.3,
          );
          // Add 2s gap then repeat
          const loopTimer = setTimeout(
            () => {
              if (soundOn && currentScene === idx) scheduleLoop(0);
            },
            (totalDur + 2) * 1000,
          );
          soundTimers.push(loopTimer);
        }
        scheduleLoop(0);
      }

      function toggleSound() {
        soundOn = !soundOn;
        const btn = document.getElementById("soundBtn");
        btn.textContent = soundOn ? "🔊" : "🔇";
        btn.classList.toggle("sound-active", soundOn);
        if (soundOn) {
          if (!audioCtx) {
            try {
              audioCtx = new (
                window.AudioContext || window.webkitAudioContext
              )();
            } catch (e) {
              soundOn = false;
              btn.textContent = "🔇";
              btn.classList.remove("sound-active");
              return;
            }
          }
          if (audioCtx.state === "suspended") audioCtx.resume();
          startSceneSound(currentScene);
        } else {
          stopAllSound();
        }
      }

      function stopAllSound() {
        soundTimers.forEach((t) => clearTimeout(t));
        soundTimers = [];
        activeOscs.forEach((n) => {
          try {
            if (n.stop) n.stop();
            if (n.disconnect) n.disconnect();
          } catch (e) {}
        });
        activeOscs = [];
        if (masterGain) {
          try {
            masterGain.gain.setValueAtTime(
              0,
              audioCtx ? audioCtx.currentTime : 0,
            );
            masterGain.disconnect();
          } catch (e) {}
        }
        masterGain = null;
      }

      function updateAmbientForScene(idx) {
        if (!soundOn || !audioCtx) return;
        stopAllSound();
        setTimeout(() => {
          if (soundOn) startSceneSound(idx);
        }, 400);
      }
  