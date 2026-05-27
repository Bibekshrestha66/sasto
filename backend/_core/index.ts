import "dotenv/config";
if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
console.log("[Startup] NODE_ENV:", process.env.NODE_ENV);
console.log("[Startup] CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "SET" : "NOT SET");
console.log("[Startup] DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("[Startup] INNGEST_EVENT_KEY:", process.env.INNGEST_EVENT_KEY ? "SET" : "NOT SET");
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
import { seedCategories } from "../seeds/categories.seed";
import { uploadRouter } from "../upload";
import { inngestHandler } from "../inngest/index";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Content Security Policy
  app.use((_req, res, next) => {
    const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV || process.env.NODE_ENV === "test";
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://accounts.google.com https://*.clerk.accounts.dev https://clerk.sasto.com.np https://clerk.browser.js https://*.clerk.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://picsum.photos https://*.picsum.photos https://images.unsplash.com https://res.cloudinary.com https://*.amazonaws.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://placehold.co https://github.com https://*.githubusercontent.com https://*.googleusercontent.com https://via.placeholder.com https://img.clerk.com https://clerk.com",
      `connect-src 'self' ${isDev ? "ws: wss:" : ""} https://accounts.google.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.sasto.com.np https://clerk.browser.js`,
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src https://accounts.google.com https://*.clerk.accounts.dev https://clerk.sasto.com.np https://*.clerk.com",
      "worker-src 'self' blob:",
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

  // Initialize Inngest Background Jobs Handler
  app.use("/api/inngest", inngestHandler);
  console.log("[Inngest] Background jobs endpoint mounted on /api/inngest");

  // Initialize PayloadCMS v3 via Local API
  // The admin UI requires Next.js; here we initialize the Local API for server-side CMS operations.
  try {
    const { getPayload } = await import("payload");
    const payloadConfigModule = await import("../../payload.config");
    const payloadInstance = await getPayload({ config: payloadConfigModule.default });
    // Expose payload on app.locals for use in routes
    (app as any).locals.payload = payloadInstance;
    console.info("[CMS] Payload CMS v3 Local API initialized successfully");
  } catch (err) {
    console.warn("[CMS] Payload CMS failed to initialize (non-fatal):", (err as Error).message);
  }

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
    res.status(500).send("Force login disabled — Clerk login required");
  });

  // Debug endpoint to verify environment configuration
  app.get("/api/debug/config", (_req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ error: "Not available in production" });
    }
    res.json({
      NODE_ENV: process.env.NODE_ENV,
      VITE_APP_URL: process.env.VITE_APP_URL,
      VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || "NOT SET",
      VITE_APP_ID: process.env.VITE_APP_ID,
    });
  });

  // Simple dev-only endpoint to check the authenticated user from TRPC context
  app.get("/api/debug/me", async (req, res) => {
    return res.json({ message: "Clerk-based authentication debug" });
  });

  // Dev-only: verify the raw session cookie using authService.verifySession
  app.get('/api/debug/verify-token', async (req, res) => {
    return res.json({ message: "Clerk token verification required via Authorization header" });
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

  try {
    console.log("[Startup] Ensuring category taxonomy is seeded.");
    await seedCategories();
  } catch (err) {
    console.warn("[Startup] Category seeding failed:", err);
  }

  listen(preferredPort, 20);
}

startServer().catch(console.error);
