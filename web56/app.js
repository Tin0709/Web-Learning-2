/* =======================================================
   Recipe Finder — TheMealDB (No API key required)
   Features: Search by name/ingredient, details modal,
             favorites (localStorage), toast messages.
   ======================================================= */

const EL = {
  tabSearch: document.getElementById("tab-search"),
  tabFavs: document.getElementById("tab-favorites"),
  panelSearch: document.getElementById("panel-search"),
  panelFavs: document.getElementById("panel-favorites"),

  form: document.getElementById("search-form"),
  query: document.getElementById("query"),
  btnClear: document.getElementById("btn-clear"),
  status: document.getElementById("status"),
  results: document.getElementById("results"),

  favsGrid: document.getElementById("favorites-grid"),
  favsEmpty: document.getElementById("favorites-empty"),
  btnClearFavs: document.getElementById("btn-clear-favs"),

  modal: document.getElementById("meal-modal"),
  modalClose: document.getElementById("modal-close"),
  modalContent: document.getElementById("modal-content"),

  toast: document.getElementById("toast"),
};
const API = {
  searchByName: (q) =>
    `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
      q
    )}`,
  searchByIngredient: (ing) =>
    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(
      ing
    )}`,
  lookup: (id) =>
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(
      id
    )}`,
};

const LS_KEY = "recipe_favorites_v1";

/* ----------------- Helpers ----------------- */
function setStatus(msg = "") {
  EL.status.textContent = msg;
}

function toast(msg) {
  EL.toast.textContent = msg;
  EL.toast.classList.add("show");
  setTimeout(() => EL.toast.classList.remove("show"), 1600);
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
}

function setFavorites(ids) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

function isFavorite(id) {
  return getFavorites().includes(String(id));
}

function toggleFavorite(id, title) {
  const favs = getFavorites();
  const sid = String(id);
  const idx = favs.indexOf(sid);
  if (idx >= 0) {
    favs.splice(idx, 1);
    toast(`Removed “${title}” from favorites`);
  } else {
    favs.push(sid);
    toast(`Saved “${title}” to favorites`);
  }
  setFavorites(favs);
  // Update favorites panel and any visible fav buttons
  renderFavorites();
  document.querySelectorAll(`[data-fav-toggle="${sid}"]`).forEach((btn) => {
    btn.classList.toggle("primary", isFavorite(sid));
    btn.textContent = isFavorite(sid) ? "♥ Favorited" : "♡ Favorite";
    btn.setAttribute("aria-pressed", isFavorite(sid) ? "true" : "false");
  });
}
