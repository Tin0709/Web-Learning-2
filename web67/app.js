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
/* ---------- Chart ---------- */

function drawBarChart(canvas, dict) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const entries = Object.entries(dict);
  if (entries.length === 0) {
    ctx.fillStyle = "#a7b0d6";
    ctx.font = "16px system-ui";
    ctx.fillText("No data to display.", 20, 40);
    return;
  }

  const values = entries.map(([, v]) => v);
  const maxAbs = Math.max(...values.map((v) => Math.abs(v))) || 1;

  const padding = 50;
  const chartW = W - padding * 2;
  const chartH = H - padding * 2;

  // axis
  ctx.strokeStyle = "#2b3053";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, H - padding);
  ctx.lineTo(W - padding, H - padding);
  ctx.stroke();

  const zeroY =
    padding + chartH * (values.some((v) => v < 0) ? maxAbs / (maxAbs * 2) : 1); // if negatives, center
  const barW = (chartW / entries.length) * 0.6;
  const gap = (chartW / entries.length) * 0.4;

  // bars & labels
  entries.forEach(([label, value], i) => {
    const x = padding + i * (barW + gap) + gap / 2;
    const h = Math.round(
      (Math.abs(value) / maxAbs) *
        (values.some((v) => v < 0) ? chartH / 2 : chartH)
    );
    const y = value >= 0 ? H - padding - h : H - padding - chartH / 2 + h;

    ctx.fillStyle = value >= 0 ? "#3ddc97" : "#ff6b6b";
    ctx.fillRect(x, y, barW, h);

    ctx.fillStyle = "#a7b0d6";
    ctx.font = "11px system-ui";
    const textX = x + barW / 2 - ctx.measureText(label).width / 2;
    ctx.fillText(
      label,
      Math.max(
        padding,
        Math.min(textX, W - padding - ctx.measureText(label).width)
      ),
      H - padding + 14
    );

    // value label
    const val = fmt(value);
    ctx.font = "10px system-ui";
    ctx.fillText(val, x, value >= 0 ? y - 6 : y + h + 12);
  });
}
/* ---------- Filters ---------- */

function getFiltered() {
  const type = els.filterType.value;
  const cat = els.filterCategory.value;
  const q = (els.filterText.value || "").trim().toLowerCase();
  const from = els.fromDate.value ? toDate(els.fromDate.value) : null;
  const to = els.toDate.value ? toDate(els.toDate.value) : null;

  return transactions.filter((t) => {
    if (type !== "all" && t.type !== type) return false;
    if (cat !== "all" && t.category !== cat) return false;
    if (
      q &&
      !(t.note || "").toLowerCase().includes(q) &&
      !t.category.toLowerCase().includes(q)
    )
      return false;
    if (from && toDate(t.date) < from) return false;
    if (to && toDate(t.date) > to) return false;
    return true;
  });
}

/* ---------- CRUD ---------- */

function handleSubmit(e) {
  e.preventDefault();
  const data = {
    id: els.txId.value || uid(),
    type: els.type.value,
    amount: Number(els.amount.value || 0),
    category: (els.category.value || "").trim(),
    date: els.date.value,
    note: (els.note.value || "").trim(),
  };

  if (!data.category) return alert("Please enter a category.");
  if (!data.date) return alert("Please select a date.");
  if (!(data.amount > 0)) return alert("Amount must be greater than 0.");

  const existing = transactions.find((t) => t.id === data.id);
  if (existing) {
    Object.assign(existing, data);
  } else {
    transactions.push(data);
  }

  save();
  resetForm();
  render();
}
function startEdit(id) {
  const t = transactions.find((x) => x.id === id);
  if (!t) return;

  els.formTitle.textContent = "Edit Transaction";
  els.txId.value = t.id;
  els.type.value = t.type;
  els.amount.value = t.amount;
  els.category.value = t.category;
  els.date.value = t.date;
  els.note.value = t.note || "";
  els.cancelEditBtn.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTx(id) {
  const t = transactions.find((x) => x.id === id);
  if (!t) return;
  if (
    !confirm(
      `Delete "${t.category}" ${t.type} of ${fmt(t.amount)} on ${t.date}?`
    )
  )
    return;
  transactions = transactions.filter((x) => x.id !== id);
  save();
  render();
}
function resetForm() {
  els.formTitle.textContent = "Add Transaction";
  els.txId.value = "";
  els.type.value = "income";
  els.amount.value = "";
  els.category.value = "";
  els.date.value = todayStr();
  els.note.value = "";
  els.cancelEditBtn.classList.add("hidden");
}
/* ---------- Helpers ---------- */

function sum(arr) {
  return arr.reduce((a, b) => a + Number(b || 0), 0);
}

function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
