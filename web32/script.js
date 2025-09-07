(() => {
  // ---------- Utility ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // ---------- Canvas setup ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function fitCanvas() {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = (cssW | 0) * DPR;
    canvas.height = (cssH | 0) * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  new ResizeObserver(fitCanvas).observe(canvas);
  fitCanvas();

  // ---------- Audio (tiny bleeps via WebAudio) ----------
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  let soundOn = true;
  function beep(type = "square", freq = 660, time = 0.07, gain = 0.03) {
    if (!soundOn) return;
    if (!audioCtx) audioCtx = new AudioCtx();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, t + time);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + time);
  }

  // ---------- Game State ----------
  const STATE = { MENU: 0, PLAY: 1, PAUSE: 2, OVER: 3 };
  let gameState = STATE.MENU;

  const world = {
    gravity: 1900,
    scroll: 240, // base pixels/sec
    t: 0,
    speedMul: 1,
    score: 0,
    best: +localStorage.getItem("ej_best") || 0,
  };

  const player = {
    x: 140,
    y: 0,
    w: 36,
    h: 46,
    vx: 0,
    vy: 0,
    spd: 330,
    jump: 740,
    canDouble: true,
    onGround: false,
    color: "#fff",
  };

  // Platforms (segments moving left)
  const platforms = [];
  const PLATFORM = {
    minW: 120,
    maxW: 320,
    minGap: 80,
    maxGap: 220,
    minH: 180,
    maxH: 420,
    thickness: 16,
  };

  // Powerups
  const powerups = [];
  const POW = { size: 14, chance: 0.22, types: ["spring", "gem"] };

  // Input
  const keys = new Set();
  const leftBtn = document.getElementById("left");
  const rightBtn = document.getElementById("right");
  const jumpBtn = document.getElementById("jump");

  // UI elements
  const elScore = document.getElementById("score");
  const overlay = document.getElementById("overlay");
  const gameover = document.getElementById("gameover");
  const finalScore = document.getElementById("finalScore");
  const bestScore = document.getElementById("bestScore");

  // Buttons
  const btnPlay = document.getElementById("btnPlay");
  const btnRestart = document.getElementById("btnRestart");
  const btnHome = document.getElementById("btnHome");
  const btnPause = document.getElementById("btnPause");
  const btnSound = document.getElementById("btnSound");
  const btnTheme = document.getElementById("btnTheme");

  // Theme toggle
  btnTheme.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
  });

  // Sound toggle
  btnSound.addEventListener("click", () => {
    soundOn = !soundOn;
    btnSound.textContent = soundOn ? "🔊" : "🔈";
    if (soundOn) beep("sine", 880, 0.05, 0.02);
  });

  // Pause toggle
  function togglePause() {
    if (gameState !== STATE.PLAY && gameState !== STATE.PAUSE) return;
    gameState = gameState === STATE.PLAY ? STATE.PAUSE : STATE.PLAY;
    btnPause.textContent = gameState === STATE.PLAY ? "⏸" : "▶";
    if (gameState === STATE.PAUSE) beep("triangle", 480, 0.06, 0.02);
  }
  btnPause.addEventListener("click", togglePause);

  // Controls (keyboard)
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (
      ["arrowleft", "a", "arrowright", "d", "w", "arrowup", " "].includes(
        e.key.toLowerCase()
      )
    )
      e.preventDefault();
    if (k === "p") togglePause();

    if (k === " " || k === "w" || k === "arrowup") jump();
    if (k === "a" || k === "arrowleft") keys.add("left");
    if (k === "d" || k === "arrowright") keys.add("right");
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k === "a" || k === "arrowleft") keys.delete("left");
    if (k === "d" || k === "arrowright") keys.delete("right");
  });

  // Touch buttons
  function bindHold(btn, id) {
    const on = () => keys.add(id);
    const off = () => keys.delete(id);
    btn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        on();
      },
      { passive: false }
    );
    btn.addEventListener("touchend", off);
    btn.addEventListener("touchcancel", off);
    btn.addEventListener("mousedown", on);
    btn.addEventListener("mouseup", off);
    btn.addEventListener("mouseleave", off);
  }
  bindHold(leftBtn, "left");
  bindHold(rightBtn, "right");
  jumpBtn.addEventListener("click", () => jump());

  btnPlay.addEventListener("click", startGame);
  btnRestart.addEventListener("click", startGame);
  btnHome.addEventListener("click", () => {
    gameover.classList.remove("visible");
    overlay.classList.add("visible");
    gameState = STATE.MENU;
  });

  // ---------- Generation ----------
  function reset() {
    world.t = 0;
    world.speedMul = 1;
    world.score = 0;
    player.x = canvas.clientWidth * 0.25;
    player.y = canvas.clientHeight * 0.4;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.canDouble = true;

    platforms.length = 0;
    powerups.length = 0;

    // Create initial ground + a few platforms to the right
    let x = 0;
    const baseY = canvas.clientHeight - 120;
    for (let i = 0; i < 6; i++) {
      const w = 220;
      const y = baseY - i * 12;
      platforms.push(makePlatform(x, y, w, "start"));
      x += w + 40;
    }
    while (x < canvas.clientWidth * 2) {
      x = spawnNextPlatform(x);
    }
  }

  function makePlatform(x, y, w, kind = "normal") {
    return { x, y, w, h: PLATFORM.thickness, kind, id: Math.random() };
  }

  function spawnNextPlatform(prevRight) {
    const gap = rand(PLATFORM.minGap, PLATFORM.maxGap) / world.speedMul ** 0.2;
    const w = rand(PLATFORM.minW, PLATFORM.maxW);
    const lastY = platforms.length
      ? platforms[platforms.length - 1].y
      : canvas.clientHeight - 160;
    const deltaY = rand(-140, 120);
    const y = clamp(lastY + deltaY, PLATFORM.minH, PLATFORM.maxH);
    const p = makePlatform(prevRight + gap, y, w);
    platforms.push(p);

    // chance for a powerup on new platform
    if (Math.random() < POW.chance) {
      const type = pick(POW.types);
      powerups.push({
        type,
        x: p.x + rand(24, p.w - 24),
        y: p.y - 22,
        r: POW.size,
        vy: 0,
        alive: true,
        id: Math.random(),
      });
    }
    return p.x + p.w;
  }

  // ---------- Mechanics ----------
  function jump() {
    if (gameState !== STATE.PLAY) return;
    if (player.onGround) {
      player.vy = -player.jump;
      player.onGround = false;
      player.canDouble = true;
      beep("square", 720, 0.06, 0.03);
    } else if (player.canDouble) {
      player.vy = -player.jump * 0.92;
      player.canDouble = false;
      beep("sawtooth", 880, 0.06, 0.025);
    }
  }

  // Rect collision helper
  function intersects(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // ---------- Render ----------
  function draw() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Ground gradient
    const grd = ctx.createLinearGradient(0, h * 0.65, 0, h);
    grd.addColorStop(0, "rgba(255,255,255,0.06)");
    grd.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    // Platforms
    for (const p of platforms) {
      const r = 10;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      roundRect(ctx, p.x, p.y, p.w, p.h, r, true, false);
      // top highlight
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(p.x + 6, p.y + 2, p.w - 12, 2);
    }

    // Powerups
    for (const pu of powerups) {
      if (!pu.alive) continue;
      ctx.save();
      ctx.translate(pu.x, pu.y + Math.sin(world.t * 5 + pu.id) * 3);
      if (pu.type === "spring") {
        ctx.fillStyle = "#60a5fa";
        springIcon(ctx, 0, 0, 16);
      } else if (pu.type === "gem") {
        ctx.fillStyle = "#f59e0b";
        gemIcon(ctx, 0, 0, 16);
      }
      ctx.restore();
    }

    // Player (rounded capsule)
    ctx.save();
    ctx.translate(player.x, player.y);
    const tilt = clamp(player.vx / player.spd, -1, 1) * 0.3;
    ctx.rotate(tilt);
    const grd2 = ctx.createLinearGradient(0, 0, 0, player.h);
    grd2.addColorStop(0, "#fff");
    grd2.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = grd2;
    capsule(ctx, -player.w / 2, -player.h, player.w, player.h, 12);
    // face
    ctx.fillStyle = "#0f172a";
    dot(ctx, -8, -player.h + 18, 3);
    dot(ctx, 8, -player.h + 18, 3);
    ctx.fillRect(-6, -player.h + 26, 12, 2.5);
    ctx.restore();

    // Foreground vignette
    const vg = ctx.createRadialGradient(
      w / 2,
      h * 0.5,
      h * 0.1,
      w / 2,
      h * 0.5,
      h * 0.75
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  function capsule(ctx, x, y, w, h, r) {
    ctx.beginPath();
    const rr = Math.min(r, h / 2, w / 2);
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arc(x + w - rr, y + rr, rr, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2);
    ctx.lineTo(x + rr, y + h);
    ctx.arc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + rr);
    ctx.arc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
  }
  function dot(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === "number") r = { tl: r, tr: r, br: r, bl: r };
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    ctx.lineTo(x + w, y + h - r.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    ctx.lineTo(x + r.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
  function springIcon(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.roundRect(-s, -s / 2, s * 2, s, 4);
    ctx.fill();
    ctx.restore();
  }
  function gemIcon(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.9, -s * 0.2);
    ctx.lineTo(s * 0.6, s * 0.9);
    ctx.lineTo(-s * 0.6, s * 0.9);
    ctx.lineTo(-s * 0.9, -s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------- Loop ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;

    if (gameState === STATE.PLAY) update(dt);
    draw();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function update(dt) {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;

    world.t += dt;
    // Difficulty ramp: speed and gaps scale up with time
    world.speedMul = 1 + world.t * 0.06;
    const scroll = world.scroll * world.speedMul;

    // Player input
    player.vx = 0;
    if (keys.has("left")) player.vx = -player.spd;
    if (keys.has("right")) player.vx = +player.spd;

    // Apply physics
    player.vy += world.gravity * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // World scrolls left; we move objects
    for (const p of platforms) p.x -= scroll * dt;
    for (const pu of powerups) pu.x -= scroll * dt;

    // Spawn new platforms off the right
    let lastPlatRight = platforms.length
      ? platforms[platforms.length - 1].x + platforms[platforms.length - 1].w
      : 0;
    while (lastPlatRight < w * 2.2)
      lastPlatRight = spawnNextPlatform(lastPlatRight);

    // Remove off-screen platforms/powerups
    while (platforms.length && platforms[0].x + platforms[0].w < -80)
      platforms.shift();
    for (const pu of powerups) if (pu.x < -80) pu.alive = false;

    // Player/platform collision (grounded check)
    player.onGround = false;
    for (const p of platforms) {
      // Only handle top collision when falling
      if (
        player.vy >= 0 &&
        intersects(
          player.x - player.w / 2,
          player.y - player.h,
          player.w,
          player.h,
          p.x,
          p.y,
          p.w,
          p.h
        )
      ) {
        const prevY = player.y - player.vy * dt;
        const wasAbove = prevY - player.h <= p.y;
        if (wasAbove) {
          player.y = p.y + player.h; // align on top
          player.vy = Math.min(player.vy, 80); // small stick
          player.onGround = true;
          player.canDouble = true;
        }
      }
    }

    // Clamp within horizontal bounds (with soft margins)
    const margin = 14;
    player.x = clamp(player.x, margin, w - margin);

    // Powerup pickups
    for (const pu of powerups) {
      if (!pu.alive) continue;
      if (
        intersects(
          player.x - player.w / 2,
          player.y - player.h,
          player.w,
          player.h,
          pu.x - 16,
          pu.y - 16,
          32,
          32
        )
      ) {
        if (pu.type === "spring") {
          player.vy = -player.jump * 1.25;
          player.onGround = false;
          player.canDouble = true;
          beep("triangle", 980, 0.08, 0.04);
        } else if (pu.type === "gem") {
          world.score += 150;
          beep("sine", 1040, 0.07, 0.04);
        }
        pu.alive = false;
      }
    }

    // Scoring (distance + little for airtime)
    world.score += scroll * dt * 0.6;
    if (!player.onGround && player.vy < 0) world.score += 20 * dt;

    // Death: fell below screen
    if (player.y - player.h > h + 10) {
      gameOver();
      return;
    }

    // HUD
    elScore.textContent = Math.floor(world.score).toLocaleString();
  }

  function startGame() {
    overlay.classList.remove("visible");
    gameover.classList.remove("visible");
    btnPause.textContent = "⏸";
    reset();
    gameState = STATE.PLAY;
    beep("sine", 660, 0.05, 0.03);
  }

  function gameOver() {
    gameState = STATE.OVER;
    finalScore.textContent = Math.floor(world.score).toLocaleString();
    world.best = Math.max(world.best, Math.floor(world.score));
    localStorage.setItem("ej_best", world.best);
    bestScore.textContent = world.best.toLocaleString();
    setTimeout(() => gameover.classList.add("visible"), 180);
    beep("sawtooth", 220, 0.18, 0.05);
  }

  // Pause visibility helpers for overlays
  window.addEventListener("visibilitychange", () => {
    if (document.hidden && gameState === STATE.PLAY) togglePause();
  });

  // ---------- Nice touch: resume with any key on pause ----------
  window.addEventListener("keydown", (e) => {
    if (gameState === STATE.PAUSE && e.key.toLowerCase() !== "p") togglePause();
  });

  // Expose for console debugging if needed
  window.__ej = { world, player, platforms, powerups };
})();
