import { eq, desc, and, gte, gt, lte, like, isNull, sql, or } from "drizzle-orm/sql";
import { drizzle as sqliteDrizzle } from "drizzle-orm/better-sqlite3";
import { drizzle as pgDrizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import Database from "better-sqlite3";
import { 
  InsertUser, users, 
  listings, categories, auctions, bids, messages, reviews, bookings, favorites, notifications,
  reviewHelpfulVotes, reviewAnalytics, flaggedReviews, companyConfigs, reports, careers, transactions, paymentGateways, returns,
  type Listing, type Category, type Auction, type Message, type Review, type Booking, type Favorite,
  type User, type CompanyConfig, type ReportTicket, type CareerOpening, type Transaction, type PaymentGateway, type ReturnRequest
} from "../drizzle/schema";
import * as schema from "../drizzle/schema";
import fs from "fs";
import path from "path";
import { ENV } from './_core/env';
import { decryptMessage } from "./_core/crypto";

const fallbackSqliteUrl = "sqlite:./sqlite.db";
const rawConnectionString = process.env.DATABASE_URL || fallbackSqliteUrl;
const isSqlite = rawConnectionString.startsWith("sqlite:") || !rawConnectionString.includes("://");

let _db: any = undefined;

function getSqlitePath(connectionString: string) {
  const stripped = connectionString.replace(/^sqlite:(\/\/)?/, "");
  return path.resolve(stripped);
}

function initSqlite(connectionString: string) {
  const sqlitePath = getSqlitePath(connectionString);

  try {
    const sqliteDir = path.dirname(sqlitePath);
    if (sqliteDir && sqliteDir !== "." && !fs.existsSync(sqliteDir)) {
      fs.mkdirSync(sqliteDir, { recursive: true });
    }
  } catch (err) {
    console.warn("[Database] Failed to create SQLite directory:", err);
  }

  const sqlite = new Database(sqlitePath, { fileMustExist: false });
  return sqliteDrizzle(sqlite, { schema });
}

async function initPostgres(connectionString: string) {
  const sql = postgres(connectionString, {
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  // Verify the connection immediately and fall back if the host is unreachable.
  await sql`select 1`;

  return pgDrizzle(sql, { schema });
}

try {
  if (isSqlite) {
    _db = initSqlite(rawConnectionString);
    console.info("[Database] Initialized SQLite at", getSqlitePath(rawConnectionString));
  } else {
    try {
      _db = await initPostgres(rawConnectionString);
      console.info("[Database] Initialized Postgres via DATABASE_URL");
    } catch (err) {
      console.warn("[Database] Postgres init failed; falling back to SQLite:", err);
      _db = initSqlite(fallbackSqliteUrl);
      console.info("[Database] Initialized fallback SQLite at", getSqlitePath(fallbackSqliteUrl));
    }
  }
} catch (err) {
  console.error("[Database] Failed to initialize DB:", err);
}

export const db = _db;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "location", "bio", "avatar"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'super_admin';
      updateSet.role = 'super_admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// Listing queries
export async function getListings(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    listing: listings,
    seller: {
      name: users.name,
      avatar: users.avatar,
      verificationStatus: users.verificationStatus,
    }
  })
  .from(listings)
  .leftJoin(users, eq(listings.userId, users.id))
  .where(and(
    eq(listings.status, "active"),
    gt(listings.stock, 0)
  ))
  .orderBy(desc(listings.createdAt))
  .limit(limit)
  .offset(offset);

  return results.map(row => ({
    ...row.listing,
    seller: row.seller
  }));
}

export async function getListingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select({
    listing: listings,
    seller: {
      name: users.name,
      avatar: users.avatar,
      verificationStatus: users.verificationStatus,
    }
  })
  .from(listings)
  .leftJoin(users, eq(listings.userId, users.id))
  .where(eq(listings.id, id))
  .limit(1);
  
  if (results.length === 0) return undefined;
  return {
    ...results[0].listing,
    seller: results[0].seller
  };
}

