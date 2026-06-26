require("dotenv").config();
console.log("MONGODB_URI =", process.env.MONGODB_URI);
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const http = require("http");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { setupSocket } = require("./utils/socket");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const jobRoutes = require("./routes/jobRoutes");

const app = express();
const server = http.createServer(app);

// ─── Socket.io ─────────────────────────────────────────────────────────────
const io = setupSocket(server);
app.use((req, _, next) => { req.io = io; next(); });

// ─── Security headers ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
}));

app.set("trust proxy", 1); // Needed for correct IPs behind Render's proxy

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const createLimiter = (max, msg) => rateLimit({
  windowMs: 15 * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: msg },
  skip: (req) => process.env.NODE_ENV === "test",
});

app.use("/api", createLimiter(300, "Too many requests, please slow down."));
app.use("/api/auth/login", createLimiter(10, "Too many login attempts. Try again in 15 minutes."));
app.use("/api/auth/register", createLimiter(5, "Too many registrations from this IP."));

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined", {
    skip: (req) => req.url === "/api/health",
  }));
}

// ─── API Docs (dev only) ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "ConnectSphere API Docs",
    customCss: ".swagger-ui .topbar { background: #2563eb; }",
    swaggerOptions: { persistAuthorization: true },
  }));
  console.log("📖 Swagger docs: http://localhost:5000/api/docs");
}

// Serve raw spec for external tools
app.get("/api/docs.json", (_, res) => res.json(swaggerSpec));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/jobs", jobRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── 404 ────────────────────────────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => { console.error("Forced shutdown"); process.exit(1); }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
process.on("uncaughtException", (err) => { console.error("Uncaught Exception:", err); process.exit(1); });

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🚀 ConnectSphere API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`   API docs    : http://localhost:${PORT}/api/docs\n`);
    }
  });
};

start();
module.exports = { app, server };
