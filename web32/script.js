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
})();
