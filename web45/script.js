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
// Autosize textarea
function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 180) + "px";
}
inputEl.addEventListener("input", () => autoGrow(inputEl));

// Save & Load
function saveMessages() {
  const items = [...messagesEl.querySelectorAll(".msg")].map((card) => ({
    role: card.classList.contains("me") ? "me" : "bot",
    text: card.querySelector(".msg__text")?.textContent || "",
    time: card.querySelector(".msg__time")?.textContent || "",
  }));
  localStorage.setItem(MSGS_KEY, JSON.stringify(items));
}
function loadMessages() {
  const raw = localStorage.getItem(MSGS_KEY);
  if (!raw) {
    // Seed with a welcome
    addMessage(
      "bot",
      "Hey! I’m your friendly chat bot.\nTry asking me about the time, a joke, or just say hi 👋"
    );
    return;
  }
  try {
    const items = JSON.parse(raw);
    items.forEach(({ role, text, time }) =>
      addMessage(role, text, time, false)
    );
  } catch (e) {
    console.warn("Failed to parse saved messages", e);
  }
}
