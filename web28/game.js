/* Tiny Platformer - vanilla JS, Canvas 2D
   Features: camera, coins, spikes, enemy patrol, pause/restart, coyote time.
*/

(() => {
  // ---------- Helpers ----------
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
  const rectsOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ---------- Canvas & State ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // Logical render size (kept fixed), CSS scales it.
  const W = 960,
    H = 540;

  // Camera
  const camera = { x: 0, y: 0, lerp: 0.12 };

  // HUD elements
  const elCoins = document.getElementById("coins");
  const elCoinsTotal = document.getElementById("coinsTotal");
  const elLives = document.getElementById("lives");
  const elTime = document.getElementById("time");
  const overlay = document.getElementById("overlay");

  // Controls
  const keys = { left: false, right: false, jump: false, pause: false };
  let touchLeft = false,
    touchRight = false,
    touchJump = false;

  // Game constants
  const GRAVITY = 1600; // px/s^2
  const MOVE_SPEED = 360; // px/s
  const AIR_ACCEL = 2600; // px/s^2
  const GROUND_ACCEL = 4200; // px/s^2
  const MAX_FALL = 1500; // terminal velocity
  const JUMP_VELOCITY = 680; // px/s
  const COYOTE_TIME = 0.09; // seconds after leaving ledge
  const JUMP_BUFFER = 0.12; // jump press before landing
  const FRICTION = 1800; // px/s^2 on ground

  // Level (world units are pixels). Simple handcrafted layout.
  // World size larger than canvas; camera will follow.
  const world = { w: 3000, h: 1200, bgStars: [] };

  // Platforms (x, y, w, h)
  const platforms = [
    { x: 0, y: 1080, w: 3000, h: 120 }, // ground
    { x: 200, y: 900, w: 220, h: 24 },
    { x: 480, y: 810, w: 200, h: 24 },
    { x: 760, y: 720, w: 180, h: 24 },
    { x: 1040, y: 740, w: 180, h: 24 },
    { x: 1360, y: 680, w: 220, h: 24 },
    { x: 1700, y: 760, w: 240, h: 24 },
    { x: 2050, y: 840, w: 220, h: 24 },
    { x: 2360, y: 900, w: 280, h: 24 },
  ];

  // Coins (x, y, r)
  const coins = [
    { x: 260, y: 850, r: 10, got: false },
    { x: 540, y: 760, r: 10, got: false },
    { x: 820, y: 670, r: 10, got: false },
    { x: 1100, y: 690, r: 10, got: false },
    { x: 1420, y: 630, r: 10, got: false },
    { x: 1760, y: 710, r: 10, got: false },
    { x: 2090, y: 790, r: 10, got: false },
    { x: 2420, y: 850, r: 10, got: false },
  ];

  // Spikes (harmful rectangles)
  const spikes = [
    { x: 940, y: 1080 - 24, w: 140, h: 24 },
    { x: 1500, y: 1080 - 24, w: 160, h: 24 },
    { x: 2200, y: 1080 - 24, w: 160, h: 24 },
  ];

  // Enemy (simple patrol)
  const enemies = [
    {
      x: 1250,
      y: 1080 - 38,
      w: 28,
      h: 38,
      dir: 1,
      speed: 100,
      minX: 1180,
      maxX: 1360,
    },
  ];

  // Goal (flag)
  const goal = { x: 2800, y: 1080 - 140, w: 28, h: 140 };

  elCoinsTotal.textContent = coins.length.toString();

  // Player
  const playerStart = { x: 80, y: 1080 - 120 };
  const player = {
    x: playerStart.x,
    y: playerStart.y,
    w: 28,
    h: 42,
    vx: 0,
    vy: 0,
    onGround: false,
    lives: 3,
    coyote: 0,
    jumpBuffer: 0,
    facing: 1,
    invuln: 0,
  };

  let coinsCollected = 0;
  let paused = false;
  let gameOver = false;
  let won = false;
  let tAccum = 0;
  let lastTs = 0;
  let elapsed = 0;

  // Prettify background stars
  for (let i = 0; i < 160; i++) {
    world.bgStars.push({
      x: Math.random() * world.w,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.2,
      tw: Math.random() * 2,
    });
  }

  // ---------- Input ----------
  const keymap = {
    ArrowLeft: "left",
    ArrowRight: "right",
    a: "left",
    d: "right",
    " ": "jump",
    z: "jump",
    Z: "jump",
    w: "jump",
    ArrowUp: "jump",
    p: "pause",
    P: "pause",
    r: "restart",
    R: "restart",
  };

  window.addEventListener("keydown", (e) => {
    const k = keymap[e.key];
    if (!k) return;
    if (k === "pause") {
      togglePause();
      return;
    }
    if (k === "restart") {
      restart();
      return;
    }
    if (k === "jump") {
      keys.jump = true;
      player.jumpBuffer = JUMP_BUFFER;
    } else {
      keys[k] = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    const k = keymap[e.key];
    if (!k) return;
    if (k === "jump") keys.jump = false;
    else keys[k] = false;
  });

  // Buttons
  document.getElementById("btnPause").addEventListener("click", togglePause);
  document.getElementById("btnRestart").addEventListener("click", restart);

  // Touch controls
  const leftBtn = document.getElementById("left");
  const rightBtn = document.getElementById("right");
  const jumpBtn = document.getElementById("jump");
  const bindTouch = (el, setter) => {
    const on = () => setter(true);
    const off = () => setter(false);
    el.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        on();
      },
      { passive: false }
    );
    el.addEventListener("touchend", off);
    el.addEventListener("touchcancel", off);
    el.addEventListener("mousedown", on);
    el.addEventListener("mouseup", off);
    el.addEventListener("mouseleave", off);
  };
  bindTouch(leftBtn, (v) => (touchLeft = v));
  bindTouch(rightBtn, (v) => (touchRight = v));
  bindTouch(jumpBtn, (v) => {
    if (v) {
      touchJump = true;
      player.jumpBuffer = JUMP_BUFFER;
    } else touchJump = false;
  });

  function togglePause() {
    if (gameOver || won) return;
    paused = !paused;
    if (paused)
      showOverlay(
        "Paused",
        "Press <b>P</b> or click <b>Resume</b> to continue.",
        [{ text: "Resume", action: togglePause }]
      );
    else hideOverlay();
  }

  function restart() {
    // reset player and state
    Object.assign(player, {
      x: playerStart.x,
      y: playerStart.y,
      vx: 0,
      vy: 0,
      onGround: false,
      coyote: 0,
      jumpBuffer: 0,
      facing: 1,
      invuln: 0,
    });
    coins.forEach((c) => (c.got = false));
    coinsCollected = 0;
    enemies.forEach((e) => {
      e.x = e.minX;
      e.dir = 1;
    });
    elapsed = 0;
    gameOver = false;
    won = false;
    paused = false;
    hideOverlay();
    updateHUD();
  }

  // ---------- Physics & Collisions ----------
  function applyMovement(dt) {
    const left = keys.left || touchLeft;
    const right = keys.right || touchRight;
    const want = (right ? 1 : 0) - (left ? 1 : 0);
    if (want) player.facing = want;

    const accel = player.onGround ? GROUND_ACCEL : AIR_ACCEL;
    player.vx += want * accel * dt;

    // Friction when no input and grounded
    if (!want && player.onGround) {
      const f = FRICTION * dt * sign(player.vx);
      if (Math.abs(f) > Math.abs(player.vx)) player.vx = 0;
      else player.vx -= f;
    }

    // Clamp horizontal speed
    player.vx = clamp(player.vx, -MOVE_SPEED, MOVE_SPEED);

    // Gravity
    player.vy += GRAVITY * dt;
    player.vy = Math.min(player.vy, MAX_FALL);

    // Coyote time & jump buffer timers
    player.coyote = Math.max(0, player.coyote - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    // Jump
    const jumpPressed = keys.jump || touchJump;
    if (player.jumpBuffer > 0 && (player.onGround || player.coyote > 0)) {
      player.vy = -JUMP_VELOCITY;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
    }

    // Integrate X with horizontal collisions
    let nextX = player.x + player.vx * dt;
    const bboxX = { x: nextX, y: player.y, w: player.w, h: player.h };
    const collX = collideWithPlatforms(bboxX);
    if (collX) {
      if (player.vx > 0) nextX = collX.x - player.w;
      else if (player.vx < 0) nextX = collX.x + collX.w;
      player.vx = 0;
    }
    player.x = clamp(nextX, 0, world.w - player.w);

    // Integrate Y with vertical collisions
    let nextY = player.y + player.vy * dt;
    const bboxY = { x: player.x, y: nextY, w: player.w, h: player.h };
    const collY = collideWithPlatforms(bboxY);
    const wasGrounded = player.onGround;
    player.onGround = false;

    if (collY) {
      if (player.vy > 0) {
        // landed on top
        nextY = collY.y - player.h;
        player.onGround = true;
        player.coyote = COYOTE_TIME;
      } else if (player.vy < 0) {
        // bumped head
        nextY = collY.y + collY.h;
      }
      player.vy = 0;
    } else if (wasGrounded) {
      // just walked off ledge
      player.coyote = COYOTE_TIME;
    }
    player.y = clamp(nextY, 0, world.h - player.h);

    // Coins
    for (const c of coins) {
      if (!c.got) {
        const dx = player.x + player.w / 2 - c.x;
        const dy = player.y + player.h / 2 - c.y;
        if (dx * dx + dy * dy <= (c.r + 10) * (c.r + 10)) {
          c.got = true;
          coinsCollected++;
          updateHUD();
        }
      }
    }

    // Spikes & enemy damage
    let hit =
      spikes.some((s) =>
        rectsOverlap({ x: player.x, y: player.y, w: player.w, h: player.h }, s)
      ) ||
      enemies.some((en) =>
        rectsOverlap({ x: player.x, y: player.y, w: player.w, h: player.h }, en)
      );
    if (hit && player.invuln <= 0) {
      hurt();
    }

    // Goal
    if (rectsOverlap(player, goal) && coinsCollected === coins.length) {
      win();
    }
  }

  function collideWithPlatforms(box) {
    for (const p of platforms) {
      if (rectsOverlap(box, p)) return p;
    }
    return null;
  }

  function hurt() {
    player.lives--;
    player.invuln = 1.2; // seconds
    if (player.lives <= 0) {
      end("Game Over", "You ran out of lives. Press <b>R</b> to restart.");
      gameOver = true;
      return;
    }
    // knockback + reset to a safe spot
    player.vx = -player.facing * 260;
    player.vy = -420;
    Object.assign(player, { x: playerStart.x, y: playerStart.y });
    updateHUD();
  }

  function win() {
    won = true;
    end(
      "You win! 🎉",
      `Collected all coins in <b>${elapsed.toFixed(
        1
      )}s</b>. Press <b>R</b> to play again.`
    );
  }

  function end(title, msg) {
    showOverlay(title, msg, [{ text: "Restart", action: restart }]);
  }

  function updateHUD() {
    elCoins.textContent = coinsCollected.toString();
    elLives.textContent = player.lives.toString();
  }

  // ---------- Enemy logic ----------
  function updateEnemies(dt) {
    for (const e of enemies) {
      e.x += e.dir * e.speed * dt;
      if (e.x < e.minX) {
        e.x = e.minX;
        e.dir = 1;
      }
      if (e.x + e.w > e.maxX) {
        e.x = e.maxX - e.w;
        e.dir = -1;
      }
    }
  }

  // ---------- Camera ----------
  function updateCamera() {
    const targetX = clamp(player.x + player.w / 2 - W / 2, 0, world.w - W);
    const targetY = clamp(
      player.y + player.h / 2 - H / 2,
      0,
      Math.max(0, world.h - H)
    );
    camera.x += (targetX - camera.x) * camera.lerp;
    camera.y += (targetY - camera.y) * camera.lerp;
  }

  // ---------- Drawing ----------
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Parallax background stars
    ctx.save();
    ctx.fillStyle = "#0b1021";
    ctx.fillRect(0, 0, W, H);
    ctx.translate(-camera.x * 0.3, 0);
    for (const s of world.bgStars) {
      ctx.globalAlpha =
        0.5 + 0.5 * Math.sin((performance.now() / 1000) * (0.5 + s.tw));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "#9ec5ff";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // World layer
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Platforms
    for (const p of platforms) {
      drawRoundedRect(p.x, p.y, p.w, p.h, 6, "#1e263a", "#2a3555");
    }

    // Spikes
    for (const s of spikes) {
      drawSpikes(s.x, s.y, s.w, s.h);
    }

    // Coins
    for (const c of coins) {
      if (c.got) continue;
      drawCoin(c.x, c.y, c.r);
    }

    // Enemy
    for (const e of enemies) {
      drawEnemy(e);
    }

    // Goal flag
    drawFlag(goal.x, goal.y, goal.w, goal.h);

    // Player
    drawPlayer();

    ctx.restore();

    // Edge fade (vignette)
    const grd = ctx.createRadialGradient(
      W / 2,
      H / 2,
      H / 3,
      W / 2,
      H / 2,
      H / 1.1
    );
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Timer
    elTime.textContent = elapsed.toFixed(1);
  }

  function drawRoundedRect(x, y, w, h, r, stroke, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  function drawSpikes(x, y, w, h) {
    const n = Math.max(3, Math.floor(w / 20));
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const sx = x + (i * w) / n;
      ctx.moveTo(sx, y + h);
      ctx.lineTo(sx + w / (2 * n), y);
      ctx.lineTo(sx + w / n, y + h);
    }
    ctx.closePath();
    ctx.fillStyle = "#8b1e2d";
    ctx.fill();
    ctx.strokeStyle = "#d35a74";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawCoin(x, y, r) {
    const g = ctx.createRadialGradient(x - r / 2, y - r / 2, r / 3, x, y, r);
    g.addColorStop(0, "#fff1a8");
    g.addColorStop(1, "#d4b200");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#8c6e00";
    ctx.stroke();
  }

  function drawEnemy(e) {
    drawRoundedRect(e.x, e.y, e.w, e.h, 6, "#6b1221", "#b91c1c");
    // eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(e.x + 6, e.y + 10, 4, 6);
    ctx.fillRect(e.x + e.w - 10, e.y + 10, 4, 6);
  }

  function drawFlag(x, y, w, h) {
    // pole
    ctx.fillStyle = "#a0aec0";
    ctx.fillRect(x, y, 6, h);
    // flag
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 20);
    ctx.quadraticCurveTo(x + 60, y + 10, x + 70, y + 30);
    ctx.quadraticCurveTo(x + 60, y + 50, x + 6, y + 40);
    ctx.closePath();
    ctx.fillStyle = "#34d399";
    ctx.fill();
  }

  function drawPlayer() {
    const blink =
      player.invuln > 0 && Math.floor(performance.now() / 120) % 2 === 0;
    if (blink) return;

    const x = player.x,
      y = player.y,
      w = player.w,
      h = player.h;

    drawRoundedRect(x, y, w, h, 6, "#1f6feb", "#3b82f6");
    // face
    ctx.fillStyle = "#0b1021";
    ctx.fillRect(x + 8, y + 14, 4, 6);
    ctx.fillRect(x + w - 12, y + 14, 4, 6);
    // mouth
    ctx.fillRect(x + 9, y + 26, w - 18, 3);
    // direction indicator
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(x + (player.facing > 0 ? w - 4 : 0), y + 6, 4, h - 12);
  }

  // ---------- Overlay ----------
  function showOverlay(title, htmlMsg, actions = []) {
    overlay.innerHTML = `
        <div class="card">
          <h2 style="margin:.2rem 0 0.6rem;">${title}</h2>
          <p style="color:#cbd5e1;margin:.2rem 0 .8rem;">${htmlMsg}</p>
          <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;">
            ${actions
              .map((a) => `<button class="ovbtn">${a.text}</button>`)
              .join("")}
          </div>
        </div>
      `;
    overlay.classList.remove("hidden");
    const btns = overlay.querySelectorAll(".ovbtn");
    btns.forEach((b, i) => b.addEventListener("click", actions[i].action));
  }
  function hideOverlay() {
    overlay.classList.add("hidden");
    overlay.innerHTML = "";
  }

  // ---------- Main Loop ----------
  function step(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;

    // fixed timestep for stable physics
    const FIXED = 1 / 120;
    tAccum += dt;

    if (!paused && !gameOver && !won) {
      while (tAccum >= FIXED) {
        const usedJump = player.jumpBuffer > 0;
        applyMovement(FIXED);
        updateEnemies(FIXED);
        updateCamera();
        if (player.invuln > 0)
          player.invuln = Math.max(0, player.invuln - FIXED);
        elapsed += FIXED;
        tAccum -= FIXED;
      }
    }

    draw();
    requestAnimationFrame(step);
  }

  // Resize canvas to fixed internal res
  function setupCanvas() {
    canvas.width = W;
    canvas.height = H;
  }

  setupCanvas();
  updateHUD();
  showOverlay(
    "Collect all coins!",
    "Reach the flag after collecting <b>all</b> coins. Avoid spikes and enemies. Good luck!",
    [
      {
        text: "Start",
        action: () => {
          hideOverlay();
          paused = false;
        },
      },
    ]
  );
  paused = true;
  requestAnimationFrame(step);
})();
