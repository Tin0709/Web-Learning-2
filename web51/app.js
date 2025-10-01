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
