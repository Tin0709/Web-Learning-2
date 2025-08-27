/* -------------------------------------------------------
   Music Playlist Generator (vanilla JS)
   - Scores tracks by mood, genre, bpm, and energy
   - Fills up to a target duration
   - Saves to localStorage & exports .m3u
---------------------------------------------------------*/

// ======= Tiny in-memory catalog (sample data) =======
// lengthSec is approximate; url is a YouTube search link.
const CATALOG = [
  {
    title: "Sunburst",
    artist: "Nova Lane",
    genres: ["EDM", "Pop"],
    moods: ["Happy", "Party", "Workout"],
    bpm: 128,
    energy: 0.86,
    lengthSec: 210,
  },
  {
    title: "City Dreams",
    artist: "Neon Coast",
    genres: ["Synthwave", "EDM"],
    moods: ["Chill", "Focus"],
    bpm: 100,
    energy: 0.52,
    lengthSec: 232,
  },
  {
    title: "Midnight Study",
    artist: "LoKeys",
    genres: ["Lo-fi", "Hip-Hop"],
    moods: ["Focus", "Chill"],
    bpm: 72,
    energy: 0.35,
    lengthSec: 187,
  },
  {
    title: "Runner’s High",
    artist: "Pulse Theory",
    genres: ["EDM"],
    moods: ["Workout", "Party", "Happy"],
    bpm: 140,
    energy: 0.92,
    lengthSec: 205,
  },
  {
    title: "Coffee & Rain",
    artist: "Blue Umbra",
    genres: ["Jazz"],
    moods: ["Chill", "Sad"],
    bpm: 92,
    energy: 0.28,
    lengthSec: 260,
  },
  {
    title: "Paper Planes",
    artist: "IndiGlow",
    genres: ["Indie", "Pop"],
    moods: ["Happy", "Chill"],
    bpm: 112,
    energy: 0.55,
    lengthSec: 214,
  },
  {
    title: "Grind Mode",
    artist: "Barbell Beats",
    genres: ["Hip-Hop"],
    moods: ["Workout", "Party"],
    bpm: 150,
    energy: 0.88,
    lengthSec: 198,
  },
  {
    title: "Deep Focus",
    artist: "Quiet Circuit",
    genres: ["Lo-fi", "Electronic"],
    moods: ["Focus"],
    bpm: 64,
    energy: 0.22,
    lengthSec: 180,
  },
  {
    title: "Afterlight",
    artist: "Orion Echo",
    genres: ["Indie", "Rock"],
    moods: ["Sad", "Chill"],
    bpm: 98,
    energy: 0.48,
    lengthSec: 246,
  },
  {
    title: "Thunderstep",
    artist: "Peakline",
    genres: ["EDM"],
    moods: ["Workout", "Party"],
    bpm: 160,
    energy: 0.96,
    lengthSec: 192,
  },
  {
    title: "Sunset Drive",
    artist: "Glass Roads",
    genres: ["Pop", "R&B"],
    moods: ["Happy", "Chill"],
    bpm: 105,
    energy: 0.6,
    lengthSec: 221,
  },
  {
    title: "Bloom",
    artist: "Cadenza",
    genres: ["Classical"],
    moods: ["Focus", "Sad"],
    bpm: 70,
    energy: 0.2,
    lengthSec: 174,
  },
  {
    title: "Glowsticks",
    artist: "Basement Neon",
    genres: ["EDM", "Hip-Hop"],
    moods: ["Party"],
    bpm: 128,
    energy: 0.8,
    lengthSec: 208,
  },
  {
    title: "Low Tide",
    artist: "Horizon Blue",
    genres: ["Indie", "Lo-fi"],
    moods: ["Chill"],
    bpm: 76,
    energy: 0.3,
    lengthSec: 243,
  },
  {
    title: "Lift & Live",
    artist: "Iron Anthem",
    genres: ["Rock"],
    moods: ["Workout", "Happy"],
    bpm: 145,
    energy: 0.9,
    lengthSec: 201,
  },
  {
    title: "Night Notebook",
    artist: "Page Turner",
    genres: ["Lo-fi"],
    moods: ["Focus", "Chill"],
    bpm: 60,
    energy: 0.18,
    lengthSec: 176,
  },
  {
    title: "Quiet Plans",
    artist: "Soft Static",
    genres: ["Ambient", "Electronic"],
    moods: ["Focus", "Sad"],
    bpm: 66,
    energy: 0.15,
    lengthSec: 300,
  },
  {
    title: "Rooftop Laughs",
    artist: "Sidewalk Stereo",
    genres: ["Pop", "Indie"],
    moods: ["Happy", "Party"],
    bpm: 118,
    energy: 0.72,
    lengthSec: 216,
  },
  {
    title: "Late Message",
    artist: "Violet Room",
    genres: ["R&B"],
    moods: ["Sad", "Chill"],
    bpm: 94,
    energy: 0.4,
    lengthSec: 229,
  },
  {
    title: "Edge Sprint",
    artist: "GravShift",
    genres: ["EDM", "Rock"],
    moods: ["Workout"],
    bpm: 152,
    energy: 0.95,
    lengthSec: 206,
  },
];

