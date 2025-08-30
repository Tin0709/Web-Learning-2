// --- Config ---
const EMOJIS = ["🍎", "🍌", "🍒", "🍇", "🍉", "🍊", "🥝", "🍓"]; // 8 pairs = 16 cards (4x4)
const FLIP_DELAY = 800; // ms before hiding mismatched cards
// --- Elements ---
const grid = document.getElementById("grid");
const timeEl = document.getElementById("time");
const movesEl = document.getElementById("moves");
const resetBtn = document.getElementById("reset");
const winModal = document.getElementById("win");
const finalTimeEl = document.getElementById("final-time");
const finalMovesEl = document.getElementById("final-moves");
const playAgainBtn = document.getElementById("play-again");

// --- Helpers ---
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function startTimer() {
  startTime = Date.now();
  timerId = setInterval(() => {
    timeEl.textContent = formatTime(Date.now() - startTime);
  }, 250);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}
