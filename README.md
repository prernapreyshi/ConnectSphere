# ConnectSphere 🌐

> A full-stack professional networking platform built with React, Node.js & MongoDB.
> Built as a Final Year Project — production-ready, fully deployed.

![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?logo=socket.io)
![License](https://img.shields.io/badge/license-MIT-blue)
![CI](https://img.shields.io/github/actions/workflow/status/yourusername/connectsphere/ci.yml?label=CI)

## 🚀 Live Demo

- **Frontend**: https://connectsphere.vercel.app
- **API**: https://connectsphere-api.onrender.com
- **API Docs**: https://connectsphere-api.onrender.com/api/docs (dev only)

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔐 **Auth** | JWT access + refresh tokens, bcrypt, httpOnly cookie, auto-refresh |
| 👤 **Profiles** | Avatar upload, bio, skills, experience, education |
| 🤝 **Connections** | Connect/follow system with request/accept flow |
| 📝 **Posts** | Create with images, like, comment, repost, hashtags |
| ♾️ **Feed** | Infinite scroll, cursor-based pagination |
| 💬 **Real-time DMs** | Socket.io messaging, typing indicators, read receipts |
| 🔔 **Notifications** | Real-time bell + email alerts (Nodemailer) |
| 💼 **Jobs Board** | Post listings, filter by type/experience, one-click apply |
| 📄 **PDF Resume** | Auto-generated from profile (Puppeteer) |
| 🔒 **Security** | Helmet, rate limiting, input validation, CORS |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Tailwind CSS, React Query, Socket.io-client |
| **Backend** | Node.js 20, Express.js, Socket.io, Multer, Puppeteer |
| **Database** | MongoDB Atlas, Mongoose |
| **Auth** | JWT (access + refresh), bcrypt, cookie-parser |
| **Storage** | Cloudinary (images), PDF generated server-side |
| **Email** | Nodemailer (Gmail / SMTP) |
| **DevOps** | GitHub Actions CI/CD, Vercel (frontend), Render (backend) |
| **API Docs** | Swagger / OpenAPI 3.0 |

---

## 📁 Project Structure

```
connectsphere/
├── .github/workflows/       # CI + auto-deploy
│   ├── ci.yml
│   └── deploy.yml
├── backend/
│   ├── config/              # DB, Cloudinary, Swagger
│   ├── controllers/         # auth, user, post, message, notification, job, resume
│   ├── middleware/          # auth guard, error handler
│   ├── models/              # User, Post, Conversation, Message, Notification, Job
│   ├── routes/              # All API routes with Swagger JSDoc
│   ├── utils/               # JWT, socket, email helpers
│   ├── .env.example
│   ├── render.yaml
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/             # axios, authApi, userApi, postApi, messageApi, notificationApi, jobApi
│       ├── components/
│       │   ├── common/      # Avatar, UserCard, ProtectedRoute
│       │   ├── layout/      # Navbar (global)
│       │   ├── messages/    # ConversationList, ChatWindow, MessageBubble
│       │   ├── post/        # CreatePost, PostCard, RepostModal
│       │   └── profile/     # EditProfileModal, ExperienceModal
│       ├── context/         # AuthContext, SocketContext
│       ├── hooks/           # useInfiniteScroll
│       ├── pages/
│       │   ├── auth/        # LoginPage, RegisterPage
│       │   ├── errors/      # NotFoundPage
│       │   ├── explore/     # ExplorePage (hashtag filtering)
│       │   ├── feed/        # FeedPage
│       │   ├── jobs/        # JobsPage, PostJobModal
│       │   ├── messages/    # MessagesPage
│       │   ├── profile/     # ProfilePage
│       │   └── settings/    # SettingsPage
│       └── utils/
│   ├── .env.example
│   └── vercel.json
├── DEPLOYMENT.md
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free)
- Cloudinary account (free)

### 1. Clone & setup

```bash
git clone https://github.com/yourusername/connectsphere.git
cd connectsphere
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in MongoDB URI, JWT secrets, Cloudinary keys
npm install
npm run dev
# → http://localhost:5000
# → http://localhost:5000/api/docs  (Swagger)
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
npm install
npm run dev
# → http://localhost:5173
```

---

## 🌍 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step guide covering:
- MongoDB Atlas setup
- Render (backend) deployment
- Vercel (frontend) deployment
- GitHub Actions CI/CD secrets
- Gmail App Password for emails
- Custom domain setup

---

## 📖 API Documentation

Swagger UI available at `/api/docs` in development.

Key endpoints:

```
POST   /api/auth/register        Register
POST   /api/auth/login           Login
GET    /api/auth/me              Current user

GET    /api/users/:username      Public profile
PUT    /api/users/profile        Update own profile
PUT    /api/users/avatar         Upload avatar
POST   /api/users/:id/connect    Send connection request
GET    /api/users/search?q=      Search users

GET    /api/posts/feed           Paginated feed
POST   /api/posts                Create post
PUT    /api/posts/:id/like       Toggle like
POST   /api/posts/:id/comments   Add comment
POST   /api/posts/:id/repost     Repost

GET    /api/messages/conversations       Conversations list
POST   /api/messages/conversations       Open conversation
GET    /api/messages/conversations/:id  Get messages
POST   /api/messages/conversations/:id  Send message

GET    /api/notifications        Get notifications
PUT    /api/notifications/read-all  Mark all read

GET    /api/jobs                 List jobs
POST   /api/jobs                 Post job
POST   /api/jobs/:id/apply       Apply for job

GET    /api/users/:username/resume  Download PDF resume
```

---

## 🔒 Security Features

- JWT access tokens (15 min) + refresh tokens (7 days) in httpOnly cookies
- bcrypt password hashing (cost factor 12)
- Helmet.js security headers
- Rate limiting: 300 req/15min general, 10/15min for login, 5/15min for register
- CORS whitelist
- MongoDB injection prevention via Mongoose validators
- Input validation on all endpoints
- Graceful error handling (no stack traces in production)

---

## 📱 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `message:send` | Client → Server | Send DM |
| `message:new` | Server → Client | Receive DM |
| `typing:start/stop` | Bidirectional | Typing indicator |
| `message:read` | Bidirectional | Read receipt |
| `user:online/offline` | Server → Client | Presence |
| `notification:new` | Server → Client | Real-time notification |

---

## Development Phases

- [x] Phase 1 — Project setup & JWT authentication
- [x] Phase 2 — User profiles, connections, PDF resume
- [x] Phase 3 — Posts, feed, likes, comments, reposts
- [x] Phase 4 — Real-time messaging (Socket.io)
- [x] Phase 5 — Notifications, jobs board, global navbar
- [x] Phase 6 — Deployment, CI/CD, Swagger docs, production hardening

---

## License

MIT © 2024 ConnectSphere
