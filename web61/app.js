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
};
