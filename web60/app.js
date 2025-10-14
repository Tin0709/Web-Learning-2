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
