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

function removeTx(id) {
  transactions = transactions.filter((t) => t.id !== id);
  save();
  renderAll();
}

function editTx(id) {
  const t = transactions.find((x) => x.id === id);
  if (!t) return;
  editId = id;
  formTitleEl.textContent = "Edit Transaction";
  cancelEditBtn.hidden = false;

  dateEl.value = t.date;
  typeEl.value = t.type;
  categoryEl.value = t.category;
  descEl.value = t.description || "";
  amountEl.value = t.amount;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getFilters() {
  const month = filterMonthEl.value; // yyyy-mm
  const cat = filterCategoryEl.value;
  const text = filterTextEl.value.toLowerCase();
  const sortBy = sortByEl.value;
  return { month, cat, text, sortBy };
}

function applyFilters(data) {
  const { month, cat, text, sortBy } = getFilters();
  let rows = [...data];

  if (month) {
    rows = rows.filter((r) => (r.date || "").startsWith(month));
  }
  if (cat) {
    rows = rows.filter((r) => r.category.toLowerCase() === cat.toLowerCase());
  }
  if (text) {
    rows = rows.filter(
      (r) =>
        (r.description || "").toLowerCase().includes(text) ||
        (r.category || "").toLowerCase().includes(text)
    );
  }

  switch (sortBy) {
    case "dateAsc":
      rows.sort((a, b) => a.date.localeCompare(b.date));
      break;
    case "amountDesc":
      rows.sort((a, b) => b.amount - a.amount);
      break;
    case "amountAsc":
      rows.sort((a, b) => a.amount - b.amount);
      break;
    default:
      rows.sort((a, b) => b.date.localeCompare(a.date));
  }

  return rows;
}

function calcTotals(data) {
  const inc = data
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const exp = data
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return { income: inc, expense: exp, balance: inc - exp };
}

function renderAll() {
  // Update category options
  updateCategoryOptions(transactions);

  // Apply filters
  const rows = applyFilters(transactions);

  // Render table
  renderTable(rows);

  // Totals (global and page)
  const globalTotals = calcTotals(transactions);
  incomeTotalEl.textContent = fmtMoney(globalTotals.income);
  expenseTotalEl.textContent = fmtMoney(globalTotals.expense);
  balanceTotalEl.textContent = fmtMoney(globalTotals.balance);

  const pageTotals = calcTotals(rows);
  pageTotalEl.textContent = fmtMoney(pageTotals.balance);

  // Breakdown
  renderBreakdown(rows);
}
