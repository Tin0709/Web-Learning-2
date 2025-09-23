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
