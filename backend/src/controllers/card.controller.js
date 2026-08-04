import List from "../models/List.model.js"
import Card from "../models/Card.model.js";
import Notification from "../models/Notification.model.js";
import mongoose from "mongoose";
import logActivity from "../utils/activityLogger.js";
import { emitToBoard } from "../utils/socket.js";

const createCard = async (req, res) => {
  const list = req.list;
  const board = req.board;
  const { title, description } = req.body;
  const { id: userId } = req.user;
  try {
    const trimTitle = title?.trim();
    const trimDescription = description?.trim() || "";

    if (!trimTitle) {
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }

    const lastCard = await Card.findOne({ listId: list._id }).sort({ order: -1 });
    const newOrder = lastCard ? lastCard.order + 100 : 0;

    const card = await Card.create({
      title: trimTitle,        // FIX: was `trimTitle`/`trimDescription` used as keys instead of
      description: trimDescription, // `title`/`description` -> schema validation always failed
      boardId: board._id,
      listId: list._id,
      order: newOrder,
      createdBy: userId
    })

    await logActivity({
      boardId: board._id,
      userId,
      action: "created a card",
      entityType: "card",
      entityId: card._id,
      meta: { title: card.title }
    });

    emitToBoard(board._id.toString(), "cardCreated", { card });

    res.status(201).json({
      success: true,
      message: "Card creation successfully",
      card
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Card creation failed",
      error: error.message
    })
  }
}

const getAllCard = async (req, res) => {
  const list = req.list;
  try {
    const cards = await Card.find({
      listId: list._id,
      isArchived: false
    }).sort({ order: 1 }).populate("labels").populate("assignees", "name email")
    res.status(200).json({
      success: true,
      message: " featching cards successfully",
      cards
    })
  } catch (error) {
    // FIX: was `res.success(500)` - `success` is not a function on res, this crashed the request
    res.status(500).json({
      status: false,
      message: " featching cards failed ",
      error: error.message
    })
  }
}

const updateCard = async (req, res) => {
  const { title, description, dueDate } = req.body;
  const card = req.card;
  const trimmedTitle = title?.trim();
  const trimmedDescription = description?.trim();

  if (title === undefined && description === undefined && dueDate === undefined) {
    return res.status(400).json({
      success: false,
      message: "Atleast one field is required"
    })
  }
  if (title !== undefined) {
    if (!trimmedTitle) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty"
      });
    }
    card.title = trimmedTitle;
  }
  if (description !== undefined) {
    card.description = trimmedDescription || "";
  }
  if (dueDate !== undefined) {
    card.dueDate = dueDate;
  }

  try {
    await card.save();

    emitToBoard(req.board._id.toString(), "cardUpdated", { card });

    res.status(200).json({
      success: true,
      message: "card updation successful",
      card
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "card updation failed sever failed",
      error: error.message
    })
  }
}

const deleteCard = async (req, res) => {
  const card = req.card;
  try {
    await card.deleteOne();
    emitToBoard(req.board._id.toString(), "cardDeleted", { cardId: card._id, listId: card.listId });
    res.status(200).json({
      success: true,
      message: "card deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "card deleted failed server failed",
      error: error.message
    })
  }
}

