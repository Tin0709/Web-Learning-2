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
