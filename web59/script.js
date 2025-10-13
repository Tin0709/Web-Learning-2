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
