// Utility: seeded random (Mulberry32)
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Pick helper
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// DOM
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// Elements
const form = $("#story-form");
const chips = $$(".chip");
const twistsGrid = $("#twists");
const lengthRange = $("#length");
const lengthValue = $("#length-value");
const seedInput = $("#seed");
const titleInput = $("#title");
const storyCard = $("#story-card");
const storyTitle = $("#story-title");
const storyMeta = $("#story-meta");
const storyText = $("#story-text");

const btnShuffle = $("#shuffle");
const btnClear = $("#clear");
const btnCopy = $("#copy");
const btnDownload = $("#download");
const btnSave = $("#save");
const btnHistory = $("#history");
const historyDialog = $("#history-dialog");
const historyList = $("#history-list");
const btnExportAll = $("#export-all");
const btnClearHistory = $("#clear-history");

// Twists catalog
const TWISTS = [
  "a friendly rival shows up",
  "the map is a forgery",
  "time repeats a single hour",
  "a stray message from the future",
  "an unexpected mentor betrays them",
  "the goal was a decoy all along",
  "a door requires a personal secret",
  "they can only speak in whispers",
  "an ally is not human",
  "the power fails at the worst moment",
  "someone remembers a different version of events",
  "the town celebrates a forgotten holiday",
];
