import { useEffect } from "react";

export default function Modal({ onClose, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/50 px-4 py-10 backdrop-blur-sm">
      <div
        className={`absolute inset-0`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative w-full ${maxWidth} rounded-2xl bg-paper shadow-pop`}>
        {children}
      </div>
    </div>
  );
}
