const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { cloudinary } = require("../config/cloudinary");
const { ApiError, asyncHandler } = require("../utils/apiResponse");

// Helper: create notification + emit via socket
const notify = async (req, recipient, sender, type, postId = null) => {
  if (recipient.toString() === sender.toString()) return;
  try {
    const notification = await Notification.create({ recipient, sender, type, post: postId });
    await notification.populate("sender", "name username avatar");
    // Real-time push if io is available
    if (req?.io?.sendNotification) {
      req.io.sendNotification(recipient.toString(), notification);
    }
  } catch (_) {}
};

// POST /api/posts — create post
const createPost = asyncHandler(async (req, res) => {
  const { content, visibility = "public" } = req.body;
  if (!content && (!req.files || req.files.length === 0)) {
    throw new ApiError(400, "Post must have content or at least one image");
  }

  const images = req.files?.map((f) => ({ url: f.path, publicId: f.filename })) || [];

  const post = await Post.create({
    author: req.user._id,
    content: content || "",
    images,
    visibility,
  });

  await post.populate("author", "name username avatar headline");
  res.status(201).json({ success: true, post });
});

// GET /api/posts/feed — paginated feed (cursor-based)
const getFeed = asyncHandler(async (req, res) => {
  const { cursor, limit = 10 } = req.query;
  const me = await User.findById(req.user._id).select("connections following");
  const feedUsers = [...(me.connections || []), ...(me.following || []), req.user._id];

  const query = { author: { $in: feedUsers } };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 1)
    .populate("author", "name username avatar headline")
    .populate("originalPost", "content author images createdAt")
    .populate({ path: "originalPost", populate: { path: "author", select: "name username avatar" } })
    .populate("comments.author", "name username avatar");

  const hasMore = posts.length > parseInt(limit);
  const data = hasMore ? posts.slice(0, parseInt(limit)) : posts;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

  res.json({ success: true, posts: data, nextCursor, hasMore });
});

// GET /api/posts/explore — trending / discover
const getExplorePosts = asyncHandler(async (req, res) => {
  const { cursor, limit = 10, hashtag } = req.query;
  const query = {};
  if (cursor) query.createdAt = { $lt: new Date(cursor) };
  if (hashtag) query.hashtags = hashtag.toLowerCase();

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 1)
    .populate("author", "name username avatar headline")
    .populate("comments.author", "name username avatar");

  const hasMore = posts.length > parseInt(limit);
  const data = hasMore ? posts.slice(0, parseInt(limit)) : posts;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

  res.json({ success: true, posts: data, nextCursor, hasMore });
});

// GET /api/posts/user/:username — user's posts
const getUserPosts = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) throw new ApiError(404, "User not found");

  const { cursor, limit = 10 } = req.query;
  const query = { author: user._id };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 1)
    .populate("author", "name username avatar headline")
    .populate("originalPost")
    .populate({ path: "originalPost", populate: { path: "author", select: "name username avatar" } })
    .populate("comments.author", "name username avatar");

  const hasMore = posts.length > parseInt(limit);
  const data = hasMore ? posts.slice(0, parseInt(limit)) : posts;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

  res.json({ success: true, posts: data, nextCursor, hasMore });
});

// GET /api/posts/:id — single post
const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("author", "name username avatar headline")
    .populate("comments.author", "name username avatar")
    .populate({ path: "originalPost", populate: { path: "author", select: "name username avatar" } });

  if (!post) throw new ApiError(404, "Post not found");
  res.json({ success: true, post });
});

// DELETE /api/posts/:id
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found");
  if (post.author.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorised");

  // Delete images from cloudinary
  for (const img of post.images || []) {
    try { await cloudinary.uploader.destroy(img.publicId); } catch (_) {}
  }

  await post.deleteOne();
  res.json({ success: true, message: "Post deleted" });
});

// PUT /api/posts/:id/like — toggle like
const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found");

  const userId = req.user._id;
  const liked = post.likes.includes(userId);

  if (liked) {
    post.likes.pull(userId);
  } else {
    post.likes.addToSet(userId);
    await notify(req, post.author, userId, "like", post._id);
  }

  await post.save();
  res.json({ success: true, liked: !liked, likeCount: post.likes.length });
});

// POST /api/posts/:id/comments — add comment
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) throw new ApiError(400, "Comment cannot be empty");

  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found");

  post.comments.push({ author: req.user._id, content: content.trim() });
  await post.save();

  await post.populate("comments.author", "name username avatar");
  const newComment = post.comments[post.comments.length - 1];

  await notify(req, post.author, req.user._id, "comment", post._id);

  res.status(201).json({ success: true, comment: newComment, commentCount: post.comments.length });
});

// DELETE /api/posts/:id/comments/:commentId
const deleteComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found");

  const comment = post.comments.id(req.params.commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const isPostOwner = post.author.toString() === req.user._id.toString();
  if (!isAuthor && !isPostOwner) throw new ApiError(403, "Not authorised");

  comment.deleteOne();
  await post.save();

  res.json({ success: true, message: "Comment deleted", commentCount: post.comments.length });
});

// PUT /api/posts/:id/comments/:commentId/like
const toggleCommentLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found");

  const comment = post.comments.id(req.params.commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const liked = comment.likes.includes(req.user._id);
  if (liked) comment.likes.pull(req.user._id);
  else comment.likes.addToSet(req.user._id);

  await post.save();
  res.json({ success: true, liked: !liked, likeCount: comment.likes.length });
});

// POST /api/posts/:id/repost
const repost = asyncHandler(async (req, res) => {
  const { repostComment } = req.body;
  const original = await Post.findById(req.params.id);
  if (!original) throw new ApiError(404, "Post not found");

  const alreadyReposted = await Post.findOne({
    author: req.user._id, isRepost: true, originalPost: original._id,
  });
  if (alreadyReposted) throw new ApiError(400, "You already reposted this");

  const newPost = await Post.create({
    author: req.user._id,
    content: repostComment || "",
    isRepost: true,
    originalPost: original._id,
    repostComment,
  });

  original.reposts.addToSet(req.user._id);
  await original.save();

  await notify(req, original.author, req.user._id, "repost", original._id);
  await newPost.populate("author", "name username avatar headline");

  res.status(201).json({ success: true, post: newPost });
});

// GET /api/posts/trending — trending hashtags
const getTrendingHashtags = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const tags = await Post.aggregate([
    { $match: { createdAt: { $gte: since }, hashtags: { $exists: true, $ne: [] } } },
    { $unwind: "$hashtags" },
    { $group: { _id: "$hashtags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.json({ success: true, hashtags: tags });
});

module.exports = {
  createPost, getFeed, getExplorePosts, getUserPosts, getPost, deletePost,
  toggleLike, addComment, deleteComment, toggleCommentLike,
  repost, getTrendingHashtags,
};
