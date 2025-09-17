// === Simple Joke Generator ===
// API: https://icanhazdadjoke.com/ (requires Accept: application/json)

const DOM = {
  jokeArea: document.getElementById("jokeArea"),
  newBtn: document.getElementById("newJokeBtn"),
  copyBtn: document.getElementById("copyBtn"),
  speakBtn: document.getElementById("speakBtn"),
  toast: document.getElementById("toast"),
  themeToggle: document.getElementById("themeToggle"),
  card: document.querySelector(".card"),
};

const STATE = {
  currentJoke: "",
  loading: false,
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

function setLoading(isLoading) {
  STATE.loading = isLoading;
  DOM.newBtn.disabled = isLoading;
  DOM.copyBtn.disabled = isLoading;
  DOM.speakBtn.disabled = isLoading;

  DOM.card.setAttribute("aria-busy", String(isLoading));

  if (isLoading) {
    DOM.jokeArea.innerHTML = `
        <div class="skeleton line"></div>
        <div class="skeleton line short"></div>
      `;
  }
}

// Fetch with timeout/abort for nicer UX
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

async function getJoke() {
  setLoading(true);
  try {
    const res = await fetchWithTimeout("https://icanhazdadjoke.com/", {
      headers: {
        Accept: "application/json",
        "User-Agent": "JokeGeneratorDemo (learn project)",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const joke = data.joke?.trim();
    if (!joke) throw new Error("No joke in response.");

    STATE.currentJoke = joke;
    DOM.jokeArea.textContent = joke;
  } catch (err) {
    console.error(err);
    STATE.currentJoke = "";
    DOM.jokeArea.innerHTML = `<span role="alert">Couldn’t fetch a joke. Check your internet and try again.</span>`;
  } finally {
    setLoading(false);
  }
}

async function copyJoke() {
  if (!STATE.currentJoke) return;
  try {
    await navigator.clipboard.writeText(STATE.currentJoke);
    showToast("Copied!");
  } catch {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = STATE.currentJoke;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast("Copied!");
    } catch {
      showToast("Copy failed");
    } finally {
      document.body.removeChild(ta);
    }
  }
}

function speakJoke() {
  if (!STATE.currentJoke) return;
  if (!("speechSynthesis" in window)) {
    showToast("Speech not supported");
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(STATE.currentJoke);
  utter.rate = 1.0;
  utter.pitch = 1.0;
  speechSynthesis.speak(utter);
}

// --- Event listeners ---
DOM.newBtn.addEventListener("click", getJoke);
DOM.copyBtn.addEventListener("click", copyJoke);
DOM.speakBtn.addEventListener("click", speakJoke);

// Keyboard shortcuts: N=New, C=Copy, S=Speak
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea")) return;
  if (e.key.toLowerCase() === "n") {
    getJoke();
  }
  if (e.key.toLowerCase() === "c") {
    copyJoke();
  }
  if (e.key.toLowerCase() === "s") {
    speakJoke();
  }
});

// Initial load
getJoke();
