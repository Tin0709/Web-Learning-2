import { useCart } from "../context/CartContext.jsx";

export default function Cart() {
  const { items, setQty, remove, clear, subtotal } = useCart();
  if (items.length === 0) return <p>Your cart is empty.</p>;

  return (
    <section>
      <h1 className="h3 mb-3">Your Cart</h1>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Product</th>
              <th style={{ width: 120 }}>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ id, product, qty }) => (
              <tr key={id}>
                <td className="d-flex align-items-center gap-3">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: 64, height: 64, objectFit: "cover" }}
                      className="rounded"
                    />
                  )}
                  <div>
                    <div className="fw-semibold">{product.name}</div>
                    <div className="text-muted small">{product.category}</div>
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(id, +e.target.value)}
                    className="form-control"
                  />
                </td>
                <td>${product.price.toFixed(2)}</td>
                <td>${(product.price * qty).toFixed(2)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-secondary" onClick={clear}>
          Clear Cart
        </button>
        <div className="fs-5">
          Subtotal: <strong>${subtotal.toFixed(2)}</strong>
        </div>
      </div>
    </section>
  );
}
