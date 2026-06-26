import { useState } from "react";
import { repost } from "../../api/postApi";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";
import toast from "react-hot-toast";

export default function RepostModal({ post, onClose, onReposted }) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRepost = async () => {
    setLoading(true);
    try {
      const { data } = await repost(post._id, comment);
      onReposted?.(data.post);
      toast.success("Reposted!");
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Repost failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Repost</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <Avatar src={user?.avatar} name={user?.name} size="md" />
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment to this repost… (optional)"
              rows={3} className="flex-1 resize-none text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {/* Preview of original post */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Avatar src={post.author?.avatar} name={post.author?.name} size="xs" />
              <span className="font-medium text-xs text-gray-700">{post.author?.name}</span>
              <span className="text-gray-400 text-xs">@{post.author?.username}</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
            {post.images?.[0] && <img src={post.images[0].url} alt="" className="mt-2 rounded-lg w-full h-32 object-cover" />}
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleRepost} disabled={loading} className="btn-primary flex-1">
            {loading ? "Reposting…" : "Repost"}
          </button>
        </div>
      </div>
    </div>
  );
}
