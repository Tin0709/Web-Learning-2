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
const codeToText = (code) => {
  const dict = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Heavy rain showers",
    82: "Violent rain showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm w/ hail",
    99: "Thunderstorm w/ hail",
  };
  return dict[code] || "—";
};

const fmtTime = (iso, tz) =>
  new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleString([], {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDay = (iso, tz) =>
  new Date(iso).toLocaleDateString([], {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const kphToMph = (kph) => kph * 0.621371;

// ===== State =====
const state = {
  units: "metric", // 'metric' (°C, km/h) or 'imperial' (°F, mph)
  place: null, // { name, country, lat, lon, timezone }
};

// ===== DOM Refs =====
const placeEl = $("#place");
const updatedEl = $("#updated");
const tempEl = $("#temp");
const tempUnitEl = $("#temp-unit");
const feelsEl = $("#feels-like");
const iconEl = $("#icon");
const summaryEl = $("#summary");
const humidityEl = $("#humidity");
const windEl = $("#wind");
const pressureEl = $("#pressure");
const uvEl = $("#uv");
const hourlyEl = $("#hourly");
const dailyEl = $("#daily");

const unitToggle = $("#unit-toggle");
const themeBtn = $("#theme-btn");
