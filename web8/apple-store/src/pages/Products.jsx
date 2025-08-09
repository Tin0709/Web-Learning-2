import { useMemo, useState } from "react";
import data from "../data/products.json";
import ProductCard from "../components/ProductCard.jsx";

export default function Products() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("relevance");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(data.map((d) => d.category)))],
    []
  );

  const filtered = useMemo(() => {
    let list = data.filter(
      (d) =>
        (cat === "All" || d.category === cat) &&
        (q.trim() === "" || d.name.toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "priceAsc") list.sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") list.sort((a, b) => b.price - a.price);
    if (sort === "nameAsc") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [q, cat, sort]);

  return (
    <section>
      <h1 className="h3 mb-3">All Products</h1>

      {/* Controls */}
      <div className="row g-2 align-items-end mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label">Search</label>
          <input
            className="form-control"
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label">Sort</label>
          <select
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="priceAsc">Price ↑</option>
            <option value="priceDesc">Price ↓</option>
            <option value="nameAsc">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="row g-4">
        {filtered.map((p) => (
          <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={p.id}>
            <ProductCard p={p} />
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted">No products match your filters.</p>
        )}
      </div>
    </section>
  );
}
