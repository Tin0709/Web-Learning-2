import { createContext, useContext, useEffect, useReducer } from "react";

const CartContext = createContext();

const initial = () => {
  try {
    return JSON.parse(localStorage.getItem("cart_v1")) ?? { items: [] };
  } catch {
    return { items: [] };
  }
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const { id, product, qty } = action;
      const items = [...state.items];
      const i = items.findIndex((it) => it.id === id);
      if (i >= 0) items[i] = { ...items[i], qty: items[i].qty + qty };
      else items.push({ id, product, qty });
      return { items };
    }
    case "SET_QTY": {
      const items = state.items.map((it) =>
        it.id === action.id ? { ...it, qty: Math.max(1, action.qty) } : it
      );
      return { items };
    }
    case "REMOVE": {
      return { items: state.items.filter((it) => it.id !== action.id) };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial);

  useEffect(() => {
    localStorage.setItem("cart_v1", JSON.stringify(state));
  }, [state]);

  const add = (product, qty = 1) =>
    dispatch({ type: "ADD", id: product.id, product, qty });
  const setQty = (id, qty) => dispatch({ type: "SET_QTY", id, qty });
  const remove = (id) => dispatch({ type: "REMOVE", id });
  const clear = () => dispatch({ type: "CLEAR" });
  const count = state.items.reduce((n, it) => n + it.qty, 0);
  const subtotal = state.items.reduce(
    (s, it) => s + it.qty * it.product.price,
    0
  );

  return (
    <CartContext.Provider
      value={{ ...state, add, setQty, remove, clear, count, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
