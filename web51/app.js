/* TinyBlog - zero backend blog using localStorage
 * Features: list + search + tag filter + view + comments + create/edit/delete posts
 */

const q = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

const store = {
  key: "tinyblog:v1",
  read() {
    try {
      return (
        JSON.parse(localStorage.getItem(this.key)) || {
          posts: [],
          comments: {},
        }
      );
    } catch {
      return { posts: [], comments: {} };
    }
  },
  write(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },
  seedIfEmpty() {
    const data = this.read();
    if (data.posts.length) return;
    const now = Date.now();
    data.posts = [
      {
        id: crypto.randomUUID(),
        title: "Welcome to TinyBlog",
        slug: "welcome-to-tinyblog",
        cover: "",
        tags: ["getting-started", "tinyblog"],
        content: `This is a lightweight blog that runs entirely in your browser.

- Create, edit, and delete posts
- Add **comments**
- Filter by tags & search
- Everything is saved in *localStorage* (no backend)

Tip: Click **+ New Post** to add your own article.`,
        createdAt: now - 1000 * 60 * 60 * 24 * 2,
        updatedAt: now - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: crypto.randomUUID(),
        title: "Styling with pure CSS",
        slug: "styling-with-pure-css",
        cover: "",
        tags: ["css", "design"],
        content: `CSS can look great without frameworks.

\`border-radius\`, soft shadows, and subtle gradients go a long way.

[MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference)`,
        createdAt: now - 1000 * 60 * 60 * 5,
        updatedAt: now - 1000 * 60 * 60 * 5,
      },
    ];
    data.comments = {};
    this.write(data);
  },
};

const state = {
  tagFilter: new Set(),
  search: "",
  currentPostId: null,
  editingId: null,
};

// ---------- Utils ----------
const fmtDate = (ts) => new Date(ts).toLocaleString();
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

function renderTagChips(allTags) {
  const wrap = q("#tagChips");
  wrap.innerHTML = "";
  [...allTags].sort().forEach((tag) => {
    const chip = el("button", "chip", `#${tag}`);
    if (state.tagFilter.has(tag)) chip.classList.add("active");
    chip.addEventListener("click", () => {
      if (state.tagFilter.has(tag)) state.tagFilter.delete(tag);
      else state.tagFilter.add(tag);
      drawHome();
    });
    wrap.appendChild(chip);
  });
}

function markdownLite(text) {
  // very small, safe-ish renderer (no HTML allowed)
  let t = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  t = t
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );
  return t;
}
