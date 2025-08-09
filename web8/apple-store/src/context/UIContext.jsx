import { createContext, useContext, useState, useCallback } from "react";

const UIContext = createContext();

export function UIProvider({ children }) {
  const [toast, setToast] = useState({ show: false, title: "", body: "" });
  const [quickView, setQuickView] = useState({ show: false, product: null });

  const showToast = useCallback((title, body) => {
    setToast({ show: true, title, body });
    // auto-hide after 2.5s
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  }, []);

  const openQuickView = useCallback((product) => {
    setQuickView({ show: true, product });
  }, []);
  const closeQuickView = useCallback(
    () => setQuickView({ show: false, product: null }),
    []
  );

  return (
    <UIContext.Provider
      value={{ toast, showToast, quickView, openQuickView, closeQuickView }}
    >
      {children}
    </UIContext.Provider>
  );
}
export const useUI = () => useContext(UIContext);
