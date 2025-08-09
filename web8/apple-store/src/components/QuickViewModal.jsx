import { useUI } from "../context/UIContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useState, useEffect, useRef } from "react";

export default function QuickViewModal() {
  const { quickView, closeQuickView } = useUI();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const dialogRef = useRef(null);

  // close when ESC pressed
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeQuickView();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeQuickView]);

  if (!quickView.show || !quickView.product) return null;
  const p = quickView.product;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      ref={dialogRef}
      style={{ background: "rgba(0,0,0,.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{p.name}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={closeQuickView}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row g-4">
              <div className="col-md-6">
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="img-fluid rounded"
                  />
                )}
              </div>
              <div className="col-md-6">
                <p className="text-muted">{p.category}</p>
                <p>{p.description}</p>
                <div className="d-flex align-items-center gap-3">
                  <div className="fs-5 mb-2">${p.price.toFixed(2)}</div>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(+e.target.value)}
                    className="form-control"
                    style={{ width: 100 }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-outline-secondary"
              onClick={closeQuickView}
            >
              Close
            </button>
            <button
              className="btn btn-dark"
              onClick={() => {
                add(p, qty);
                closeQuickView();
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
