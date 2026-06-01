import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, desc, eq, or, sql } from "drizzle-orm";

import { getDb } from "./db";
import { encryptMessage, decryptMessage } from "./_core/crypto";
import { authService } from "./_core/authService";
import { writeDebugLog } from "./_core/debugLog";
import { getR2Client, getR2PublicBaseUrl, R2_BUCKET_NAME } from "./r2";

import {
  categories,
  disputes,
  listings,
  messages,
  transactions,
  users,
  verificationSubmissions,
} from "../drizzle/schema";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").replace(/\s+/g, "-").slice(0, 120);
}

async function requireUser(req: any) {
  // Frontend REST calls currently don’t add Authorization consistently,
  // but protected endpoints below will enforce it.
  const user = await authService.authenticateRequest(req);
  return user;
}

export const restRouter = Router();

// POST /api/upload-url
restRouter.post("/upload-url", async (req, res) => {
  try {
    const { filename, contentType } = (req.body ?? {}) as {
      filename?: string;
      contentType?: string;
    };

    if (!filename || typeof filename !== "string") {
      return res.status(400).json({ error: "filename is required" });
    }
    if (!contentType || typeof contentType !== "string") {
      return res.status(400).json({ error: "contentType is required" });
    }

    const r2 = getR2Client();
    const publicBase = getR2PublicBaseUrl();
    if (!r2 || !publicBase) {
      return res.status(500).json({ error: "R2 is not configured" });
    }

    const safeName = sanitizeFilename(filename);
    const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(r2, cmd, { expiresIn: 3600 });
    const fileId = `${publicBase}/${key}`;

    return res.json({ url, fileId });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to create presigned url" });
  }
});

