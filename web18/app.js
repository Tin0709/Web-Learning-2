// Simple hash router + markdown renderer + search + theme toggle

const $ = (sel) => document.querySelector(sel);
const app = $("#app");
const searchInput = $("#search");
const themeToggle = $("#themeToggle");

const state = {
  postsIndex: [], // from posts/posts.json
  filtered: [], // search results
  theme:
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"),
};

// Apply initial theme
document.documentElement.classList.toggle("dark", state.theme === "dark");
$("#year").textContent = new Date().getFullYear();

// Configure marked + highlight.js
document.addEventListener("DOMContentLoaded", () => {
  if (window.marked) {
    marked.setOptions({
      breaks: true,
      highlight: function (code, lang) {
        try {
          if (window.hljs && lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          } else if (window.hljs) {
            return hljs.highlightAuto(code).value;
          }
        } catch (e) {}
        return code; // fallback without highlighting
      },
    });
  }
});
