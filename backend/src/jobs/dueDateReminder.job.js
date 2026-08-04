import cron from "node-cron";
import Card from "../models/Card.model.js";
import Notification from "../models/Notification.model.js";

// NEW: runs every hour, notifies card creator + assignees when a due date is within 24h
const startDueDateReminderJob = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const dueSoonCards = await Card.find({
        dueDate: { $gte: now, $lte: in24Hours },
        isArchived: false
      });

      for (const card of dueSoonCards) {
        const existing = await Notification.findOne({
          card: card._id,
          type: "due_soon"
        });
        if (existing) continue; // avoid duplicate reminders

        const recipients = [card.createdBy, ...card.assignees];
        const notifications = recipients.map((userId) => ({
          user: userId,
          type: "due_soon",
          message: `Card "${card.title}" is due soon`,
          board: card.boardId,
          card: card._id
        }));
        await Notification.insertMany(notifications);
      }
    } catch (error) {
      console.log("Due date reminder job failed:", error.message);
    }
  });
};

export default startDueDateReminderJob;
