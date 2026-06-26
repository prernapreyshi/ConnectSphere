import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getNotifications, markAllRead, markRead } from "../../api/notificationApi";
import { searchUsers } from "../../api/userApi";
import Avatar from "../common/Avatar";
import toast from "react-hot-toast";

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const notifIcon = (type) => ({ like: "❤️", comment: "💬", connection_request: "🤝",
  connection_accept: "✅", repost: "🔁", follow: "👤" }[type] || "🔔");

const notifText = (n) => {
  const name = n.sender?.name || "Someone";
  return { like: `${name} liked your post`, comment: `${name} commented on your post`,
    connection_request: `${name} sent you a connection request`,
    connection_accept: `${name} accepted your connection request`,
    repost: `${name} reposted your post`, follow: `${name} started following you` }[n.type] || n.type;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications().then((r) => r.data),
    refetchInterval: 60000,
  });

  const unread = notifData?.unreadCount || 0;
  const notifications = notifData?.notifications || [];

  // Real-time notification socket
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      qc.invalidateQueries(["notifications"]);
      toast(notifText(notif), { icon: notifIcon(notif.type), duration: 4000 });
    };
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [socket, qc]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (searchQ.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await searchUsers(searchQ);
        setSearchResults(data.users.slice(0, 5));
      } catch {} finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchQ]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    qc.invalidateQueries(["notifications"]);
  };

  const handleNotifClick = async (n) => {
    await markRead(n._id);
    qc.invalidateQueries(["notifications"]);
    setShowNotifs(false);
    if (n.post) navigate(`/feed`);
    else if (n.sender) navigate(`/profile/${n.sender.username}`);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const navItems = [
    { to: "/feed", icon: "🏠", label: "Home" },
    { to: "/jobs", icon: "💼", label: "Jobs" },
    { to: "/messages", icon: "💬", label: "Messaging" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
        {/* Logo */}
        <Link to="/feed" className="flex items-center gap-2 flex-shrink-0 mr-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-gray-900 hidden lg:block text-lg tracking-tight">ConnectSphere</span>
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="relative">
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              onBlur={() => setTimeout(() => setSearchResults([]), 200)}
              placeholder="Search people…"
              className="w-full input text-sm pl-9 py-1.5 bg-gray-50" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          </div>
          {/* Dropdown results */}
          {(searchResults.length > 0 || searching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {searching ? (
                <div className="p-3 text-center text-xs text-gray-400">Searching…</div>
              ) : (
                searchResults.map((u) => (
                  <Link key={u._id} to={`/profile/${u.username}`}
                    onMouseDown={() => setSearchQ("")}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.headline || `@${u.username}`}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex items-center ml-auto">
          {navItems.map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className={`flex flex-col items-center px-4 py-1 text-xs rounded-lg transition-colors min-w-[56px]
                ${isActive(to) ? "text-brand-600 border-b-2 border-brand-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
              <span className="text-xl leading-none mb-0.5">{icon}</span>
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}

          {/* Notifications bell */}
          <div ref={notifRef} className="relative">
            <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
              className="relative flex flex-col items-center px-4 py-1 text-xs rounded-lg transition-colors min-w-[56px] text-gray-500 hover:text-gray-800 hover:bg-gray-50">
              <span className="text-xl leading-none mb-0.5">🔔</span>
              <span className="hidden sm:block">Notifications</span>
              {unread > 0 && (
                <span className="absolute top-0 right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {unread > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-brand-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">No notifications yet</div>
                  ) : notifications.map((n) => (
                    <button key={n._id} onClick={() => handleNotifClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left
                        ${!n.read ? "bg-brand-50/50" : ""}`}>
                      <div className="relative flex-shrink-0 mt-0.5">
                        <Avatar src={n.sender?.avatar} name={n.sender?.name} size="sm" />
                        <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">
                          {notifIcon(n.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.read ? "font-medium text-gray-900" : "text-gray-700"}`}>
                          {notifText(n)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-brand-600 rounded-full flex-shrink-0 mt-1.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile menu */}
          <div ref={profileRef} className="relative ml-1">
            <button onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
              className="flex flex-col items-center px-3 py-1 text-xs rounded-lg transition-colors text-gray-500 hover:text-gray-800 hover:bg-gray-50 min-w-[56px]">
              <Avatar src={user?.avatar} name={user?.name} size="sm" className="mb-0.5" />
              <span className="hidden sm:flex items-center gap-0.5">Me <span className="text-gray-400">▾</span></span>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.headline || user?.email}</p>
                </div>
                <div className="py-1">
                  {[
                    { to: `/profile/${user?.username}`, label: "View profile" },
                    { to: "/jobs/my", label: "My jobs" },
                    { to: "/settings", label: "Settings" },
                  ].map(({ to, label }) => (
                    <Link key={to} to={to} onClick={() => setShowProfile(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={() => { logout(); setShowProfile(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
