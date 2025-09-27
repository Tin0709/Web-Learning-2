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

/* ---------- Render cards ---------- */
function render(items) {
  resultsEl.innerHTML = items
    .map((it) => {
      const title = mediaTitle(it);
      const year = datePart(it);
      const rating = it.vote_average ? it.vote_average.toFixed(1) : "—";
      const mt = it.media_type || state.type;
      const wlActive = inWatchlist(it);

      return `
        <article class="card" data-id="${it.id}" data-type="${mt}">
          <img class="poster" src="${posterUrl(
            it.poster_path
          )}" alt="${title} poster" loading="lazy" />
          <div class="card-body">
            <h3 class="title" title="${title}">${title}</h3>
            <div class="meta">
              <span class="tag">${mt.toUpperCase()}</span>
              <span>${year || ""}</span>
              <span>★ ${rating}</span>
            </div>
            <div class="actions">
              <button class="icon-btn watch-btn" data-active="${wlActive}" title="Toggle watchlist">⭐</button>
              <button class="btn details-btn">Details</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  // wire up buttons
  resultsEl.querySelectorAll(".details-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      openDetails(+card.dataset.id, card.dataset.type);
    });
  });
  resultsEl.querySelectorAll(".watch-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      const item = state.items.find((x) => x.id === +card.dataset.id);
      toggleWatchlist({ ...item, media_type: card.dataset.type });
      btn.setAttribute(
        "data-active",
        btn.getAttribute("data-active") !== "true"
      );
    });
  });
}
/* ---------- Pagination ---------- */
function setPagination(page, total) {
  state.page = page;
  state.totalPages = total;
  pageInfoEl.textContent = `Page ${page} of ${Math.min(total, 500)}`;
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= total || page >= 500; // TMDB caps at 500
}

/* ---------- Fetch flows ---------- */
async function loadTrending(page = 1) {
  state.mode = "trending";
  const url = withKey(`/trending/all/day`, { page });
  const data = await getJSON(url);
  state.items = data.results || [];
  render(state.items);
  setPagination(data.page, data.total_pages);
}

async function loadSearch(query, page = 1) {
  state.mode = "search";
  const type = state.type;
  const endpoint = type === "multi" ? "/search/multi" : `/search/${type}`;
  const params = { query, page, include_adult: false };
  const data = await getJSON(withKey(endpoint, params));
  const filtered = (data.results || []).filter(
    (r) => r.media_type !== "person"
  );
  state.items = filtered;
  render(state.items);
  setPagination(data.page, data.total_pages);
}

async function loadDiscover(page = 1) {
  state.mode = "discover";
  const type = state.type === "multi" ? "movie" : state.type; // TMDB needs a concrete type
  const params = { page, sort_by: state.sort };
  if (state.year) {
    if (type === "movie") params.primary_release_year = state.year;
    if (type === "tv") params.first_air_date_year = state.year;
  }
  const data = await getJSON(withKey(`/discover/${type}`, params));
  state.items = data.results.map((r) => ({ ...r, media_type: type }));
  render(state.items);
  setPagination(data.page, data.total_pages);
}
/* ---------- Details modal ---------- */
async function openDetails(id, mediaType) {
  const type = mediaType === "tv" ? "tv" : "movie";
  const data = await getJSON(
    withKey(`/${type}/${id}`, {
      append_to_response: "videos,credits",
    })
  );

  const title = mediaTitle(data);
  const year = datePart(data);
  const rating = data.vote_average ? data.vote_average.toFixed(1) : "—";
  const genres = (data.genres || [])
    .map((g) => `<span class="tag">${g.name}</span>`)
    .join("");
  const trailer = (data.videos?.results || []).find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
  const runtime =
    type === "movie"
      ? formatRuntime(data.runtime)
      : data.episode_run_time && data.episode_run_time[0]
      ? `${data.episode_run_time[0]}m (per ep)`
      : "—";
  const cast = (data.credits?.cast || [])
    .slice(0, 6)
    .map((c) => c.name)
    .join(", ");

  modalContent.innerHTML = `
      <div class="details">
        <img class="poster" src="${posterUrl(
          data.poster_path
        )}" alt="${title} poster" />
        <div>
          <h2 style="margin:0 0 6px 0">${title} ${year ? `(${year})` : ""}</h2>
          <div class="chips">${genres}</div>
          <p class="overview">${data.overview || "No overview available."}</p>
          <div class="info-grid">
            <div class="stat"><strong>Type:</strong> ${type.toUpperCase()}</div>
            <div class="stat"><strong>Rating:</strong> ★ ${rating}</div>
            <div class="stat"><strong>Runtime:</strong> ${runtime}</div>
            ${
              cast
                ? `<div class="stat"><strong>Cast:</strong> ${cast}</div>`
                : ""
            }
          </div>
          ${
            trailer
              ? `<p><a class="trailer" href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" rel="noreferrer">▶ Watch Trailer</a></p>`
              : ""
          }
        </div>
      </div>
    `;
  if (!detailsModal.open) detailsModal.showModal();
}

/* ---------- Watchlist modal ---------- */
function openWatchlist() {
  const list = getWatchlist();
  watchlistGrid.innerHTML = list.length
    ? list
        .map(
          (it) => `
          <article class="card" data-id="${it.id}" data-type="${it.media_type}">
            <img class="poster" src="${posterUrl(it.poster_path)}" alt="${
            it.title
          } poster" />
            <div class="card-body">
              <h3 class="title">${it.title}</h3>
              <div class="actions">
                <button class="icon-btn remove-btn" title="Remove">🗑</button>
                <button class="btn open-btn">Details</button>
              </div>
            </div>
          </article>
        `
        )
        .join("")
    : `<p style="color:#cfd6df; padding:0 18px 18px">Your watchlist is empty. Add items with the ⭐ button.</p>`;

  watchlistGrid.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      const id = +card.dataset.id,
        media_type = card.dataset.type;
      const listNow = getWatchlist().filter(
        (x) => !(x.id === id && x.media_type === media_type)
      );
      saveWatchlist(listNow);
      openWatchlist(); // re-render
    });
  });
  watchlistGrid.querySelectorAll(".open-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const card = e.target.closest(".card");
      await openDetails(+card.dataset.id, card.dataset.type);
      watchlistModal.close();
    });
  });

  if (!watchlistModal.open) watchlistModal.showModal();
}
