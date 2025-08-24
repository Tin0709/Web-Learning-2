// Community Board - Vanilla JS
(function () {
  "use strict";

  // ===== Utilities =====
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const store = {
    get(key, fallback) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },
    set(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
    },
  };
  const formatTime = (ts) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  const el = (tag, opts = {}) =>
    Object.assign(document.createElement(tag), opts);
  const toast = (msg, ms = 2000) => {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), ms);
  };
  const debounce = (fn, ms = 250) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  // Sanitize text for insertion (avoid innerHTML with raw user content)
  const setText = (node, text) => {
    node.textContent = text ?? "";
  };
  const setMultiline = (node, text) => {
    node.innerHTML = ""; // safe because we only append text nodes + <br>
    (text || "").split("\n").forEach((line, i) => {
      node.appendChild(document.createTextNode(line));
      if (i < (text || "").split("\n").length - 1)
        node.appendChild(document.createElement("br"));
    });
  };

  // Image compression to dataURL (JPEG)
  async function compressImage(file, maxW = 1000, quality = 0.8) {
    const dataURL = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataURL;
    });
    const scale = Math.min(1, maxW / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  }

  // ===== State =====
  const LS_KEY = "cb_posts_v1";
  /** @type {Array<Post>} */
  let posts = store.get(LS_KEY, []);
  let filters = { q: "", category: "all", sortBy: "newest" };

  // Seed demo content if empty
  if (!posts.length) {
    posts = [
      {
        id: crypto.randomUUID(),
        title: "Neighborhood Cleanup – Volunteers Welcome",
        category: "Events",
        description:
          "Join us this Sunday 9:00 AM at Riverside Park entrance. Gloves and bags provided. Coffee after!",
        location: "Riverside Park",
        coords: null,
        eventDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
        images: [],
        likes: 5,
        likedByMe: false,
        createdAt: Date.now() - 2 * 24 * 3600 * 1000,
        comments: [
          {
            id: crypto.randomUUID(),
            text: "Count me in!",
            ts: Date.now() - 2 * 24 * 3600 * 1000 + 3600000,
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        title: "Gently used bike for sale",
        category: "For Sale",
        description:
          "Hybrid bike, great condition. 3.5M VND or best offer. Pickup in District 1.",
        location: "District 1",
        coords: null,
        eventDate: null,
        images: [],
        likes: 2,
        likedByMe: false,
        createdAt: Date.now() - 5 * 3600 * 1000,
        comments: [],
      },
      {
        id: crypto.randomUUID(),
        title: "Lost & Found: Keys near the library",
        category: "Lost & Found",
        description:
          "Found a set of keys with a small turtle keychain near the main library steps. Describe to claim.",
        location: "City Library",
        coords: null,
        eventDate: null,
        images: [],
        likes: 1,
        likedByMe: false,
        createdAt: Date.now() - 3600 * 1000,
        comments: [],
      },
    ];
    store.set(LS_KEY, posts);
  }

  // ===== Elements =====
  const postsEl = $("#posts");
  const newPostBtn = $("#newPostBtn");
  const modal = $("#modal");
  const closeModal = $("#closeModal");
  const postForm = $("#postForm");
  const resetFormBtn = $("#resetForm");
  const searchInput = $("#search");
  const categoryFilter = $("#categoryFilter");
  const sortSelect = $("#sortBy");
  const imageInput = $("#images");
  const imagePreview = $("#imagePreview");
  const titleInput = $("#title");
  const titleHint = $("#titleHint");
  const geoBtn = $("#geoBtn");
});
