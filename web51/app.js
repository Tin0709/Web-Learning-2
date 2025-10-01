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

// ---------- Views ----------
function drawHome() {
  const data = store.read();
  const grid = q("#postsGrid");
  const empty = q("#emptyState");
  const home = q("#homeView");
  const postV = q("#postView");

  home.classList.remove("hidden");
  postV.classList.add("hidden");

  // gather tags
  const tagSet = new Set();
  data.posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  renderTagChips(tagSet);

  // filter
  let list = data.posts
    .filter((p) => {
      const text = (
        p.title +
        " " +
        p.content +
        " " +
        p.tags.join(" ")
      ).toLowerCase();
      const passSearch = state.search
        ? text.includes(state.search.toLowerCase())
        : true;
      const passTags = state.tagFilter.size
        ? p.tags.some((t) => state.tagFilter.has(t))
        : true;
      return passSearch && passTags;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  grid.innerHTML = "";
  if (!list.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  list.forEach((p) => {
    const card = el("article", "post-card card");
    const thumb = el("img", "thumb");
    thumb.alt = "";
    thumb.src =
      p.cover ||
      `data:image/svg+xml;base64,${btoa(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'><rect width='100%' height='100%' fill='#0f141e'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='28' fill='#8aa0b4'>${p.title.replace(
          /&/g,
          "&amp;"
        )}</text></svg>`
      )}`;
    const body = el("div", "body");
    const h3 = el("h3", null, `<a href="#/post/${p.slug}">${p.title}</a>`);
    const meta = el(
      "div",
      "meta",
      `<span>${fmtDate(p.updatedAt)}</span><span>•</span><span>${
        p.tags.map((t) => `#${t}`).join(" ") || "no-tags"
      }</span>`
    );
    const excerpt = el(
      "p",
      "muted",
      p.content.length > 140 ? p.content.slice(0, 140) + "…" : p.content
    );
    const tags = el(
      "div",
      "tags",
      p.tags.map((t) => `<span class="tag">#${t}</span>`).join("")
    );
    body.append(h3, meta, excerpt, tags);
    card.append(thumb, body);
    grid.append(card);
  });
}
function drawPost(slug) {
  const data = store.read();
  const post = data.posts.find((p) => p.slug === slug);
  const home = q("#homeView");
  const postV = q("#postView");
  const article = q("#postArticle");

  if (!post) {
    location.hash = "#/";
    return;
  }

  state.currentPostId = post.id;

  home.classList.add("hidden");
  postV.classList.remove("hidden");

  article.innerHTML = "";
  const h1 = el("h1", null, post.title);
  const meta = el(
    "div",
    "meta",
    `<span>${fmtDate(post.updatedAt)}</span><span>•</span><span>${post.tags
      .map((t) => `#${t}`)
      .join(" ")}</span>`
  );
  if (post.cover) {
    const img = el("img", "cover");
    img.src = post.cover;
    img.alt = "";
    article.append(img);
  }
  const content = el("div", "content");
  content.innerHTML = markdownLite(post.content);
  article.append(h1, meta, content);

  // buttons wiring
  q("#editPostBtn").onclick = () => openEditor(post.id);
  q("#deletePostBtn").onclick = () => {
    if (!confirm("Delete this post?")) return;
    const idx = data.posts.findIndex((p) => p.id === post.id);
    if (idx >= 0) {
      data.posts.splice(idx, 1);
      store.write(data);
    }
    location.hash = "#/";
  };

  renderComments();
}

function renderComments() {
  const data = store.read();
  const pid = state.currentPostId;
  const list = data.comments[pid] || [];
  const box = q("#commentsList");
  box.innerHTML = "";
  if (!list.length) {
    box.innerHTML = `<p class="muted">No comments yet. Be the first!</p>`;
    return;
  }
  list.forEach((c) => {
    const row = el("div", "comment");
    row.innerHTML = `
      <div><span class="author">${
        c.name || "Anonymous"
      }</span> <span class="when">• ${fmtDate(c.createdAt)}</span></div>
      <div>${markdownLite(c.body)}</div>
    `;
    box.append(row);
  });
}

// ---------- Editor ----------
function openEditor(postId) {
  const modal = q("#editorModal");
  const data = store.read();
  const editing = postId ? data.posts.find((p) => p.id === postId) : null;

  state.editingId = editing ? editing.id : null;
  q("#editorTitle").textContent = editing ? "Edit Post" : "New Post";
  q("#postTitle").value = editing ? editing.title : "";
  q("#postTags").value = editing ? editing.tags.join(", ") : "";
  q("#postCover").value = editing?.cover || "";
  q("#postContent").value = editing ? editing.content : "";
  q("#deleteInEditor").classList.toggle("hidden", !editing);
  q("#previewPane").classList.add("hidden");

  if (typeof modal.showModal === "function") modal.showModal();
  else modal.classList.remove("hidden");
}