// Compute a URL for each track lazily (YouTube search).
const trackToUrl = (t) => {
  const q = encodeURIComponent(`${t.artist} ${t.title}`);
  return `https://www.youtube.com/results?search_query=${q}`;
};

// ======= DOM =======
const $ = (sel) => document.querySelector(sel);
const moodEl = $("#mood");
const genresEl = $("#genres");
const durationEl = $("#duration");
const bpmMinEl = $("#bpmMin");
const bpmMaxEl = $("#bpmMax");
const energyMinEl = $("#energyMin");
const energyMaxEl = $("#energyMax");
const bpmMinLabel = $("#bpmMinLabel");
const bpmMaxLabel = $("#bpmMaxLabel");
const energyMinLabel = $("#energyMinLabel");
const energyMaxLabel = $("#energyMaxLabel");
const resultsEl = $("#results");
const statsEl = $("#stats");
const saveBtn = $("#save");
const exportBtn = $("#export");
const playlistNameEl = $("#playlistName");
const surpriseBtn = $("#surprise");
const generateBtn = $("#generate");
const clearBtn = $("#clear");
const savedListEl = $("#saved");
const savedEmptyEl = $("#savedEmpty");

// ======= Utilities =======
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const minutes = (sec) => (sec / 60).toFixed(1);
const fmtDur = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

function getSelectedGenres() {
  return [...genresEl.options].filter((o) => o.selected).map((o) => o.value);
}

// Score a track based on the current filters
function scoreTrack(track, filters) {
  let score = 0;

  // Mood bonus
  if (!filters.mood || track.moods.includes(filters.mood))
    score += filters.mood ? 40 : 10;

  // Genre match: +10 per matching selected genre (up to +30)
  if (filters.genres.length) {
    const matches = track.genres.filter((g) =>
      filters.genres.includes(g)
    ).length;
    if (matches > 0) score += clamp(matches * 10, 0, 30);
    else score -= 10; // slight penalty if user chose genres and this doesn't match
  } else {
    score += 10; // no genre preference => mild bump
  }

  // BPM closeness
  const bpmTarget = (filters.bpmMin + filters.bpmMax) / 2;
  const bpmSpread = Math.max(1, filters.bpmMax - filters.bpmMin);
  const bpmDelta = Math.abs(track.bpm - bpmTarget) / bpmSpread; // 0 (perfect) .. >1
  score += Math.max(0, 30 - bpmDelta * 35); // up to +30

  // Energy in range + closeness
  const e = track.energy * 100;
  const inRange = e >= filters.energyMin && e <= filters.energyMax;
  if (inRange) score += 20;
  const eTarget = (filters.energyMin + filters.energyMax) / 2;
  const eDelta =
    Math.abs(e - eTarget) / Math.max(1, filters.energyMax - filters.energyMin);
  score += Math.max(0, 20 - eDelta * 25); // up to +20

  // Small diversity/randomness
  score += Math.random() * 5;

  return score;
}

// Greedy fill to hit target duration
function buildPlaylist(scoredTracks, targetSec) {
  const chosen = [];
  let total = 0;

  for (const t of scoredTracks) {
    if (total + t.lengthSec <= targetSec + 45 || chosen.length < 5) {
      // keep some minimum and allow slight overflow
      chosen.push(t);
      total += t.lengthSec;
    }
    if (total >= targetSec) break;
  }

  return { tracks: chosen, totalSec: total };
}

