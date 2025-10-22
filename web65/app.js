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
