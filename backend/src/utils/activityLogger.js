import ActivityLog from "../models/ActivityLog.model.js";

// fire-and-forget style logger, never blocks/breaks the main request
const logActivity = async ({ boardId, userId, action, entityType, entityId, meta = {} }) => {
  try {
    await ActivityLog.create({
      board: boardId,
      user: userId,
      action,
      entityType,
      entityId,
      meta
    });
  } catch (error) {
    console.log("Activity log failed:", error.message);
  }
};

export default logActivity;
