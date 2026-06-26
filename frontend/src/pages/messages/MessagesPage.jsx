import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getConversations, getOrCreateConversation } from "../../api/messageApi";
import Avatar from "../../components/common/Avatar";
import ConversationList from "../../components/messages/ConversationList";
import ChatWindow from "../../components/messages/ChatWindow";
import toast from "react-hot-toast";

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [activeConv, setActiveConv] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // "list" | "chat"
  const [searchQ, setSearchQ] = useState("");

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversations().then((r) => r.data.conversations),
    refetchInterval: 30000,
  });

  // Auto-open conversation if ?userId= param is present
  useEffect(() => {
    const userId = params.get("userId");
    if (userId && !activeConv) {
      getOrCreateConversation(userId)
        .then(({ data }) => {
          setActiveConv(data.conversation);
          setMobileView("chat");
          qc.invalidateQueries(["conversations"]);
        })
        .catch(() => toast.error("Could not open conversation"));
    }
  }, [params]);

  // Listen for new message notifications to refresh conversation list
  useEffect(() => {
    if (!socket) return;
    const handler = () => qc.invalidateQueries(["conversations"]);
    socket.on("message:notification", handler);
    return () => socket.off("message:notification", handler);
  }, [socket, qc]);

  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    setMobileView("chat");
    // Optimistically clear unread badge
    qc.setQueryData(["conversations"], (old) =>
      old?.map((c) => c._id === conv._id ? { ...c, unread: 0 } : c)
    );
  };

  const filtered = conversations?.filter((c) =>
    !searchQ || c.otherUser?.name.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/feed" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">ConnectSphere</span>
          </Link>
          <h1 className="font-semibold text-gray-800">Messaging</h1>
          <Link to="/feed" className="ml-auto text-sm text-gray-500 hover:text-gray-700">← Feed</Link>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden max-w-6xl mx-auto w-full">
        {/* Conversations sidebar */}
        <aside className={`w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0
          ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-gray-100">
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search conversations…"
              className="input text-sm py-1.5" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ConversationList conversations={filtered} activeId={activeConv?._id} onSelect={handleSelectConv} />
            )}
          </div>
        </aside>

        {/* Chat area */}
        <main className={`flex-1 flex flex-col overflow-hidden
          ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
          {activeConv ? (
            <>
              {/* Mobile back button */}
              <button onClick={() => setMobileView("list")}
                className="md:hidden flex items-center gap-2 px-4 py-2 text-sm text-brand-600 bg-white border-b border-gray-100">
                ← Back to messages
              </button>
              <ChatWindow key={activeConv._id} conversation={activeConv} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">💬</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your messages</h2>
              <p className="text-gray-500 text-sm max-w-xs">
                Select a conversation from the left, or go to someone's profile and click "Message".
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