export async function getUserListings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(listings)
    .where(eq(listings.userId, userId))
    .orderBy(desc(listings.createdAt));
}

export async function searchListings(query: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    listing: listings,
    seller: {
      name: users.name,
      avatar: users.avatar,
      verificationStatus: users.verificationStatus,
    }
  })
  .from(listings)
  .leftJoin(users, eq(listings.userId, users.id))
  .where(and(
    eq(listings.status, "active"),
    gt(listings.stock, 0),
    like(listings.title, `%${query}%`)
  ))
  .orderBy(desc(listings.createdAt))
  .limit(limit);

  return results.map(row => ({
    ...row.listing,
    seller: row.seller
  }));
}

// Category queries
export async function getCategories(sector?: string) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(categories).where(isNull(categories.parentId));
  
  if (sector) {
    return db.select().from(categories)
      .where(and(
        isNull(categories.parentId),
        like(categories.sector, `%${sector}%`)
      ))
      .orderBy(categories.name);
  }

  return query.orderBy(categories.name);
}

export async function getSubcategories(parentId: number, sector?: string) {
  const db = await getDb();
  if (!db) return [];

  if (sector) {
    return db.select().from(categories)
      .where(and(
        eq(categories.parentId, parentId),
        like(categories.sector, `%${sector}%`)
      ))
      .orderBy(categories.name);
  }

  return db.select().from(categories)
    .where(eq(categories.parentId, parentId))
    .orderBy(categories.name);
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

// Auction queries
export async function getAuctions(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(auctions)
    .orderBy(desc(auctions.endTime))
    .limit(limit);
}

export async function getAuctionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({
    auction: auctions,
    listing: listings,
    seller: users,
  })
  .from(auctions)
  .innerJoin(listings, eq(auctions.listingId, listings.id))
  .innerJoin(users, eq(listings.userId, users.id))
  .where(eq(auctions.id, id))
  .limit(1);

  if (result.length === 0) return undefined;

  return {
    ...result[0].auction,
    title: result[0].listing.title,
    description: result[0].listing.description,
    image: ((result[0].listing.images as any[])?.[0]) || "",
    location: result[0].listing.location,
    sellerName: result[0].seller.name,
    sellerRating: 4.8, // Default rating for now
  };
}

export async function getAuctionByListingId(listingId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({
    auction: auctions,
    listing: listings,
    seller: users,
  })
  .from(auctions)
  .innerJoin(listings, eq(auctions.listingId, listings.id))
  .innerJoin(users, eq(listings.userId, users.id))
  .where(eq(auctions.listingId, listingId))
  .limit(1);

  if (result.length === 0) return undefined;

  return {
    ...result[0].auction,
    title: result[0].listing.title,
    description: result[0].listing.description,
    image: ((result[0].listing.images as any[])?.[0]) || "",
    location: result[0].listing.location,
    sellerName: result[0].seller.name,
    sellerRating: 4.8,
  };
}

// Bid queries
export async function getBidsForAuction(auctionId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bids)
    .where(eq(bids.auctionId, auctionId))
    .orderBy(desc(bids.createdAt));
}

// Message queries
export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // This query gets the latest message for each conversation (partner)
  // We join with the users table to get the partner's name and avatar
  const results = await db.select({
    id: messages.id,
    partnerId: sql<number>`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.recipientId} ELSE ${messages.senderId} END`,
    content: messages.content,
    createdAt: messages.createdAt,
    isRead: messages.isRead,
    partnerName: users.name,
    partnerAvatar: users.avatar,
    listingId: messages.listingId,
  })
  .from(messages)
  .innerJoin(users, eq(sql`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.recipientId} ELSE ${messages.senderId} END`, users.id))
  .where(or(
    eq(messages.senderId, userId),
    eq(messages.recipientId, userId)
  ))
  .orderBy(desc(messages.createdAt));

  // Filter to only unique partners (latest message per partner)
  const uniqueConversations: any[] = [];
  const seenPartners = new Set<number>();

  for (const row of results) {
    if (!seenPartners.has(row.partnerId)) {
      seenPartners.add(row.partnerId);
      // Decrypt for display
      row.content = decryptMessage(row.content);
      uniqueConversations.push(row);
    }
  }

  return uniqueConversations;
}

