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
