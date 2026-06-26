const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");
const {
  getProfile, updateProfile, updateAvatar, removeAvatar,
  searchUsers, getSuggestions,
  sendConnectionRequest, respondToConnection, removeConnection,
  toggleFollow, getUserConnections, getConnectionRequests,
} = require("../controllers/userController");
const { downloadResume } = require("../controllers/resumeController");

// Search & suggestions (must come before /:username)
router.get("/search", protect, searchUsers);
router.get("/suggestions", protect, getSuggestions);
router.get("/me/requests", protect, getConnectionRequests);

// Own profile
router.put("/profile", protect, updateProfile);
router.put("/avatar", protect, uploadAvatar.single("avatar"), updateAvatar);
router.delete("/avatar", protect, removeAvatar);

// Connection actions
router.post("/:id/connect", protect, sendConnectionRequest);
router.put("/connections/:requestId", protect, respondToConnection);
router.delete("/:id/connect", protect, removeConnection);

// Follow/unfollow
router.post("/:id/follow", protect, toggleFollow);

// Public profile routes
router.get("/:username", getProfile);
router.get("/:username/connections", getUserConnections);
router.get("/:username/resume", downloadResume);

module.exports = router;
