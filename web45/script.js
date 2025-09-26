// --- Basic Chat App with a simple bot, typing indicator, and persistence ---

const $ = (sel) => document.querySelector(sel);
const messagesEl = $("#messages");
const inputEl = $("#input");
const sendBtn = $("#sendBtn");
const typingEl = $("#typing");
const themeToggle = $("#themeToggle");
const clearChatBtn = $("#clearChat");
const MSGS_KEY = "sleek-chat:messages";
const THEME_KEY = "sleek-chat:theme";

// Restore theme
(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  if (saved === "light")
    document.documentElement.setAttribute("data-theme", "light");
})();
