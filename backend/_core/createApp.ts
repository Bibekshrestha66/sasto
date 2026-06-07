import express, { type Express } from "express";
import cors from "cors";
import type { Server } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import rateLimit from "express-rate-limit";
import { appRouter } from "../routers/index";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWebSocket } from "../websocket";
import { writeDebugLog } from "./debugLog";
import * as db from "../db";
import * as schema from "../../drizzle/schema";
import { seedCategories } from "../seeds/categories.seed";
import { uploadRouter } from "../upload";
import { inngestHandler } from "../inngest/index";
import { restRouter } from "../rest";

export type AppMode = "development" | "production" | "serverless";

export type CreateAppOptions = {
  mode: AppMode;
  httpServer?: Server;
};

export type CreateAppResult = {
  app: Express;
  ready: Promise<void>;
};

export async function createApp(options: CreateAppOptions): Promise<CreateAppResult> {
  const { mode, httpServer } = options;
  const app = express();
  app.set('trust proxy', 1);
  
  // Prevent Express from processing socket.io paths so it doesn't trigger 404 handlers while polling
  app.use("/socket.io", (req, res, next) => {
    // Socket.io handles this at the http server level. Stop Express middleware chain.
  });
  app.use(cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://sasto-ochre.vercel.app",
      "https://sasto-yqdw.onrender.com"
    ],
    credentials: true,
  }));
  const isDev = mode === "development";

  // #region agent log
  writeDebugLog({
    sessionId: "90368c",
    runId: "debug_pre",
    hypothesisId: "H1_env",
    location: "backend/_core/createApp.ts:createApp",
    message: "App bootstrap",
    data: {
      mode,
      NODE_ENV: process.env.NODE_ENV || null,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      CLERK_SECRET_KEY_SET: !!process.env.CLERK_SECRET_KEY,
      VERCEL: !!process.env.VERCEL,
    },
    timestamp: Date.now(),
  });
  // #endregion

  app.use((_req, res, next) => {
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
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ];
    res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
    next();
  });

  // #region agent log
  app.use((req, _res, next) => {
    writeDebugLog({
      sessionId: "90368c",
      runId: "debug_pre",
      hypothesisId: "H6_request_path",
      location: "backend/_core/createApp.ts:request_entry",
      message: "Incoming request",
      data: {
        method: req.method,
        path: req.originalUrl || req.url,
      },
      timestamp: Date.now(),
    });
    next();
  });
  // #endregion

  if (mode !== "serverless" && httpServer) {
    const wsManager = initializeWebSocket(httpServer);
    (global as any).wsManager = wsManager;
    console.log("[WebSocket] Initialized");
  } else {
    console.log("[WebSocket] Skipped (serverless / no HTTP server)");
  }

  app.use("/api/inngest", inngestHandler);
  app.use("/api", restRouter);

  if (mode !== "serverless") {
    try {
      const { getPayload } = await import("payload");
      const payloadConfigModule = await import("../../payload.config");
      const payloadInstance = await getPayload({ config: payloadConfigModule.default });
      (app as any).locals.payload = payloadInstance;
      console.info("[CMS] Payload CMS v3 Local API initialized successfully");
    } catch (err) {
      console.warn("[CMS] Payload CMS failed to initialize (non-fatal):", (err as Error).message);
    }
  } else {
    console.log("[CMS] Payload CMS skipped in serverless mode.");
  }

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isDev ? 1000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 1 minute",
  });
  app.use("/api/trpc", limiter);
  app.use("/api/upload", uploadRouter);

  app.use((req, res, next) => {
    if (req.path.includes("cart.") || req.path.includes("transactions.") || req.path.includes("auth.")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  const checkoutLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many checkout attempts, please try again later.",
  });
  app.use("/api/trpc/*checkoutCart*", checkoutLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode, timestamp: new Date().toISOString() });
  });

  app.post("/api/webhooks/logistics", async (req, res) => {
    try {
      const payload = req.body;
      const trackingNumber = payload.tracking_number || payload.trackingNumber || payload.id;
      const status = payload.status;

      if (!trackingNumber) {
        return res.status(400).send("Missing tracking number");
      }

      let mappedStatus = "placed";
      if (status && (status.toLowerCase().includes("deliver") || status === "COMPLETED")) {
        mappedStatus = "delivered";
      } else if (status && (status.toLowerCase().includes("ship") || status === "IN_TRANSIT")) {
        mappedStatus = "shipped";
      }

      if (mappedStatus === "delivered" || mappedStatus === "shipped") {
        const updateData: any = { status: mappedStatus, updatedAt: new Date() };
        if (mappedStatus === "delivered") updateData.deliveredAt = new Date();
        if (mappedStatus === "shipped") updateData.shippedAt = new Date();

        const { eq } = require("drizzle-orm");
        await db.db
          .update(schema.transactions)
          .set(updateData)
          .where(eq(schema.transactions.trackingNumber, trackingNumber));
      }

      res.status(200).send("Webhook received");
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).send("Webhook processing failed");
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  app.get("/api/dev/force-login", async (_req, res) => {
    res.status(500).send("Force login disabled — Clerk login required");
  });

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

  app.get("/api/debug/me", async (_req, res) => {
    return res.json({ message: "Clerk-based authentication debug" });
  });

  app.get("/api/debug/verify-token", async (_req, res) => {
    return res.json({ message: "Clerk token verification required via Authorization header" });
  });

  // #region agent log
  app.use((err: unknown, req: any, _res: any, next: any) => {
    writeDebugLog({
      sessionId: "90368c",
      runId: "debug_pre",
      hypothesisId: "H5_express_error",
      location: "backend/_core/createApp.ts:express_error_middleware",
      message: "Express error middleware observed error",
      data: {
        path: req?.originalUrl || req?.url,
        method: req?.method,
        errorName: err instanceof Error ? err.name : null,
        errorMessage: err instanceof Error && typeof err.message === "string" ? err.message.slice(0, 200) : null,
      },
      timestamp: Date.now(),
    });
    next(err);
  });
  // #endregion

  if (mode === "development" && httpServer) {
    await setupVite(app, httpServer);
  }

  app.get("/", (_req, res) => {
    res.send("Sasto Marketplace API Server Running\n\nAPI Status: Online\nTime: " + new Date().toISOString());
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "sasto-api",
      timestamp: new Date().toISOString()
    });
  });

  const ready = (async () => {
    try {
      console.log("[Startup] Ensuring category taxonomy is seeded.");
      await seedCategories();
    } catch (err) {
      console.warn("[Startup] Category seeding failed:", err);
    }
  })();

  return { app, ready };
}
