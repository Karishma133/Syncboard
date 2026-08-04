import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/search", { params: { q } });
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div ref={boxRef} className="relative w-full max-w-sm">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q && setOpen(true)}
        placeholder="Search boards & cards…"
        className="focus-ring w-full rounded-lg border border-mist/15 bg-white/10 px-3 py-1.5 text-sm text-mist placeholder:text-mist/40"
      />
      {open && results && (
        <div className="absolute left-0 right-0 top-10 z-30 max-h-96 overflow-auto rounded-xl border border-ink/10 bg-paper p-2 text-ink shadow-pop">
          {results.boards?.length === 0 && results.cards?.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-ink/50">No matches for "{q}"</p>
          )}
          {results.boards?.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/40">
                Boards
              </p>
              {results.boards.map((b) => (
                <button
                  key={b._id}
                  onClick={() => {
                    navigate(`/boards/${b._id}`);
                    setOpen(false);
                    setQ("");
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-ink/5"
                >
                  {b.title}
                </button>
              ))}
            </div>
          )}
          {results.cards?.length > 0 && (
            <div>
              <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/40">
                Cards
              </p>
              {results.cards.map((c) => (
                <button
                  key={c._id}
                  onClick={() => {
                    navigate(`/boards/${c.boardId?._id || c.boardId}`);
                    setOpen(false);
                    setQ("");
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-ink/5"
                >
                  <span className="font-medium">{c.title}</span>
                  <span className="ml-2 text-ink/40">
                    in {c.boardId?.title} · {c.listId?.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
