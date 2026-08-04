import Card from "../models/Card.model.js";
import Board from "../models/Board.model.js";

// NEW: global search across a user's boards and cards
const globalSearch = async (req, res) => {
  const { q } = req.query;
  const { id: userId } = req.user;

  if (!q?.trim()) {
    return res.status(400).json({ success: false, message: "Search query is required" });
  }

  try {
    const boards = await Board.find({
      $or: [{ owner: userId }, { members: userId }]
    }).select("_id");
    const boardIds = boards.map((b) => b._id);

    const cards = await Card.find({
      boardId: { $in: boardIds },
      $text: { $search: q }
    })
      .limit(20)
      .populate("boardId", "title")
      .populate("listId", "title");

    const matchedBoards = await Board.find({
      _id: { $in: boardIds },
      title: { $regex: q, $options: "i" }
    }).limit(10);

    res.status(200).json({ success: true, cards, boards: matchedBoards });
  } catch (error) {
    res.status(500).json({ success: false, message: "Search failed", error: error.message });
  }
};

export { globalSearch };
