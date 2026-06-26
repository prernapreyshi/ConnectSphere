const { Server } = require("socket.io");
const { verifyAccessToken } = require("./jwt");
const User = require("../models/User");

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Unauthorized: no token"));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select("name username avatar");
      if (!user) return next(new Error("Unauthorized: user not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  // Emit real-time notification to a user
  io.sendNotification = (recipientId, notification) => {
    io.to(`user:${recipientId}`).emit("notification:new", notification);
  };

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

    // --- Online presence ---
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Broadcast online status to all
    socket.broadcast.emit("user:online", { userId });

    // Send current online list to newly connected user
    socket.emit("online:list", getOnlineUserIds());

    // --- Join personal room for targeted events ---
    socket.join(`user:${userId}`);

    // --- Join a conversation room ---
    socket.on("conversation:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`${socket.user.username} joined conversation ${conversationId}`);
    });

    // --- Leave a conversation room ---
    socket.on("conversation:leave", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // --- Real-time message ---
    socket.on("message:send", async (data) => {
      const { conversationId, message } = data;
      if (!conversationId || !message) return;

      // Broadcast message to everyone in the conversation room (except sender)
      socket.to(`conversation:${conversationId}`).emit("message:new", {
        conversationId,
        message,
      });

      // Also push to other participant's personal room if not in conversation
      // (for notification badge update)
      const Conversation = require("../models/Conversation");
      const conv = await Conversation.findById(conversationId).select("participants");
      if (conv) {
        conv.participants.forEach((p) => {
          const pid = p.toString();
          if (pid !== userId) {
            io.to(`user:${pid}`).emit("message:notification", {
              conversationId,
              message,
              senderName: socket.user.name,
              senderAvatar: socket.user.avatar,
            });
          }
        });
      }
    });

    // --- Typing indicators ---
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
        name: socket.user.name,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });

    // --- Read receipt ---
    socket.on("message:read", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("message:read", {
        conversationId,
        readBy: userId,
      });
    });

    // --- Disconnect ---
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("user:offline", { userId });
        }
      }
      console.log(`Socket disconnected: ${socket.user.username}`);
    });
  });

  return io;
};

module.exports = { setupSocket, getOnlineUserIds };
