/* =========================
   Expense Tracker - Vanilla JS
   ========================= */

const STORAGE_KEY = "et.transactions.v1";
const DEFAULT_CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"],
  expense: [
    "Food",
    "Transport",
    "Rent",
    "Bills",
    "Shopping",
    "Education",
    "Health",
    "Entertainment",
    "Travel",
    "Other",
  ],
};

// Elements
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("totalIncome");
const expenseEl = document.getElementById("totalExpense");

const txForm = document.getElementById("txForm");
const formTitle = document.getElementById("formTitle");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const editIdInp = document.getElementById("editId");

const amountInp = document.getElementById("amount");
const categorySel = document.getElementById("category");
const dateInp = document.getElementById("date");
const noteInp = document.getElementById("note");

const filterTypeSel = document.getElementById("filterType");
const filterCatSel = document.getElementById("filterCategory");
const fromDateInp = document.getElementById("fromDate");
const toDateInp = document.getElementById("toDate");
const searchTextInp = document.getElementById("searchText");
const clearFiltersBtn = document.getElementById("clearFilters");

const txTbody = document.getElementById("txTbody");
const emptyState = document.getElementById("emptyState");

const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
// Charts
let categoryChart, trendChart;

/* ---------- Utils ---------- */
const fmtCurrency = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);

const todayStr = () => new Date().toISOString().slice(0, 10);
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------- State ---------- */
let transactions = load(); // [{ id, type, amount, category, date, note }]

/* ---------- Category Options ---------- */
function refreshCategorySelect(type = "income") {
  const list = DEFAULT_CATEGORIES[type];
  categorySel.innerHTML = list
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");
}
function refreshFilterCategoryOptions() {
  const allCats = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES.income,
      ...DEFAULT_CATEGORIES.expense,
      ...transactions.map((t) => t.category),
    ])
  ).sort();
  filterCatSel.innerHTML =
    `<option value="all">All categories</option>` +
    allCats.map((c) => `<option value="${c}">${c}</option>`).join("");
}

/* ---------- Render ---------- */
function computeTotals(current = transactions) {
  const income = current
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = current
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}
