/* Weather Dashboard using Open-Meteo (no API key)
   - City search via Open-Meteo Geocoding API
   - Forecast via Open-Meteo Weather API
   - Hourly temp chart (canvas), 7-day forecast, unit toggle, geolocation
*/

const els = {
  status: document.getElementById("status"),
  searchForm: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  recent: document.getElementById("recentSearches"),
  locationName: document.getElementById("locationName"),
  dateStr: document.getElementById("dateStr"),
  currentIcon: document.getElementById("currentIcon"),
  currentTemp: document.getElementById("currentTemp"),
  currentDesc: document.getElementById("currentDesc"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  winddir: document.getElementById("winddir"),
  apparent: document.getElementById("apparent"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  hourlyCanvas: document.getElementById("hourlyChart"),
  unitRadios: document.querySelectorAll('input[name="unit"]'),
  geoBtn: document.getElementById("geoBtn"),
  forecast: document.getElementById("forecast"),
};

const STORAGE_KEYS = {
  RECENTS: "wd_recents",
  UNIT: "wd_unit",
};

let state = {
  unit: localStorage.getItem(STORAGE_KEYS.UNIT) || "c", // 'c' or 'f'
  location: null, // {name, country, lat, lon, timezone}
  raw: null, // raw API data cache
};

// Apply saved unit to radios
for (const r of els.unitRadios) r.checked = r.value === state.unit;

// Weather code mapping (Open-Meteo)
const WEATHER = {
  map: {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Depositing rime fog", "🌫️"],
    51: ["Light drizzle", "☔"],
    53: ["Drizzle", "☔"],
    55: ["Heavy drizzle", "☔"],
    56: ["Freezing drizzle", "🧊☔"],
    57: ["Heavy freezing drizzle", "🧊☔"],
    61: ["Light rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🧊🌧️"],
    67: ["Heavy freezing rain", "🧊🌧️"],
    71: ["Light snow", "🌨️"],
    73: ["Snow", "🌨️"],
    75: ["Heavy snow", "❄️"],
    77: ["Snow grains", "❄️"],
    80: ["Light showers", "🌦️"],
    81: ["Showers", "🌧️"],
    82: ["Violent showers", "⛈️"],
    85: ["Snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm w/ hail", "⛈️🧊"],
    97: ["Thunderstorm w/ hail", "⛈️🧊"],
  },
  get(code) {
    return this.map[code] || ["—", "⛅"];
  },
};
function setStatus(msg) {
  els.status.textContent = msg || "";
}
function formatTime(dt, tz, opts) {
  return new Intl.DateTimeFormat(undefined, { ...opts, timeZone: tz }).format(
    new Date(dt)
  );
}
function degToCompass(d) {
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return dirs[Math.round((d % 360) / 22.5) % 16];
}
function toF(c) {
  return (c * 9) / 5 + 32;
}
function unitTemp(valueC) {
  return state.unit === "c"
    ? `${Math.round(valueC)}°C`
    : `${Math.round(toF(valueC))}°F`;
}
function saveRecents(name, lat, lon, country, tz) {
  const recents = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.RECENTS) || "[]"
  );
  const entry = { name, lat, lon, country, tz };
  const existing = recents.find(
    (r) => r.name === name && r.country === country
  );
  const updated = [entry, ...recents.filter((r) => r !== existing)].slice(0, 8);
  localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(updated));
  renderRecents(updated);
}
function renderRecents(list) {
  els.recent.innerHTML = "";
  (
    list || JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTS) || "[]")
  ).forEach((r) => {
    const d = document.createElement("button");
    d.className = "chip";
    d.title = `${r.name}, ${r.country}`;
    d.textContent = `${r.name} ${r.country ? "• " + r.country : ""}`;
    d.addEventListener("click", () =>
      loadByCoords(r.lat, r.lon, r.name, r.country, r.tz)
    );
    els.recent.appendChild(d);
  });
}
