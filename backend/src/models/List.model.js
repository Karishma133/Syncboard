import mongoose from "mongoose";
const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  // NEW: optional work-in-progress limit for this list. When the number of
  // cards in the list exceeds this, the UI flags it — a lightweight version
  // of the WIP-limit practice used in real kanban/scrum teams.
  wipLimit: {
    type: Number,
    default: null
  }
}, { timestamps: true })

listSchema.index({ board: 1 }); // this will add index not store as document
// It's metadata for querying
const List = mongoose.model("List", listSchema);
export default List;
