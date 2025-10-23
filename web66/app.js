// === Settings ===
const STORAGE_KEY = "md_previewer_text";
const THEME_KEY = "md_previewer_theme";

// Configure marked (Markdown parser)
marked.setOptions({
  gfm: true,
  breaks: true,
  smartLists: true,
  smartypants: false,
});

// === Elements ===
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const themeToggle = document.getElementById("themeToggle");
const copyHtmlBtn = document.getElementById("copyHtmlBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");

// === Sample content (only used on first run) ===
const SAMPLE = `# 👋 Welcome to Markdown Previewer

Type Markdown on the left — see clean, **sanitized** HTML on the right.

## Features
- Live preview
- Toolbar for common snippets
- Auto-save to \`localStorage\`
- Dark mode
- Copy rendered HTML
- Download your \`.md\`

## Markdown Goodies
- **Bold**, *italic*, \`inline code\`
- Lists
- > Blockquotes

\`\`\`js
console.log("Hello, Markdown!");
\`\`\`

[Links](https://example.com) and tables:

| Feature | Status |
|--------:|:------|
| Live    | ✅     |
| Secure  | ✅     |
`;

// === Helpers ===
const save = (text) => localStorage.setItem(STORAGE_KEY, text);
const load = () => localStorage.getItem(STORAGE_KEY);

function render(markdown) {
  // Parse Markdown -> HTML
  const dirty = marked.parse(markdown ?? "");
  // Sanitize HTML (XSS protection)
  const clean = DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
  preview.innerHTML = clean;
}

// Debounce typing
let typingTimer;
function handleInput() {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    const val = editor.value;
    save(val);
    render(val);
  }, 120);
}

// === Initialize editor ===
function initEditor() {
  const existing = load();
  editor.value = existing ?? SAMPLE;
  render(editor.value);
  editor.addEventListener("input", handleInput);
  // Basic Ctrl/Cmd+S to download
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      triggerDownload();
    }
  });
}
// === Theme handling ===
function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  themeToggle.checked = theme === "dark";
  localStorage.setItem(THEME_KEY, theme);
}
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved ?? (prefersDark ? "dark" : "light"));
  themeToggle.addEventListener("change", () => {
    applyTheme(themeToggle.checked ? "dark" : "light");
  });
}

// === Toolbar inserts ===
function insertAtSelection({ insert, prefix }) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const hasSelection = start !== end;
  const value = editor.value;

  if (insert) {
    // Wrap selection with insert if it looks like **text** or `code`
    if (insert.includes("**") || insert.includes("*") || insert.includes("`")) {
      const marker = insert.includes("**")
        ? "**"
        : insert.includes("`")
        ? "`"
        : "*";
      if (hasSelection) {
        const selected = value.slice(start, end);
        const wrapped = `${marker}${selected}${marker}`;
        editor.setRangeText(wrapped, start, end, "end");
      } else {
        editor.setRangeText(insert, start, end, "end");
      }
    } else {
      editor.setRangeText(insert, start, end, "end");
    }
  } else if (prefix) {
    // Line-prefix insertion (e.g., "# ", "- ", "> ")
    const before = value.slice(0, start);
    const after = value.slice(end);
    const lastNl = before.lastIndexOf("\n");
    const lineStart = lastNl === -1 ? 0 : lastNl + 1;
    const currentLine = value.slice(lineStart, end);
    const newLine = prefix + currentLine;
    const newValue = before.slice(0, lineStart) + newLine + after;
    editor.value = newValue;
    // Restore caret end
    const newCaret = lineStart + newLine.length;
    editor.setSelectionRange(newCaret, newCaret);
  }

  editor.dispatchEvent(new Event("input"));
  editor.focus();
}

function initToolbar() {
  document.querySelectorAll(".toolbar button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const insert = btn.getAttribute("data-insert");
      const prefix = btn.getAttribute("data-prefix");
      insertAtSelection({ insert, prefix });
    });
  });
}
