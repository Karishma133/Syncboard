import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import api from "../lib/api";
import Modal from "./Modal";
import { Avatar, Button, Input, Textarea } from "./ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fireConfetti } from "../lib/confetti";

export default function CardModal({ card, listTitle, members, labels, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const toast = useToast();
  const wasComplete = useRef(null);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.slice(0, 10) : "");
  const [savingField, setSavingField] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [mentionIds, setMentionIds] = useState([]); // user ids picked via @mention
  const [mentionQuery, setMentionQuery] = useState(null); // null = dropdown hidden
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showAssignPicker, setShowAssignPicker] = useState(false);

  useEffect(() => {
    api.get(`/comments/${card._id}`).then(({ data }) => setComments(data.comments));
  }, [card._id]);

  const patchCard = async (payload, immediate) => {
    setSavingField(Object.keys(payload)[0]);
    try {
      const { data } = await api.patch(`/cards/${card._id}`, payload);
      onUpdated(data.card);
    } finally {
      setSavingField("");
    }
    return immediate;
  };

  const saveTitle = () => title.trim() && title !== card.title && patchCard({ title: title.trim() });
  const saveDescription = () => description !== (card.description || "") && patchCard({ description });
  const saveDueDate = (val) => {
    setDueDate(val);
    patchCard({ dueDate: val || null });
  };

  const deleteCard = async () => {
    if (!confirm("Delete this card?")) return;
    await api.delete(`/cards/${card._id}`);
    onDeleted(card._id);
    onClose();
    toast.info("Card deleted");
  };

  const addChecklistItem = async (e) => {
    e.preventDefault();
    if (!checklistText.trim()) return;
    const { data } = await api.post(`/cards/${card._id}/checklist`, { text: checklistText.trim() });
    onUpdated(data.card);
    setChecklistText("");
  };

  const toggleChecklistItem = async (itemId) => {
    const { data } = await api.patch(`/cards/${card._id}/checklist/${itemId}`);
    onUpdated(data.card);
  };

  const toggleAssignee = async (memberId) => {
    const { data } = await api.patch(`/cards/${card._id}/assign`, { memberId });
    onUpdated(data.card);
  };

  const toggleLabel = async (label) => {
    const has = card.labels?.some((l) => l._id === label._id);
    if (has) {
      const { data } = await api.delete(`/labels/${card._id}/${label._id}`);
      onUpdated(data.card);
    } else {
      const { data } = await api.post(`/labels/attach/card`, { cardId: card._id, labelId: label._id });
      onUpdated(data.card);
    }
  };

  // @mentions: the backend already turns `mentions: [userId]` into a
  // notification for that person (see comment.controller.js) — this UI was
  // the missing half. Typing "@" opens a filtered dropdown of board members;
  // picking one inserts their name and remembers their id to send along.
  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentText(val);
    const match = val.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const mentionCandidates =
    mentionQuery !== null
      ? (members || []).filter(
          (m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()) && !mentionIds.includes(m._id)
        )
      : [];

  const pickMention = (member) => {
    setCommentText((prev) => prev.replace(/(?:^|\s)@([a-zA-Z0-9._-]*)$/, (m) => `${m.startsWith(" ") ? " " : ""}@${member.name} `));
    setMentionIds((prev) => [...prev, member._id]);
    setMentionQuery(null);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const { data } = await api.post(`/comments/${card._id}`, {
      text: commentText.trim(),
      mentions: mentionIds,
    });
    setComments((prev) => [data.comment, ...prev]);
    setCommentText("");
    setMentionIds([]);
    setMentionQuery(null);
    toast.success(mentionIds.length ? "Comment posted — mentioned teammates will be notified" : "Comment posted");
  };

  const deleteComment = async (id) => {
    await api.delete(`/comments/${id}`);
    setComments((prev) => prev.filter((c) => c._id !== id));
  };

  const totalChecklist = card.checklist?.length || 0;
  const doneCount = card.checklist?.filter((c) => c.isDone).length || 0;
  const allDone = totalChecklist > 0 && doneCount === totalChecklist;

  useEffect(() => {
    if (totalChecklist === 0) {
      wasComplete.current = null;
      return;
    }
    if (wasComplete.current === false && allDone) {
      fireConfetti();
      toast.success("Checklist complete — nice work! 🎉");
    }
    wasComplete.current = allDone;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, totalChecklist]);

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <div className="mb-1 flex items-start justify-between gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="focus-ring -ml-1 w-full rounded-lg px-1 py-0.5 font-display text-lg font-semibold hover:bg-ink/5"
          />
          <button onClick={onClose} className="focus-ring shrink-0 rounded p-1 text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>
        <p className="mb-5 font-mono text-[11px] uppercase tracking-widest text-ink/40">
          in list {listTitle}
        </p>

        {/* labels */}
        <Section title="Labels">
          <div className="flex flex-wrap items-center gap-1.5">
            {card.labels?.map((l) => (
              <button
                key={l._id}
                onClick={() => setShowLabelPicker((s) => !s)}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </button>
            ))}
            <button
              onClick={() => setShowLabelPicker((s) => !s)}
              className="focus-ring rounded-md border border-dashed border-ink/20 px-2 py-1 text-xs text-ink/50 hover:border-ink/40"
            >
              + Label
            </button>
          </div>
          {showLabelPicker && (
            <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-ink/10 p-2">
              {labels.map((l) => {
                const active = card.labels?.some((cl) => cl._id === l._id);
                return (
                  <button
                    key={l._id}
                    onClick={() => toggleLabel(l)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium text-white ${
                      active ? "ring-2 ring-ink ring-offset-1" : "opacity-70"
                    }`}
                    style={{ backgroundColor: l.color }}
                  >
                    {l.name}
                  </button>
                );
              })}
              {labels.length === 0 && (
                <p className="px-1 py-1 text-xs text-ink/40">No labels on this board yet.</p>
              )}
            </div>
          )}
        </Section>

        {/* assignees */}
        <Section title="Assignees">
          <div className="flex flex-wrap items-center gap-1.5">
            {card.assignees?.map((a) => (
              <div
                key={a._id}
                className="flex items-center gap-1.5 rounded-full bg-ink/5 py-1 pl-1 pr-2.5"
              >
                <Avatar name={a.name} size={6} />
                <span className="text-xs">{a.name}</span>
              </div>
            ))}
            <button
              onClick={() => setShowAssignPicker((s) => !s)}
              className="focus-ring rounded-md border border-dashed border-ink/20 px-2 py-1 text-xs text-ink/50 hover:border-ink/40"
            >
              + Assign
            </button>
          </div>
          {showAssignPicker && (
            <div className="mt-2 space-y-1 rounded-lg border border-ink/10 p-2">
              {members.map((m) => {
                const active = card.assignees?.some((a) => a._id === m._id);
                return (
                  <button
                    key={m._id}
                    onClick={() => toggleAssignee(m._id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-ink/5 ${
                      active ? "bg-sync-teal/10" : ""
                    }`}
                  >
                    <Avatar name={m.name} size={6} />
                    {m.name}
                    {active && <span className="ml-auto text-sync-teal">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {/* due date */}
        <Section title="Due date">
          <Input type="date" value={dueDate} onChange={(e) => saveDueDate(e.target.value)} className="max-w-[180px]" />
        </Section>

        {/* description */}
        <Section title="Description">
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
            placeholder="Add a more detailed description…"
          />
          {savingField === "description" && <p className="mt-1 text-xs text-ink/40">Saving…</p>}
        </Section>

        {/* checklist */}
        <Section title={`Checklist${totalChecklist ? ` · ${doneCount}/${totalChecklist}` : ""}`}>
          {totalChecklist > 0 && (
            <div className="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allDone ? "bg-sync-teal" : "bg-sync-violet"
                }`}
                style={{ width: `${Math.round((doneCount / totalChecklist) * 100)}%` }}
              />
            </div>
          )}
          <div className="space-y-1.5">
            {card.checklist?.map((item) => (
              <label key={item._id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.isDone}
                  onChange={() => toggleChecklistItem(item._id)}
                  className="h-4 w-4 rounded accent-sync-teal"
                />
                <span className={item.isDone ? "text-ink/40 line-through" : "text-ink/85"}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
          <form onSubmit={addChecklistItem} className="mt-2 flex gap-2">
            <Input
              value={checklistText}
              onChange={(e) => setChecklistText(e.target.value)}
              placeholder="Add a checklist item…"
            />
            <Button type="submit" variant="ghost" className="border border-ink/12">
              Add
            </Button>
          </form>
        </Section>

        {/* comments */}
        <Section title="Comments">
          <form onSubmit={submitComment} className="relative mb-3 flex gap-2">
            <div className="relative flex-1">
              <Input
                value={commentText}
                onChange={handleCommentChange}
                onKeyDown={(e) => e.key === "Escape" && setMentionQuery(null)}
                placeholder="Write a comment… (@ to mention)"
              />
              {mentionQuery !== null && mentionCandidates.length > 0 && (
                <div className="absolute bottom-full left-0 z-10 mb-1 w-56 overflow-hidden rounded-lg border border-ink/10 bg-white py-1 shadow-pop">
                  {mentionCandidates.slice(0, 6).map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => pickMention(m)}
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm text-ink/80 hover:bg-ink/5"
                    >
                      <Avatar name={m.name} size={5} />
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" variant="accent">
              Post
            </Button>
          </form>
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c._id} className="flex gap-2.5">
                <Avatar name={c.author?.name || "?"} size={7} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink/90">{c.author?.name}</p>
                    <p className="font-mono text-[10px] text-ink/35">
                      {format(new Date(c.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <p className="text-sm text-ink/75">{renderCommentText(c.text, members)}</p>
                </div>
                {c.author?._id === user?.id && (
                  <button
                    onClick={() => deleteComment(c._id)}
                    className="self-start text-xs text-ink/30 hover:text-sync-coral"
                  >
                    delete
                  </button>
                )}
              </div>
            ))}
            {comments.length === 0 && <p className="text-sm text-ink/40">No comments yet.</p>}
          </div>
        </Section>

        <div className="mt-6 border-t border-ink/8 pt-4">
          <Button variant="danger" onClick={deleteCard}>
            Delete card
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink/40">{title}</p>
      {children}
    </div>
  );
}

// Highlights "@FullName" for any current board member found in the text.
// Matched against live board membership rather than a stored id list, so it
// stays correct even if someone's name changes later.
function renderCommentText(text, members) {
  const names = (members || [])
    .map((m) => m.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!names.length) return text;

  const re = new RegExp(`@(${names.join("|")})`, "g");
  const parts = [];
  let last = 0;
  let match;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span key={match.index} className="font-medium text-sync-violet">
        @{match[1]}
      </span>
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}
