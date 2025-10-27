// Client-side chat logic (vanilla JS)
const socket = io();

const modal = document.getElementById("modal");
const nameForm = document.getElementById("nameForm");
const usernameInput = document.getElementById("username");

const meName = document.getElementById("meName");
const usersList = document.getElementById("users");

const messages = document.getElementById("messages");
const typingBar = document.getElementById("typingBar");

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let myName = null;
let typingTimeout = null;
const currentlyTyping = new Set();

// Helpers
function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function addSystem(text) {
  const el = document.createElement("div");
  el.className = "system";
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

function addMessage({ username, message, ts }, mine = false) {
  const wrap = document.createElement("div");
  wrap.className = "msg" + (mine ? " me" : "");

  const meta = document.createElement("div");
  meta.className = "meta";
  const nameSpan = document.createElement("span");
  nameSpan.textContent = username;
  const timeSpan = document.createElement("span");
  timeSpan.textContent = fmtTime(ts || Date.now());
  meta.appendChild(nameSpan);
  meta.appendChild(timeSpan);

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = message;

  wrap.appendChild(meta);
  wrap.appendChild(text);
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
}
function updateTypingBar() {
  const arr = Array.from(currentlyTyping).filter((n) => n !== myName);
  if (arr.length === 0) {
    typingBar.textContent = "";
  } else if (arr.length === 1) {
    typingBar.textContent = `${arr[0]} is typing…`;
  } else if (arr.length === 2) {
    typingBar.textContent = `${arr[0]} and ${arr[1]} are typing…`;
  } else {
    typingBar.textContent = `Several people are typing…`;
  }
}

// Handle joining
nameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = usernameInput.value.trim().slice(0, 32);
  if (!name) return;

  myName = name;
  meName.textContent = myName;
  socket.emit("join", myName);

  modal.style.display = "none";
  messageInput.disabled = false;
  sendBtn.disabled = false;
  messageInput.focus();
});
