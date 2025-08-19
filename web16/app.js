/* =========================
   Demo E-commerce Storefront
   ========================= */

const state = {
  products: [
    {
      id: "p01",
      name: "Aero Ceramic Mug",
      category: "Kitchen",
      price: 16.5,
      desc: "Matte ceramic, 350ml capacity, dishwasher safe.",
      img: "https://picsum.photos/seed/mug/600/450",
    },
    {
      id: "p02",
      name: "Loom Cotton Throw",
      category: "Home",
      price: 49,
      desc: "Soft woven throw blanket, 130×160cm.",
      img: "https://picsum.photos/seed/throw/600/450",
    },
    {
      id: "p03",
      name: "Bonsai Starter Kit",
      category: "Garden",
      price: 29.5,
      desc: "Everything you need to grow a tiny tree.",
      img: "https://picsum.photos/seed/bonsai/600/450",
    },
    {
      id: "p04",
      name: "Aurora LED Lamp",
      category: "Lighting",
      price: 72,
      desc: "Warm & cool tones, touch dimming.",
      img: "https://picsum.photos/seed/lamp/600/450",
    },
    {
      id: "p05",
      name: "Slate Notebook",
      category: "Stationery",
      price: 9.9,
      desc: "A5 dotted, 160 pages, lay-flat binding.",
      img: "https://picsum.photos/seed/notebook/600/450",
    },
    {
      id: "p06",
      name: "Travel Drip Kit",
      category: "Kitchen",
      price: 35,
      desc: "Folding dripper + filters + scoop in pouch.",
      img: "https://picsum.photos/seed/drip/600/450",
    },
    {
      id: "p07",
      name: "Monstera Planter",
      category: "Garden",
      price: 24,
      desc: "Stoneware planter with drainage tray.",
      img: "https://picsum.photos/seed/planter/600/450",
    },
    {
      id: "p08",
      name: "Nimbus Desk Mat",
      category: "Home",
      price: 28,
      desc: "Micro-textured surface, 80×30cm.",
      img: "https://picsum.photos/seed/mat/600/450",
    },
  ],
  cart: {}, // id -> {product, qty}
  taxRate: 0.08,
};

// --- Utils
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const fmt = (n) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

function saveCart() {
  localStorage.setItem("demo_cart", JSON.stringify(state.cart));
}
function loadCart() {
  try {
    const raw = localStorage.getItem("demo_cart");
    if (raw) state.cart = JSON.parse(raw) || {};
  } catch {}
}