export async function getMessages(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select()
    .from(messages)
    .where(or(
      and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
      and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
    ))
    .orderBy(messages.createdAt);

  return rows.map(row => ({
    ...row,
    content: decryptMessage(row.content)
  }));
}

// Review queries
export async function getUserReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reviews)
    .where(eq(reviews.toUserId, userId))
    .orderBy(desc(reviews.createdAt));
}

// Favorite queries
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    id: favorites.id,
    listingId: favorites.listingId,
    title: listings.title,
    price: listings.price,
    image: listings.images,
    location: listings.location,
    createdAt: favorites.createdAt,
  })
  .from(favorites)
  .innerJoin(listings, eq(favorites.listingId, listings.id))
  .where(eq(favorites.userId, userId));

  return results.map(row => ({
    ...row,
    image: (row.image as any[])?.[0] || "",
  }));
}

export async function isFavorited(userId: number, listingId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(favorites)
    .where(and(
      eq(favorites.userId, userId),
      eq(favorites.listingId, listingId)
    ))
    .limit(1);

  return result.length > 0;
}

// Booking queries
export async function getUserBookings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    id: bookings.id,
    listingId: bookings.listingId,
    title: listings.title,
    startDate: bookings.startDate,
    endDate: bookings.endDate,
    totalPrice: bookings.totalPrice,
    status: bookings.status,
    image: listings.images,
  })
  .from(bookings)
  .innerJoin(listings, eq(bookings.listingId, listings.id))
  .where(eq(bookings.userId, userId))
  .orderBy(desc(bookings.createdAt));

  return results.map(row => ({
    ...row,
    image: (row.image as any[])?.[0] || "",
  }));
}

export async function getListingBookings(listingId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bookings)
    .where(eq(bookings.listingId, listingId))
    .orderBy(desc(bookings.createdAt));
}

// Transaction queries
export async function getUserTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    id: transactions.id,
    orderId: transactions.orderId,
    buyerId: transactions.buyerId,
    sellerId: transactions.sellerId,
    listingId: transactions.listingId,
    amount: transactions.amount,
    status: transactions.status,
    paymentMethod: transactions.paymentMethod,
    transactionType: transactions.transactionType,
    deliveryName: transactions.deliveryName,
    deliveryAddress: transactions.deliveryAddress,
    deliveryPhone: transactions.deliveryPhone,
    deliveryEmail: transactions.deliveryEmail,
    deliverySpeed: transactions.deliverySpeed,
    deliveryFee: transactions.deliveryFee,
    estDeliveryDate: transactions.estDeliveryDate,
    createdAt: transactions.createdAt,
    title: listings.title,
    image: listings.images,
  })
  .from(transactions)
  .innerJoin(listings, eq(transactions.listingId, listings.id))
  .where(eq(transactions.buyerId, userId))
  .orderBy(desc(transactions.createdAt));

  return results.map(row => ({
    ...row,
    image: (row.image as any[])?.[0] || "",
  }));
}

export async function createTransaction(values: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(transactions).values(values).returning();
}

export async function getSellerTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    id: transactions.id,
    orderId: transactions.orderId,
    buyerId: transactions.buyerId,
    sellerId: transactions.sellerId,
    listingId: transactions.listingId,
    amount: transactions.amount,
    status: transactions.status,
    paymentMethod: transactions.paymentMethod,
    deliveryName: transactions.deliveryName,
    deliveryAddress: transactions.deliveryAddress,
    deliveryPhone: transactions.deliveryPhone,
    deliveryEmail: transactions.deliveryEmail,
    deliverySpeed: transactions.deliverySpeed,
    deliveryFee: transactions.deliveryFee,
    estDeliveryDate: transactions.estDeliveryDate,
    createdAt: transactions.createdAt,
    title: listings.title,
    image: listings.images,
  })
  .from(transactions)
  .innerJoin(listings, eq(transactions.listingId, listings.id))
  .where(eq(transactions.sellerId, userId))
  .orderBy(desc(transactions.createdAt));

  return results.map(row => ({
    ...row,
    image: (row.image as any[])?.[0] || "",
  }));
}

