const User = require("../models/User");
const { cloudinary } = require("../config/cloudinary");
const { ApiError, asyncHandler } = require("../utils/apiResponse");

// GET /api/users/:username — public profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .select("-password -refreshToken -connectionRequests")
    .populate("connections", "name username avatar headline")
    .populate("followers", "name username avatar headline")
    .populate("following", "name username avatar headline");

  if (!user) throw new ApiError(404, "User not found");

  res.json({ success: true, user });
});

// PUT /api/users/profile — update own profile
const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "headline", "bio", "location", "website", "skills", "experience", "education"];
  const updates = {};
  allowed.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    .select("-password -refreshToken");

  res.json({ success: true, user });
});

// PUT /api/users/avatar — upload avatar
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image uploaded");

  // Delete old avatar from cloudinary if exists
  const currentUser = await User.findById(req.user._id);
  if (currentUser.avatar) {
    const publicId = currentUser.avatar.split("/").slice(-2).join("/").split(".")[0];
    try { await cloudinary.uploader.destroy(publicId); } catch (_) {}
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.path },
    { new: true }
  ).select("-password -refreshToken");

  res.json({ success: true, avatar: user.avatar, user });
});

// DELETE /api/users/avatar — remove avatar
const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.avatar) {
    const publicId = user.avatar.split("/").slice(-2).join("/").split(".")[0];
    try { await cloudinary.uploader.destroy(publicId); } catch (_) {}
  }
  await User.findByIdAndUpdate(req.user._id, { avatar: "" });
  res.json({ success: true, message: "Avatar removed" });
});

// GET /api/users/search?q=query — search users
const searchUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  if (!q || q.trim().length < 2) throw new ApiError(400, "Search query must be at least 2 characters");

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find(
    { $text: { $search: q }, _id: { $ne: req.user._id } },
    { score: { $meta: "textScore" } }
  )
    .select("name username avatar headline connections")
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, users, page: parseInt(page) });
});

// GET /api/users/suggestions — people you may know
const getSuggestions = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  const exclude = [req.user._id, ...currentUser.connections, ...currentUser.following];

  const users = await User.find({ _id: { $nin: exclude } })
    .select("name username avatar headline connections")
    .limit(8)
    .sort({ createdAt: -1 });

  res.json({ success: true, users });
});

// POST /api/users/:id/connect — send connection request
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user._id.toString()) throw new ApiError(400, "Cannot connect with yourself");

  const target = await User.findById(id);
  if (!target) throw new ApiError(404, "User not found");

  // Already connected?
  if (target.connections.includes(req.user._id)) throw new ApiError(400, "Already connected");

  // Already pending?
  const alreadyPending = target.connectionRequests.some(
    (r) => r.from.toString() === req.user._id.toString() && r.status === "pending"
  );
  if (alreadyPending) throw new ApiError(400, "Connection request already sent");

  target.connectionRequests.push({ from: req.user._id, status: "pending" });
  await target.save();

  res.json({ success: true, message: "Connection request sent" });
});

// PUT /api/users/connections/:requestId — accept or reject
const respondToConnection = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body; // "accept" | "reject"

  if (!["accept", "reject"].includes(action)) throw new ApiError(400, "Action must be accept or reject");

  const user = await User.findById(req.user._id);
  const request = user.connectionRequests.id(requestId);
  if (!request) throw new ApiError(404, "Connection request not found");

  request.status = action === "accept" ? "accepted" : "rejected";
  await user.save();

  if (action === "accept") {
    // Add to both users' connections
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { connections: request.from } });
    await User.findByIdAndUpdate(request.from, { $addToSet: { connections: req.user._id } });
  }

  res.json({ success: true, message: `Request ${action}ed` });
});

// DELETE /api/users/:id/connect — remove connection
const removeConnection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $pull: { connections: id } });
  await User.findByIdAndUpdate(id, { $pull: { connections: req.user._id } });
  res.json({ success: true, message: "Connection removed" });
});

// POST /api/users/:id/follow — follow a user
const toggleFollow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === req.user._id.toString()) throw new ApiError(400, "Cannot follow yourself");

  const target = await User.findById(id);
  if (!target) throw new ApiError(404, "User not found");

  const isFollowing = req.user.following.includes(id);

  if (isFollowing) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
    await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
    res.json({ success: true, following: false, message: "Unfollowed" });
  } else {
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: id } });
    await User.findByIdAndUpdate(id, { $addToSet: { followers: req.user._id } });
    res.json({ success: true, following: true, message: "Following" });
  }
});

// GET /api/users/:username/connections
const getUserConnections = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .select("connections")
    .populate("connections", "name username avatar headline");
  if (!user) throw new ApiError(404, "User not found");
  res.json({ success: true, connections: user.connections });
});

// GET /api/users/me/requests — pending connection requests for current user
const getConnectionRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("connectionRequests")
    .populate("connectionRequests.from", "name username avatar headline");

  const pending = user.connectionRequests.filter((r) => r.status === "pending");
  res.json({ success: true, requests: pending });
});

module.exports = {
  getProfile, updateProfile, updateAvatar, removeAvatar,
  searchUsers, getSuggestions,
  sendConnectionRequest, respondToConnection, removeConnection,
  toggleFollow, getUserConnections, getConnectionRequests,
};
