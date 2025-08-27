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
