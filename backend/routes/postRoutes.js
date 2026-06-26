const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { uploadPostImage } = require("../config/cloudinary");
const {
  createPost, getFeed, getExplorePosts, getUserPosts, getPost, deletePost,
  toggleLike, addComment, deleteComment, toggleCommentLike,
  repost, getTrendingHashtags,
} = require("../controllers/postController");

router.get("/feed", protect, getFeed);
router.get("/explore", protect, getExplorePosts);
router.get("/trending", protect, getTrendingHashtags);
router.get("/user/:username", protect, getUserPosts);

router.post("/", protect, uploadPostImage.array("images", 4), createPost);
router.get("/:id", protect, getPost);
router.delete("/:id", protect, deletePost);

router.put("/:id/like", protect, toggleLike);
router.post("/:id/repost", protect, repost);

router.post("/:id/comments", protect, addComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);
router.put("/:id/comments/:commentId/like", protect, toggleCommentLike);

module.exports = router;

/**
 * @swagger
 * /posts/feed:
 *   get:
 *     tags: [Posts]
 *     summary: Get paginated feed from connections and following
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: ISO date string for cursor-based pagination
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Feed posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 posts: { type: array, items: { $ref: '#/components/schemas/Post' } }
 *                 nextCursor: { type: string, nullable: true }
 *                 hasMore: { type: boolean }
 *
 * /posts:
 *   post:
 *     tags: [Posts]
 *     summary: Create a new post (supports up to 4 images)
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, maxLength: 3000 }
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               visibility: { type: string, enum: [public, connections] }
 *     responses:
 *       201:
 *         description: Post created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 post: { $ref: '#/components/schemas/Post' }
 *
 * /posts/{id}/like:
 *   put:
 *     tags: [Posts]
 *     summary: Toggle like on a post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Like toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 liked: { type: boolean }
 *                 likeCount: { type: integer }
 *
 * /posts/{id}/comments:
 *   post:
 *     tags: [Posts]
 *     summary: Add a comment to a post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, maxLength: 1000 }
 *     responses:
 *       201: { description: "Comment added" }
 *
 * /posts/{id}/repost:
 *   post:
 *     tags: [Posts]
 *     summary: Repost a post with optional comment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repostComment: { type: string, maxLength: 500 }
 *     responses:
 *       201: { description: "Reposted" }
 */
