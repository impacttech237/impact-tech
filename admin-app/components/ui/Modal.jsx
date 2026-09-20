import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "../../lib/icons";

export function Modal({ open, onClose, title, children, wide = false }) {
  const onKey = useCallback((e) => { if (e.key === "Escape") onClose(); }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onKey]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-[10vh]" onClick={onClose}>
      <div
        className={`relative w-full rounded-xl border border-adm-border bg-adm-surface shadow-xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-adm-border px-6 py-4">
          <h3 className="font-head text-lg font-semibold text-adm-text">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-adm-text-3 transition-colors hover:bg-adm-surface-2 hover:text-adm-text">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
