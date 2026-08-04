import Board from "../models/Board.model.js";
import logActivity from "../utils/activityLogger.js";

const createBoard = async (req, res) => {
  const { title } = req.body;
  const trimtitle = title?.trim();
  if (!trimtitle) {
    return res.status(400).json({
      success: false,
      message: "title is requied"
    })
  }
  const { id: userId } = req.user; //dont use _id because in middleware we use id in the user object
  try {
    const board = await Board.create({
      title: trimtitle, // FIX: was `trimtitle` used as the key, which doesn't exist on the
                         // schema (schema field is `title`). Board creation was failing
                         // with a "title is required" validation error every single time.
      owner: userId
    })
    await logActivity({
      boardId: board._id,
      userId,
      action: "created the board",
      entityType: "board",
      entityId: board._id
    });
    res.status(200).json({
      success: true,
      message: "board creation successful",
      board
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "board creation failed",
      error: error.message
    })
  }
};

const getAllBoard = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const boards = await Board.find({
      $or: [
        { owner: userId },
        { members: userId }
      ],
      isArchived: false
    }).populate("owner", "name email");
    res.status(200).json({
      status: true,
      message: "all board found",
      boards
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "error fetching boards",
      error: error.message
    })
  }
};

const getSingleBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.board._id)
      .populate("owner", "name email")
      .populate("members", "name email");
    if (!board) {
      return res.status(400).json({
        status: false,
        message: "board not found",
      })
    }
    res.status(200).json({
      success: true,
      message: "board fetching successful",
      board
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "error fetching boards",
      error: error.message
    })
  }
};

const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findByIdAndDelete(req.board._id)
    if (!board) {
      return res.status(404).json({
        success: false,
        message: "board not found",
      })
    }
    res.status(200).json({
      success: true,
      message: "Board deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "error deleting boards",
      error: error.message
    })
  }
};

const addMember = async (req, res) => {
  const { memberId } = req.body;
  const board = req.board;
  if (!memberId) {
    return res.status(400).json({
      success: false,
      message: "required all fields"
    })
  }
  try {
    if (board.owner.toString() === memberId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Owner cannot be added as a member"
      })
    }
    const alreadyMember = board.members.some(
      member => member.toString() === memberId.toString());
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "Member already exist"
      })
    }
    board.members.push(memberId);
    await board.save();
    const updatedBoard = await Board.findById(board._id)
      .populate("owner", "name email")
      .populate("members", "name email");

    await logActivity({
      boardId: board._id,
      userId: req.user.id,
      action: "added a member",
      entityType: "member",
      entityId: memberId
    });

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      board: updatedBoard
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "member not added",
      error: error.message
    })
  }
};

const removeMember = async (req, res) => {
  const { memberId } = req.params;
  const board = req.board;
  try {
    if (board.owner.toString() === memberId) {
      return res.status(400).json({
        status: false,
        message: "cannot remove owner"
      })
    }
    const memberExists = board.members.some(
      member => member.toString() === memberId
    );
    if (!memberExists) {
      return res.status(400).json({
        success: false,
        message: "member not found"
      })
    }
    board.members = board.members.filter(
      (member) => member.toString() !== memberId.toString()
    );
    await board.save();
    res.status(200).json({
      success: true,
      message: "Member removed successfully"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "deletion failed",
      error: error.message
    })
  }
};

const getAllMember = async (req, res) => {
  const { boardId } = req.params;
  try {
    const board = await Board.findOne({ _id: boardId })
      .populate("owner", "name email")
      .populate("members", "name email");
    if (!board) {
      return res.status(400).json({
        success: false,
        message: "board not found or access denied"
      })
    }
    res.status(200).json({
      success: true,
      message: "found all members",
      data: [
        { role: "owner", user: board.owner },
        ...board.members.map(m => ({
          role: "member",
          user: m
        }))
      ]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "unable to featch all members",
      error: error.message
    })
  }
};

// NEW: star / unstar a board for the current user
const toggleFavorite = async (req, res) => {
  const board = req.board;
  const { id: userId } = req.user;
  try {
    const isFav = board.favoritedBy.some((u) => u.toString() === userId.toString());
    if (isFav) {
      board.favoritedBy = board.favoritedBy.filter((u) => u.toString() !== userId.toString());
    } else {
      board.favoritedBy.push(userId);
    }
    await board.save();
    res.status(200).json({
      success: true,
      message: isFav ? "Removed from favorites" : "Added to favorites",
      isFavorite: !isFav
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Toggling favorite failed", error: error.message })
  }
};

// NEW: archive/unarchive a board instead of hard-deleting it
const archiveBoard = async (req, res) => {
  const board = req.board;
  try {
    board.isArchived = !board.isArchived;
    await board.save();
    res.status(200).json({
      success: true,
      message: board.isArchived ? "Board archived" : "Board restored",
      board
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Archiving board failed", error: error.message })
  }
};

export
  { createBoard, getAllBoard, getSingleBoard, deleteBoard, addMember, removeMember, getAllMember, toggleFavorite, archiveBoard }
