import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import Navbar from "../components/Navbar";
import ListColumn from "../components/ListColumn";
import CardModal from "../components/CardModal";
import MembersModal from "../components/MembersModal";
import LabelsModal from "../components/LabelsModal";
import ActivityPanel from "../components/ActivityPanel";
import LiveCursors from "../components/LiveCursors";
import { Avatar, Button, Input, Spinner } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export default function Board() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState(null); // [{ ...list, cards: [] }]
  const [labels, setLabels] = useState([]);
  const [openCardId, setOpenCardId] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [addListBusy, setAddListBusy] = useState(false);
  const addListBusyRef = useRef(false); // extra sync guard against double form submits
  const [newListTitle, setNewListTitle] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [presence, setPresence] = useState([]); // [{ userId, name }] — live on this board right now
  const listsRef = useRef(lists);
  listsRef.current = lists;
  const boardAreaRef = useRef(null);

  const members = useMemo(() => {
    if (!board) return [];
    const all = [board.owner, ...(board.members || [])].filter(Boolean);
    return all;
  }, [board]);

  const loadAll = useCallback(async () => {
    const [{ data: boardData }, { data: listData }, { data: labelData }] = await Promise.all([
      api.get(`/boards/${boardId}`),
      api.get(`/lists/${boardId}`),
      api.get(`/labels/${boardId}`),
    ]);
    setBoard(boardData.board);
    setLabels(labelData.labels);
    const withCards = await Promise.all(
      listData.lists.map(async (l) => {
        const { data } = await api.get(`/cards/${l._id}`);
        return { ...l, cards: data.cards };
      })
    );
    setLists(withCards);
  }, [boardId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // deep-link support: /boards/:id?card=:cardId (used by the My Work page)
  // opens straight into that card instead of leaving the person to hunt
  // for it across lists.
  useEffect(() => {
    const cardId = searchParams.get("card");
    if (!cardId || !lists) return;
    const exists = lists.some((l) => l.cards.some((c) => c._id === cardId));
    if (exists) setOpenCardId(cardId);
    searchParams.delete("card");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists]);

  // --- realtime sync ---------------------------------------------------
  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socket.emit("joinBoard", { boardId, user: user ? { id: user.id, name: user.name } : null });

    const onPresence = (list) => setPresence(list);
    socket.on("presence:update", onPresence);

    const updateList = (updater) => setLists((prev) => (prev ? updater(prev) : prev));

    const onListCreated = ({ list }) =>
      updateList((prev) =>
        prev.some((l) => l._id === list._id) ? prev : [...prev, { ...list, cards: [] }].sort((a, b) => a.order - b.order)
      );
    const onListUpdated = ({ list }) =>
      updateList((prev) => prev.map((l) => (l._id === list._id ? { ...l, ...list } : l)));
    const onListDeleted = ({ listId }) => updateList((prev) => prev.filter((l) => l._id !== listId));
    const onListReordered = ({ list }) =>
      updateList((prev) =>
        prev.map((l) => (l._id === list._id ? { ...l, order: list.order } : l)).sort((a, b) => a.order - b.order)
      );

    const onCardCreated = ({ card }) =>
      updateList((prev) =>
        prev.map((l) =>
          l._id === card.listId ? { ...l, cards: l.cards.some((c) => c._id === card._id) ? l.cards : [...l.cards, card] } : l
        )
      );
    const onCardUpdated = ({ card }) =>
      updateList((prev) =>
        prev.map((l) =>
          l._id === card.listId
            ? { ...l, cards: l.cards.map((c) => (c._id === card._id ? card : c)) }
            : { ...l, cards: l.cards.filter((c) => c._id !== card._id) }
        )
      );
    const onCardDeleted = ({ cardId, listId }) =>
      updateList((prev) =>
        prev.map((l) => (l._id === listId ? { ...l, cards: l.cards.filter((c) => c._id !== cardId) } : l))
      );
    const onCardMoved = ({ sourceListId, destinationListId, updatedCards }) =>
      updateList((prev) =>
        prev.map((l) => {
          if (l._id === destinationListId) return { ...l, cards: updatedCards };
          if (l._id === sourceListId && sourceListId !== destinationListId) {
            const movedIds = new Set(updatedCards.map((c) => c._id));
            return { ...l, cards: l.cards.filter((c) => !movedIds.has(c._id)) };
          }
          return l;
        })
      );

    socket.on("listCreated", onListCreated);
    socket.on("listUpdated", onListUpdated);
    socket.on("listDeleted", onListDeleted);
    socket.on("listReordered", onListReordered);
    socket.on("cardCreated", onCardCreated);
    socket.on("cardUpdated", onCardUpdated);
    socket.on("cardDeleted", onCardDeleted);
    socket.on("cardMoved", onCardMoved);

    return () => {
      socket.emit("leaveBoard", boardId);
      socket.off("presence:update", onPresence);
      socket.off("listCreated", onListCreated);
      socket.off("listUpdated", onListUpdated);
      socket.off("listDeleted", onListDeleted);
      socket.off("listReordered", onListReordered);
      socket.off("cardCreated", onCardCreated);
      socket.off("cardUpdated", onCardUpdated);
      socket.off("cardDeleted", onCardDeleted);
      socket.off("cardMoved", onCardMoved);
      socket.disconnect();
    };
  }, [boardId]);

  // --- list & card actions ----------------------------------------------
  const addList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    // FIX: without this guard, a double-click / Enter-then-click, or the
    // request just being slow, fired two POSTs before the first response
    // came back to hide the form — creating two lists with the same title.
    if (addListBusyRef.current) return;
    addListBusyRef.current = true;
    setAddListBusy(true);
    try {
      const { data } = await api.post(`/lists/${boardId}`, { title: newListTitle.trim() });
      setLists((prev) => [...prev, { ...data.list, cards: [] }]);
      setNewListTitle("");
      setAddingList(false);
    } finally {
      addListBusyRef.current = false;
      setAddListBusy(false);
    }
  };

  const renameList = async (listId, title) => {
    const { data } = await api.patch(`/lists/${listId}`, { title });
    setLists((prev) => prev.map((l) => (l._id === listId ? { ...l, ...data.list } : l)));
  };

  const setListWipLimit = async (listId, wipLimit) => {
    const { data } = await api.patch(`/lists/${listId}`, { wipLimit });
    setLists((prev) => prev.map((l) => (l._id === listId ? { ...l, ...data.list } : l)));
    toast.info(wipLimit ? `WIP limit set to ${wipLimit}` : "WIP limit cleared");
  };

  const deleteList = async (listId) => {
    if (!confirm("Delete this list and all its cards?")) return;
    await api.delete(`/lists/${listId}`);
    setLists((prev) => prev.filter((l) => l._id !== listId));
    toast.info("List deleted");
  };

  const addCard = async (listId, title) => {
    const { data } = await api.post(`/cards/${listId}`, { title });
    setLists((prev) => prev.map((l) => (l._id === listId ? { ...l, cards: [...l.cards, data.card] } : l)));
  };

  const onCardUpdatedLocal = (card) => {
    setLists((prev) => prev.map((l) => (l._id === card.listId ? { ...l, cards: l.cards.map((c) => (c._id === card._id ? card : c)) } : l)));
  };

  const onCardDeletedLocal = (cardId) => {
    setLists((prev) => prev.map((l) => ({ ...l, cards: l.cards.filter((c) => c._id !== cardId) })));
  };

  // --- drag & drop --------------------------------------------------------
  const onDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === "COLUMN") {
      const current = [...listsRef.current];
      const [moved] = current.splice(source.index, 1);
      current.splice(destination.index, 0, moved);
      setLists(current);

      const preList = current[destination.index - 1];
      const nextList = current[destination.index + 1];
      try {
        await api.patch(`/lists/${draggableId}/reorder`, {
          preListId: preList?._id,
          nextListId: nextList?._id,
        });
      } catch {
        loadAll();
      }
      return;
    }

    // CARD drag
    const current = listsRef.current.map((l) => ({ ...l, cards: [...l.cards] }));
    const sourceList = current.find((l) => l._id === source.droppableId);
    const destList = current.find((l) => l._id === destination.droppableId);
    const [movedCard] = sourceList.cards.splice(source.index, 1);
    destList.cards.splice(destination.index, 0, { ...movedCard, listId: destList._id });
    setLists(current);

    try {
      await api.patch(`/cards/${draggableId}/move`, {
        sourceListId: source.droppableId,
        destinationListId: destination.droppableId,
        newPosition: destination.index,
      });
    } catch {
      loadAll();
    }
  };

  const openCard = lists?.flatMap((l) => l.cards).find((c) => c._id === openCardId);
  const openCardList = lists?.find((l) => l._id === openCard?.listId);

  const toggleFavorite = async () => {
    const { data } = await api.patch(`/boards/${boardId}/favorite`);
    setBoard((b) => ({ ...b, favoritedBy: data.isFavorite ? [...(b.favoritedBy || []), "me"] : [] }));
    toast.info(data.isFavorite ? "Added to favorites" : "Removed from favorites");
  };

  const archiveBoard = async () => {
    if (!confirm("Archive this board? You can restore it later from the API.")) return;
    await api.patch(`/boards/${boardId}/archive`);
    toast.success("Board archived");
    navigate("/boards");
  };

  const deleteBoard = async () => {
    if (!confirm("Permanently delete this board? This cannot be undone.")) return;
    await api.delete(`/boards/${boardId}`);
    toast.info("Board deleted");
    navigate("/boards");
  };

  if (!board || !lists) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#EFF2F1" }}>
      <Navbar />

      <div
        className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
        style={{ background: `linear-gradient(135deg, ${board.background || "#0079BF"}dd, #0B1720dd)` }}
      >
        <div className="flex items-center gap-3">
          <h1 className="font-display text-lg font-semibold text-mist">{board.title}</h1>
          <div className="flex -space-x-1.5">
            {members.map((m) => (
              <Avatar key={m._id} name={m.name} size={7} />
            ))}
          </div>
          {presence.length > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-1 pr-2.5"
              title={presence.map((p) => p.name).join(", ")}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-sync-teal" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sync-teal" />
              </span>
              <div className="flex -space-x-1.5">
                {presence.slice(0, 4).map((p) => (
                  <Avatar key={p.userId} name={p.name} size={5} />
                ))}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-mist/60">
                {presence.length} live now
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" className="text-mist hover:bg-white/10" onClick={toggleFavorite}>
            ★ Favorite
          </Button>
          <Button variant="ghost" className="text-mist hover:bg-white/10" onClick={() => setShowLabels(true)}>
            Labels
          </Button>
          <Button variant="ghost" className="text-mist hover:bg-white/10" onClick={() => setShowMembers(true)}>
            Members
          </Button>
          <Button variant="ghost" className="text-mist hover:bg-white/10" onClick={() => setShowActivity(true)}>
            Activity
          </Button>
          <Button variant="ghost" className="text-mist hover:bg-white/10" onClick={archiveBoard}>
            Archive
          </Button>
          <Button variant="ghost" className="text-sync-coral hover:bg-white/10" onClick={deleteBoard}>
            Delete
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={(el) => {
                provided.innerRef(el);
                boardAreaRef.current = el;
              }}
              {...provided.droppableProps}
              className="relative flex flex-1 items-start gap-3 overflow-x-auto px-4 py-4 sm:px-6"
            >
              {lists.map((list, i) => (
                <ListColumn
                  key={list._id}
                  list={list}
                  index={i}
                  cards={list.cards}
                  onOpenCard={(card) => setOpenCardId(card._id)}
                  onAddCard={addCard}
                  onRenameList={renameList}
                  onDeleteList={deleteList}
                  onSetWipLimit={setListWipLimit}
                />
              ))}
              {provided.placeholder}

              <div className="w-72 shrink-0">
                {addingList ? (
                  <form onSubmit={addList} className="rounded-xl bg-white p-2 shadow-card">
                    <Input
                      autoFocus
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="List title…"
                      disabled={addListBusy}
                      onKeyDown={(e) => e.key === "Escape" && setAddingList(false)}
                    />
                    <div className="mt-2 flex gap-2">
                      <Button type="submit" variant="accent" className="px-3 py-1.5 text-xs" disabled={addListBusy}>
                        {addListBusy ? "Adding…" : "Add list"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2 py-1.5 text-xs"
                        disabled={addListBusy}
                        onClick={() => setAddingList(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingList(true)}
                    className="focus-ring w-full rounded-xl bg-ink/[0.04] px-3 py-2.5 text-left text-sm text-ink/50 hover:bg-ink/[0.08] hover:text-ink/80"
                  >
                    + Add another list
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <LiveCursors boardId={boardId} trackRef={boardAreaRef} />

      {openCard && (
        <CardModal
          card={openCard}
          listTitle={openCardList?.title}
          members={members}
          labels={labels}
          onClose={() => setOpenCardId(null)}
          onUpdated={onCardUpdatedLocal}
          onDeleted={onCardDeletedLocal}
        />
      )}
      {showMembers && (
        <MembersModal board={board} onClose={() => setShowMembers(false)} onChanged={loadAll} />
      )}
      {showLabels && (
        <LabelsModal
          board={board}
          labels={labels}
          onClose={() => setShowLabels(false)}
          onChanged={async () => {
            const { data } = await api.get(`/labels/${boardId}`);
            setLabels(data.labels);
          }}
        />
      )}
      {showActivity && <ActivityPanel boardId={boardId} onClose={() => setShowActivity(false)} />}
    </div>
  );
}