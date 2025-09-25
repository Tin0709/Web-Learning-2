const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const now = () => Date.now();
const day = 24 * 60 * 60 * 1000;

const DEFAULT_SETTINGS = {
  dailyNewLimit: 20,
  quizChoices: 4,
};

const DEFAULT_DECKS = [
  {
    id: crypto.randomUUID(),
    name: "Spanish Basics",
    createdAt: now(),
    settings: { ...DEFAULT_SETTINGS },
    cards: [
      ["hola", "hello", "interjection"],
      ["adiós", "goodbye", "interjection"],
      ["por favor", "please", "phrase"],
      ["gracias", "thank you", "interjection"],
      ["sí", "yes", "adverb"],
      ["no", "no", "adverb"],
      ["perdón", "sorry", "interjection"],
      ["buenos días", "good morning", "phrase"],
      ["buenas noches", "good night", "phrase"],
      ["¿cómo estás?", "how are you?", "phrase"],
      ["bien", "well", "adverb"],
      ["mal", "bad", "adjective"],
      ["amigo", "friend", "noun"],
      ["agua", "water", "noun"],
      ["comer", "to eat", "verb"],
    ].map(([term, def, pos]) => makeCard(term, def, pos)),
  },
];

// Leitner intervals per box index:
const INTERVALS = [0, 1, 2, 4, 7].map((d) => d * day);
function makeCard(term, def, pos = "") {
  return {
    id: crypto.randomUUID(),
    term,
    def,
    pos,
    box: 0,
    createdAt: now(),
    last: 0,
    next: 0,
  };
}

const store = {
  key: "langlearn_v1",
  read() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { decks: DEFAULT_DECKS };
      const data = JSON.parse(raw);
      // Basic migrations / defaults
      data.decks.forEach((d) => {
        d.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
        d.cards.forEach((c) => {
          c.box ??= 0;
          c.last ??= 0;
          c.next ??= 0;
          c.pos ??= "";
        });
      });
      return data;
    } catch (e) {
      console.warn("Failed to parse storage; resetting.", e);
      return { decks: DEFAULT_DECKS };
    }
  },
  write(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },
};

let state = store.read();
let currentDeckId = state.decks[0].id;
// ---------- UI Elements
const deckSelect = $("#deckSelect");
const newDeckBtn = $("#newDeckBtn");
const dueCount = $("#dueCount");
const learnedCount = $("#learnedCount");
const totalCount = $("#totalCount");
const progressBar = $("#progressBar");

const tabs = $$(".tab");
const panels = $$(".tab-panel");

const flashcardEl = $("#flashcard");
const frontEl = $(".front", flashcardEl);
const backEl = $(".back", flashcardEl);
const showAnswerBtn = $("#showAnswerBtn");
const reviewControls = $("#reviewControls");
const againBtn = $("#againBtn");
const goodBtn = $("#goodBtn");
const skipBtn = $("#skipBtn");

const quizQuestion = $("#quizQuestion");
const quizOptions = $("#quizOptions");
const startQuizBtn = $("#startQuizBtn");
const quizScoreEl = $("#quizScore");

const addForm = $("#addForm");
const termInput = $("#termInput");
const defInput = $("#defInput");
const posInput = $("#posInput");
const wordsTable = $("#wordsTable");

const dailyNewInput = $("#dailyNewInput");
const quizChoicesInput = $("#quizChoicesInput");
const resetProgressBtn = $("#resetProgressBtn");

const deckModal = $("#deckModal");
const newDeckName = $("#newDeckName");
const createDeckConfirm = $("#createDeckConfirm");

// ---------- Helpers
const getDeck = () => state.decks.find((d) => d.id === currentDeckId);
const setDeck = (id) => {
  currentDeckId = id;
  save();
  renderAll();
};
const save = () => store.write(state);

