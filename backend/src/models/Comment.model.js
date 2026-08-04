import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  card: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true })

commentSchema.index({ card: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
