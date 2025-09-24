// ===== Utilities =====
const $ = (sel) => document.querySelector(sel);
const statusEl = $("#status");

const weatherIcon = (code, isNight = false) => {
  // Map WMO weather codes to emoji (simple, no external files)
  // https://open-meteo.com/en/docs#api_form
  const map = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌧️",
    56: "🌧️",
    57: "🌧️",
    61: "🌦️",
    63: "🌧️",
    65: "🌧️",
    66: "🌧️",
    67: "🌧️",
    71: "🌨️",
    73: "🌨️",
    75: "❄️",
    77: "❄️",
    80: "🌧️",
    81: "🌧️",
    82: "🌧️",
    85: "🌨️",
    86: "❄️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
  };
  // Night variants for clear/partly
  if (isNight && (code === 0 || code === 1 || code === 2)) {
    return { 0: "🌙", 1: "🌙", 2: "☁️" }[code] || map[code] || "🌡️";
  }
  return map[code] || "🌡️";
};
