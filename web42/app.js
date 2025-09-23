/* =========================================================
   Habit Tracker (7-day rolling) — Vanilla JS + localStorage
   ========================================================= */

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const habitForm = $("#habitForm");
const habitNameInput = $("#habitName");
const habitList = $("#habitList");
const weekHeader = $("#weekHeader");
const exportBtn = $("#exportBtn");
const importInput = $("#importInput");
const clearAllBtn = $("#clearAllBtn");

const STORAGE_KEY = "habit-tracker.v1";

/* ---------- Date helpers ---------- */
const toDateKey = (d) => {
  // local date key YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const today = () => new Date();
const last7 = () => {
  // returns array of Date objects: 6 days ago ... today
  const dates = [];
  const t = today();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(t);
    d.setDate(t.getDate() - i);
    dates.push(d);
  }
  return dates;
};
const shortLabel = (d) =>
  d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
const dayNum = (d) => d.getDate();

/* ---------- State ---------- */
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { habits: [] };
    const parsed = JSON.parse(raw);
    if (!parsed.habits) parsed.habits = [];
    return parsed;
  } catch (e) {
    console.warn("Failed to load state", e);
    return { habits: [] };
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- Rendering ---------- */
function renderWeekHeader() {
  weekHeader.innerHTML = "";
  const dates = last7();
  // first column label handled in CSS ::before
  dates.forEach((d, idx) => {
    const div = document.createElement("div");
    div.className = "week-col";
    div.title = d.toLocaleDateString();
    const isToday = idx === dates.length - 1;
    div.innerHTML = `${shortLabel(d)} <span style="opacity:.7">${dayNum(
      d
    )}</span>${isToday ? " • Today" : ""}`;
    weekHeader.appendChild(div);
  });
}

function computeStreak(habit) {
  // Count consecutive days up to today() that are true
  let streak = 0;
  let cursor = new Date(today());
  while (true) {
    const key = toDateKey(cursor);
    if (habit.log && habit.log[key]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function weeklyProgress(habit) {
  const dates = last7().map(toDateKey);
  let count = 0;
  dates.forEach((k) => {
    if (habit.log && habit.log[k]) count++;
  });
  return count;
}

function render() {
  renderWeekHeader();
  habitList.innerHTML = "";
  const dates = last7();
  state.habits.forEach((habit) => {
    const tpl = $("#habitItemTemplate");
    const node = tpl.content.firstElementChild.cloneNode(true);

    const titleEl = $(".habit-title", node);
    titleEl.textContent = habit.name;
    titleEl.addEventListener("blur", (e) => {
      const newName = e.target.textContent.trim().slice(0, 60) || "Untitled";
      habit.name = newName;
      save();
      render(); // re-render to ensure consistency
    });
    titleEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur();
      }
    });

    const grid = $(".grid", node);
    grid.innerHTML = "";
    dates.forEach((d, idx) => {
      const key = toDateKey(d);
      const btn = document.createElement("button");
      btn.className = "day";
      btn.type = "button";
      btn.setAttribute("aria-pressed", !!(habit.log && habit.log[key]));
      btn.title = d.toLocaleDateString();
      btn.textContent = shortLabel(d)[0]; // single letter (M, T, W...)
      if (idx === dates.length - 1) btn.classList.add("today");
      if (habit.log && habit.log[key]) btn.classList.add("done");

      btn.addEventListener("click", () => {
        if (!habit.log) habit.log = {};
        habit.log[key] = !habit.log[key];
        save();
        updateRow(node, habit); // fast update
      });

      grid.appendChild(btn);
    });

    // actions
    $(".delete-btn", node).addEventListener("click", () => {
      const ok = confirm(
        `Delete habit “${habit.name}”? This cannot be undone.`
      );
      if (!ok) return;
      state.habits = state.habits.filter((h) => h.id !== habit.id);
      save();
      render();
    });

    $(".today-btn", node).addEventListener("click", () => {
      const key = toDateKey(today());
      if (!habit.log) habit.log = {};
      habit.log[key] = !habit.log[key];
      save();
      updateRow(node, habit);
    });

    // initial meta & progress
    updateRow(node, habit);

    habitList.appendChild(node);
  });
}

function updateRow(node, habit) {
  // Update streak, progress, and day button styles for this habit row
  const streak = computeStreak(habit);
  $(".streak strong", node).textContent = streak.toString();
  $(".streak", node).setAttribute(
    "aria-label",
    `Current streak: ${streak} days`
  );

  const weekly = weeklyProgress(habit);
  const pct = Math.round((weekly / 7) * 100);
  $(".progress-bar > span", node).style.width = pct + "%";
  $(".progress-text", node).textContent = `${weekly}/7`;

  // Update day buttons without full re-render
  const dates = last7();
  $$(".day", node).forEach((btn, i) => {
    const key = toDateKey(dates[i]);
    const done = !!(habit.log && habit.log[key]);
    btn.classList.toggle("done", done);
    btn.setAttribute("aria-pressed", done);
  });
}

/* ---------- Add habit ---------- */
habitForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = habitNameInput.value.trim();
  if (!name) return;
  const habit = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random()),
    name,
    createdAt: Date.now(),
    log: {}, // { "YYYY-MM-DD": true }
  };
  state.habits.unshift(habit);
  save();
  habitNameInput.value = "";
  render();
});

/* ---------- Export / Import / Clear ---------- */
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = toDateKey(new Date()).replaceAll("-", "");
  a.download = `habit-tracker-backup-${dateStr}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

importInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || !Array.isArray(data.habits)) {
      alert("Invalid backup file.");
      return;
    }
    state = data;
    save();
    render();
  } catch (err) {
    console.error(err);
    alert("Failed to import backup.");
  } finally {
    importInput.value = "";
  }
});

clearAllBtn.addEventListener("click", () => {
  const ok = confirm("Delete ALL habits and data? This cannot be undone.");
  if (!ok) return;
  state = { habits: [] };
  save();
  render();
});

/* ---------- Init ---------- */
renderWeekHeader();
render();
