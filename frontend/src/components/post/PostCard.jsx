import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toggleLike, addComment, deleteComment, deletePost } from "../../api/postApi";
import Avatar from "../common/Avatar";
import RepostModal from "./RepostModal";
import toast from "react-hot-toast";

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

function renderContent(text) {
  if (!text) return null;
  const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
  return parts.map((p, i) =>
    p.startsWith("#")
      ? <Link key={i} to={`/explore?tag=${p.slice(1)}`} className="text-brand-600 hover:underline">{p}</Link>
      : p
  );
}

export default function PostCard({ post: initialPost, onDelete }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [showRepost, setShowRepost] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwn = post.author?._id === user?._id || post.author === user?._id;

  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev); setLikeCount(prev ? likeCount - 1 : likeCount + 1);
    try {
      const { data } = await toggleLike(post._id);
      setLiked(data.liked); setLikeCount(data.likeCount);
    } catch { setLiked(prev); setLikeCount(likeCount); toast.error("Failed"); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      const { data } = await addComment(post._id, commentText);
      setPost((p) => ({ ...p, comments: [...(p.comments || []), data.comment] }));
      setCommentText("");
    } catch { toast.error("Comment failed"); }
    finally { setCommenting(false); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(post._id, commentId);
      setPost((p) => ({ ...p, comments: p.comments.filter((c) => c._id !== commentId) }));
    } catch { toast.error("Failed to delete"); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(post._id);
      onDelete?.(post._id);
      toast.success("Post deleted");
    } catch { toast.error("Failed to delete post"); }
    finally { setShowMenu(false); }
  };

  return (
    <div className="card p-5">
      {/* Repost banner */}
      {post.isRepost && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <span>🔁</span>
          <Link to={`/profile/${post.author?.username}`} className="font-medium text-gray-500 hover:underline">
            {post.author?.name}
          </Link>
          <span>reposted</span>
        </div>
      )}

      {/* Author row */}
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <Link to={`/profile/${post.author?.username}`}>
            <Avatar src={post.author?.avatar} name={post.author?.name} size="md" />
          </Link>
          <div>
            <Link to={`/profile/${post.author?.username}`} className="font-semibold text-sm text-gray-900 hover:underline block">
              {post.author?.name}
            </Link>
            <p className="text-xs text-gray-500">{post.author?.headline || ""}</p>
            <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        {isOwn && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
              ···
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[120px] py-1">
                <button onClick={handleDelete} className="w-full text-left text-sm text-red-500 hover:bg-red-50 px-4 py-2">Delete post</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post content */}
      {post.content && (
        <p className="text-sm text-gray-800 mt-3 leading-relaxed whitespace-pre-wrap">{renderContent(post.content)}</p>
      )}

      {/* Post images */}
      {!post.isRepost && post.images?.length > 0 && (
        <div className={`mt-3 grid gap-2 ${post.images.length > 1 ? "grid-cols-2" : ""}`}>
          {post.images.map((img, i) => (
            <img key={i} src={img.url} alt="" className="w-full rounded-xl object-cover max-h-96" />
          ))}
        </div>
      )}

      {/* Original post embed (for reposts) */}
      {post.isRepost && post.originalPost && (
        <div className="mt-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Avatar src={post.originalPost.author?.avatar} name={post.originalPost.author?.name} size="xs" />
            <Link to={`/profile/${post.originalPost.author?.username}`} className="font-medium text-xs text-gray-700 hover:underline">
              {post.originalPost.author?.name}
            </Link>
            <span className="text-gray-400 text-xs">{timeAgo(post.originalPost.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700">{post.originalPost.content}</p>
          {post.originalPost.images?.[0] && (
            <img src={post.originalPost.images[0].url} alt="" className="mt-2 rounded-lg w-full h-40 object-cover" />
          )}
        </div>
      )}

      {/* Stats row */}
      {(likeCount > 0 || post.comments?.length > 0 || (post.reposts?.length > 0)) && (
        <div className="flex items-center gap-4 mt-3 pt-2 text-xs text-gray-400 border-b border-gray-100 pb-2">
          {likeCount > 0 && <span>{likeCount} like{likeCount !== 1 ? "s" : ""}</span>}
          {post.comments?.length > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="hover:text-brand-600">
              {post.comments.length} comment{post.comments.length !== 1 ? "s" : ""}
            </button>
          )}
          {post.reposts?.length > 0 && <span>{post.reposts.length} repost{post.reposts.length !== 1 ? "s" : ""}</span>}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex mt-2">
        {[
          { icon: liked ? "❤️" : "🤍", label: liked ? "Liked" : "Like", action: handleLike, active: liked },
          { icon: "💬", label: "Comment", action: () => setShowComments(!showComments) },
          { icon: "🔁", label: "Repost", action: () => setShowRepost(true) },
        ].map(({ icon, label, action, active }) => (
          <button key={label} onClick={action}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors
              ${active ? "text-red-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {post.comments?.map((c) => (
            <div key={c._id} className="flex gap-2 group">
              <Link to={`/profile/${c.author?.username}`}>
                <Avatar src={c.author?.avatar} name={c.author?.name} size="xs" />
              </Link>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between">
                  <Link to={`/profile/${c.author?.username}`} className="font-semibold text-xs text-gray-800 hover:underline">
                    {c.author?.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                    {(c.author?._id === user?._id || isOwn) && (
                      <button onClick={() => handleDeleteComment(c._id)}
                        className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}

          {/* Add comment */}
          <div className="flex gap-2">
            <Avatar src={user?.avatar} name={user?.name} size="xs" />
            <div className="flex-1 flex gap-2">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
                placeholder="Write a comment…"
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <button onClick={handleComment} disabled={commenting || !commentText.trim()}
                className="btn-primary text-xs py-1.5 px-3">
                {commenting ? "…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRepost && <RepostModal post={post} onClose={() => setShowRepost(false)} onReposted={() => {}} />}
    </div>
  );
}
