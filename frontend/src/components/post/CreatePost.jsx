import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { createPost } from "../../api/postApi";
import Avatar from "../common/Avatar";
import toast from "react-hot-toast";

export default function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef();

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    setImages(images.filter((_, j) => j !== i));
    setPreviews(previews.filter((_, j) => j !== i));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) { toast.error("Write something first!"); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("content", content);
      images.forEach((img) => fd.append("images", img));
      const { data } = await createPost(fd);
      onCreated?.(data.post);
      setContent(""); setImages([]); setPreviews([]); setExpanded(false);
      toast.success("Post shared!");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to post"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar src={user?.avatar} name={user?.name} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="Share something with your network…"
            rows={expanded ? 4 : 2}
            className="w-full resize-none text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 transition-all"
          />

          {/* Image previews */}
          {previews.length > 0 && (
            <div className={`grid gap-2 mt-2 ${previews.length === 1 ? "" : "grid-cols-2"}`}>
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="w-full h-36 object-cover rounded-lg" />
                  <button onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs hover:bg-black/80 flex items-center justify-center">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
                  <span>🖼</span> Photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
                {/* Character count */}
                <span className={`text-xs self-center ml-2 ${content.length > 2800 ? "text-red-500" : "text-gray-400"}`}>
                  {content.length}/3000
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setExpanded(false); setContent(""); setImages([]); setPreviews([]); }}
                  className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting || (!content.trim() && images.length === 0)}
                  className="btn-primary text-sm py-1.5 px-5">
                  {submitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
