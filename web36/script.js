// ============ Configuration ============
const EMOJI_SET = [
  "🍎",
  "🍌",
  "🍇",
  "🍓",
  "🍒",
  "🍉",
  "🥝",
  "🍍",
  "🍔",
  "🍕",
  "🌮",
  "🍣",
  "🍪",
  "🧁",
  "🍩",
  "🍿",
  "⚽",
  "🏀",
  "🎾",
  "🏈",
  "🥏",
  "🏓",
  "🎲",
  "🎮",
  "🐶",
  "🐱",
  "🦊",
  "🐼",
  "🐵",
  "🦉",
  "🦄",
  "🐙",
  "🚗",
  "🚲",
  "✈️",
  "🚀",
  "🛸",
  "🚁",
  "🚂",
  "🛶",
  "🌞",
  "🌛",
  "⭐",
  "🌈",
  "❄️",
  "🔥",
  "🌊",
  "☂️",
];

const selectors = {
  board: document.getElementById("board"),
  moves: document.getElementById("moves"),
  time: document.getElementById("time"),
  best: document.getElementById("best"),
  newGame: document.getElementById("newGame"),
  restart: document.getElementById("restart"),
  size: document.getElementById("size"),
  cardTpl: document.getElementById("card-template"),
};

// ============ State ============
let gridSize = parseInt(selectors.size.value, 10); // 4 or 6
let lockBoard = false;
let firstCard = null;
let secondCard = null;
let moves = 0;
let matches = 0;
let totalPairs = 0;
let timerId = null;
let seconds = 0;

// ============ Helpers ============
const pad = (n) => String(n).padStart(2, "0");

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad(m)}:${pad(s)}`;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function pickEmojis(count) {
  const uniques = shuffle([...EMOJI_SET]).slice(0, count);
  return shuffle([...uniques, ...uniques]); // pair them and shuffle again
}

function updateStats() {
  selectors.moves.textContent = moves;
  selectors.time.textContent = formatTime(seconds);
  const key = `best-${gridSize}`;
  const best = JSON.parse(localStorage.getItem(key) || "null");
  if (best) {
    selectors.best.textContent = `${best.moves} moves · ${formatTime(
      best.time
    )}`;
  } else {
    selectors.best.textContent = "—";
  }
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    seconds++;
    selectors.time.textContent = formatTime(seconds);
  }, 1000);
}
function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function announceWin() {
  stopTimer();
  const key = `best-${gridSize}`;
  const best = JSON.parse(localStorage.getItem(key) || "null");
  if (
    !best ||
    moves < best.moves ||
    (moves === best.moves && seconds < best.time)
  ) {
    localStorage.setItem(key, JSON.stringify({ moves, time: seconds }));
  }
  updateStats();

  // Banner
  const banner = document.createElement("div");
  banner.className = "win-banner";
  banner.innerHTML = `
      <div class="win-card" role="dialog" aria-modal="true" aria-labelledby="win-title">
        <h2 id="win-title">🎉 You Win!</h2>
        <p>Grid: <strong>${gridSize} × ${gridSize}</strong></p>
        <p>Time: <strong>${formatTime(
          seconds
        )}</strong> · Moves: <strong>${moves}</strong></p>
        <p>Best for this grid: <strong>${
          selectors.best.textContent
        }</strong></p>
        <button class="btn" id="playAgain">Play Again</button>
      </div>
    `;
  document.body.appendChild(banner);
  document.getElementById("playAgain").focus();
  document.getElementById("playAgain").addEventListener("click", () => {
    banner.remove();
    newGame();
  });
  banner.addEventListener(
    "click",
    (e) => {
      if (e.target === banner) banner.remove();
    },
    { once: true }
  );
}

// ============ Board / Cards ============
function createCard(emoji, idx) {
  const node = selectors.cardTpl.content.firstElementChild.cloneNode(true);
  const back = node.querySelector(".card__back");
  back.textContent = emoji;

  node.dataset.value = emoji;
  node.dataset.index = idx;

  // Accessibility: allow keyboard flipping
  node.addEventListener("click", () => flipCard(node));
  node.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      node.click();
    }
    // Simple arrow navigation
    const columns = gridSize;
    const index = parseInt(node.dataset.index, 10);
    let nextIndex = null;
    if (e.key === "ArrowRight") nextIndex = index + 1;
    if (e.key === "ArrowLeft") nextIndex = index - 1;
    if (e.key === "ArrowDown") nextIndex = index + columns;
    if (e.key === "ArrowUp") nextIndex = index - columns;
    if (nextIndex !== null) {
      const next = selectors.board.querySelector(
        `.card[data-index="${nextIndex}"]`
      );
      if (next) next.focus();
    }
  });

  return node;
}

function renderBoard() {
  selectors.board.innerHTML = "";
  selectors.board.classList.toggle("grid-4", gridSize === 4);
  selectors.board.classList.toggle("grid-6", gridSize === 6);

  const pairCount = (gridSize * gridSize) / 2;
  totalPairs = pairCount;
  const deck = pickEmojis(pairCount);

  deck.forEach((emoji, i) => {
    const card = createCard(emoji, i);
    selectors.board.appendChild(card);
  });
}

function resetState() {
  lockBoard = false;
  firstCard = null;
  secondCard = null;
  moves = 0;
  matches = 0;
  seconds = 0;
  updateStats();
}

function restart() {
  // keep the same deck order, just flip back all cards & reset counters
  [...selectors.board.querySelectorAll(".card")].forEach((card) => {
    card.classList.remove("flipped", "matched");
    card.setAttribute("aria-pressed", "false");
  });
  resetState();
  startTimer();
}

function newGame() {
  resetState();
  renderBoard();
  startTimer();

  // brief peek animation for accessibility/fairness (optional)
  const cards = [...document.querySelectorAll(".card")];
  setTimeout(() => {
    cards.forEach((c) => c.classList.add("flipped"));
    setTimeout(() => cards.forEach((c) => c.classList.remove("flipped")), 900);
  }, 150);
}

function flipCard(card) {
  if (lockBoard) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched"))
    return;

  card.classList.add("flipped");
  card.setAttribute("aria-pressed", "true");

  if (!firstCard) {
    firstCard = card;
    return;
  }
  secondCard = card;
  moves++;
  selectors.moves.textContent = moves;

  checkMatch();
}

function checkMatch() {
  const isMatch = firstCard.dataset.value === secondCard.dataset.value;
  if (isMatch) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    firstCard.setAttribute("aria-label", `Matched ${firstCard.dataset.value}`);
    secondCard.setAttribute(
      "aria-label",
      `Matched ${secondCard.dataset.value}`
    );
    firstCard = null;
    secondCard = null;
    matches++;
    if (matches === totalPairs) {
      setTimeout(announceWin, 450);
    }
  } else {
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      firstCard.setAttribute("aria-pressed", "false");
      secondCard.setAttribute("aria-pressed", "false");
      firstCard = null;
      secondCard = null;
      lockBoard = false;
    }, 650);
  }
}

// ============ Events ============
selectors.newGame.addEventListener("click", () => {
  gridSize = parseInt(selectors.size.value, 10);
  newGame();
});

selectors.restart.addEventListener("click", () => restart());

selectors.size.addEventListener("change", () => {
  gridSize = parseInt(selectors.size.value, 10);
  newGame();
});

// Start immediately on first load
window.addEventListener("DOMContentLoaded", () => {
  newGame();
});
