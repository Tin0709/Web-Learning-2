/* ===========================
   🔑 SET YOUR TMDB API KEY
   ===========================
   1) Create a (free) TMDB account → https://www.themoviedb.org/
   2) Go to Settings → API → create a v3 API key
   3) Paste it below (string)
*/
const TMDB_API_KEY = "YOUR_TMDB_API_KEY_HERE"; // <- replace this!

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600'><rect width='100%' height='100%' fill='#0f172a'/><text x='50%' y='50%' fill='#9aa4b2' font-size='20' font-family='sans-serif' text-anchor='middle'>No Image</text></svg>`
  );
const qs = (s) => document.querySelector(s);
const resultsEl = qs("#results");
const pageInfoEl = qs("#pageInfo");
const prevBtn = qs("#prevBtn");
const nextBtn = qs("#nextBtn");
const searchInput = qs("#searchInput");
const typeSelect = qs("#typeSelect");
const sortSelect = qs("#sortSelect");
const yearInput = qs("#yearInput");
const clearBtn = qs("#clearBtn");
const watchlistBtn = qs("#watchlistBtn");
const detailsModal = qs("#detailsModal");
const modalContent = qs("#modalContent");
const closeModalBtn = qs("#closeModal");
const watchlistModal = qs("#watchlistModal");
const closeWatchlistBtn = qs("#closeWatchlist");
const watchlistGrid = qs("#watchlistGrid");

let state = {
  mode: "trending", // "trending" | "search" | "discover"
  type: "multi", // multi | movie | tv
  query: "",
  page: 1,
  totalPages: 1,
  year: "",
  sort: "popularity.desc",
  items: [],
};

const WATCHLIST_KEY = "tmdb_watchlist_v1";
/* ---------- Utilities ---------- */
function withKey(url, params = {}) {
  const usp = new URLSearchParams({ api_key: TMDB_API_KEY, ...params });
  return `${BASE}${url}?${usp.toString()}`;
}
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Network error");
  return res.json();
}
const debounce = (fn, ms = 400) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};
const mediaTitle = (it) =>
  it.title || it.name || it.original_title || it.original_name || "Untitled";
const datePart = (it) =>
  (it.release_date || it.first_air_date || "").slice(0, 4);
const posterUrl = (path) => (path ? `${IMG}${path}` : PLACEHOLDER);

function formatRuntime(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return `${h}h ${m}m`;
}

/* ---------- Watchlist ---------- */
function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveWatchlist(list) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
}
function inWatchlist(item) {
  const list = getWatchlist();
  return list.some(
    (x) => x.id === item.id && x.media_type === (item.media_type || state.type)
  );
}
function toggleWatchlist(item) {
  const media_type = item.media_type || state.type;
  let list = getWatchlist();
  const idx = list.findIndex(
    (x) => x.id === item.id && x.media_type === media_type
  );
  if (idx >= 0) list.splice(idx, 1);
  else
    list.unshift({
      id: item.id,
      title: mediaTitle(item),
      poster_path: item.poster_path,
      media_type,
    });
  saveWatchlist(list);
}
