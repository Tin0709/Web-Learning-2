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
