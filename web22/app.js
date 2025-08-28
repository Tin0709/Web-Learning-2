// Change to another LibreTranslate instance if needed:
const LT_BASE = "https://libretranslate.com"; // e.g., "https://translate.mentality.rip"
const DICT_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en/";

const els = {
  from: document.getElementById("fromLang"),
  to: document.getElementById("toLang"),
  toLabel: document.getElementById("toLangLabel"),
  swap: document.getElementById("swapBtn"),
  input: document.getElementById("queryInput"),
  search: document.getElementById("searchBtn"),
  auto: document.getElementById("autoDetect"),
  status: document.getElementById("status"),
  statusText: document.getElementById("statusText"),
  results: document.getElementById("results"),
  error: document.getElementById("error"),
  wordOut: document.getElementById("wordOut"),
  phoneticOut: document.getElementById("phoneticOut"),
  audio: document.getElementById("audioPlayer"),
  translationOut: document.getElementById("translationOut"),
  definitions: document.getElementById("definitions"),
  notes: document.getElementById("notes"),
};
const LANGS = [
  // Common + supported by LibreTranslate
  { code: "auto", name: "Auto-detect" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "pl", name: "Polish" },
  { code: "nl", name: "Dutch" },
  { code: "uk", name: "Ukrainian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ko", name: "Korean" },
  { code: "hi", name: "Hindi" },
];
function populateLangs() {
  for (const l of LANGS) {
    const opt1 = document.createElement("option");
    opt1.value = l.code;
    opt1.textContent = l.name;
    // Avoid putting 'auto' in "to" selector.
    if (l.code !== "auto") {
      const opt2 = opt1.cloneNode(true);
      els.to.appendChild(opt2);
    }
    els.from.appendChild(opt1);
  }
  els.from.value = "auto";
  els.to.value = "en";
  els.toLabel.textContent = getLangName(els.to.value);
}
populateLangs();

function getLangName(code) {
  return LANGS.find((l) => l.code === code)?.name || code;
}

els.swap.addEventListener("click", () => {
  const from = els.from.value;
  const to = els.to.value;
  if (from === "auto") {
    // If auto, try to keep auto and just set TO to English for convenience
    els.to.value = "en";
  } else {
    els.from.value = to === "auto" ? "en" : to;
    els.to.value = from;
  }
  els.toLabel.textContent = getLangName(els.to.value);
});

els.to.addEventListener("change", () => {
  els.toLabel.textContent = getLangName(els.to.value);
});

els.search.addEventListener("click", runSearch);
els.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});
function setLoading(on, text = "Looking up…") {
  els.status.hidden = !on;
  els.statusText.textContent = text;
  if (on) {
    els.results.hidden = true;
    els.error.hidden = true;
  }
}
function showError(msg) {
  els.error.textContent = msg;
  els.error.hidden = false;
  els.results.hidden = true;
  els.status.hidden = true;
}
function showResults() {
  els.results.hidden = false;
  els.error.hidden = true;
  els.status.hidden = true;
}
async function runSearch() {
  const q = els.input.value.trim();
  const fromPref = els.from.value;
  const to = els.to.value;

  if (!q) {
    showError("Please type a word or short phrase to look up.");
    return;
  }
  if (fromPref === to) {
    // It's valid, but often users want a different target
  }

  setLoading(true);

  try {
    // 1) Detect language (if auto)
    let detected = fromPref;
    if (els.auto.checked || fromPref === "auto") {
      detected = await detectLang(q);
    }

    // 2) Translate the query into English for dictionary lookup.
    // We will use the English form for definitions.
    const qEn = detected === "en" ? q : await translate(q, detected, "en");

    // 3) Translate the query to target (for display)
    const qTo = to === "en" ? qEn : await translate(qEn, "en", to);

    // 4) Try to fetch English dictionary data (definitions/pronunciation/audio)
    const dict = await getEnglishDefinitions(qEn);

    // 5) Prepare UI
    renderWord(qTo, dict?.phonetic, dict?.audio);

    // 6) Show definitions in EN and (if target != en) translated
    await renderDefinitions(dict?.meanings || [], to);

    // 7) Notes
    const bits = [];
    if (detected) bits.push(`Detected: ${getLangName(detected)} (${detected})`);
    if (qEn && detected !== "en") bits.push(`Lookup base word (EN): “${qEn}”`);
    els.notes.innerHTML = bits.join(" &middot; ");

    showResults();
  } catch (err) {
    console.error(err);
    showError(err?.message || "Something went wrong. Try again.");
  }
}
