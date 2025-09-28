// ====== Simple Budget Planner ======

/** Utilities */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: guessCurrency(),
  maximumFractionDigits: 2,
});
function guessCurrency() {
  // Try to infer from browser locale; fallback USD
  try {
    const region = Intl.DateTimeFormat().resolvedOptions().locale.split("-")[1];
    const map = {
      US: "USD",
      VN: "VND",
      GB: "GBP",
      EU: "EUR",
      DE: "EUR",
      FR: "EUR",
      CA: "CAD",
      AU: "AUD",
      JP: "JPY",
      IN: "INR",
    };
    return map[region] || "USD";
  } catch {
    return "USD";
  }
}
const fmtMoney = (n) => currency.format(n);

/** State */
const STORAGE_KEY = "budget_planner_tx_v1";
let transactions = load();
let editId = null;

/** DOM refs */
const incomeTotalEl = $("#incomeTotal");
const expenseTotalEl = $("#expenseTotal");
const balanceTotalEl = $("#balanceTotal");

const formTitleEl = $("#formTitle");
const txForm = $("#txForm");
const dateEl = $("#date");
const typeEl = $("#type");
const categoryEl = $("#category");
const descEl = $("#description");
const amountEl = $("#amount");
const cancelEditBtn = $("#cancelEditBtn");

const txTbody = $("#txTbody");
const pageTotalEl = $("#pageTotal");

const filterMonthEl = $("#filterMonth");
const filterCategoryEl = $("#filterCategory");
const filterTextEl = $("#filterText");
const sortByEl = $("#sortBy");

const datalist = $("#categoryList");
const breakdownEl = $("#breakdown");

const exportCsvBtn = $("#exportCsvBtn");
const clearAllBtn = $("#clearAllBtn");

/** Init */
setDefaultDates();
renderAll();

/** Event Listeners */
txForm.addEventListener("submit", handleSave);
cancelEditBtn.addEventListener("click", cancelEdit);
filterMonthEl.addEventListener("input", renderAll);
filterCategoryEl.addEventListener("change", renderAll);
filterTextEl.addEventListener("input", renderAll);
sortByEl.addEventListener("change", renderAll);
exportCsvBtn.addEventListener("click", exportCSV);
clearAllBtn.addEventListener("click", clearAllConfirm);

// ====== Functions ======

function setDefaultDates() {
  const today = new Date();
  dateEl.value = toInputDate(today);
  filterMonthEl.value = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
}

function toInputDate(d) {
  if (!(d instanceof Date)) d = new Date(d);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function handleSave(e) {
  e.preventDefault();
  const date = dateEl.value;
  const type = typeEl.value;
  const category = categoryEl.value.trim();
  const description = (descEl.value || "").trim();
  const amount = parseFloat(amountEl.value);

  if (!date || !category || !isFinite(amount)) return;

  if (editId) {
    const idx = transactions.findIndex((t) => t.id === editId);
    if (idx > -1) {
      transactions[idx] = {
        ...transactions[idx],
        date,
        type,
        category,
        description,
        amount,
      };
    }
    editId = null;
    formTitleEl.textContent = "Add Transaction";
    cancelEditBtn.hidden = true;
  } else {
    transactions.push({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random()),
      date,
      type, // "income" or "expense"
      category,
      description,
      amount,
    });
  }

  save();
  txForm.reset();
  setDefaultDates();
  renderAll();
}

function cancelEdit() {
  editId = null;
  txForm.reset();
  setDefaultDates();
  formTitleEl.textContent = "Add Transaction";
  cancelEditBtn.hidden = true;
}
