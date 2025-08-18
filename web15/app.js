// === Utilities ===
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const storeKey = "bookmark_manager_v1";

const uid = () => Math.random().toString(36).slice(2, 10);
const parseTags = (str) =>
  (str || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

const isValidUrl = (str) => {
  try {
    const u = new URL(str);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
};

const domainFromUrl = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};
const faviconUrl = (url) => {
  // Reliable, no-CORS favicon service
  const domain = domainFromUrl(url);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        domain
      )}&sz=64`
    : "";
};

const save = (items) => localStorage.setItem(storeKey, JSON.stringify(items));
const load = () => {
  const raw = localStorage.getItem(storeKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// === State ===
let items = load(); // [{id,title,url,tags:[],created,order}]
let editingId = null; // currently editing item id
let activeTag = null; // single-select tag filter

// === Elements ===
const formTitle = $("#formTitle");
const form = $("#bookmarkForm");
const titleInput = $("#titleInput");
const urlInput = $("#urlInput");
const tagsInput = $("#tagsInput");
const cancelEditBtn = $("#cancelEditBtn");
const formError = $("#formError");

const searchInput = $("#searchInput");
const sortSelect = $("#sortSelect");
const tagChips = $("#tagChips");
const countSpan = $("#countSpan");

const listEl = $("#bookmarkList");
const emptyState = $("#emptyState");

const exportBtn = $("#exportBtn");
const importFile = $("#importFile");
const clearAllBtn = $("#clearAllBtn");
// === Rendering ===
function render() {
  // Build filtered/sorted view
  const q = searchInput.value.trim().toLowerCase();
  const sort = sortSelect.value;

  let view = items.slice();

  if (q) {
    view = view.filter((it) => {
      const inTitle = it.title.toLowerCase().includes(q);
      const inUrl = it.url.toLowerCase().includes(q);
      const inTags = it.tags.join(" ").includes(q);
      return inTitle || inUrl || inTags;
    });
  }

  if (activeTag) {
    view = view.filter((it) => it.tags.includes(activeTag));
  }

  view.sort((a, b) => {
    switch (sort) {
      case "created_asc":
        return a.created - b.created;
      case "created_desc":
        return b.created - a.created;
      case "title_asc":
        return a.title.localeCompare(b.title);
      case "title_desc":
        return b.title.localeCompare(a.title);
      default:
        return (a.order ?? 0) - (b.order ?? 0);
    }
  });

  // Count & empty state
  countSpan.textContent = String(view.length);
  emptyState.style.display = view.length ? "none" : "block";

  // List
  listEl.innerHTML = "";
  const tpl = $("#bookmarkItemTemplate");
  view.forEach((it) => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    li.dataset.id = it.id;

    // Title & link
    const titleA = $(".bm-title", li);
    titleA.textContent = it.title || it.url;
    titleA.href = it.url;

    const urlA = $(".bm-url", li);
    urlA.textContent = it.url;
    urlA.href = it.url;

    // Favicon
    const fav = $(".bm-favicon", li);
    fav.src = faviconUrl(it.url);
    fav.alt = `${domainFromUrl(it.url)} favicon`;

    // Tags
    const tagsWrap = $(".bm-tags", li);
    tagsWrap.innerHTML = "";
    it.tags.forEach((t) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = `#${t}`;
      span.role = "button";
      span.tabIndex = 0;
      span.addEventListener("click", () => toggleTagFilter(t));
      span.addEventListener("keypress", (e) => {
        if (e.key === "Enter") toggleTagFilter(t);
      });
      tagsWrap.appendChild(span);
    });

    // Actions
    $(".editBtn", li).addEventListener("click", () => beginEdit(it.id));
    $(".deleteBtn", li).addEventListener("click", () => remove(it.id));

    // DnD
    li.addEventListener("dragstart", onDragStart);
    li.addEventListener("dragover", onDragOver);
    li.addEventListener("drop", onDrop);

    listEl.appendChild(li);
  });

  renderTagChips();
}

