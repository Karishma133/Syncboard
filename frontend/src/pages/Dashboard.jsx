import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import Navbar from "../components/Navbar";
import { Button, EmptyState, Input, Spinner } from "../components/ui";
import { useToast } from "../context/ToastContext";

export default function Dashboard() {
  const [boards, setBoards] = useState(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const load = async () => {
    const { data } = await api.get("/boards");
    setBoards(data.boards);
  };

  useEffect(() => {
    load();
  }, []);

  // Command palette can deep-link here with ?new=1 to jump straight into
  // the "create board" form.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreating(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const createBoard = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/boards", { title: title.trim() });
      setTitle("");
      setCreating(false);
      await load();
      toast.success(`"${data.board?.title || title}" is ready to go.`);
    } catch (err) {
      const message = err.response?.data?.message || "Couldn't create board.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const toggleFavorite = async (id, e) => {
    e.preventDefault();
    const { data } = await api.patch(`/boards/${id}/favorite`);
    toast.info(data.isFavorite ? "Added to favorites" : "Removed from favorites");
    load();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">
              Your workspace
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold">Boards</h1>
          </div>
          <Button variant="accent" onClick={() => setCreating((c) => !c)}>
            + New board
          </Button>
        </div>

        {creating && (
          <form
            onSubmit={createBoard}
            className="mb-8 flex max-w-md flex-col gap-3 rounded-xl border border-ink/10 bg-paper p-4 shadow-card sm:flex-row sm:items-center"
          >
            <Input
              autoFocus
              placeholder="Board title, e.g. Q3 Launch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={busy}>
                {busy ? "Creating…" : "Create"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
        {error && <p className="mb-4 text-sm text-sync-coral">{error}</p>}

        {boards === null && (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        )}

        {boards?.length === 0 && (
          <EmptyState
            title="No boards yet"
            subtitle="Create your first board to start organizing lists and cards with your team, live."
            action={
              <Button variant="accent" className="mt-2" onClick={() => setCreating(true)}>
                + New board
              </Button>
            }
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards?.map((b) => (
            <Link
              key={b._id}
              to={`/boards/${b._id}`}
              className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br p-4 text-mist shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
              style={{
                backgroundImage: `linear-gradient(135deg, ${b.background || "#0079BF"}, #0B1720)`,
              }}
            >
              <div className="flex items-start justify-between">
                <p className="font-display text-base font-semibold leading-snug">{b.title}</p>
                <button
                  onClick={(e) => toggleFavorite(b._id, e)}
                  className="focus-ring shrink-0 rounded-md p-1 text-mist/70 hover:text-sync-amber"
                  aria-label="Toggle favorite"
                >
                  <StarIcon filled={b.favoritedBy?.length > 0} />
                </button>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-mist/50">
                {b.owner?.name ? `by ${b.owner.name}` : ""}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function StarIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l2.9 6.26 6.9.8-5.1 4.73 1.4 6.79L12 18.1l-6.1 3.48 1.4-6.79-5.1-4.73 6.9-.8L12 3z" strokeLinejoin="round" />
    </svg>
  );
}
