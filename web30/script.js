// ----- Utilities -----
const MOVES = ["rock", "paper", "scissors"];
const ICON = { rock: "🪨", paper: "📄", scissors: "✂️" };
const WIN_MAP = { rock: "scissors", paper: "rock", scissors: "paper" }; // key beats value

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let playerScore = 0;
let cpuScore = 0;
let lastPlayerMove = null;
const WIN_LIMIT = 5;

// Audio (tiny placeholders in HTML; replace with your own for nicer sounds)
const AudioBank = {
  win: $("#sfxWin"),
  lose: $("#sfxLose"),
  draw: $("#sfxDraw"),
  enabled: false,
};

function playSfx(kind) {
  if (!AudioBank.enabled) return;
  const a = AudioBank[kind];
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {
    /* autoplay might be blocked; ignore */
  });
}
// ----- DOM refs -----
const playerScoreEl = $("#playerScore");
const cpuScoreEl = $("#cpuScore");
const playerPickEl = $("#playerPick");
const cpuPickEl = $("#cpuPick");
const resultEl = $("#roundResult");
const resetBtn = $("#resetBtn");
const soundToggle = $("#soundToggle");

// ----- Core game logic -----
function cpuMove() {
  // Add a *slightly* anti-repeat bias for fun
  const roll = Math.random();
  if (lastPlayerMove && roll < 0.2) {
    // 20% of time: try to counter the player's last move
    const counters = { rock: "paper", paper: "scissors", scissors: "rock" };
    return counters[lastPlayerMove];
  }
  return MOVES[Math.floor(Math.random() * 3)];
}

function round(player) {
  const cpu = cpuMove();
  lastPlayerMove = player;

  // Update icons
  playerPickEl.textContent = ICON[player];
  cpuPickEl.textContent = ICON[cpu];

  // Visual bump
  playerPickEl.classList.remove("bump", "shake", "flash");
  cpuPickEl.classList.remove("bump", "shake", "flash");
  void playerPickEl.offsetWidth; // reflow to restart animations
  playerPickEl.classList.add("bump", "flash");
  cpuPickEl.classList.add("bump", "flash");

  let outcomeClass = "draw";
  let msg = "It's a draw!";
  if (player === cpu) {
    playSfx("draw");
  } else if (WIN_MAP[player] === cpu) {
    outcomeClass = "win";
    msg = "You win this round!";
    playerScore++;
    playSfx("win");
  } else {
    outcomeClass = "lose";
    msg = "You lose this round!";
    cpuScore++;
    playSfx("lose");
  }

  // Update UI
  resultEl.className = `round-result ${outcomeClass}`;
  resultEl.textContent = `${msg} (${capitalize(player)} vs ${capitalize(cpu)})`;
  playerScoreEl.textContent = playerScore;
  cpuScoreEl.textContent = cpuScore;

  // Fun jiggle if you lose a round
  if (outcomeClass === "lose") playerPickEl.classList.add("shake");

  // Check game over
  if (playerScore >= WIN_LIMIT || cpuScore >= WIN_LIMIT) {
    endGame();
  }
}
