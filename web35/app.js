const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const form = $("#shortenForm");
const longUrlInput = $("#longUrl");
const shortenBtn = $("#shortenBtn");
const errorMsg = $("#errorMsg");

const resultWrap = $("#result");
const shortLinkEl = $("#shortLink");
const copyBtn = $("#copyBtn");
const shareBtn = $("#shareBtn");
const openBtn = $("#openBtn");
const qrImg = $("#qrImg");

const historyList = $("#historyList");
const emptyHistory = $("#emptyHistory");
const clearHistoryBtn = $("#clearHistoryBtn");
const themeToggle = $("#themeToggle");

const HISTORY_KEY = "shortenerHistory";
const THEME_KEY = "shortenerTheme";

/* ---------- Utilities ---------- */
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function setLoading(isLoading) {
  shortenBtn.disabled = isLoading;
  shortenBtn.textContent = isLoading ? "Shortening…" : "Shorten";
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = !msg;
}

function nowISO() {
  return new Date().toISOString();
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.max(1, Math.floor(diff / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function saveHistoryItem(item) {
  const list = loadHistory();
  list.unshift(item); // newest first
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 100)));
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function removeHistoryItem(id) {
  const list = loadHistory().filter((x) => x.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

/* ---------- API Calls ---------- */
async function shortenUrl(longUrl) {
  const endpoint = `https://is.gd/create.php?format=json&url=${encodeURIComponent(
    longUrl
  )}`;
  const res = await fetch(endpoint, { method: "GET" });
  if (!res.ok) throw new Error(`Network error (${res.status})`);
  const data = await res.json();
  if (data.errormessage) {
    throw new Error(data.errormessage);
  }
  return {
    short: data.shorturl,
    long: data.longurl || longUrl,
  };
}

/* ---------- UI Rendering ---------- */
function renderResult(short, long) {
  shortLinkEl.href = short;
  shortLinkEl.textContent = short;

  // Show share if supported
  const canShare = !!navigator.share;
  shareBtn.hidden = !canShare;

  // Set QR image
  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    short
  )}`;
  qrImg.src = qrURL;

  resultWrap.hidden = false;
}

function renderHistory() {
  const items = loadHistory();
  historyList.innerHTML = "";
  if (items.length === 0) {
    emptyHistory.hidden = false;
    return;
  }
  emptyHistory.hidden = true;

  const tpl = $("#historyItemTemplate");
  items.forEach((item) => {
    const li = tpl.content.cloneNode(true);
    const root = li.querySelector(".history-item");

    const shortA = root.querySelector(".short");
    const longDiv = root.querySelector(".long");
    const metaDiv = root.querySelector(".meta");
    const copy = root.querySelector(".copy");
    const share = root.querySelector(".share");
    const del = root.querySelector(".delete");
    const qr = root.querySelector(".qr");

    shortA.href = item.short;
    shortA.textContent = item.short;

    longDiv.textContent = item.long;
    longDiv.title = item.long;

    metaDiv.textContent = `Saved ${timeAgo(item.created)}`;

    // Buttons
    copy.addEventListener("click", () => copyToClipboard(item.short, copy));
    if (navigator.share) {
      share.hidden = false;
      share.addEventListener("click", async () => {
        try {
          await navigator.share({
            title: "Short link",
            url: item.short,
            text: item.long,
          });
        } catch {}
      });
    }

    del.addEventListener("click", () => {
      removeHistoryItem(item.id);
      renderHistory();
    });

    qr.addEventListener("click", () => {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
        item.short
      )}`;
      window.open(url, "_blank", "noopener");
    });

    historyList.appendChild(li);
  });
}

async function copyToClipboard(text, btnEl) {
  try {
    await navigator.clipboard.writeText(text);
    const prev = btnEl.textContent;
    btnEl.textContent = "✅";
    setTimeout(() => (btnEl.textContent = prev), 900);
  } catch {
    alert("Copy failed. Please copy manually:\n" + text);
  }
}

/* ---------- Theme ---------- */
function applyTheme(theme) {
  // theme: 'light' | 'dark' | 'auto'
  document.documentElement.dataset.theme = theme;
  // Optional: you could also add a class to body and style with it
}
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "auto";
  applyTheme(saved);
}
function toggleTheme() {
  const current = document.documentElement.dataset.theme || "auto";
  const next =
    current === "auto" ? "dark" : current === "dark" ? "light" : "auto";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  themeToggle.title = `Theme: ${next}`;
}

/* ---------- Events ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");

  const longUrl = longUrlInput.value.trim();
  if (!isValidUrl(longUrl)) {
    showError("Please enter a valid URL (include http:// or https://).");
    return;
  }

  setLoading(true);
  try {
    const { short, long } = await shortenUrl(longUrl);
    renderResult(short, long);
    // buttons
    copyBtn.onclick = () => copyToClipboard(short, copyBtn);
    openBtn.onclick = () => window.open(short, "_blank", "noopener");
    shareBtn.onclick = async () => {
      try {
        await navigator.share({ title: "Short link", url: short, text: long });
      } catch {}
    };

    // Save to history
    saveHistoryItem({
      id: crypto.randomUUID(),
      short,
      long,
      created: nowISO(),
    });
    renderHistory();
  } catch (err) {
    showError(err.message || "Failed to shorten the URL.");
  } finally {
    setLoading(false);
  }
});

clearHistoryBtn.addEventListener("click", () => {
  if (confirm("Clear all saved links?")) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
});

themeToggle.addEventListener("click", toggleTheme);

/* ---------- Init ---------- */
initTheme();
renderHistory();

// Improve UX: submit with Enter anywhere
longUrlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") form.requestSubmit();
});
