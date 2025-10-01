/* --------------------------
   TinyShop – Mini E-Commerce
   -------------------------- */

// Demo catalog (add/remove freely)
const PRODUCTS = [
  {
    id: "p001",
    name: "Aurora Headphones",
    price: 79.99,
    category: "Audio",
    rating: 4.7,
    desc: "Wireless on-ear headphones with 30h battery life.",
    img: "https://images.unsplash.com/photo-1518441902110-56697e6d77c5?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p002",
    name: "Nimbus Keyboard",
    price: 59.5,
    category: "Accessories",
    rating: 4.4,
    desc: "Compact mechanical keyboard with hot-swap switches.",
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p003",
    name: "Pulse Smartwatch",
    price: 129.0,
    category: "Wearables",
    rating: 4.6,
    desc: "Fitness tracking, sleep insights & messages on wrist.",
    img: "https://images.unsplash.com/photo-1512446816042-444d641267f1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p004",
    name: "Voyager Backpack",
    price: 64.0,
    category: "Bags",
    rating: 4.5,
    desc: "Water-resistant 22L everyday carry with laptop sleeve.",
    img: "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p005",
    name: "Zen Mug (Set of 2)",
    price: 24.99,
    category: "Home",
    rating: 4.2,
    desc: "Double-wall ceramic mugs to keep drinks warm.",
    img: "https://images.unsplash.com/photo-1484902945377-bd2a42f1c7d1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p006",
    name: "Lumen Desk Lamp",
    price: 39.99,
    category: "Home",
    rating: 4.3,
    desc: "LED lamp with touch dimmer and flexible neck.",
    img: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p007",
    name: "Trail Sneakers",
    price: 84.5,
    category: "Shoes",
    rating: 4.1,
    desc: "Lightweight outdoor sneakers with excellent grip.",
    img: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p008",
    name: "Echo Bluetooth Speaker",
    price: 49.0,
    category: "Audio",
    rating: 4.4,
    desc: "Pocket-size speaker with punchy bass and USB-C.",
    img: "https://images.unsplash.com/photo-1550565118-3a14e8d03856?q=80&w=1200&auto=format&fit=crop",
  },
];

const TAX_RATE = 0.08; // 8% demo tax

// DOM
const productGrid = document.getElementById("productGrid");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

const cartButton = document.getElementById("cartButton");
const cartDrawer = document.getElementById("cartDrawer");
const closeCartBtn = document.getElementById("closeCart");
const overlay = document.getElementById("overlay");

const cartItemsEl = document.getElementById("cartItems");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const cartCountEl = document.getElementById("cartCount");

const checkoutBtn = document.getElementById("checkoutBtn");
const checkoutModal = document.getElementById("checkoutModal");
const checkoutForm = document.getElementById("checkoutForm");
const yearEl = document.getElementById("year");

// State
let favorites = load("favorites", []);
let cart = load("cart", {}); // { productId: qty }
let viewQuery = { q: "", category: "all", sort: "popularity" };

// Utils
const $ = (sel, parent = document) => parent.querySelector(sel);
const fmt = (n) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
function load(k, fallback) {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch {
    return fallback;
  }
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Init
init();

function init() {
  // Year
  yearEl.textContent = new Date().getFullYear();

  // Build category options
  const cats = Array.from(new Set(PRODUCTS.map((p) => p.category))).sort();
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categoryFilter.appendChild(opt);
  }

  // Listeners
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    viewQuery.q = searchInput.value.trim();
    renderProducts();
  });
  searchInput.addEventListener("input", (e) => {
    viewQuery.q = e.target.value.trim();
    renderProducts();
  });

  categoryFilter.addEventListener("change", (e) => {
    viewQuery.category = e.target.value;
    renderProducts();
  });
  sortSelect.addEventListener("change", (e) => {
    viewQuery.sort = e.target.value;
    renderProducts();
  });

  cartButton.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);
  overlay.addEventListener("click", () => {
    closeCart();
    if (checkoutModal.open) checkoutModal.close();
  });

  checkoutBtn.addEventListener("click", () => {
    if (Object.keys(cart).length === 0) {
      alert("Your cart is empty.");
      return;
    }
    checkoutModal.showModal();
  });

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault(); // for Safari behavior
  });

  $("#placeOrderBtn").addEventListener("click", (e) => {
    // Rudimentary validation
    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const address = $("#address").value.trim();
    const card = $("#card").value.replace(/\s+/g, "");
    if (!name || !email || !address || card.length < 12) {
      alert("Please fill in all fields with valid info.");
      return;
    }
    // Confirmation
    const total = calcTotals().total;
    alert(`Thanks, ${name}! Your demo order of ${fmt(total)} has been placed.`);
    cart = {};
    save("cart", cart);
    renderCart();
    checkoutModal.close();
    closeCart();
  });

  // First render
  renderProducts();
  renderCart();
}
/* ---------- Rendering Products ---------- */
function renderProducts() {
  const { q, category, sort } = viewQuery;

  let list = PRODUCTS.slice();

  if (category !== "all") list = list.filter((p) => p.category === category);

  if (q) {
    const s = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.desc.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s)
    );
  }

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
      list.sort((a, b) => b.rating - a.rating); // popularity proxy
  }

  productGrid.innerHTML = "";
  const tpl = document.getElementById("productCardTpl");

  if (list.length === 0) {
    productGrid.innerHTML = `<p class="muted">No products match your search.</p>`;
    return;
  }

  for (const p of list) {
    const node = tpl.content.firstElementChild.cloneNode(true);

    const img = $(".thumb", node);
    img.src = p.img;
    img.alt = p.name;

    $(".title", node).textContent = p.name;
    $(".desc", node).textContent = p.desc;
    $(".price", node).textContent = fmt(p.price);
    $(".chip", node).textContent = `${p.category} • ★ ${p.rating}`;

    const addBtn = $(".add", node);
    addBtn.addEventListener("click", () => {
      addToCart(p.id, 1);
      animateAddToCart(addBtn);
    });

    const favBtn = $(".fav", node);
    const favOn = favorites.includes(p.id);
    favBtn.textContent = favOn ? "♥" : "♡";
    favBtn.ariaLabel = favOn ? "Remove from favorites" : "Add to favorites";
    favBtn.addEventListener("click", () => toggleFavorite(p.id, favBtn));

    productGrid.appendChild(node);
  }
}
function animateAddToCart(btn) {
  btn.classList.add("success");
  btn.textContent = "Added ✓";
  setTimeout(() => {
    btn.classList.remove("success");
    btn.textContent = "Add to Cart";
  }, 900);
}

/* ---------- Favorites ---------- */
function toggleFavorite(id, btn) {
  const i = favorites.indexOf(id);
  if (i === -1) favorites.push(id);
  else favorites.splice(i, 1);
  save("favorites", favorites);
  btn.textContent = favorites.includes(id) ? "♥" : "♡";
}

/* ---------- Cart ---------- */
function addToCart(id, qty = 1) {
  cart[id] = (cart[id] ?? 0) + qty;
  cart[id] = clamp(cart[id], 1, 99);
  save("cart", cart);
  renderCart();
  openCart();
}
