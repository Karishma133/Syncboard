import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import authorizeBoardAction from "../middlewares/isAuthorizeBoardAction.middleware.js";
import {
  createLabel,
  getAllLabels,
  deleteLabel,
  attachLabelToCard,
  removeLabelFromCard
} from "../controllers/label.controller.js";

const router = express.Router();

router.post("/:boardId", isLoggedIn, authorizeBoardAction("write"), createLabel);
router.get("/:boardId", isLoggedIn, authorizeBoardAction("read"), getAllLabels);
router.delete("/:boardId/:labelId", isLoggedIn, authorizeBoardAction("write"), deleteLabel);
router.post("/attach/card", isLoggedIn, attachLabelToCard);
router.delete("/:cardId/:labelId", isLoggedIn, removeLabelFromCard);

export default router;
