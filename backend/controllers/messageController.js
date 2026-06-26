const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { ApiError, asyncHandler } = require("../utils/apiResponse");

// GET /api/messages/conversations — list all conversations for current user
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .sort({ lastMessageAt: -1 })
    .populate("participants", "name username avatar headline")
    .populate("lastMessage", "content image sender createdAt");

  // Attach unread count for the current user
  const result = conversations.map((conv) => {
    const other = conv.participants.find((p) => p._id.toString() !== req.user._id.toString());
    const unread = conv.unreadCounts?.get(req.user._id.toString()) || 0;
    return { ...conv.toObject(), otherUser: other, unread };
  });

  res.json({ success: true, conversations: result });
});

// POST /api/messages/conversations — get or create conversation with a user
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new ApiError(400, "userId is required");
  if (userId === req.user._id.toString()) throw new ApiError(400, "Cannot message yourself");

  const target = await User.findById(userId).select("name username avatar headline");
  if (!target) throw new ApiError(404, "User not found");

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId], $size: 2 },
  })
    .populate("participants", "name username avatar headline")
    .populate("lastMessage", "content sender createdAt");

  if (!conversation) {
    conversation = await Conversation.create({ participants: [req.user._id, userId] });
    await conversation.populate("participants", "name username avatar headline");
  }

  const other = conversation.participants.find((p) => p._id.toString() !== req.user._id.toString());
  res.json({ success: true, conversation: { ...conversation.toObject(), otherUser: other } });
});

// GET /api/messages/conversations/:id — get messages in a conversation (cursor-based)
const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cursor, limit = 30 } = req.query;

  const conversation = await Conversation.findOne({ _id: id, participants: req.user._id });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const query = {
    conversation: id,
    deletedFor: { $ne: req.user._id },
  };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 1)
    .populate("sender", "name username avatar");

  const hasMore = messages.length > parseInt(limit);
  const data = (hasMore ? messages.slice(0, parseInt(limit)) : messages).reverse();
  const nextCursor = hasMore ? messages[parseInt(limit) - 1].createdAt.toISOString() : null;

  // Mark messages as read
  await Message.updateMany(
    { conversation: id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  // Reset unread count for this user
  await Conversation.findByIdAndUpdate(id, {
    $set: { [`unreadCounts.${req.user._id}`]: 0 },
  });

  res.json({ success: true, messages: data, hasMore, nextCursor });
});

// POST /api/messages/conversations/:id — send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content?.trim() && !req.file) throw new ApiError(400, "Message cannot be empty");

  const conversation = await Conversation.findOne({ _id: id, participants: req.user._id });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const image = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;

  const message = await Message.create({
    conversation: id,
    sender: req.user._id,
    content: content?.trim() || "",
    image,
    readBy: [req.user._id],
  });

  await message.populate("sender", "name username avatar");

  // Update conversation metadata + increment unread for the other participant
  const otherParticipant = conversation.participants.find(
    (p) => p.toString() !== req.user._id.toString()
  );

  const unreadKey = `unreadCounts.${otherParticipant}`;
  await Conversation.findByIdAndUpdate(id, {
    lastMessage: message._id,
    lastMessageAt: message.createdAt,
    $inc: { [unreadKey]: 1 },
  });

  res.status(201).json({ success: true, message });
});

// DELETE /api/messages/:messageId — delete message for self
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const isOwn = message.sender.toString() === req.user._id.toString();
  if (!isOwn) {
    // Delete for self only
    message.deletedFor.addToSet(req.user._id);
    await message.save();
  } else {
    // Owner: clear content
    message.content = "";
    message.image = undefined;
    message.deletedFor = message.readBy; // mark deleted for everyone
    await message.save();
  }

  res.json({ success: true, message: "Message deleted" });
});

// GET /api/messages/unread — total unread count across all conversations
const getTotalUnread = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id });
  const total = conversations.reduce((sum, c) => {
    return sum + (c.unreadCounts?.get(req.user._id.toString()) || 0);
  }, 0);
  res.json({ success: true, total });
});

module.exports = { getConversations, getOrCreateConversation, getMessages, sendMessage, deleteMessage, getTotalUnread };