// Render functions
function renderTracks(list) {
  resultsEl.innerHTML = "";
  list.forEach((t) => {
    const li = document.createElement("li");
    li.className = "track";
    li.innerHTML = `
        <div class="meta">
          <span class="title">${t.title}</span>
          <span class="badge outline">${t.artist}</span>
          <span class="badge">${t.genres.join(" / ")}</span>
          <span class="badge">BPM ${t.bpm}</span>
          <span class="badge">Energy ${(t.energy * 100).toFixed(0)}</span>
          <span class="badge">${fmtDur(t.lengthSec)}</span>
        </div>
        <div class="right">
          <a href="${trackToUrl(t)}" target="_blank" rel="noopener">Search ▶</a>
          <button class="remove" title="Remove from playlist">Remove</button>
        </div>
      `;
    li.querySelector(".remove").addEventListener("click", () => {
      li.remove();
      // also reflect removal in the in-memory current list
      currentPlaylist.tracks = currentPlaylist.tracks.filter(
        (x) => !(x.title === t.title && x.artist === t.artist)
      );
      currentPlaylist.totalSec = currentPlaylist.tracks.reduce(
        (s, x) => s + x.lengthSec,
        0
      );
      updateStats(currentPlaylist);
    });
    resultsEl.appendChild(li);
  });
}

function updateStats({ tracks, totalSec }) {
  statsEl.innerHTML = `
      <div>Tracks: <strong>${tracks.length}</strong></div>
      <div>Total: <strong>${fmtDur(totalSec)}</strong> (${minutes(
    totalSec
  )} min)</div>
      <div>Avg BPM: <strong>${
        tracks.length
          ? Math.round(tracks.reduce((s, t) => s + t.bpm, 0) / tracks.length)
          : 0
      }</strong></div>
    `;
}

// ======= State =======
let currentPlaylist = { name: "", tracks: [], totalSec: 0 };

// ======= Event wiring =======
[bpmMinEl, bpmMaxEl].forEach((el) =>
  el.addEventListener("input", () => {
    const min = Math.min(+bpmMinEl.value, +bpmMaxEl.value);
    const max = Math.max(+bpmMinEl.value, +bpmMaxEl.value);
    bpmMinEl.value = min;
    bpmMaxEl.value = max;
    bpmMinLabel.textContent = min;
    bpmMaxLabel.textContent = max;
  })
);

[energyMinEl, energyMaxEl].forEach((el) =>
  el.addEventListener("input", () => {
    const min = Math.min(+energyMinEl.value, +energyMaxEl.value);
    const max = Math.max(+energyMinEl.value, +energyMaxEl.value);
    energyMinEl.value = min;
    energyMaxEl.value = max;
    energyMinLabel.textContent = min;
    energyMaxLabel.textContent = max;
  })
);

clearBtn.addEventListener("click", () => {
  moodEl.value = "";
  [...genresEl.options].forEach((o) => (o.selected = false));
  durationEl.value = 40;
  bpmMinEl.value = 80;
  bpmMaxEl.value = 150;
  bpmMinLabel.textContent = "80";
  bpmMaxLabel.textContent = "150";
  energyMinEl.value = 0;
  energyMaxEl.value = 100;
  energyMinLabel.textContent = "0";
  energyMaxLabel.textContent = "100";
  playlistNameEl.value = "";
  resultsEl.innerHTML = "";
  statsEl.textContent = "";
  currentPlaylist = { name: "", tracks: [], totalSec: 0 };
});

surpriseBtn.addEventListener("click", () => {
  const moods = ["Happy", "Chill", "Focus", "Workout", "Sad", "Party"];
  moodEl.value = moods[Math.floor(Math.random() * moods.length)];
  // random two genres
  const allGenres = [...genresEl.options];
  allGenres.forEach((o) => (o.selected = false));
  allGenres
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .forEach((o) => (o.selected = true));
  // duration 25-70
  durationEl.value = 25 + Math.floor(Math.random() * 46);
  // bpm / energy random but consistent with mood vibes
  const mood = moodEl.value;
  let bpmLo = 70,
    bpmHi = 140,
    eLo = 20,
    eHi = 90;
  if (mood === "Workout" || mood === "Party") {
    bpmLo = 120;
    bpmHi = 170;
    eLo = 60;
    eHi = 100;
  }
  if (mood === "Focus") {
    bpmLo = 60;
    bpmHi = 100;
    eLo = 0;
    eHi = 50;
  }
  if (mood === "Sad") {
    bpmLo = 60;
    bpmHi = 110;
    eLo = 0;
    eHi = 60;
  }
  bpmMinEl.value = bpmLo;
  bpmMaxEl.value = bpmHi;
  bpmMinLabel.textContent = bpmLo;
  bpmMaxLabel.textContent = bpmHi;
  energyMinEl.value = eLo;
  energyMaxEl.value = eHi;
  energyMinLabel.textContent = eLo;
  energyMaxLabel.textContent = eHi;
});