function formatStats(deck) {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  const due = deck.cards.filter((c) => c.next <= now()).length;
  const learned = deck.cards.filter((c) => c.box >= 3).length;
  const total = deck.cards.length;

  // Progress: learned/total
  progressBar.style.width = total
    ? ((learned / Math.max(total, 1)) * 100).toFixed(1) + "%"
    : "0%";

  dueCount.textContent = due;
  learnedCount.textContent = learned;
  totalCount.textContent = total;
}

function populateDeckSelect() {
  deckSelect.innerHTML = "";
  state.decks.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    if (d.id === currentDeckId) opt.selected = true;
    deckSelect.appendChild(opt);
  });
}

function renderWordsTable() {
  const deck = getDeck();
  if (deck.cards.length === 0) {
    wordsTable.innerHTML = `<div class="table-row"><div>No words yet. Add some above!</div></div>`;
    return;
  }
  wordsTable.innerHTML = "";
  deck.cards
    .slice()
    .sort((a, b) => a.term.localeCompare(b.term))
    .forEach((card) => {
      const row = document.createElement("div");
      row.className = "table-row";
      row.innerHTML = `
        <div title="${escapeHtml(card.term)}">${escapeHtml(card.term)}</div>
        <div title="${escapeHtml(card.def)}">${escapeHtml(card.def)}</div>
        <div>${escapeHtml(card.pos || "")}</div>
        <div>
          <button class="btn btn-ghost" data-action="del" data-id="${
            card.id
          }" title="Delete">✕</button>
        </div>
      `;
      wordsTable.appendChild(row);
    });

  wordsTable.onclick = (e) => {
    const btn = e.target.closest("button[data-action='del']");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const deck = getDeck();
    const idx = deck.cards.findIndex((c) => c.id === id);
    if (idx > -1) {
      deck.cards.splice(idx, 1);
      save();
      renderAll();
    }
  };
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        ch
      ])
  );
}
// ---------- Study logic
let studyQueue = [];
let currentCard = null;
let showingBack = false;

function buildStudyQueue() {
  const deck = getDeck();
  const due = deck.cards.filter((c) => c.next <= now());
  // Allow some new cards per day (box 0 & next=0)
  const newCards = deck.cards.filter((c) => c.box === 0 && c.next === 0);
  const limit = deck.settings.dailyNewLimit ?? DEFAULT_SETTINGS.dailyNewLimit;
  const addNew = Math.min(limit, newCards.length);
  studyQueue = shuffle([...due, ...newCards.slice(0, addNew)]);
}

function nextCard() {
  currentCard = studyQueue.shift() || null;
  showingBack = false;
  updateCardUI();
}

function updateCardUI() {
  const empty = !currentCard;
  flashcardEl.classList.toggle("disabled", empty);
  showAnswerBtn.disabled = empty;
  againBtn.disabled = empty;
  goodBtn.disabled = empty;
  skipBtn.disabled = empty;

  reviewControls.classList.toggle("hidden", empty || !showingBack);

  if (empty) {
    frontEl.textContent = "No cards due. 🎉";
    backEl.textContent = "Come back later or add more words.";
    flashcardEl.classList.remove("show");
    return;
  }

  frontEl.textContent = currentCard.term;
  backEl.textContent = `${currentCard.def}${
    currentCard.pos ? ` · ${currentCard.pos}` : ""
  }`;

  flashcardEl.classList.toggle("show", showingBack);
}
function mark(quality) {
  // "again" | "good"
  if (!currentCard) return;
  const deck = getDeck();
  const card = deck.cards.find((c) => c.id === currentCard.id);
  if (!card) return;

  if (quality === "good") {
    card.box = Math.min(card.box + 1, INTERVALS.length - 1);
  } else {
    card.box = Math.max(card.box - 1, 0);
  }
  card.last = now();
  card.next = now() + INTERVALS[card.box];

  // Optional: reinsert at end if still due
  save();
  formatStats(deck);
  nextCard();
}
// ---------- Quiz logic
let quizPool = [];
let quizIndex = 0;
let quizScore = 0;
let quizSize = 10;

