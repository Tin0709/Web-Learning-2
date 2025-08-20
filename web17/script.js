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

/* ===== Transactions CRUD ===== */
function addTx(tx) {
  state.transactions.push(tx);
  save();
  render();
}

function updateTx(id, patch) {
  const i = state.transactions.findIndex((t) => t.id === id);
  if (i >= 0) {
    state.transactions[i] = { ...state.transactions[i], ...patch };
    save();
    render();
  }
}

function deleteTx(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  save();
  render();
}

function clearAll() {
  if (!confirm("Delete ALL transactions? This cannot be undone.")) return;
  state.transactions = [];
  save();
  render();
}

/* ===== Rendering ===== */
function render() {
  renderFilters();
  const list = filteredAndSorted();
  renderSummary(list);
  renderTable(list);
  renderChart();
}

function renderFilters() {
  // Build category options from transactions + defaults
  const cats = new Set(["All", ...state.transactions.map((t) => t.category)]);
  const current = categoryFilter.value || state.filters.category || "all";
  categoryFilter.innerHTML =
    `<option value="all">All</option>` +
    [...cats]
      .filter((c) => c !== "All")
      .sort((a, b) => a.localeCompare(b))
      .map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`)
      .join("");
  categoryFilter.value = current;
  // Bind values from state
  monthFilter.value = state.filters.month || monthFilter.value;
  searchFilter.value = state.filters.search || "";
  sortBy.value = state.filters.sortBy || "date_desc";
}

function filteredAndSorted() {
  const { month, category, search, sortBy } = state.filters;
  return [...state.transactions]
    .filter((t) => (month ? t.date.startsWith(month) : true))
    .filter((t) => (category !== "all" ? t.category === category : true))
    .filter((t) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (t.note || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
        case "date_desc":
          return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
        case "amount_asc":
          return a.amount - b.amount;
        case "amount_desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });
}

function renderSummary(list) {
  const income = list
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = list
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  incomeEl.textContent = fmt.format(income);
  expenseEl.textContent = fmt.format(expense);
  balanceEl.textContent = fmt.format(balance);
  txCount.textContent = `${list.length} ${
    list.length === 1 ? "item" : "items"
  }`;
}

function renderTable(list) {
  txBody.innerHTML = "";
  if (list.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="muted" style="text-align:center;padding:24px;">No transactions yet.</td>`;
    txBody.appendChild(tr);
    return;
  }
  for (const t of list) {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    $(".date", row).textContent = t.date;
    const typeCell = $(".type", row);
    typeCell.dataset.label = "";
    typeCell.textContent = t.type === "income" ? "Income" : "Expense";
    typeCell.style.color =
      t.type === "income" ? "var(--income)" : "var(--expense)";

    $(".category", row).innerHTML = `<span class="badge">${escapeHTML(
      t.category
    )}</span>`;
    $(".amount", row).textContent = fmt.format(
      t.amount * (t.type === "expense" ? -1 : 1)
    );
    $(".amount", row).style.color =
      t.type === "expense" ? "var(--expense)" : "var(--income)";
    $(".note", row).textContent = t.note || "";

    // Actions
    $(".edit", row).addEventListener("click", () => openEdit(t));
    $(".delete", row).addEventListener("click", () => deleteTx(t.id));

    txBody.appendChild(row);
  }
}

function renderChart() {
  const month = state.filters.month || new Date().toISOString().slice(0, 7);
  // Aggregate by day of month
  const daysInMonth = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0
  ).getDate();
  const inc = Array(daysInMonth).fill(0);
  const exp = Array(daysInMonth).fill(0);

  for (const t of state.transactions) {
    if (!t.date.startsWith(month)) continue;
    const d = Number(t.date.slice(8, 10)) - 1;
    if (t.type === "income") inc[d] += t.amount;
    else exp[d] += t.amount;
  }

  // draw
  const w = barCanvas.width,
    h = barCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const pad = 36;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const maxVal = Math.max(1, ...inc, ...exp);

  // axes
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--muted")
    .trim();
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const barW = innerW / daysInMonth / 1.6; // small gap
  for (let i = 0; i < daysInMonth; i++) {
    const xBase = pad + (innerW / daysInMonth) * i + 6;
    // income
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--income")
      .trim();
    const ih = (inc[i] / maxVal) * (innerH - 10);
    ctx.fillRect(xBase, h - pad - ih, barW, ih);

    // expense
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--expense")
      .trim();
    const eh = (exp[i] / maxVal) * (innerH - 10);
    ctx.fillRect(xBase + barW + 4, h - pad - eh, barW, eh);
  }

  // labels (every ~5th day)
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--muted")
    .trim();
  ctx.font =
    "12px " +
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font")
      .trim();
  ctx.textAlign = "center";
  for (let i = 0; i < daysInMonth; i += Math.ceil(daysInMonth / 6)) {
    const x = pad + (innerW / daysInMonth) * i + barW;
    ctx.fillText(String(i + 1), x, h - pad + 16);
  }
}

/* ===== Edit Dialog ===== */
function openEdit(t) {
  editId.value = t.id;
  editType.value = t.type;
  editCategory.value = t.category;
  editAmount.value = t.amount;
  editDate.value = t.date;
  editNote.value = t.note || "";
  editDialog.showModal();
}

/* ===== Events ===== */
txForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const tx = {
    id: uid(),
    type: typeInput.value,
    category: categoryInput.value.trim(),
    amount: Number(amountInput.value),
    date: dateInput.value,
    note: noteInput.value.trim(),
    createdAt: Date.now(),
  };
  if (!tx.category || !tx.date || !isFinite(tx.amount)) return;
  addTx(tx);

  txForm.reset();
  primeFormDefaults();
  categoryInput.focus();
});

clearAllBtn.addEventListener("click", clearAll);

[monthFilter, categoryFilter, searchFilter, sortBy].forEach((el) => {
  el.addEventListener("input", () => {
    state.filters.month = monthFilter.value;
    state.filters.category = categoryFilter.value;
    state.filters.search = searchFilter.value;
    state.filters.sortBy = sortBy.value;
    save();
    render();
  });
});

/* Edit form submit/cancel */
editForm.addEventListener("close", () => {}); // noop for Safari
editForm.addEventListener("submit", (e) => {
  e.preventDefault();
});
editDialog.addEventListener("close", () => {
  if (editForm.returnValue === "cancel") return;
  const id = editId.value;
  const patch = {
    type: editType.value,
    category: editCategory.value.trim(),
    amount: Number(editAmount.value),
    date: editDate.value,
    note: editNote.value.trim(),
  };
  updateTx(id, patch);
});

/* Export / Import */
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `budget-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

importInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      if (!imported || typeof imported !== "object")
        throw new Error("Invalid file");
      // basic shape check
      if (!Array.isArray(imported.transactions))
        throw new Error("Missing transactions");
      state = { ...state, ...imported };
      save();
      render();
      alert("Imported successfully!");
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      importInput.value = "";
    }
  };
  reader.readAsText(file);
});

/* Theme */
function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  state.theme = theme;
  localStorage.setItem("budget.theme", theme);
}
themeToggle.addEventListener("click", () => {
  applyTheme(state.theme === "light" ? "dark" : "light");
});

/* ===== Helpers ===== */
function escapeHTML(s = "") {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c])
  );
}
