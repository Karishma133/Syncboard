import dotenv from 'dotenv';
import express from "express";
import http from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import db from './config/db.js';
import cors from "cors";
import cookieParser from 'cookie-parser';
import { initSocket } from './utils/socket.js';
import startDueDateReminderJob from './jobs/dueDateReminder.job.js';

//importing all the routes
import router from "./routes/user.routes.js"
import boardRouter from './routes/board.routes.js';
import listRouter from './routes/list.routes.js';
import cardRouter from './routes/card.routes.js';
import commentRouter from './routes/comment.routes.js';   // NEW
import labelRouter from './routes/label.routes.js';       // NEW
import notificationRouter from './routes/notification.routes.js'; // NEW
import searchRouter from './routes/search.routes.js';     // NEW
import activityRouter from './routes/activity.routes.js'; // NEW

dotenv.config()
const app = express();
const server = http.createServer(app); // NEW: raw http server so socket.io can attach to it

app.use(helmet()); // NEW: sets sane security headers

app.use(cors({
  origin: process.env.BASE_URL,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // for the cors error solution due to front end and backend located in
// differnt place due to which error came

// NEW: basic rate limiting on all API routes to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" }
});
app.use("/api", limiter);

app.use(express.json()); //is a middleware in Express.js used to parse JSON data sent in
// the request body.
app.use(express.urlencoded({ extended: true })); //is a middleware in Express.js used to
// parse URL-encoded data sent from forms.
app.use(cookieParser());

const port = process.env.PORT || 3000;

//connection to db
db();

// NEW: socket.io for real-time board updates (live card/list changes across users)
initSocket(server, process.env.BASE_URL);

// NEW: hourly cron job for due-date reminder notifications
startDueDateReminderJob();

app.use("/api/v1/user", router);
app.use("/api/v1/boards", boardRouter);
app.use("/api/v1/lists", listRouter);
app.use("/api/v1/cards", cardRouter);
app.use("/api/v1/comments", commentRouter);       // NEW
app.use("/api/v1/labels", labelRouter);           // NEW
app.use("/api/v1/notifications", notificationRouter); // NEW
app.use("/api/v1/search", searchRouter);          // NEW
app.use("/api/v1/activity", activityRouter);      // NEW

// IMPORTANT: use server.listen (not app.listen) so socket.io works correctly
server.listen(port, () => {
  console.log(`app listning to port http://localhost:${port}`);
})
