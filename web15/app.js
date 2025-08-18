// === Utilities ===
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const storeKey = "bookmark_manager_v1";

const uid = () => Math.random().toString(36).slice(2, 10);
const parseTags = (str) =>
  (str || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

const isValidUrl = (str) => {
  try {
    const u = new URL(str);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
};

const domainFromUrl = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};
const faviconUrl = (url) => {
  // Reliable, no-CORS favicon service
  const domain = domainFromUrl(url);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        domain
      )}&sz=64`
    : "";
};

const save = (items) => localStorage.setItem(storeKey, JSON.stringify(items));
const load = () => {
  const raw = localStorage.getItem(storeKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// === State ===
let items = load(); // [{id,title,url,tags:[],created,order}]
let editingId = null; // currently editing item id
let activeTag = null; // single-select tag filter

// === Elements ===
const formTitle = $("#formTitle");
const form = $("#bookmarkForm");
const titleInput = $("#titleInput");
const urlInput = $("#urlInput");
const tagsInput = $("#tagsInput");
const cancelEditBtn = $("#cancelEditBtn");
const formError = $("#formError");

const searchInput = $("#searchInput");
const sortSelect = $("#sortSelect");
const tagChips = $("#tagChips");
const countSpan = $("#countSpan");

const listEl = $("#bookmarkList");
const emptyState = $("#emptyState");

const exportBtn = $("#exportBtn");
const importFile = $("#importFile");
const clearAllBtn = $("#clearAllBtn");
