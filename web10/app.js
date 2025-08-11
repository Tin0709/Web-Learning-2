/* SkillSwap — vanilla JS front-end with localStorage
   Features:
   - Add/delete listings
   - Search by skill
   - Mutual match suggestions (A teaches what B wants, and B teaches what A wants)
   - Persistent via localStorage
*/

(() => {
  const STORAGE_KEY = "skillswap:listings:v1";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const els = {
    form: $("#listingForm"),
    search: $("#search"),
    cards: $("#cards"),
    matches: $("#matches"),
    count: $("#count"),
    clearBtn: $("#clearDataBtn"),
    status: $("#formStatus"),
    cardTmpl: $("#cardTmpl"),
    matchTmpl: $("#matchTmpl"),
  };

  // ---------- Utilities
  const tokenize = (str) =>
    str
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  const unique = (arr) => Array.from(new Set(arr));

  const normalizeListing = (l) => ({
    id: l.id ?? crypto.randomUUID(),
    name: l.name?.trim() || "Anonymous",
    offers: unique(tokenize(l.offers || "")),
    wants: unique(tokenize(l.wants || "")),
    availability: (l.availability || "").trim(),
    contact: (l.contact || "").trim(),
    createdAt: l.createdAt ?? Date.now(),
  });

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seed();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeListing) : seed();
    } catch {
      return seed();
    }
  };

  const save = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // Demo data to make it feel alive
  const seed = () => {
    const demo = [
      {
        name: "Alex",
        offers: "guitar, songwriting",
        wants: "react, next.js",
        availability: "Weeknights",
        contact: "@alex",
      },
      {
        name: "Mina",
        offers: "korean basics, meal prep",
        wants: "illustrator, figma",
        availability: "Sat mornings",
        contact: "mina@mail.com",
      },
      {
        name: "Ravi",
        offers: "python, data viz",
        wants: "public speaking, guitar",
        availability: "Flexible",
        contact: "@ravi",
      },
      {
        name: "Linh",
        offers: "figma, ui design",
        wants: "budgeting, python",
        availability: "Sun afternoons",
        contact: "@linh",
      },
      {
        name: "Diego",
        offers: "react, next.js",
        wants: "spanish conversation partner",
        availability: "Evenings",
        contact: "@diego",
      },
    ].map(normalizeListing);
    save(demo);
    return demo;
  };

  let listings = load();
  let query = "";

  // ---------- Render
  function renderAll() {
    renderCards();
    renderMatches();
    els.count.textContent = `${listings.length} listing${
      listings.length === 1 ? "" : "s"
    }`;
  }

  function renderCards() {
    els.cards.setAttribute("aria-busy", "true");
    els.cards.innerHTML = "";

    const filtered = filterListings(listings, query);
    for (const l of filtered) {
      const li = els.cardTmpl.content.firstElementChild.cloneNode(true);
      $(".card-title", li).textContent = l.name;
      $(".contact", li).textContent = l.contact || "No contact provided";
      $(".availability", li).textContent = l.availability
        ? `Availability: ${l.availability}`
        : "";

      const offersWrap = $(".pills-offers", li);
      const wantsWrap = $(".pills-wants", li);
      for (const s of l.offers) offersWrap.appendChild(createPill(s));
      for (const s of l.wants) wantsWrap.appendChild(createPill(s));

      $(".btn-delete", li).addEventListener("click", () => {
        listings = listings.filter((x) => x.id !== l.id);
        save(listings);
        renderAll();
      });

      els.cards.appendChild(li);
    }

    if (!filtered.length) {
      const empty = document.createElement("li");
      empty.className = "card";
      empty.innerHTML = `<p class="muted">No results. Try different keywords or add the first listing!</p>`;
      els.cards.appendChild(empty);
    }
    els.cards.setAttribute("aria-busy", "false");
  }

  function createPill(text) {
    const span = document.createElement("span");
    span.className = "pill";
    span.textContent = text;
    return span;
  }

  // Matches: pair users A,B if A.offers ∩ B.wants AND B.offers ∩ A.wants
  function renderMatches() {
    els.matches.setAttribute("aria-busy", "true");
    els.matches.innerHTML = "";

    const pairs = computeMatches(filterListings(listings, query));
    if (!pairs.length) {
      const li = document.createElement("li");
      li.className = "match";
      li.innerHTML = `<div class="muted">No mutual matches yet. Add more listings or broaden skills.</div>`;
      els.matches.appendChild(li);
      els.matches.setAttribute("aria-busy", "false");
      return;
    }

    for (const m of pairs) {
      const li = els.matchTmpl.content.firstElementChild.cloneNode(true);
      $(".a .who", li).textContent = m.a.name;
      $(".b .who", li).textContent = m.b.name;

      const a2b = $(".pills-a2b", li);
      const b2a = $(".pills-b2a", li);
      m.a2b.forEach((s) => a2b.appendChild(createPill(s)));
      m.b2a.forEach((s) => b2a.appendChild(createPill(s)));

      els.matches.appendChild(li);
    }

    els.matches.setAttribute("aria-busy", "false");
  }

  function computeMatches(arr) {
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const A = arr[i],
          B = arr[j];
        const a2b = intersect(A.offers, B.wants);
        const b2a = intersect(B.offers, A.wants);
        if (a2b.length && b2a.length) {
          // simple score: more overlap, earlier created listings get slight boost
          const score =
            a2b.length +
            b2a.length +
            1 /
              (1 +
                (Date.now() - Math.min(A.createdAt, B.createdAt)) /
                  (1000 * 60 * 60 * 24));
          out.push({ a: A, b: B, a2b, b2a, score });
        }
      }
    }
    // highest score first
    return out.sort((x, y) => y.score - x.score).slice(0, 20);
  }

  const intersect = (a, b) => {
    const setB = new Set(b.map((s) => s.toLowerCase()));
    return a.filter((s) => setB.has(s.toLowerCase()));
  };

  function filterListings(arr, q) {
    if (!q) return arr;
    const needle = q.toLowerCase().trim();
    return arr.filter(
      (l) =>
        l.name.toLowerCase().includes(needle) ||
        l.offers.some((s) => s.includes(needle)) ||
        l.wants.some((s) => s.includes(needle)) ||
        l.contact.toLowerCase().includes(needle)
    );
  }

  // ---------- Events
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData(els.form);

    const listing = normalizeListing({
      name: form.get("name"),
      offers: form.get("offers"),
      wants: form.get("wants"),
      availability: form.get("availability"),
      contact: form.get("contact"),
    });

    // basic validation: at least one offer and one want
    if (!listing.offers.length || !listing.wants.length) {
      announce("Please add at least one skill to teach and one to learn.");
      return;
    }

    listings.unshift(listing);
    save(listings);
    els.form.reset();
    announce("Listing added!");
    renderAll();
  });

  els.search.addEventListener("input", (e) => {
    query = e.target.value;
    renderAll();
  });

  els.clearBtn.addEventListener("click", () => {
    if (!confirm("Reset to demo data? This clears your current listings."))
      return;
    listings = seed();
    renderAll();
  });

  function announce(msg) {
    els.status.textContent = msg;
    // brief visual confirmation
    els.status.classList.remove("sr-only");
    setTimeout(() => els.status.classList.add("sr-only"), 1200);
  }

  // ---------- Init
  renderAll();
})();
