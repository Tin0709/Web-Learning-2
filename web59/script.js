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
/* ---------- Date helpers ---------- */
function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function isSameDayStr(str1, str2) {
  return str1 === str2;
}
function uid() {
  return "h_" + Math.random().toString(36).slice(2, 9);
}

/* ---------- Rendering ---------- */
function renderAll(scrollToBottom = false) {
  const { year, month } = state.monthView;

  // Month label
  const dt = new Date(year, month, 1);
  const full = dt.toLocaleString(undefined, { month: "long", year: "numeric" });
  monthLabel.textContent = full;

  // Weekday header
  renderWeekdayHeader(year, month);

  // Habit rows
  habitList.innerHTML = "";
  const frag = document.createDocumentFragment();
  const habits = [...state.habits].sort(
    (a, b) =>
      Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name)
  );
  if (habits.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "18px";
    empty.style.color = "#9aa0a6";
    empty.textContent = "No habits yet. Add one above to get started!";
    habitList.appendChild(empty);
    return;
  }

  habits.forEach((habit) => {
    const row = habitRowTpl.content.firstElementChild.cloneNode(true);
    row.dataset.id = habit.id;
    if (habit.archived) row.classList.add("archived");

    // Meta
    const colorDot = $(".color-dot", row);
    colorDot.style.background = habit.color;

    const titleEl = $(".habit-title", row);
    titleEl.textContent = habit.name;
    titleEl.addEventListener("dblclick", () => beginRename(row, habit));
    $(".renameBtn", row).addEventListener("click", () =>
      beginRename(row, habit)
    );

    $(".archiveBtn", row).addEventListener("click", () => {
      habit.archived = !habit.archived;
      saveState();
      renderAll();
    });
    $(".deleteBtn", row).addEventListener("click", () => {
      const ok = confirm(`Delete "${habit.name}"? This cannot be undone.`);
      if (!ok) return;
      state.habits = state.habits.filter((h) => h.id !== habit.id);
      saveState();
      renderAll();
    });

    // Day grid
    const grid = $(".day-grid", row);
    const countDays = daysInMonth(year, month);
    const todayStr = isoDate(new Date());

    let completedThisMonth = 0;
    for (let d = 1; d <= countDays; d++) {
      const dateStr = isoDate(new Date(year, month, d));
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "day-cell";
      cell.title = `${dateStr} • ${habit.name}`;
      cell.setAttribute("aria-pressed", String(Boolean(habit.marks[dateStr])));
      cell.dataset.date = dateStr;

      const dot = document.createElement("div");
      dot.className = "dot";
      cell.appendChild(dot);

      if (habit.marks[dateStr]) {
        cell.classList.add("done");
        completedThisMonth++;
        dot.style.background = habit.color + "66";
        dot.style.borderColor = habit.color;
      }
      if (isSameDayStr(dateStr, todayStr)) cell.classList.add("today");

      cell.addEventListener("click", () => {
        habit.marks[dateStr] = !habit.marks[dateStr];
        // If false, clean up
        if (!habit.marks[dateStr]) delete habit.marks[dateStr];
        saveState();
        // Update cell visual quickly instead of full rerender
        cell.classList.toggle("done");
        cell.setAttribute(
          "aria-pressed",
          String(Boolean(habit.marks[dateStr]))
        );
        dot.style.background = habit.marks[dateStr] ? habit.color + "66" : "";
        dot.style.borderColor = habit.marks[dateStr] ? habit.color : "";
        // Update progress + streak
        updateMeta(row, habit, year, month);
      });

      grid.appendChild(cell);
    }

    // Meta details
    updateMeta(row, habit, year, month);

    frag.appendChild(row);
  });

  habitList.appendChild(frag);

  if (scrollToBottom) habitList.scrollTop = habitList.scrollHeight;
}

function renderWeekdayHeader(year, month) {
  weekdayRow.innerHTML = "";
  const countDays = daysInMonth(year, month);
  for (let d = 1; d <= countDays; d++) {
    const date = new Date(year, month, d);
    const wd = date.toLocaleString(undefined, { weekday: "short" });
    const wrap = document.createElement("div");
    wrap.className = "weekday";
    wrap.innerHTML = `<div>${wd}</div><span class="daynum">${d}</span>`;
    weekdayRow.appendChild(wrap);
  }
}

function changeMonth(delta) {
  let { year, month } = state.monthView;
  month += delta;
  if (month < 0) {
    month = 11;
    year -= 1;
  }
  if (month > 11) {
    month = 0;
    year += 1;
  }
  state.monthView = { year, month };
  saveState();
  renderAll();
}
/* ---------- Meta (streak & progress) ---------- */
function updateMeta(row, habit, year, month) {
  const streakEl = $(".streak", row);
  const prog = $(".progress", row);
  const bar = $(".progress-bar", row);
  const progLabel = $(".progress-label", row);

  const monthDays = daysInMonth(year, month);
  let completed = 0;
  for (let d = 1; d <= monthDays; d++) {
    const dateStr = isoDate(new Date(year, month, d));
    if (habit.marks[dateStr]) completed++;
  }
  const percent = Math.round((completed / monthDays) * 100);
  bar.style.width = `${percent}%`;
  progLabel.textContent = `${percent}%`;

  const s = computeStreak(habit);
  streakEl.textContent = `🔥 ${s}`;
}

function computeStreak(habit) {
  // Streak counts consecutive days up to TODAY (in local time)
  const today = new Date();
  let cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;
  for (;;) {
    const key = isoDate(cur);
    if (habit.marks[key]) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      // allow "skip today but counted from yesterday" ONLY if today not marked and yesterday is
      if (streak === 0) {
        const y = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 1
        );
        if (habit.marks[isoDate(y)]) {
          streak = 1; // start from yesterday
          cur = new Date(y.getFullYear(), y.getMonth(), y.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }
  return streak;
}
