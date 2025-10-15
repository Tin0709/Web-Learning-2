// ----- Simple Chat App (frontend-only) -----
// Features: persistence via localStorage, typing indicator, edit/delete, dark mode, export

() => {
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
};
