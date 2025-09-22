const STORAGE_KEY = "kanban-data-v1";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const state = {
  columns: [],
};
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.columns = [
      {
        id: uid("col"),
        title: "Backlog",
        cards: [
          { id: uid("card"), text: "Welcome! Click any title to edit." },
          { id: uid("card"), text: "Drag cards between columns ✨" },
        ],
      },
      {
        id: uid("col"),
        title: "In Progress",
        cards: [{ id: uid("card"), text: "Build Trello-style board" }],
      },
      {
        id: uid("col"),
        title: "Done",
        cards: [
          { id: uid("card"), text: "Persistent data in localStorage ✅" },
        ],
      },
    ];
    save();
  } else {
    try {
      Object.assign(state, JSON.parse(raw));
    } catch {
      state.columns = [];
    }
  }
}

const board = $("#board");
const columnTpl = $("#columnTemplate");
const cardTpl = $("#cardTemplate");
const promptDialog = $("#promptDialog");
const promptTitle = $("#promptTitle");
const promptInput = $("#promptInput");
const promptForm = $("#promptForm");
const confirmDialog = $("#confirmDialog");
const confirmTitle = $("#confirmTitle");
const confirmText = $("#confirmText");
const confirmForm = $("#confirmForm");
function promptText({ title, value = "", placeholder = "", select = true }) {
  promptTitle.textContent = title;
  promptInput.value = value;
  promptInput.placeholder = placeholder;
  promptDialog.showModal();
  if (select) {
    requestAnimationFrame(() => promptInput.select());
  }
  return new Promise((resolve) => {
    const onClose = (e) => {
      promptDialog.close();
      promptForm.removeEventListener("close", onClose);
    };
    promptForm.addEventListener("close", onClose);
    promptForm.onsubmit = (e) => {
      e.preventDefault();
    };
    promptDialog.addEventListener(
      "close",
      () => {
        resolve(
          promptDialog.returnValue === "ok" ? promptInput.value.trim() : null
        );
      },
      { once: true }
    );
  });
}
function confirmAction({
  title = "Are you sure?",
  text = "This cannot be undone.",
}) {
  confirmTitle.textContent = title;
  confirmText.textContent = text;
  confirmDialog.showModal();
  return new Promise((resolve) => {
    confirmDialog.addEventListener(
      "close",
      () => {
        resolve(confirmDialog.returnValue === "ok");
      },
      { once: true }
    );
  });
}
/* ---------- Rendering ---------- */

function render() {
  board.innerHTML = "";
  state.columns.forEach((col) => board.appendChild(renderColumn(col)));
  enableColumnDnD();
}

function renderColumn(col) {
  const node = columnTpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = col.id;

  const titleEl = $(".column-title", node);
  titleEl.textContent = col.title;
  titleEl.addEventListener("click", () => renameColumn(col.id));
  titleEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      renameColumn(col.id);
    }
  });

  $(".add-card", node).addEventListener("click", () => addCard(col.id));
  $(".add-card-inline", node).addEventListener("click", () => addCard(col.id));
  $(".delete-column", node).addEventListener("click", async () => {
    const ok = await confirmAction({
      title: "Delete column?",
      text: `Remove “${col.title}” and its ${col.cards.length} card(s)?`,
    });
    if (ok) {
      deleteColumn(col.id);
    }
  });

  const list = $(".card-list", node);
  list.dataset.columnId = col.id;

  col.cards.forEach((card) => list.appendChild(renderCard(col.id, card)));

  // Allow dropping into empty space
  list.addEventListener("dragover", handleDragOver);
  list.addEventListener("drop", handleDrop);
  list.addEventListener("dragleave", (e) => list.classList.remove("drag-over"));

  // Column drag handle
  node.addEventListener("dragstart", (e) => {
    if (e.target === node) {
      node.classList.add("dragging");
      e.dataTransfer.setData("text/column-id", col.id);
      e.dataTransfer.effectAllowed = "move";
    }
  });
  node.addEventListener("dragend", () => node.classList.remove("dragging"));

  return node;
}
