// ====== CONFIG: Questions ======
// You can edit/extend this list easily.
const QUESTIONS = [
  {
    question: "Which HTML tag is used to define the largest heading?",
    answers: [
      { text: "<h1>", correct: true },
      { text: "<heading>", correct: false },
      { text: "<h6>", correct: false },
      { text: "<head>", correct: false },
    ],
  },
  {
    question: "Which CSS property controls the text size?",
    answers: [
      { text: "font-style", correct: false },
      { text: "text-size", correct: false },
      { text: "font-size", correct: true },
      { text: "text-style", correct: false },
    ],
  },
  {
    question: "What does DOM stand for?",
    answers: [
      { text: "Document Object Model", correct: true },
      { text: "Data Object Manager", correct: false },
      { text: "Document Oriented Markup", correct: false },
      { text: "Display Object Mode", correct: false },
    ],
  },
  {
    question: "How do you write a comment in CSS?",
    answers: [
      { text: "// this is a comment", correct: false },
      { text: "/* this is a comment */", correct: true },
      { text: "<!-- comment -->", correct: false },
      { text: "# comment", correct: false },
    ],
  },
  {
    question:
      "Which method adds an element to the end of an array in JavaScript?",
    answers: [
      { text: "push()", correct: true },
      { text: "pop()", correct: false },
      { text: "shift()", correct: false },
      { text: "unshift()", correct: false },
    ],
  },
  {
    question: "Which attribute is required in the <img> tag?",
    answers: [
      { text: "href", correct: false },
      { text: "src", correct: true },
      { text: "alt", correct: false },
      { text: "title", correct: false },
    ],
  },
  {
    question: "Which of the following is NOT a JavaScript primitive type?",
    answers: [
      { text: "number", correct: false },
      { text: "object", correct: true },
      { text: "string", correct: false },
      { text: "boolean", correct: false },
    ],
  },
  {
    question: "Which CSS layout module provides flexible rows/columns?",
    answers: [
      { text: "Flexbox", correct: true },
      { text: "Float", correct: false },
      { text: "Positioning", correct: false },
      { text: "Table layout", correct: false },
    ],
  },
  {
    question: "How do you declare a constant in JavaScript?",
    answers: [
      { text: "var PI = 3.14;", correct: false },
      { text: "let PI = 3.14;", correct: false },
      { text: "const PI = 3.14;", correct: true },
      { text: "constant PI = 3.14;", correct: false },
    ],
  },
  {
    question: "Which HTTP status code means 'Not Found'?",
    answers: [
      { text: "200", correct: false },
      { text: "301", correct: false },
      { text: "404", correct: true },
      { text: "500", correct: false },
    ],
  },
];
// ====== DOM Elements ======
const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const quitBtn = document.getElementById("quitBtn");
const restartBtn = document.getElementById("restartBtn");
const reviewBtn = document.getElementById("reviewBtn");

const questionText = document.getElementById("questionText");
const answersContainer = document.getElementById("answers");

const questionCounter = document.getElementById("questionCounter");
const progressBar = document.getElementById("progressBar");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");

const finalScoreEl = document.getElementById("finalScore");
const totalQuestionsEl = document.getElementById("totalQuestions");
const bestNoteEl = document.getElementById("bestNote");

const reviewPanel = document.getElementById("reviewPanel");
const reviewList = document.getElementById("reviewList");

// ====== State ======
let questions = [];
let currentIndex = 0;
let score = 0;
let hasAnswered = false;
let reviewData = []; // {q, chosen, correct}

// ====== Utilities ======
const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);
const getBest = () => Number(localStorage.getItem("quiz_best") || 0);
const setBest = (val) => localStorage.setItem("quiz_best", String(val));

function show(el) {
  el.classList.remove("hidden");
}
function hide(el) {
  el.classList.add("hidden");
}

function updateStats() {
  questionCounter.textContent = `${Math.min(
    currentIndex + 1,
    questions.length
  )} / ${questions.length}`;
  progressBar.style.width = `${(currentIndex / questions.length) * 100}%`;
  scoreEl.textContent = String(score);
  bestScoreEl.textContent = String(getBest());
}

