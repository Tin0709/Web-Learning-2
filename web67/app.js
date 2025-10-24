/* ====== Simple Budget Manager (LocalStorage) ====== */

const STORAGE_KEY = "bm-transactions-v1";

const els = {
  totalIncome: document.getElementById("totalIncome"),
  totalExpense: document.getElementById("totalExpense"),
  balance: document.getElementById("balance"),

  formTitle: document.getElementById("formTitle"),
  txForm: document.getElementById("txForm"),
  txId: document.getElementById("txId"),
  type: document.getElementById("type"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  categoryList: document.getElementById("categoryList"),
  date: document.getElementById("date"),
  note: document.getElementById("note"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),

  filterType: document.getElementById("filterType"),
  filterCategory: document.getElementById("filterCategory"),
  filterText: document.getElementById("filterText"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),

  txBody: document.getElementById("txBody"),
  filteredTotal: document.getElementById("filteredTotal"),
  sortBtn: document.getElementById("sortBtn"),

  categoryChips: document.getElementById("categoryChips"),
  barChart: document.getElementById("barChart"),

  exportBtn: document.getElementById("exportBtn"),
  importFile: document.getElementById("importFile"),
  resetBtn: document.getElementById("resetBtn"),
};
let transactions = load();
let sortDesc = true; // default: newest first

/* ---------- Utils ---------- */

function uid() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function fmt(amount) {
  const n = Number(amount || 0);
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: guessCurrency(),
  });
}
function guessCurrency() {
  try {
    // crude guess from locale; fallback to USD
    return Intl.NumberFormat().resolvedOptions().currency || "USD";
  } catch {
    return "USD";
  }
}
function todayStr() {
  const d = new Date();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function toDate(s) {
  // treat as UTC-less local date
  return new Date(s + "T00:00:00");
}
/* ---------- Rendering ---------- */

function render() {
  // sort
  transactions.sort((a, b) =>
    sortDesc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
  );

  renderCategoryOptions();
  renderTransactions();
  renderSummary();
  renderCategoryBreakdown();
}

function renderSummary() {
  const income = sum(
    transactions.filter((t) => t.type === "income").map((t) => t.amount)
  );
  const expense = sum(
    transactions.filter((t) => t.type === "expense").map((t) => t.amount)
  );
  const balance = income - expense;

  els.totalIncome.textContent = fmt(income);
  els.totalExpense.textContent = fmt(expense);
  els.balance.textContent = fmt(balance);
}

function renderTransactions() {
  const filtered = getFiltered();
  els.txBody.innerHTML = "";

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.style.textAlign = "center";
    td.textContent = "No transactions match your filters.";
    tr.appendChild(td);
    els.txBody.appendChild(tr);
  } else {
    for (const t of filtered) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${t.date}</td>
          <td>${t.type === "income" ? "Income" : "Expense"}</td>
          <td>${escapeHTML(t.category)}</td>
          <td>${escapeHTML(t.note || "")}</td>
          <td class="right" data-raw="${t.amount}">${fmt(t.amount)}</td>
          <td class="actions">
            <button class="action edit" data-id="${
              t.id
            }" aria-label="Edit">Edit</button>
            <button class="action delete" data-id="${
              t.id
            }" aria-label="Delete">Delete</button>
          </td>
        `;
      els.txBody.appendChild(tr);
    }
  }

  const filteredTotal = sum(
    filtered.map((t) => (t.type === "income" ? t.amount : -t.amount))
  );
  els.filteredTotal.textContent = fmt(filteredTotal);
}

function renderCategoryOptions() {
  const cats = Array.from(new Set(transactions.map((t) => t.category))).sort(
    (a, b) => a.localeCompare(b)
  );
  // datalist for input
  els.categoryList.innerHTML = cats
    .map((c) => `<option value="${escapeHTML(c)}"></option>`)
    .join("");
  // filter dropdown
  const current = els.filterCategory.value || "all";
  els.filterCategory.innerHTML =
    `<option value="all">All</option>` +
    cats
      .map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`)
      .join("");
  els.filterCategory.value =
    current === "all" || cats.includes(current) ? current : "all";
}

function renderCategoryBreakdown() {
  const filtered = getFiltered();
  const byCat = {};
  for (const t of filtered) {
    const sign = t.type === "expense" ? -1 : 1;
    byCat[t.category] = (byCat[t.category] || 0) + sign * t.amount;
  }

  // chips
  els.categoryChips.innerHTML = Object.entries(byCat)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .map(
      ([c, v]) =>
        `<span class="chip">${escapeHTML(c)}: <strong>${fmt(v)}</strong></span>`
    )
    .join("");

  // simple bar chart (no libs)
  drawBarChart(els.barChart, byCat);
}
