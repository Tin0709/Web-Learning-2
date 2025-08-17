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
