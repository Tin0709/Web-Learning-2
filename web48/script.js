// Utility: seeded random (Mulberry32)
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Pick helper
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// DOM
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Elements
const form = $("#story-form");
const chips = $$(".chip");
const twistsGrid = $("#twists");
const lengthRange = $("#length");
const lengthValue = $("#length-value");
const seedInput = $("#seed");
const titleInput = $("#title");
const storyCard = $("#story-card");
const storyTitle = $("#story-title");
const storyMeta = $("#story-meta");
const storyText = $("#story-text");

const btnShuffle = $("#shuffle");
const btnClear = $("#clear");
const btnCopy = $("#copy");
const btnDownload = $("#download");
const btnSave = $("#save");
const btnHistory = $("#history");
const historyDialog = $("#history-dialog");
const historyList = $("#history-list");
const btnExportAll = $("#export-all");
const btnClearHistory = $("#clear-history");

// Twists catalog
const TWISTS = [
  "a friendly rival shows up",
  "the map is a forgery",
  "time repeats a single hour",
  "a stray message from the future",
  "an unexpected mentor betrays them",
  "the goal was a decoy all along",
  "a door requires a personal secret",
  "they can only speak in whispers",
  "an ally is not human",
  "the power fails at the worst moment",
  "someone remembers a different version of events",
  "the town celebrates a forgotten holiday",
];

function renderTwists() {
  TWISTS.forEach((t, i) => {
    const id = `tw-${i}`;
    const label = document.createElement("label");
    label.innerHTML = `
        <input type="checkbox" value="${t}" id="${id}" />
        <span>${t}</span>
      `;
    twistsGrid.appendChild(label);
  });
}

// Preset chip click → fill input
chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const target = document.getElementById(chip.dataset.fill);
    target.value = chip.dataset.value;
    target.focus();
  });
});

// Length UI
lengthRange.addEventListener("input", () => {
  lengthValue.textContent = lengthRange.value;
});

// Shuffle inputs
btnShuffle.addEventListener("click", () => {
  const seedsample = Math.floor(Math.random() * 1e6);
  $("#character").value = pick(Math.random, [
    "a shy cartographer",
    "a sarcastic botanist",
    "a rookie courier",
    "a retired detective",
    "a bored guardian",
  ]);
  $("#setting").value = pick(Math.random, [
    "a floating library",
    "a quiet border town",
    "a subterranean market",
    "a failing orbital station",
    "a rainy canyon city",
  ]);
  $("#goal").value = pick(Math.random, [
    "deliver a message in time",
    "recover a stolen memory",
    "repair a broken promise",
    "prevent a quiet catastrophe",
    "win the midnight contest",
  ]);
  $("#tone").value = pick(Math.random, [
    "whimsical",
    "mysterious",
    "hopeful",
    "melancholic",
    "adventurous",
  ]);
  $$("#twists input[type=checkbox]").forEach((c) => (c.checked = false));
  // randomly check a few twists
  const howMany = 1 + Math.floor(Math.random() * 3);
  const indices = [...TWISTS.keys()]
    .sort(() => Math.random() - 0.5)
    .slice(0, howMany);
  indices.forEach((i) => ($("#tw-" + i).checked = true));
  seedInput.value = seedsample;
  lengthRange.value = String(3 + Math.floor(Math.random() * 7));
  lengthValue.textContent = lengthRange.value;
});

// Clear form
btnClear.addEventListener("click", () => {
  form.reset();
  $$("#twists input[type=checkbox]").forEach((c) => (c.checked = false));
  lengthRange.value = "5";
  lengthValue.textContent = "5";
  storyCard.hidden = true;
});

// Generate story
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const character = $("#character").value.trim() || "a nameless wanderer";
  const setting = $("#setting").value.trim() || "a place between rainstorms";
  const goal = $("#goal").value.trim() || "learn what the silence hides";
  const tone = $("#tone").value;
  const selectedTwists = $$("#twists input:checked").map((c) => c.value);
  const beats = parseInt(lengthRange.value, 10);
  const seed = seedInput.value
    ? Number(seedInput.value)
    : Math.floor(Math.random() * 1e9);
  const rng = mulberry32(seed);

  const story = buildStory({
    character,
    setting,
    goal,
    tone,
    twists: selectedTwists,
    beats,
    rng,
  });

  const title =
    titleInput.value.trim() || makeTitle({ character, setting, tone, rng });
  renderStory({
    title,
    meta: {
      character,
      setting,
      goal,
      tone,
      seed,
      beats,
      twists: selectedTwists,
    },
    story,
  });

  // Accessibility: move focus to story
  storyCard.scrollIntoView({ behavior: "smooth", block: "center" });
});

