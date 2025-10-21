/* ========= CONFIG ========= */
const API_KEY = "YOUR_TMDB_API_KEY"; // <-- replace with your TMDB key
const API_ROOT = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/";
const POSTER_SIZE = "w342"; // good balance for grids
const BIG_POSTER_SIZE = "w780";

const state = {
  tab: "discover", // "discover" | "favorites"
  query: "",
  page: 1,
  totalPages: 1,
  loading: false,
  items: [], // current list in UI
  favorites: loadFavorites(), // { [movieId]: movieObject }
};
/* ========= HELPERS ========= */
function $(sel, root = document) {
  return root.querySelector(sel);
}
function create(el, cls) {
  const n = document.createElement(el);
  if (cls) n.className = cls;
  return n;
}
function setStatus(msg) {
  $("#statusBar").textContent = msg || "";
}
function posterUrl(path, size = POSTER_SIZE) {
  return path ? `${IMG_BASE}${size}${path}` : "";
}
function truncate(str, n = 90) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}
function saveFavorites(obj) {
  localStorage.setItem("favorites.movies", JSON.stringify(obj));
}
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem("favorites.movies")) || {};
  } catch {
    return {};
  }
}
function isFav(id) {
  return Boolean(state.favorites[id]);
}
function toggleFav(movie) {
  if (isFav(movie.id)) {
    delete state.favorites[movie.id];
  } else {
    state.favorites[movie.id] = movie;
  }
  saveFavorites(state.favorites);
}
