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
