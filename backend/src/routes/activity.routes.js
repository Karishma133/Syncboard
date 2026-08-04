import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import authorizeBoardAction from "../middlewares/isAuthorizeBoardAction.middleware.js";
import { getBoardActivity } from "../controllers/activity.controller.js";

const router = express.Router();

router.get("/:boardId", isLoggedIn, authorizeBoardAction("read"), getBoardActivity);

export default router;
