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