// POST /api/verification/upload
restRouter.post("/verification/upload", upload.single("file"), async (req, res) => {
  try {
    const authed = await requireUser(req);

    const stepId = String((req.body as any)?.stepId ?? "");
    const sellerIdRaw = String((req.body as any)?.sellerId ?? "");
    const sellerId = Number.parseInt(sellerIdRaw, 10);

    if (!stepId) return res.status(400).json({ error: "stepId is required" });
    if (!Number.isFinite(sellerId)) return res.status(400).json({ error: "sellerId is required" });
    if (sellerId !== authed.id) return res.status(403).json({ error: "Forbidden" });

    if (!req.file) return res.status(400).json({ error: "file is required" });

    const r2 = getR2Client();
    const publicBase = getR2PublicBaseUrl();
    if (!r2 || !publicBase) {
      return res.status(500).json({ error: "R2 is not configured" });
    }

    const ext = (req.file.originalname.split(".").pop() || "bin").toLowerCase();
    const key = `verification/${authed.id}/${stepId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    const documentUrl = `${publicBase}/${key}`;

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database not available" });

    await db.insert(verificationSubmissions).values({
      userId: authed.id,
      type: "kyc",
      data: { stepId, documentUrl, filename: req.file.originalname, contentType: req.file.mimetype },
      status: "pending",
    } as any);

    await db.update(users).set({ verificationStatus: "pending" } as any).where(eq(users.id, authed.id));

    return res.json({ documentUrl });
  } catch (e: any) {
    const msg = e?.message || "Upload failed";
    const status = msg.includes("Authorization") ? 401 : 500;
    return res.status(status).json({ error: msg });
  }
});

// POST /api/recommendations
restRouter.post("/recommendations", async (req, res) => {
  try {
    const { userId, currentListingId, limit } = (req.body ?? {}) as {
      userId?: number;
      currentListingId?: number;
      limit?: number;
    };

    const take = Math.min(Math.max(Number(limit) || 6, 1), 24);
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database not available" });

    let categoryId: number | null = null;
    if (typeof currentListingId === "number") {
      const current = await db.select().from(listings).where(eq(listings.id, currentListingId)).limit(1);
      categoryId = current[0]?.categoryId ?? null;
    }

    const whereParts: any[] = [eq(listings.status, "active")];
    if (typeof currentListingId === "number") whereParts.push(sql`${listings.id} <> ${currentListingId}`);
    if (categoryId) whereParts.push(eq(listings.categoryId, categoryId));

    const rows = await db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        images: listings.images,
        categoryId: listings.categoryId,
        sellerName: users.name,
        sellerId: users.id,
        categoryName: categories.name,
      })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .where(and(...whereParts))
      .orderBy(desc(listings.createdAt))
      .limit(take);

    const recs = rows.map((r, idx) => ({
      id: r.id,
      title: r.title,
      price: Number(r.price || 0),
      image: (Array.isArray(r.images) ? (r.images as any[])[0] : "") || "",
      rating: 4.6,
      seller: r.sellerName || "Seller",
      category: r.categoryName || "Category",
      reason: categoryId ? "Similar Category Match" : "Trending Now",
      relevanceScore: categoryId ? 0.9 - idx * 0.03 : 0.75 - idx * 0.02,
    }));

    // Fallback if no category match
    if (recs.length === 0) {
      const fallback = await db
        .select({
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
          sellerName: users.name,
          categoryName: categories.name,
        })
        .from(listings)
        .leftJoin(users, eq(listings.userId, users.id))
        .leftJoin(categories, eq(listings.categoryId, categories.id))
        .where(eq(listings.status, "active"))
        .orderBy(sql`RANDOM()`)
        .limit(take);

      return res.json({
        recommendations: fallback.map((r, idx) => ({
          id: r.id,
          title: r.title,
          price: Number(r.price || 0),
          image: (Array.isArray(r.images) ? (r.images as any[])[0] : "") || "",
          rating: 4.5,
          seller: r.sellerName || "Seller",
          category: r.categoryName || "Category",
          reason: "Popular on Sasto",
          relevanceScore: 0.7 - idx * 0.02,
        })),
      });
    }

    return res.json({ recommendations: recs });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to fetch recommendations" });
  }
});

// GET /api/disputes/:disputeId
restRouter.get("/disputes/:disputeId", async (req, res) => {
  try {
    const disputeId = Number.parseInt(req.params.disputeId, 10);
    if (!Number.isFinite(disputeId)) return res.status(400).json({ error: "Invalid disputeId" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database not available" });

    const [d] = await db.select().from(disputes).where(eq(disputes.id, disputeId)).limit(1);
    if (!d) return res.status(404).json({ error: "Dispute not found" });

    const msgRows = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        content: messages.content,
        createdAt: messages.createdAt,
        attachmentUrl: messages.attachmentUrl,
        senderName: users.name,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.listingId, d.listingId),
          or(
            and(eq(messages.senderId, d.buyerId), eq(messages.recipientId, d.sellerId)),
            and(eq(messages.senderId, d.sellerId), eq(messages.recipientId, d.buyerId)),
          ),
        ),
      )
      .orderBy(messages.createdAt);

    const mapped = {
      id: d.id,
      orderId: d.listingId, // frontend expects orderId; we map listingId here
      buyerId: d.buyerId,
      sellerId: d.sellerId,
      reason: d.title,
      status: (d.status as any) || "open",
      createdAt: d.createdAt,
      resolution: d.resolution || undefined,
      messages: msgRows.map((m) => ({
        id: m.id,
        userId: m.senderId,
        userName: m.senderName || "User",
        message: decryptMessage(String(m.content || "")),
        timestamp: m.createdAt,
        attachments: m.attachmentUrl ? [m.attachmentUrl] : [],
      })),
    };

    return res.json(mapped);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to fetch dispute" });
  }
});

// POST /api/disputes/:disputeId/messages
restRouter.post("/disputes/:disputeId/messages", async (req, res) => {
  try {
    const user = await requireUser(req);
    const disputeId = Number.parseInt(req.params.disputeId, 10);
    if (!Number.isFinite(disputeId)) return res.status(400).json({ error: "Invalid disputeId" });

    const { message } = (req.body ?? {}) as { message?: string };
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database not available" });

    const [d] = await db.select().from(disputes).where(eq(disputes.id, disputeId)).limit(1);
    if (!d) return res.status(404).json({ error: "Dispute not found" });

    const isBuyer = user.id === d.buyerId;
    const isSeller = user.id === d.sellerId;
    if (!isBuyer && !isSeller) return res.status(403).json({ error: "Forbidden" });

    const recipientId = isBuyer ? d.sellerId : d.buyerId;
    const [inserted] = await db
      .insert(messages)
      .values({
        senderId: user.id,
        recipientId,
        listingId: d.listingId,
        content: encryptMessage(message),
        createdAt: new Date(),
      } as any)
      .returning();

    try {
      const ws = (global as any).wsManager;
      if (ws?.notifyMessage) {
        ws.notifyMessage({
          id: inserted?.id,
          senderId: user.id,
          recipientId,
          content: message,
          timestamp: new Date(),
          conversationId: [user.id, recipientId].sort().join("-"),
        });
      }
    } catch {
      // ignore WS in serverless
    }

    return res.json({ success: true });
  } catch (e: any) {
    const msg = e?.message || "Failed to send message";
    const status = msg.includes("Authorization") ? 401 : 500;
    return res.status(status).json({ error: msg });
  }
});

// POST /api/disputes/:disputeId/resolve
restRouter.post("/disputes/:disputeId/resolve", async (req, res) => {
  try {
    const user = await requireUser(req);
    const disputeId = Number.parseInt(req.params.disputeId, 10);
    if (!Number.isFinite(disputeId)) return res.status(400).json({ error: "Invalid disputeId" });

    const { resolution } = (req.body ?? {}) as { resolution?: string };
    if (!resolution || typeof resolution !== "string" || !resolution.trim()) {
      return res.status(400).json({ error: "resolution is required" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database not available" });

    const [d] = await db.select().from(disputes).where(eq(disputes.id, disputeId)).limit(1);
    if (!d) return res.status(404).json({ error: "Dispute not found" });

    if (user.id !== d.buyerId && user.id !== d.sellerId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db
      .update(disputes)
      .set({ status: "resolved", resolution, resolvedAt: new Date(), updatedAt: new Date() } as any)
      .where(eq(disputes.id, disputeId));

    return res.json({ success: true });
  } catch (e: any) {
    const msg = e?.message || "Failed to resolve dispute";
    const status = msg.includes("Authorization") ? 401 : 500;
    return res.status(status).json({ error: msg });
  }
});

// GET /api/analytics
restRouter.get("/analytics", async (req, res) => {
  const t0 = Date.now();
  const range = String(req.query.range || "month");
  // #region agent log
  writeDebugLog({
    sessionId: "90368c",
    runId: "debug_pre",
    hypothesisId: "H_analytics_entry_local",
    location: "backend/rest.ts:GET /api/analytics",
    message: "analytics entry (local file)",
    data: { range, method: req.method, path: req.originalUrl || req.url },
    timestamp: Date.now(),
  });
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7884/ingest/4eb48921-d438-46ea-8ea8-0991e31d49ad',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'90368c'},body:JSON.stringify({sessionId:'90368c',runId:'debug_pre',hypothesisId:'H_analytics_entry',location:'backend/rest.ts:GET /api/analytics',message:'analytics entry',data:{range,method:req.method,path:req.originalUrl||req.url},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database not available" });

    const [{ totalUsers } = { totalUsers: 0 }] = await db
      .select({ totalUsers: sql<number>`count(*)` })
      .from(users);

    const [{ totalTransactions } = { totalTransactions: 0 }] = await db
      .select({ totalTransactions: sql<number>`count(*)` })
      .from(transactions);

    const [{ totalRevenue } = { totalRevenue: 0 }] = await db
      .select({ totalRevenue: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
      .from(transactions);

    const avg = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const topCats = await db
      .select({
        name: categories.name,
        count: sql<number>`count(*)`,
      })
      .from(listings)
      .innerJoin(categories, eq(listings.categoryId, categories.id))
      .groupBy(categories.name)
      .orderBy(sql`count(*) desc`)
      .limit(6);

    const points = range === "week" ? 7 : range === "year" ? 12 : 30;
    const userGrowth = Array.from({ length: points }, () => 0);
    const revenueGrowth = Array.from({ length: points }, () => 0);

    // #region agent log
    writeDebugLog({
      sessionId: "90368c",
      runId: "debug_pre",
      hypothesisId: "H_analytics_ok_local",
      location: "backend/rest.ts:GET /api/analytics",
      message: "analytics success (local file)",
      data: {
        range,
        ms: Date.now() - t0,
        totalUsers: Number(totalUsers || 0),
        totalTransactions: Number(totalTransactions || 0),
        totalRevenue: Number(totalRevenue || 0),
        topCatsCount: topCats.length,
      },
      timestamp: Date.now(),
    });
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7884/ingest/4eb48921-d438-46ea-8ea8-0991e31d49ad',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'90368c'},body:JSON.stringify({sessionId:'90368c',runId:'debug_pre',hypothesisId:'H_analytics_ok',location:'backend/rest.ts:GET /api/analytics',message:'analytics success',data:{range,ms:Date.now()-t0,totalUsers:Number(totalUsers||0),totalTransactions:Number(totalTransactions||0),totalRevenue:Number(totalRevenue||0),topCatsCount:topCats.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return res.json({
      totalRevenue: Number(totalRevenue || 0),
      totalUsers: Number(totalUsers || 0),
      totalTransactions: Number(totalTransactions || 0),
      averageOrderValue: Number(avg || 0),
      conversionRate: 0,
      userGrowth,
      revenueGrowth,
      topCategories: topCats.map((c) => ({ name: c.name, count: Number(c.count) })),
      userRetention: 0,
      customerSatisfaction: 4.6,
    });
  } catch (e: any) {
    // #region agent log
    writeDebugLog({
      sessionId: "90368c",
      runId: "debug_pre",
      hypothesisId: "H_analytics_err_local",
      location: "backend/rest.ts:GET /api/analytics",
      message: "analytics error (local file)",
      data: {
        range,
        ms: Date.now() - t0,
        errorName: e instanceof Error ? e.name : null,
        errorMessage: e instanceof Error ? String(e.message).slice(0, 200) : null,
      },
      timestamp: Date.now(),
    });
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7884/ingest/4eb48921-d438-46ea-8ea8-0991e31d49ad',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'90368c'},body:JSON.stringify({sessionId:'90368c',runId:'debug_pre',hypothesisId:'H_analytics_err',location:'backend/rest.ts:GET /api/analytics',message:'analytics error',data:{range,ms:Date.now()-t0,errorName:e instanceof Error?e.name:null,errorMessage:e instanceof Error?String(e.message).slice(0,200):null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return res.status(500).json({ error: e?.message || "Failed to fetch analytics" });
  }
});

