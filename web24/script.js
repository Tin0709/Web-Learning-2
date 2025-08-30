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
