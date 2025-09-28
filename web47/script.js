// ====== Simple Budget Planner ======

/** Utilities */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: guessCurrency(),
  maximumFractionDigits: 2,
});
function guessCurrency() {
  // Try to infer from browser locale; fallback USD
  try {
    const region = Intl.DateTimeFormat().resolvedOptions().locale.split("-")[1];
    const map = {
      US: "USD",
      VN: "VND",
      GB: "GBP",
      EU: "EUR",
      DE: "EUR",
      FR: "EUR",
      CA: "CAD",
      AU: "AUD",
      JP: "JPY",
      IN: "INR",
    };
    return map[region] || "USD";
  } catch {
    return "USD";
  }
}
const fmtMoney = (n) => currency.format(n);

/** State */
const STORAGE_KEY = "budget_planner_tx_v1";
let transactions = load();
let editId = null;

/** DOM refs */
const incomeTotalEl = $("#incomeTotal");
const expenseTotalEl = $("#expenseTotal");
const balanceTotalEl = $("#balanceTotal");

const formTitleEl = $("#formTitle");
const txForm = $("#txForm");
const dateEl = $("#date");
const typeEl = $("#type");
const categoryEl = $("#category");
const descEl = $("#description");
const amountEl = $("#amount");
const cancelEditBtn = $("#cancelEditBtn");

const txTbody = $("#txTbody");
const pageTotalEl = $("#pageTotal");

const filterMonthEl = $("#filterMonth");
const filterCategoryEl = $("#filterCategory");
const filterTextEl = $("#filterText");
const sortByEl = $("#sortBy");

const datalist = $("#categoryList");
const breakdownEl = $("#breakdown");

const exportCsvBtn = $("#exportCsvBtn");
const clearAllBtn = $("#clearAllBtn");

/** Init */
setDefaultDates();
renderAll();

/** Event Listeners */
txForm.addEventListener("submit", handleSave);
cancelEditBtn.addEventListener("click", cancelEdit);
filterMonthEl.addEventListener("input", renderAll);
filterCategoryEl.addEventListener("change", renderAll);
filterTextEl.addEventListener("input", renderAll);
sortByEl.addEventListener("change", renderAll);
exportCsvBtn.addEventListener("click", exportCSV);
clearAllBtn.addEventListener("click", clearAllConfirm);
