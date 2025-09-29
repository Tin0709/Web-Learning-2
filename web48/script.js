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
function renderTwists() {
  TWISTS.forEach((t, i) => {
    const id = `tw-${i}`;
    const label = document.createElement("label");
    label.innerHTML = `
        <input type="checkbox" value="${t}" id="${id}" />
        <span>${t}</span>
      `;
    twistsGrid.appendChild(label);
  });
}

// Preset chip click → fill input
chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const target = document.getElementById(chip.dataset.fill);
    target.value = chip.dataset.value;
    target.focus();
  });
});

// Length UI
lengthRange.addEventListener("input", () => {
  lengthValue.textContent = lengthRange.value;
});

// Shuffle inputs
btnShuffle.addEventListener("click", () => {
  const seedsample = Math.floor(Math.random() * 1e6);
  $("#character").value = pick(Math.random, [
    "a shy cartographer",
    "a sarcastic botanist",
    "a rookie courier",
    "a retired detective",
    "a bored guardian",
  ]);
  $("#setting").value = pick(Math.random, [
    "a floating library",
    "a quiet border town",
    "a subterranean market",
    "a failing orbital station",
    "a rainy canyon city",
  ]);
  $("#goal").value = pick(Math.random, [
    "deliver a message in time",
    "recover a stolen memory",
    "repair a broken promise",
    "prevent a quiet catastrophe",
    "win the midnight contest",
  ]);
  $("#tone").value = pick(Math.random, [
    "whimsical",
    "mysterious",
    "hopeful",
    "melancholic",
    "adventurous",
  ]);
  $$("#twists input[type=checkbox]").forEach((c) => (c.checked = false));
  // randomly check a few twists
  const howMany = 1 + Math.floor(Math.random() * 3);
  const indices = [...TWISTS.keys()]
    .sort(() => Math.random() - 0.5)
    .slice(0, howMany);
  indices.forEach((i) => ($("#tw-" + i).checked = true));
  seedInput.value = seedsample;
  lengthRange.value = String(3 + Math.floor(Math.random() * 7));
  lengthValue.textContent = lengthRange.value;
});

// Clear form
btnClear.addEventListener("click", () => {
  form.reset();
  $$("#twists input[type=checkbox]").forEach((c) => (c.checked = false));
  lengthRange.value = "5";
  lengthValue.textContent = "5";
  storyCard.hidden = true;
});
