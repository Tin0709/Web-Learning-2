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
