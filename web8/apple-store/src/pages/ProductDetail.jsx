import { useParams } from "react-router-dom";
import data from "../data/products.json";
import { useCart } from "../context/CartContext.jsx";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const product = data.find((p) => String(p.id) === String(id));
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!product) return <p>Product not found.</p>;

  return (
    <section className="row g-4">
      <div className="col-md-6">
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="img-fluid rounded"
          />
        )}
      </div>
      <div className="col-md-6">
        <h1 className="h3">{product.name}</h1>
        <p className="text-muted">{product.category}</p>
        <p>{product.description}</p>
        <h2 className="h4">${product.price.toFixed(2)}</h2>
        <div className="d-flex align-items-center gap-2 mt-3">
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(+e.target.value)}
            className="form-control"
            style={{ width: 100 }}
          />
          <button className="btn btn-dark" onClick={() => add(product, qty)}>
            Add to Cart
          </button>
        </div>
      </div>
    </section>
  );
}
