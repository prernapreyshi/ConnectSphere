const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getConversations, getOrCreateConversation,
  getMessages, sendMessage, deleteMessage, getTotalUnread,
} = require("../controllers/messageController");

router.get("/conversations", protect, getConversations);
router.post("/conversations", protect, getOrCreateConversation);
router.get("/conversations/:id", protect, getMessages);
router.post("/conversations/:id", protect, sendMessage);
router.delete("/:messageId", protect, deleteMessage);
router.get("/unread", protect, getTotalUnread);

module.exports = router;
