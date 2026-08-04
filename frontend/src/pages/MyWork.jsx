import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isPast, isToday, isWithinInterval, addDays, format } from "date-fns";
import api from "../lib/api";
import Navbar from "../components/Navbar";
import { Spinner } from "../components/ui";

// Cross-board "my tasks" view — every card assigned to you, from every
// board you're on, grouped by urgency. Trello itself doesn't have this;
// it's the kind of thing Jira/Asana/Linear call "My Work" or "My Issues".
export default function MyWork() {
  const [cards, setCards] = useState(null);

  useEffect(() => {
    api
      .get("/cards/mine/all")
      .then(({ data }) => setCards(data.cards))
      .catch(() => setCards([]));
  }, []);

  const groups = useMemo(() => {
    if (!cards) return null;
    const now = new Date();
    const buckets = { overdue: [], today: [], thisWeek: [], later: [], noDate: [] };
    for (const card of cards) {
      if (!card.dueDate) {
        buckets.noDate.push(card);
        continue;
      }
      const due = new Date(card.dueDate);
      if (isPast(due) && !isToday(due)) buckets.overdue.push(card);
      else if (isToday(due)) buckets.today.push(card);
      else if (isWithinInterval(due, { start: now, end: addDays(now, 7) })) buckets.thisWeek.push(card);
      else buckets.later.push(card);
    }
    return buckets;
  }, [cards]);

  const sections = groups && [
    { key: "overdue", label: "Overdue", accent: "text-sync-coral", dot: "bg-sync-coral" },
    { key: "today", label: "Due today", accent: "text-sync-amber", dot: "bg-sync-amber" },
    { key: "thisWeek", label: "This week", accent: "text-sync-violet", dot: "bg-sync-violet" },
    { key: "later", label: "Later", accent: "text-ink/60", dot: "bg-ink/30" },
    { key: "noDate", label: "No due date", accent: "text-ink/60", dot: "bg-ink/20" },
  ].filter((s) => groups[s.key].length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Across every board</p>
        <h1 className="mb-6 font-display text-2xl font-semibold text-ink">My Work</h1>

        {cards === null && (
          <div className="flex items-center gap-2 py-16 text-sm text-ink/50">
            <Spinner /> Gathering everything assigned to you…
          </div>
        )}

        {cards && cards.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink/15 py-16 text-center">
            <p className="font-display text-base font-semibold text-ink">Nothing assigned to you right now</p>
            <p className="mt-1 text-sm text-ink/50">
              Cards you're assigned across every board will show up here, sorted by urgency.
            </p>
          </div>
        )}

        <div className="space-y-7">
          {sections?.map((section) => (
            <div key={section.key}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${section.dot}`} />
                <p className={`font-mono text-[11px] font-semibold uppercase tracking-widest ${section.accent}`}>
                  {section.label} · {groups[section.key].length}
                </p>
              </div>
              <div className="space-y-1.5">
                {groups[section.key].map((card) => (
                  <MyWorkCard key={card._id} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function MyWorkCard({ card }) {
  const total = card.checklist?.length || 0;
  const done = card.checklist?.filter((c) => c.isDone).length || 0;

  return (
    <Link
      to={`/boards/${card.boardId?._id}?card=${card._id}`}
      className="focus-ring flex items-center gap-3 rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 transition hover:border-sync-teal/40 hover:shadow-soft"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{card.title}</p>
        <p className="mt-0.5 truncate text-xs text-ink/45">
          {card.boardId?.title || "Board"} <span className="mx-1">·</span> {card.listId?.title || "List"}
        </p>
      </div>
      {total > 0 && (
        <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[10px] text-ink/50">
          {done}/{total}
        </span>
      )}
      {card.dueDate && (
        <span className="shrink-0 font-mono text-[10px] text-ink/40">{format(new Date(card.dueDate), "MMM d")}</span>
      )}
    </Link>
  );
}
