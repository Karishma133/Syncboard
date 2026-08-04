import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { getMyNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", isLoggedIn, getMyNotifications);
router.patch("/:notificationId/read", isLoggedIn, markAsRead);
router.patch("/read-all", isLoggedIn, markAllAsRead);

export default router;
