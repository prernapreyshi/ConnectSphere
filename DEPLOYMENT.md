# Deployment Guide — ConnectSphere

Full step-by-step guide to deploy ConnectSphere to production:
- **Backend** → Render (free tier)
- **Database** → MongoDB Atlas (free tier M0)
- **Frontend** → Vercel (free tier)
- **Images** → Cloudinary (free tier)

---

## 1. MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free account
2. Create a new **M0 Free** cluster → Region: Singapore (closest to India)
3. **Database Access** → Add user with password → note the credentials
4. **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere for Render)
5. Click **Connect** → **Drivers** → copy the connection string
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/connectsphere
   ```

---

## 2. Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com) → Create free account
2. Dashboard → copy: **Cloud Name**, **API Key**, **API Secret**

---

## 3. Backend → Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo → select the `backend` folder as **Root Directory**
4. Settings:
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Region**: Singapore
5. Add environment variables (from your `.env.production.example`):
   ```
   NODE_ENV=production
   MONGODB_URI=...
   JWT_ACCESS_SECRET=<run: openssl rand -base64 64>
   JWT_REFRESH_SECRET=<run: openssl rand -base64 64>
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   CLIENT_URL=https://your-app.vercel.app
   SMTP_USER=your@gmail.com
   SMTP_PASS=your_app_password
   ```
6. Deploy → note your Render URL: `https://connectsphere-api.onrender.com`
7. Copy the **Deploy Hook URL** (Settings → Deploy Hook) → save for GitHub Actions secret

---

## 4. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
2. **Root Directory**: `frontend`
3. **Framework**: Vite
4. Add Environment Variables:
   ```
   VITE_API_URL=https://connectsphere-api.onrender.com/api
   VITE_SOCKET_URL=https://connectsphere-api.onrender.com
   ```
5. Deploy → note your Vercel URL

6. **Important**: Go back to Render → update `CLIENT_URL` to your Vercel URL → redeploy backend

---

## 5. GitHub Actions Secrets

In your GitHub repo → Settings → Secrets → Actions → add:

| Secret | Value |
|--------|-------|
| `RENDER_DEPLOY_HOOK_URL` | From Render Settings → Deploy Hook |
| `VERCEL_TOKEN` | From Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` after `vercel link` |

After this, every push to `main` will auto-deploy both services.

---

## 6. Gmail App Password (for email notifications)

1. Google Account → Security → 2-Step Verification → ON
2. Security → App Passwords → Select app: Mail → Generate
3. Copy the 16-character password → use as `SMTP_PASS`

---

## 7. Post-deploy Checklist

- [ ] Visit `https://your-api.onrender.com/api/health` → should return `{ status: "healthy" }`
- [ ] Visit `https://your-app.vercel.app` → should show login page
- [ ] Register a user → check MongoDB Atlas for new document
- [ ] Upload an avatar → check Cloudinary dashboard
- [ ] Create a post → verify it appears in feed
- [ ] Open two browsers → test real-time messaging
- [ ] Check email notifications arrive

---

## Render Free Tier Notes

- Free instances **spin down after 15 minutes of inactivity** (cold start ~30s)
- Upgrade to Render Starter ($7/month) to keep it always on for demos
- Or use [UptimeRobot](https://uptimerobot.com) to ping `/api/health` every 10 minutes (free)

---

## Custom Domain (optional)

- **Vercel**: Settings → Domains → Add your domain → update DNS
- **Render**: Settings → Custom Domain → follow DNS instructions

