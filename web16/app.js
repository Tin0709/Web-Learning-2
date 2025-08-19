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
