import { useEffect, useState } from "react";
import Modal from "./Modal";

const SHORTCUTS = [
  { keys: ["⌘", "K"], desc: "Open the command palette" },
  { keys: ["↑", "↓"], desc: "Move through results" },
  { keys: ["↵"], desc: "Jump to a board / run the action" },
  { keys: ["?"], desc: "Show this shortcuts panel" },
  { keys: ["Esc"], desc: "Close any modal or panel" },
];

export default function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-shortcuts", handler);
    return () => window.removeEventListener("open-shortcuts", handler);
  }, []);

  if (!open) return null;

  return (
    <Modal onClose={() => setOpen(false)} maxWidth="max-w-sm">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-base font-semibold text-ink">Keyboard shortcuts</p>
          <button
            onClick={() => setOpen(false)}
            className="focus-ring rounded p-1 text-ink/40 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2.5">
          {SHORTCUTS.map((s) => (
            <div key={s.desc} className="flex items-center justify-between gap-4">
              <p className="text-sm text-ink/70">{s.desc}</p>
              <div className="flex shrink-0 gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded-md border border-ink/15 bg-ink/[0.03] px-1.5 py-0.5 font-mono text-[11px] text-ink/70"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
