import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["mention", "assigned", "due_soon", "board_invite", "comment"],
    required: true
  },
  message: { type: String, required: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: "Board" },
  card: { type: mongoose.Schema.Types.ObjectId, ref: "Card" },
  isRead: { type: Boolean, default: false }
}, { timestamps: true })

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