// Build story text
function buildStory({ character, setting, goal, tone, twists, beats, rng }) {
  const tones = {
    whimsical: {
      openers: [
        `On certain days, ${setting} smells like cinnamon and mischief.`,
        `Everyone insisted ${setting} was ordinary; it only behaved that way out of politeness.`,
        `${setting} kept its secrets in teacups and ticket stubs.`,
      ],
      verbs: ["tiptoes", "wanders", "hums", "pirouettes", "doodles"],
      feels: ["buoyant", "curious", "tickled", "giddy", "wide-eyed"],
    },
    mysterious: {
      openers: [
        `Fog stitched itself across ${setting}, threading silence through every alley.`,
        `Maps avoided ${setting}; the margins were safer.`,
        `In ${setting}, even the clocks spoke in riddles.`,
      ],
      verbs: ["lingers", "sharpens", "withholds", "listens", "circles"],
      feels: ["uneasy", "drawn", "alert", "haunted", "watchful"],
    },
    hopeful: {
      openers: [
        `Dawn braided light over ${setting}, patient as a promise.`,
        `Even the broken tiles of ${setting} glimmered with second chances.`,
        `Some places hold out their hands—${setting} was one of them.`,
      ],
      verbs: ["mends", "gathers", "brightens", "unfolds", "reaches"],
      feels: ["brave", "steadied", "warmed", "clear-sighted", "ready"],
    },
    melancholic: {
      openers: [
        `${setting} remembered more than it let on—dust is a kind of memory.`,
        `Rain rehearsed the same apology over ${setting}.`,
        `In ${setting}, echoes arrived on time; people didn’t.`,
      ],
      verbs: ["settles", "fades", "loosens", "drifts", "thins"],
      feels: ["hollow", "tired", "soft", "adrift", "tender"],
    },
    adventurous: {
      openers: [
        `A whistle split the air over ${setting}; trouble answered.`,
        `Bootsteps and bright plans clattered through ${setting}.`,
        `Routes crisscrossed ${setting} like scars begging for a story.`,
      ],
      verbs: ["charges", "scrambles", "improvises", "barrels", "vaults"],
      feels: ["thrilled", "reckless", "alive", "undaunted", "hungry"],
    },
  };

  const t = tones[tone] || tones.whimsical;

  const beatsArr = [];
  // Opening
  beatsArr.push(pick(rng, t.openers));

  // Middle beats
  for (let i = 0; i < beats - 2; i++) {
    const verb = pick(rng, t.verbs);
    const feel = pick(rng, t.feels);

    // occasionally inject a twist
    const doTwist = twists.length > 0 && rng() < 0.35;
    const twist = doTwist ? pick(rng, twists) : null;

    const sentenceTemplates = [
      `${capitalize(
        character
      )} ${verb} through clues no one else notices; they feel ${feel}.`,
      `A rumor folds into a map; ${character} ${verb} toward the goal to ${goal}.`,
      `A small kindness returns interest; ${character} feels ${feel} and ${verb} onward.`,
      `The locals shrug, but the shadows ${verb}. ${capitalize(
        character
      )} keeps going.`,
      `A locked door yields to a story traded; ${character} leaves ${setting} a little changed.`,
    ];

    let line = pick(rng, sentenceTemplates);
    line = line.replace("the goal", "the goal");

    if (twist) {
      line += ` Then ${twist}.`;
    }
    beatsArr.push(line);
  }

  // Climax / Resolution
  const endings = [
    `At last, ${character} faces the choice no map shows. They choose, and ${setting} exhales.`,
    `The goal to ${goal} was only a doorway; what matters is who steps through. ${capitalize(
      character
    )} does.`,
    `A quiet click, a bright breath—${character} finds that endings are just well-lit edges.`,
    `They do not conquer ${setting}; they befriend it. The rest follows.`,
  ];
  beatsArr.push(pick(rng, endings));

  // Join with paragraph spacing
  return beatsArr.join("\n\n");
}

function makeTitle({ character, setting, tone, rng }) {
  const palette = {
    whimsical: [
      "Teacup Orbits",
      "The Borrowed Map",
      "Polite Secrets",
      "Starlight Errands",
    ],
    mysterious: [
      "Margins of Fog",
      "The Hour That Repeats",
      "Riddled Clocks",
      "Threshold Noise",
    ],
    hopeful: [
      "Second Chances",
      "Dawn’s Ledger",
      "Lightkeepers",
      "The Open Hand",
    ],
    melancholic: [
      "The Dust Remembers",
      "Rain’s Apology",
      "Quiet Corridors",
      "Amber Echoes",
    ],
    adventurous: [
      "Routes and Reckoning",
      "Trouble’s Whistle",
      "Vaulting Lines",
      "Run Toward Bright",
    ],
  };
  const base = pick(rng, palette[tone] || palette.whimsical);
  const who = character.replace(/^a[n]?\s/i, "").trim();
  const place = setting.split(" ")[0];
  return `${base}: ${capitalize(who)} of ${capitalize(place)}`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Render story to UI
function renderStory({ title, meta, story }) {
  storyTitle.textContent = title;
  storyMeta.textContent = `Protagonist: ${meta.character} • Setting: ${meta.setting} • Goal: ${meta.goal} • Tone: ${meta.tone} • Beats: ${meta.beats} • Seed: ${meta.seed}`;
  storyText.textContent = story;
  storyCard.hidden = false;
  storyCard.setAttribute("data-title", title);
  storyCard.setAttribute("data-meta", JSON.stringify(meta));
}

// Copy / Download / Save / History
btnCopy.addEventListener("click", async () => {
  const text = formatForExport();
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  } catch {
    toast("Copy failed—select and copy manually.");
  }
});

