import Board from "../models/Board.model.js";
import List from "../models/List.model.js";
import Card from "../models/Card.model.js";
import { hasPermission } from "../utils/Permission.js";

const authorizeCardAction = (action) => {
  return async (req, res, next) => {
    const { cardId } = req.params;
    const { id: userId } = req.user;
    try {
      const card = await Card.findById(cardId);
      if (!card) {
        return res.status(404).json({
          success: false,
          message: "Card not found"
        })
      }
      const list = await List.findById(card.listId);
      if (!list) {
        return res.status(404).json({
          success: false,
          message: "List not found"
        })
      }
      const board = await Board.findById(card.boardId);
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board not found"
        })
      }
      const allowed = hasPermission(board, userId, action);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized"
        })
      }
      req.card = card;
      req.list = list;
      req.board = board;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Authorization denied",
        error: error.message
      })
    }
  }
}
export default authorizeCardAction;