const moveCard = async (req, res) => {
  const { sourceListId, destinationListId, newPosition } = req.body;
  const card = req.card;
  const board = req.board;
  const session = await mongoose.startSession();
  try {
    if (!sourceListId || !destinationListId || newPosition === undefined) {
      return res.status(400).json({
        success: false,
        message: "Source list id, destination list id and new position are required"
      });
    }
    if (Number.isNaN(Number(newPosition)) || Number(newPosition) < 0) {
      return res.status(400).json({
        success: false,
        message: "New position must be a valid non-negative number"
      });
    }
    const parsedPosition = Number(newPosition);

    if (card.listId.toString() !== sourceListId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Card does not belong to the provided source list"
      });
    }

    const sourceList = await List.findById(sourceListId).session(session);
    const destinationList = await List.findById(destinationListId).session(session);

    if (!sourceList || !destinationList) {
      return res.status(404).json({
        success: false,
        message: "Source or destination list not found"
      });
    }

    if (
      sourceList.board.toString() !== board._id.toString() ||
      destinationList.board.toString() !== board._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Lists do not belong to the same board"
      });
    }

    await session.startTransaction();

    let updatedCards = [];

    if (sourceListId === destinationListId) {
      let cards = await Card.find({ listId: sourceListId })
        .sort({ order: 1 })
        .session(session);

      cards = cards.filter((item) => item._id.toString() !== card._id.toString());

      if (parsedPosition > cards.length) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Invalid new position"
        });
      }

      cards.splice(parsedPosition, 0, card);

      for (let i = 0; i < cards.length; i++) {
        cards[i].order = (i + 1) * 100;
        await cards[i].save({ session });
      }
      updatedCards = cards;
    } else {
      let sourceCards = await Card.find({ listId: sourceListId })
        .sort({ order: 1 })
        .session(session);

      sourceCards = sourceCards.filter(
        (item) => item._id.toString() !== card._id.toString()
      );

      for (let i = 0; i < sourceCards.length; i++) {
        sourceCards[i].order = (i + 1) * 100;
        await sourceCards[i].save({ session });
      }

      let destinationCards = await Card.find({ listId: destinationListId })
        .sort({ order: 1 })
        .session(session);

      if (parsedPosition > destinationCards.length) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Invalid new position"
        });
      }

      card.listId = destinationListId;
      destinationCards.splice(parsedPosition, 0, card);

      for (let i = 0; i < destinationCards.length; i++) {
        destinationCards[i].order = (i + 1) * 100;
        await destinationCards[i].save({ session });
      }
      updatedCards = destinationCards;
    }

    await session.commitTransaction();

    emitToBoard(board._id.toString(), "cardMoved", {
      cardId: card._id,
      sourceListId,
      destinationListId,
      updatedCards
    });

    return res.status(200).json({
      success: true,
      message: "Card moved successfully",
      updatedCards
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Card move failed",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// NEW: checklist / subtasks support
const addChecklistItem = async (req, res) => {
  const { text } = req.body;
  const card = req.card;
  const trimText = text?.trim();
  if (!trimText) {
    return res.status(400).json({ success: false, message: "Checklist item text is required" });
  }
  try {
    card.checklist.push({ text: trimText, isDone: false });
    await card.save();
    emitToBoard(req.board._id.toString(), "cardUpdated", { card });
    res.status(201).json({ success: true, message: "Checklist item added", card });
  } catch (error) {
    res.status(500).json({ success: false, message: "Adding checklist item failed", error: error.message });
  }
};

const toggleChecklistItem = async (req, res) => {
  const { itemId } = req.params;
  const card = req.card;
  try {
    const item = card.checklist.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Checklist item not found" });
    }
    item.isDone = !item.isDone;
    await card.save();
    emitToBoard(req.board._id.toString(), "cardUpdated", { card });
    res.status(200).json({ success: true, message: "Checklist item updated", card });
  } catch (error) {
    res.status(500).json({ success: false, message: "Updating checklist item failed", error: error.message });
  }
};

// NEW: assign / unassign a member to a card, notifies them
const assignMember = async (req, res) => {
  const { memberId } = req.body;
  const card = req.card;
  const board = req.board;
  try {
    const isAssigned = card.assignees.some((a) => a.toString() === memberId);
    if (isAssigned) {
      card.assignees = card.assignees.filter((a) => a.toString() !== memberId);
    } else {
      card.assignees.push(memberId);
      await Notification.create({
        user: memberId,
        type: "assigned",
        message: `You were assigned to card "${card.title}"`,
        board: board._id,
        card: card._id
      });
    }
    await card.save();
    emitToBoard(board._id.toString(), "cardUpdated", { card });
    res.status(200).json({
      success: true,
      message: isAssigned ? "Member unassigned" : "Member assigned",
      card
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Assigning member failed", error: error.message });
  }
};

// NEW: cross-board "My Work" — every non-archived card assigned to the
// logged-in user, regardless of which board it lives on. A single indexed
// query (assignees + isArchived) rather than looping over every board the
// person is a member of.
const getMyCards = async (req, res) => {
  try {
    const cards = await Card.find({
      assignees: req.user.id,
      isArchived: false
    })
      .populate("boardId", "title background")
      .populate("listId", "title")
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "My cards fetched successfully",
      cards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "failed to fetch your cards",
      error: error.message
    });
  }
};

export { createCard, getAllCard, updateCard, deleteCard, moveCard, addChecklistItem, toggleChecklistItem, assignMember, getMyCards }
