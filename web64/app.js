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
/* ========= API CALLS ========= */
async function tmdb(path, params = {}) {
  const url = new URL(API_ROOT + path);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

async function fetchDiscover(page = 1) {
  return tmdb("/trending/movie/week", { page });
}

async function fetchSearch(query, page = 1) {
  return tmdb("/search/movie", { query, page, include_adult: "false" });
}

async function fetchDetails(id) {
  // append_to_response allows us to fetch extras in one go
  return tmdb(`/movie/${id}`, { append_to_response: "videos,external_ids" });
}

/* ========= RENDERING ========= */
function renderMovies(list, { append = false } = {}) {
  const grid = $("#grid");
  if (!append) grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = `<p class="muted">No movies found.</p>`;
    return;
  }

  const frag = document.createDocumentFragment();

  list.forEach((m) => {
    const card = create("article", "card");
    card.dataset.id = m.id;

    const img = create("img", "poster");
    img.alt = m.title || m.name || "Movie poster";
    img.loading = "lazy";
    img.src = posterUrl(m.poster_path) || "";
    if (!img.src) img.style.display = "none";

    const body = create("div", "card-body");
    const title = create("h3", "title");
    title.textContent = m.title || m.name || "(untitled)";

    const meta = create("p", "meta");
    const year = (m.release_date || "").slice(0, 4) || "—";
    const rating = m.vote_average ? m.vote_average.toFixed(1) : "—";
    meta.textContent = `${year} · ⭐ ${rating}`;

    body.append(title, meta);

    if (isFav(m.id)) {
      const fav = create("span", "fav-badge");
      fav.textContent = "★ Favorited";
      body.appendChild(fav);
    }

    card.append(img, body);
    frag.appendChild(card);

    // open details on click
    card.addEventListener("click", () => openDetails(m.id));
  });

  grid.appendChild(frag);
}
