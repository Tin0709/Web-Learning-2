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
