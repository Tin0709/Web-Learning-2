// ------------ Helpers ------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const destinationInput = $("#destinationInput");
const startDateInput = $("#startDate");
const endDateInput = $("#endDate");
const planBtn = $("#planBtn");
const destinationInfo = $("#destinationInfo");
const weatherBox = $("#weather");
const sightsBox = $("#sights");
const itineraryBox = $("#itinerary");

const todayISO = () => new Date().toISOString().slice(0, 10);
startDateInput.value = todayISO();
endDateInput.value = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
  .toISOString()
  .slice(0, 10); // +2 days

let map, mapMarker;
// Initialize Leaflet map
function initMap() {
  map = L.map("map", { zoomControl: true, attributionControl: true }).setView(
    [0, 0],
    2
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
}
initMap();

function setMap(lat, lon, label) {
  map.setView([lat, lon], 12);
  if (mapMarker) map.removeLayer(mapMarker);
  mapMarker = L.marker([lat, lon])
    .addTo(map)
    .bindPopup(label || "Destination")
    .openPopup();
}

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function fmtTemp(t) {
  return `${Math.round(t)}°C`;
}
function weekday(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function showError(el, msg) {
  el.innerHTML = `<div class="card error">${msg}</div>`;
}
// ------------ APIs ------------
async function geocode(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    place
  )}&limit=1&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.length) throw new Error("No results found");
  const d = data[0];
  return {
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
    display: d.display_name,
  };
}

async function fetchWeather(lat, lon, startISO, endISO) {
  // Open-Meteo daily forecast
  // Determine days length (max 14 to keep it light)
  const days = Math.min(14, daysBetween(startISO, endISO));
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode` +
    `&current_weather=true&timezone=auto&forecast_days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  return await res.json();
}

async function fetchSights(lat, lon) {
  // Wikipedia GeoSearch around the coordinates
  const radius = 8000; // 8 km
  const limit = 12;
  const geosearch = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lon}&gsradius=${radius}&gslimit=${limit}&format=json&origin=*`;
  const res = await fetch(geosearch);
  if (!res.ok) throw new Error("Wikipedia geosearch failed");
  const data = await res.json();
  const pages = data?.query?.geosearch || [];

  // Fetch extracts + thumbnails in one batch by pageids
  const ids = pages.map((p) => p.pageid).join("|");
  if (!ids) return [];
  const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${ids}&prop=extracts|pageimages&exintro=1&explaintext=1&pithumbsize=400&format=json&origin=*`;
  const res2 = await fetch(detailsUrl);
  if (!res2.ok) throw new Error("Wikipedia details failed");
  const det = await res2.json();
  const result = Object.values(det.query.pages).map((p) => ({
    title: p.title,
    extract: p.extract
      ? p.extract.slice(0, 220) + (p.extract.length > 220 ? "…" : "")
      : "No description.",
    thumb: p.thumbnail?.source || "",
    url: `https://en.wikipedia.org/?curid=${p.pageid}`,
  }));
  return result;
}
