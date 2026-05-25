# Vercel Deployment Guide

## Overview
This guide covers migrating from SQLite to a managed database and handling WebSockets for Vercel deployment.

---

## 1. Database Migration: SQLite → Postgres

### Why
- Vercel's ephemeral filesystem means SQLite data is lost on each deployment
- Managed Postgres provides persistence and scalability

### Steps

#### 1a. Update `package.json`
Add Postgres adapter:
```bash
npm install pg
npm install -D @types/pg
```

Then remove `better-sqlite3`:
```bash
npm uninstall better-sqlite3
npm uninstall -D @types/better-sqlite3
```

#### 1b. Update `backend/db.ts`

Replace:
```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const sqlite = new Database("sqlite.db");
const _db = drizzle(sqlite, { schema });
```

With:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL env var is required");
}

const client = postgres(connectionString);
const _db = drizzle(client, { schema });
```

#### 1c. Add environment variables

In your `.env` or Vercel settings:
```env
DATABASE_URL=postgresql://user:password@host:5432/database_name
```

For Vercel, the DATABASE_URL should be from a managed service like:
- **Vercel Postgres** (integrated)
- **Supabase** (free tier available)
- **Railway.app**
- **PlanetScale** (MySQL alternative)

#### 1d. Run migrations
```bash
npm run db:push
```

---

## 2. WebSocket Architecture for Vercel

### Problem
Vercel Serverless Functions don't support long-lived WebSocket connections. The current raw Express WebSocket server won't work.

### Solutions

#### Option A: Socket.io Cloud (Recommended for simplicity)
- **Pros:** Managed, easy integration, no additional infrastructure
- **Cons:** Paid service (~$20-100/month)
- **Setup:**
  1. Sign up at https://socket.io/
  2. Install client/server SDK
  3. Connect your app to Socket.io cloud servers
  4. Real-time sync works across serverless instances

#### Option B: Separate WebSocket Server (Railway/Render)
- **Pros:** Full control, cheaper (~$5-10/month)
- **Cons:** Requires separate deployment and management
- **Setup:**
  1. Extract WebSocket logic into a standalone service
  2. Deploy to Railway.app or Render.com
  3. Frontend connects to WebSocket service URL
  4. Backend and WebSocket service communicate via Redis Pub/Sub

#### Option C: Move to Full-Stack Platform (Next.js on Vercel with WebSocket)
- **Pros:** Integrated, fewer moving parts
- **Cons:** Major refactor
- **Platforms:** Vercel + Next.js API Routes, AWS Lambda, Railway monolith

### Recommended: Option B (Railway for WebSocket service)

#### Steps:

**1. Create a WebSocket service:**

New file: `websocket-service/index.ts`
```typescript
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const PORT = process.env.PORT || 3001;
const server = createServer();
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);
  
  socket.on("join_chat", (data) => {
    socket.join(data.sessionId);
  });
  
  socket.on("message", (data) => {
    io.to(data.sessionId).emit("message", data);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
```

**2. Deploy WebSocket service to Railway:**
- Push code to GitHub
- Connect GitHub repo to Railway
- Set environment variables (FRONTEND_URL, etc.)
- Railway assigns a public URL

**3. Update main app to use remote WebSocket:**

In `backend/_core/index.ts`, replace WebSocket initialization:
```typescript
// Instead of: initializeWebSocket(server);
// Use:
const WEBSOCKET_URL = process.env.WEBSOCKET_SERVICE_URL;
// Frontend/client connects directly to WEBSOCKET_URL instead of same-origin WebSocket
```

**4. Frontend connects to remote WebSocket:**

In `frontend/src/hooks/useWebSocket.ts`:
```typescript
const socket = io(process.env.VITE_WEBSOCKET_URL || "http://localhost:3001", {
  reconnection: true,
  reconnectionDelay: 1000,
});
```

---

## 3. Vercel Environment Variables

Add to Vercel Project Settings:

| Variable | Example Value |
|----------|---------------|
| `DATABASE_URL` | `postgresql://...` |
| `VITE_WEBSOCKET_URL` | `https://websocket-service-*.railway.app` |
| `JWT_SECRET` | (your secret) |
| `VITE_GOOGLE_CLIENT_ID` | (Google OAuth) |
| `GOOGLE_CLIENT_ID` | (same as above) |
| `VITE_APP_URL` | `https://your-app.vercel.app` |
| `RESEND_API_KEY` | (Resend email) |
| `CLOUDINARY_CLOUD_NAME` | (Image upload) |
| `CLOUDINARY_API_KEY` | (Image upload) |
| `CLOUDINARY_API_SECRET` | (Image upload) |
| `MESSAGE_ENCRYPTION_KEY` | (Message encryption) |
| `OWNER_OPEN_ID` | (Admin user ID) |
| `OAUTH_SERVER_URL` | (OAuth provider) |
| `VITE_APP_ID` | (App ID) |
| `BUILT_IN_FORGE_API_URL` | (Map service) |
| `BUILT_IN_FORGE_API_KEY` | (Map service) |

---

## 4. Deployment Checklist

- [ ] Add `pg` package and remove `better-sqlite3`
- [ ] Update `backend/db.ts` to use Postgres adapter
- [ ] Create managed Postgres instance (Vercel Postgres / Supabase / Railway)
- [ ] Add `DATABASE_URL` to Vercel env vars
- [ ] Run `npm run db:push` to migrate schema
- [ ] Choose WebSocket solution (Option A/B/C)
- [ ] Deploy WebSocket service if using Option B
- [ ] Add `VITE_WEBSOCKET_URL` to Vercel env vars
- [ ] Update frontend WebSocket client URL
- [ ] Test full app flow on Vercel staging
- [ ] Deploy to production

---

## 5. Testing Locally

To test Postgres locally before Vercel:
```bash
# Using Docker
docker run -e POSTGRES_PASSWORD=test -p 5432:5432 postgres

# Set .env
DATABASE_URL="postgresql://postgres:test@localhost:5432/sasto"

# Run migrations
npm run db:push

# Start app
npm run dev
```

---

## Support
For issues, check:
- Vercel logs: `vercel logs`
- Railway logs (for WebSocket service)
- Drizzle documentation for your adapter
- Socket.io documentation for real-time sync
