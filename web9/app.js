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

async function getRandomFactFromApi({ timeoutMs = 6000 } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // cache-bust param to reduce stale responses
    const url = `https://uselessfacts.jsph.pl/api/v2/facts/random?timestamp=${Date.now()}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // API returns { id, text, source, ... }
    return data.text?.trim();
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

// initial load now uses API
showNewFact();

// rewire button to API path
newBtn.replaceWith(newBtn.cloneNode(true)); // remove duplicate listeners if any
document.getElementById("newFactBtn").addEventListener("click", showNewFact);

// copy now works on current fact
copyBtn.replaceWith(copyBtn.cloneNode(true));
document.getElementById("copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(factEl.textContent.trim());
    setStatus("Copied to clipboard!");
    setTimeout(() => setStatus(""), 1200);
  } catch {
    setStatus("Copy failed. You can select and copy manually.");
  }
});
