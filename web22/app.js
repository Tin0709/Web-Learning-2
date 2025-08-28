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
