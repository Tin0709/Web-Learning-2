// --- Simple Chat (no backend) ---
// Works across multiple tabs via BroadcastChannel.
// Messages persist in localStorage.

const els = {
  messages: document.getElementById("messages"),
  form: document.getElementById("form"),
  input: document.getElementById("input"),
  typing: document.getElementById("typing"),
  emojiBtn: document.getElementById("emojiBtn"),
  usernameDisplay: document.getElementById("usernameDisplay"),
};

const CHANNEL_NAME = "simple-chat";
const STORAGE_KEY = "simple-chat-messages";
const TYPING_DEBOUNCE = 1200;

const bc =
  "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
let typingTimer = null;
// Username (stored once)
let username = localStorage.getItem("simple-chat-username");
if (!username) {
  username =
    prompt("Pick a chat name:") || `User${Math.floor(Math.random() * 1000)}`;
  username = username.trim().slice(0, 20) || "Guest";
  localStorage.setItem("simple-chat-username", username);
}
els.usernameDisplay.textContent = `You: ${username}`;

// Utils
const now = () => new Date().toISOString();
const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const getMessages = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};
const setMessages = (arr) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
