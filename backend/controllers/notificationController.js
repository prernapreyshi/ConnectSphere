const Notification = require("../models/Notification");
const { asyncHandler } = require("../utils/apiResponse");

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "name username avatar")
      .populate("post", "content images"),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);

  res.json({ success: true, notifications, unreadCount, page: parseInt(page) });
});

// PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: "All notifications marked as read" });
});

// PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true }
  );
  res.json({ success: true });
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  res.json({ success: true });
});

module.exports = { getNotifications, markAllRead, markRead, deleteNotification };
