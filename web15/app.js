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