btnDownload.addEventListener("click", () => {
  const blob = new Blob([formatForExport()], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const title = storyCard.getAttribute("data-title") || "story";
  a.href = url;
  a.download = `${sanitizeFilename(title)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

btnSave.addEventListener("click", () => {
  const title = storyCard.getAttribute("data-title") || "Untitled";
  const meta = JSON.parse(storyCard.getAttribute("data-meta") || "{}");
  const text = storyText.textContent || "";
  if (!text) {
    toast("Generate a story first.");
    return;
  }

  const entry = { id: crypto.randomUUID(), ts: Date.now(), title, meta, text };
  const data = JSON.parse(localStorage.getItem("storybuilder.history") || "[]");
  data.unshift(entry);
  localStorage.setItem("storybuilder.history", JSON.stringify(data));
  toast("Saved to history");
});

btnHistory.addEventListener("click", () => {
  renderHistory();
  historyDialog.showModal();
});

btnExportAll.addEventListener("click", (e) => {
  e.preventDefault();
  const data = JSON.parse(localStorage.getItem("storybuilder.history") || "[]");
  if (!data.length) {
    toast("No stories to export.");
    return;
  }
  const content = data
    .map(({ title, meta, text, ts }) => {
      const when = new Date(ts).toLocaleString();
      return `# ${title}\n(${when})\n${prettyMeta(meta)}\n\n${text}\n\n---\n`;
    })
    .join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "StoryBuilder_Export.txt";
  a.click();
  URL.revokeObjectURL(url);
});

btnClearHistory.addEventListener("click", (e) => {
  e.preventDefault();
  if (confirm("Clear all saved stories? This cannot be undone.")) {
    localStorage.removeItem("storybuilder.history");
    renderHistory();
  }
});

// Helpers
function formatForExport() {
  const title = storyCard.getAttribute("data-title") || "Untitled Story";
  const meta = JSON.parse(storyCard.getAttribute("data-meta") || "{}");
  const text = storyText.textContent || "";
  return `# ${title}\n${prettyMeta(meta)}\n\n${text}\n`;
}
function prettyMeta(meta) {
  return `Protagonist: ${meta.character}\nSetting: ${meta.setting}\nGoal: ${
    meta.goal
  }\nTone: ${meta.tone}\nBeats: ${meta.beats}\nSeed: ${meta.seed}${
    meta.twists?.length ? `\nTwists: ${meta.twists.join(", ")}` : ""
  }`;
}
function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 100);
}

function renderHistory() {
  const data = JSON.parse(localStorage.getItem("storybuilder.history") || "[]");
  historyList.innerHTML = "";
  if (!data.length) {
    historyList.innerHTML = `<p class="muted">No stories saved yet.</p>`;
    return;
  }
  data.forEach(({ id, title, meta, text, ts }) => {
    const item = document.createElement("div");
    item.className = "history-item";
    const when = new Date(ts).toLocaleString();
    item.innerHTML = `
        <h4>${title}</h4>
        <small>${when} — ${meta.tone} • ${meta.beats} beats</small>
        <pre>${text}</pre>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn small" data-act="load" data-id="${id}">Load</button>
          <button class="btn small danger" data-act="delete" data-id="${id}">Delete</button>
        </div>
      `;
    historyList.appendChild(item);
  });

  historyList.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      const id = btn.dataset.id;
      const dataNow = JSON.parse(
        localStorage.getItem("storybuilder.history") || "[]"
      );
      const idx = dataNow.findIndex((x) => x.id === id);
      if (idx === -1) return;

      if (act === "delete") {
        dataNow.splice(idx, 1);
        localStorage.setItem("storybuilder.history", JSON.stringify(dataNow));
        renderHistory();
      }
      if (act === "load") {
        const { title, meta, text } = dataNow[idx];
        storyTitle.textContent = title;
        storyMeta.textContent = `Protagonist: ${meta.character} • Setting: ${meta.setting} • Goal: ${meta.goal} • Tone: ${meta.tone} • Beats: ${meta.beats} • Seed: ${meta.seed}`;
        storyText.textContent = text;
        storyCard.hidden = false;
        historyDialog.close();
        toast("Loaded story");
      }
    },
    { once: true }
  ); // rebind each open
}

// Tiny toast
function toast(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.position = "fixed";
  el.style.bottom = "18px";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.padding = "10px 14px";
  el.style.background = "#1a1f3f";
  el.style.border = "1px solid #3a4373";
  el.style.borderRadius = "10px";
  el.style.color = "#eaf0ff";
  el.style.boxShadow = "0 10px 20px rgba(0,0,0,.35)";
  el.style.zIndex = 9999;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

// Initialize
renderTwists();
lengthValue.textContent = lengthRange.value;
