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
