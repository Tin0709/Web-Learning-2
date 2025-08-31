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

// ===== Init =====
function loadBest() {
  const best = localStorage.getItem("bestWPM");
  bestEl.textContent = best ? best : "—";
}
loadBest();
renderNewTarget();

// ===== Mechanics =====
function pickText() {
  const list = TEXTS[catSel.value];
  const choice = list[Math.floor(Math.random() * list.length)];
  return choice.replace(/\s+/g, " ").trim();
}

function renderNewTarget() {
  target = pickText();
  index = 0;
  correctTyped = 0;
  totalTyped = 0;
  started = false;
  timeLeft = parseInt(durationSel.value, 10);

  // Render spans for each char
  textEl.innerHTML = "";
  for (let i = 0; i < target.length; i++) {
    const span = document.createElement("span");
    const ch = target[i];
    span.textContent = ch;
    if (ch === " ") span.classList.add("space");
    if (i === 0) span.classList.add("next");
    textEl.appendChild(span);
  }

  inputEl.value = "";
  inputEl.setAttribute("placeholder", "Press Start, then type here…");
  timeEl.textContent = `00:${pad(timeLeft)}`;
  updateHUD(0, 100);
}

function updateHUD(currWPM, accPercent) {
  wpmEl.textContent = Math.max(0, Math.floor(currWPM));
  accEl.textContent = `${Math.max(0, Math.min(100, Math.round(accPercent)))}%`;
}

function startCountdown() {
  if (timer) clearInterval(timer);
  timeLeft = parseInt(durationSel.value, 10);
  timeEl.textContent = `00:${pad(timeLeft)}`;
  timer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = `00:${pad(Math.max(0, timeLeft))}`;
    if (timeLeft <= 0) {
      finishTest();
    }
  }, 1000);
}

function calculateWPM() {
  const elapsed = parseInt(durationSel.value, 10) - timeLeft;
  const minutes = Math.max(1 / 60, elapsed / 60); // avoid div by zero; tiny floor
  // WPM uses 5-character "words" and counts only correct characters
  const wpm = correctTyped / 5 / minutes;
  const acc = totalTyped === 0 ? 100 : (correctTyped / totalTyped) * 100;
  updateHUD(wpm, acc);
}

function finishTest() {
  clearInterval(timer);
  timer = null;
  started = false;
  inputEl.disabled = true;
  startBtn.disabled = false;
  resetBtn.disabled = false;

  // Save best WPM
  const currentWPM = parseInt(wpmEl.textContent, 10) || 0;
  const prevBest = parseInt(localStorage.getItem("bestWPM") || "0", 10);
  if (currentWPM > prevBest) {
    localStorage.setItem("bestWPM", currentWPM);
    bestEl.textContent = currentWPM;
  }
}

function resetAll() {
  clearInterval(timer);
  timer = null;
  started = false;
  inputEl.disabled = true;
  startBtn.disabled = false;
  resetBtn.disabled = true;
  renderNewTarget();
}

// ===== Events =====
startBtn.addEventListener("click", () => {
  inputEl.disabled = false;
  inputEl.focus();
  inputEl.value = "";
  startBtn.disabled = true;
  resetBtn.disabled = false;
  renderNewTarget();
});

resetBtn.addEventListener("click", resetAll);

durationSel.addEventListener("change", () => {
  if (!started) {
    timeLeft = parseInt(durationSel.value, 10);
    timeEl.textContent = `00:${pad(timeLeft)}`;
  }
});

catSel.addEventListener("change", () => {
  if (!started) renderNewTarget();
});

// Main typing logic
inputEl.addEventListener("input", (e) => {
  if (!started) {
    started = true;
    startCountdown();
  }

  const value = e.target.value;
  const lastChar = value[value.length - 1];

  // User pressed backspace – allow corrections
  if (value.length < index) {
    // move cursor back by one, clear classes
    const spans = textEl.children;
    if (index > 0) {
      spans[index].classList.remove("next");
      index--;
    }
    spans[index].classList.remove("correct", "wrong");
    spans[index].classList.add("next");
    // do not change totals on backspace
    return;
  }

  // Ignore paste / multi-char jumps; handle one step at a time
  if (value.length > index + 1) {
    // normalize: keep only the latest character beyond our index
    e.target.value = value.slice(0, index).concat(value[value.length - 1]);
  }

  const spans = textEl.children;
  const expected = target[index];

  // count only real typed keys (not backspaces)
  if (typeof lastChar === "string") totalTyped++;

  if (lastChar === expected) {
    spans[index].classList.add("correct");
    correctTyped++;
  } else {
    spans[index].classList.add("wrong");
  }
  spans[index].classList.remove("next");
  index++;

  if (index < target.length) {
    spans[index].classList.add("next");
  } else {
    // Finished line: roll a new one immediately
    e.target.value = "";
    renderNewTarget();
    // keep timer running
    inputEl.disabled = false;
    inputEl.focus();
  }

  calculateWPM();
});

// quality-of-life: Esc clears current line (without affecting timer)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !inputEl.disabled) {
    inputEl.value = "";
    // reset coloring on current line
    const spans = textEl.children;
    for (let i = 0; i < spans.length; i++) {
      spans[i].classList.remove("correct", "wrong", "next");
    }
    index = 0;
    correctTyped = 0;
    totalTyped = 0;
    if (spans.length) spans[0].classList.add("next");
    updateHUD(0, 100);
  }
});
