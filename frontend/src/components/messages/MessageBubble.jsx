import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { deleteMessage } from "../../api/messageApi";
import Avatar from "../common/Avatar";
import toast from "react-hot-toast";

const timeLabel = (date) =>
  new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export default function MessageBubble({ message, showAvatar, onDeleted }) {
  const { user } = useAuth();
  const isOwn = message.sender?._id === user?._id || message.sender === user?._id;
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDeleted = !message.content && !message.image;

  const handleDelete = async () => {
    if (!window.confirm("Delete this message?")) return;
    setDeleting(true);
    try {
      await deleteMessage(message._id);
      onDeleted?.(message._id);
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(false); }
  };

  return (
    <div className={`flex items-end gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}>

      {/* Avatar (other user only) */}
      {!isOwn && (
        <div className="flex-shrink-0 mb-1">
          {showAvatar ? <Avatar src={message.sender?.avatar} name={message.sender?.name} size="xs" /> : <div className="w-6" />}
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div className={`px-4 py-2.5 rounded-2xl text-sm relative
          ${isOwn
            ? "bg-brand-600 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-900 rounded-bl-sm"}
          ${isDeleted ? "italic opacity-50" : ""}
        `}>
          {isDeleted ? (
            <span className="text-xs">Message deleted</span>
          ) : (
            <>
              {message.image?.url && (
                <img src={message.image.url} alt="Sent image"
                  className="rounded-xl mb-1 max-h-48 w-auto object-cover" />
              )}
              {message.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>}
            </>
          )}
        </div>

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-xs text-gray-400">{timeLabel(message.createdAt)}</span>
          {isOwn && message.readBy?.length > 1 && (
            <span className="text-xs text-brand-500" title="Read">✓✓</span>
          )}
          {isOwn && message.readBy?.length <= 1 && (
            <span className="text-xs text-gray-400" title="Sent">✓</span>
          )}
        </div>
      </div>

      {/* Delete action */}
      {isOwn && !isDeleted && showActions && (
        <button onClick={handleDelete} disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 text-xs p-1 flex-shrink-0 mb-5">
          🗑
        </button>
      )}
    </div>
  );
}
