import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

// Any component can trigger the palette with:
//   window.dispatchEvent(new Event("open-command-palette"))
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [boards, setBoards] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const keyHandler = (e) => {
      const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      } else if (!isTyping && !open && e.key === "?") {
        window.dispatchEvent(new Event("open-shortcuts"));
      }
    };
    window.addEventListener("open-command-palette", openHandler);
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("open-command-palette", openHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 10);
    api
      .get("/boards")
      .then(({ data }) => setBoards(data.boards || []))
      .catch(() => setBoards([]));
  }, [open]);

  const staticActions = useMemo(
    () => [
      { id: "dash", label: "Go to Dashboard", hint: "Navigate", run: () => navigate("/boards") },
      { id: "my-work", label: "My Work — everything assigned to you", hint: "Navigate", run: () => navigate("/my-work") },
      {
        id: "new-board",
        label: "Create new board",
        hint: "Action",
        run: () => navigate("/boards?new=1"),
      },
      {
        id: "shortcuts",
        label: "Keyboard shortcuts",
        hint: "Help",
        run: () => window.dispatchEvent(new Event("open-shortcuts")),
      },
      {
        id: "logout",
        label: "Log out",
        hint: "Account",
        run: async () => {
          await logout();
          navigate("/login");
        },
      },
    ],
    [navigate, logout]
  );

  const boardItems = boards.map((b) => ({
    id: `board-${b._id}`,
    label: b.title,
    hint: b.owner?.name ? `Board · by ${b.owner.name}` : "Board",
    run: () => navigate(`/boards/${b._id}`),
  }));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...boardItems, ...staticActions];
    if (!q) return all;
    return all.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, boardItems, staticActions]);

  useEffect(() => setActiveIndex(0), [query]);

  const runItem = (item) => {
    if (!item) return;
    item.run();
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runItem(results[activeIndex]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-ink/60 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg animate-palette-in overflow-hidden rounded-xl border border-white/10 bg-ink-700 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
          <span className="text-mist/40">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a board, or run a command…"
            className="w-full bg-transparent text-sm text-mist placeholder:text-mist/35 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-mist/40">
            esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-mist/40">No matches.</p>
          )}
          {results.map((item, i) => (
            <button
              key={item.id}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => runItem(item)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                i === activeIndex ? "bg-white/10 text-mist" : "text-mist/75"
              }`}
            >
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-mist/35">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
