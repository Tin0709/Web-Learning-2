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

function updateLoadMore() {
  const btn = $("#loadMoreBtn");
  const hasMore = state.page < state.totalPages;
  btn.hidden = !hasMore || state.tab === "favorites";
}

function setLoading(flag) {
  state.loading = flag;
  $("#loadMoreBtn").disabled = flag;
}

/* ========= MODAL ========= */
async function openDetails(id) {
  try {
    const modal = $("#detailsModal");
    const closeBtn = $("#closeModal");
    setStatus("Loading details…");
    const data = await fetchDetails(id);
    setStatus("");

    // Poster
    const poster = $("#modalPoster");
    poster.style.backgroundImage = data.poster_path
      ? `url(${posterUrl(data.poster_path, BIG_POSTER_SIZE)})`
      : "none";

    // Content
    $("#modalTitle").textContent = data.title;
    const year = (data.release_date || "").slice(0, 4) || "—";
    const runtime = data.runtime ? `${data.runtime} min` : "—";
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "—";
    $("#modalMeta").textContent = `${year} · ${runtime} · ⭐ ${rating}`;
    $("#modalOverview").textContent = data.overview || "No overview.";
    const genres = $("#modalGenres");
    genres.innerHTML = "";
    (data.genres || []).forEach((g) => {
      const chip = create("span", "chip");
      chip.textContent = g.name;
      genres.appendChild(chip);
    });

    // External links
    const imdbLink = $("#modalIMDB");
    if (data.external_ids && data.external_ids.imdb_id) {
      imdbLink.href = `https://www.imdb.com/title/${data.external_ids.imdb_id}/`;
      imdbLink.hidden = false;
    } else imdbLink.hidden = true;

    // Trailer (YouTube)
    const trailer = (data.videos?.results || []).find(
      (v) => v.site === "YouTube" && v.type.includes("Trailer")
    );
    const trailerBtn = $("#modalTrailer");
    if (trailer) {
      trailerBtn.href = `https://www.youtube.com/watch?v=${trailer.key}`;
      trailerBtn.hidden = false;
    } else trailerBtn.hidden = true;

    // Favorite button
    const favBtn = $("#modalFavorite");
    updateFavButton(favBtn, isFav(data.id));
    favBtn.onclick = () => {
      toggleFav(slimMovie(data));
      updateFavButton(favBtn, isFav(data.id));
      // re-render current grid to reflect badge
      refreshTab();
    };

    // Open modal
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");

    // close handlers
    closeBtn.onclick = () => modal.close();
    modal.addEventListener(
      "click",
      (e) => {
        const rect = modal.querySelector(".modal-body").getBoundingClientRect();
        const clickedOutside =
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom;
        if (clickedOutside) modal.close();
      },
      { once: true }
    );
  } catch (err) {
    console.error(err);
    setStatus("Failed to load details.");
  }
}

function updateFavButton(btn, active) {
  btn.textContent = active ? "Remove from Favorites" : "Add to Favorites";
  btn.classList.toggle("ghost", active);
}

// reduce movie object to essentials for favorites storage
function slimMovie(m) {
  return {
    id: m.id,
    title: m.title,
    name: m.name,
    poster_path: m.poster_path,
    release_date: m.release_date,
    vote_average: m.vote_average,
  };
}

/* ========= TAB / DATA FLOW ========= */
async function loadInitial() {
  // default: trending
  state.tab = "discover";
  state.query = "";
  state.page = 1;
  await runDiscover();
}

async function runDiscover({ append = false } = {}) {
  try {
    setLoading(true);
    setStatus(
      state.query ? `Searching “${state.query}”…` : "Loading trending…"
    );
    const data = state.query
      ? await fetchSearch(state.query, state.page)
      : await fetchDiscover(state.page);

    state.totalPages = Math.min(data.total_pages || 1, 500); // TMDB caps at 500
    if (state.page === 1 && !append) state.items = data.results || [];
    else state.items = state.items.concat(data.results || []);

    renderMovies(state.items, { append });
    updateLoadMore();
    const total = data.total_results ?? state.items.length;
    setStatus(
      `${state.query ? "Results" : "Trending"} · Page ${state.page} of ${
        state.totalPages
      } · ${total} total`
    );
  } catch (err) {
    console.error(err);
    setStatus("Something went wrong. Check your API key or network.");
  } finally {
    setLoading(false);
  }
}

function showFavorites() {
  const favs = Object.values(state.favorites);
  state.items = favs;
  renderMovies(favs);
  $("#loadMoreBtn").hidden = true;
  setStatus(`Favorites · ${favs.length} item${favs.length === 1 ? "" : "s"}`);
}

function refreshTab() {
  if (state.tab === "favorites") showFavorites();
  else renderMovies(state.items);
}

/* ========= EVENTS ========= */
document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document
        .querySelectorAll(".tab")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      state.tab = tab;

      if (tab === "favorites") {
        $("#searchInput").value = "";
        state.query = "";
        showFavorites();
      } else {
        // Back to discover
        state.page = 1;
        await runDiscover({ append: false });
      }
    });
  });

  // Search
  $("#searchForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("#searchInput").value.trim();
    state.query = q;
    state.page = 1;
    await runDiscover({ append: false });
  });

  // Load more
  $("#loadMoreBtn").addEventListener("click", async () => {
    if (state.loading) return;
    state.page += 1;
    await runDiscover({ append: true });
  });

  // Modal close button wired in openDetails

  // Start
  loadInitial();
});
