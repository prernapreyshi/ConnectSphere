const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: [1000, "Comment too long"], trim: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, maxlength: [3000, "Post too long"], trim: true },
    images: [{ url: String, publicId: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    // Repost fields
    isRepost: { type: Boolean, default: false },
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    repostComment: { type: String, maxlength: [500], trim: true },
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Hashtags extracted from content
    hashtags: [{ type: String, lowercase: true }],
    visibility: { type: String, enum: ["public", "connections"], default: "public" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual counts
postSchema.virtual("likeCount").get(function () { return this.likes?.length || 0; });
postSchema.virtual("commentCount").get(function () { return this.comments?.length || 0; });
postSchema.virtual("repostCount").get(function () { return this.reposts?.length || 0; });

// Extract hashtags from content before saving
postSchema.pre("save", function (next) {
  if (this.isModified("content") && this.content) {
    const tags = this.content.match(/#[a-zA-Z0-9_]+/g) || [];
    this.hashtags = tags.map((t) => t.slice(1).toLowerCase());
  }
  next();
});

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
