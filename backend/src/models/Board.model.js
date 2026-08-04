import mongoose from "mongoose";
const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  // NEW: board customization + favorite/archive support
  background: {
    type: String,
    default: "#0079BF"
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  favoritedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
}, { timestamps: true })

boardSchema.index({ owner: 1 }); // for faster queries by owner
boardSchema.index({ members: 1 }); // for queries where user is a member

const Board = mongoose.model("Board", boardSchema);
export default Board;
