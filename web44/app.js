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
