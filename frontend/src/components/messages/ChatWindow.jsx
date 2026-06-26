import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getMessages, sendMessage } from "../../api/messageApi";
import Avatar from "../common/Avatar";
import MessageBubble from "./MessageBubble";
import toast from "react-hot-toast";

export default function ChatWindow({ conversation }) {
  const { user } = useAuth();
  const { socket, isOnline } = useSocket();
  const other = conversation.otherUser;
  const convId = conversation._id;

  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const topRef = useRef(null);

  // Load initial messages
  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setInitialLoaded(false);
    loadMessages(null, true);
  }, [convId]);

  const loadMessages = async (cur, initial = false) => {
    if (initial) setInitialLoaded(false);
    else setLoadingMore(true);
    try {
      const { data } = await getMessages(convId, cur);
      setMessages((prev) => initial ? data.messages : [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
      setInitialLoaded(true);
      if (initial) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 50);
    } catch { toast.error("Failed to load messages"); }
    finally { setLoadingMore(false); }
  };

  // Socket events
  useEffect(() => {
    if (!socket) return;
    socket.emit("conversation:join", convId);
    socket.emit("message:read", { conversationId: convId });

    const onNew = ({ conversationId, message }) => {
      if (conversationId !== convId) return;
      setMessages((prev) => [...prev, message]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      socket.emit("message:read", { conversationId: convId });
    };

    const onTypingStart = ({ conversationId, userId }) => {
      if (conversationId === convId && userId !== user._id) setOtherTyping(true);
    };
    const onTypingStop = ({ conversationId, userId }) => {
      if (conversationId === convId && userId !== user._id) setOtherTyping(false);
    };
    const onRead = ({ conversationId }) => {
      if (conversationId === convId) {
        setMessages((prev) => prev.map((m) =>
          m.sender?._id === user._id || m.sender === user._id
            ? { ...m, readBy: [...new Set([...(m.readBy || []), other._id])] }
            : m
        ));
      }
    };

    socket.on("message:new", onNew);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("message:read", onRead);

    return () => {
      socket.emit("conversation:leave", convId);
      socket.off("message:new", onNew);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("message:read", onRead);
    };
  }, [socket, convId, user._id]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing:start", { conversationId: convId });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      socket.emit("typing:stop", { conversationId: convId });
    }, 1500);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    socket?.emit("typing:stop", { conversationId: convId });
    setTyping(false);
    try {
      const { data } = await sendMessage(convId, text);
      setMessages((prev) => [...prev, data.message]);
      // Broadcast via socket so other participant gets it instantly
      socket?.emit("message:send", { conversationId: convId, message: data.message });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
    } catch { toast.error("Failed to send"); setInput(text); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDeleteMessage = (msgId) => {
    setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, content: "", image: undefined } : m));
  };

  // Group messages: show avatar only for first in a sequence
  const grouped = messages.map((msg, i) => {
    const prev = messages[i - 1];
    const sameAuthor = prev && (prev.sender?._id === msg.sender?._id || prev.sender === msg.sender);
    return { ...msg, showAvatar: !sameAuthor };
  });

  const online = isOnline(other?._id);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="relative">
          <Avatar src={other?.avatar} name={other?.name} size="md" />
          {online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />}
        </div>
        <div>
          <Link to={`/profile/${other?.username}`} className="font-semibold text-sm text-gray-900 hover:underline">
            {other?.name}
          </Link>
          <p className="text-xs text-gray-400">{online ? "🟢 Online" : "Offline"}</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button onClick={() => loadMessages(cursor)} disabled={loadingMore}
              className="text-xs text-brand-600 hover:underline disabled:opacity-50">
              {loadingMore ? "Loading…" : "Load older messages"}
            </button>
          </div>
        )}

        {!initialLoaded ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Avatar src={other?.avatar} name={other?.name} size="xl" />
            <p className="font-semibold text-gray-800 mt-4">{other?.name}</p>
            <p className="text-sm text-gray-500 mt-1">{other?.headline || ""}</p>
            <p className="text-xs text-gray-400 mt-3">Send a message to start the conversation</p>
          </div>
        ) : (
          grouped.map((msg) => (
            <MessageBubble key={msg._id} message={msg} showAvatar={msg.showAvatar} onDeleted={handleDeleteMessage} />
          ))
        )}

        {/* Typing indicator */}
        {otherTyping && (
          <div className="flex items-end gap-2">
            <Avatar src={other?.avatar} name={other?.name} size="xs" />
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1 items-center h-9">
              {[0, 0.15, 0.3].map((delay, i) => (
                <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${other?.name}…`}
          rows={1}
          className="flex-1 resize-none text-sm border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent max-h-32 overflow-y-auto placeholder:text-gray-400"
          style={{ minHeight: "44px" }}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
            ${input.trim() ? "bg-brand-600 hover:bg-brand-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
