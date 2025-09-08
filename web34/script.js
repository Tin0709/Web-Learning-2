// ====== Config ======
const SECONDS_PER_QUESTION = 15;
const QUESTION_BANK = [
  {
    q: "Which language runs in a web browser?",
    choices: ["Java", "C", "Python", "JavaScript"],
    a: 3,
  },
  {
    q: "What does CSS stand for?",
    choices: [
      "Colorful Style Sheets",
      "Cascading Style Sheets",
      "Computer Style Sheets",
      "Creative Styling System",
    ],
    a: 1,
  },
  {
    q: "Inside which HTML element do we put the JavaScript?",
    choices: ["<js>", "<javascript>", "<script>", "<code>"],
    a: 2,
  },
  {
    q: "Which company developed React?",
    choices: ["Google", "Facebook (Meta)", "Twitter", "Microsoft"],
    a: 1,
  },
  {
    q: "Which tag is used to link a stylesheet?",
    choices: ["<style>", "<css>", "<link>", "<script>"],
    a: 2,
  },
  {
    q: "What does HTML stand for?",
    choices: [
      "Hyperlinks and Text Markup Language",
      "Hyper Text Markup Language",
      "Home Tool Markup Language",
      "Hyper Text Makeup Language",
    ],
    a: 1,
  },
  {
    q: "Which array method creates a new array with results of a function?",
    choices: ["forEach()", "map()", "reduce()", "filter()"],
    a: 1,
  },
  {
    q: "Which HTTP status code means 'Not Found'?",
    choices: ["200", "301", "404", "500"],
    a: 2,
  },
  {
    q: "Which CSS property controls text size?",
    choices: ["font-weight", "text-style", "font-size", "size"],
    a: 2,
  },
  {
    q: "What does DOM stand for?",
    choices: [
      "Document Object Model",
      "Data Object Management",
      "Digital Ordinance Model",
      "Document Orientation Mode",
    ],
    a: 0,
  },
];

// ====== State ======
let questions = [];
let current = 0;
let score = 0;
let selectedIndex = null;
let timerId = null;
let timeLeft = SECONDS_PER_QUESTION;

// ====== Elements ======
const elQ = document.getElementById("question");
const elChoices = document.getElementById("choices");
const elFeedback = document.getElementById("feedback");
const elNext = document.getElementById("nextBtn");
const elRestart = document.getElementById("restartBtn");
const elScore = document.getElementById("score");
const elQIndex = document.getElementById("qIndex");
const elQTotal = document.getElementById("qTotal");
const elTimer = document.getElementById("timer");
const elProgressBar = document.getElementById("progressBar");

// ====== Utils ======
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function updateProgress() {
  const pct = (current / questions.length) * 100;
  elProgressBar.style.width = `${pct}%`;
}

function resetTimer() {
  clearInterval(timerId);
  timeLeft = SECONDS_PER_QUESTION;
  elTimer.textContent = timeLeft;
  timerId = setInterval(() => {
    timeLeft -= 1;
    elTimer.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerId);
      lockChoices();
      showFeedback(false, true); // time ran out
      elNext.disabled = false;
    }
  }, 1000);
}

function renderQuestion() {
  const { q, choices } = questions[current];
  elQ.textContent = q;
  elChoices.innerHTML = "";
  elFeedback.textContent = "";
  elNext.disabled = true;
  selectedIndex = null;

  choices.forEach((text, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";
    btn.dataset.index = idx;

    const badge = document.createElement("span");
    badge.className = "choice__index";
    badge.textContent = (idx + 1).toString();

    const label = document.createElement("span");
    label.textContent = text;

    btn.appendChild(badge);
    btn.appendChild(label);

    btn.addEventListener("click", handleChoiceClick);
    elChoices.appendChild(btn);
  });

  elQIndex.textContent = current + 1;
  updateProgress();
  resetTimer();
  // Focus the first choice for accessibility
  const first = elChoices.querySelector(".choice");
  if (first) first.focus();
}

function handleChoiceClick(e) {
  if (selectedIndex !== null) return; // already answered
  const btn = e.currentTarget;
  selectedIndex = parseInt(btn.dataset.index, 10);

  const isCorrect = selectedIndex === questions[current].a;
  if (isCorrect) score += 1;
  elScore.textContent = score;

  decorateAnswers(selectedIndex);
  showFeedback(isCorrect, false);
  clearInterval(timerId);
  elNext.disabled = false;
}

function decorateAnswers(userIndex) {
  const correctIndex = questions[current].a;
  [...elChoices.children].forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIndex) btn.classList.add("choice--correct");
    if (idx === userIndex && idx !== correctIndex) {
      btn.classList.add("choice--wrong");
    }
  });
}

function lockChoices() {
  const correctIndex = questions[current].a;
  [...elChoices.children].forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIndex) btn.classList.add("choice--correct");
  });
}

function showFeedback(correct, timedOut) {
  if (timedOut) {
    elFeedback.textContent = "⏰ Time's up! The correct answer is highlighted.";
  } else if (correct) {
    elFeedback.textContent = "✅ Correct!";
  } else {
    elFeedback.textContent = "❌ Incorrect.";
  }
}

function nextQuestion() {
  current += 1;
  if (current >= questions.length) return finishQuiz();
  renderQuestion();
}

function finishQuiz() {
  clearInterval(timerId);
  elProgressBar.style.width = "100%";
  elQ.textContent = "Quiz complete!";
  elChoices.innerHTML = "";
  elFeedback.innerHTML = `You scored <strong>${score}</strong> out of <strong>${questions.length}</strong>.`;
  elNext.disabled = true;
}

function restartQuiz() {
  clearInterval(timerId);
  questions = shuffle(QUESTION_BANK).map((q) => {
    // Optional: shuffle choices but keep correct index mapped
    const mapped = q.choices.map((text, i) => ({ text, i }));
    const shuffled = shuffle(mapped);
    const newChoices = shuffled.map((o) => o.text);
    const newAnswer = shuffled.findIndex((o) => o.i === q.a);
    return { q: q.q, choices: newChoices, a: newAnswer };
  });
  current = 0;
  score = 0;
  selectedIndex = null;
  elScore.textContent = score;
  elQTotal.textContent = questions.length;
  elNext.disabled = true;
  renderQuestion();
}

// ====== Events ======
elNext.addEventListener("click", nextQuestion);
elRestart.addEventListener("click", restartQuiz);

// Keyboard shortcuts: 1-4 to pick answers, Enter for Next
document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const key = e.key;
  if (key >= "1" && key <= "4") {
    const idx = parseInt(key, 10) - 1;
    const target = elChoices.children[idx];
    if (target && !target.disabled) target.click();
  } else if (key === "Enter") {
    if (!elNext.disabled) nextQuestion();
  }
});

// ====== Init ======
restartQuiz();