function renderTagChips() {
  // Unique tags
  const tags = Array.from(new Set(items.flatMap((x) => x.tags))).sort();
  tagChips.innerHTML = "";
  if (!tags.length) return;

  const all = document.createElement("button");
  all.className = `chip ${activeTag ? "" : "active"}`;
  all.textContent = "All";
  all.addEventListener("click", () => {
    activeTag = null;
    render();
  });
  tagChips.appendChild(all);

  tags.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = `chip ${activeTag === t ? "active" : ""}`;
    btn.textContent = `#${t}`;
    btn.addEventListener("click", () => {
      activeTag = activeTag === t ? null : t;
      render();
    });
    tagChips.appendChild(btn);
  });
}

// === CRUD ===
function add({ title, url, tags }) {
  const item = {
    id: uid(),
    title: title.trim(),
    url: url.trim(),
    tags: tags,
    created: Date.now(),
    order: items.length ? Math.max(...items.map((i) => i.order ?? 0)) + 1 : 1,
  };
  items.push(item);
  save(items);
  render();
}

function update(id, { title, url, tags }) {
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  items[idx] = { ...items[idx], title: title.trim(), url: url.trim(), tags };
  save(items);
  render();
}

function remove(id) {
  if (!confirm("Delete this bookmark?")) return;
  items = items.filter((i) => i.id !== id);
  save(items);
  render();
}
// === Edit state ===
function beginEdit(id) {
  const it = items.find((i) => i.id === id);
  if (!it) return;
  editingId = id;
  formTitle.textContent = "Edit Bookmark";
  titleInput.value = it.title;
  urlInput.value = it.url;
  tagsInput.value = it.tags.join(", ");
  cancelEditBtn.hidden = false;
  titleInput.focus();
}

function endEdit() {
  editingId = null;
  formTitle.textContent = "Add Bookmark";
  form.reset();
  cancelEditBtn.hidden = true;
  formError.textContent = "";
}

// === Form handling ===
form.addEventListener("submit", (e) => {
  e.preventDefault();
  formError.textContent = "";

  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  const tags = parseTags(tagsInput.value);

  if (!title) {
    formError.textContent = "Title is required.";
    return;
  }
  if (!isValidUrl(url)) {
    formError.textContent = "Please enter a valid http(s) URL.";
    return;
  }

  if (editingId) {
    update(editingId, { title, url, tags });
  } else {
    add({ title, url, tags });
  }

  endEdit();
});

cancelEditBtn.addEventListener("click", endEdit);

// === Search / Sort ===
searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);

function toggleTagFilter(t) {
  activeTag = activeTag === t ? null : t;
  render();
}

// === Drag & Drop reorder ===
let dragId = null;

function onDragStart(e) {
  const li = e.currentTarget;
  dragId = li.dataset.id;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragId);
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const over = e.currentTarget;
  over.style.outline = "2px dashed var(--accent)";
}

function onDrop(e) {
  e.preventDefault();
  $$(".bm-item", listEl).forEach((li) => (li.style.outline = ""));
  const targetId = e.currentTarget.dataset.id;
  if (!dragId || dragId === targetId) return;

  // Recalculate 'order' by swapping
  const a = items.find((i) => i.id === dragId);
  const b = items.find((i) => i.id === targetId);
  const tmp = a.order;
  a.order = b.order;
  b.order = tmp;

  save(items);
  render();
  dragId = null;
}

listEl.addEventListener("dragleave", (e) => {
  if (e.target.classList?.contains("bm-item")) e.target.style.outline = "";
});

// === Import / Export / Clear ===
exportBtn.addEventListener("click", () => {
  const data = JSON.stringify(items, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importFile.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error("Invalid import format.");
    // Normalize
    const now = Date.now();
    items = data
      .map((d, i) => ({
        id: d.id || uid(),
        title: String(d.title || d.url || "Untitled"),
        url: String(d.url || ""),
        tags: Array.isArray(d.tags)
          ? d.tags.map((t) => String(t).toLowerCase())
          : [],
        created: Number(d.created) || now + i,
        order: Number(d.order) || i + 1,
      }))
      .filter((d) => isValidUrl(d.url));
    save(items);
    render();
  } catch (err) {
    alert("Failed to import: " + err.message);
  } finally {
    importFile.value = "";
  }
});

clearAllBtn.addEventListener("click", () => {
  if (!items.length) return;
  if (
    !confirm(
      "This will permanently remove all bookmarks from this browser. Continue?"
    )
  )
    return;
  items = [];
  save(items);
  render();
});

// === Kickoff ===
render();
