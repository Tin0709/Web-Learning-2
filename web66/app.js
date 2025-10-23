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