export async function getUserBids(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    id: bids.id,
    auctionId: bids.auctionId,
    amount: bids.amount,
    createdAt: bids.createdAt,
    auctionTitle: listings.title,
    currentHighestBid: auctions.currentBid,
    endTime: auctions.endTime,
    image: listings.images,
  })
  .from(bids)
  .innerJoin(auctions, eq(bids.auctionId, auctions.id))
  .innerJoin(listings, eq(auctions.listingId, listings.id))
  .where(eq(bids.bidderId, userId))
  .orderBy(desc(bids.createdAt));

  return results.map(row => ({
    ...row,
    image: (row.image as any[])?.[0] || "",
  }));
}

// Notification queries
export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}


// ============================================
// REVIEW SYSTEM DATABASE FUNCTIONS
// ============================================

export async function submitReview(fromUserId: number, toUserId: number, data: {
  listingId?: number;
  transactionId?: number;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reviews).values({
    fromUserId,
    toUserId,
    listingId: data.listingId,
    transactionId: data.transactionId,
    rating: Math.max(1, Math.min(5, data.rating)),
    title: data.title,
    comment: data.comment,
    isVerifiedPurchase: data.isVerifiedPurchase || false,
  }).returning({ insertId: reviews.id });

  // Update analytics after new review
  await updateReviewAnalytics(toUserId);
  
  return result;
}

