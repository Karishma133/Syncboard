import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: "✓",
  error: "✕",
  info: "i",
};

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 3200) => {
      const id = ++idSeq;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (msg, d) => push(msg, "success", d),
    error: (msg, d) => push(msg, "error", d),
    info: (msg, d) => push(msg, "info", d),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-[min(92vw,340px)] items-start gap-2.5 rounded-xl border border-white/10 bg-ink px-3.5 py-3 shadow-pop animate-toast-in"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                t.type === "success"
                  ? "bg-sync-teal/20 text-sync-teal"
                  : t.type === "error"
                  ? "bg-sync-coral/20 text-sync-coral"
                  : "bg-sync-violet/20 text-sync-violet"
              }`}
            >
              {ICONS[t.type]}
            </span>
            <p className="flex-1 pt-0.5 text-sm leading-snug text-mist/90">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="focus-ring shrink-0 rounded p-0.5 text-mist/40 hover:text-mist"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
