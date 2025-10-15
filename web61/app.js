// ----- Simple Chat App (frontend-only) -----
// Features: persistence via localStorage, typing indicator, edit/delete, dark mode, export

(() => {
  const els = {
    list: document.getElementById("messages"),
    input: document.getElementById("input"),
    form: document.getElementById("composer"),
    typing: document.getElementById("typing"),
    themeToggle: document.getElementById("themeToggle"),
    clearBtn: document.getElementById("clearBtn"),
    exportBtn: document.getElementById("exportBtn"),
    template: document.getElementById("messageTemplate"),
  };

  const STORAGE_KEY = "simple-chat-v1";
  const THEME_KEY = "simple-chat-theme";
  let state = loadState();
  let typingTimer = null;

  // ----- Init -----
  applyTheme(loadTheme());
  renderAll(state.messages);

  // Greet on first run
  if (!state.messages.length) {
    addMessage(
      {
        text: "Hi! I’m a tiny in-browser bot 🤖\n• Type a message and press Enter\n• Shift+Enter for a new line\n• Toggle dark/light with the moon button",
        sender: "bot",
      },
      { persist: true, withTyping: true }
    );
  }

  // ----- Event handlers -----
  // Auto-resize textarea
  const autoResize = () => {
    els.input.style.height = "auto";
    els.input.style.height = Math.min(els.input.scrollHeight, 160) + "px";
  };
  els.input.addEventListener("input", () => {
    autoResize();
    showTyping(true);
    debounceHideTyping();
  });

  // Enter to send (Shift+Enter for newline)
  els.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      trySend();
    }
  });

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    trySend();
  });

  els.themeToggle.addEventListener("change", (e) => {
    const mode = e.target.checked ? "light" : "dark";
    applyTheme(mode);
    saveTheme(mode);
  });

  els.clearBtn.addEventListener("click", () => {
    if (!state.messages.length) return;
    if (confirm("Clear all messages?")) {
      state.messages = [];
      persist();
      els.list.innerHTML = "";
    }
  });

  els.exportBtn.addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      messages: state.messages,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // ----- Core functions -----
  function trySend() {
    const raw = els.input.value.trim();
    if (!raw) return;

    const text = sanitize(raw);
    const you = addMessage({ text, sender: "you" }, { persist: true });

    els.input.value = "";
    autoResize();
    showTyping(false);

    // Simulate bot response
    simulateBotReply(you.text);
  }

  function addMessage(msg, options = {}) {
    const message = {
      id: crypto.randomUUID(),
      text: String(msg.text || ""),
      sender: msg.sender === "you" ? "you" : "bot",
      ts: msg.ts || Date.now(),
      edited: !!msg.edited,
    };

    renderMessage(message);
    scrollToBottom();

    if (options.persist) {
      state.messages.push(message);
      persist();
    }
    if (options.withTyping) {
      // tiny type effect: show after a short delay
      setTimeout(() => scrollToBottom(), 40);
    }
    return message;
  }

  function renderAll(messages) {
    els.list.innerHTML = "";
    messages.forEach(renderMessage);
    // apply initial theme toggle position
    els.themeToggle.checked = loadTheme() === "light";
    setTimeout(scrollToBottom, 0);
  }

  function renderMessage(message) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.dataset.id = message.id;
    node.classList.add(message.sender === "you" ? "me" : "bot");

    const bubble = node.querySelector(".msg__bubble");
    const textEl = node.querySelector(".msg__text");
    const timeEl = node.querySelector(".msg__time");
    const editedEl = node.querySelector(".msg__edited");
    const controls = node.querySelector(".msg__controls");

    textEl.textContent = message.text;
    timeEl.textContent = formatTime(message.ts);
    editedEl.hidden = !message.edited;

    if (message.sender === "you") {
      controls.hidden = false;
      controls
        .querySelector(".msg__edit")
        .addEventListener("click", () => editMessage(message.id));
      controls
        .querySelector(".msg__delete")
        .addEventListener("click", () => deleteMessage(message.id));
    }

    els.list.appendChild(node);
  }

  function editMessage(id) {
    const idx = state.messages.findIndex(
      (m) => m.id === id && m.sender === "you"
    );
    if (idx === -1) return;
    const current = state.messages[idx].text;
    const next = prompt("Edit your message:", current);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) return alert("Message cannot be empty.");
    state.messages[idx].text = trimmed;
    state.messages[idx].edited = true;
    persist();
    // update DOM
    const node = els.list.querySelector(`.msg[data-id="${id}"]`);
    if (node) {
      node.querySelector(".msg__text").textContent = trimmed;
      node.querySelector(".msg__edited").hidden = false;
    }
  }

  function deleteMessage(id) {
    const idx = state.messages.findIndex(
      (m) => m.id === id && m.sender === "you"
    );
    if (idx === -1) return;
    if (!confirm("Delete this message?")) return;
    state.messages.splice(idx, 1);
    persist();
    const node = els.list.querySelector(`.msg[data-id="${id}"]`);
    node?.remove();
  }

  function simulateBotReply(userText) {
    const delay = Math.min(1200, 400 + userText.length * 15);
    showTyping(true);

    setTimeout(() => {
      // Tiny rule-based responses
      const lower = userText.toLowerCase();
      let reply;
      if (/^hello|^hi|^hey\b/.test(lower)) {
        reply = "Hello! 👋 How can I help?";
      } else if (/time|date/.test(lower)) {
        reply = `It's ${new Date().toLocaleString()}.`;
      } else if (/help|what can you do/.test(lower)) {
        reply =
          "I can echo your messages, keep chat history, and let you edit/delete your messages.";
      } else {
        reply = `You said: “${userText}”`;
      }

      addMessage({ text: reply, sender: "bot" }, { persist: true });
      showTyping(false);
    }, delay);
  }

  // ----- Utilities -----
  function sanitize(str) {
    // Basic sanitization (textContent is used, but sanitize anyway)
    return str.replace(/\p{C}/gu, ""); // remove control chars
  }
  function formatTime(ts) {
    try {
      const d = new Date(ts);
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }).format(d);
    } catch {
      return "";
    }
  }
  function scrollToBottom() {
    els.list.scrollTop = els.list.scrollHeight;
  }
  function showTyping(show) {
    els.typing.hidden = !show;
  }
  function debounceHideTyping() {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => showTyping(false), 800);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { messages: [] };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.messages)) return { messages: [] };
      return { messages: parsed.messages };
    } catch {
      return { messages: [] };
    }
  }
  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function applyTheme(mode) {
    document.body.classList.toggle("light", mode === "light");
  }
  function saveTheme(mode) {
    localStorage.setItem(THEME_KEY, mode);
  }
  function loadTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
  }
})();
