import Comment from "../models/Comment.model.js";
import Notification from "../models/Notification.model.js";
import { emitToBoard } from "../utils/socket.js";
import logActivity from "../utils/activityLogger.js";

// NEW: comments + @mentions on cards
const addComment = async (req, res) => {
  const { text, mentions } = req.body;
  const card = req.card;
  const board = req.board;
  const { id: userId } = req.user;

  const trimText = text?.trim();
  if (!trimText) {
    return res.status(400).json({ success: false, message: "Comment text is required" });
  }

  try {
    const comment = await Comment.create({
      card: card._id,
      author: userId,
      text: trimText,
      mentions: mentions || []
    });

    const populatedComment = await comment.populate("author", "name email");

    if (mentions && mentions.length > 0) {
      const notifications = mentions.map((mentionId) => ({
        user: mentionId,
        type: "mention",
        message: `You were mentioned in a comment on "${card.title}"`,
        board: board._id,
        card: card._id
      }));
      await Notification.insertMany(notifications);
    }

    await logActivity({
      boardId: board._id,
      userId,
      action: "commented on card",
      entityType: "comment",
      entityId: comment._id,
      meta: { cardTitle: card.title }
    });

    emitToBoard(board._id.toString(), "commentAdded", { cardId: card._id, comment: populatedComment });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Comment creation failed", error: error.message });
  }
};

const getCommentsForCard = async (req, res) => {
  const card = req.card;
  try {
    const comments = await Comment.find({ card: card._id })
      .populate("author", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Fetching comments failed", error: error.message });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { id: userId } = req.user;
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own comment" });
    }
    await comment.deleteOne();
    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Comment deletion failed", error: error.message });
  }
};

export { addComment, getCommentsForCard, deleteComment };
