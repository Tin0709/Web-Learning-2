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
