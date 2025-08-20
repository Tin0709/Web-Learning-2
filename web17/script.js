/* ===== Utilities ===== */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const fmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: guessCurrency(),
});
function guessCurrency() {
  // Quick locale -> currency best-effort
  try {
    const region =
      Intl.DateTimeFormat().resolvedOptions().locale.split("-")[1] || "US";
    const map = {
      VN: "VND",
      US: "USD",
      GB: "GBP",
      EU: "EUR",
      FR: "EUR",
      DE: "EUR",
      IN: "INR",
      JP: "JPY",
      KR: "KRW",
      AU: "AUD",
      CA: "CAD",
      SG: "SGD",
    };
    return map[region] || "USD";
  } catch {
    return "USD";
  }
}
const uid = () => Math.random().toString(36).slice(2, 10);
/* ===== State ===== */
const STORAGE_KEY = "budget.tracker.v1";
let state = {
  transactions: [],
  filters: { month: "", category: "all", search: "", sortBy: "date_desc" },
  theme:
    localStorage.getItem("budget.theme") ||
    (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"),
};

/* ===== Elements ===== */
const txForm = $("#txForm");
const typeInput = $("#type");
const categoryInput = $("#category");
const amountInput = $("#amount");
const dateInput = $("#date");
const noteInput = $("#note");

const balanceEl = $("#balance");
const incomeEl = $("#totalIncome");
const expenseEl = $("#totalExpense");

const monthFilter = $("#monthFilter");
const categoryFilter = $("#categoryFilter");
const searchFilter = $("#searchFilter");
const sortBy = $("#sortBy");

const txBody = $("#txBody");
const txCount = $("#txCount");
const rowTemplate = $("#rowTemplate");

const clearAllBtn = $("#clearAll");
const exportBtn = $("#exportBtn");
const importInput = $("#importInput");
const themeToggle = $("#themeToggle");

const editDialog = $("#editDialog");
const editForm = $("#editForm");
const editId = $("#editId");
const editType = $("#editType");
const editCategory = $("#editCategory");
const editAmount = $("#editAmount");
const editDate = $("#editDate");
const editNote = $("#editNote");

const barCanvas = $("#barChart");
const ctx = barCanvas.getContext("2d");
/* ===== Init ===== */
load();
applyTheme(state.theme);
primeFormDefaults();
render();

function primeFormDefaults() {
  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;
  monthFilter.value = today.slice(0, 7);
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = { ...state, ...JSON.parse(raw) };
    } catch {}
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