export async function getReviewById(reviewId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserReceivedReviews(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reviews)
    .where(and(
      eq(reviews.toUserId, userId),
      eq(reviews.status, "approved")
    ))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUserGivenReviews(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reviews)
    .where(eq(reviews.fromUserId, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateReviewStatus(reviewId: number, status: "pending" | "approved" | "rejected" | "flagged") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const review = await getReviewById(reviewId);
  if (!review) throw new Error("Review not found");

  await db.update(reviews)
    .set({ status, updatedAt: new Date() })
    .where(eq(reviews.id, reviewId));

  // Update analytics if status changed
  if (status === "approved" || review.status === "approved") {
    await updateReviewAnalytics(review.toUserId);
  }
}

export async function addSellerResponse(reviewId: number, response: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(reviews)
    .set({ 
      sellerResponse: response,
      sellerResponseAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(reviews.id, reviewId));
}

export async function markReviewHelpful(reviewId: number, userId: number, isHelpful: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already voted
  const existing = await db.select().from(reviewHelpfulVotes)
    .where(and(
      eq(reviewHelpfulVotes.reviewId, reviewId),
      eq(reviewHelpfulVotes.userId, userId)
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update existing vote
    await db.update(reviewHelpfulVotes)
      .set({ isHelpful })
      .where(and(
        eq(reviewHelpfulVotes.reviewId, reviewId),
        eq(reviewHelpfulVotes.userId, userId)
      ));
  } else {
    // Create new vote
    await db.insert(reviewHelpfulVotes).values({
      reviewId,
      userId,
      isHelpful,
    });
  }

  // Update review helpful/unhelpful counts
  const votes = await db.select().from(reviewHelpfulVotes)
    .where(eq(reviewHelpfulVotes.reviewId, reviewId));

  const helpfulCount = votes.filter(v => v.isHelpful).length;
  const unhelpfulCount = votes.filter(v => !v.isHelpful).length;

  return db.update(reviews)
    .set({ 
      helpfulCount,
      unhelpfulCount,
      updatedAt: new Date()
    })
    .where(eq(reviews.id, reviewId));
}

export async function flagReview(reviewId: number, flaggedByUserId: number, reason: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create flagged review record
  await db.insert(flaggedReviews).values({
    reviewId,
    flaggedByUserId,
    reason: reason as "inappropriate" | "spam" | "fake" | "offensive",
    description,
  });

  // Update review status to flagged
  return db.update(reviews)
    .set({ status: "flagged", updatedAt: new Date() })
    .where(eq(reviews.id, reviewId));
}

export async function getFlaggedReviews(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(flaggedReviews)
    .where(eq(flaggedReviews.status, "pending"))
    .orderBy(desc(flaggedReviews.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function resolveFlaggedReview(flaggedReviewId: number, adminId: number, status: "dismissed" | "removed", adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const flaggedReview = await db.select().from(flaggedReviews)
    .where(eq(flaggedReviews.id, flaggedReviewId))
    .limit(1);

  if (flaggedReview.length === 0) throw new Error("Flagged review not found");

  // Update flagged review
  await db.update(flaggedReviews)
    .set({ 
      status,
      reviewedByAdminId: adminId,
      adminNotes,
      resolvedAt: new Date()
    })
    .where(eq(flaggedReviews.id, flaggedReviewId));

  // If removed, update review status to rejected
  if (status === "removed") {
    const review = await getReviewById(flaggedReview[0].reviewId);
    if (review) {
      await db.update(reviews)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(reviews.id, flaggedReview[0].reviewId));
      
      // Update analytics
      await updateReviewAnalytics(review.toUserId);
    }
  }
}

export async function getUserReviewAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  // Get or create analytics record
  let analytics = await db.select().from(reviewAnalytics)
    .where(eq(reviewAnalytics.userId, userId))
    .limit(1);

  if (analytics.length === 0) {
    // Create new analytics record
    await db.insert(reviewAnalytics).values({
      userId,
      totalReviews: 0,
      averageRating: 0,
    });
    analytics = await db.select().from(reviewAnalytics)
      .where(eq(reviewAnalytics.userId, userId))
      .limit(1);
  }

  return analytics[0];
}

export async function updateReviewAnalytics(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all approved reviews for the user
  const userReviews = await db.select().from(reviews)
    .where(and(
      eq(reviews.toUserId, userId),
      eq(reviews.status, "approved")
    ));

  if (userReviews.length === 0) {
    return db.update(reviewAnalytics)
      .set({ 
        totalReviews: 0,
        averageRating: 0,
        fiveStarCount: 0,
        fourStarCount: 0,
        threeStarCount: 0,
        twoStarCount: 0,
        oneStarCount: 0,
        updatedAt: new Date()
      })
      .where(eq(reviewAnalytics.userId, userId));
  }

  const totalReviews = userReviews.length;
  const averageRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  const fiveStarCount = userReviews.filter(r => r.rating === 5).length;
  const fourStarCount = userReviews.filter(r => r.rating === 4).length;
  const threeStarCount = userReviews.filter(r => r.rating === 3).length;
  const twoStarCount = userReviews.filter(r => r.rating === 2).length;
  const oneStarCount = userReviews.filter(r => r.rating === 1).length;
  const verifiedPurchaseCount = userReviews.filter(r => r.isVerifiedPurchase).length;
  const lastReviewDate = userReviews[0]?.createdAt;

  return db.update(reviewAnalytics)
    .set({ 
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      fiveStarCount,
      fourStarCount,
      threeStarCount,
      twoStarCount,
      oneStarCount,
      verifiedPurchaseCount,
      lastReviewDate,
      updatedAt: new Date()
    })
    .where(eq(reviewAnalytics.userId, userId));
}

export async function deleteReview(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const review = await getReviewById(reviewId);
  if (!review) throw new Error("Review not found");

  // Delete review and related records
  await db.delete(reviewHelpfulVotes).where(eq(reviewHelpfulVotes.reviewId, reviewId));
  await db.delete(flaggedReviews).where(eq(flaggedReviews.reviewId, reviewId));
  await db.delete(reviews).where(eq(reviews.id, reviewId));

  // Update analytics
  await updateReviewAnalytics(review.toUserId);
}

// ============================================
// COMPANY CONFIG DATABASE FUNCTIONS
// ============================================

export async function getCompanyConfig(): Promise<CompanyConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db.select().from(companyConfigs).limit(1);
  if (results.length > 0) return results[0];
  
  const defaultConfig = {
    id: 1,
    email: "support@sasto.com",
    phone: "+977-1-4123456",
    location: "New Baneshwor, Kathmandu",
    commissionRate: 0,
    updatedAt: new Date()
  };
  
  try {
    await db.insert(companyConfigs).values(defaultConfig);
  } catch (e) {
    console.error("Seeding companyConfigs failed", e);
  }
  return defaultConfig;
}

export async function updateCompanyConfig(data: { email?: string; phone?: string; location?: string; commissionRate?: number }): Promise<CompanyConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const active = await getCompanyConfig();
  
  const updateData: any = { updatedAt: new Date() };
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate;
  
  await db.update(companyConfigs)
    .set(updateData)
    .where(eq(companyConfigs.id, active.id));
  return { ...active, ...updateData };
}

// ============================================
// REPORTS & COMPLAINTS DATABASE FUNCTIONS
// ============================================

export async function submitReport(data: { reporterName?: string; reporterEmail: string; subject: string; description: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reports).values({
    reporterName: data.reporterName || null,
    reporterEmail: data.reporterEmail,
    subject: data.subject,
    description: data.description,
    status: "pending",
    createdAt: new Date(),
  }).returning({ insertId: reports.id });
}

export async function getAllReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).orderBy(desc(reports.createdAt));
}

export async function resolveReport(reportId: number, adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(reports)
    .set({ status: "resolved", adminNotes: adminNotes || null, resolvedAt: new Date() })
    .where(eq(reports.id, reportId));
}

// ============================================
// CAREERS DATABASE FUNCTIONS
// ============================================

export async function getCareers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(careers).where(eq(careers.status, "active")).orderBy(desc(careers.createdAt));
}

