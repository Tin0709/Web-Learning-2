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
