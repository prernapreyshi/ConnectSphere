import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem("accessToken");
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => { setConnected(true); });
    socket.on("disconnect", () => { setConnected(false); });

    socket.on("online:list", (ids) => setOnlineUsers(ids));
    socket.on("user:online", ({ userId }) => setOnlineUsers((prev) => [...new Set([...prev, userId])]));
    socket.on("user:offline", ({ userId }) => setOnlineUsers((prev) => prev.filter((id) => id !== userId)));

    return () => { socket.disconnect(); socketRef.current = null; setConnected(false); };
  }, [isAuthenticated, user]);

  const isOnline = (userId) => onlineUsers.includes(userId?.toString());

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
};
