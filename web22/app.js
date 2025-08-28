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
