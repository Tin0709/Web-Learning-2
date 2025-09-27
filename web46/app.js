/* ===========================
   🔑 SET YOUR TMDB API KEY
   ===========================
   1) Create a (free) TMDB account → https://www.themoviedb.org/
   2) Go to Settings → API → create a v3 API key
   3) Paste it below (string)
*/
const TMDB_API_KEY = "YOUR_TMDB_API_KEY_HERE"; // <- replace this!

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600'><rect width='100%' height='100%' fill='#0f172a'/><text x='50%' y='50%' fill='#9aa4b2' font-size='20' font-family='sans-serif' text-anchor='middle'>No Image</text></svg>`
  );
