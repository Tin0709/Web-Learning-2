/* ===== Utilities ===== */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const fmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: guessCurrency(),
});
function guessCurrency() {
  // Quick locale -> currency best-effort
  try {
    const region =
      Intl.DateTimeFormat().resolvedOptions().locale.split("-")[1] || "US";
    const map = {
      VN: "VND",
      US: "USD",
      GB: "GBP",
      EU: "EUR",
      FR: "EUR",
      DE: "EUR",
      IN: "INR",
      JP: "JPY",
      KR: "KRW",
      AU: "AUD",
      CA: "CAD",
      SG: "SGD",
    };
    return map[region] || "USD";
  } catch {
    return "USD";
  }
}
const uid = () => Math.random().toString(36).slice(2, 10);
