/* Mini Blog CMS - localStorage powered
   Features: CRUD, draft/published, search, tag filter, sorting, pagination,
   import/export JSON. No backend required.
*/

(() => {
  const STORAGE_KEY = "blogcms_posts_v1";

  // State
  let posts = loadPosts();
  let state = {
    search: "",
    status: "all",
    tag: "all",
    sort: "newest",
    perPage: 10,
    page: 1,
    editingId: null,
  };

  // Elements
  const postList = document.getElementById("postList");
  const emptyState = document.getElementById("emptyState");
  const paginationEl = document.getElementById("pagination");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  const template = document.getElementById("postItemTemplate");

  // Filters
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const tagFilter = document.getElementById("tagFilter");
  const sortSelect = document.getElementById("sortSelect");
  const perPageSelect = document.getElementById("perPageSelect");

  // Header actions
  const newPostBtn = document.getElementById("newPostBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");
  const clearBtn = document.getElementById("clearBtn");

  // Modal + editor fields
  const editorModal = document.getElementById("editorModal");
  const editorForm = document.getElementById("editorForm");
  const closeModalBtn = document.getElementById("closeModal");
  const modalTitle = document.getElementById("modalTitle");

  const titleInput = document.getElementById("titleInput");
  const slugInput = document.getElementById("slugInput");
  const statusSelectInput = document.getElementById("statusSelectInput");
  const tagsInput = document.getElementById("tagsInput");
  const coverInput = document.getElementById("coverInput");
  const dateInput = document.getElementById("dateInput");
  const contentInput = document.getElementById("contentInput");

  const savePostBtn = document.getElementById("savePostBtn");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const deletePostBtn = document.getElementById("deletePostBtn");

  // Utils
  function loadPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to parse posts", e);
      return [];
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }

  function uid() {
    return (
      "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    );
  }

  function slugify(s) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120);
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function nl2br(str) {
    return escapeHTML(str).replace(/\n/g, "<br>");
  }

  function toExcerpt(str, n = 200) {
    const clean = str.replace(/\s+/g, " ").trim();
    return clean.length > n ? clean.slice(0, n - 1) + "…" : clean;
  }

  function uniqueTags(allPosts) {
    const s = new Set();
    allPosts.forEach((p) => (p.tags || []).forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }

  // Seed example if empty (nice touch for first-time users)
  if (posts.length === 0) {
    posts.push({
      id: uid(),
      title: "Welcome to Mini Blog CMS",
      slug: "welcome-to-mini-blog-cms",
      status: "published",
      tags: ["welcome", "demo"],
      cover: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: Date.now(),
      content:
        "This is your first post. Click **Edit** to see how it works!\n\nTips:\n- Use the **Import/Export** buttons to back up your data.\n- Set **Draft** status to keep posts private.\n- Use **tags** and the search bar to filter posts.",
      excerpt: "This is your first post. Click Edit to see how it works!",
    });
    persist();
  }

  // Rendering
  function applyFilters() {
    const q = state.search.trim().toLowerCase();
    let arr = posts.slice();

    if (state.status !== "all") {
      arr = arr.filter((p) => p.status === state.status);
    }
    if (state.tag !== "all") {
      arr = arr.filter((p) => p.tags.includes(state.tag));
    }
    if (q) {
      arr = arr.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q)
      );
    }

    switch (state.sort) {
      case "newest":
        arr.sort(
          (a, b) =>
            (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt)
        );
        break;
      case "oldest":
        arr.sort(
          (a, b) =>
            (a.publishedAt || a.createdAt) - (b.publishedAt || b.createdAt)
        );
        break;
      case "az":
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "za":
        arr.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return arr;
  }

  function renderTagFilter() {
    const tags = uniqueTags(posts);
    tagFilter.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "All tags";
    tagFilter.appendChild(optAll);

    tags.forEach((t) => {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = t;
      tagFilter.appendChild(o);
    });

    tagFilter.value = state.tag;
  }

  function render() {
    const arr = applyFilters();
    const total = arr.length;

    emptyState.style.display = total === 0 ? "block" : "none";

    // Pagination
    const per = state.perPage;
    const pages = Math.max(1, Math.ceil(total / per));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * per;
    const pageItems = arr.slice(start, start + per);

    paginationEl.style.display = total > per ? "flex" : "none";
    pageInfo.textContent = `Page ${state.page} of ${pages} — ${total} post${
      total === 1 ? "" : "s"
    }`;
    prevPageBtn.disabled = state.page <= 1;
    nextPageBtn.disabled = state.page >= pages;

    postList.innerHTML = "";
    pageItems.forEach((p) => postList.appendChild(renderPostCard(p)));

    renderTagFilter();
  }

  function renderPostCard(p) {
    const node = template.content.cloneNode(true);
    const media = node.querySelector("[data-media]");
    const title = node.querySelector("[data-title]");
    const status = node.querySelector("[data-status]");
    const date = node.querySelector("[data-date]");
    const tags = node.querySelector("[data-tags]");
    const excerpt = node.querySelector("[data-excerpt]");
    const content = node.querySelector("[data-content]");
    const editBtn = node.querySelector("[data-edit]");
    const delBtn = node.querySelector("[data-delete]");

    if (p.cover) {
      media.style.backgroundImage = `url("${p.cover}")`;
    } else {
      media.style.backgroundImage = "linear-gradient(135deg,#1a2230,#0f141b)";
    }

    title.textContent = p.title || "(untitled)";
    status.textContent = p.status;
    status.style.background =
      p.status === "published"
        ? "linear-gradient(180deg,#27406b,#1e2a44)"
        : "linear-gradient(180deg,#4a2f34,#362128)";
    status.style.borderColor = "#0000";

    const d = p.publishedAt || p.createdAt;
    date.textContent = new Date(d).toLocaleString();

    tags.textContent = (p.tags || []).join(", ") || "—";

    excerpt.textContent = p.excerpt || toExcerpt(p.content);

    // Safe render: escape HTML, convert new lines to <br>
    content.innerHTML = nl2br(p.content);

    editBtn.addEventListener("click", () => openEditor(p.id));
    delBtn.addEventListener("click", () => deletePost(p.id));

    return node;
  }

  // Editor
  function openEditor(id = null) {
    state.editingId = id;

    if (id) {
      const p = posts.find((x) => x.id === id);
      modalTitle.textContent = "Edit Post";
      titleInput.value = p.title || "";
      slugInput.value = p.slug || "";
      statusSelectInput.value = p.status || "draft";
      tagsInput.value = (p.tags || []).join(", ");
      coverInput.value = p.cover || "";
      dateInput.value = p.publishedAt ? toDateInputValue(p.publishedAt) : "";
      contentInput.value = p.content || "";
      deletePostBtn.style.display = "inline-block";
    } else {
      modalTitle.textContent = "New Post";
      editorForm.reset();
      slugInput.value = "";
      deletePostBtn.style.display = "none";
    }

    if (typeof editorModal.showModal === "function") {
      editorModal.showModal();
    } else {
      // Safari fallback
      editorModal.setAttribute("open", "");
    }
  }

  function closeEditor() {
    state.editingId = null;
    if (editorModal.open) editorModal.close();
    else editorModal.removeAttribute("open");
  }

  function toDateInputValue(ms) {
    const d = new Date(ms);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function parseTags(input) {
    return input
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12); // reasonable cap
  }

  function upsertPost({ asDraft = false } = {}) {
    const now = Date.now();
    const title = titleInput.value.trim() || "Untitled";
    const slug = (slugInput.value.trim() || slugify(title)).replace(
      /^-+|-+$/g,
      ""
    );
    const status = asDraft ? "draft" : statusSelectInput.value || "draft";
    const tags = parseTags(tagsInput.value);
    const cover = coverInput.value.trim();
    const content = contentInput.value;
    const excerpt = toExcerpt(content);
    const dateVal = dateInput.value
      ? Date.parse(dateInput.value + "T00:00:00")
      : null;

    if (!/^[a-z0-9-]+$/.test(slug)) {
      alert("Slug may only contain lowercase letters, numbers, and hyphens.");
      return;
    }

    if (state.editingId) {
      const idx = posts.findIndex((p) => p.id === state.editingId);
      if (idx === -1) return;
      const prev = posts[idx];
      posts[idx] = {
        ...prev,
        title,
        slug,
        status,
        tags,
        cover,
        content,
        excerpt,
        updatedAt: now,
        publishedAt:
          status === "published"
            ? dateVal || prev.publishedAt || now
            : prev.publishedAt || null,
      };
    } else {
      const newPost = {
        id: uid(),
        title,
        slug,
        status,
        tags,
        cover,
        content,
        excerpt,
        createdAt: now,
        updatedAt: now,
        publishedAt: status === "published" ? dateVal || now : null,
      };
      posts.unshift(newPost);
    }

    persist();
    closeEditor();
    render();
  }

  function deletePost(id) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    posts = posts.filter((p) => p.id !== id);
    persist();
    render();
  }

  // Event wiring — header/filters
  newPostBtn.addEventListener("click", () => openEditor());
  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(posts, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `blogcms-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  importInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!Array.isArray(imported)) throw new Error("Invalid file format");
        // Basic validation + merge (avoid duplicate IDs)
        const byId = new Map(posts.map((p) => [p.id, p]));
        imported.forEach((p) => {
          if (p && p.id && typeof p.id === "string") {
            byId.set(p.id, { ...p });
          }
        });
        posts = Array.from(byId.values());
        persist();
        render();
        alert("Import complete.");
      } catch (err) {
        alert("Import failed: " + err.message);
      } finally {
        importInput.value = "";
      }
    };
    reader.readAsText(file);
  });

  clearBtn.addEventListener("click", () => {
    if (!confirm("This will remove ALL posts from localStorage. Proceed?"))
      return;
    posts = [];
    persist();
    render();
  });

  // Filters
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value;
    state.page = 1;
    render();
  });
  statusFilter.addEventListener("change", () => {
    state.status = statusFilter.value;
    state.page = 1;
    render();
  });
  tagFilter.addEventListener("change", () => {
    state.tag = tagFilter.value;
    state.page = 1;
    render();
  });
  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    state.page = 1;
    render();
  });
  perPageSelect.addEventListener("change", () => {
    state.perPage = parseInt(perPageSelect.value, 10) || 10;
    state.page = 1;
    render();
  });

  // Pagination
  prevPageBtn.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });
  nextPageBtn.addEventListener("click", () => {
    state.page = state.page + 1;
    render();
  });

  // Editor modal
  closeModalBtn.addEventListener("click", closeEditor);
  editorForm.addEventListener("submit", (e) => {
    e.preventDefault();
    upsertPost({ asDraft: false });
  });
  savePostBtn.addEventListener("click", (e) => {
    e.preventDefault();
    upsertPost({ asDraft: false });
  });
  saveDraftBtn.addEventListener("click", (e) => {
    e.preventDefault();
    statusSelectInput.value = "draft";
    upsertPost({ asDraft: true });
  });
  deletePostBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!state.editingId) return;
    deletePost(state.editingId);
    closeEditor();
  });

  // Auto-slug on title
  titleInput.addEventListener("input", () => {
    if (
      !state.editingId ||
      slugInput.value.trim() === "" ||
      slugInput.dataset.auto === "1"
    ) {
      slugInput.value = slugify(titleInput.value);
      slugInput.dataset.auto = "1";
    }
  });
  slugInput.addEventListener("input", () => {
    slugInput.dataset.auto = "0";
  });

  // Initial UI state
  searchInput.value = state.search;
  statusFilter.value = state.status;
  sortSelect.value = state.sort;
  perPageSelect.value = String(state.perPage);

  render();
})();
