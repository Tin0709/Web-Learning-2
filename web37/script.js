// Hamburger toggle
const hamburger = document.querySelector(".hamburger");
const nav = document.querySelector(".nav-links");
hamburger?.addEventListener("click", () => {
  const open = nav.getAttribute("data-open") === "true";
  nav.setAttribute("data-open", String(!open));
  hamburger.setAttribute("aria-expanded", String(!open));
});
