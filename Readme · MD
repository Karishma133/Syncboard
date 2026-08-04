<div align="center">

# 🗂️ SyncBoard

### A real-time, multiplayer Kanban board — built from scratch, MERN-style.

Trello-grade project management with **live cursors**, **instant sync across every viewer**, comments, checklists, notifications, and a full activity trail — all wired over Socket.IO.

[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](#)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)](#)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)](#)

</div>

---

## ✨ What is SyncBoard?

SyncBoard is a **Trello-style Kanban board**, but built to feel alive. Open the same board on two screens and you'll see teammates' cursors moving in real time, cards flying across lists the instant someone drags them, and a live presence bar showing exactly who's looking at the board right now.

It's a full-stack, production-shaped app: JWT auth with email verification, role-based board permissions, MongoDB with proper indexing, rate limiting, and a REST API covering boards, lists, cards, comments, labels, notifications, search, and activity logs.

---

## 🚀 Features

### 🔄 Real-time collaboration
- **Live board sync** — creating, editing, moving, or deleting a card/list broadcasts instantly to everyone viewing the board via Socket.IO
- **Live multiplayer cursors** — see teammates' mouse pointers move across the board in real time, Figma/Google Docs–style
- **Presence indicators** — a live "who's on this board right now" bar

### 📋 Core Kanban
- Boards → Lists → Cards, with smooth drag-and-drop reordering (`@hello-pangea/dnd`)
- Per-list **WIP limits** — a lightweight, real "stop starting, start finishing" nudge
- Board **backgrounds**, **favorites**, and soft **archive** (no accidental hard deletes)

### 🧩 Card power features
- **Assignees** — assign teammates to a card, they get notified
- **Checklists / subtasks** inside every card
- **Labels** with custom colors, attach/detach per card
- **Comments with @mentions** — mentioned teammates get an instant notification
- **Due dates** with an **hourly cron job** that reminds owners/assignees when something's due within 24h

### 🔔 Stay in the loop
- In-app **notification inbox** — mentions, assignments, due-soon reminders, board invites
- **Global full-text search** across every board and card you have access to (MongoDB text indexes)
- **Per-board activity log** — a full audit trail of who did what, and when

### ⚡ Power-user UX
- **Command palette** (`⌘K` / `Ctrl K`) for jumping between boards instantly
- Full **keyboard shortcuts** panel (`?`)
- Toast notifications, protected routes, and a polished custom design system

### 🔐 Auth & security
- JWT-based auth with **email verification** and **password reset** flows (via Mailtrap/Nodemailer)
- `helmet` security headers + `express-rate-limit` on every `/api` route
- Fine-grained, role-based **authorization middleware** for boards, lists, and cards

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Tailwind CSS, `@hello-pangea/dnd`, Axios, Socket.IO Client, `date-fns` |
| **Backend** | Node.js, Express 5, MongoDB + Mongoose, Socket.IO |
| **Auth** | JWT, bcrypt, cookie-based sessions |
| **Email** | Nodemailer (Mailtrap SMTP) |
| **Jobs** | `node-cron` for scheduled due-date reminders |
| **Security** | Helmet, express-rate-limit |
| **Uploads** | Multer |

---

## 📁 Project Structure

```
syncboard/
├── backend/
│   └── src/
│       ├── config/          # DB connection
│       ├── controllers/     # Route handlers (board, list, card, comment, label, etc.)
│       ├── jobs/            # Cron jobs (due-date reminders)
│       ├── middlewares/     # Auth + resource-level authorization
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express routers
│       └── utils/           # Socket.IO setup, permissions, helpers
│
└── frontend/
    └── src/
        ├── components/      # Board UI, modals, live cursors, command palette...
        ├── context/         # Auth + Toast context providers
        ├── lib/             # API client, socket client, confetti 🎉
        └── pages/           # Login, Register, Dashboard, Board, MyWork...
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js **18+**
- MongoDB (local or a connection URI like Atlas)
- A Mailtrap account (or any SMTP provider) for verification/reset emails

### 1. Clone & install

```bash
git clone <your-repo-url>
cd syncboard

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

**`backend/.env`**
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/syncboard
BASE_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here

MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USERNAME=your_mailtrap_username
MAILTRAP_PASSWORD=your_mailtrap_password
MAILTRAP_SENDEREMAIL=noreply@syncboard.com
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:3000
```

### 3. Run it

```bash
# Terminal 1 — backend (http://localhost:3000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open `http://localhost:5173`, register an account, verify your email via the Mailtrap inbox, and start creating boards. Open the same board in a second browser/tab to watch the real-time sync and live cursors in action. ✨

---

## 🔌 API Overview

All routes are prefixed with `/api/v1`.

| Resource | Endpoints |
|---|---|
| **Auth** | `POST /user/register` · `GET /user/verify/:token` · `POST /user/login` · `POST /user/logout` · `POST /user/forget-password` · `POST /user/resetpassword/:token` · `GET /user/me` |
| **Boards** | `POST /boards` · `GET /boards` · `GET /boards/:boardId` · `DELETE /boards/:boardId` · `POST/DELETE /boards/:boardId/members` · `PATCH /boards/:boardId/favorite` · `PATCH /boards/:boardId/archive` |
| **Lists** | `POST /lists/:boardId` · `GET /lists/:boardId` · `PATCH /lists/:listId` · `DELETE /lists/:listId` · `PATCH /lists/:listId/reorder` |
| **Cards** | `POST /cards/:listId` · `GET /cards/:listId` · `PATCH /cards/:cardId` · `DELETE /cards/:cardId` · `PATCH /cards/:cardId/move` · `POST /cards/:cardId/checklist` · `PATCH /cards/:cardId/checklist/:itemId` · `PATCH /cards/:cardId/assign` · `GET /cards/mine/all` |
| **Comments** | `POST /comments/:cardId` · `GET /comments/:cardId` · `DELETE /comments/:commentId` |
| **Labels** | `POST /labels/:boardId` · `GET /labels/:boardId` · `DELETE /labels/:boardId/:labelId` · `POST /labels/attach/card` |
| **Notifications** | `GET /notifications` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all` |
| **Search** | `GET /search?q=...` |
| **Activity** | `GET /activity/:boardId` |

### Real-time events (Socket.IO)

```js
import { io } from "socket.io-client";
const socket = io(import.meta.env.VITE_API_URL, { withCredentials: true });

socket.emit("joinBoard", { boardId, user });
socket.on("cardCreated", ({ card }) => { /* update state */ });
socket.on("cardMoved", ({ updatedCards }) => { /* update state */ });
socket.on("commentAdded", ({ cardId, comment }) => { /* update state */ });
socket.on("presence:update", (users) => { /* who's viewing right now */ });
socket.on("cursor:update", ({ userId, name, x, y }) => { /* live cursor */ });
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `⌘ K` / `Ctrl K` | Open the command palette |
| `↑` `↓` | Move through results |
| `↵` | Jump to a board / run the action |
| `?` | Show the shortcuts panel |
| `Esc` | Close any modal or panel |

---

## 🗺️ Roadmap Ideas

- [ ] File/image attachments on cards (Multer is already wired in)
- [ ] Board-level analytics (cycle time, WIP trends)
- [ ] Card templates
- [ ] Mobile-first board view
- [ ] Slack/Discord notification webhooks

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to fork the repo, create a branch, and open a PR.

## 📄 License

Licensed under the **ISC License**.

---

<div align="center">

Built with ❤️ by **Karishma**

</div>