// ======= Storage Keys =======
const STORAGE_KEY = "budget-tracker:transactions";
const PREFS_KEY = "budget-tracker:prefs";

// ======= State =======
let transactions = []; // {id, type:'income'|'expense', amount:number, category, date:'YYYY-MM-DD', note}
let prefs = { darkMode: false, currency: "USD" };

// ======= DOM =======
const el = {
  totalIncome: document.getElementById("totalIncome"),
  totalExpense: document.getElementById("totalExpense"),
  balance: document.getElementById("balance"),
  txForm: document.getElementById("txForm"),
  type: document.getElementById("type"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  date: document.getElementById("date"),
  note: document.getElementById("note"),
  txList: document.getElementById("txList"),
  monthFilter: document.getElementById("monthFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  searchInput: document.getElementById("searchInput"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  darkModeToggle: document.getElementById("darkModeToggle"),
  currencySelect: document.getElementById("currencySelect"),
  categoryChart: document.getElementById("categoryChart"),
  categoryTotals: document.getElementById("categoryTotals"),
};

// ======= Utils =======
function uid() {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  );
}
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}
function monthKey(dateStr) {
  // "YYYY-MM"
  return dateStr.slice(0, 7);
}
function fmt(amount) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: prefs.currency || "USD",
      maximumFractionDigits: ["JPY", "VND"].includes(prefs.currency) ? 0 : 2,
      minimumFractionDigits: ["JPY", "VND"].includes(prefs.currency) ? 0 : 2,
    }).format(amount);
  } catch {
    return (amount || 0).toFixed(2);
  }
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ======= Persistence =======
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    transactions = raw ? JSON.parse(raw) : [];
  } catch {
    transactions = [];
  }

  try {
    const rawPrefs = localStorage.getItem(PREFS_KEY);
    prefs = rawPrefs ? JSON.parse(rawPrefs) : prefs;
  } catch {}

  // Apply prefs
  document.documentElement.classList.toggle("dark", prefs.darkMode);
  el.darkModeToggle.checked = !!prefs.darkMode;
  el.currencySelect.value = prefs.currency || "USD";
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}
function savePrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ======= Init Defaults =======
function initDefaults() {
  // Set default date to today
  el.date.value = todayStr();
  // Default month filter to current month
  el.monthFilter.value = monthKey(todayStr());
}

// ======= Rendering =======
function render() {
  const filters = {
    month: el.monthFilter.value, // "YYYY-MM" or ""
    category: el.categoryFilter.value.trim().toLowerCase(),
    search: el.searchInput.value.trim().toLowerCase(),
  };

  const filtered = transactions.filter((t) => {
    const matchesMonth = !filters.month || monthKey(t.date) === filters.month;
    const matchesCategory =
      !filters.category || t.category.toLowerCase().includes(filters.category);
    const blob = `${t.category} ${t.note}`.toLowerCase();
    const matchesSearch = !filters.search || blob.includes(filters.search);
    return matchesMonth && matchesCategory && matchesSearch;
  });

  // Summary
  const income = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  el.totalIncome.textContent = fmt(income);
  el.totalExpense.textContent = fmt(expense);
  el.balance.textContent = fmt(balance);

  // List
  el.txList.innerHTML = "";
  // Sort by date desc, then created id desc
  filtered.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1
  );
  for (const t of filtered) {
    const li = document.createElement("li");
    li.className = "tx-item";
    li.innerHTML = `
      <span class="tx-date">${t.date}</span>
      <span class="tx-type ${t.type}">${
      t.type === "income" ? "Income" : "Expense"
    }</span>
      <span class="tx-category">${escapeHtml(t.category)}</span>
      <span class="tx-amount right">${fmt(Number(t.amount))}</span>
      <span class="tx-note">${escapeHtml(t.note || "")}</span>
      <span class="tx-actions">
        <button class="icon-btn" data-action="edit" data-id="${
          t.id
        }" title="Edit">✏️</button>
        <button class="icon-btn" data-action="delete" data-id="${
          t.id
        }" title="Delete">🗑️</button>
      </span>
    `;
    el.txList.appendChild(li);
  }

  // Chart + category totals for EXPENSES only
  renderCategoryAnalytics(filtered.filter((t) => t.type === "expense"));
}

