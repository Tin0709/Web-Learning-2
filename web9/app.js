// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Elements
const factEl = document.getElementById("fact");
const statusEl = document.getElementById("status");
const newBtn = document.getElementById("newFactBtn");
const copyBtn = document.getElementById("copyBtn");

// Helpers
function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function setFact(text) {
  factEl.textContent = text;
  setStatus("");
}

// Local fallback facts
const placeholderFacts = [
  "Bananas are berries, but strawberries aren’t.",
  "Honey never spoils—edible honey has been found in ancient tombs.",
  "Octopuses have three hearts.",
  "Hot water can freeze faster than cold under certain conditions (Mpemba effect).",
];

function randomLocalFact() {
  return placeholderFacts[Math.floor(Math.random() * placeholderFacts.length)];
}

// API fetcher with timeout + cache-bust
async function getRandomFactFromApi({ timeoutMs = 6000 } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://uselessfacts.jsph.pl/api/v2/facts/random?timestamp=${Date.now()}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.text || "").trim();
  } finally {
    clearTimeout(id);
  }
}

async function showNewFact() {
  setStatus("Fetching a random fact…");
  try {
    const apiFact = await getRandomFactFromApi().catch(() => null);
    const fact = apiFact || randomLocalFact();
    setFact(fact);
  } catch (err) {
    console.error(err);
    setStatus("Could not load a new fact. Using a local one.");
    setFact(randomLocalFact());
  }
}

// Initial load
showNewFact();

// Events
newBtn.addEventListener("click", showNewFact);

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(factEl.textContent.trim());
    setStatus("Copied to clipboard!");
    setTimeout(() => setStatus(""), 1200);
  } catch {
    setStatus("Copy failed. You can select and copy manually.");
  }
});
