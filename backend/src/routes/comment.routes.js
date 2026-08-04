import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import authorizeCardAction from "../middlewares/isAuthorizeCardAction.middleware.js";
import { addComment, getCommentsForCard, deleteComment } from "../controllers/comment.controller.js";

const router = express.Router();

router.post("/:cardId", isLoggedIn, authorizeCardAction("read"), addComment);
router.get("/:cardId", isLoggedIn, authorizeCardAction("read"), getCommentsForCard);
router.delete("/:commentId", isLoggedIn, deleteComment);

export default router;
