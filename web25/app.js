// ===== Utilities =====
const $ = (id) => document.getElementById(id);
const pad = (n) => (n < 10 ? "0" + n : "" + n);

// Sample text pools
const TEXTS = {
  quotes: [
    "Simplicity is the soul of efficiency.",
    "First, solve the problem. Then, write the code.",
    "Make it work, make it right, make it fast.",
    "Programs must be written for people to read.",
    "Premature optimization is the root of all evil.",
    "Talk is cheap. Show me the code.",
    "The only way to learn a new programming language is by writing programs in it.",
  ],
  tech: [
    "JavaScript runs on a single thread with an event loop.",
    "HTTP is stateless but we build stateful apps on top of it.",
    "Caching is a hard problem; invalidation is harder.",
    "A good API is small, predictable, and boring.",
    "Accessibility is a feature, not an afterthought.",
  ],
  short: [
    "time line rock blue note mint star kind ball wave ship code",
    "fast calm vivid plain sharp brave clean quick tiny bright",
    "type test pace focus hands keys speed light move clear",
  ],
};
// ===== State =====
let target = "";
let index = 0;
let started = false;
let timer = null;
let timeLeft = 30;

let totalTyped = 0; // all keystrokes (excluding backspaces)
let correctTyped = 0; // correct characters typed

// ===== Elements =====
const wpmEl = $("wpm");
const accEl = $("accuracy");
const timeEl = $("time");
const bestEl = $("best");
const textEl = $("text");
const inputEl = $("input");
const startBtn = $("startBtn");
const resetBtn = $("resetBtn");
const durationSel = $("duration");
const catSel = $("category");
