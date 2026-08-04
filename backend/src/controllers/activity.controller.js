import ActivityLog from "../models/ActivityLog.model.js";

// NEW: activity log / audit trail per board
const getBoardActivity = async (req, res) => {
  const board = req.board;
  try {
    const activity = await ActivityLog.find({ board: board._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: "Fetching activity failed", error: error.message });
  }
};

export { getBoardActivity };
