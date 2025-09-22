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
