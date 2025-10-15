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
};
