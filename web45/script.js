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

// Add message DOM
function addMessage(role, text, timeStr = null, save = true) {
  const tpl = document.getElementById("msg-template");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  node.classList.add(role === "me" ? "me" : "bot");

  const avatar = node.querySelector(".msg__avatar");
  avatar.textContent = role === "me" ? "🧑" : "🤖";

  node.querySelector(".msg__text").textContent = text;
  node.querySelector(".msg__time").textContent =
    timeStr || formatTime(new Date());

  messagesEl.appendChild(node);
  scrollToBottom();
  if (save) saveMessages();
}

// Utilities
function formatTime(d) {
  // HH:MM • dd Mon
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const mon = d.toLocaleString(undefined, { month: "short" });
  return `${h}:${m} • ${day} ${mon}`;
}
function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight + 1000;
}

// Bot logic
function botReply(userText) {
  const t = userText.trim().toLowerCase();

  // simple intents
  const now = new Date();
  if (/^hi$|^hey$|^hello$|howdy|yo/.test(t)) {
    return "Hello! How can I help today?";
  }
  if (/(what'?s|what is) the time|current time|tell me the time/.test(t)) {
    return `It's ${now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}.`;
  }
  if (/date|day.*today/.test(t)) {
    return `Today is ${now.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.`;
  }
  if (/joke|make me laugh|funny/.test(t)) {
    const jokes = [
      "Why did the developer go broke? Because they used up all their cache.",
      "I told my computer I needed a break, and it said 'No problem — I’ll go to sleep.'",
      "There are 10 kinds of people: those who understand binary and those who don’t.",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  if (/help|what can you do|\?/.test(t)) {
    return "Try: 'time', 'date', 'tell a joke', or just chat with me. I also echo your message!";
  }

  // default echo
  const caps =
    userText.length > 120 ? userText.slice(0, 117) + "..." : userText;
  return `You said: “${caps}”`;
}

// Typing indicator controls
let typingTimer = null;
function showTyping(show) {
  if (show) {
    typingEl.classList.remove("hidden");
    typingEl.setAttribute("aria-hidden", "false");
  } else {
    typingEl.classList.add("hidden");
    typingEl.setAttribute("aria-hidden", "true");
  }
}

// Send handling
function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage("me", text);
  inputEl.value = "";
  autoGrow(inputEl);

  // Simulate bot typing
  showTyping(true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    const reply = botReply(text);
    addMessage("bot", reply);
    showTyping(false);
  }, Math.min(1200 + Math.random() * 800, 2200));
}

// Keybindings
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", sendMessage);

// Theme toggle
themeToggle.addEventListener("click", () => {
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";
  document.documentElement.setAttribute(
    "data-theme",
    isLight ? "dark" : "light"
  );
  localStorage.setItem(THEME_KEY, isLight ? "dark" : "light");
});

// Clear chat
clearChatBtn.addEventListener("click", () => {
  if (!confirm("Clear all messages?")) return;
  localStorage.removeItem(MSGS_KEY);
  messagesEl.innerHTML = "";
  addMessage("bot", "Chat cleared. Fresh start! ✨");
});

// Init
window.addEventListener("DOMContentLoaded", () => {
  loadMessages();
  autoGrow(inputEl);
  scrollToBottom();
});