// ====== Render Question ======
function renderQuestion() {
  hasAnswered = false;
  nextBtn.disabled = true;
  answersContainer.innerHTML = "";

  const q = questions[currentIndex];
  questionText.textContent = q.question;

  // shuffle answers per question to avoid positional bias
  const shuffledAnswers = shuffle(q.answers);

  shuffledAnswers.forEach((ans, idx) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.setAttribute("role", "listitem");
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = ans.text;
    btn.dataset.correct = ans.correct ? "1" : "0";

    // Keyboard support: Enter/Space to choose
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });

    btn.addEventListener("click", () => handleAnswer(btn));
    answersContainer.appendChild(btn);

    // First option receives initial focus (improves keyboard flow)
    if (idx === 0) btn.focus();
  });

  updateStats();
}
// ====== Handle Answer Selection ======
function handleAnswer(btn) {
  if (hasAnswered) return;
  hasAnswered = true;

  const isCorrect = btn.dataset.correct === "1";
  btn.classList.add(isCorrect ? "correct" : "wrong");
  btn.setAttribute("aria-pressed", "true");

  // reveal all correctness
  [...answersContainer.children].forEach((b) => {
    b.disabled = true;
    if (b.dataset.correct === "1") b.classList.add("correct");
    else if (b !== btn) b.classList.add("wrong");
  });

  if (isCorrect) score++;

  // Save for review
  const q = questions[currentIndex];
  reviewData.push({
    q: q.question,
    chosen: btn.textContent,
    correct: q.answers.find((a) => a.correct)?.text || "",
  });

  nextBtn.disabled = false;
  scoreEl.textContent = String(score);
}

// ====== Flow Controls ======
function startQuiz() {
  score = 0;
  currentIndex = 0;
  questions = shuffle(QUESTIONS);
  reviewData = [];

  hide(startScreen);
  hide(resultScreen);
  show(quizScreen);

  updateStats();
  renderQuestion();
}

function nextQuestion() {
  if (!hasAnswered) return;

  currentIndex++;
  progressBar.style.width = `${(currentIndex / questions.length) * 100}%`;

  if (currentIndex >= questions.length) {
    endQuiz();
  } else {
    renderQuestion();
  }
}

function quitQuiz() {
  endQuiz();
}

function endQuiz() {
  hide(quizScreen);
  show(resultScreen);

  finalScoreEl.textContent = String(score);
  totalQuestionsEl.textContent = String(questions.length);

  const best = getBest();
  if (score > best) {
    setBest(score);
    bestNoteEl.textContent = "🎉 New high score!";
  } else if (score === best && best !== 0) {
    bestNoteEl.textContent = "💪 You matched your best score!";
  } else {
    bestNoteEl.textContent = "";
  }
  bestScoreEl.textContent = String(getBest());

  // Prepare review list
  reviewList.innerHTML = "";
  reviewData.forEach((item, i) => {
    const li = document.createElement("li");
    const isRight = item.chosen === item.correct;
    li.innerHTML = `
        <div><strong>Q${i + 1}:</strong> ${item.q}</div>
        <div>Your answer: <span class="${isRight ? "correct" : "wrong"}">${
      item.chosen
    }</span></div>
        <div>Correct answer: <span class="correct">${item.correct}</span></div>
      `;
    reviewList.appendChild(li);
  });
  // Hide review by default; show when user clicks
  reviewPanel.classList.add("hidden");
} // ====== Event Listeners ======
startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", nextQuestion);
quitBtn.addEventListener("click", quitQuiz);

restartBtn.addEventListener("click", () => {
  startQuiz();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

reviewBtn.addEventListener("click", () => {
  reviewPanel.classList.toggle("hidden");
  // Move focus to the details for accessibility
  if (!reviewPanel.classList.contains("hidden")) {
    reviewPanel.querySelector("summary").focus();
  }
});

// Allow keyboard nav for Next (Enter) when enabled
document.addEventListener("keydown", (e) => {
  if (
    e.key.toLowerCase() === "enter" &&
    !nextBtn.disabled &&
    !resultScreen.classList.contains("hidden")
  ) {
    // no-op on result screen
    return;
  }
  if (
    e.key.toLowerCase() === "enter" &&
    !nextBtn.disabled &&
    !quizScreen.classList.contains("hidden")
  ) {
    nextBtn.click();
  }
});
