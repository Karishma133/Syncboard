import { Server } from "socket.io";

let io;

// boardId -> Map<socketId, { userId, name, joinedAt }>
// In-memory "who's live on this board right now" presence registry, plus
// the live-cursor broadcast below it. Kept in memory (not the DB) on
// purpose: presence is inherently ephemeral, and this keeps it fast and
// avoids writing a single row of churn to Mongo for every mouse move.
const boardPresence = new Map();

const presenceList = (boardId) => {
  const room = boardPresence.get(boardId);
  if (!room) return [];
  const seen = new Map();
  for (const entry of room.values()) {
    // de-dupe by userId (same person open in two tabs still shows once)
    seen.set(entry.userId, entry);
  }
  return Array.from(seen.values()).map(({ userId, name }) => ({ userId, name }));
};

const broadcastPresence = (boardId) => {
  if (io) io.to(`board:${boardId}`).emit("presence:update", presenceList(boardId));
};

// call once from index.js after creating the http server
const initSocket = (server, corsOrigin) => {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // frontend calls socket.emit("joinBoard", { boardId, user }) when opening
    // a board (still accepts a bare boardId string for backwards compat).
    socket.on("joinBoard", (payload) => {
      const boardId = typeof payload === "string" ? payload : payload?.boardId;
      const user = typeof payload === "object" ? payload?.user : null;
      if (!boardId) return;

      socket.join(`board:${boardId}`);
      socket.data.boardId = boardId;
      socket.data.user = user || null;

      if (user) {
        if (!boardPresence.has(boardId)) boardPresence.set(boardId, new Map());
        boardPresence.get(boardId).set(socket.id, {
          userId: user.id || socket.id,
          name: user.name || "Someone",
          joinedAt: Date.now(),
        });
        broadcastPresence(boardId);
      }
    });

    socket.on("leaveBoard", (boardId) => {
      socket.leave(`board:${boardId}`);
      boardPresence.get(boardId)?.delete(socket.id);
      broadcastPresence(boardId);
      // tell everyone else this cursor is gone
      socket.to(`board:${boardId}`).emit("cursor:leave", { socketId: socket.id });
      socket.data.boardId = null;
    });

    // live multiplayer cursors: { boardId, x, y } where x/y are 0-100
    // percentages of the board's scrollable area, so they stay correct
    // across different viewport sizes.
    socket.on("cursor:move", ({ boardId, x, y }) => {
      if (!boardId || typeof x !== "number" || typeof y !== "number") return;
      socket.to(`board:${boardId}`).emit("cursor:update", {
        socketId: socket.id,
        userId: socket.data.user?.id || socket.id,
        name: socket.data.user?.name || "Someone",
        x,
        y,
      });
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected:", socket.id);
      const boardId = socket.data.boardId;
      if (boardId) {
        boardPresence.get(boardId)?.delete(socket.id);
        broadcastPresence(boardId);
        socket.to(`board:${boardId}`).emit("cursor:leave", { socketId: socket.id });
      }
    });
  });

  return io;
};

// use this from controllers to push live updates to everyone viewing a board
const emitToBoard = (boardId, event, payload) => {
  if (io) {
    io.to(`board:${boardId}`).emit(event, payload);
  }
};

export { initSocket, emitToBoard };
