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
function applyFilters() {
  let list = [...transactions];

  // Type
  const type = filterTypeSel.value;
  if (type !== "all") {
    list = list.filter((t) => t.type === type);
  }

  // Category
  const cat = filterCatSel.value;
  if (cat !== "all") {
    list = list.filter((t) => t.category === cat);
  }

  // Date range
  const from = fromDateInp.value ? new Date(fromDateInp.value) : null;
  const to = toDateInp.value ? new Date(toDateInp.value) : null;
  if (from) list = list.filter((t) => new Date(t.date) >= from);
  if (to) list = list.filter((t) => new Date(t.date) <= to);

  // Search note
  const q = searchTextInp.value.trim().toLowerCase();
  if (q) list = list.filter((t) => (t.note || "").toLowerCase().includes(q));

  // Sort by date desc
  list.sort(
    (a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt
  );

  return list;
}
function renderTable(list) {
  txTbody.innerHTML = list
    .map(
      (t) => `
      <tr>
        <td>${t.date}</td>
        <td><span class="chip ${t.type}">${t.type}</span></td>
        <td>${t.category}</td>
        <td class="right">${fmtCurrency(t.amount)}</td>
        <td>${t.note ? escapeHtml(t.note) : ""}</td>
        <td class="right">
          <button class="icon ghost" title="Edit" data-action="edit" data-id="${
            t.id
          }">✏️</button>
          <button class="icon danger" title="Delete" data-action="delete" data-id="${
            t.id
          }">🗑️</button>
        </td>
      </tr>
    `
    )
    .join("");

  emptyState.style.display = list.length ? "none" : "";
}

function renderTotals(list) {
  const { income, expense, balance } = computeTotals(list);
  balanceEl.textContent = fmtCurrency(balance);
  incomeEl.textContent = fmtCurrency(income);
  expenseEl.textContent = fmtCurrency(expense);
}
function renderCharts(list) {
  // Category pie (expenses only for clarity)
  const catMap = {};
  list
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
  const catLabels = Object.keys(catMap);
  const catData = Object.values(catMap);

  const catCtx = document.getElementById("categoryChart");
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(catCtx, {
    type: "pie",
    data: { labels: catLabels, datasets: [{ data: catData }] },
    options: { plugins: { legend: { position: "bottom" } } },
  });

  // Monthly trend (net balance per month)
  const monthMap = {};
  list.forEach((t) => {
    const key = t.date.slice(0, 7); // YYYY-MM
    monthMap[key] =
      (monthMap[key] || 0) + (t.type === "income" ? t.amount : -t.amount);
  });
  const sortedKeys = Object.keys(monthMap).sort();
  const trendCtx = document.getElementById("trendChart");
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(trendCtx, {
    type: "line",
    data: {
      labels: sortedKeys,
      datasets: [
        {
          label: "Net (Income - Expense)",
          data: sortedKeys.map((k) => monthMap[k]),
          tension: 0.25,
        },
      ],
    },
    options: {
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } },
    },
  });
}
function renderAll() {
  const filtered = applyFilters();
  renderTable(filtered);
  renderTotals(filtered);
  renderCharts(filtered);
  refreshFilterCategoryOptions();
}

/* ---------- CRUD ---------- */
function addTx(data) {
  transactions.push({ id: uid(), createdAt: Date.now(), ...data });
  save(transactions);
}

function updateTx(id, data) {
  const idx = transactions.findIndex((t) => t.id === id);
  if (idx >= 0) {
    transactions[idx] = { ...transactions[idx], ...data };
    save(transactions);
  }
}

function deleteTx(id) {
  transactions = transactions.filter((t) => t.id !== id);
  save(transactions);
}
/* ---------- Form & Events ---------- */
function resetForm() {
  txForm.reset();
  formTitle.textContent = "Add Transaction";
  editIdInp.value = "";
  // keep default radio -> refresh categories
  refreshCategorySelect(
    document.querySelector('input[name="type"]:checked').value
  );
  dateInp.value = todayStr();
}

function fillForm(tx) {
  formTitle.textContent = "Edit Transaction";
  document
    .querySelectorAll('input[name="type"]')
    .forEach((r) => (r.checked = r.value === tx.type));
  refreshCategorySelect(tx.type);
  amountInp.value = tx.amount;
  categorySel.value = tx.category;
  dateInp.value = tx.date;
  noteInp.value = tx.note || "";
  editIdInp.value = tx.id;
}
