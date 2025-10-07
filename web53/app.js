/* ========= Editable Quiz Data ========= */
const QUESTIONS = [
  {
    text: "Which HTML element is used to create a hyperlink?",
    choices: ["<link>", "<a>", "<href>", "<hyper>"],
    answerIndex: 1,
    explanation:
      "<a> defines a hyperlink; <link> is for external resources in <head>.",
  },
  {
    text: "In CSS, which property controls the text size?",
    choices: ["font-style", "text-size", "font-size", "size"],
    answerIndex: 2,
    explanation: "The correct CSS property is font-size.",
  },
  {
    text: "Which of the following declares a constant in JavaScript?",
    choices: ["var x = 1", "let x = 1", "const x = 1", "constant x = 1"],
    answerIndex: 2,
    explanation: "Use const for block-scoped constants.",
  },
  {
    text: "What does JSON stand for?",
    choices: [
      "Java Syntax Object Notation",
      "JavaScript Object Notation",
      "Java Source Oriented Notation",
      "Joined String Over Network",
    ],
    answerIndex: 1,
    explanation: "JSON = JavaScript Object Notation.",
  },
  {
    text: "Which array method creates a new array with elements that pass a test?",
    choices: ["map()", "reduce()", "filter()", "forEach()"],
    answerIndex: 2,
    explanation:
      "filter() returns a new array with elements that pass the predicate.",
  },
];

/* ========= App State ========= */
let current = 0;
let score = 0;
let hasAnswered = false;
let order = shuffle([...Array(QUESTIONS.length).keys()]); // randomized question order

/* ========= DOM Refs ========= */
const questionEl = document.getElementById("questionText");
const answersWrap = document.getElementById("answers");
const feedbackEl = document.getElementById("feedback");
const progressBar = document.getElementById("progressBar");
const questionCounter = document.getElementById("questionCounter");
const scoreCounter = document.getElementById("scoreCounter");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

init();

/* ========= Functions ========= */

function init() {
  current = 0;
  score = 0;
  hasAnswered = false;
  order = shuffle([...Array(QUESTIONS.length).keys()]);
  nextBtn.disabled = true;
  restartBtn.classList.add("hidden");
  renderQuestion();
  updateMeta();
  document.addEventListener("keydown", handleKeys);
}

function renderQuestion() {
  const qIndex = order[current];
  const q = QUESTIONS[qIndex];

  questionEl.textContent = q.text;
  answersWrap.innerHTML = "";

  const keys = ["1", "2", "3", "4"];
  q.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.className = "btn answer";
    btn.setAttribute("data-index", i);
    btn.innerHTML = `
      <span class="answer__key">${keys[i]}</span>
      <span>${escapeHTML(choice)}</span>
    `;
    btn.addEventListener("click", () => selectAnswer(i));
    answersWrap.appendChild(btn);
  });

  feedbackEl.textContent = "";
  hasAnswered = false;
  nextBtn.disabled = true;

  // progress
  const progress = (current / QUESTIONS.length) * 100;
  progressBar.style.width = `${progress}%`;
}

function selectAnswer(i) {
  if (hasAnswered) return;
  hasAnswered = true;

  const q = QUESTIONS[order[current]];
  const correct = q.answerIndex;

  const buttons = [...answersWrap.querySelectorAll("button")];
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correct) btn.classList.add("correct");
    if (idx === i && i !== correct) btn.classList.add("wrong");
  });

  if (i === correct) {
    score++;
    feedbackEl.textContent = "✅ Correct! " + (q.explanation || "");
  } else {
    feedbackEl.textContent = "❌ Not quite. " + (q.explanation || "");
  }

  updateMeta();
  nextBtn.disabled = false;

  // If it's the last question, change Next to "See results"
  if (current === QUESTIONS.length - 1) {
    nextBtn.textContent = "See results ↵";
  } else {
    nextBtn.textContent = "Next ↵";
  }
}

function handleKeys(e) {
  const key = e.key;
  if (!hasAnswered && ["1", "2", "3", "4"].includes(key)) {
    const idx = Number(key) - 1;
    const buttons = answersWrap.querySelectorAll("button");
    if (buttons[idx]) buttons[idx].click();
  } else if (key === "Enter") {
    if (!nextBtn.disabled) goNext();
  }
}

nextBtn.addEventListener("click", goNext);
restartBtn.addEventListener("click", init);

function goNext() {
  if (current < QUESTIONS.length - 1) {
    current++;
    renderQuestion();
    updateMeta();
  } else {
    showResults();
  }
}

function showResults() {
  // Fill the progress bar to 100%
  progressBar.style.width = "100%";
  questionCounter.textContent = `Finished!`;
  scoreCounter.textContent = `Score: ${score}/${QUESTIONS.length}`;

  const percent = Math.round((score / QUESTIONS.length) * 100);

  questionEl.textContent = "Results";
  answersWrap.innerHTML = `
    <div class="btn" style="cursor:default">
      You scored <strong>${score}</strong> out of <strong>${QUESTIONS.length}</strong> (${percent}%)
    </div>
  `;

  feedbackEl.textContent = getMessage(percent);
  nextBtn.disabled = true;
  nextBtn.textContent = "Next";
  restartBtn.classList.remove("hidden");
}

function updateMeta() {
  questionCounter.textContent = `Question ${Math.min(
    current + 1,
    QUESTIONS.length
  )}/${QUESTIONS.length}`;
  scoreCounter.textContent = `Score: ${score}`;
}

function getMessage(p) {
  if (p === 100) return "🎉 Perfect! You nailed it.";
  if (p >= 80) return "🔥 Great job! Almost perfect.";
  if (p >= 50) return "👍 Not bad—keep practicing.";
  return "💡 Keep going—you’ll get there!";
}

/* ========= Utils ========= */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHTML(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