generateBtn.addEventListener("click", () => {
  const filters = {
    mood: moodEl.value || null,
    genres: getSelectedGenres(),
    bpmMin: +bpmMinEl.value,
    bpmMax: +bpmMaxEl.value,
    energyMin: +energyMinEl.value,
    energyMax: +energyMaxEl.value,
  };
  const targetSec = clamp((+durationEl.value || 40) * 60, 60 * 5, 60 * 180);

  // score & sort
  const scored = CATALOG.map((t) => ({ ...t, _score: scoreTrack(t, filters) }))
    .filter((t) => t.bpm >= filters.bpmMin && t.bpm <= filters.bpmMax)
    .filter((t) => {
      const e = t.energy * 100;
      return e >= filters.energyMin && e <= filters.energyMax;
    })
    .sort((a, b) => b._score - a._score);

  const built = buildPlaylist(scored, targetSec);
  currentPlaylist = { name: playlistNameEl.value.trim(), ...built };
  renderTracks(built.tracks);
  updateStats(built);

  if (!built.tracks.length) {
    resultsEl.innerHTML = `<li class="muted">No matches. Try widening your BPM/energy or clearing genres.</li>`;
  }
});

// Save to localStorage
saveBtn.addEventListener("click", () => {
  const name =
    playlistNameEl.value.trim() || `My Playlist ${new Date().toLocaleString()}`;
  if (!currentPlaylist.tracks.length) {
    alert("Generate a playlist first.");
    return;
  }
  const data = {
    name,
    createdAt: Date.now(),
    tracks: currentPlaylist.tracks,
    totalSec: currentPlaylist.totalSec,
  };
  const all = loadAll();
  all.push(data);
  localStorage.setItem("mpg.playlists", JSON.stringify(all));
  playlistNameEl.value = name;
  renderSaved();
});

// Export as .m3u file
exportBtn.addEventListener("click", () => {
  if (!currentPlaylist.tracks.length) {
    alert("Generate a playlist first.");
    return;
  }
  const name = (playlistNameEl.value.trim() || "playlist").replace(
    /[^\w\- ]+/g,
    ""
  );
  const lines = [
    "#EXTM3U",
    ...currentPlaylist.tracks.map((t) => {
      // EXTINF:<seconds>,Artist - Title
      return `#EXTINF:${t.lengthSec},${t.artist} - ${t.title}\n${trackToUrl(
        t
      )}`;
    }),
  ];
  const blob = new Blob([lines.join("\n")], { type: "audio/x-mpegurl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name || "playlist"}.m3u`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
});

// Saved playlists UI
function loadAll() {
  try {
    return JSON.parse(localStorage.getItem("mpg.playlists") || "[]");
  } catch {
    return [];
  }
}
function renderSaved() {
  const all = loadAll().sort((a, b) => b.createdAt - a.createdAt);
  savedListEl.innerHTML = "";
  savedEmptyEl.style.display = all.length ? "none" : "block";

  all.forEach((p, idx) => {
    const li = document.createElement("li");
    li.className = "saved-card";
    const created = new Date(p.createdAt).toLocaleString();
    li.innerHTML = `
        <header>
          <div class="name">${p.name}</div>
          <div class="meta">${p.tracks.length} tracks • ${minutes(
      p.totalSec
    )} min • ${created}</div>
        </header>
        <div class="actions">
          <button data-act="load">Load</button>
          <button data-act="export">Export</button>
          <button data-act="delete" class="danger">Delete</button>
        </div>
      `;

    li.querySelector('[data-act="load"]').addEventListener("click", () => {
      currentPlaylist = {
        name: p.name,
        tracks: p.tracks,
        totalSec: p.totalSec,
      };
      playlistNameEl.value = p.name;
      renderTracks(p.tracks);
      updateStats(p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    li.querySelector('[data-act="export"]').addEventListener("click", () => {
      const lines = [
        "#EXTM3U",
        ...p.tracks.map(
          (t) =>
            `#EXTINF:${t.lengthSec},${t.artist} - ${t.title}\n${trackToUrl(t)}`
        ),
      ];
      const blob = new Blob([lines.join("\n")], { type: "audio/x-mpegurl" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(p.name || "playlist").replace(/[^\w\- ]+/g, "")}.m3u`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 0);
    });
    li.querySelector('[data-act="delete"]').addEventListener("click", () => {
      if (!confirm(`Delete "${p.name}"?`)) return;
      const all2 = loadAll();
      all2.splice(idx, 1);
      localStorage.setItem("mpg.playlists", JSON.stringify(all2));
      renderSaved();
    });

    savedListEl.appendChild(li);
  });
}

// Init
renderSaved();
updateStats({ tracks: [], totalSec: 0 });
