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
/* ----------------- Tabs ----------------- */
function activateTab(tab) {
  const isSearch = tab === "search";
  EL.tabSearch.classList.toggle("active", isSearch);
  EL.tabFavs.classList.toggle("active", !isSearch);
  EL.tabSearch.setAttribute("aria-pressed", isSearch ? "true" : "false");
  EL.tabFavs.setAttribute("aria-pressed", !isSearch ? "true" : "false");

  EL.panelSearch.toggleAttribute("hidden", !isSearch);
  EL.panelFavs.toggleAttribute("hidden", isSearch);
  EL.panelSearch.classList.toggle("active", isSearch);
  EL.panelFavs.classList.toggle("active", !isSearch);

  if (!isSearch) renderFavorites();
}

EL.tabSearch.addEventListener("click", () => activateTab("search"));
EL.tabFavs.addEventListener("click", () => activateTab("favs"));

/* ----------------- Search ----------------- */
EL.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(EL.form);
  const q = (formData.get("query") || "").trim();
  const mode = formData.get("mode") || "name";

  EL.results.innerHTML = "";
  if (!q) {
    setStatus("Type something to search recipes…");
    return;
  }

  setStatus("Searching…");
  EL.form.querySelector('button[type="submit"]').disabled = true;

  try {
    let meals = null;

    if (mode === "name") {
      const res = await fetch(API.searchByName(q));
      const data = await res.json();
      meals = data.meals; // full data
    } else {
      const res = await fetch(API.searchByIngredient(q));
      const data = await res.json();
      meals = data.meals; // minimal data (id, name, thumb)
      // For consistent cards, we could fetch details lazily on click.
    }

    if (!meals) {
      setStatus("No recipes found. Try another keyword.");
      return;
    }
    renderMeals(meals, mode);
    setStatus(`Found ${meals.length} recipe${meals.length !== 1 ? "s" : ""}.`);
  } catch (err) {
    console.error(err);
    setStatus("Something went wrong. Please try again.");
  } finally {
    EL.form.querySelector('button[type="submit"]').disabled = false;
  }
});
