// Hamburger toggle
const hamburger = document.querySelector(".hamburger");
const nav = document.querySelector(".nav-links");
hamburger?.addEventListener("click", () => {
  const open = nav.getAttribute("data-open") === "true";
  nav.setAttribute("data-open", String(!open));
  hamburger.setAttribute("aria-expanded", String(!open));
});

// Smooth close on nav link click (mobile)
nav.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    nav.setAttribute("data-open", "false");
    hamburger.setAttribute("aria-expanded", "false");
  });
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Contact form (demo)
const form = document.querySelector(".contact-form");
const statusEl = document.querySelector(".form-status");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  // Simple validation
  if (!data.name || !data.email || !data.message) {
    statusEl.textContent = "Please fill out all fields.";
    return;
  }
  // Fake "sent"
  statusEl.textContent = "Thanks! Your message has been queued (demo).";
  form.reset();
});

// Back to top keyboard helper
document.querySelector(".back-to-top")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
});
