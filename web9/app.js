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
