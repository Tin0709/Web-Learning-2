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

  // ===== Modal controls =====
  function openModal() {
    modal.hidden = false;
    $("body").style.overflow = "hidden";
    $("#title").focus();
  }
  function closeModalFn() {
    modal.hidden = true;
    $("body").style.overflow = "";
  }
  newPostBtn.addEventListener("click", openModal);
  closeModal.addEventListener("click", closeModalFn);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModalFn();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModalFn();
  });

  // ===== Form validation helpers =====
  titleInput.addEventListener("input", () => {
    const remaining = 120 - titleInput.value.length;
    titleHint.textContent = `${remaining} characters left`;
  });

  // ===== Geolocation =====
  geoBtn.addEventListener("click", async () => {
    if (!navigator.geolocation) return toast("Geolocation not supported");
    geoBtn.disabled = true;
    geoBtn.textContent = "📍…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        $("#location").value = `Lat ${latitude.toFixed(
          4
        )}, Lng ${longitude.toFixed(4)}`;
        $("#location").dataset.lat = latitude;
        $("#location").dataset.lng = longitude;
        toast("Added approximate coordinates");
        geoBtn.disabled = false;
        geoBtn.textContent = "📍";
      },
      (err) => {
        console.error(err);
        toast("Could not get location");
        geoBtn.disabled = false;
        geoBtn.textContent = "📍";
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 }
    );
  });

  // ===== Image Preview & Selection =====
  /** @type {string[]} */
  let selectedImages = [];
  imageInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files.slice(0, 3 - selectedImages.length)) {
      try {
        const dataUrl = await compressImage(file, 1000, 0.8);
        // Basic cap to keep localStorage sane (~400KB)
        if (dataUrl.length > 400_000) {
          toast("An image was too large after compression and was skipped.");
          continue;
        }
        selectedImages.push(dataUrl);
      } catch (err) {
        console.error(err);
        toast("Failed to process an image.");
      }
    }
    renderPreview();
    imageInput.value = ""; // allow re-uploading the same file if removed
  });

  function renderPreview() {
    imagePreview.innerHTML = "";
    selectedImages.forEach((src, idx) => {
      const wrap = el("div", { className: "chip" });
      const img = el("img", { src, alt: "Selected image preview" });
      const rm = el("button", {
        className: "remove",
        type: "button",
        textContent: "×",
        title: "Remove image",
      });
      rm.addEventListener("click", () => {
        selectedImages.splice(idx, 1);
        renderPreview();
      });
      wrap.append(img, rm);
      imagePreview.append(wrap);
    });
  }

  // ===== Rendering =====
  function render() {
    postsEl.setAttribute("aria-busy", "true");
    postsEl.innerHTML = "";

    let filtered = posts.filter((p) => {
      const matchCat =
        filters.category === "all" || p.category === filters.category;
      const q = filters.q.trim().toLowerCase();
      const matchQ =
        !q ||
        [p.title, p.description, p.location].some((v) =>
          (v || "").toLowerCase().includes(q)
        );
      return matchCat && matchQ;
    });

    if (filters.sortBy === "newest") {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (filters.sortBy === "popular") {
      filtered.sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);
    }

    if (!filtered.length) {
      const empty = el("div", { className: "card" });
      empty.append(el("h3", { textContent: "No posts yet" }));
      empty.append(
        el("p", {
          className: "muted",
          textContent: "Try creating a new post or clearing filters.",
        })
      );
      postsEl.append(empty);
      postsEl.setAttribute("aria-busy", "false");
      return;
    }

    const tpl = $("#postCardTemplate");
    for (const p of filtered) {
      const node = tpl.content.firstElementChild.cloneNode(true);

      // header
      const tag = $(".tag", node);
      setText(tag, p.category);
      tag.style.color = tagColor(p.category);
      $(".time", node).textContent = formatTime(p.createdAt);

      // title / desc
      $(".title", node).textContent = p.title;
      setMultiline($(".desc", node), p.description);

      // gallery
      const gal = $(".gallery", node);
      gal.innerHTML = "";
      if (p.images && p.images.length) {
        p.images.forEach((src) => {
          const im = el("img", { src, alt: "Post image" });
          gal.append(im);
        });
        gal.hidden = false;
      }

      // meta
      const loc = $(".loc", node);
      if (p.location) {
        loc.textContent = `📍 ${p.location}`;
        loc.hidden = false;
      }
      const map = $(".map-link", node);
      if (p.coords) {
        const [lat, lng] = p.coords;
        map.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
        map.textContent = "Open map";
        map.hidden = false;
      }
      const ev = $(".event", node);
      if (p.eventDate) {
        const dt = new Date(p.eventDate);
        ev.textContent = `🗓️ ${new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(dt)}`;
        ev.hidden = false;
      }

      // actions
      const likeBtn = $(".like-btn", node);
      likeBtn.setAttribute("aria-pressed", String(!!p.likedByMe));
      $(".likes", node).textContent = p.likes;
      likeBtn.addEventListener("click", () => {
        if (p.likedByMe) {
          p.likes--;
          p.likedByMe = false;
        } else {
          p.likes++;
          p.likedByMe = true;
        }
        persist();
        render();
      });

      const delBtn = $(".delete-btn", node);
      delBtn.addEventListener("click", () => {
        if (confirm("Delete this post? This action cannot be undone.")) {
          posts = posts.filter((x) => x.id !== p.id);
          persist();
          render();
          toast("Post deleted");
        }
      });

      // comments
      const commentsWrap = $(".comments", node);
      const toggleComments = $(".comment-toggle", node);
      toggleComments.addEventListener("click", () => {
        commentsWrap.hidden = !commentsWrap.hidden;
      });

      const list = $(".comment-list", node);
      p.comments.forEach((c) => list.append(renderComment(c)));

      const commentForm = $(".comment-form", node);
      commentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = commentForm.querySelector('input[name="comment"]');
        const text = input.value.trim();
        if (!text) return;
        const c = { id: crypto.randomUUID(), text, ts: Date.now() };
        p.comments.push(c);
        input.value = "";
        persist();
        list.append(renderComment(c));
      });

      postsEl.append(node);
    }

    postsEl.setAttribute("aria-busy", "false");
  }

  function renderComment(c) {
    const item = el("div", { className: "comment" });
    const bubble = el("div", { className: "bubble" });
    setText(bubble, c.text);
    const stamp = el("div", {
      className: "stamp",
      textContent: formatTime(c.ts),
    });
    item.append(bubble, stamp);
    return item;
  }

  function tagColor(cat) {
    switch (cat) {
      case "Announcements":
        return "#9dd9ff";
      case "Events":
        return "#ffd166";
      case "For Sale":
        return "#90ee90";
      case "Lost & Found":
        return "#f8b5ff";
      case "Services":
        return "#fcb69f";
      default:
        return "var(--accent)";
    }
  }

  function persist() {
    store.set(LS_KEY, posts);
  }

  // ===== Filters =====
  searchInput.addEventListener(
    "input",
    debounce(() => {
      filters.q = searchInput.value;
      render();
    }, 200)
  );

  categoryFilter.addEventListener("change", () => {
    filters.category = categoryFilter.value;
    render();
  });
  sortSelect.addEventListener("change", () => {
    filters.sortBy = sortSelect.value;
    render();
  });

  // ===== Create Post =====
  postForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = form.title.value.trim();
    const category = form.category.value;
    const description = form.description.value.trim();
    const location = form.location.value.trim();
    const eventDate = form.eventDate.value
      ? new Date(form.eventDate.value).toISOString()
      : null;

    if (!title || !category || !description) {
      toast("Please fill in the required fields");
      return;
    }

    let coords = null;
    const lat = form.location.dataset.lat;
    const lng = form.location.dataset.lng;
    if (lat && lng) coords = [Number(lat), Number(lng)];

    const post = {
      id: crypto.randomUUID(),
      title,
      category,
      description,
      location,
      coords,
      eventDate,
      images: [...selectedImages],
      likes: 0,
      likedByMe: false,
      createdAt: Date.now(),
      comments: [],
    };
    posts.unshift(post);
    persist();
    render();
    closeModalFn();
    form.reset();
    selectedImages = [];
    renderPreview();
    delete form.location.dataset.lat;
    delete form.location.dataset.lng;
    toast("Posted!");
  });

  resetFormBtn.addEventListener("click", () => {
    postForm.reset();
    selectedImages = [];
    renderPreview();
    delete postForm.location.dataset.lat;
    delete postForm.location.dataset.lng;
  });

  // ===== Init =====
  render();
})();
