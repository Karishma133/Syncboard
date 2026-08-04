import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import authorizeBoardAction from "../middlewares/isAuthorizeBoardAction.middleware.js";
import {
  createBoard, getAllBoard, getSingleBoard, deleteBoard,
  addMember, removeMember, getAllMember, toggleFavorite, archiveBoard
} from "../controllers/board.controller.js";

const router = express.Router();

router.post("/", isLoggedIn, createBoard);
router.get("/", isLoggedIn, getAllBoard);
router.get("/:boardId", isLoggedIn, authorizeBoardAction("read"), getSingleBoard);
router.delete("/:boardId", isLoggedIn, authorizeBoardAction("delete"), deleteBoard);
router.post("/:boardId/members", isLoggedIn, authorizeBoardAction("manage-members"), addMember);
router.delete("/:boardId/members/:memberId", isLoggedIn, authorizeBoardAction("manage-members"), removeMember);
router.get("/:boardId/members", isLoggedIn, authorizeBoardAction("read"), getAllMember);
router.patch("/:boardId/favorite", isLoggedIn, authorizeBoardAction("read"), toggleFavorite);
router.patch("/:boardId/archive", isLoggedIn, authorizeBoardAction("delete"), archiveBoard);

export default router;
