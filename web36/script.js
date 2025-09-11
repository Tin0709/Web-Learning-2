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
