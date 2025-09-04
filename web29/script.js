(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const boardEl = $("#board");
  const scoreEl = $("#score");
  const timeEl = $("#time");
  const highScoreEl = $("#highScore");
  const startBtn = $("#startBtn");
  const stopBtn = $("#stopBtn");
  const difficultySel = $("#difficulty");
  const liveEl = $("#live");

  const GRID_SIZE = 9;
  const GAME_SECONDS = 30;
  const LS_KEY = "wam_highscore_v1";

  const DIFFICULTY = {
    easy: { upMs: 900, gapMs: 240 },
    medium: { upMs: 700, gapMs: 180 },
    hard: { upMs: 520, gapMs: 140 },
  };

  let score = 0,
    timeLeft = GAME_SECONDS;
  let running = false;
  let timerInterval = null;
  let moleTimer = null;
  let currentHoleIndex = -1;
  let bonkLock = false;

  // --- Audio (simple WebAudio blip, no assets) ---
  const audioCtx = window.AudioContext ? new AudioContext() : null;
  function blip(freq = 520, duration = 0.07) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    o.connect(g).connect(audioCtx.destination);
    o.start(now);
    o.stop(now + duration);
  }

  // Build grid
  function initBoard() {
    boardEl.innerHTML = "";
    for (let i = 0; i < GRID_SIZE; i++) {
      const hole = document.createElement("button");
      hole.className = "hole";
      hole.type = "button";
      hole.setAttribute("aria-label", `Hole ${i + 1}`);
      hole.setAttribute("role", "gridcell");
      hole.dataset.index = i;

      // Mole visuals
      const mole = document.createElement("div");
      mole.className = "mole";
      const eyeL = document.createElement("div");
      const eyeR = document.createElement("div");
      const tooth = document.createElement("div");
      eyeL.className = "mole eye left";
      eyeR.className = "mole eye right";
      tooth.className = "mole tooth";
      hole.appendChild(mole);
      hole.appendChild(eyeL);
      hole.appendChild(eyeR);
      hole.appendChild(tooth);

      hole.addEventListener("click", () => whack(i));
      hole.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          whack(i);
        }
      });

      boardEl.appendChild(hole);
    }
  }

  function setRunningUI(state) {
    running = state;
    startBtn.disabled = state;
    stopBtn.disabled = !state;
    difficultySel.disabled = state;
    $$(".hole", boardEl).forEach((h) =>
      h.setAttribute("aria-disabled", state ? "false" : "true")
    );
  }

  function resetGame() {
    score = 0;
    timeLeft = GAME_SECONDS;
    scoreEl.textContent = score;
    timeEl.textContent = timeLeft;
    updateLive("Game reset. Press Start to play.");
    clearTimers();
    hideMole();
    bonkLock = false;
  }

  function startGame() {
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    if (running) return;
    resetGame();
    setRunningUI(true);
    countdown();
    nextMole();
  }

  function stopGame() {
    if (!running) return;
    setRunningUI(false);
    clearTimers();
    hideMole();
    updateHighScore();
    updateLive(`Game over. Final score ${score}.`);
  }

  function countdown() {
    timerInterval = setInterval(() => {
      timeLeft--;
      timeEl.textContent = timeLeft;
      if (timeLeft <= 0) {
        stopGame();
      }
    }, 1000);
  }

  function clearTimers() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (moleTimer) {
      clearTimeout(moleTimer);
      moleTimer = null;
    }
  }

  function hideMole() {
    if (currentHoleIndex >= 0) {
      const hole = $$("button.hole")[currentHoleIndex];
      hole.classList.remove("show");
      hole.classList.add("hide");
      setTimeout(() => hole.classList.remove("hide"), 220);
    }
    currentHoleIndex = -1;
    bonkLock = false;
  }

  function nextMole() {
    if (!running) return;
    const diff = DIFFICULTY[difficultySel.value] || DIFFICULTY.medium;
    // choose a hole different from last one
    let idx = Math.floor(Math.random() * GRID_SIZE);
    if (GRID_SIZE > 1) {
      while (idx === currentHoleIndex) {
        idx = Math.floor(Math.random() * GRID_SIZE);
      }
    }
    hideMole();
    const hole = $$("button.hole")[idx];
    hole.classList.add("show");
    currentHoleIndex = idx;
    bonkLock = false;

    // Schedule hide then next spawn
    moleTimer = setTimeout(() => {
      hideMole();
      moleTimer = setTimeout(nextMole, diff.gapMs);
    }, diff.upMs);
  }

  function whack(index) {
    if (!running) return;
    if (index !== currentHoleIndex) return; // clicked empty hole
    if (bonkLock) return; // already whacked this mole
    bonkLock = true;

    score++;
    scoreEl.textContent = score;
    updateLive(`Nice! Score ${score}.`);

    const hole = $$("button.hole")[index];
    hole.classList.add("whacked");
    setTimeout(() => hole.classList.remove("whacked"), 120);
    blip(560, 0.06);
  }

  function updateHighScore() {
    const prev = Number(localStorage.getItem(LS_KEY) || "0");
    const best = Math.max(prev, score);
    localStorage.setItem(LS_KEY, String(best));
    highScoreEl.textContent = String(best);
  }

  function loadHighScore() {
    const prev = Number(localStorage.getItem(LS_KEY) || "0");
    highScoreEl.textContent = String(prev);
  }

  function updateLive(msg) {
    liveEl.textContent = msg;
  }

  // Wire controls
  startBtn.addEventListener("click", startGame);
  stopBtn.addEventListener("click", stopGame);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopGame();
  });

  // Init
  initBoard();
  resetGame();
  loadHighScore();
  setRunningUI(false);
})();
