import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import authorizeBoardAction from "../middlewares/isAuthorizeBoardAction.middleware.js";
import authorizeListAction from "../middlewares/isAuthorizeListAction.middleware.js";
import {
  createList, updateList, deleteList, getAllList, reOrderList
} from "../controllers/list.controller.js";

const router = express.Router();

router.post("/:boardId", isLoggedIn, authorizeBoardAction("write"), createList);
router.get("/:boardId", isLoggedIn, authorizeBoardAction("read"), getAllList);
router.patch("/:listId", isLoggedIn, authorizeListAction("write"), updateList);
router.delete("/:listId", isLoggedIn, authorizeListAction("delete"), deleteList);
router.patch("/:listId/reorder", isLoggedIn, authorizeListAction("write"), reOrderList);

export default router;
