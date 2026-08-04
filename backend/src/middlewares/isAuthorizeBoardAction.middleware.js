import Board from "../models/Board.model.js";
import { hasPermission } from "../utils/Permission.js";

const authorizeBoardAction = (action) => {
  return async (req, res, next) => {
    try {
      // FIX: operator precedence bug - was `req.params || req.body.boardId`
      // which always evaluated to req.params (truthy object) and never
      // fell back to req.body.boardId
      const boardId = req.params.boardId || req.body.boardId;
      const { id: userId } = req.user;

      if (!boardId) {
        return res.status(400).json({
          status: false,
          message: "BoardId is required"
        })
      }
      const board = await Board.findById(boardId);
      if (!board) {
        return res.status(400).json({
          status: false,
          message: "Board not found"
        })
      }
      const allowed = hasPermission(board, userId, action);
      if (!allowed) {
        return res.status(403).json({
          status: false,
          message: "unauthorized"
        })
      }
      res.board = board;
      req.board = board; // FIX: controllers read req.board, keeping res.board too for backward compat
      next()
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Authorization failed",
        error: error.message
      })
    }
  }
}

export default authorizeBoardAction;
