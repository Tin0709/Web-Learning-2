/* =========================
   Expense Tracker - Vanilla JS
   ========================= */

const STORAGE_KEY = "et.transactions.v1";
const DEFAULT_CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"],
  expense: [
    "Food",
    "Transport",
    "Rent",
    "Bills",
    "Shopping",
    "Education",
    "Health",
    "Entertainment",
    "Travel",
    "Other",
  ],
};

// Elements
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("totalIncome");
const expenseEl = document.getElementById("totalExpense");
