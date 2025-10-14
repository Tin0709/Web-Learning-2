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
