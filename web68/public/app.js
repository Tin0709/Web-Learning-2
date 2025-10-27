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
