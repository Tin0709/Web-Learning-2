/* ========= Quiz Data =========
  Each question: { q, choices: [..4], answer: index (0-3), explain? }
*/
const QUESTIONS = [
  {
    q: "Which HTML element is used to define the title of a document shown in the browser tab?",
    choices: ["<meta>", "<title>", "<header>", "<caption>"],
    answer: 1,
    explain: "<title> goes inside <head> and sets the tab/window title.",
  },
  {
    q: "Which CSS property controls the space outside an element’s border?",
    choices: ["padding", "margin", "gap", "outline-offset"],
    answer: 1,
    explain: "Padding is inside the border; margin is outside.",
  },
  {
    q: "In JavaScript, what does `Array.prototype.map` return?",
    choices: ["A new array", "The same array", "A number", "An iterator"],
    answer: 0,
    explain:
      "map creates a new array of the same length with transformed values.",
  },
  {
    q: "Which HTTP status code means “Not Found”?",
    choices: ["200", "301", "404", "500"],
    answer: 2,
    explain: "404 indicates the requested resource couldn’t be found.",
  },
  {
    q: "Which CSS unit scales with the root element’s font size?",
    choices: ["em", "rem", "px", "vh"],
    answer: 1,
    explain: "rem = root em (relative to :root font-size).",
  },
  {
    q: "What does `const` do in JavaScript?",
    choices: [
      "Creates an immutable object",
      "Creates a block-scoped binding",
      "Prevents reassignment of properties",
      "Hoists like var",
    ],
    answer: 1,
    explain:
      "`const` prevents reassigning the binding; the value can still be a mutable object.",
  },
  {
    q: "Which tag semantically represents a self-contained piece of content (e.g., a blog post)?",
    choices: ["<section>", "<article>", "<aside>", "<div>"],
    answer: 1,
    explain: "<article> is for independent, self-contained content.",
  },
  {
    q: "Which method adds an item to the end of an array?",
    choices: ["shift()", "unshift()", "push()", "pop()"],
    answer: 2,
    explain: "push() appends; pop() removes from the end.",
  },
  {
    q: "Which CSS property is used to create a grid with columns of equal width?",
    choices: [
      "grid-rows",
      "grid-template-columns: repeat(n, 1fr)",
      "display: inline-grid(n)",
      "grid-auto-flow: column 1fr",
    ],
    answer: 1,
    explain: "repeat(n, 1fr) creates n equal-width columns.",
  },
  {
    q: "Which attribute improves accessibility by labeling form inputs?",
    choices: ["for on <label>", "name on <input>", "placeholder", "value"],
    answer: 0,
    explain:
      "Use <label for='id'> to associate labels with inputs for screen readers and click targets.",
  },
];
// ====== Helpers ======
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const shuffle = (arr) =>
  arr
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

const ui = {
  progressBar: $("#progressBar"),
  qCounter: $("#qCounter"),
  timer: $("#timer"),
  question: $("#question"),
  answers: $("#answers"),
  nextBtn: $("#nextBtn"),
  skipBtn: $("#skipBtn"),
  restartBtn: $("#restartBtn"),
  score: $("#score"),
  streak: $("#streak"),
  best: $("#best"),
  feedback: $("#feedback"),
  summary: $("#summary"),
  finalLine: $("#finalLine"),
  sumScore: $("#sumScore"),
  sumTotal: $("#sumTotal"),
  sumBest: $("#sumBest"),
  sumAcc: $("#sumAcc"),
  playAgain: $("#playAgain"),
  review: $("#review"),
  reviewBlock: $("#reviewBlock"),
  reviewList: $("#reviewList"),
  themeToggle: $("#themeToggle"),
  questionWrap: $("#questionWrap"),
};

// ====== State ======
const QUIZ_SECONDS = 20; // per-question timer
let order = [];
let index = 0;
let score = 0;
let streak = 0;
let best = Number(localStorage.getItem("miniQuiz.best") || 0);
let lock = false; // prevent double answers
let tick = null; // interval id
let timeLeft = QUIZ_SECONDS;
let history = []; // keep {q, chosen, correctIndex, correct}

function init() {
  // Theme
  const savedTheme = localStorage.getItem("miniQuiz.theme");
  if (savedTheme === "light") document.body.classList.add("light");
  ui.best.textContent = best;

  startQuiz();
  wireEvents();
}

