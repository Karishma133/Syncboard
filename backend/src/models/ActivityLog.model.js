import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  entityType: { type: String, enum: ["board", "list", "card", "comment", "member"], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true })

activityLogSchema.index({ board: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
