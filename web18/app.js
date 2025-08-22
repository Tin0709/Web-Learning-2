// Simple hash router + markdown renderer + search + theme toggle

const $ = (sel) => document.querySelector(sel);
const app = $("#app");
const searchInput = $("#search");
const themeToggle = $("#themeToggle");

const state = {
  postsIndex: [], // from posts/posts.json
  filtered: [], // search results
  theme:
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"),
};

// Apply initial theme
document.documentElement.classList.toggle("dark", state.theme === "dark");
$("#year").textContent = new Date().getFullYear();

// Configure marked + highlight.js
document.addEventListener("DOMContentLoaded", () => {
  if (window.marked) {
    marked.setOptions({
      breaks: true,
      highlight: function (code, lang) {
        try {
          if (window.hljs && lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          } else if (window.hljs) {
            return hljs.highlightAuto(code).value;
          }
        } catch (e) {}
        return code; // fallback without highlighting
      },
    });
  }
});

async function fetchIndex() {
  const res = await fetch("posts/posts.json");
  if (!res.ok) throw new Error("Failed to load posts index");
  const data = await res.json();
  // Normalize + sort by date desc
  const normalized = data
    .map((p) => ({
      ...p,
      date: new Date(p.date),
    }))
    .sort((a, b) => b.date - a.date);
  state.postsIndex = normalized;
  state.filtered = normalized;
}

function formatDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderList(posts) {
  app.innerHTML =
    `
    <section aria-label="Post list">
      ${posts
        .map(
          (p) => `
        <article class="post-card">
          <h2><a href="#/post/${encodeURIComponent(p.slug)}">${p.title}</a></h2>
          <p class="post-meta">${formatDate(p.date)} · ${
            p.tags?.join(", ") || ""
          }</p>
          <p>${p.description || ""} <a href="#/post/${encodeURIComponent(
            p.slug
          )}">Read →</a></p>
        </article>
      `
        )
        .join("")}
    </section>
  ` || `<p>No posts yet.</p>`;
}

async function renderPost(slug) {
  const post = state.postsIndex.find((p) => p.slug === slug);
  if (!post) {
    app.innerHTML = `<p>Post not found. <a href="#/">Go back</a></p>`;
    return;
  }
  const res = await fetch(`posts/${post.slug}.md`);
  const md = await res.text();

  const html = window.marked
    ? marked.parse(md)
    : `<pre>${md.replace(
        /[&<>]/g,
        (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[s])
      )}</pre>`;
  app.innerHTML = `
    <article class="post-content">
      <a href="#/">← Back</a>
      <h1>${post.title}</h1>
      <p class="post-meta">${formatDate(post.date)} · ${
    post.tags?.join(", ") || ""
  }</p>
      <div class="md-body">${html}</div>
    </article>
  `;

  // Re-run highlight.js on dynamic content
  if (window.hljs) {
    document
      .querySelectorAll("pre code")
      .forEach((block) => hljs.highlightElement(block));
  }
}

function handleSearch(value) {
  const q = value.trim().toLowerCase();
  if (!q) {
    state.filtered = state.postsIndex;
  } else {
    state.filtered = state.postsIndex.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }
  renderList(state.filtered);
}

// Basic hash router
function router() {
  const hash = location.hash || "#/";
  const [, route, param] = hash.split("/");
  if (route === "" || route === "#") {
    renderList(state.filtered);
  } else if (route === "post" && param) {
    renderPost(decodeURIComponent(param));
  } else {
    app.innerHTML = `<p>Not found. <a href="#/">Home</a></p>`;
  }
}

window.addEventListener("hashchange", router);

searchInput.addEventListener("input", (e) => handleSearch(e.target.value));

themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", state.theme);
  document.documentElement.classList.toggle("dark", state.theme === "dark");
});

// Boot
(async function init() {
  try {
    await fetchIndex();
  } catch (e) {
    app.innerHTML = `<p>Failed to load posts. Make sure you're serving files over HTTP (not file://).<br>${e.message}</p>`;
    return;
  }
  router();
})();
