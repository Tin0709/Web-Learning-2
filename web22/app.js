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
