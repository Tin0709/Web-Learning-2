/* =========================
   Book Review Platform (no backend)
   - Stores in localStorage
   - CRUD + search/filter/sort
========================= */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const STORAGE_KEY = "book_reviews_v1";

const state = {
  reviews: [],
  filters: {
    query: "",
    minRating: 0,
    sortBy: "newest",
  },
  editingId: null,
};

// ------- Storage helpers -------
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.reviews = raw ? JSON.parse(raw) : demoSeed();
  } catch (e) {
    console.error("Failed to parse storage", e);
    state.reviews = [];
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reviews));
}

// ------- Demo seed (optional) -------
function demoSeed() {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt, David Thomas",
      cover: "https://images-na.ssl-images-amazon.com/images/I/41as+WafrFL.jpg",
      rating: 5,
      text: "Timeless advice. Short chapters, dense insight.",
      createdAt: now - 1000 * 60 * 60 * 24 * 4,
    },
    {
      id: crypto.randomUUID(),
      title: "Project Hail Mary",
      author: "Andy Weir",
      cover: "https://images-na.ssl-images-amazon.com/images/I/81k3+5n-KoL.jpg",
      rating: 4,
      text: "Fast, funny, and sciencey. Loved the problem solving.",
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
    },
  ];
}

// ------- UI wiring -------
const reviewForm = $("#reviewForm");
const cancelEditBtn = $("#cancelEdit");
const searchInput = $("#searchInput");
const minRating = $("#minRating");
const sortBy = $("#sortBy");
const clearAllBtn = $("#clearAll");
const resultsCount = $("#resultsCount");
const listEl = $("#reviewsList");
const template = $("#reviewCardTemplate");

function init() {
  load();
  bindForm();
  bindControls();
  render();
}

function bindForm() {
  reviewForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = $("#title").value.trim();
    const author = $("#author").value.trim();
    const cover = $("#cover").value.trim();
    const rating = parseInt(
      ($('input[name="rating"]:checked') || {}).value || 0,
      10
    );
    const text = $("#text").value.trim();

    if (!title || !author || !rating || !text) {
      alert("Please fill in title, author, rating, and review text.");
      return;
    }

    if (state.editingId) {
      // update
      const idx = state.reviews.findIndex((r) => r.id === state.editingId);
      if (idx !== -1) {
        state.reviews[idx] = {
          ...state.reviews[idx],
          title,
          author,
          cover,
          rating,
          text,
        };
      }
      state.editingId = null;
      $("#formTitle").textContent = "Add a Review";
      cancelEditBtn.classList.add("hidden");
    } else {
      // create
      state.reviews.unshift({
        id: crypto.randomUUID(),
        title,
        author,
        cover,
        rating,
        text,
        createdAt: Date.now(),
      });
    }

    save();
    reviewForm.reset();
    // clear any selected radio visually
    $$('input[name="rating"]').forEach((r) => (r.checked = false));
    render();
  });

  cancelEditBtn.addEventListener("click", () => {
    state.editingId = null;
    reviewForm.reset();
    $$('input[name="rating"]').forEach((r) => (r.checked = false));
    $("#formTitle").textContent = "Add a Review";
    cancelEditBtn.classList.add("hidden");
  });
}

function bindControls() {
  searchInput.addEventListener("input", (e) => {
    state.filters.query = e.target.value.toLowerCase();
    render();
  });
  minRating.addEventListener("change", (e) => {
    state.filters.minRating = parseInt(e.target.value, 10);
    render();
  });
  sortBy.addEventListener("change", (e) => {
    state.filters.sortBy = e.target.value;
    render();
  });
  clearAllBtn.addEventListener("click", () => {
    if (!state.reviews.length) return;
    const ok = confirm("This will delete ALL reviews. Continue?");
    if (ok) {
      state.reviews = [];
      save();
      render();
    }
  });
}

function render() {
  const filtered = state.reviews
    .filter((r) => {
      const q = state.filters.query;
      const hit = `${r.title} ${r.author}`.toLowerCase().includes(q);
      const passRating = r.rating >= state.filters.minRating;
      return hit && passRating;
    })
    .sort((a, b) => {
      switch (state.filters.sortBy) {
        case "oldest":
          return a.createdAt - b.createdAt;
        case "highest":
          return b.rating - a.rating || b.createdAt - a.createdAt;
        case "lowest":
          return a.rating - b.rating || b.createdAt - a.createdAt;
        case "newest":
        default:
          return b.createdAt - a.createdAt;
      }
    });

  resultsCount.textContent = `${filtered.length} review${
    filtered.length === 1 ? "" : "s"
  }`;

  listEl.innerHTML = "";
  if (!filtered.length) {
    listEl.innerHTML = `<p style="color:#9aa0b4">No reviews match your filters.</p>`;
    return;
  }

  for (const r of filtered) {
    const node = template.content.cloneNode(true);
    const card = $(".review-card", node);

    const img = $(".cover", node);
    if (r.cover) {
      img.src = r.cover;
      img.alt = `Cover of ${r.title}`;
    } else {
      img.remove();
      $(
        ".cover-wrap",
        node
      ).innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#6f7596;font-size:.9rem">No cover</div>`;
    }

    $(".book-title", node).textContent = r.title;
    $(".book-author", node).textContent = r.author;
    $(".rating", node).textContent =
      "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    $(".review-text", node).textContent = r.text;
    $(".date", node).textContent = new Date(r.createdAt).toLocaleString();

    // actions
    $(".edit", node).addEventListener("click", () => startEdit(r.id));
    $(".delete", node).addEventListener("click", () => deleteReview(r.id));

    listEl.appendChild(node);
  }
}

function startEdit(id) {
  const r = state.reviews.find((x) => x.id === id);
  if (!r) return;

  state.editingId = id;
  $("#formTitle").textContent = "Edit Review";
  $("#title").value = r.title;
  $("#author").value = r.author;
  $("#cover").value = r.cover || "";
  $("#text").value = r.text;
  const targetRadio = $(`input[name="rating"][value="${r.rating}"]`);
  if (targetRadio) targetRadio.checked = true;

  cancelEditBtn.classList.remove("hidden");
  $("#title").focus();
}

function deleteReview(id) {
  const r = state.reviews.find((x) => x.id === id);
  const ok = confirm(`Delete review for "${r?.title || "this book"}"?`);
  if (!ok) return;
  state.reviews = state.reviews.filter((x) => x.id !== id);
  save();
  render();
}

// Init
document.addEventListener("DOMContentLoaded", init);
