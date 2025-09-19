/* ========= Expense Tracker (Vanilla JS) =========
 * Features:
 *  - Add/Edit/Delete transactions
 *  - LocalStorage persistence
 *  - Totals and balance
 *  - Filters: All, This Month, Custom date range, Search
 *  - Pie chart of expenses by category (Canvas)
 */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const STORAGE_KEY = "expensetracker.v1.transactions";

const state = {
  transactions: [], // {id, type, amount, category, date, note}
  filter: { mode: "all", from: null, to: null, search: "" },
  editingId: null,
};

// --- Utilities ---
const fmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: guessCurrency(),
});
function guessCurrency() {
  // Fallback to USD if cannot detect
  try {
    const region = Intl.DateTimeFormat()
      .resolvedOptions()
      .locale.split("-")
      .pop();
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
      SG: "SGD",
      AU: "AUD",
      CA: "CAD",
    };
    return map[region] || "USD";
  } catch {
    return "USD";
  }
}
const toISODate = (d) => new Date(d).toISOString().slice(0, 10);

// --- DOM refs ---
const balanceEl = $("#balance");
const incomeTotalEl = $("#incomeTotal");
const expenseTotalEl = $("#expenseTotal");

const txForm = $("#txForm");
const typeEl = $("#type");
const amountEl = $("#amount");
const categoryEl = $("#category");
const dateEl = $("#date");
const noteEl = $("#note");

const txBody = $("#txBody");
const rowTemplate = $("#rowTemplate");

const chips = $$(".chip");
const fromDateEl = $("#fromDate");
const toDateEl = $("#toDate");
const applyRangeBtn = $("#applyRange");
const clearRangeBtn = $("#clearRange");
const searchEl = $("#search");

const resetBtn = $("#resetApp");

// Edit dialog
const editDialog = $("#editDialog");
const editForm = $("#editForm");
const eType = $("#eType");
const eAmount = $("#eAmount");
const eCategory = $("#eCategory");
const eDate = $("#eDate");
const eNote = $("#eNote");

// Chart
const pieCanvas = $("#pie");
const legendEl = $("#legend");
const ctx = pieCanvas.getContext("2d");

// --- Init ---
init();

function init() {
  // defaults
  dateEl.value = toISODate(new Date());
  load();
  render();
  attachEvents();
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.transactions = raw ? JSON.parse(raw) : [];
  } catch {
    state.transactions = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
}

// --- Events ---
function attachEvents() {
  txForm.addEventListener("submit", onAdd);
  txBody.addEventListener("click", onTableClick);

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const mode = chip.dataset.filter;
      state.filter.mode = mode;
      if (mode === "this-month") {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        state.filter.from = toISODate(from);
        state.filter.to = toISODate(to);
        fromDateEl.value = state.filter.from;
        toDateEl.value = state.filter.to;
      } else {
        state.filter.from = null;
        state.filter.to = null;
        fromDateEl.value = "";
        toDateEl.value = "";
      }
      render();
    })
  );

  applyRangeBtn.addEventListener("click", () => {
    state.filter.mode = "custom";
    chips.forEach((c) => c.classList.remove("active"));
    const { value: from } = fromDateEl;
    const { value: to } = toDateEl;
    state.filter.from = from || null;
    state.filter.to = to || null;
    render();
  });

  clearRangeBtn.addEventListener("click", () => {
    state.filter = {
      mode: "all",
      from: null,
      to: null,
      search: searchEl.value.trim(),
    };
    fromDateEl.value = "";
    toDateEl.value = "";
    chips.forEach((c) => c.classList.remove("active"));
    chips.find((c) => c.dataset.filter === "all")?.classList.add("active");
    render();
  });

  searchEl.addEventListener("input", () => {
    state.filter.search = searchEl.value.trim();
    render();
  });

  resetBtn.addEventListener("click", () => {
    if (confirm("Reset ALL data? This cannot be undone.")) {
      state.transactions = [];
      save();
      render();
    }
  });

  // Edit dialog submit
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = state.editingId;
    if (!id) return editDialog.close();

    const updated = {
      id,
      type: eType.value,
      amount: Math.abs(parseFloat(eAmount.value || "0")),
      category: eCategory.value.trim(),
      date: eDate.value,
      note: eNote.value.trim(),
    };
    if (!updated.amount || !updated.category || !updated.date) return;

    const idx = state.transactions.findIndex((t) => t.id === id);
    if (idx >= 0) state.transactions[idx] = updated;
    save();
    state.editingId = null;
    editDialog.close();
    render();
  });
}

function onAdd(e) {
  e.preventDefault();
  const tx = {
    id: crypto.randomUUID(),
    type: typeEl.value,
    amount: Math.abs(parseFloat(amountEl.value || "0")),
    category: categoryEl.value.trim(),
    date: dateEl.value || toISODate(new Date()),
    note: (noteEl.value || "").trim(),
  };
  if (!tx.amount || !tx.category || !tx.date) return;

  state.transactions.push(tx);
  save();
  txForm.reset();
  typeEl.value = "expense";
  dateEl.value = toISODate(new Date());
  render();
}

function onTableClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  const tr = btn.closest("tr");
  const id = tr?.dataset.id;
  if (!id) return;

  if (btn.classList.contains("delete")) {
    const ok = confirm("Delete this transaction?");
    if (ok) {
      state.transactions = state.transactions.filter((t) => t.id !== id);
      save();
      render();
    }
  } else if (btn.classList.contains("edit")) {
    const tx = state.transactions.find((t) => t.id === id);
    if (!tx) return;
    state.editingId = id;
    eType.value = tx.type;
    eAmount.value = tx.amount;
    eCategory.value = tx.category;
    eDate.value = tx.date;
    eNote.value = tx.note || "";
    editDialog.showModal();
  }
}

// --- Rendering ---
function render() {
  const list = filteredTransactions();

  // Totals
  const income = sumBy(list, (t) => (t.type === "income" ? t.amount : 0));
  const expense = sumBy(list, (t) => (t.type === "expense" ? t.amount : 0));
  const balance = income - expense;

  incomeTotalEl.textContent = fmt.format(income);
  expenseTotalEl.textContent = fmt.format(expense);
  balanceEl.textContent = fmt.format(balance);
  balanceEl.classList.toggle("negative", balance < 0);
  balanceEl.classList.toggle("positive", balance >= 0);

  // Table
  txBody.innerHTML = "";
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
  for (const tx of sorted) {
    const frag = rowTemplate.content.cloneNode(true);
    const tr = frag.querySelector("tr");
    tr.dataset.id = tx.id;
    tr.querySelector(".date").textContent = tx.date;
    tr.querySelector(".type").textContent =
      tx.type === "income" ? "Income" : "Expense";
    tr.querySelector(".category").textContent = tx.category;
    tr.querySelector(".amount").textContent =
      (tx.type === "income" ? "+" : "-") +
      fmt.format(tx.amount).replace(/^-/, "");
    tr.querySelector(".amount").classList.toggle(
      "positive",
      tx.type === "income"
    );
    tr.querySelector(".amount").classList.toggle(
      "negative",
      tx.type === "expense"
    );
    tr.querySelector(".note").textContent = tx.note || "—";
    txBody.appendChild(frag);
  }

  drawPie(list.filter((t) => t.type === "expense"));
  buildLegend(list.filter((t) => t.type === "expense"));
}

function filteredTransactions() {
  const { from, to, search } = state.filter;
  const q = (search || "").toLowerCase();
  return state.transactions.filter((t) => {
    const inRange = (!from || t.date >= from) && (!to || t.date <= to);
    const matchesQ =
      !q ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.note && t.note.toLowerCase().includes(q));
    return inRange && matchesQ;
  });
}

function sumBy(arr, fn) {
  return arr.reduce((a, x) => a + (fn(x) || 0), 0);
}

// --- Pie Chart (vanilla canvas) ---
function drawPie(expenses) {
  // Group by category
  const map = new Map();
  for (const e of expenses) {
    const key = e.category || "Uncategorized";
    map.set(key, (map.get(key) || 0) + e.amount);
  }
  const data = [...map.entries()];
  const total = data.reduce((a, [, v]) => a + v, 0);
  const radius = Math.min(pieCanvas.width, pieCanvas.height) / 2 - 10;
  const cx = pieCanvas.width / 2;
  const cy = pieCanvas.height / 2;

  // Clear
  ctx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);

  if (total === 0) {
    ctx.fillStyle = "#8b93b7";
    ctx.textAlign = "center";
    ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText("No expense data", cx, cy);
    return;
  }

  // Generate deterministic colors based on category name
  const colors = {};
  const colorFor = (name) => {
    if (colors[name]) return colors[name];
    // Hash to HSL
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    const sat = 60 + (hash % 20); // 60–79
    const light = 50; // mid
    const c = `hsl(${hue} ${sat}% ${light}%)`;
    colors[name] = c;
    return c;
  };

  let start = -Math.PI / 2;
  data.forEach(([cat, val]) => {
    const slice = (val / total) * Math.PI * 2;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colorFor(cat);
    ctx.fill();
    start = end;
  });

  // Center label
  ctx.fillStyle = "#eef1ff";
  ctx.textAlign = "center";
  ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(fmt.format(total), cx, cy);
}

function buildLegend(expenses) {
  legendEl.innerHTML = "";
  const map = new Map();
  for (const e of expenses) {
    const key = e.category || "Uncategorized";
    map.set(key, (map.get(key) || 0) + e.amount);
  }
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  if (!entries.length) return;

  // colors must match drawPie
  const colorFor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    const sat = 60 + (hash % 20);
    const light = 50;
    return `hsl(${hue} ${sat}% ${light}%)`;
  };

  entries.forEach(([cat, val]) => {
    const item = document.createElement("div");
    item.className = "item";
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = colorFor(cat);
    const label = document.createElement("span");
    label.textContent = `${cat}: ${fmt.format(val)}`;
    item.append(sw, label);
    legendEl.appendChild(item);
  });
}
