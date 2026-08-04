import { useEffect, useRef, useState } from "react";
import { getSocket } from "../lib/socket";
import { hashToIndex } from "./ui";

// Hex twins of the sync-* Tailwind colors, so cursor pins land on the same
// palette as everything else (avatars, labels, buttons).
const CURSOR_COLORS = ["#17C9B2", "#7C6CF6", "#FF7A59", "#F5B441"];
const STALE_MS = 8000;
const THROTTLE_MS = 45;

/**
 * Figma/Docs-style live cursors: broadcasts the local pointer position while
 * it moves over `trackRef`, and renders everyone else's pointer + name tag
 * on top of the page. Positions are stored in the tracked element's content
 * space (scrollLeft/scrollTop-aware) so cursors stay put relative to the
 * board's lists even as each viewer scrolls independently.
 */
export default function LiveCursors({ boardId, trackRef }) {
  const [cursors, setCursors] = useState({});
  const [, forceTick] = useState(0);
  const lastSent = useRef(0);

  useEffect(() => {
    const socket = getSocket();
    const onUpdate = (c) =>
      setCursors((prev) => ({ ...prev, [c.socketId]: { ...c, ts: Date.now() } }));
    const onLeave = ({ socketId }) =>
      setCursors((prev) => {
        if (!prev[socketId]) return prev;
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    socket.on("cursor:update", onUpdate);
    socket.on("cursor:leave", onLeave);
    return () => {
      socket.off("cursor:update", onUpdate);
      socket.off("cursor:leave", onLeave);
    };
  }, []);

  // sweep out cursors from people who went idle / closed the tab without a
  // clean disconnect event reaching us yet
  useEffect(() => {
    const id = setInterval(() => {
      setCursors((prev) => {
        const now = Date.now();
        let changed = false;
        const next = {};
        for (const [k, v] of Object.entries(prev)) {
          if (now - v.ts < STALE_MS) next[k] = v;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const socket = getSocket();

    const onMove = (e) => {
      const now = performance.now();
      if (now - lastSent.current < THROTTLE_MS) return;
      lastSent.current = now;
      const rect = el.getBoundingClientRect();
      socket.emit("cursor:move", {
        boardId,
        x: e.clientX - rect.left + el.scrollLeft,
        y: e.clientY - rect.top + el.scrollTop,
      });
    };
    const rerender = () => forceTick((t) => t + 1);

    el.addEventListener("mousemove", onMove);
    el.addEventListener("scroll", rerender);
    window.addEventListener("resize", rerender);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("scroll", rerender);
      window.removeEventListener("resize", rerender);
    };
  }, [boardId, trackRef]);

  const el = trackRef.current;
  const rect = el?.getBoundingClientRect();
  if (!rect) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {Object.entries(cursors).map(([id, c]) => {
        const left = rect.left + c.x - el.scrollLeft;
        const top = rect.top + c.y - el.scrollTop;
        const offscreen =
          left < rect.left - 24 || left > rect.right + 24 || top < rect.top - 24 || top > rect.bottom + 24;
        if (offscreen) return null;
        const color = CURSOR_COLORS[hashToIndex(c.name || id, CURSOR_COLORS.length)];
        return (
          <div
            key={id}
            className="absolute transition-[left,top] duration-75 ease-linear will-change-transform"
            style={{ left, top }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}>
              <path
                d="M2 1.5 15.5 8 9.3 9.4 6.8 15.8 2 1.5Z"
                fill={color}
                stroke="white"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="ml-3.5 -mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium text-white shadow"
              style={{ backgroundColor: color }}
            >
              {c.name || "Someone"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
