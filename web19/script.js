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

// --- Screens -------------------------------------------------------
function show(screenId) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  $(screenId).classList.add("active");
}

// --- Game logic ----------------------------------------------------
function startGame() {
  const count = Math.min(settings.total, QUESTION_BANK.length);
  const pool = shuffle(QUESTION_BANK).slice(0, count);
  game = {
    questions: pool,
    index: 0,
    score: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    bestStreak: 0,
    answered: [],
    startTimes: [],
    elapsed: [],
  };
  $("#qTotal").textContent = pool.length;
  $("#score").textContent = "0";
  $("#streak").textContent = "0";
  $("#progressBar").style.width = "0%";
  show("#screen-quiz");
  renderQuestion();
}

function renderQuestion() {
  clearInterval(timerId);
  const qObj = game.questions[game.index];
  $("#qIndex").textContent = String(game.index + 1);
  $("#questionText").textContent = qObj.q;
  $("#questionText").focus();

  const choicesEl = $("#choices");
  choicesEl.innerHTML = "";
  qObj.choices.forEach((text, i) => {
    const li = document.createElement("li");
    li.className = "choice";
    li.tabIndex = 0;
    li.setAttribute("role", "option");
    li.setAttribute("data-idx", String(i));
    li.setAttribute("aria-selected", "false");
    li.innerHTML = `<span class="num">${
      i + 1
    }.</span> <span class="label">${text}</span>`;
    li.addEventListener("click", onChoice);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onChoice.call(li, e);
      }
    });
    choicesEl.appendChild(li);
  });

  $("#feedback").textContent = "";
  $("#btnNext").disabled = true;

  // timer
  let tLeft = settings.timePerQuestion;
  $("#timeLeft").textContent = tLeft;
  game.startTimes[game.index] = performance.now();

  timerId = setInterval(() => {
    tLeft -= 1;
    $("#timeLeft").textContent = tLeft;
    if (tLeft <= 0) {
      clearInterval(timerId);
      lockChoices();
      markAnswer(null); // timeout
    }
  }, 1000);
}

function lockChoices() {
  $("#choices")
    .querySelectorAll(".choice")
    .forEach((c) => {
      c.setAttribute("aria-disabled", "true");
      c.style.pointerEvents = "none";
    });
}

function onChoice(e) {
  if ($("#btnNext").disabled === false) return; // already answered
  const idx = Number(this.getAttribute("data-idx"));
  lockChoices();
  markAnswer(idx);
}

function markAnswer(selectedIdx) {
  const qObj = game.questions[game.index];
  const correctIdx = qObj.answer;
  const choicesEls = $("#choices").querySelectorAll(".choice");

  const elapsedMs = performance.now() - game.startTimes[game.index];
  const elapsedSec = Math.min(settings.timePerQuestion, elapsedMs / 1000);
  game.elapsed[game.index] = elapsedSec;

  choicesEls.forEach((el, i) => {
    if (i === correctIdx) el.classList.add("correct");
    if (selectedIdx !== null && i === selectedIdx && i !== correctIdx)
      el.classList.add("wrong");
    if (i === selectedIdx) el.setAttribute("aria-selected", "true");
  });

  let base = 100;
  let isCorrect = selectedIdx === correctIdx;
  if (selectedIdx === null) isCorrect = false; // timeout

  if (isCorrect) {
    // time bonus (0–50), streak bonus (0–50)
    const timeBonus = Math.round(
      ((settings.timePerQuestion - elapsedSec) / settings.timePerQuestion) * 50
    );
    game.streak += 1;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    const streakBonus = Math.min(50, (game.streak - 1) * 10);
    const pts = base + timeBonus + streakBonus;
    game.score += pts;
    game.correct += 1;
    $(
      "#feedback"
    ).textContent = `✅ Correct! +${pts} (time ${timeBonus}, streak ${streakBonus})`;
  } else {
    game.streak = 0;
    game.wrong += 1;
    $("#feedback").textContent =
      selectedIdx === null ? "⏰ Time's up!" : "❌ Not quite.";
  }

  $("#score").textContent = String(game.score);
  $("#streak").textContent = String(game.streak);
  $("#btnNext").disabled = false;

  const progress = ((game.index + 1) / game.questions.length) * 100;
  $("#progressBar").style.width = `${progress}%`;

  // save for review
  game.answered[game.index] = {
    q: qObj.q,
    choices: qObj.choices,
    correctIdx,
    selectedIdx,
  };
}

