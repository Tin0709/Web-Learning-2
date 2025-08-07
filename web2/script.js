const questions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Rome"],
    answer: "Paris"
  },
  {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    answer: "4"
  },
  {
    question: "Who wrote 'Hamlet'?",
    options: ["Tolstoy", "Shakespeare", "Hemingway", "Dickens"],
    answer: "Shakespeare"
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Venus", "Mars", "Jupiter"],
    answer: "Mars"
  },
  {
    question: "What language runs in a web browser?",
    options: ["Java", "C", "Python", "JavaScript"],
    answer: "JavaScript"
  },
  {
    question: "What does CSS stand for?",
    options: ["Cascading Style Sheets", "Color Style Sheet", "Creative Style Syntax", "Computer Style Sheet"],
    answer: "Cascading Style Sheets"
  },
  {
    question: "Which company created React?",
    options: ["Google", "Microsoft", "Facebook", "Twitter"],
    answer: "Facebook"
  },
  {
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    answer: "7"
  },
  {
    question: "Which ocean is the largest?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    answer: "Pacific"
  },
  {
    question: "Which tag is used for a link in HTML?",
    options: ["<a>", "<link>", "<href>", "<url>"],
    answer: "<a>"
  }
];

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("next-btn");
const resultBox = document.getElementById("result");
const scoreEl = document.getElementById("score");

let currentQuestion = 0;
let score = 0;

function showQuestion() {
  const q = questions[currentQuestion];
  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";

  q.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.classList.add("option-btn");
    btn.addEventListener("click", () => checkAnswer(btn, q.answer));
    optionsEl.appendChild(btn);
  });

  nextBtn.disabled = true;
}

function checkAnswer(selectedBtn, correctAnswer) {
  const isCorrect = selectedBtn.textContent === correctAnswer;
  if (isCorrect) {
    selectedBtn.style.backgroundColor = "lightgreen";
    score++;
  } else {
    selectedBtn.style.backgroundColor = "salmon";
  }

  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correctAnswer) {
      btn.style.backgroundColor = "lightgreen";
    }
  });

  nextBtn.disabled = false;
}

nextBtn.addEventListener("click", () => {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
});

function showResult() {
  document.getElementById("quiz-box").classList.add("hide");
  resultBox.classList.remove("hide");
  scoreEl.textContent = score;
}

showQuestion();
