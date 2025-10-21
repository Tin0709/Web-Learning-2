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
