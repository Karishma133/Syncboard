import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import authorizeListAction from "../middlewares/isAuthorizeListAction.middleware.js";
import authorizeCardAction from "../middlewares/isAuthorizeCardAction.middleware.js";
import {
  createCard, getAllCard, updateCard, deleteCard, moveCard,
  toggleChecklistItem, addChecklistItem, assignMember, getMyCards
} from "../controllers/card.controller.js";

const router = express.Router();

// NOTE: must come before "/:listId" — otherwise Express would treat
// "mine" as a :listId value and this route would never be reached.
router.get("/mine/all", isLoggedIn, getMyCards);

router.post("/:listId", isLoggedIn, authorizeListAction("write"), createCard);
router.get("/:listId", isLoggedIn, authorizeListAction("read"), getAllCard);
router.patch("/:cardId", isLoggedIn, authorizeCardAction("write"), updateCard);
router.delete("/:cardId", isLoggedIn, authorizeCardAction("delete"), deleteCard);
router.patch("/:cardId/move", isLoggedIn, authorizeCardAction("write"), moveCard);
router.post("/:cardId/checklist", isLoggedIn, authorizeCardAction("write"), addChecklistItem);
router.patch("/:cardId/checklist/:itemId", isLoggedIn, authorizeCardAction("write"), toggleChecklistItem);
router.patch("/:cardId/assign", isLoggedIn, authorizeCardAction("write"), assignMember);

export default router;