// --- Rendering
function renderCategoryOptions() {
  const select = $("#categorySelect");
  const cats = Array.from(
    new Set(state.products.map((p) => p.category))
  ).sort();
  cats.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

function productCard(p) {
  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
      <div class="media">
        <img loading="lazy" src="${p.img}" alt="${p.name}" />
      </div>
      <div class="body">
        <div class="meta">
          <h3 class="title">${p.name}</h3>
          <span class="badge">${p.category}</span>
        </div>
        <p class="desc">${p.desc}</p>
        <div class="meta">
          <div class="price">${fmt(p.price)}</div>
          <div class="actions">
            <div class="qty" aria-label="Choose quantity">
              <button class="dec" aria-label="Decrease quantity">−</button>
              <span class="qval" aria-live="polite">1</span>
              <button class="inc" aria-label="Increase quantity">+</button>
            </div>
            <button class="btn add-btn" aria-label="Add ${
              p.name
            } to cart">Add</button>
          </div>
        </div>
      </div>
    `;

  let q = 1;
  const qval = el.querySelector(".qval");
  el.querySelector(".inc").addEventListener("click", () => {
    q++;
    qval.textContent = q;
  });
  el.querySelector(".dec").addEventListener("click", () => {
    q = Math.max(1, q - 1);
    qval.textContent = q;
  });
  el.querySelector(".add-btn").addEventListener("click", () =>
    addToCart(p.id, q)
  );
  return el;
}

function renderProducts(list) {
  const grid = $("#products");
  grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = `<p class="muted">No products match your filters.</p>`;
    return;
  }
  list.forEach((p) => grid.appendChild(productCard(p)));
}

function getFilters() {
  return {
    term: $("#searchInput").value.trim().toLowerCase(),
    category: $("#categorySelect").value,
    sort: $("#sortSelect").value,
  };
}

function applyFilters() {
  const { term, category, sort } = getFilters();
  let list = state.products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (term === "" || (p.name + " " + p.desc).toLowerCase().includes(term))
  );

  switch (sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      list.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      /* featured: leave as-is */ break;
  }
  renderProducts(list);
}

// --- Cart
function addToCart(id, qty = 1) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;

  if (!state.cart[id]) state.cart[id] = { product, qty: 0 };
  state.cart[id].qty += qty;

  saveCart();
  renderCart();
  openCart();
}

function changeQty(id, delta) {
  if (!state.cart[id]) return;
  state.cart[id].qty += delta;
  if (state.cart[id].qty <= 0) delete state.cart[id];
  saveCart();
  renderCart();
}

function removeItem(id) {
  delete state.cart[id];
  saveCart();
  renderCart();
}

function cartTotals() {
  const items = Object.values(state.cart);
  const subtotal = items.reduce((s, it) => s + it.product.price * it.qty, 0);
  const tax = subtotal * state.taxRate;
  const total = subtotal + tax;
  return {
    subtotal,
    tax,
    total,
    count: items.reduce((c, it) => c + it.qty, 0),
  };
}

function renderCart() {
  const wrap = $("#cartItems");
  wrap.innerHTML = "";
  const items = Object.values(state.cart);

  if (!items.length) {
    wrap.innerHTML = `<p class="muted">Your cart is empty. Add something you love ✨</p>`;
  } else {
    items.forEach(({ product, qty }) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
          <img src="${product.img}" alt="${product.name}">
          <div>
            <div class="name">${product.name}</div>
            <div class="meta">${product.category} · ${fmt(product.price)}</div>
            <div class="controls">
              <button class="icon-btn" aria-label="Decrease ${
                product.name
              } quantity">−</button>
              <span aria-live="polite">${qty}</span>
              <button class="icon-btn" aria-label="Increase ${
                product.name
              } quantity">+</button>
              <button class="icon-btn rm" aria-label="Remove ${
                product.name
              }">Remove</button>
            </div>
          </div>
          <div class="line">${fmt(product.price * qty)}</div>
        `;
      const [dec, , inc, rm] = row.querySelectorAll(".controls > *");
      dec.addEventListener("click", () => changeQty(product.id, -1));
      inc.addEventListener("click", () => changeQty(product.id, +1));
      rm.addEventListener("click", () => removeItem(product.id));
      wrap.appendChild(row);
    });
  }

  const { subtotal, tax, total, count } = cartTotals();
  $("#subtotal").textContent = fmt(subtotal);
  $("#tax").textContent = fmt(tax);
  $("#total").textContent = fmt(total);
  $("#cartCount").textContent = count;
}

// --- Drawer controls
function openCart() {
  $("#cartOverlay").hidden = false;
  $("#cartDrawer").hidden = false;
  requestAnimationFrame(() => $("#cartDrawer").classList.add("open"));
}
function closeCart() {
  $("#cartDrawer").classList.remove("open");
  setTimeout(() => {
    $("#cartOverlay").hidden = true;
    $("#cartDrawer").hidden = true;
  }, 250);
}

// --- Init
function bindEvents() {
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters();
  });
  $("#categorySelect").addEventListener("change", applyFilters);
  $("#sortSelect").addEventListener("change", applyFilters);
  $("#openCartBtn").addEventListener("click", openCart);
  $("#closeCartBtn").addEventListener("click", closeCart);
  $("#cartOverlay").addEventListener("click", closeCart);

  $("#checkoutBtn").addEventListener("click", () => {
    if (Object.keys(state.cart).length === 0) {
      alert("Your cart is empty.");
      return;
    }
    const { total } = cartTotals();
    alert(`Demo checkout complete! 🎉\n\nCharged: ${fmt(total)} (not really)`);
    state.cart = {};
    saveCart();
    renderCart();
    closeCart();
  });

  // Escape closes drawer
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#cartDrawer").hidden) closeCart();
  });
}

function main() {
  document.getElementById("year").textContent = new Date().getFullYear();
  renderCategoryOptions();
  loadCart();
  renderCart();
  applyFilters();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", main);
