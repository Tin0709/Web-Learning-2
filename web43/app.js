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

// ===== API Calls (Open-Meteo, no key needed) =====
async function geocodeCity(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.results || data.results.length === 0)
    throw new Error("No matching city found");
  const r = data.results[0];
  return {
    name: r.name + (r.admin1 ? `, ${r.admin1}` : ""),
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone || "UTC",
  };
}

async function getWeather(lat, lon, timezone) {
  // Request current, hourly (next 24h), and daily (next 7 days)
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "pressure_msl",
      "wind_speed_10m",
      "is_day",
      "uv_index",
    ].join(","),
    hourly: [
      "temperature_2m",
      "weather_code",
      "apparent_temperature",
      "relative_humidity_2m",
      "uv_index",
      "wind_speed_10m",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "uv_index_max",
    ].join(","),
    timezone,
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}
// ===== Rendering =====
function renderCurrent(place, wx) {
  const c = wx.current;
  const isNight = c.is_day === 0;
  iconEl.textContent = weatherIcon(
    c.weather_code ?? wx.daily.weather_code[0],
    isNight
  );
  placeEl.textContent = `${place.name}, ${place.country}`;
  updatedEl.textContent = `Updated: ${new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const toF = (x) => (x * 9) / 5 + 32;
  const tempC = c.temperature_2m;
  const feelsC = c.apparent_temperature;
  const speed =
    state.units === "imperial" ? kphToMph(c.wind_speed_10m) : c.wind_speed_10m;

  tempEl.textContent = Math.round(
    state.units === "imperial" ? toF(tempC) : tempC
  );
  tempUnitEl.textContent = state.units === "imperial" ? "°F" : "°C";
  $(".unit").textContent = state.units === "imperial" ? "°F" : "°C";
  feelsEl.textContent = Math.round(
    state.units === "imperial" ? toF(feelsC) : feelsC
  );

  summaryEl.textContent = codeToText(
    c.weather_code ?? wx.daily.weather_code[0]
  );
  humidityEl.textContent = `${c.relative_humidity_2m}%`;
  windEl.textContent = `${Math.round(speed)} ${
    state.units === "imperial" ? "mph" : "km/h"
  }`;
  pressureEl.textContent = `${Math.round(c.pressure_msl)} hPa`;
  uvEl.textContent = `${c.uv_index ?? "-"}`;
}
function renderHourly(place, wx) {
  const tz = place.timezone;
  const hours = wx.hourly.time.slice(0, 12);
  const temps = wx.hourly.temperature_2m.slice(0, 12);
  const codes = wx.hourly.weather_code.slice(0, 12);
  const isDayArr = wx.hourly.is_day || new Array(hours.length).fill(1);

  hourlyEl.innerHTML = "";
  hours.forEach((iso, i) => {
    const tC = temps[i];
    const val =
      state.units === "imperial"
        ? Math.round((tC * 9) / 5 + 32)
        : Math.round(tC);
    const isNight = isDayArr[i] === 0;
    const div = document.createElement("div");
    div.className = "hour";
    div.innerHTML = `
        <div class="time">${fmtTime(iso, tz)}</div>
        <div class="ic" style="font-size:20px">${weatherIcon(
          codes[i],
          isNight
        )}</div>
        <div class="t">${val}°${state.units === "imperial" ? "F" : "C"}</div>
      `;
    hourlyEl.appendChild(div);
  });
}

function renderDaily(place, wx) {
  const tz = place.timezone;
  const days = wx.daily.time.slice(0, 5);
  const maxs = wx.daily.temperature_2m_max.slice(0, 5);
  const mins = wx.daily.temperature_2m_min.slice(0, 5);
  const codes = wx.daily.weather_code.slice(0, 5);

  dailyEl.innerHTML = "";
  days.forEach((d, i) => {
    const max =
      state.units === "imperial"
        ? Math.round((maxs[i] * 9) / 5 + 32)
        : Math.round(maxs[i]);
    const min =
      state.units === "imperial"
        ? Math.round((mins[i] * 9) / 5 + 32)
        : Math.round(mins[i]);
    const div = document.createElement("div");
    div.className = "day";
    div.innerHTML = `
        <div class="date">${fmtDay(d, tz)}</div>
        <div class="ic" style="font-size:22px">${weatherIcon(codes[i])}</div>
        <div class="sum">${codeToText(codes[i])}</div>
        <div><span class="hi">${max}°</span> / <span class="lo">${min}°</span></div>
      `;
    dailyEl.appendChild(div);
  });
}

function setStatus(msg, type = "info") {
  statusEl.textContent = msg;
  statusEl.style.color = type === "error" ? "var(--bad)" : "var(--muted)";
}

// ===== Actions =====
async function updateWeatherForPlace(place) {
  try {
    setStatus("Loading weather...");
    const wx = await getWeather(place.lat, place.lon, place.timezone);
    state.place = place;
    renderCurrent(place, wx);
    renderHourly(place, wx);
    renderDaily(place, wx);
    setStatus(`Showing weather for ${place.name}, ${place.country}`);
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Failed to load weather", "error");
  }
}

async function searchCityAndUpdate(q) {
  try {
    const place = await geocodeCity(q);
    await updateWeatherForPlace(place);
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Search failed", "error");
  }
}
async function useMyLocation() {
  if (!navigator.geolocation) {
    setStatus("Geolocation not supported by your browser.", "error");
    return;
  }
  setStatus("Getting your location...");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        // Reverse lookup timezone & nearest place from Open-Meteo geocoding (nearest place via reverse endpoint)
        const rev = await fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`
        );
        const j = await rev.json();
        const best = j.results && j.results[0];
        const place = {
          name: best
            ? best.name + (best.admin1 ? `, ${best.admin1}` : "")
            : "Current Location",
          country: best ? best.country : "",
          lat,
          lon,
          timezone:
            best?.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            "UTC",
        };
        await updateWeatherForPlace(place);
      } catch (err) {
        console.error(err);
        setStatus("Failed to resolve your location.", "error");
      }
    },
    (err) => {
      setStatus(err.message || "Location permission denied.", "error");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
// ===== Events =====
document.addEventListener("DOMContentLoaded", () => {
  // Restore theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") document.body.classList.add("light");

  // Unit toggle persistence
  const savedUnits = localStorage.getItem("units");
  if (savedUnits === "imperial") {
    state.units = "imperial";
    $("#unit-toggle").checked = true;
  }

  // Default: try location, fallback to a popular city
  useMyLocation();
  setTimeout(() => {
    if (!state.place) searchCityAndUpdate("London");
  }, 2500);
});

$("#search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("#search-input").value.trim();
  if (!q) return;
  searchCityAndUpdate(q);
});

$("#loc-btn").addEventListener("click", () => useMyLocation());

unitToggle.addEventListener("change", () => {
  state.units = unitToggle.checked ? "imperial" : "metric";
  localStorage.setItem("units", state.units);
  // Re-render with converted units if we already have data: just trigger a fresh fetch to keep things simple
  if (state.place) updateWeatherForPlace(state.place);
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
});
