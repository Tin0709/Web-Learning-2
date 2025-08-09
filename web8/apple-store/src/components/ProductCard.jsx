import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useUI } from "../context/UIContext.jsx";

export default function ProductCard({ p }) {
  const { add } = useCart();
  const { showToast, openQuickView } = useUI();
  const [adding, setAdding] = useState(false); // controls the temporary "Added" state

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    add(p, 1);
    showToast("Added to cart", `${p.name} has been added to your cart.`);

    // brief “Added” feedback then return to normal
    setTimeout(() => setAdding(false), 900);
  };

  return (
    <div className="card product h-100">
      <div className="media">
        {p.image && <img src={p.image} alt={p.name} />}
      </div>

      <div className="card-body">
        <span className="category">{p.category}</span>
        <h6 className="title">{p.name}</h6>

        <div className="divider" />

        <div className="bottom">
          <span className="price">${p.price.toFixed(2)}</span>

          <button
            className={`btn btn-primary-pill ${adding ? "btn-added" : ""}`}
            onClick={handleAdd}
            disabled={adding}
            aria-live="polite"
          >
            {adding ? "Added!" : "Add to Cart"}
          </button>
        </div>

        <div className="actions-secondary mt-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => openQuickView(p)}
          >
            Quick View
          </button>
          <Link className="btn btn-ghost btn-sm" to={`/products/${p.id}`}>
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
