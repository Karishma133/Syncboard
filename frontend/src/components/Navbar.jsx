import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";
import NotificationsPanel from "./NotificationsPanel";
import { Avatar } from "./ui";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/boards" className="flex shrink-0 items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-sync-teal" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sync-teal" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-mist">
            Sync<span className="text-sync-teal">Board</span>
          </span>
        </Link>

        <Link
          to="/my-work"
          className="focus-ring hidden shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-mist/60 transition hover:bg-white/10 hover:text-mist sm:flex"
        >
          My Work
        </Link>

        <div className="hidden flex-1 justify-center sm:flex">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="focus-ring hidden items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-mist/50 transition hover:border-white/20 hover:text-mist/80 sm:flex"
          >
            <span>Quick jump</span>
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-[10px]">⌘K</kbd>
          </button>
          <NotificationsPanel />
          <div className="mx-1 h-6 w-px bg-white/10" />
          <Avatar name={user?.name || "?"} />
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="focus-ring rounded-lg px-2.5 py-1.5 text-xs text-mist/60 hover:bg-white/10 hover:text-mist"
          >
            Log out
          </button>
        </div>
      </div>
      <div className="px-4 pb-3 sm:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
