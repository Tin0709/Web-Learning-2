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
EL.btnClear.addEventListener("click", () => {
  EL.query.value = "";
  EL.results.innerHTML = "";
  setStatus("");
  EL.query.focus();
});

/* ----------------- Render Cards ----------------- */
function renderMeals(meals, mode) {
  const html = meals
    .map((m) => {
      const id = m.idMeal;
      const title = m.strMeal;
      const img = m.strMealThumb;
      const cat = m.strCategory || "";
      const area = m.strArea || "";
      const categoryChip = cat
        ? `<span class="chip">${escapeHTML(cat)}</span>`
        : "";
      const areaChip = area
        ? `<span class="chip">${escapeHTML(area)}</span>`
        : "";

      return `
      <article class="card">
        <div class="card-thumb">
          <img src="${img}" alt="${escapeHTML(title)}" loading="lazy">
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHTML(title)}</h3>
          <div class="meta">${categoryChip}${areaChip}</div>
        </div>
        <div class="card-actions">
          <button class="btn primary" data-open="${id}">View</button>
          <button class="btn ${
            isFavorite(id) ? "primary" : ""
          }" data-fav-toggle="${id}" aria-pressed="${isFavorite(id)}">
            ${isFavorite(id) ? "♥ Favorited" : "♡ Favorite"}
          </button>
        </div>
      </article>
    `;
    })
    .join("");

  EL.results.innerHTML = html;

  // attach listeners
  EL.results.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () =>
      openMeal(btn.getAttribute("data-open"))
    );
  });
  EL.results.querySelectorAll("[data-fav-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-fav-toggle");
      const title =
        btn
          .closest(".card")
          .querySelector(".card-title")
          ?.textContent?.trim() || "Recipe";
      toggleFavorite(id, title);
    });
  });
}
/* ----------------- Modal (Details) ----------------- */
async function openMeal(id) {
  try {
    EL.modalContent.innerHTML =
      '<p class="muted" style="padding:16px">Loading…</p>';
    EL.modal.showModal();

    const res = await fetch(API.lookup(id));
    const data = await res.json();
    const meal = data.meals?.[0];
    if (!meal) {
      EL.modalContent.innerHTML =
        '<p style="padding:16px">Failed to load recipe.</p>';
      return;
    }

    const ingredients = collectIngredients(meal);
    const yt = meal.strYoutube
      ? `<p><a href="${meal.strYoutube}" target="_blank" rel="noopener">Watch on YouTube</a></p>`
      : "";
    const source = meal.strSource
      ? `<p><a href="${meal.strSource}" target="_blank" rel="noopener">Original Source</a></p>`
      : "";

    EL.modalContent.innerHTML = `
      <img class="modal-img" src="${meal.strMealThumb}" alt="${escapeHTML(
      meal.strMeal
    )}">
      <div>
        <h2 id="meal-title" style="margin:0 0 6px">${escapeHTML(
          meal.strMeal
        )}</h2>
        <p class="meta" style="margin: 0 0 10px">
          ${
            meal.strCategory
              ? `<span class="chip">${escapeHTML(meal.strCategory)}</span>`
              : ""
          }
          ${
            meal.strArea
              ? `<span class="chip">${escapeHTML(meal.strArea)}</span>`
              : ""
          }
        </p>

        <h3 style="margin: 8px 0 6px">Ingredients</h3>
        <div class="ingredients">
          ${ingredients
            .map((it) => `<div class="ingredient">${escapeHTML(it)}</div>`)
            .join("")}
        </div>

        <h3 style="margin: 10px 0 6px">Instructions</h3>
        <p style="white-space: pre-wrap; line-height: 1.6">${escapeHTML(
          meal.strInstructions || ""
        )}</p>

        ${yt}
        ${source}

        <div style="display:flex; gap:8px; margin-top:12px">
          <button class="btn ${
            isFavorite(meal.idMeal) ? "primary" : ""
          }" data-fav-toggle="${meal.idMeal}" aria-pressed="${isFavorite(
      meal.idMeal
    )}">
            ${isFavorite(meal.idMeal) ? "♥ Favorited" : "♡ Favorite"}
          </button>
          <button class="btn" id="modal-close-2">Close</button>
        </div>
      </div>
    `;

    // Attach internal buttons
    EL.modalContent
      .querySelector("[data-fav-toggle]")
      ?.addEventListener("click", () => {
        toggleFavorite(meal.idMeal, meal.strMeal);
      });
    EL.modalContent
      .querySelector("#modal-close-2")
      ?.addEventListener("click", closeModal);
  } catch (err) {
    console.error(err);
    EL.modalContent.innerHTML =
      '<p style="padding:16px">Something went wrong.</p>';
  }
}
