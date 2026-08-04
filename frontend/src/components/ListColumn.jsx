import { useEffect, useRef, useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import CardPill from "./CardPill";
import { Button, Input } from "./ui";

const SpeechRecognitionAPI =
  typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function ListColumn({
  list,
  index,
  cards,
  onOpenCard,
  onAddCard,
  onRenameList,
  onDeleteList,
  onSetWipLimit,
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [cardBusy, setCardBusy] = useState(false);
  const cardBusyRef = useRef(false); // blocks a second submit while the first is still in flight
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.title);
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitDraft, setLimitDraft] = useState(list.wipLimit ?? "");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const overLimit = list.wipLimit && cards.length > list.wipLimit;

  const submitCard = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    // FIX: same double-submit bug as list creation — without this guard, a
    // fast double-click / double-Enter fired two "add card" requests before
    // the form had a chance to close, creating two identical cards.
    if (cardBusyRef.current) return;
    cardBusyRef.current = true;
    setCardBusy(true);
    try {
      await onAddCard(list._id, newTitle.trim());
      setNewTitle("");
      setAdding(false);
    } finally {
      cardBusyRef.current = false;
      setCardBusy(false);
    }
  };

  const submitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft.trim() !== list.title) {
      onRenameList(list._id, titleDraft.trim());
    } else {
      setTitleDraft(list.title);
    }
  };

  const submitLimit = () => {
    setEditingLimit(false);
    const num = limitDraft === "" ? null : Math.max(1, parseInt(limitDraft, 10) || 1);
    onSetWipLimit(list._id, num);
  };

  // Voice-to-card: speak a task, it becomes the card title. Native browser
  // API, no backend or third-party service involved — Chrome/Edge only,
  // the mic button simply doesn't render where it's unsupported.
  const toggleListening = () => {
    if (!SpeechRecognitionAPI) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    setAdding(true);
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setNewTitle((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return (
    <Draggable draggableId={list._id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex w-72 shrink-0 flex-col rounded-xl p-2 transition ${
            overLimit ? "bg-sync-coral/10 ring-1 ring-sync-coral/40" : "bg-ink-800/[0.04]"
          }`}
        >
          <div
            {...provided.dragHandleProps}
            className="mb-1 flex items-center justify-between gap-2 px-1.5 py-1"
          >
            {editingTitle ? (
              <Input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={submitTitle}
                onKeyDown={(e) => e.key === "Enter" && submitTitle()}
                className="py-1 text-sm font-semibold"
              />
            ) : (
              <p
                onClick={() => setEditingTitle(true)}
                className="cursor-text font-display text-sm font-semibold text-ink"
              >
                {list.title}
              </p>
            )}
            <div className="flex items-center gap-1 text-ink/40">
              {editingLimit ? (
                <input
                  autoFocus
                  type="number"
                  min="1"
                  value={limitDraft}
                  onChange={(e) => setLimitDraft(e.target.value)}
                  onBlur={submitLimit}
                  onKeyDown={(e) => e.key === "Enter" && submitLimit()}
                  placeholder="limit"
                  className="w-12 rounded border border-ink/15 bg-white px-1 py-0.5 text-[10px] focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setEditingLimit(true)}
                  title={list.wipLimit ? "WIP limit — click to change" : "Click to set a WIP limit"}
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition hover:bg-ink/10 ${
                    overLimit ? "font-semibold text-sync-coral" : ""
                  }`}
                >
                  {list.wipLimit ? `${cards.length}/${list.wipLimit}` : cards.length}
                </button>
              )}
              <button
                onClick={() => onDeleteList(list._id)}
                className="focus-ring rounded p-1 hover:bg-ink/10 hover:text-sync-coral"
                aria-label="Delete list"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
          {overLimit && (
            <p className="mb-1 px-1.5 text-[10px] font-medium text-sync-coral">
              Over WIP limit — consider finishing something before starting more.
            </p>
          )}

          <Droppable droppableId={list._id} type="CARD">
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`min-h-[8px] flex-1 rounded-lg px-0.5 py-0.5 transition ${
                  dropSnapshot.isDraggingOver ? "bg-sync-teal/10" : ""
                }`}
              >
                {cards.map((card, i) => (
                  <CardPill key={card._id} card={card} index={i} onOpen={onOpenCard} />
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          {adding ? (
            <form onSubmit={submitCard} className="mt-1 space-y-2 px-0.5">
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  placeholder={listening ? "Listening…" : "Card title…"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
                  disabled={cardBusy}
                  className="flex-1"
                />
                {SpeechRecognitionAPI && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    title="Add a card by speaking"
                    aria-label="Voice to card"
                    disabled={cardBusy}
                    className={`focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                      listening
                        ? "animate-pulse bg-sync-coral text-white"
                        : "bg-ink/8 text-ink/50 hover:bg-ink/15 hover:text-ink"
                    }`}
                  >
                    <MicIcon />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="accent" className="px-3 py-1.5 text-xs" disabled={cardBusy}>
                  {cardBusy ? "Adding…" : "Add card"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2 py-1.5 text-xs"
                  disabled={cardBusy}
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="focus-ring mt-1 rounded-lg px-2 py-1.5 text-left text-xs text-ink/50 hover:bg-ink/8 hover:text-ink/80"
            >
              + Add a card
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" />
    </svg>
  );
}