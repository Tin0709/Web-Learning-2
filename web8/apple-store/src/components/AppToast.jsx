import { useUI } from "../context/UIContext.jsx";

export default function AppToast() {
  const { toast } = useUI();
  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1060 }}>
      <div
        className={`toast align-items-center ${toast.show ? "show" : "hide"}`}
        role="status"
      >
        <div className="toast-header">
          <strong className="me-auto">{toast.title || "Notice"}</strong>
          <small className="text-muted">now</small>
        </div>
        <div className="toast-body">{toast.body}</div>
      </div>
    </div>
  );
}