function startQuiz() {
  const deck = getDeck();
  const all = deck.cards.slice();
  if (all.length < 2) {
    quizQuestion.textContent = "Add at least 2 words to take a quiz.";
    quizOptions.innerHTML = "";
    return;
  }
  quizSize = Math.min(10, all.length);
  quizPool = shuffle(all).slice(0, quizSize);
  quizIndex = 0;
  quizScore = 0;
  quizScoreEl.textContent = "";
  renderQuizItem();
}

function renderQuizItem() {
  const deck = getDeck();
  const choicesN = Math.max(
    2,
    Math.min(6, deck.settings.quizChoices ?? DEFAULT_SETTINGS.quizChoices)
  );
  const card = quizPool[quizIndex];
  if (!card) {
    quizQuestion.textContent = `Done! Score: ${quizScore} / ${quizPool.length}`;
    quizOptions.innerHTML = "";
    quizScoreEl.textContent = "";
    return;
  }
  quizQuestion.textContent = `What is “${card.term}”?`;
  const distractors = shuffle(
    getDeck().cards.filter((c) => c.id !== card.id)
  ).slice(0, choicesN - 1);
  const options = shuffle([card, ...distractors]);

  quizOptions.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = opt.def;
    btn.onclick = () => {
      const correct = opt.id === card.id;
      if (correct) {
        quizScore++;
        btn.classList.add("btn-ok");
      } else {
        btn.classList.add("btn-warn");
      }
      quizScoreEl.textContent = `Score: ${quizScore} / ${quizIndex + 1}`;
      setTimeout(() => {
        quizIndex++;
        renderQuizItem();
      }, 450);
    };
    quizOptions.appendChild(btn);
  });
}

// ---------- Utilities
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Event wiring
function bindTabs() {
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("is-active"));
      panels.forEach((p) => p.classList.remove("is-active"));
      btn.classList.add("is-active");
      $(`#tab-${btn.dataset.tab}`).classList.add("is-active");
      // Recompute sizing stats when switching
      if (btn.dataset.tab === "study") {
        buildStudyQueue();
        nextCard();
      }
      if (btn.dataset.tab === "add") {
        renderWordsTable();
      }
      if (btn.dataset.tab === "settings") {
        renderSettings();
      }
    });
  });
}

function renderSettings() {
  const deck = getDeck();
  dailyNewInput.value =
    deck.settings.dailyNewLimit ?? DEFAULT_SETTINGS.dailyNewLimit;
  quizChoicesInput.value =
    deck.settings.quizChoices ?? DEFAULT_SETTINGS.quizChoices;
}

function renderAll() {
  populateDeckSelect();
  const deck = getDeck();
  formatStats(deck);
  buildStudyQueue();
  nextCard();
  renderWordsTable();
}

function initDecks() {
  // if no decks (shouldn’t happen), seed defaults
  if (!state.decks || state.decks.length === 0) {
    state.decks = DEFAULT_DECKS;
  }
}

// ---------- Listeners
deckSelect.addEventListener("change", (e) => setDeck(e.target.value));
newDeckBtn.addEventListener("click", () => {
  newDeckName.value = "";
  deckModal.showModal();
});
createDeckConfirm.addEventListener("click", () => {
  const name = newDeckName.value.trim();
  if (!name) return;
  const deck = {
    id: crypto.randomUUID(),
    name,
    createdAt: now(),
    settings: { ...DEFAULT_SETTINGS },
    cards: [],
  };
  state.decks.push(deck);
  currentDeckId = deck.id;
  save();
  renderAll();
});

showAnswerBtn.addEventListener("click", () => {
  if (!currentCard) return;
  showingBack = !showingBack;
  updateCardUI();
  reviewControls.classList.toggle("hidden", !showingBack);
});
againBtn.addEventListener("click", () => mark("again"));
goodBtn.addEventListener("click", () => mark("good"));
skipBtn.addEventListener("click", () => nextCard());
