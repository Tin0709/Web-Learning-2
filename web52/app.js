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

// Render
function render() {
  const data = getMessages();
  els.messages.innerHTML = "";
  data.forEach((m) => {
    const wrap = document.createElement("div");
    wrap.className = `msg ${m.user === username ? "msg--mine" : "msg--theirs"}`;

    const meta = document.createElement("div");
    meta.className = "msg__meta";
    meta.textContent =
      m.user === username
        ? `You • ${fmtTime(m.time)}`
        : `${m.user} • ${fmtTime(m.time)}`;

    const bubble = document.createElement("div");
    bubble.className = "msg__bubble";
    bubble.textContent = m.text;

    wrap.appendChild(meta);
    wrap.appendChild(bubble);
    els.messages.appendChild(wrap);
  });
  // Autoscroll
  els.messages.scrollTop = els.messages.scrollHeight;
}

// Send a message
function sendMessage(text) {
  const trimmed = text.replace(/\s+$/g, "");
  if (!trimmed) return;

  const message = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
    user: username,
    text: trimmed,
    time: now(),
  };

  const data = getMessages();
  data.push(message);
  setMessages(data);
  render();

  // Broadcast to other tabs
  bc?.postMessage({ type: "message", payload: message });
}

// Typing indicator
function broadcastTyping() {
  bc?.postMessage({
    type: "typing",
    payload: { user: username, at: Date.now() },
  });
}

// Handle form
els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(els.input.value);
  els.input.value = "";
  els.input.style.height = "auto";
});

els.input.addEventListener("keydown", (e) => {
  // Enter to send, Shift+Enter for newline
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    els.form.dispatchEvent(new Event("submit"));
    return;
  }
});

els.input.addEventListener("input", () => {
  // Autosize textarea
  els.input.style.height = "auto";
  els.input.style.height = Math.min(160, els.input.scrollHeight) + "px";

  broadcastTyping();
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = setTimeout(() => (els.typing.hidden = true), TYPING_DEBOUNCE);
});

// Emoji helper
els.emojiBtn.addEventListener("click", () => {
  const emoji = "🙂";
  const { selectionStart, selectionEnd, value } = els.input;
  els.input.value =
    value.slice(0, selectionStart) + emoji + value.slice(selectionEnd);
  els.input.focus();
  els.input.dispatchEvent(new Event("input"));
});
