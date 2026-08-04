import { Draggable } from "@hello-pangea/dnd";
import { format, isPast } from "date-fns";
import { Avatar } from "./ui";

export default function CardPill({ card, index, onOpen }) {
  const doneCount = card.checklist?.filter((c) => c.isDone).length || 0;
  const totalCount = card.checklist?.length || 0;
  const overdue = card.dueDate && isPast(new Date(card.dueDate));

  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <button
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen(card)}
          className={`focus-ring mb-2 block w-full rounded-lg border border-ink/8 bg-white p-3 text-left shadow-sm transition ${
            snapshot.isDragging ? "rotate-1 shadow-pop" : "hover:border-ink/20"
          }`}
        >
          {card.labels?.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {card.labels.map((l) => (
                <span
                  key={l._id}
                  className="h-1.5 w-8 rounded-full"
                  style={{ backgroundColor: l.color }}
                  title={l.name}
                />
              ))}
            </div>
          )}
          <p className="text-sm text-ink/90">{card.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {card.dueDate && (
                <span
                  className={`font-mono text-[10px] ${
                    overdue ? "text-sync-coral" : "text-ink/40"
                  }`}
                >
                  {format(new Date(card.dueDate), "MMM d")}
                </span>
              )}
              {totalCount > 0 && (
                <span className="font-mono text-[10px] text-ink/40">
                  ☑ {doneCount}/{totalCount}
                </span>
              )}
            </div>
            {card.assignees?.length > 0 && (
              <div className="flex -space-x-1.5">
                {card.assignees.slice(0, 3).map((a) => (
                  <Avatar key={a._id} name={a.name} size={5} />
                ))}
              </div>
            )}
          </div>
        </button>
      )}
    </Draggable>
  );
}
