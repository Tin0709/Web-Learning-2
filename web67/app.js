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
