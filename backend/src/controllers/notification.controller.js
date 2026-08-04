import Notification from "../models/Notification.model.js";

// NEW: in-app notifications (mentions, assignments, due-soon reminders)
const getMyNotifications = async (req, res) => {
  const { id: userId } = req.user;
  try {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Fetching notifications failed", error: error.message });
  }
};

const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const { id: userId } = req.user;
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed", error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  const { id: userId } = req.user;
  try {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed", error: error.message });
  }
};

export { getMyNotifications, markAsRead, markAllAsRead };
