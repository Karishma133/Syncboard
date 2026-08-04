import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  isDone: { type: Boolean, default: false }
}, { _id: true });

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true
  },
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "List",
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // NEW: assignees, labels, checklist, attachments
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  labels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Label" }],
  checklist: [checklistItemSchema],
  attachments: [{
    url: String,
    name: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    uploadedAt: { type: Date, default: Date.now }
  }],
  dueDate: {
    type: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

// 1. Most important -> fetch + sort cards in a list
cardSchema.index({ listId: 1, order: 1 });
// 2. Useful for board-level queries
cardSchema.index({ boardId: 1 });
// 3. Optional (future feature: user's cards)
cardSchema.index({ createdBy: 1 });
// 4. NEW: full text search on title/description
cardSchema.index({ title: "text", description: "text" });

const Card = mongoose.model("Card", cardSchema);
export default Card;
