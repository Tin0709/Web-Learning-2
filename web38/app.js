const DOM = {
  jokeArea: document.getElementById("jokeArea"),
  newBtn: document.getElementById("newJokeBtn"),
  copyBtn: document.getElementById("copyBtn"),
  speakBtn: document.getElementById("speakBtn"),
  toast: document.getElementById("toast"),
  themeToggle: document.getElementById("themeToggle"),
  card: document.querySelector(".card"),
};
// --- Theme handling ---
const prefersLight =
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: light)").matches;
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light" || (!savedTheme && prefersLight)) {
  document.documentElement.classList.add("light");
}
DOM.themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
  localStorage.setItem(
    "theme",
    document.documentElement.classList.contains("light") ? "light" : "dark"
  );
});

// --- Utilities ---
function showToast(msg) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.add("show");
  setTimeout(() => DOM.toast.classList.remove("show"), 1400);
}
