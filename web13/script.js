// ===== Utilities =====
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function randomHex() {
  const n = randInt(0, 0xffffff);
  return `#${n.toString(16).padStart(6, "0").toUpperCase()}`;
}

// Perceived luminance for contrast (WCAG-ish)
function getTextColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return luminance > 0.32 ? "#0b0d12" : "#F5F7FF";
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : [0, 0, 0];
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1200);
}

// ===== App State =====
const SWATCH_COUNT = 5;
let state = {
  colors: [],
  locks: Array(SWATCH_COUNT).fill(false),
};

// Restore last session if available
try {
  const cached = JSON.parse(localStorage.getItem("palette_state"));
  if (
    cached &&
    Array.isArray(cached.colors) &&
    cached.colors.length === SWATCH_COUNT
  ) {
    state = cached;
  }
} catch {
  /* noop */
}

// ===== DOM =====
const palette = document.getElementById("palette");
const generateBtn = document.getElementById("generateBtn");
const shuffleBtn = document.getElementById("shuffleCountBtn");

// Build swatches
function buildSwatches() {
  palette.innerHTML = "";
  for (let i = 0; i < SWATCH_COUNT; i++) {
    const swatch = document.createElement("section");
    swatch.className = "swatch";
    swatch.setAttribute("role", "group");
    swatch.setAttribute("aria-label", `Color ${i + 1}`);

    const colorLayer = document.createElement("div");
    colorLayer.className = "color";
    swatch.appendChild(colorLayer);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `#${i + 1}`;
    swatch.appendChild(badge);

    const info = document.createElement("div");
    info.className = "info";

    const hexEl = document.createElement("span");
    hexEl.className = "hex";
    hexEl.title = "Click to copy";

    const tools = document.createElement("div");
    tools.className = "tools";

    const copyBtn = document.createElement("button");
    copyBtn.className = "icon-btn";
    copyBtn.title = "Copy hex";
    copyBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/>
      </svg>
    `;

    const lockBtn = document.createElement("button");
    lockBtn.className = "icon-btn";
    lockBtn.title = "Lock / Unlock";
    lockBtn.setAttribute("aria-pressed", "false");
    lockBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 1 1 6 0v3Z"/>
      </svg>
    `;

    tools.appendChild(copyBtn);
    tools.appendChild(lockBtn);
    info.appendChild(hexEl);
    info.appendChild(tools);
    swatch.appendChild(info);
    palette.appendChild(swatch);

    // Handlers
    hexEl.addEventListener("click", () => copyHex(i));
    copyBtn.addEventListener("click", () => copyHex(i));
    lockBtn.addEventListener("click", () => toggleLock(i, lockBtn, swatch));
  }
}

function setSwatch(i, hex) {
  const swatch = palette.children[i];
  const colorLayer = swatch.querySelector(".color");
  const hexEl = swatch.querySelector(".hex");

  const textColor = getTextColor(hex);
  colorLayer.style.background = hex;
  hexEl.textContent = hex;

  // NEW: expose rgb to CSS for subtle glow/border
  const [r, g, b] = hexToRgb(hex);
  swatch.style.setProperty("--col-rgb", `${r} ${g} ${b}`);

  // Apply contrasting text color
  swatch.querySelector(".info").style.color = textColor;
  swatch.querySelector(".badge").style.color = textColor;
  swatch.querySelector(".badge").style.borderColor = textColor + "33";
}

function copyHex(i) {
  const hex = state.colors[i];
  if (!hex) return;
  const swatch = palette.children[i];
  navigator.clipboard?.writeText(hex).then(
    () => {
      showToast(`Copied ${hex}`);
      swatch.classList.add("copied");
      setTimeout(() => swatch.classList.remove("copied"), 600);
    },
    () => showToast(`Copy failed. ${hex}`)
  );
}

function generatePalette(forceAll = false) {
  for (let i = 0; i < SWATCH_COUNT; i++) {
    if (!state.locks[i] || forceAll || !state.colors[i]) {
      state.colors[i] = randomHex();
      setSwatch(i, state.colors[i]);
    }
  }
  persist();
}

function persist() {
  localStorage.setItem("palette_state", JSON.stringify(state));
}

// ===== Init =====
buildSwatches();

// If we have cached colors, render them; else generate new ones
if (state.colors.length === SWATCH_COUNT && state.colors.every(Boolean)) {
  state.colors.forEach((hex, i) => setSwatch(i, hex));
  // restore locked visuals
  [...palette.children].forEach((swatch, i) => {
    if (state.locks[i]) swatch.classList.add("locked");
    const btn = swatch.querySelector(".icon-btn:last-child");
    btn.setAttribute("aria-pressed", String(state.locks[i]));
  });
} else {
  generatePalette(true);
}

// Buttons
generateBtn.addEventListener("click", () => generatePalette(true));
shuffleBtn.addEventListener("click", () => generatePalette(false));

// Keyboard: Space to generate, L to toggle current hovered lock
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    generatePalette(false);
  }
});

// Accessibility hint: announce new colors
const observer = new MutationObserver(() => {
  const labels = state.colors.map((c, i) => `Color ${i + 1} ${c}`).join(", ");
  palette.setAttribute("aria-label", `Palette: ${labels}`);
});
observer.observe(palette, {
  childList: true,
  subtree: true,
  characterData: true,
});
