/* ====== Simple Habit Tracker (Vanilla JS) ======
   Data model persisted in localStorage:
   {
     monthView: { year: 2025, month: 9 },  // 0-based month
     habits: [
       {
         id: 'h_xxx',
         name: 'Read 20 mins',
         color: '#4f46e5',
         archived: false,
         createdAt: '2025-10-10',
         marks: { '2025-10-10': true, '2025-10-11': true, ... }
       }
     ]
   }
================================================= */

const STORAGE_KEY = "habitTracker_v1";
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const state = loadState();

// DOM refs
const monthLabel = $("#monthLabel");
const prevMonthBtn = $("#prevMonthBtn");
const nextMonthBtn = $("#nextMonthBtn");
const todayBtn = $("#todayBtn");

const weekdayRow = $("#weekdayRow");
const habitList = $("#habitList");
const addHabitForm = $("#addHabitForm");
const habitNameInput = $("#habitName");
const habitColorInput = $("#habitColor");

const exportBtn = $("#exportBtn");
const importInput = $("#importInput");
const clearAllBtn = $("#clearAllBtn");

const habitRowTpl = $("#habitRowTpl");
init();

function init() {
  attachGlobalHandlers();
  renderAll();
  // Focus new habit input for quick entry
  habitNameInput.focus();
}

function attachGlobalHandlers() {
  prevMonthBtn.addEventListener("click", () => changeMonth(-1));
  nextMonthBtn.addEventListener("click", () => changeMonth(1));
  todayBtn.addEventListener("click", () => {
    const now = new Date();
    state.monthView = { year: now.getFullYear(), month: now.getMonth() };
    saveState();
    renderAll();
  });

  addHabitForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = habitNameInput.value.trim();
    const color = habitColorInput.value || "#4f46e5";
    if (!name) return;
    state.habits.push({
      id: uid(),
      name,
      color,
      archived: false,
      createdAt: isoDate(new Date()),
      marks: {},
    });
    saveState();
    habitNameInput.value = "";
    renderAll(true); // scroll to bottom after add
  });

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `habit-tracker-backup-${Date.now()}.json`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.habits))
        throw new Error("Invalid file");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      Object.assign(state, parsed);
      renderAll();
      alert("Import successful ✅");
    } catch (err) {
      alert("Import failed. Make sure you selected a valid backup JSON.");
      console.error(err);
    } finally {
      importInput.value = "";
    }
  });

  clearAllBtn.addEventListener("click", () => {
    if (confirm("This will erase all habits and marks. Continue?")) {
      localStorage.removeItem(STORAGE_KEY);
      Object.assign(state, defaultState());
      renderAll();
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target === habitNameInput) return;
    if (e.key === "ArrowLeft" && (e.altKey || e.metaKey)) changeMonth(-1);
    if (e.key === "ArrowRight" && (e.altKey || e.metaKey)) changeMonth(1);
    if (e.key === "t" && (e.altKey || e.metaKey)) todayBtn.click();
  });
}

/* ---------- State ---------- */
function defaultState() {
  const now = new Date();
  return {
    monthView: { year: now.getFullYear(), month: now.getMonth() },
    habits: [],
  };
}
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const d = defaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    return d;
  }
  try {
    const parsed = JSON.parse(raw);
    // In case of missing fields
    return {
      ...defaultState(),
      ...parsed,
      habits: (parsed.habits || []).map((h) => ({
        marks: {},
        archived: false,
        ...h,
      })),
    };
  } catch {
    const d = defaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    return d;
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
