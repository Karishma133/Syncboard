# SyncBoard Backend — Bug Fixes & New Features

## 🔴 Critical bugs fixed (existing creation flows were broken)

1. **`createBoard` / `createList` / `createCard`** — the payload was built with keys
   `trimtitle` / `trimTitle` / `trimDescription`, but the Mongoose schemas expect
   `title` / `description`. Because `title` is `required: true`, every single board,
   list, and card creation request was failing with a validation error. Fixed to use
   the correct schema field names.
2. **`getAllCard`** — the error handler called `res.success(500)`, which doesn't exist
   on the Express response object and would itself throw. Changed to `res.status(500)`.
3. **`isAuthorizeBoardAction` middleware** — `const {boardId} = req.params || req.body.boardId`
   is a precedence bug: `req.params` is always a truthy object, so `req.body.boardId` was
   never actually read. Fixed to `req.params.boardId || req.body.boardId`.
4. **`isAuthorizeListAction` middleware** — the "not found" branches referenced
   `error.message` before `error` was ever defined (that variable only exists inside the
   `catch` block), which would throw a `ReferenceError` and crash the request instead of
   returning a clean 404. Removed the stray reference.
5. Route files (`user.routes.js`, `board.routes.js`, `list.routes.js`, `card.routes.js`)
   were referenced in `index.js` but weren't included in the source — they're written
   out fully now, wired to the corrected controllers/middlewares.

## ✨ New features added

| Feature | Why it matters |
|---|---|
| **Real-time sync (Socket.io)** | Board/list/card changes broadcast live to everyone viewing the board — this is the single biggest UX gap between a "CRUD app" and an actual Trello-style tool. |
| **Comments + @mentions on cards** | Team collaboration primitive; mentioned users get a notification. |
| **Labels/tags with colors** | Standard Kanban feature for categorizing cards. |
| **Checklists/subtasks inside cards** | High-demand feature for breaking down tasks. |
| **Assignees on cards** | Assign teammates to a card, they get notified. |
| **Notifications system** | Mentions, assignments, due-soon reminders — in-app inbox. |
| **Global search** | Full-text search across boards/cards a user has access to (Mongo text index). |
| **Activity log / audit trail** | Per-board history of who did what — important for accountability in team tools. |
| **Due-date reminder cron job** | Hourly job (`node-cron`) that notifies card owner/assignees when a due date is <24h away. |
| **Board favorites & archive** | Star boards, soft-archive instead of hard delete. |
| **Security hardening** | `helmet` for security headers, `express-rate-limit` on all `/api` routes. |

## New folders/files

```
src/
├── config/db.js                        (moved from utils/db.js)
├── jobs/dueDateReminder.job.js          (NEW)
├── models/
│   ├── Comment.model.js                 (NEW)
│   ├── Label.model.js                   (NEW)
│   ├── Notification.model.js            (NEW)
│   └── ActivityLog.model.js             (NEW)
├── controllers/
│   ├── comment.controller.js            (NEW)
│   ├── label.controller.js              (NEW)
│   ├── notification.controller.js       (NEW)
│   ├── search.controller.js             (NEW)
│   └── activity.controller.js           (NEW)
├── routes/
│   ├── comment.routes.js                (NEW)
│   ├── label.routes.js                  (NEW)
│   ├── notification.routes.js           (NEW)
│   ├── search.routes.js                 (NEW)
│   └── activity.routes.js               (NEW)
└── utils/
    ├── Permission.js                    (was referenced, now provided)
    ├── activityLogger.js                (NEW)
    ├── socket.js                        (NEW)
    └── asyncErrorHandler.js             (NEW, optional helper)
```

## New API endpoints (summary)

- `POST /api/v1/comments/:cardId` — add comment (supports `mentions: [userId]`)
- `GET /api/v1/comments/:cardId` — list comments
- `DELETE /api/v1/comments/:commentId` — delete own comment
- `POST /api/v1/labels/:boardId` — create label
- `GET /api/v1/labels/:boardId` — list labels
- `POST /api/v1/labels/attach/card` — attach label to card
- `GET /api/v1/notifications` — my notifications
- `PATCH /api/v1/notifications/:id/read` — mark one read
- `PATCH /api/v1/notifications/read-all` — mark all read
- `GET /api/v1/search?q=...` — global search
- `GET /api/v1/activity/:boardId` — board activity log
- `POST /api/v1/cards/:cardId/checklist` — add checklist item
- `PATCH /api/v1/cards/:cardId/checklist/:itemId` — toggle checklist item
- `PATCH /api/v1/cards/:cardId/assign` — assign/unassign member
- `PATCH /api/v1/boards/:boardId/favorite` — toggle favorite
- `PATCH /api/v1/boards/:boardId/archive` — archive/restore board

## Frontend integration note (Socket.io)

On the frontend, connect once and join the board room the user is viewing:

```js
import { io } from "socket.io-client";
const socket = io(import.meta.env.VITE_API_URL, { withCredentials: true });

socket.emit("joinBoard", boardId);
socket.on("cardCreated", ({ card }) => { /* update state */ });
socket.on("cardMoved", ({ updatedCards }) => { /* update state */ });
socket.on("commentAdded", ({ cardId, comment }) => { /* update state */ });
```

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```
