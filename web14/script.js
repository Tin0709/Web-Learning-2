/* ==========================
   UTILITIES
========================== */
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

const pad = (n, len = 2) => String(n).padStart(len, "0");

const formatHMS = (totalMs, showHours = true) => {
  const sign = totalMs < 0 ? "-" : "";
  let ms = Math.abs(totalMs);
  const hrs = Math.floor(ms / 3_600_000);
  ms -= hrs * 3_600_000;
  const mins = Math.floor(ms / 60_000);
  ms -= mins * 60_000;
  const secs = Math.floor(ms / 1_000);
  ms -= secs * 1_000;
  const cs = Math.floor(ms / 10); // centiseconds for stopwatch
  if (showHours) return `${sign}${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${sign}${pad(mins)}:${pad(secs)}.${pad(cs)}`;
};
// Simple beep (Web Audio API)
const beep = (duration = 500, type = "sine", volume = 0.2) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = 880;
    gain.gain.value = volume;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, duration);
  } catch (e) {
    /* noop if blocked */
  }
};

/* ==========================
   TABS
========================== */
const tabButtons = qsa(".tab");
const panels = qsa(".panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.id));
});

function switchTab(tabId) {
  tabButtons.forEach((b) => {
    const active = b.id === tabId;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  panels.forEach((p) => {
    const show = p.id === `panel-${tabId.split("tab-")[1]}`;
    p.hidden = !show;
    p.classList.toggle("is-active", show);
  });
}

/* ==========================
   CLOCK
========================== */
const clockTimeEl = qs("#clockTime");
const clockDateEl = qs("#clockDate");
const formatToggle = qs("#formatToggle");
const secondsToggle = qs("#secondsToggle");

function updateClock() {
  const now = new Date();
  const use24 = formatToggle.checked;
  const showSeconds = secondsToggle.checked;

  let h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  let suffix = "";
  if (!use24) {
    suffix = h >= 12 ? " PM" : " AM";
    h = h % 12 || 12;
  }

  const time = showSeconds
    ? `${pad(h)}:${pad(m)}:${pad(s)}`
    : `${pad(h)}:${pad(m)}`;
  clockTimeEl.textContent = time + suffix;

  const dateFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  clockDateEl.textContent = dateFmt.format(now);
}
let clockInterval = setInterval(updateClock, 1000);
updateClock();
[formatToggle, secondsToggle].forEach((el) =>
  el.addEventListener("change", updateClock)
);
