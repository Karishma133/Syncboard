import List from "../models/List.model.js";
import { hasPermission } from "../utils/Permission.js";
import Board from "../models/Board.model.js";

const authorizeListAction = (action) => {
  return async (req, res, next) => {
    const { listId } = req.params;
    const { id: userId } = req.user;
    try {
      const list = await List.findById(listId);
      if (!list) {
        // FIX: `error` was referenced here before being defined -> ReferenceError crash
        return res.status(404).json({
          success: false,
          message: "List not found"
        })
      }
      const board = await Board.findById(list.board);
      if (!board) {
        // FIX: same bug as above
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
      req.list = list;
      req.board = board;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Authorization failed",
        error: error.message
      })
    }
  }
}
export default authorizeListAction;