export async function createCareerOpening(data: {
  title: string;
  department: string;
  location: string;
  salaryRange: string;
  type: string;
  description: string;
  requirements?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(careers).values({
    title: data.title,
    department: data.department,
    location: data.location,
    salaryRange: data.salaryRange,
    type: data.type,
    description: data.description,
    requirements: data.requirements || null,
    status: "active",
    createdAt: new Date(),
  }).returning({ insertId: careers.id });
}

export async function archiveCareerOpening(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(careers)
    .set({ status: "closed" })
    .where(eq(careers.id, id));
}

// ============================================
// PAYMENT GATEWAYS DATABASE FUNCTIONS
// ============================================

export async function getPaymentGateways() {
  const db = await getDb();
  if (!db) return [];
  let gateways = await db.select().from(paymentGateways).orderBy(paymentGateways.name);
  if (gateways.length === 0) {
    const defaults = [
      { name: "esewa", displayName: "eSewa Mobile Wallet", isActive: false, updatedAt: new Date() },
      { name: "khalti", displayName: "Khalti", isActive: false, updatedAt: new Date() },
      { name: "visa", displayName: "Visa / Mastercard", isActive: false, updatedAt: new Date() },
      { name: "fonepay", displayName: "Fonepay", isActive: false, updatedAt: new Date() }
    ];
    for (const gw of defaults) {
      await db.insert(paymentGateways).values(gw);
    }
    gateways = await db.select().from(paymentGateways).orderBy(paymentGateways.name);
  }
  return gateways;
}

export async function getActivePaymentGateways() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: paymentGateways.id,
    name: paymentGateways.name,
    displayName: paymentGateways.displayName,
    isActive: paymentGateways.isActive,
  }).from(paymentGateways).where(eq(paymentGateways.isActive, true));
}

export async function updatePaymentGateway(name: string, data: Partial<PaymentGateway>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(paymentGateways).where(eq(paymentGateways.name, name)).limit(1);
  if (existing.length === 0) {
    await db.insert(paymentGateways).values({
      name,
      displayName: data.displayName || name,
      isActive: data.isActive || false,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      merchantId: data.merchantId,
      endpoint: data.endpoint,
      updatedAt: new Date()
    });
  } else {
    await db.update(paymentGateways)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentGateways.name, name));
  }
}
