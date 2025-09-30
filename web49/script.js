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