function renderCategoryAnalytics(expenses) {
  // Group by category
  const totals = {};
  for (const t of expenses) {
    const key = t.category.trim() || "Uncategorized";
    totals[key] = (totals[key] || 0) + Number(t.amount);
  }
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  // Totals chips
  el.categoryTotals.innerHTML = "";
  if (entries.length === 0) {
    el.categoryTotals.innerHTML = `<p style="color:#9ca3af">No expense data to show.</p>`;
  } else {
    for (const [cat, amt] of entries) {
      const div = document.createElement("div");
      div.className = "category-chip";
      div.innerHTML = `<span>${escapeHtml(cat)}</span><b>${fmt(amt)}</b>`;
      el.categoryTotals.appendChild(div);
    }
  }

  // Draw simple bar chart on canvas
  const ctx = el.categoryChart.getContext("2d");
  const W = el.categoryChart.width;
  const H = el.categoryChart.height;

  // Clear
  ctx.clearRect(0, 0, W, H);

  // If none, draw message
  if (entries.length === 0) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("No expenses for selected filters.", 16, 40);
    return;
  }

  // Layout
  const margins = { top: 20, right: 20, bottom: 80, left: 70 };
  const chartW = W - margins.left - margins.right;
  const chartH = H - margins.top - margins.bottom;

  const values = entries.map(([, v]) => v);
  const maxVal = Math.max(...values) || 1;

  // Axes
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margins.left, margins.top);
  ctx.lineTo(margins.left, margins.top + chartH);
  ctx.lineTo(margins.left + chartW, margins.top + chartH);
  ctx.stroke();

  // Y ticks (5)
  ctx.fillStyle = "#9ca3af";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  for (let i = 0; i <= 5; i++) {
    const val = (maxVal * i) / 5;
    const y = margins.top + chartH - (val / maxVal) * chartH;
    ctx.fillText(fmt(val), 6, y + 4);
    ctx.strokeStyle = "rgba(55,65,81,0.3)";
    ctx.beginPath();
    ctx.moveTo(margins.left, y);
    ctx.lineTo(margins.left + chartW, y);
    ctx.stroke();
  }

  // Bars
  const n = entries.length;
  const gap = 10;
  const barW = clamp((chartW - gap * (n - 1)) / n, 20, 120);
  const startX = margins.left + (chartW - (barW * n + gap * (n - 1))) / 2;

  ctx.fillStyle = "#4f46e5"; // primary
  entries.forEach(([cat, v], i) => {
    const barH = (v / maxVal) * chartH;
    const x = startX + i * (barW + gap);
    const y = margins.top + chartH - barH;

    // Bar
    ctx.fillRect(x, y, barW, barH);

    // Value label
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(fmt(v), x, y - 6);

    // Category label (wrapped/truncated)
    ctx.fillStyle = "#9ca3af";
    const label = cat.length > 14 ? cat.slice(0, 12) + "…" : cat;
    const textX = x + barW / 2 - ctx.measureText(label).width / 2;
    ctx.fillText(label, textX, margins.top + chartH + 18);

    ctx.fillStyle = "#4f46e5";
  });
}

// ======= Events =======
el.txForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const type = el.type.value;
  const amount = Number(el.amount.value);
  const category = el.category.value.trim();
  const date = el.date.value;
  const note = el.note.value.trim();

  if (!date || !category || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount, category, and date.");
    return;
  }

  transactions.push({
    id: uid(),
    type,
    amount,
    category,
    date,
    note,
  });
  save();

  el.amount.value = "";
  el.note.value = "";
  render();
});

el.txList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");

  if (action === "delete") {
    if (confirm("Delete this transaction?")) {
      transactions = transactions.filter((t) => t.id !== id);
      save();
      render();
    }
  }

  if (action === "edit") {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    // Simple inline edit using prompts (keeps code minimal)
    const newAmount = Number(prompt("Amount:", tx.amount));
    if (isNaN(newAmount) || newAmount <= 0) return;
    const newCategory = prompt("Category:", tx.category) || tx.category;
    const newDate = prompt("Date (YYYY-MM-DD):", tx.date) || tx.date;
    const newNote = prompt("Note:", tx.note || "") || "";
    const newType = prompt("Type (income/expense):", tx.type) || tx.type;
    if (!["income", "expense"].includes(newType)) return;

    Object.assign(tx, {
      amount: newAmount,
      category: newCategory.trim(),
      date: newDate,
      note: newNote.trim(),
      type: newType,
    });
    save();
    render();
  }
});

["input", "change"].forEach((evt) => {
  el.monthFilter.addEventListener(evt, render);
  el.categoryFilter.addEventListener(evt, render);
  el.searchInput.addEventListener(evt, render);
});

el.exportBtn.addEventListener("click", () => {
  const payload = {
    version: 1,
    prefs,
    transactions,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "budget-tracker-export.json";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
});

el.importInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.transactions))
      throw new Error("Invalid file");
    if (
      !confirm(
        "Importing will merge transactions and update preferences. Continue?"
      )
    )
      return;

    // Merge transactions (avoid ID collisions)
    const existingIds = new Set(transactions.map((t) => t.id));
    const imported = data.transactions
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        id: existingIds.has(t.id) ? uid() : t.id || uid(),
        type: t.type === "income" ? "income" : "expense",
        amount: Number(t.amount) || 0,
        category: String(t.category || "Uncategorized"),
        date: /^\d{4}-\d{2}-\d{2}$/.test(t.date || "") ? t.date : todayStr(),
        note: String(t.note || ""),
      }))
      .filter((t) => t.amount > 0);

    transactions = transactions.concat(imported);
    // Update prefs if present
    if (data.prefs && typeof data.prefs === "object") {
      prefs.darkMode = !!data.prefs.darkMode;
      if (data.prefs.currency) prefs.currency = String(data.prefs.currency);
      document.documentElement.classList.toggle("dark", prefs.darkMode);
      el.darkModeToggle.checked = prefs.darkMode;
      el.currencySelect.value = prefs.currency;
      savePrefs();
    }

    save();
    render();
    alert(`Imported ${imported.length} transactions.`);
  } catch (err) {
    console.error(err);
    alert("Failed to import file. Make sure it is a valid export JSON.");
  } finally {
    e.target.value = "";
  }
});

el.clearAllBtn.addEventListener("click", () => {
  if (!transactions.length) return alert("Nothing to clear.");
  if (confirm("Clear ALL transactions? This cannot be undone.")) {
    transactions = [];
    save();
    render();
  }
});

el.darkModeToggle.addEventListener("change", () => {
  prefs.darkMode = el.darkModeToggle.checked;
  document.documentElement.classList.toggle("dark", prefs.darkMode);
  savePrefs();
});

el.currencySelect.addEventListener("change", () => {
  prefs.currency = el.currencySelect.value;
  savePrefs();
  render();
});

// ======= Helpers =======
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ======= Boot =======
(function boot() {
  load();
  // If user is likely in Vietnam, you can default currency to VND on first run
  if (
    !localStorage.getItem(PREFS_KEY) &&
    navigator?.language?.toLowerCase().includes("vi")
  ) {
    prefs.currency = "VND";
    savePrefs();
  }
  initDefaults();
  render();
})();
