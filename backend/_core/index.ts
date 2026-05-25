import "dotenv/config";
if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
console.log("[Startup] NODE_ENV:", process.env.NODE_ENV);
console.log("[Startup] VITE_GOOGLE_CLIENT_ID:", process.env.VITE_GOOGLE_CLIENT_ID ? "SET" : "NOT SET");
console.log("[Startup] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET");
import express from "express";
import { createServer } from "http";
import os from "os";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import rateLimit from "express-rate-limit";
import { authService } from "./authService";
import { appRouter } from "../routers/index";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWebSocket } from "../websocket";
import { getSessionCookieOptions } from "./cookies";
import { parse as parseCookie } from 'cookie';
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./env";
import * as db from "../db";
import * as schema from "../../drizzle/schema";
import { uploadRouter } from "../upload";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Content Security Policy
  app.use((_req, res, next) => {
    const isDev = process.env.NODE_ENV === "development";
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://accounts.google.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://picsum.photos https://*.picsum.photos https://images.unsplash.com https://res.cloudinary.com https://*.amazonaws.com https://placehold.co https://github.com https://*.githubusercontent.com https://via.placeholder.com",
      `connect-src 'self' ${isDev ? "ws: wss:" : ""} https://accounts.google.com`,
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isDev ? [] : ["upgrade-insecure-requests"])
    ];
    res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
    next();
  });

  // Initialize WebSocket
  const wsManager = initializeWebSocket(server);
  console.log("[WebSocket] Initialized");

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Rate limiting for API routes
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === "development" ? 1000 : 100, // much higher limit in dev
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 1 minute",
  });

  app.use("/api/trpc", limiter);

  // Image upload router
  app.use("/api/upload", uploadRouter);

  // Edge Server & Security Hardening
  app.use((req, res, next) => {
    if (req.path.includes("cart.") || req.path.includes("transactions.") || req.path.includes("auth.")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  // Strict rate limit for checkout
  const checkoutLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // max 5 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many checkout attempts, please try again later.",
  });
  
  // Need to apply rate limit specifically to the TRPC checkout path if possible,
  // but since TRPC combines paths in query params or url structure (e.g. /api/trpc/transactions.checkoutCart),
  // we apply it based on route pattern matching in a generic middleware
  app.use("/api/trpc/*checkoutCart*", checkoutLimiter);

  // Generic Logistics Webhook
  app.post("/api/webhooks/logistics", async (req, res) => {
    try {
      const payload = req.body;
      const trackingNumber = payload.tracking_number || payload.trackingNumber || payload.id;
      const status = payload.status;
      
      if (!trackingNumber) {
        return res.status(400).send("Missing tracking number");
      }

      let mappedStatus = "placed";
      if (status && (status.toLowerCase().includes('deliver') || status === 'COMPLETED')) {
        mappedStatus = "delivered";
      } else if (status && (status.toLowerCase().includes('ship') || status === 'IN_TRANSIT')) {
        mappedStatus = "shipped";
      }

      if (mappedStatus === 'delivered' || mappedStatus === 'shipped') {
        const updateData: any = { status: mappedStatus, updatedAt: new Date() };
        if (mappedStatus === 'delivered') updateData.deliveredAt = new Date();
        if (mappedStatus === 'shipped') updateData.shippedAt = new Date();

        const { eq } = require('drizzle-orm');
        await db.db.update(schema.transactions)
          .set(updateData)
          .where(eq(schema.transactions.trackingNumber, trackingNumber));
      }
      
      res.status(200).send("Webhook received");
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).send("Webhook processing failed");
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Dev backdoor to login as super admin
  app.get("/api/dev/force-login", async (req, res) => {
    try {
      const openId = ENV.ownerOpenId;
      const name = "Bibek Shrestha"; // Using the name from todo.md

      await db.upsertUser({
        openId,
        name,
        email: "bibekshrestha66@gmail.com",
        lastSignedIn: new Date(),
      });

      const token = await authService.createSessionToken(openId, { name });
      const cookieOptions = getSessionCookieOptions(req as any);
      res.cookie(COOKIE_NAME, token, cookieOptions);
      console.log(`[Dev] Forced login for ${name} (${openId})`);
      res.redirect("/super-admin/dashboard");
    } catch (err) {
      console.error("[Dev] Force login failed:", err);
      res.status(500).send("Force login failed");
    }
  });

  // Debug endpoint to verify environment configuration
  app.get("/api/debug/config", (_req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ error: "Not available in production" });
    }
    // Return what the frontend would see via import.meta.env
    res.json({
      NODE_ENV: process.env.NODE_ENV,
      VITE_APP_URL: process.env.VITE_APP_URL,
      VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || "NOT SET",
      VITE_APP_ID: process.env.VITE_APP_ID,
      // Backend-only configs
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "***" : "NOT SET",
      COOKIE_SECRET: process.env.COOKIE_SECRET ? "***" : "NOT SET",
    });
  });

  // Simple dev-only endpoint to check the authenticated user from TRPC context
  app.get("/api/debug/me", async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ error: "Not available in production" });
    }
    try {
      const ctx = await createContext({ req, res } as any);
      return res.json({ user: ctx.user });
    } catch (err) {
      console.error("/api/debug/me error:", err);
      return res.status(500).json({ error: String(err) });
    }
  });

  // Dev-only: verify the raw session cookie using authService.verifySession
  app.get('/api/debug/verify-token', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Not available in production' });
    }
    try {
      const cookieHeader = req.headers.cookie || '';
      const parsed = parseCookie(cookieHeader || '');
      const token = parsed[COOKIE_NAME];
      const result = await authService.verifySession(token);
      return res.json({ tokenSnippet: token ? token.slice(0, 60) : null, session: result });
    } catch (err) {
      console.error('/api/debug/verify-token error:', err);
      return res.status(500).json({ error: String(err) });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Make WebSocket manager available globally
  (global as any).wsManager = wsManager;

  const preferredPort = parseInt(process.env.PORT || "3000");

  // Get local IP address dynamically
  const interfaces = os.networkInterfaces();
  let localIp = "localhost";
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // Skip over internal and non-ipv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
  }

  const listen = (port: number, attemptsLeft: number) => {
    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
        console.log(`Port ${port} is busy, trying ${port + 1} instead`);
        listen(port + 1, attemptsLeft - 1);
        return;
      }

      throw error;
    });

    server.listen(port, "0.0.0.0", () => {
      console.log(`Server running on:`);
      console.log(`  - Local:   http://localhost:${port}/`);
      console.log(`  - Network: http://${localIp}:${port}/`);
      console.log(`[WebSocket] Available at ws://${localIp}:${port}`);
    });
  };

  listen(preferredPort, 20);
}

startServer().catch(console.error);
