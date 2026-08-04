import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import api from "../lib/api";

export default function ActivityPanel({ boardId, onClose }) {
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    api.get(`/activity/${boardId}`).then(({ data }) => setActivity(data.activity));
  }, [boardId]);

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-80 border-l border-ink/10 bg-paper shadow-pop">
      <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3.5">
        <p className="font-display text-sm font-semibold">Activity</p>
        <button onClick={onClose} className="focus-ring rounded p-1 text-ink/40 hover:text-ink">
          ✕
        </button>
      </div>
      <div className="h-[calc(100vh-53px)] overflow-y-auto px-4 py-3">
        {activity === null && <p className="text-sm text-ink/40">Loading…</p>}
        {activity?.length === 0 && <p className="text-sm text-ink/40">No activity yet.</p>}
        <div className="space-y-4">
          {activity?.map((a) => (
            <div key={a._id} className="text-sm">
              <p className="text-ink/80">
                <span className="font-medium">{a.user?.name || "Someone"}</span> {a.action}
                {a.meta?.title ? ` "${a.meta.title}"` : ""}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/35">
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
