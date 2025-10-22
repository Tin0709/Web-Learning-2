// Simple Weather App using Open-Meteo (no API key needed)
// - Geocoding: https://geocoding-api.open-meteo.com/v1/search
// - Forecast:  https://api.open-meteo.com/v1/forecast

const form = document.getElementById("searchForm");
const input = document.getElementById("cityInput");
const card = document.getElementById("card");
const loader = document.getElementById("loader");
const unitToggle = document.getElementById("unitToggle");

const cityNameEl = document.getElementById("cityName");
const countryNameEl = document.getElementById("countryName");
const iconEl = document.getElementById("weatherIcon");
const tempValEl = document.getElementById("tempValue");
const tempUnitEl = document.getElementById("tempUnit");
const descEl = document.getElementById("desc");

const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const precipEl = document.getElementById("precip");
const asOfEl = document.getElementById("asOf");

const helperText = document.getElementById("helperText");

// State
const state = {
  units: localStorage.getItem("units") || "metric", // 'metric' (°C) or 'imperial' (°F)
  lastQuery: localStorage.getItem("lastQuery") || "",
  lastData: null,
};

// Initialize UI
updateUnitUI();
if (state.lastQuery) {
  input.value = state.lastQuery;
  searchCity(state.lastQuery);
}

// Events
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  searchCity(q);
});

unitToggle.addEventListener("click", () => {
  state.units = state.units === "metric" ? "imperial" : "metric";
  localStorage.setItem("units", state.units);
  updateUnitUI();

  // Re-render with new units if we have data already
  if (state.lastData) render(state.lastData);
});

function updateUnitUI() {
  unitToggle.textContent = state.units === "metric" ? "°C" : "°F";
  tempUnitEl.textContent = state.units === "metric" ? "°C" : "°F";
}

// Core: Search city -> fetch weather -> render
async function searchCity(query) {
  toggleLoading(true);
  helperText.textContent = "";
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=1&language=en&format=json`;

    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error("Geocoding request failed.");
    const geo = await geoRes.json();

    if (!geo.results || geo.results.length === 0) {
      throw new Error("City not found. Try another search.");
    }

    const place = geo.results[0];
    const { latitude, longitude, name, country, admin1, timezone } = place;

    // Build forecast URL
    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m"
    );
    forecastUrl.searchParams.set("latitude", latitude);
    forecastUrl.searchParams.set("longitude", longitude);
    forecastUrl.searchParams.set("timezone", timezone || "auto");

    const wxRes = await fetch(forecastUrl.toString());
    if (!wxRes.ok) throw new Error("Weather request failed.");
    const wx = await wxRes.json();

    const current = wx.current || {};
    const data = {
      name,
      country,
      admin1: admin1 || "",
      tz: wx.timezone || "local",
      time: current.time,
      temperatureC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      isDay: current.is_day === 1,
      precipMm: current.precipitation,
      windSpeedKph: current.wind_speed_10m,
      windDirDeg: current.wind_direction_10m,
      weatherCode: current.weather_code,
    };

    state.lastData = data;
    state.lastQuery = query;
    localStorage.setItem("lastQuery", query);

    render(data);
  } catch (err) {
    showError(err.message || "Something went wrong.");
  } finally {
    toggleLoading(false);
  }
}

function render(data) {
  // Location
  cityNameEl.textContent = data.name;
  countryNameEl.textContent = [data.admin1, data.country]
    .filter(Boolean)
    .join(", ");

  // Weather icon + description
  const { icon, label } = codeToIconDesc(data.weatherCode, data.isDay);
  iconEl.textContent = icon;
  descEl.textContent = label;

  // Units
  const t =
    state.units === "metric" ? data.temperatureC : cToF(data.temperatureC);
  const feels =
    state.units === "metric" ? data.feelsLikeC : cToF(data.feelsLikeC);
  const wind =
    state.units === "metric"
      ? `${Math.round(kphToMps(data.windSpeedKph))} m/s`
      : `${Math.round(kphToMph(data.windSpeedKph))} mph`;

  tempValEl.textContent = Math.round(t);
  tempUnitEl.textContent = state.units === "metric" ? "°C" : "°F";

  feelsLikeEl.textContent = `${Math.round(feels)} ${
    state.units === "metric" ? "°C" : "°F"
  }`;
  humidityEl.textContent = `${data.humidity ?? "—"}%`;
  windEl.textContent = wind;
  precipEl.textContent = `${(data.precipMm ?? 0).toFixed(1)} mm`;

  // As-of
  const dt = data.time ? new Date(data.time) : new Date();
  asOfEl.textContent = `Updated: ${fmtDate(dt)} (${data.tz})`;

  // Show the card
  card.classList.remove("hidden");
}

function showError(msg) {
  card.classList.remove("hidden");
  cityNameEl.textContent = "Oops";
  countryNameEl.textContent = "";
  iconEl.textContent = "⚠️";
  tempValEl.textContent = "—";
  descEl.textContent = msg;
  feelsLikeEl.textContent =
    humidityEl.textContent =
    windEl.textContent =
    precipEl.textContent =
      "—";
  asOfEl.textContent = "";
}

function toggleLoading(isLoading) {
  loader.classList.toggle("hidden", !isLoading);
}

// Helpers
function cToF(c) {
  return (c * 9) / 5 + 32;
}
function kphToMph(kph) {
  return kph * 0.621371;
}
function kphToMps(kph) {
  return kph / 3.6;
}

function fmtDate(d) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

// Weather code mapping (Open-Meteo WMO)
function codeToIconDesc(code, isDay = true) {
  const sun = "☀️",
    moon = "🌙",
    cloud = "☁️",
    sunBehind = "⛅",
    rain = "🌧️",
    drizzle = "🌦️",
    thunder = "⛈️",
    snow = "🌨️",
    fog = "🌫️",
    hail = "🧊";

  const table = {
    0: { icon: isDay ? sun : moon, label: "Clear sky" },
    1: { icon: isDay ? sunBehind : "☁️", label: "Mainly clear" },
    2: { icon: sunBehind, label: "Partly cloudy" },
    3: { icon: cloud, label: "Overcast" },
    45: { icon: fog, label: "Fog" },
    48: { icon: fog, label: "Depositing rime fog" },
    51: { icon: drizzle, label: "Light drizzle" },
    53: { icon: drizzle, label: "Moderate drizzle" },
    55: { icon: drizzle, label: "Dense drizzle" },
    56: { icon: drizzle, label: "Freezing drizzle" },
    57: { icon: drizzle, label: "Dense freezing drizzle" },
    61: { icon: rain, label: "Slight rain" },
    63: { icon: rain, label: "Moderate rain" },
    65: { icon: rain, label: "Heavy rain" },
    66: { icon: rain, label: "Freezing rain" },
    67: { icon: rain, label: "Heavy freezing rain" },
    71: { icon: snow, label: "Slight snow" },
    73: { icon: snow, label: "Moderate snow" },
    75: { icon: snow, label: "Heavy snow" },
    77: { icon: hail, label: "Snow grains" },
    80: { icon: drizzle, label: "Rain showers" },
    81: { icon: drizzle, label: "Moderate rain showers" },
    82: { icon: rain, label: "Violent rain showers" },
    85: { icon: snow, label: "Slight snow showers" },
    86: { icon: snow, label: "Heavy snow showers" },
    95: { icon: thunder, label: "Thunderstorm" },
    96: { icon: thunder, label: "Thunderstorm with hail" },
    99: { icon: thunder, label: "Violent thunderstorm" },
  };
  return table[code] || { icon: cloud, label: "Unknown" };
}
