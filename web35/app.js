const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const form = $("#shortenForm");
const longUrlInput = $("#longUrl");
const shortenBtn = $("#shortenBtn");
const errorMsg = $("#errorMsg");

const resultWrap = $("#result");
const shortLinkEl = $("#shortLink");
const copyBtn = $("#copyBtn");
const shareBtn = $("#shareBtn");
const openBtn = $("#openBtn");
const qrImg = $("#qrImg");

const historyList = $("#historyList");
const emptyHistory = $("#emptyHistory");
const clearHistoryBtn = $("#clearHistoryBtn");
const themeToggle = $("#themeToggle");

const HISTORY_KEY = "shortenerHistory";
const THEME_KEY = "shortenerTheme";
