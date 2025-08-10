const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const factEl = document.getElementById("fact");
const statusEl = document.getElementById("status");
const newBtn = document.getElementById("newFactBtn");
const copyBtn = document.getElementById("copyBtn");

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function setFact(text) {
  factEl.textContent = text;
  setStatus("");
}

newBtn.addEventListener("click", () => {});

copyBtn.addEventListener("click", async () => {});

const placeholderFacts = [
  "Bananas are berries, but strawberries aren’t.",
  "Honey never spoils—edible honey has been found in ancient tombs.",
  "Octopuses have three hearts.",
  "Hot water can freeze faster than cold under certain conditions (Mpemba effect).",
];

function randomLocalFact() {
  return placeholderFacts[Math.floor(Math.random() * placeholderFacts.length)];
}

// initial render
setFact(randomLocalFact());

// wire button to cycle placeholder for now
newBtn.addEventListener("click", () => {
  setStatus("Finding a new fact…");
  setTimeout(() => setFact(randomLocalFact()), 200);
});
