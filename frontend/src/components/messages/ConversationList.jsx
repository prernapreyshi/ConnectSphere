import { Link } from "react-router-dom";
import Avatar from "../common/Avatar";
import { useSocket } from "../../context/SocketContext";

const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function ConversationList({ conversations, activeId, onSelect }) {
  const { isOnline } = useSocket();

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <p className="text-2xl mb-2">💬</p>
        <p className="text-sm text-gray-500">No conversations yet</p>
        <p className="text-xs text-gray-400 mt-1">Connect with people and start chatting</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const other = conv.otherUser;
        const online = isOnline(other?._id);
        const isActive = conv._id === activeId;
        const lastMsg = conv.lastMessage;

        return (
          <button key={conv._id} onClick={() => onSelect(conv)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left
              ${isActive ? "bg-brand-50 border-r-2 border-brand-600" : ""}`}>
            <div className="relative flex-shrink-0">
              <Avatar src={other?.avatar} name={other?.name} size="md" />
              {online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${conv.unread > 0 ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                  {other?.name}
                </p>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {timeAgo(conv.lastMessageAt)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={`text-xs truncate ${conv.unread > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                  {lastMsg?.content || (lastMsg?.image ? "📷 Image" : "Start a conversation")}
                </p>
                {conv.unread > 0 && (
                  <span className="ml-2 flex-shrink-0 bg-brand-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {conv.unread > 9 ? "9+" : conv.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
