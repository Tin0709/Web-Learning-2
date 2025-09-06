() => {
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
};
