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
// Draw a simple line chart on canvas (no libs)
function drawHourlyChart(hoursISO, tempsC, tz) {
  const ctx = els.hourlyCanvas.getContext("2d");
  const W = els.hourlyCanvas.width;
  const H = els.hourlyCanvas.height;
  ctx.clearRect(0, 0, W, H);

  // Padding
  const padL = 40,
    padR = 10,
    padT = 20,
    padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Slice next 24 points
  const points = hoursISO.slice(0, 24).map((iso, i) => ({
    t: new Date(iso),
    c: tempsC[i],
  }));
  const minC = Math.min(...points.map((p) => p.c));
  const maxC = Math.max(...points.map((p) => p.c));

  // Axis lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, H - padB);
  ctx.lineTo(W - padR, H - padB);
  ctx.stroke();

  // Y labels (min, mid, max)
  const ticks = [minC, (minC + maxC) / 2, maxC];
  ctx.fillStyle = "rgba(229,231,235,.9)";
  ctx.font = "12px system-ui";
  ticks.forEach((v, i) => {
    const y = padT + (1 - (v - minC) / (maxC - minC || 1)) * plotH;
    ctx.fillText(unitTemp(v), 4, y + 4);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
  });

  // Points path
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = padL + (i / (points.length - 1)) * plotW;
    const y = padT + (1 - (p.c - minC) / (maxC - minC || 1)) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "rgba(96,165,250,1)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // X labels every 3 hours
  ctx.fillStyle = "rgba(156,163,175,1)";
  for (let i = 0; i < points.length; i += 3) {
    const p = points[i];
    const x = padL + (i / (points.length - 1)) * plotW;
    const label = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      timeZone: tz,
    }).format(p.t);
    ctx.fillText(label, x - 8, H - padB + 16);
  }
}
// Fetch helpers
async function geocodeCity(q) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    q
  )}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.results || data.results.length === 0)
    throw new Error("City not found");
  const r = data.results[0];
  return {
    name: r.name,
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
    tz: r.timezone,
  };
}

async function fetchWeather(lat, lon, tz) {
  // Get 7-day + hourly (temp, apparent, humidity, wind)
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code",
    hourly:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
    timezone: tz || "auto",
  }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  return await res.json();
}

async function loadByCity(q) {
  setStatus("Searching…");
  try {
    const place = await geocodeCity(q);
    await loadByCoords(
      place.lat,
      place.lon,
      place.name,
      place.country,
      place.tz
    );
  } catch (e) {
    console.error(e);
    setStatus(e.message || "Could not find that city.");
  }
}

async function loadByCoords(
  lat,
  lon,
  name = "Your location",
  country = "",
  tz = "auto"
) {
  setStatus("Loading weather…");
  try {
    const data = await fetchWeather(lat, lon, tz);
    state.location = { lat, lon, name, country, tz: data.timezone };
    state.raw = data;
    saveRecents(name, lat, lon, country, data.timezone);
    renderAll();
    setStatus("");
  } catch (e) {
    console.error(e);
    setStatus("Failed to fetch weather data.");
  }
}
