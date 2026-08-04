import Label from "../models/Label.model.js";
import Card from "../models/Card.model.js";

// NEW: labels/tags per board (with colors) that can be attached to cards
const createLabel = async (req, res) => {
  const { name, color } = req.body;
  const board = req.board;

  if (!name?.trim() || !color?.trim()) {
    return res.status(400).json({ success: false, message: "Name and color are required" });
  }

  try {
    const label = await Label.create({ name: name.trim(), color: color.trim(), board: board._id });
    res.status(201).json({ success: true, message: "Label created successfully", label });
  } catch (error) {
    res.status(500).json({ success: false, message: "Label creation failed", error: error.message });
  }
};

const getAllLabels = async (req, res) => {
  const board = req.board;
  try {
    const labels = await Label.find({ board: board._id });
    res.status(200).json({ success: true, labels });
  } catch (error) {
    res.status(500).json({ success: false, message: "Fetching labels failed", error: error.message });
  }
};

const deleteLabel = async (req, res) => {
  const { labelId } = req.params;
  try {
    const label = await Label.findByIdAndDelete(labelId);
    if (!label) {
      return res.status(404).json({ success: false, message: "Label not found" });
    }
    await Card.updateMany({ labels: labelId }, { $pull: { labels: labelId } });
    res.status(200).json({ success: true, message: "Label deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Label deletion failed", error: error.message });
  }
};

const attachLabelToCard = async (req, res) => {
  const { cardId, labelId } = req.body;
  try {
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: "Card not found" });
    }
    if (!card.labels.some((l) => l.toString() === labelId)) {
      card.labels.push(labelId);
      await card.save();
    }
    res.status(200).json({ success: true, message: "Label attached successfully", card });
  } catch (error) {
    res.status(500).json({ success: false, message: "Attaching label failed", error: error.message });
  }
};

const removeLabelFromCard = async (req, res) => {
  const { cardId, labelId } = req.params;
  try {
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: "Card not found" });
    }
    card.labels = card.labels.filter((l) => l.toString() !== labelId);
    await card.save();
    res.status(200).json({ success: true, message: "Label removed successfully", card });
  } catch (error) {
    res.status(500).json({ success: false, message: "Removing label failed", error: error.message });
  }
};

export { createLabel, getAllLabels, deleteLabel, attachLabelToCard, removeLabelFromCard };
