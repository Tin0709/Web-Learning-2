(() => {
  // DOM refs
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMessage = document.getElementById("overlayMessage");
  const btnStart = document.getElementById("btnStart");
  const btnResume = document.getElementById("btnResume");
  const btnRestart = document.getElementById("btnRestart");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("highScore");
  const speedSelect = document.getElementById("speedSelect");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");
  const soundToggle = document.getElementById("soundToggle");
  const themeToggle = document.getElementById("themeToggle");

  // Touch controls
  document.querySelectorAll(".pad").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.dir;
      queueDirection(dir);
    });
  });

  // Theme
  const THEME_KEY = "snake.theme";
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  if (savedTheme === "light") document.documentElement.classList.add("light");
  updateThemeBtn();
  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    localStorage.setItem(
      THEME_KEY,
      document.documentElement.classList.contains("light") ? "light" : "dark"
    );
    updateThemeBtn();
  });
  function updateThemeBtn() {
    const light = document.documentElement.classList.contains("light");
    themeToggle.setAttribute("aria-pressed", light ? "true" : "false");
    themeToggle.querySelector(".icon").textContent = light ? "🌞" : "🌙";
  }

  // Sound via WebAudio
  const SOUND_KEY = "snake.sound";
  let soundOn = (localStorage.getItem(SOUND_KEY) ?? "true") === "true";
  updateSoundBtn();
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    localStorage.setItem(SOUND_KEY, soundOn ? "true" : "false");
    updateSoundBtn();
  });
  function updateSoundBtn() {
    soundToggle.setAttribute("aria-pressed", soundOn ? "true" : "false");
    soundToggle.querySelector(".icon").textContent = soundOn ? "🔊" : "🔇";
  }
  let audioCtx;
  function beep(freq = 440, dur = 0.06, type = "square", vol = 0.02) {
    if (!soundOn) return;
    try {
      audioCtx =
        audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g).connect(audioCtx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
      }, dur * 1000);
    } catch (e) {
      /* ignore audio errors */
    }
  }

  // Game constants
  const GRID = 21; // 21x21 grid
  const INITIAL_LEN = 3;
  const appleColor = "#ef4444";
  const snakeColor = "#6ee7b7";
  const headColor = "#34d399";
  const boardColor = "transparent";

  // Game state
  let state = "start"; // start | running | paused | over
  let snake, dir, dirQueue, apple, score, highScore, stepPerSec, lastTime, acc;
  highScore = Number(localStorage.getItem("snake.highscore") || 0);
  highScoreEl.textContent = highScore;

  function initGame() {
    const cx = Math.floor(GRID / 2);
    snake = [];
    for (let i = 0; i < INITIAL_LEN; i++) {
      snake.push({ x: cx - i, y: cx });
    }
    dir = { x: 1, y: 0 };
    dirQueue = [];
    apple = spawnApple();
    score = 0;
    scoreEl.textContent = "0";
    stepPerSec = Number(speedSelect.value);
    lastTime = 0;
    acc = 0;
  }

  function spawnApple() {
    while (true) {
      const x = (Math.random() * GRID) | 0;
      const y = (Math.random() * GRID) | 0;
      if (!snake || !snake.some((s) => s.x === x && s.y === y)) {
        return { x, y };
      }
    }
  }

  function queueDirection(d) {
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const next = map[d];
    if (!next) return;
    // Prevent reversing directly into self: check current or queued last
    const last = dirQueue[dirQueue.length - 1] || dir;
    if (last.x + next.x === 0 && last.y + next.y === 0) return;
    dirQueue.push(next);
  }

  // Input: keyboard
  window.addEventListener(
    "keydown",
    (e) => {
      switch (e.key) {
        case "ArrowUp":
          queueDirection("up");
          e.preventDefault();
          break;
        case "ArrowDown":
          queueDirection("down");
          e.preventDefault();
          break;
        case "ArrowLeft":
          queueDirection("left");
          e.preventDefault();
          break;
        case "ArrowRight":
          queueDirection("right");
          e.preventDefault();
          break;
        case " ":
          togglePause();
          e.preventDefault();
          break;
        case "Enter":
          if (state === "start" || state === "over") {
            startGame();
          } else if (state === "paused") {
            resumeGame();
          }
          break;
        case "p":
        case "P":
          togglePause();
          break;
      }
    },
    { passive: false }
  );

  // Swipe controls on canvas
  let touchStart = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      if (Math.hypot(dx, dy) < 24) return; // ignore tiny swipes
      if (Math.abs(dx) > Math.abs(dy)) {
        queueDirection(dx > 0 ? "right" : "left");
      } else {
        queueDirection(dy > 0 ? "down" : "up");
      }
      touchStart = null;
    },
    { passive: true }
  );

  // Buttons
  btnStart.addEventListener("click", startGame);
  btnResume.addEventListener("click", resumeGame);
  btnRestart.addEventListener("click", () => {
    startGame(true);
  });
  pauseBtn.addEventListener("click", togglePause);
  restartBtn.addEventListener("click", () => {
    startGame(true);
  });
  speedSelect.addEventListener("change", () => {
    stepPerSec = Number(speedSelect.value);
  });

  function startGame(forceRestart = false) {
    initGame();
    overlay.classList.add("hidden");
    btnResume.classList.add("hidden");
    btnRestart.classList.add("hidden");
    btnStart.classList.add("hidden");
    state = "running";
    beep(660, 0.08, "square", 0.03);
    // align canvas resolution to CSS size for crispness
    fitCanvas();
    requestAnimationFrame(loop);
  }
  function resumeGame() {
    if (state !== "paused") return;
    state = "running";
    overlay.classList.add("hidden");
    beep(520, 0.06);
    requestAnimationFrame(loop);
  }
  function togglePause() {
    if (state === "running") {
      state = "paused";
      showOverlay("Paused", "Take a breather.");
      btnResume.classList.remove("hidden");
      btnRestart.classList.remove("hidden");
      btnStart.classList.add("hidden");
      beep(320, 0.05, "sine", 0.02);
    } else if (state === "paused") {
      resumeGame();
    }
  }

  function gameOver() {
    state = "over";
    document.querySelector(".stage-card").classList.add("flash");
    setTimeout(
      () => document.querySelector(".stage-card").classList.remove("flash"),
      700
    );
    beep(180, 0.12, "sawtooth", 0.03);
    beep(120, 0.18, "sawtooth", 0.03);
    // high score
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snake.highscore", String(highScore));
      highScoreEl.textContent = highScore;
    }
    showOverlay("Game Over", `Score: <strong>${score}</strong>`);
    btnRestart.classList.remove("hidden");
    btnResume.classList.add("hidden");
    btnStart.classList.remove("hidden");
  }

  function showOverlay(title, msg) {
    overlayTitle.textContent = title;
    overlayMessage.innerHTML = msg;
    overlay.classList.remove("hidden");
  }

  function loop(timestamp) {
    if (state !== "running") return;
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    acc += dt;
    const step = 1 / stepPerSec;
    while (acc >= step) {
      stepLogic();
      acc -= step;
    }
    draw();
    requestAnimationFrame(loop);
  }

  function stepLogic() {
    // consume queued direction
    if (dirQueue.length) {
      dir = dirQueue.shift();
    }
    let head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // --- wrap around walls ---
    if (head.x < 0) head.x = GRID - 1;
    if (head.y < 0) head.y = GRID - 1;
    if (head.x >= GRID) head.x = 0;
    if (head.y >= GRID) head.y = 0;

    // collide self?
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      return gameOver();
    }
    snake.unshift(head);

    // apple?
    if (head.x === apple.x && head.y === apple.y) {
      score += 10;
      scoreEl.textContent = score;
      beep(880, 0.07, "triangle", 0.03);
      apple = spawnApple();
    } else {
      snake.pop();
    }
  }

  // Visuals
  function fitCanvas() {
    // Match canvas pixel size to CSS size for crisp rendering
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", fitCanvas);

  function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sizes
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const cell = Math.min(w, h) / GRID;
    const pad = (w - cell * GRID) / 2; // center if not square

    // Board
    ctx.fillStyle = boardColor;
    ctx.fillRect(0, 0, w, h);

    // Apple (with subtle shadow)
    drawRoundedCell(apple.x, apple.y, cell, pad, "#00000022");
    drawRoundedCell(apple.x, apple.y, cell, pad, appleColor);

    // Snake
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      // tail gradient by index
      const t = i / Math.max(1, snake.length - 1);
      const col =
        i === 0 ? headColor : mixColor(snakeColor, "#0ea5e9", t * 0.25);
      drawRoundedCell(seg.x, seg.y, cell, pad, col);
    }
  }

  function drawRoundedCell(gx, gy, cell, pad, color) {
    const x = pad + gx * cell;
    const y = pad + gy * cell;
    const r = Math.max(4, cell * 0.25);
    ctx.fillStyle = color;
    roundRect(ctx, x + 1, y + 1, cell - 2, cell - 2, r);
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    const min = Math.min(w, h);
    if (r > min / 2) r = min / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function mixColor(c1, c2, t) {
    // tiny hex color lerp
    const a = hexToRgb(c1),
      b = hexToRgb(c2);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const b2 = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r}, ${g}, ${b2})`;
  }
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const bigint = parseInt(h, 16);
    if (h.length === 6) {
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    }
    // short 3-digit
    return {
      r: ((bigint >> 8) & 15) * 17,
      g: ((bigint >> 4) & 15) * 17,
      b: (bigint & 15) * 17,
    };
  }

  // Initial overlay
  showOverlay("Snake", "Eat apples, avoid your tail. (Walls wrap!)");
  btnStart.classList.remove("hidden");

  // Display high score initially
  highScoreEl.textContent = highScore;

  // Ensure canvas crispness on load
  fitCanvas();
})();
