import List from "../models/List.model.js";
import logActivity from "../utils/activityLogger.js";
import { emitToBoard } from "../utils/socket.js";

const createList = async (req, res) => {
  const { title } = req.body;
  const board = req.board
  const trimTitle = title?.trim();
  if (!trimTitle) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    })
  }
  try {
    //count the document list inside the board document
    const count = await List.countDocuments({
      board: board._id
    })
    const lastList = await List.findOne({ board: board._id })
      .sort({ order: -1 });
    const newOrder = lastList ? lastList.order + 100 : 0;

    const list = await List.create({
      title: trimTitle, // FIX: was `trimTitle` used as key instead of `title`,
                         // schema requires `title` -> list creation always failed
      board: board._id,
      order: newOrder
    })
    if (!list) {
      return res.status(400).json({
        success: false,
        message: "unable to create list"
      })
    }

    await logActivity({
      boardId: board._id,
      userId: req.user.id,
      action: "created a list",
      entityType: "list",
      entityId: list._id,
      meta: { title: list.title }
    });

    emitToBoard(board._id.toString(), "listCreated", { list });

    res.status(201).json({
      success: true,
      message: "list created successfully",
      list,
      count
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "list creation failed",
      error: error.message
    })
  }
};

const updateList = async (req, res) => {
  const { title, wipLimit } = req.body;
  const list = req.list;
  const trimTitle = title?.trim();

  // title stays required when it's part of the payload (renaming), but a
  // wipLimit-only update (from the WIP-limit popover) shouldn't be forced
  // to also carry a title.
  if (title !== undefined && !trimTitle) {
    return res.status(400).json({
      success: false,
      message: " Title is required"
    })
  }
  try {
    if (trimTitle) req.list.title = trimTitle;
    if (wipLimit !== undefined) {
      req.list.wipLimit = wipLimit === null || wipLimit === "" ? null : Number(wipLimit);
    }
    await req.list.save();
    emitToBoard(req.board._id.toString(), "listUpdated", { list: req.list });
    res.status(200).json({
      success: true,
      message: "list updated successfully",
      list: req.list
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "list update failed ",
      error: error.message
    })
  }
};

const deleteList = async (req, res) => {
  const list = req.list;
  try {
    await list.deleteOne();
    emitToBoard(req.board._id.toString(), "listDeleted", { listId: list._id });
    res.status(200).json({
      success: true,
      message: "list deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "list delete failed server error",
      error: error.message
    })
  }
};

const getAllList = async (req, res) => {
  const board = req.board;
  try {
    const lists = await List.find({
      board: board._id
    }).sort({ order: 1 })
    res.status(200).json({
      success: true,
      message: "List featched successfully",
      lists
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "featched list failed",
      error: error.message
    })
  }
};

const reOrderList = async (req, res) => {
  const { listId } = req.params;
  const { preListId, nextListId } = req.body;
  try {
    if (!listId) {
      return res.status(400).json({
        success: false,
        message: "List id is required"
      });
    }
    if (!preListId && !nextListId) {
      return res.status(400).json({
        success: false,
        message: "At least one adjacent list id is required"
      });
    }
    if (preListId && preListId === listId) {
      return res.status(400).json({
        success: false,
        message: "Previous list cannot be the same as current list"
      });
    }
    if (nextListId && nextListId === listId) {
      return res.status(400).json({
        success: false,
        message: "Next list cannot be the same as current list"
      });
    }
    if (preListId && nextListId && preListId === nextListId) {
      return res.status(400).json({
        success: false,
        message: "Previous and next list cannot be the same"
      });
    }

    const currentList = req.list;
    let preList = null;
    let nextList = null;
    let newOrder;

    if (preListId) {
      preList = await List.findById(preListId);
      if (!preList) {
        return res.status(404).json({
          success: false,
          message: "Previous list not found"
        });
      }
      if (preList.board.toString() !== currentList.board.toString()) {
        return res.status(400).json({
          success: false,
          message: "Previous list does not belong to the same board"
        });
      }
    }

    if (nextListId) {
      nextList = await List.findById(nextListId);
      if (!nextList) {
        return res.status(404).json({
          success: false,
          message: "Next list not found"
        });
      }
      if (nextList.board.toString() !== currentList.board.toString()) {
        return res.status(400).json({
          success: false,
          message: "Next list does not belong to the same board"
        });
      }
    }

    if (preList && nextList) {
      if (preList.order >= nextList.order) {
        return res.status(400).json({
          success: false,
          message: "Invalid list order positions"
        });
      }
      newOrder = (preList.order + nextList.order) / 2;
    } else if (!preList && nextList) {
      newOrder = nextList.order - 100;
    } else if (preList && !nextList) {
      newOrder = preList.order + 100;
    }

    currentList.order = newOrder;
    await currentList.save();

    emitToBoard(currentList.board.toString(), "listReordered", { list: currentList });

    return res.status(200).json({
      success: true,
      message: "List reordered successfully",
      list: currentList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "List reorder failed",
      error: error.message
    });
  }
};

export { createList, updateList, deleteList, getAllList, reOrderList }
