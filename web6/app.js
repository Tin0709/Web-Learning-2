/* ===== Utilities & Storage ===== */
const STORAGE_KEY = "moodtracker.entries.v1";
const THEME_KEY = "moodtracker.theme";
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", weekday: "short" });

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
};
const save = (entries) => localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

/* ===== State ===== */
let entries = load(); // [{id, date:'YYYY-MM-DD', mood:1..5, note:''}]
let chart;

/* ===== DOM ===== */
const entryDate = $("#entryDate");
const entryNote = $("#entryNote");
const editingId = $("#editingId");
const saveBtn = $("#saveBtn");
const resetBtn = $("#resetBtn");
const historyList = $("#history");
const filterMood = $("#filterMood");
const searchInput = $("#search");
const exportBtn = $("#exportBtn");
const importFile = $("#importFile");
const clearAllBtn = $("#clearAll");
const streakEl = $("#streak");
const avg30El = $("#avg30");
const bestDayEl = $("#bestDay");
const themeToggle = $("#themeToggle");

/* ===== Init ===== */
function init() {
  // Theme
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  if (savedTheme === "light") document.documentElement.classList.add("light");
  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    localStorage.setItem(THEME_KEY, document.documentElement.classList.contains("light") ? "light" : "dark");
  });

  // Date default
  entryDate.value = todayISO();

  // Form submit
  $("#moodForm").addEventListener("submit", onSave);
  resetBtn.addEventListener("click", resetForm);

  // Filters
  filterMood.addEventListener("change", renderHistory);
  searchInput.addEventListener("input", renderHistory);

  // Export/Import
  exportBtn.addEventListener("click", onExport);
  importFile.addEventListener("change", onImport);
  clearAllBtn.addEventListener("click", onClearAll);

  renderAll();
}

/* ===== CRUD ===== */
function onSave(e) {
  e.preventDefault();
  const date = entryDate.value;
  const mood = Number(($('input[name="mood"]:checked') || {}).value);
  if (!date || !mood) return;

  const note = entryNote.value.trim();
  const id = editingId.value;

  if (id) {
    const idx = entries.findIndex(x => x.id === id);
    if (idx >= 0) entries[idx] = { ...entries[idx], date, mood, note };
  } else {
    // ensure at most one entry per date: replace if exists
    const existing = entries.findIndex(x => x.date === date);
    const obj = { id: crypto.randomUUID(), date, mood, note };
    if (existing >= 0) entries[existing] = { ...entries[existing], ...obj };
    else entries.push(obj);
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  save(entries);
  resetForm();
  renderAll();
}

function resetForm() {
  editingId.value = "";
  entryDate.value = todayISO();
  entryNote.value = "";
  $$('input[name="mood"]').forEach(r => r.checked = false);
  saveBtn.textContent = "Save";
}

function startEdit(id) {
  const e = entries.find(x => x.id === id);
  if (!e) return;
  editingId.value = e.id;
  entryDate.value = e.date;
  entryNote.value = e.note || "";
  $$('input[name="mood"]').forEach(r => r.checked = Number(r.value) === e.mood);
  saveBtn.textContent = "Update";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function del(id) {
  entries = entries.filter(x => x.id !== id);
  save(entries);
  renderAll();
}

/* ===== Rendering ===== */
function renderAll() {
  renderHistory();
  renderStats();
  renderChart();
}

function renderHistory() {
  historyList.innerHTML = "";
  const term = searchInput.value.trim().toLowerCase();
  const fmood = filterMood.value;

  const filtered = entries.filter(e => {
    const moodOk = fmood ? String(e.mood) === fmood : true;
    const textOk = term ? (e.note || "").toLowerCase().includes(term) : true;
    return moodOk && textOk;
  });

  const tpl = $("#historyItem");
  filtered.forEach(e => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    $(".date", li).textContent = fmt(e.date);
    $(".note", li).textContent = e.note || "—";
    $(".moodBadge", li).textContent = moodToEmoji(e.mood);
    $(".edit", li).addEventListener("click", () => startEdit(e.id));
    $(".delete", li).addEventListener("click", () => {
      if (confirm("Delete this entry?")) del(e.id);
    });
    historyList.appendChild(li);
  });

  if (!filtered.length) {
    const empty = document.createElement("li");
    empty.className = "item";
    empty.innerHTML = `<div class="left"><div class="date">No entries yet</div><div class="note">Log a mood to get started.</div></div>`;
    historyList.appendChild(empty);
  }
}

function renderStats() {
  // Streak (consecutive days from today with any entry)
  let streak = 0;
  const dates = new Set(entries.map(e => e.date));
  let d = new Date(todayISO());
  while (dates.has(d.toISOString().slice(0,10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  streakEl.textContent = streak;

  // Avg mood last 30 days
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 29);
  const last30 = entries.filter(e => new Date(e.date) >= cutoff);
  const avg = last30.length ? (last30.reduce((s,e)=>s+e.mood,0)/last30.length).toFixed(2) : "–";
  avg30El.textContent = avg;

  // Best day (max mood, most recent)
  if (entries.length) {
    const best = [...entries].sort((a,b) => (b.mood - a.mood) || b.date.localeCompare(a.date))[0];
    bestDayEl.textContent = `${moodToWord(best.mood)} • ${fmt(best.date)}`;
  } else {
    bestDayEl.textContent = "–";
  }
}

function renderChart() {
  const ctx = $("#moodChart");
  const labels = [];
  const data = [];
  const map = new Map(entries.map(e => [e.date, e.mood]));
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const iso = d.toISOString().slice(0,10);
    labels.push(d.toLocaleDateString(undefined, { weekday: "short" }));
    data.push(map.get(iso) ?? null);
  }

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Mood (1–5)",
        data,
        spanGaps: true,
        tension: 0.3,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 1, max: 5, ticks: { stepSize: 1 } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.raw ? `${moodToWord(ctx.raw)} (${ctx.raw})` : "No entry"
          }
        }
      }
    }
  });
}

/* ===== Export / Import / Danger ===== */
function onExport() {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `mood-data-${todayISO()}.json` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

function onImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error("Invalid file");
      // Minimal schema check
      parsed.forEach(x => { if (!x.id || !x.date || !x.mood) throw new Error("Invalid entry"); });
      entries = parsed.sort((a, b) => b.date.localeCompare(a.date));
      save(entries);
      renderAll();
      alert("Import complete ✅");
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
}

function onClearAll() {
  if (!entries.length) return;
  if (prompt('Type "DELETE" to clear all data:') === "DELETE") {
    entries = [];
    save(entries);
    renderAll();
  }
}

/* ===== Helpers ===== */
function moodToEmoji(m) {
  return {1:"😞",2:"🙁",3:"😐",4:"🙂",5:"😄"}[m] || "❓";
}
function moodToWord(m) {
  return {1:"Bad",2:"Low",3:"Okay",4:"Good",5:"Great"}[m] || "Unknown";
}

/* ===== Kickoff ===== */
document.addEventListener("DOMContentLoaded", init);