function nextQuestion() {
  clearInterval(timerId);
  if (game.index < game.questions.length - 1) {
    game.index += 1;
    renderQuestion();
  } else {
    finishGame();
  }
}

function skipQuestion() {
  if (!$("#btnNext").disabled) return nextQuestion();
  lockChoices();
  markAnswer(null);
}

function finishGame() {
  show("#screen-results");
  $("#finalScore").textContent = String(game.score);
  $("#correctCount").textContent = String(game.correct);
  $("#wrongCount").textContent = String(game.wrong);
  $("#bestStreak").textContent = String(game.bestStreak);
  const avg = game.elapsed.length
    ? game.elapsed.reduce((a, b) => a + b, 0) / game.elapsed.length
    : 0;
  $("#avgTime").textContent = `${avg.toFixed(1)}s`;

  const prevHigh = getHighScore();
  const isHigh = game.score > prevHigh;
  $("#newHighBadge").hidden = !isHigh;
  if (isHigh) setHighScore(game.score);
  setLastScore(game.score);

  // Review list
  const review = $("#reviewList");
  review.innerHTML = "";
  game.answered.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = `review__item ${
      item.selectedIdx === item.correctIdx ? "correct" : "wrong"
    }`;
    const user =
      item.selectedIdx === null ? "No answer" : item.choices[item.selectedIdx];
    div.innerHTML = `
        <strong>${i + 1}. ${item.q}</strong>
        <div class="review__qa">
          Your answer: <em>${user}</em><br/>
          Correct answer: <strong>${item.choices[item.correctIdx]}</strong>
        </div>
      `;
    review.appendChild(div);
  });

  // update start screen stats
  $("#highScore").textContent = String(getHighScore());
  const ls = getLastScore();
  $("#lastScore").textContent = ls === null ? "—" : String(ls);
}

// --- Events & Init -------------------------------------------------
function bindEvents() {
  $("#btnStart").addEventListener("click", () => {
    settings.total = clampInt($("#questionCount").value, 5, 50);
    settings.timePerQuestion = clampInt($("#timePerQuestion").value, 5, 60);
    startGame();
  });
  $("#btnNext").addEventListener("click", nextQuestion);
  $("#btnSkip").addEventListener("click", skipQuestion);
  $("#btnRestart").addEventListener("click", startGame);
  $("#btnHome").addEventListener("click", () => show("#screen-start"));

  // keyboard
  document.addEventListener("keydown", (e) => {
    if ($("#screen-quiz").classList.contains("active")) {
      if (e.key >= "1" && e.key <= "4") {
        const idx = Number(e.key) - 1;
        const btn = $("#choices").querySelector(`.choice[data-idx="${idx}"]`);
        if (btn && $("#btnNext").disabled) btn.click();
      } else if (e.key === "Enter") {
        if (!$("#btnNext").disabled) nextQuestion();
      }
    }
  });

  // theme
  $("#themeToggle").addEventListener("click", () => {
    const light = document.body.classList.toggle("light");
    $("#themeToggle").setAttribute("aria-pressed", String(light));
    localStorage.setItem(STORAGE_KEYS.THEME, light ? "light" : "auto");
  });
}

function clampInt(v, min, max) {
  const n = Math.round(Number(v) || min);
  return Math.max(min, Math.min(max, n));
}

function initStartScreen() {
  $("#highScore").textContent = String(getHighScore());
  const ls = getLastScore();
  $("#lastScore").textContent = ls === null ? "—" : String(ls);
}

(function init() {
  applyStoredTheme();
  bindEvents();
  initStartScreen();
})();