function startQuiz() {
  // Build question order and reset state
  order = shuffle([...QUESTIONS.keys()]);
  index = 0;
  score = 0;
  streak = 0;
  history = [];
  ui.summary.classList.add("hidden");
  ui.reviewBlock.classList.add("hidden");
  ui.feedback.textContent = "";
  ui.score.textContent = "0";
  ui.streak.textContent = "0";
  ui.nextBtn.disabled = true;

  render();
}

function wireEvents() {
  ui.nextBtn.addEventListener("click", onNext);
  ui.skipBtn.addEventListener("click", onSkip);
  ui.restartBtn.addEventListener("click", startQuiz);
  ui.playAgain.addEventListener("click", startQuiz);
  ui.review.addEventListener("click", () =>
    ui.reviewBlock.classList.toggle("hidden")
  );
  ui.themeToggle.addEventListener("click", toggleTheme);

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (lock && e.key === "Enter") {
      onNext();
      return;
    }
    const num = Number(e.key);
    if (!Number.isNaN(num) && num >= 1 && num <= 4) {
      const btn = ui.answers.children[num - 1];
      if (btn) btn.click();
    } else if (e.key === "Enter") {
      // If focused on answer phase, treat as Next
      if (!ui.nextBtn.disabled) onNext();
    }
  });
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "miniQuiz.theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
}

// ====== Render a question ======
function render() {
  clearInterval(tick);
  timeLeft = QUIZ_SECONDS;

  const qIdx = order[index];
  const item = QUESTIONS[qIdx];
  ui.question.textContent = item.q;
  ui.question.focus();

  // build answers (keep original order; could also shuffle choices)
  ui.answers.innerHTML = "";
  item.choices.forEach((choice, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.setAttribute("data-index", i);
    btn.innerHTML = `<strong>${i + 1}.</strong> ${escapeHTML(choice)}`;
    btn.addEventListener("click", () => onAnswer(i));
    li.appendChild(btn);
    ui.answers.appendChild(li);
  });

  ui.qCounter.textContent = `Q ${index + 1}/${order.length}`;
  updateProgress();
  ui.feedback.textContent = "";
  ui.nextBtn.disabled = true;
  lock = false;

  // timer
  ui.timer.textContent = `${timeLeft}s`;
  tick = setInterval(() => {
    timeLeft = clamp(timeLeft - 1, 0, QUIZ_SECONDS);
    ui.timer.textContent = `${timeLeft}s`;
    if (timeLeft === 0) {
      clearInterval(tick);
      // auto mark as wrong if not answered
      onAnswer(-1, true);
    }
  }, 1000);
}

function updateProgress() {
  const pct = (index / order.length) * 100;
  ui.progressBar.style.width = `${pct}%`;
  ui.progressBar.parentElement.setAttribute("aria-valuenow", Math.round(pct));
}

// ====== Answer flow ======
function onAnswer(choiceIndex, fromTimeout = false) {
  if (lock) return;
  lock = true;
  clearInterval(tick);

  const qIdx = order[index];
  const item = QUESTIONS[qIdx];

  const correctIndex = item.answer;
  const correct = choiceIndex === correctIndex;

  // Decorate buttons
  $$(".answers button").forEach((b, i) => {
    b.disabled = true;
    if (i === correctIndex) b.classList.add("correct");
    if (choiceIndex === i && !correct) b.classList.add("wrong");
  });

  // Score/streak/feedback
  if (correct) {
    score += 1;
    streak += 1;
    ui.feedback.textContent = `✅ Correct! ${item.explain || ""}`;
  } else {
    streak = 0;
    const userChoice =
      choiceIndex >= 0 ? item.choices[choiceIndex] : "No answer";
    ui.feedback.textContent = `❌ ${
      fromTimeout ? "Time's up." : "Not quite."
    } Correct: “${item.choices[correctIndex]}”. ${item.explain || ""}`;
  }
  ui.score.textContent = String(score);
  ui.streak.textContent = String(streak);

  // Save to history for review
  history.push({
    q: item.q,
    choices: item.choices,
    chosen: choiceIndex,
    correctIndex,
    correct,
  });

  ui.nextBtn.disabled = false;
  ui.nextBtn.focus();
}
