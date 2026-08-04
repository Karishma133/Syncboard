import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import api from "../lib/api";

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get("/notifications");
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      /* not fatal for shell */
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openNotification = async (n) => {
    if (!n.isRead) {
      await api.patch(`/notifications/${n._id}/read`);
      setItems((prev) => prev.map((i) => (i._id === n._id ? { ...i, isRead: true } : i)));
      setUnread((u) => Math.max(0, u - 1));
    }
    if (n.board) navigate(`/boards/${n.board._id || n.board}`);
    setOpen(false);
  };

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnread(0);
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring relative rounded-lg p-2 text-mist/80 hover:bg-white/10"
        aria-label="Notifications"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sync-coral px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-80 overflow-hidden rounded-xl border border-ink/10 bg-paper text-ink shadow-pop">
          <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
            <p className="font-display text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-sync-teal hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-ink/45">You're all caught up.</p>
            )}
            {items.map((n) => (
              <button
                key={n._id}
                onClick={() => openNotification(n)}
                className={`block w-full border-b border-ink/5 px-4 py-3 text-left text-sm hover:bg-ink/5 ${
                  !n.isRead ? "bg-sync-teal/5" : ""
                }`}
              >
                <p className="text-ink/85">{n.message}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink/35">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
