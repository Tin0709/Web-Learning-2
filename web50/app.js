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
