// --- Config ---
const EMOJIS = ["🍎", "🍌", "🍒", "🍇", "🍉", "🍊", "🥝", "🍓"]; // 8 pairs = 16 cards (4x4)
const FLIP_DELAY = 800; // ms before hiding mismatched cards

// --- State ---
let first, second, lock, matches, moves, startTime, timerId;

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

// --- Game Setup ---
function setup() {
  // Reset state
  first = second = null;
  lock = false;
  matches = 0;
  moves = 0;
  movesEl.textContent = "0";
  timeEl.textContent = "0:00";
  if (timerId) stopTimer();

  // Build deck and grid
  const deck = shuffle([...EMOJIS, ...EMOJIS]);
  grid.innerHTML = "";

  deck.forEach((emoji, index) => {
    const card = document.createElement("button");
    card.className = "card";
    card.setAttribute("aria-label", "Hidden card");
    card.setAttribute("data-emoji", emoji);
    card.setAttribute("data-index", index);

    card.innerHTML = `
      <div class="card-face card-front" aria-hidden="true">❓</div>
      <div class="card-face card-back">${emoji}</div>
    `;

    card.addEventListener("click", () => onFlip(card));
    grid.appendChild(card);
  });
}

function onFlip(card) {
  if (lock) return;
  if (
    card.classList.contains("is-flipped") ||
    card.classList.contains("is-matched")
  )
    return;

  // first flip starts timer
  if (!timerId) startTimer();

  card.classList.add("is-flipped");

  if (!first) {
    first = card;
    return;
  }

  // second pick
  second = card;
  moves++;
  movesEl.textContent = String(moves);

  const match = first.dataset.emoji === second.dataset.emoji;

  if (match) {
    first.classList.add("is-matched");
    second.classList.add("is-matched");
    first.setAttribute("aria-label", `Matched ${first.dataset.emoji}`);
    second.setAttribute("aria-label", `Matched ${second.dataset.emoji}`);
    first = second = null;
    matches++;

    if (matches === EMOJIS.length) {
      stopTimer();
      finalTimeEl.textContent = timeEl.textContent;
      finalMovesEl.textContent = String(moves);
      winModal.classList.add("show");
      winModal.setAttribute("aria-hidden", "false");
    }
  } else {
    lock = true;
    setTimeout(() => {
      first.classList.remove("is-flipped");
      second.classList.remove("is-flipped");
      first = second = null;
      lock = false;
    }, FLIP_DELAY);
  }
}

// --- Events ---
resetBtn.addEventListener("click", () => {
  winModal.classList.remove("show");
  winModal.setAttribute("aria-hidden", "true");
  setup();
});

playAgainBtn.addEventListener("click", () => {
  winModal.classList.remove("show");
  winModal.setAttribute("aria-hidden", "true");
  setup();
});

// Kick off
setup();
