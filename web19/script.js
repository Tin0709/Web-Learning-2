// --- Data ----------------------------------------------------------
const QUESTION_BANK = [
  {
    q: "Which language runs in a web browser?",
    choices: ["Java", "C", "Python", "JavaScript"],
    answer: 3,
  },
  {
    q: "What does CSS stand for?",
    choices: [
      "Colorful Style Sheets",
      "Cascading Style Sheets",
      "Computer Style Sheets",
      "Creative Styling System",
    ],
    answer: 1,
  },
  {
    q: "Which HTML tag is used to define an unordered list?",
    choices: ["<ol>", "<ul>", "<li>", "<list>"],
    answer: 1,
  },
  {
    q: "What year was ECMAScript 6 (ES2015) released?",
    choices: ["2013", "2015", "2017", "2019"],
    answer: 1,
  },
  {
    q: "Which array method creates a new array with elements that pass a test?",
    choices: ["map()", "reduce()", "filter()", "forEach()"],
    answer: 2,
  },
  {
    q: "Which HTTP status code means ‘Not Found’?",
    choices: ["200", "301", "404", "500"],
    answer: 2,
  },
  {
    q: "What does HTML stand for?",
    choices: [
      "Hyperlinks and Text Markup Language",
      "Home Tool Markup Language",
      "HyperText Markup Language",
      "Hyper Transfer Markup Language",
    ],
    answer: 2,
  },
  {
    q: "const x = { a: 1 }; What is typeof x?",
    choices: ["'array'", "'object'", "'map'", "'struct'"],
    answer: 1,
  },
  {
    q: "Which CSS property controls the text size?",
    choices: ["text-style", "font-style", "text-size", "font-size"],
    answer: 3,
  },
  {
    q: "Which company developed the React library?",
    choices: ["Google", "Facebook (Meta)", "Microsoft", "Twitter"],
    answer: 1,
  },
  // add more here...
];
// --- State ---------------------------------------------------------
let settings = {
  total: 10,
  timePerQuestion: 15,
};
let game = null;
let timerId = null;

// --- Utils ---------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const shuffle = (arr) =>
  arr
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map((v) => v[1]);

function formatSeconds(s) {
  return `${Math.max(0, Math.round(s))}s`;
}
// --- Persistence ---------------------------------------------------
const STORAGE_KEYS = {
  HIGH: "quickquiz_highscore",
  LAST: "quickquiz_lastscore",
  THEME: "quickquiz_theme",
};

function getHighScore() {
  return Number(localStorage.getItem(STORAGE_KEYS.HIGH) || 0);
}
function setHighScore(v) {
  localStorage.setItem(STORAGE_KEYS.HIGH, String(v));
}
function setLastScore(v) {
  localStorage.setItem(STORAGE_KEYS.LAST, String(v));
}
function getLastScore() {
  const v = localStorage.getItem(STORAGE_KEYS.LAST);
  return v === null ? null : Number(v);
}
function applyStoredTheme() {
  const t = localStorage.getItem(STORAGE_KEYS.THEME);
  if (t === "light") document.body.classList.add("light");
}
