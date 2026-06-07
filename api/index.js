var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// backend/_core/env.ts
var ENV;
var init_env = __esm({
  "backend/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      // Read from COOKIE_SECRET first, fall back to JWT_SECRET for backward compatibility
      cookieSecret: process.env.COOKIE_SECRET || process.env.JWT_SECRET || "",
      googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
    if (process.env.NODE_ENV === "development") {
      console.log("[ENV] Configuration loaded:");
      console.log("[ENV] Google Client ID:", ENV.googleClientId ? "SET (" + ENV.googleClientId.substring(0, 20) + "...)" : "NOT SET");
      console.log("[ENV] App ID:", ENV.appId);
      console.log("[ENV] Cookie Secret:", ENV.cookieSecret ? "SET" : "NOT SET");
    }
  }
});

// backend/_core/debugLog.ts
import fs from "fs";
import path from "path";
function writeDebugLog(payload) {
  const line = JSON.stringify(payload) + "\n";
  try {
    fs.appendFileSync(LOG_PATH, line, { encoding: "utf8" });
  } catch {
  }
  try {
    const f = globalThis.fetch;
    if (typeof f === "function") {
      f(INGEST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": SESSION_ID
        },
        body: JSON.stringify(payload)
      }).catch(() => {
      });
    }
  } catch {
  }
}
var SESSION_ID, INGEST_URL, LOG_PATH;
var init_debugLog = __esm({
  "backend/_core/debugLog.ts"() {
    "use strict";
    SESSION_ID = "90368c";
    INGEST_URL = "http://127.0.0.1:7884/ingest/4eb48921-d438-46ea-8ea8-0991e31d49ad";
    LOG_PATH = path.resolve(process.cwd(), "debug-90368c.log");
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adAnalytics: () => adAnalytics,
  adPayments: () => adPayments,
  adminLogs: () => adminLogs,
  adsensePlacements: () => adsensePlacements,
  advertisers: () => advertisers,
  auctions: () => auctions,
  bids: () => bids,
  bookings: () => bookings,
  careers: () => careers,
  cartItems: () => cartItems,
  cartItemsRelations: () => cartItemsRelations,
  carts: () => carts,
  cartsRelations: () => cartsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  companyConfigs: () => companyConfigs,
  disputes: () => disputes,
  emailLogs: () => emailLogs,
  emailNotificationPreferences: () => emailNotificationPreferences,
  emailQueue: () => emailQueue,
  favorites: () => favorites,
  flaggedListings: () => flaggedListings,
  flaggedReviews: () => flaggedReviews,
  listings: () => listings,
  listingsRelations: () => listingsRelations,
  logisticsPartners: () => logisticsPartners,
  manualAds: () => manualAds,
  messages: () => messages,
  notifications: () => notifications,
  paymentGateways: () => paymentGateways,
  permissions: () => permissions,
  promotionRequests: () => promotionRequests,
  reports: () => reports,
  returns: () => returns,
  returnsRelations: () => returnsRelations,
  reviewAnalytics: () => reviewAnalytics,
  reviewHelpfulVotes: () => reviewHelpfulVotes,
  reviews: () => reviews,
  roleAuditLogs: () => roleAuditLogs,
  rolePermissions: () => rolePermissions,
  roles: () => roles,
  sponsoredAdPricing: () => sponsoredAdPricing,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  userRoles: () => userRoles,
  users: () => users,
  usersRelations: () => usersRelations,
  verificationSubmissions: () => verificationSubmissions
});
import { pgTable, text, integer, real, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
var users, categories, listings, auctions, bids, bookings, favorites, messages, reviews, notifications, disputes, adminLogs, roles, permissions, rolePermissions, userRoles, roleAuditLogs, advertisers, manualAds, adAnalytics, adsensePlacements, adPayments, sponsoredAdPricing, promotionRequests, emailNotificationPreferences, emailQueue, emailLogs, reviewHelpfulVotes, reviewAnalytics, flaggedReviews, flaggedListings, verificationSubmissions, transactions, carts, cartItems, logisticsPartners, usersRelations, listingsRelations, transactionsRelations, cartsRelations, cartItemsRelations, categoriesRelations, companyConfigs, paymentGateways, reports, careers, returns, returnsRelations;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      /**
       * Surrogate primary key. Auto-incremented numeric value managed by the database.
       * Use this for relations between tables.
       */
      id: serial("id").primaryKey(),
      /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
      openId: text("openId").notNull().unique(),
      name: text("name"),
      email: text("email"),
      phone: text("phone"),
      location: text("location"),
      bio: text("bio"),
      avatar: text("avatar"),
      loginMethod: text("loginMethod"),
      password: text("password"),
      role: text("role").default("user").notNull(),
      status: text("status").default("active").notNull(),
      verificationStatus: text("verificationStatus").default("unverified").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
      lastLogin: timestamp("lastLogin"),
      isVerified: boolean("isVerified").default(false).notNull(),
      verificationLevel: text("verificationLevel").default("basic").notNull(),
      resetToken: text("resetToken"),
      resetTokenExpires: timestamp("resetTokenExpires"),
      // Advanced business fields
      businessName: text("businessName"),
      businessLicense: text("businessLicense"),
      experienceYears: integer("experienceYears"),
      specialties: text("specialties"),
      // Comma separated list of categories
      socialLinks: text("socialLinks"),
      // JSON string
      bannerImage: text("bannerImage")
    });
    categories = pgTable("categories", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      slug: text("slug").notNull().unique(),
      description: text("description"),
      icon: text("icon"),
      parentId: integer("parentId"),
      sector: text("sector").default("marketplace"),
      // marketplace, auction, rental, all
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    listings = pgTable("listings", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      categoryId: integer("categoryId").notNull(),
      title: text("title").notNull(),
      description: text("description"),
      type: text("type").notNull(),
      price: real("price"),
      images: jsonb("images"),
      location: text("location"),
      district: text("district"),
      brand: text("brand"),
      model: text("model"),
      color: text("color"),
      condition: text("condition"),
      status: text("status").default("active"),
      views: integer("views").default(0),
      stock: integer("stock").default(1),
      isFeatured: boolean("isFeatured").default(false),
      featuredUntil: timestamp("featuredUntil"),
      originalPrice: real("originalPrice"),
      discount: integer("discount"),
      videoUrl: text("videoUrl"),
      length: real("length"),
      // Logistics: Length in cm
      width: real("width"),
      // Logistics: Width in cm
      height: real("height"),
      // Logistics: Height in cm
      weight: real("weight"),
      // Logistics: Weight in kg
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      expiresAt: timestamp("expiresAt")
    });
    auctions = pgTable("auctions", {
      id: serial("id").primaryKey(),
      listingId: integer("listingId").notNull(),
      startingPrice: real("startingPrice").notNull(),
      currentBid: real("currentBid"),
      highestBidderId: integer("highestBidderId"),
      startTime: timestamp("startTime").notNull(),
      endTime: timestamp("endTime").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    bids = pgTable("bids", {
      id: serial("id").primaryKey(),
      auctionId: integer("auctionId").notNull(),
      bidderId: integer("bidderId").notNull(),
      amount: real("amount").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    bookings = pgTable("bookings", {
      id: serial("id").primaryKey(),
      listingId: integer("listingId").notNull(),
      userId: integer("userId").notNull(),
      startDate: timestamp("startDate").notNull(),
      endDate: timestamp("endDate").notNull(),
      totalPrice: real("totalPrice").notNull(),
      status: text("status").default("pending"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    favorites = pgTable("favorites", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      listingId: integer("listingId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    messages = pgTable("messages", {
      id: serial("id").primaryKey(),
      senderId: integer("senderId").notNull(),
      recipientId: integer("recipientId").notNull(),
      listingId: integer("listingId"),
      content: text("content").notNull(),
      isRead: boolean("isRead").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      attachmentUrl: text("attachmentUrl"),
      attachmentType: text("attachmentType")
    });
    reviews = pgTable("reviews", {
      id: serial("id").primaryKey(),
      fromUserId: integer("fromUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
      toUserId: integer("toUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
      listingId: integer("listingId").references(() => listings.id, { onDelete: "cascade" }),
      transactionId: integer("transactionId"),
      rating: integer("rating").notNull(),
      title: text("title"),
      comment: text("comment"),
      isVerifiedPurchase: boolean("isVerifiedPurchase").default(false).notNull(),
      helpfulCount: integer("helpfulCount").default(0).notNull(),
      unhelpfulCount: integer("unhelpfulCount").default(0).notNull(),
      status: text("status").default("approved").notNull(),
      sellerResponse: text("sellerResponse"),
      sellerResponseAt: timestamp("sellerResponseAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    notifications = pgTable("notifications", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      type: text("type").notNull(),
      title: text("title").notNull(),
      content: text("content"),
      relatedId: integer("relatedId"),
      isRead: boolean("isRead").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    disputes = pgTable("disputes", {
      id: serial("id").primaryKey(),
      buyerId: integer("buyerId").notNull(),
      sellerId: integer("sellerId").notNull(),
      listingId: integer("listingId").notNull(),
      title: text("title").notNull(),
      description: text("description"),
      status: text("status").default("open").notNull(),
      resolution: text("resolution"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      resolvedAt: timestamp("resolvedAt"),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    adminLogs = pgTable("adminLogs", {
      id: serial("id").primaryKey(),
      adminId: integer("adminId").notNull(),
      action: text("action").notNull(),
      targetUserId: integer("targetUserId"),
      targetListingId: integer("targetListingId"),
      targetDisputeId: integer("targetDisputeId"),
      details: text("details"),
      timestamp: timestamp("timestamp").defaultNow().notNull()
    });
    roles = pgTable("roles", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      description: text("description"),
      level: integer("level").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    permissions = pgTable("permissions", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      description: text("description"),
      category: text("category").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    rolePermissions = pgTable("role_permissions", {
      id: serial("id").primaryKey(),
      roleId: integer("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
      permissionId: integer("permissionId").notNull().references(() => permissions.id, { onDelete: "cascade" }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    userRoles = pgTable("user_roles", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      roleId: integer("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
      assignedBy: integer("assignedBy").references(() => users.id),
      assignedAt: timestamp("assignedAt").defaultNow().notNull(),
      expiresAt: timestamp("expiresAt")
    });
    roleAuditLogs = pgTable("role_audit_logs", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      action: text("action").notNull(),
      targetUserId: integer("targetUserId").references(() => users.id, { onDelete: "set null" }),
      details: text("details"),
      ipAddress: text("ipAddress"),
      userAgent: text("userAgent"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    advertisers = pgTable("advertisers", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      businessName: text("businessName").notNull(),
      businessUrl: text("businessUrl"),
      contactEmail: text("contactEmail").notNull(),
      contactPhone: text("contactPhone"),
      status: text("status").default("pending").notNull(),
      verificationDocuments: text("verificationDocuments"),
      // JSON array of document URLs
      accountBalance: real("accountBalance").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    manualAds = pgTable("manual_ads", {
      id: serial("id").primaryKey(),
      advertiserId: integer("advertiserId").notNull().references(() => advertisers.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      description: text("description"),
      imageUrl: text("imageUrl").notNull(),
      landingUrl: text("landingUrl").notNull(),
      adType: text("adType").notNull(),
      placement: text("placement").notNull(),
      status: text("status").default("draft").notNull(),
      startDate: timestamp("startDate"),
      endDate: timestamp("endDate"),
      dailyBudget: real("dailyBudget").notNull(),
      totalBudget: real("totalBudget").notNull(),
      impressions: integer("impressions").default(0).notNull(),
      clicks: integer("clicks").default(0).notNull(),
      conversions: integer("conversions").default(0).notNull(),
      costPerImpression: real("costPerImpression").notNull(),
      costPerClick: real("costPerClick").notNull(),
      targetAudience: text("targetAudience"),
      // JSON object with targeting criteria
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    adAnalytics = pgTable("ad_analytics", {
      id: serial("id").primaryKey(),
      adId: integer("adId").notNull().references(() => manualAds.id, { onDelete: "cascade" }),
      date: text("date").notNull(),
      impressions: integer("impressions").default(0).notNull(),
      clicks: integer("clicks").default(0).notNull(),
      conversions: integer("conversions").default(0).notNull(),
      spend: real("spend").default(0).notNull(),
      revenue: real("revenue").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    adsensePlacements = pgTable("adsense_placements", {
      id: serial("id").primaryKey(),
      slotId: text("slotId").notNull().unique(),
      placement: text("placement").notNull(),
      adFormat: text("adFormat").notNull(),
      status: text("status").default("active").notNull(),
      width: integer("width"),
      height: integer("height"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    adPayments = pgTable("ad_payments", {
      id: serial("id").primaryKey(),
      advertiserId: integer("advertiserId").notNull().references(() => advertisers.id, { onDelete: "cascade" }),
      amount: real("amount").notNull(),
      paymentMethod: text("paymentMethod").notNull(),
      transactionId: text("transactionId").unique(),
      status: text("status").default("pending").notNull(),
      description: text("description"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    sponsoredAdPricing = pgTable("sponsored_ad_pricing", {
      id: serial("id").primaryKey(),
      tier: text("tier").notNull(),
      // "basic" | "standard" | "premium"
      durationDays: integer("durationDays").notNull(),
      priceNPR: real("priceNPR").notNull(),
      description: text("description"),
      maxSlots: integer("maxSlots").default(10).notNull(),
      isActive: boolean("isActive").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    promotionRequests = pgTable("promotion_requests", {
      id: serial("id").primaryKey(),
      listingId: integer("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      tier: text("tier").notNull(),
      // "basic" | "standard" | "premium"
      durationDays: integer("durationDays").notNull(),
      priceNPR: real("priceNPR").notNull(),
      status: text("status").default("pending").notNull(),
      // "pending" | "approved" | "rejected"
      paymentStatus: text("paymentStatus").default("unpaid").notNull(),
      // "unpaid" | "paid"
      paymentProviderId: text("paymentProviderId"),
      paymentUrl: text("paymentUrl"),
      adminNotes: text("adminNotes"),
      approvedBy: integer("approvedBy"),
      approvedAt: timestamp("approvedAt"),
      featuredUntil: timestamp("featuredUntil"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    emailNotificationPreferences = pgTable("email_notification_preferences", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      newMessages: boolean("newMessages").default(true).notNull(),
      newBids: boolean("newBids").default(true).notNull(),
      bookingConfirmation: boolean("bookingConfirmation").default(true).notNull(),
      listingApproval: boolean("listingApproval").default(true).notNull(),
      listingRejection: boolean("listingRejection").default(true).notNull(),
      weeklyDigest: boolean("weeklyDigest").default(true).notNull(),
      promotionalEmails: boolean("promotionalEmails").default(false).notNull(),
      securityAlerts: boolean("securityAlerts").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    emailQueue = pgTable("email_queue", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      recipientEmail: text("recipientEmail").notNull(),
      subject: text("subject").notNull(),
      template: text("template").notNull(),
      templateData: text("templateData"),
      // JSON data for template rendering
      status: text("status").default("pending").notNull(),
      attemptCount: integer("attemptCount").default(0).notNull(),
      lastAttemptAt: timestamp("lastAttemptAt"),
      sentAt: timestamp("sentAt"),
      errorMessage: text("errorMessage"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    emailLogs = pgTable("email_logs", {
      id: serial("id").primaryKey(),
      emailQueueId: integer("emailQueueId").references(() => emailQueue.id, { onDelete: "cascade" }),
      recipientEmail: text("recipientEmail").notNull(),
      subject: text("subject").notNull(),
      template: text("template").notNull(),
      status: text("status").notNull(),
      openedAt: timestamp("openedAt"),
      clickedAt: timestamp("clickedAt"),
      failureReason: text("failureReason"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    reviewHelpfulVotes = pgTable("review_helpful_votes", {
      id: serial("id").primaryKey(),
      reviewId: integer("reviewId").notNull().references(() => reviews.id, { onDelete: "cascade" }),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      isHelpful: boolean("isHelpful").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    reviewAnalytics = pgTable("review_analytics", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      totalReviews: integer("totalReviews").default(0).notNull(),
      averageRating: real("averageRating").default(0).notNull(),
      fiveStarCount: integer("fiveStarCount").default(0).notNull(),
      fourStarCount: integer("fourStarCount").default(0).notNull(),
      threeStarCount: integer("threeStarCount").default(0).notNull(),
      twoStarCount: integer("twoStarCount").default(0).notNull(),
      oneStarCount: integer("oneStarCount").default(0).notNull(),
      verifiedPurchaseCount: integer("verifiedPurchaseCount").default(0).notNull(),
      lastReviewDate: timestamp("lastReviewDate"),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    flaggedReviews = pgTable("flagged_reviews", {
      id: serial("id").primaryKey(),
      reviewId: integer("reviewId").notNull().references(() => reviews.id, { onDelete: "cascade" }),
      flaggedByUserId: integer("flaggedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
      reason: text("reason").notNull(),
      description: text("description"),
      status: text("status").default("pending").notNull(),
      reviewedByAdminId: integer("reviewedByAdminId").references(() => users.id, { onDelete: "set null" }),
      adminNotes: text("adminNotes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      resolvedAt: timestamp("resolvedAt")
    });
    flaggedListings = pgTable("flagged_listings", {
      id: serial("id").primaryKey(),
      listingId: integer("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
      flaggedByUserId: integer("flaggedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
      reason: text("reason").notNull(),
      description: text("description"),
      status: text("status").default("pending").notNull(),
      reviewedByAdminId: integer("reviewedByAdminId").references(() => users.id, { onDelete: "set null" }),
      adminNotes: text("adminNotes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      resolvedAt: timestamp("resolvedAt")
    });
    verificationSubmissions = pgTable("verification_submissions", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      type: text("type").notNull(),
      // 'kyc' or 'kyb'
      data: jsonb("data").notNull(),
      // Documents and details
      status: text("status").default("pending").notNull(),
      adminNotes: text("adminNotes"),
      reviewedBy: integer("reviewedBy").references(() => users.id),
      reviewedAt: timestamp("reviewedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transactions = pgTable("transactions", {
      id: serial("id").primaryKey(),
      orderId: text("orderId"),
      // Can be booking ID, auction ID, or ad payment ID
      cartId: integer("cartId"),
      // Added for multi-vendor checkout reference
      buyerId: integer("buyerId").references(() => users.id),
      sellerId: integer("sellerId").references(() => users.id),
      listingId: integer("listingId").references(() => listings.id),
      amount: real("amount").notNull(),
      platformFee: real("platformFee").default(0).notNull(),
      tax: real("tax").default(0).notNull(),
      netAmount: real("netAmount").notNull(),
      currency: text("currency").default("NPR").notNull(),
      status: text("status").default("pending").notNull(),
      // pending, completed, failed, refunded
      paymentMethod: text("paymentMethod"),
      transactionType: text("transactionType").notNull(),
      // 'sale', 'rental', 'ad_payment', 'featured_listing'
      trackingNumber: text("trackingNumber"),
      // Added for logistics webhook tracking
      logisticsPartnerId: integer("logisticsPartnerId"),
      // Reference to the partner
      deliveryName: text("deliveryName"),
      deliveryAddress: text("deliveryAddress"),
      deliveryPhone: text("deliveryPhone"),
      deliveryEmail: text("deliveryEmail"),
      deliverySpeed: text("deliverySpeed"),
      deliveryFee: real("deliveryFee"),
      estDeliveryDate: text("estDeliveryDate"),
      placedAt: timestamp("placedAt"),
      processedAt: timestamp("processedAt"),
      shippedAt: timestamp("shippedAt"),
      deliveredAt: timestamp("deliveredAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    carts = pgTable("carts", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      status: text("status").default("active").notNull(),
      // active, checked_out, abandoned
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    cartItems = pgTable("cart_items", {
      id: serial("id").primaryKey(),
      cartId: integer("cartId").notNull().references(() => carts.id, { onDelete: "cascade" }),
      listingId: integer("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
      quantity: integer("quantity").default(1).notNull(),
      priceAtAddition: real("priceAtAddition"),
      // Snapshot price when added
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    logisticsPartners = pgTable("logistics_partners", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      // e.g., 'upaya', 'pathao', 'ncm'
      displayName: text("displayName").notNull(),
      isActive: boolean("isActive").default(false).notNull(),
      webhookUrl: text("webhookUrl"),
      apiKey: text("apiKey"),
      apiSecret: text("apiSecret"),
      trackingUrlFormat: text("trackingUrlFormat"),
      // e.g., 'https://upaya.com/track/{trackingNumber}'
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    usersRelations = relations(users, ({ many }) => ({
      listings: many(listings),
      transactions: many(transactions, { relationName: "buyerTransactions" }),
      sales: many(transactions, { relationName: "sellerTransactions" }),
      verifications: many(verificationSubmissions)
    }));
    listingsRelations = relations(listings, ({ one, many }) => ({
      user: one(users, {
        fields: [listings.userId],
        references: [users.id]
      }),
      category: one(categories, {
        fields: [listings.categoryId],
        references: [categories.id]
      }),
      transactions: many(transactions)
    }));
    transactionsRelations = relations(transactions, ({ one }) => ({
      buyer: one(users, {
        fields: [transactions.buyerId],
        references: [users.id]
      }),
      seller: one(users, {
        fields: [transactions.sellerId],
        references: [users.id]
      }),
      listing: one(listings, {
        fields: [transactions.listingId],
        references: [listings.id]
      }),
      cart: one(carts, {
        fields: [transactions.cartId],
        references: [carts.id]
      }),
      logisticsPartner: one(logisticsPartners, {
        fields: [transactions.logisticsPartnerId],
        references: [logisticsPartners.id]
      })
    }));
    cartsRelations = relations(carts, ({ one, many }) => ({
      user: one(users, {
        fields: [carts.userId],
        references: [users.id]
      }),
      items: many(cartItems),
      transactions: many(transactions)
    }));
    cartItemsRelations = relations(cartItems, ({ one }) => ({
      cart: one(carts, {
        fields: [cartItems.cartId],
        references: [carts.id]
      }),
      listing: one(listings, {
        fields: [cartItems.listingId],
        references: [listings.id]
      })
    }));
    categoriesRelations = relations(categories, ({ many }) => ({
      listings: many(listings)
    }));
    companyConfigs = pgTable("company_configs", {
      id: serial("id").primaryKey(),
      email: text("email").notNull(),
      phone: text("phone").notNull(),
      location: text("location").notNull(),
      commissionRate: real("commissionRate").default(0).notNull(),
      // Platform commission percentage
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    paymentGateways = pgTable("payment_gateways", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      // e.g. 'esewa', 'khalti', 'fonepay', 'visa'
      displayName: text("displayName").notNull(),
      // e.g. 'eSewa', 'Khalti'
      isActive: boolean("isActive").default(false).notNull(),
      apiKey: text("apiKey"),
      apiSecret: text("apiSecret"),
      merchantId: text("merchantId"),
      endpoint: text("endpoint"),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    reports = pgTable("reports", {
      id: serial("id").primaryKey(),
      reporterName: text("reporterName"),
      reporterEmail: text("reporterEmail").notNull(),
      subject: text("subject").notNull(),
      description: text("description").notNull(),
      status: text("status").default("pending").notNull(),
      // pending, resolved
      adminNotes: text("adminNotes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      resolvedAt: timestamp("resolvedAt")
    });
    careers = pgTable("careers", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      department: text("department").notNull(),
      location: text("location").notNull(),
      salaryRange: text("salaryRange").notNull(),
      type: text("type").notNull(),
      // Full-Time, Part-Time, Hybrid, etc.
      description: text("description").notNull(),
      requirements: text("requirements"),
      // newline separated
      status: text("status").default("active").notNull(),
      // active, closed
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    returns = pgTable("returns", {
      id: serial("id").primaryKey(),
      transactionId: integer("transactionId").notNull().references(() => transactions.id, { onDelete: "cascade" }),
      buyerId: integer("buyerId").notNull().references(() => users.id, { onDelete: "cascade" }),
      sellerId: integer("sellerId").notNull().references(() => users.id, { onDelete: "cascade" }),
      reason: text("reason").notNull(),
      description: text("description"),
      images: jsonb("images"),
      // Array of URLs
      status: text("status").default("pending").notNull(),
      // pending, approved, rejected, refunded
      adminNotes: text("adminNotes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    returnsRelations = relations(returns, ({ one }) => ({
      transaction: one(transactions, {
        fields: [returns.transactionId],
        references: [transactions.id]
      }),
      buyer: one(users, {
        fields: [returns.buyerId],
        references: [users.id]
      }),
      seller: one(users, {
        fields: [returns.sellerId],
        references: [users.id]
      })
    }));
  }
});

// backend/_core/crypto.ts
import crypto from "crypto";
function getEncryptionKey() {
  const envKey = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!envKey) {
    return DEFAULT_KEY;
  }
  return crypto.createHash("sha256").update(envKey).digest();
}
function encryptMessage(text2) {
  if (!text2) return "";
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text2, "utf8", "base64");
    encrypted += cipher.final("base64");
    return `ENC:${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("[Encryption] Failed to encrypt message:", error);
    return text2;
  }
}
function decryptMessage(encryptedText) {
  if (!encryptedText || !encryptedText.startsWith("ENC:")) {
    return encryptedText;
  }
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      return encryptedText;
    }
    const ivHex = parts[1];
    const encryptedData = parts[2];
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt message:", error);
    return encryptedText;
  }
}
var ALGORITHM, DEFAULT_KEY;
var init_crypto = __esm({
  "backend/_core/crypto.ts"() {
    "use strict";
    ALGORITHM = "aes-256-cbc";
    DEFAULT_KEY = Buffer.from("f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9", "utf8");
  }
});

// backend/db.ts
var db_exports = {};
__export(db_exports, {
  addSellerResponse: () => addSellerResponse,
  archiveCareerOpening: () => archiveCareerOpening,
  createCareerOpening: () => createCareerOpening,
  createTransaction: () => createTransaction,
  db: () => db,
  deleteReview: () => deleteReview,
  flagReview: () => flagReview,
  getActivePaymentGateways: () => getActivePaymentGateways,
  getAllCategories: () => getAllCategories,
  getAllReports: () => getAllReports,
  getAuctionById: () => getAuctionById,
  getAuctionByListingId: () => getAuctionByListingId,
  getAuctions: () => getAuctions,
  getBidsForAuction: () => getBidsForAuction,
  getCareers: () => getCareers,
  getCategories: () => getCategories,
  getCompanyConfig: () => getCompanyConfig,
  getConversations: () => getConversations,
  getDb: () => getDb,
  getFlaggedReviews: () => getFlaggedReviews,
  getListingBookings: () => getListingBookings,
  getListingById: () => getListingById,
  getListings: () => getListings,
  getMessages: () => getMessages,
  getPaymentGateways: () => getPaymentGateways,
  getReviewById: () => getReviewById,
  getSellerTransactions: () => getSellerTransactions,
  getSubcategories: () => getSubcategories,
  getUserBids: () => getUserBids,
  getUserBookings: () => getUserBookings,
  getUserByEmail: () => getUserByEmail,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  getUserFavorites: () => getUserFavorites,
  getUserGivenReviews: () => getUserGivenReviews,
  getUserListings: () => getUserListings,
  getUserNotifications: () => getUserNotifications,
  getUserReceivedReviews: () => getUserReceivedReviews,
  getUserReviewAnalytics: () => getUserReviewAnalytics,
  getUserReviews: () => getUserReviews,
  getUserTransactions: () => getUserTransactions,
  isFavorited: () => isFavorited,
  markReviewHelpful: () => markReviewHelpful,
  resolveFlaggedReview: () => resolveFlaggedReview,
  resolveReport: () => resolveReport,
  searchListings: () => searchListings,
  submitReport: () => submitReport,
  submitReview: () => submitReview,
  updateCompanyConfig: () => updateCompanyConfig,
  updatePaymentGateway: () => updatePaymentGateway,
  updateReviewAnalytics: () => updateReviewAnalytics,
  updateReviewStatus: () => updateReviewStatus,
  upsertUser: () => upsertUser
});
import { eq, desc, and, gt, like, isNull, sql, or, not } from "drizzle-orm/sql";
import { drizzle as pgDrizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
function initPostgres(connectionString) {
  const sqlConnection = postgres(connectionString, {
    ssl: { rejectUnauthorized: false }
    // Use SSL by default for NeonDB compatibility
  });
  return pgDrizzle(sqlConnection, { schema: schema_exports });
}
async function getDb() {
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db3 = await getDb();
  if (!db3) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod", "phone", "location", "bio", "avatar"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "super_admin";
      updateSet.role = "super_admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db3.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db3 = await getDb();
  if (!db3) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db3.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmail(email) {
  const db3 = await getDb();
  if (!db3) return void 0;
  const result = await db3.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db3 = await getDb();
  if (!db3) return void 0;
  const result = await db3.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getListings(limit = 20, offset = 0) {
  const db3 = await getDb();
  if (!db3) return [];
  const results = await db3.select({
    listing: listings,
    seller: {
      name: users.name,
      avatar: users.avatar,
      verificationStatus: users.verificationStatus
    }
  }).from(listings).leftJoin(users, eq(listings.userId, users.id)).where(and(
    eq(listings.status, "active"),
    gt(listings.stock, 0)
  )).orderBy(desc(listings.createdAt)).limit(limit).offset(offset);
  return results.map((row) => ({
    ...row.listing,
    seller: row.seller
  }));
}
async function getListingById(id) {
  const db3 = await getDb();
  if (!db3) return void 0;
  const results = await db3.select({
    listing: listings,
    seller: {
      name: users.name,
      avatar: users.avatar,
      verificationStatus: users.verificationStatus
    }
  }).from(listings).leftJoin(users, eq(listings.userId, users.id)).where(eq(listings.id, id)).limit(1);
  if (results.length === 0) return void 0;
  return {
    ...results[0].listing,
    seller: results[0].seller
  };
}
async function getUserListings(userId) {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(listings).where(eq(listings.userId, userId)).orderBy(desc(listings.createdAt));
}
async function searchListings(query, limit = 20) {
  const db3 = await getDb();
  if (!db3) return [];
  const results = await db3.select({
    listing: listings,
    seller: {
      name: users.name,
      avatar: users.avatar,
      verificationStatus: users.verificationStatus
    }
  }).from(listings).leftJoin(users, eq(listings.userId, users.id)).where(and(
    eq(listings.status, "active"),
    gt(listings.stock, 0),
    like(listings.title, `%${query}%`)
  )).orderBy(desc(listings.createdAt)).limit(limit);
  return results.map((row) => ({
    ...row.listing,
    seller: row.seller
  }));
}
function normalizeCategoryName(category) {
  if (!category || typeof category.name !== "string") return category;
  const normalized = category.name.replace(/\s+(Auctions?|Rentals?)$/i, "");
  return normalized === category.name ? category : { ...category, name: normalized };
}
async function getCategories(sector) {
  const db3 = await getDb();
  if (!db3) return [];
  const rootCategoryQuery = db3.select().from(categories).where(and(
    isNull(categories.parentId),
    not(eq(categories.slug, "want-to-buy"))
  ));
  const mapResults = (rows2) => rows2.map(normalizeCategoryName);
  if (sector) {
    const categoryConditions = [
      isNull(categories.parentId),
      or(
        eq(categories.sector, sector),
        eq(categories.sector, "all")
      ),
      not(eq(categories.slug, "want-to-buy"))
    ];
    const rows2 = await db3.select().from(categories).where(and(...categoryConditions)).orderBy(categories.name);
    return mapResults(rows2);
  }
  const rows = await rootCategoryQuery.orderBy(categories.name);
  return mapResults(rows);
}
async function getSubcategories(parentId, sector) {
  const db3 = await getDb();
  if (!db3) return [];
  const mapResults = (rows2) => rows2.map(normalizeCategoryName);
  if (sector) {
    const rows2 = await db3.select().from(categories).where(and(
      eq(categories.parentId, parentId),
      or(
        eq(categories.sector, sector),
        eq(categories.sector, "all")
      )
    )).orderBy(categories.name);
    return mapResults(rows2);
  }
  const rows = await db3.select().from(categories).where(eq(categories.parentId, parentId)).orderBy(categories.name);
  return mapResults(rows);
}
async function getAllCategories() {
  const db3 = await getDb();
  if (!db3) return [];
  const rows = await db3.select().from(categories).orderBy(categories.name);
  return rows.map(normalizeCategoryName);
}
async function getAuctions(limit = 20) {
  const db3 = await getDb();
  if (!db3) return [];
  const result = await db3.select({
    auction: auctions,
    listing: listings,
    seller: users
  }).from(auctions).innerJoin(listings, eq(auctions.listingId, listings.id)).innerJoin(users, eq(listings.userId, users.id)).orderBy(desc(auctions.endTime)).limit(limit);
  return result.map((r) => ({
    ...r.auction,
    listing: {
      title: r.listing.title,
      description: r.listing.description,
      price: r.listing.price,
      images: r.listing.images,
      location: r.listing.location,
      category: r.listing.categoryId,
      seller: {
        name: r.seller.name,
        isVerified: r.seller.isVerified,
        rating: 4.5
      }
    }
  }));
}
async function getAuctionById(id) {
  const db3 = await getDb();
  if (!db3) return void 0;
  const result = await db3.select({
    auction: auctions,
    listing: listings,
    seller: users
  }).from(auctions).innerJoin(listings, eq(auctions.listingId, listings.id)).innerJoin(users, eq(listings.userId, users.id)).where(eq(auctions.id, id)).limit(1);
  if (result.length === 0) return void 0;
  return {
    ...result[0].auction,
    title: result[0].listing.title,
    description: result[0].listing.description,
    image: result[0].listing.images?.[0] || "",
    location: result[0].listing.location,
    sellerName: result[0].seller.name,
    sellerRating: 4.8
    // Default rating for now
  };
}
async function getAuctionByListingId(listingId) {
  const db3 = await getDb();
  if (!db3) return void 0;
  const result = await db3.select({
    auction: auctions,
    listing: listings,
    seller: users
  }).from(auctions).innerJoin(listings, eq(auctions.listingId, listings.id)).innerJoin(users, eq(listings.userId, users.id)).where(eq(auctions.listingId, listingId)).limit(1);
  if (result.length === 0) return void 0;
  return {
    ...result[0].auction,
    title: result[0].listing.title,
    description: result[0].listing.description,
    image: result[0].listing.images?.[0] || "",
    location: result[0].listing.location,
    sellerName: result[0].seller.name,
    sellerRating: 4.8
  };
}
async function getBidsForAuction(auctionId) {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(bids).where(eq(bids.auctionId, auctionId)).orderBy(desc(bids.createdAt));
}
async function getConversations(userId) {
  const db3 = await getDb();
  if (!db3) return [];
  const results = await db3.select({
    id: messages.id,
    partnerId: sql`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.recipientId} ELSE ${messages.senderId} END`,
    content: messages.content,
    createdAt: messages.createdAt,
    isRead: messages.isRead,
    partnerName: users.name,
    partnerAvatar: users.avatar,
    listingId: messages.listingId
  }).from(messages).innerJoin(users, eq(sql`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.recipientId} ELSE ${messages.senderId} END`, users.id)).where(or(
    eq(messages.senderId, userId),
    eq(messages.recipientId, userId)
  )).orderBy(desc(messages.createdAt));
  const uniqueConversations = [];
  const seenPartners = /* @__PURE__ */ new Set();
  for (const row of results) {
    if (!seenPartners.has(row.partnerId)) {
      seenPartners.add(row.partnerId);
      row.content = decryptMessage(row.content);
      uniqueConversations.push(row);
    }
  }
  return uniqueConversations;
}
async function getMessages(userId1, userId2) {
  const db3 = await getDb();
  if (!db3) return [];
  const rows = await db3.select().from(messages).where(or(
    and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
    and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
  )).orderBy(messages.createdAt);
  return rows.map((row) => ({
    ...row,
    content: decryptMessage(row.content)
  }));
}
async function getUserReviews(userId) {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(reviews).where(eq(reviews.toUserId, userId)).orderBy(desc(reviews.createdAt));
}
async function getUserFavorites(userId) {
  const db3 = await getDb();
  if (!db3) return [];
  const results = await db3.select({
    id: favorites.id,
    listingId: favorites.listingId,
    title: listings.title,
    price: listings.price,
    image: listings.images,
    location: listings.location,
    createdAt: favorites.createdAt
  }).from(favorites).innerJoin(listings, eq(favorites.listingId, listings.id)).where(eq(favorites.userId, userId));
  return results.map((row) => ({
    ...row,
    image: row.image?.[0] || ""
  }));
}
async function isFavorited(userId, listingId) {
  const db3 = await getDb();
  if (!db3) return false;
  const result = await db3.select().from(favorites).where(and(
    eq(favorites.userId, userId),
    eq(favorites.listingId, listingId)
  )).limit(1);
  return result.length > 0;
}
async function getUserBookings(userId) {
  const db3 = await getDb();
  if (!db3) return [];
  const results = await db3.select({
    id: bookings.id,
    listingId: bookings.listingId,
    title: listings.title,
    startDate: bookings.startDate,
    endDate: bookings.endDate,
    totalPrice: bookings.totalPrice,
    status: bookings.status,
    image: listings.images
  }).from(bookings).innerJoin(listings, eq(bookings.listingId, listings.id)).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
  return results.map((row) => ({
    ...row,
    image: row.image?.[0] || ""
  }));
}
async function getListingBookings(listingId) {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(bookings).where(eq(bookings.listingId, listingId)).orderBy(desc(bookings.createdAt));
}
async function getUserTransactions(userId) {
  const db3 = await getDb();
  if (!db3) return [];
  const results = await db3.select({
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
    image: listings.images
  }).from(transactions).innerJoin(listings, eq(transactions.listingId, listings.id)).where(eq(transactions.buyerId, userId)).orderBy(desc(transactions.createdAt));
  return results.map((row) => ({
    ...row,
    image: row.image?.[0] || ""
  }));
}
async function createTransaction(values) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  return db3.insert(transactions).values(values).returning();
}
async function getSellerTransactions(userId) {
  const db3 = await getDb();
  if (!db3) return [];
  const results = await db3.select({
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
    image: listings.images
  }).from(transactions).innerJoin(listings, eq(transactions.listingId, listings.id)).where(eq(transactions.sellerId, userId)).orderBy(desc(transactions.createdAt));
  return results.map((row) => ({
    ...row,
    image: row.image?.[0] || ""
  }));
}
async function getUserBids(userId) {
  const db3 = await getDb();
  if (!db3) return [];
  const results = await db3.select({
    id: bids.id,
    auctionId: bids.auctionId,
    amount: bids.amount,
    createdAt: bids.createdAt,
    auctionTitle: listings.title,
    currentHighestBid: auctions.currentBid,
    endTime: auctions.endTime,
    image: listings.images
  }).from(bids).innerJoin(auctions, eq(bids.auctionId, auctions.id)).innerJoin(listings, eq(auctions.listingId, listings.id)).where(eq(bids.bidderId, userId)).orderBy(desc(bids.createdAt));
  return results.map((row) => ({
    ...row,
    image: row.image?.[0] || ""
  }));
}
async function getUserNotifications(userId) {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}
async function submitReview(fromUserId, toUserId, data) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  const result = await db3.insert(reviews).values({
    fromUserId,
    toUserId,
    listingId: data.listingId,
    transactionId: data.transactionId,
    rating: Math.max(1, Math.min(5, data.rating)),
    title: data.title,
    comment: data.comment,
    isVerifiedPurchase: data.isVerifiedPurchase || false
  }).returning({ insertId: reviews.id });
  await updateReviewAnalytics(toUserId);
  return result;
}
async function getReviewById(reviewId) {
  const db3 = await getDb();
  if (!db3) return void 0;
  const result = await db3.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserReceivedReviews(userId, limit = 20, offset = 0) {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(reviews).where(and(
    eq(reviews.toUserId, userId),
    eq(reviews.status, "approved")
  )).orderBy(desc(reviews.createdAt)).limit(limit).offset(offset);
}
async function getUserGivenReviews(userId, limit = 20, offset = 0) {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(reviews).where(eq(reviews.fromUserId, userId)).orderBy(desc(reviews.createdAt)).limit(limit).offset(offset);
}
async function updateReviewStatus(reviewId, status) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  const review = await getReviewById(reviewId);
  if (!review) throw new Error("Review not found");
  await db3.update(reviews).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(reviews.id, reviewId));
  if (status === "approved" || review.status === "approved") {
    await updateReviewAnalytics(review.toUserId);
  }
}
async function addSellerResponse(reviewId, response) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  return db3.update(reviews).set({
    sellerResponse: response,
    sellerResponseAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(reviews.id, reviewId));
}
async function markReviewHelpful(reviewId, userId, isHelpful) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  const existing = await db3.select().from(reviewHelpfulVotes).where(and(
    eq(reviewHelpfulVotes.reviewId, reviewId),
    eq(reviewHelpfulVotes.userId, userId)
  )).limit(1);
  if (existing.length > 0) {
    await db3.update(reviewHelpfulVotes).set({ isHelpful }).where(and(
      eq(reviewHelpfulVotes.reviewId, reviewId),
      eq(reviewHelpfulVotes.userId, userId)
    ));
  } else {
    await db3.insert(reviewHelpfulVotes).values({
      reviewId,
      userId,
      isHelpful
    });
  }
  const votes = await db3.select().from(reviewHelpfulVotes).where(eq(reviewHelpfulVotes.reviewId, reviewId));
  const helpfulCount = votes.filter((v) => v.isHelpful).length;
  const unhelpfulCount = votes.filter((v) => !v.isHelpful).length;
  return db3.update(reviews).set({
    helpfulCount,
    unhelpfulCount,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(reviews.id, reviewId));
}
async function flagReview(reviewId, flaggedByUserId, reason, description) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  await db3.insert(flaggedReviews).values({
    reviewId,
    flaggedByUserId,
    reason,
    description
  });
  return db3.update(reviews).set({ status: "flagged", updatedAt: /* @__PURE__ */ new Date() }).where(eq(reviews.id, reviewId));
}
async function getFlaggedReviews(limit = 20, offset = 0) {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(flaggedReviews).where(eq(flaggedReviews.status, "pending")).orderBy(desc(flaggedReviews.createdAt)).limit(limit).offset(offset);
}
async function resolveFlaggedReview(flaggedReviewId, adminId, status, adminNotes) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  const flaggedReview = await db3.select().from(flaggedReviews).where(eq(flaggedReviews.id, flaggedReviewId)).limit(1);
  if (flaggedReview.length === 0) throw new Error("Flagged review not found");
  await db3.update(flaggedReviews).set({
    status,
    reviewedByAdminId: adminId,
    adminNotes,
    resolvedAt: /* @__PURE__ */ new Date()
  }).where(eq(flaggedReviews.id, flaggedReviewId));
  if (status === "removed") {
    const review = await getReviewById(flaggedReview[0].reviewId);
    if (review) {
      await db3.update(reviews).set({ status: "rejected", updatedAt: /* @__PURE__ */ new Date() }).where(eq(reviews.id, flaggedReview[0].reviewId));
      await updateReviewAnalytics(review.toUserId);
    }
  }
}
async function getUserReviewAnalytics(userId) {
  const db3 = await getDb();
  if (!db3) return void 0;
  let analytics = await db3.select().from(reviewAnalytics).where(eq(reviewAnalytics.userId, userId)).limit(1);
  if (analytics.length === 0) {
    await db3.insert(reviewAnalytics).values({
      userId,
      totalReviews: 0,
      averageRating: 0
    });
    analytics = await db3.select().from(reviewAnalytics).where(eq(reviewAnalytics.userId, userId)).limit(1);
  }
  return analytics[0];
}
async function updateReviewAnalytics(userId) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  const userReviews = await db3.select().from(reviews).where(and(
    eq(reviews.toUserId, userId),
    eq(reviews.status, "approved")
  ));
  if (userReviews.length === 0) {
    return db3.update(reviewAnalytics).set({
      totalReviews: 0,
      averageRating: 0,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(reviewAnalytics.userId, userId));
  }
  const totalReviews = userReviews.length;
  const averageRating = userReviews.reduce((sum2, r) => sum2 + r.rating, 0) / totalReviews;
  const fiveStarCount = userReviews.filter((r) => r.rating === 5).length;
  const fourStarCount = userReviews.filter((r) => r.rating === 4).length;
  const threeStarCount = userReviews.filter((r) => r.rating === 3).length;
  const twoStarCount = userReviews.filter((r) => r.rating === 2).length;
  const oneStarCount = userReviews.filter((r) => r.rating === 1).length;
  const verifiedPurchaseCount = userReviews.filter((r) => r.isVerifiedPurchase).length;
  const lastReviewDate = userReviews[0]?.createdAt;
  return db3.update(reviewAnalytics).set({
    totalReviews,
    averageRating: Math.round(averageRating * 100) / 100,
    fiveStarCount,
    fourStarCount,
    threeStarCount,
    twoStarCount,
    oneStarCount,
    verifiedPurchaseCount,
    lastReviewDate,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(reviewAnalytics.userId, userId));
}
async function deleteReview(reviewId) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  const review = await getReviewById(reviewId);
  if (!review) throw new Error("Review not found");
  await db3.delete(reviewHelpfulVotes).where(eq(reviewHelpfulVotes.reviewId, reviewId));
  await db3.delete(flaggedReviews).where(eq(flaggedReviews.reviewId, reviewId));
  await db3.delete(reviews).where(eq(reviews.id, reviewId));
  await updateReviewAnalytics(review.toUserId);
}
async function getCompanyConfig() {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  const results = await db3.select().from(companyConfigs).limit(1);
  if (results.length > 0) return results[0];
  const defaultConfig = {
    id: 1,
    email: "support@sasto.com",
    phone: "+977-1-4123456",
    location: "New Baneshwor, Kathmandu",
    commissionRate: 0,
    updatedAt: /* @__PURE__ */ new Date()
  };
  try {
    await db3.insert(companyConfigs).values(defaultConfig);
  } catch (e) {
    console.error("Seeding companyConfigs failed", e);
  }
  return defaultConfig;
}
async function updateCompanyConfig(data) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  const active = await getCompanyConfig();
  const updateData = { updatedAt: /* @__PURE__ */ new Date() };
  if (data.email !== void 0) updateData.email = data.email;
  if (data.phone !== void 0) updateData.phone = data.phone;
  if (data.location !== void 0) updateData.location = data.location;
  if (data.commissionRate !== void 0) updateData.commissionRate = data.commissionRate;
  await db3.update(companyConfigs).set(updateData).where(eq(companyConfigs.id, active.id));
  return { ...active, ...updateData };
}
async function submitReport(data) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  return db3.insert(reports).values({
    reporterName: data.reporterName || null,
    reporterEmail: data.reporterEmail,
    subject: data.subject,
    description: data.description,
    status: "pending",
    createdAt: /* @__PURE__ */ new Date()
  }).returning({ insertId: reports.id });
}
async function getAllReports() {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(reports).orderBy(desc(reports.createdAt));
}
async function resolveReport(reportId, adminNotes) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  return db3.update(reports).set({ status: "resolved", adminNotes: adminNotes || null, resolvedAt: /* @__PURE__ */ new Date() }).where(eq(reports.id, reportId));
}
async function getCareers() {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select().from(careers).where(eq(careers.status, "active")).orderBy(desc(careers.createdAt));
}
async function createCareerOpening(data) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  return db3.insert(careers).values({
    title: data.title,
    department: data.department,
    location: data.location,
    salaryRange: data.salaryRange,
    type: data.type,
    description: data.description,
    requirements: data.requirements || null,
    status: "active",
    createdAt: /* @__PURE__ */ new Date()
  }).returning({ insertId: careers.id });
}
async function archiveCareerOpening(id) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  return db3.update(careers).set({ status: "closed" }).where(eq(careers.id, id));
}
async function getPaymentGateways() {
  const db3 = await getDb();
  if (!db3) return [];
  let gateways = await db3.select().from(paymentGateways).orderBy(paymentGateways.name);
  if (gateways.length === 0) {
    const defaults = [
      { name: "esewa", displayName: "eSewa Mobile Wallet", isActive: false, updatedAt: /* @__PURE__ */ new Date() },
      { name: "khalti", displayName: "Khalti", isActive: false, updatedAt: /* @__PURE__ */ new Date() },
      { name: "visa", displayName: "Visa / Mastercard", isActive: false, updatedAt: /* @__PURE__ */ new Date() },
      { name: "fonepay", displayName: "Fonepay", isActive: false, updatedAt: /* @__PURE__ */ new Date() }
    ];
    for (const gw of defaults) {
      await db3.insert(paymentGateways).values(gw);
    }
    gateways = await db3.select().from(paymentGateways).orderBy(paymentGateways.name);
  }
  return gateways;
}
async function getActivePaymentGateways() {
  const db3 = await getDb();
  if (!db3) return [];
  return db3.select({
    id: paymentGateways.id,
    name: paymentGateways.name,
    displayName: paymentGateways.displayName,
    isActive: paymentGateways.isActive
  }).from(paymentGateways).where(eq(paymentGateways.isActive, true));
}
async function updatePaymentGateway(name, data) {
  const db3 = await getDb();
  if (!db3) throw new Error("Database not available");
  const existing = await db3.select().from(paymentGateways).where(eq(paymentGateways.name, name)).limit(1);
  if (existing.length === 0) {
    await db3.insert(paymentGateways).values({
      name,
      displayName: data.displayName || name,
      isActive: data.isActive || false,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      merchantId: data.merchantId,
      endpoint: data.endpoint,
      updatedAt: /* @__PURE__ */ new Date()
    });
  } else {
    await db3.update(paymentGateways).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(paymentGateways.name, name));
  }
}
var rawConnectionString, _db, db;
var init_db = __esm({
  "backend/db.ts"() {
    "use strict";
    init_schema();
    init_schema();
    init_env();
    init_crypto();
    init_debugLog();
    rawConnectionString = process.env.DATABASE_URL;
    if (!rawConnectionString) {
      writeDebugLog({
        sessionId: "90368c",
        runId: "debug_pre",
        hypothesisId: "H1_env",
        location: "backend/db.ts:database_url_missing",
        message: "DATABASE_URL missing",
        data: { DATABASE_URL_SET: false },
        timestamp: Date.now()
      });
      throw new Error("DATABASE_URL environment variable is required for Postgres connection");
    }
    _db = void 0;
    try {
      _db = initPostgres(rawConnectionString);
      console.info("[Database] Initialized Postgres via DATABASE_URL");
      writeDebugLog({
        sessionId: "90368c",
        runId: "debug_pre",
        hypothesisId: "H3_db",
        location: "backend/db.ts:db_init_success",
        message: "DB initialized",
        data: { DATABASE_URL_SET: true },
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("[Database] Failed to initialize Postgres DB:", err);
      throw err;
    }
    db = _db;
  }
});

// backend/websocket.ts
var websocket_exports = {};
__export(websocket_exports, {
  WebSocketManager: () => WebSocketManager,
  getWebSocketManager: () => getWebSocketManager,
  initializeWebSocket: () => initializeWebSocket
});
import { Server as SocketIOServer } from "socket.io";
function initializeWebSocket(httpServer) {
  if (!wsManager) {
    wsManager = new WebSocketManager(httpServer);
  }
  return wsManager;
}
function getWebSocketManager() {
  if (!wsManager) {
    throw new Error("WebSocket manager not initialized");
  }
  return wsManager;
}
var WebSocketManager, wsManager;
var init_websocket = __esm({
  "backend/websocket.ts"() {
    "use strict";
    WebSocketManager = class {
      io;
      userSockets = /* @__PURE__ */ new Map();
      auctionSubscribers = /* @__PURE__ */ new Map();
      constructor(httpServer) {
        this.io = new SocketIOServer(httpServer, {
          cors: {
            origin: "*",
            methods: ["GET", "POST"]
          },
          transports: ["websocket", "polling"]
        });
        this.setupConnectionHandlers();
      }
      setupConnectionHandlers() {
        this.io.on("connection", (socket) => {
          console.log(`[WebSocket] User connected: ${socket.id}`);
          socket.on("authenticate", (userId) => {
            this.registerUserSocket(userId, socket.id);
            socket.emit("authenticated", { userId, socketId: socket.id });
            this.broadcastUserStatus(userId, "online");
            socket.join(`messages:${userId}`);
            console.log(`[WebSocket] User ${userId} joined room messages:${userId}`);
          });
          socket.on("subscribe-auction", (auctionId) => {
            this.subscribeToAuction(auctionId, socket.id);
            socket.join(`auction:${auctionId}`);
          });
          socket.on("unsubscribe-auction", (auctionId) => {
            this.unsubscribeFromAuction(auctionId, socket.id);
            socket.leave(`auction:${auctionId}`);
          });
          socket.on("subscribe-messages", (userId) => {
            socket.join(`messages:${userId}`);
          });
          socket.on("disconnect", () => {
            console.log(`[WebSocket] User disconnected: ${socket.id}`);
            this.unregisterUserSocket(socket.id);
          });
        });
      }
      registerUserSocket(userId, socketId) {
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, /* @__PURE__ */ new Set());
        }
        this.userSockets.get(userId).add(socketId);
      }
      unregisterUserSocket(socketId) {
        for (const [userId, sockets] of Array.from(this.userSockets.entries())) {
          sockets.delete(socketId);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
            this.broadcastUserStatus(userId, "offline");
          }
        }
      }
      subscribeToAuction(auctionId, socketId) {
        if (!this.auctionSubscribers.has(auctionId)) {
          this.auctionSubscribers.set(auctionId, /* @__PURE__ */ new Set());
        }
        this.auctionSubscribers.get(auctionId).add(socketId);
      }
      unsubscribeFromAuction(auctionId, socketId) {
        const subscribers = this.auctionSubscribers.get(auctionId);
        if (subscribers) {
          subscribers.delete(socketId);
          if (subscribers.size === 0) {
            this.auctionSubscribers.delete(auctionId);
          }
        }
      }
      /**
       * Broadcast a new bid to all users watching an auction
       */
      broadcastBid(auctionUpdate) {
        this.io.to(`auction:${auctionUpdate.auctionId}`).emit("bid-placed", {
          auctionId: auctionUpdate.auctionId,
          listingId: auctionUpdate.listingId,
          currentBid: auctionUpdate.currentBid,
          highestBidderId: auctionUpdate.highestBidderId,
          bidderName: auctionUpdate.bidderName,
          timestamp: auctionUpdate.timestamp
        });
        console.log(
          `[WebSocket] Broadcast bid for auction ${auctionUpdate.auctionId}: NPR ${auctionUpdate.currentBid}`
        );
      }
      /**
       * Send a message notification to a specific user
       */
      notifyMessage(event) {
        const payload = {
          id: event.id,
          senderId: event.senderId,
          recipientId: event.recipientId,
          content: event.content,
          timestamp: event.timestamp,
          attachmentUrl: event.attachmentUrl,
          attachmentType: event.attachmentType
        };
        this.io.to(`messages:${event.recipientId}`).emit("new-message", payload);
        this.io.to(`messages:${event.senderId}`).emit("new-message", payload);
        console.log(
          `[WebSocket] Message notification sent to users ${event.senderId} and ${event.recipientId}`
        );
      }
      /**
       * Broadcast user online/offline status
       */
      broadcastUserStatus(userId, status) {
        this.io.emit("user-status", {
          userId,
          status,
          timestamp: /* @__PURE__ */ new Date()
        });
        console.log(`[WebSocket] User ${userId} is now ${status}`);
      }
      /**
       * Notify auction end
       */
      notifyAuctionEnd(auctionId, winnerId, finalPrice) {
        this.io.to(`auction:${auctionId}`).emit("auction-ended", {
          auctionId,
          winnerId,
          finalPrice,
          timestamp: /* @__PURE__ */ new Date()
        });
        console.log(`[WebSocket] Auction ${auctionId} ended`);
      }
      /**
       * Get the number of users watching an auction
       */
      getAuctionViewerCount(auctionId) {
        return this.auctionSubscribers.get(auctionId)?.size || 0;
      }
      /**
       * Check if a user is online
       */
      isUserOnline(userId) {
        return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
      }
      /**
       * Send an order notification to a specific user
       */
      notifyOrder(userId, payload) {
        this.io.to(`messages:${userId}`).emit("new-notification", payload);
        console.log(`[WebSocket] Order notification sent to user ${userId}`);
      }
      /**
       * Get the Socket.IO server instance
       */
      getIO() {
        return this.io;
      }
    };
    wsManager = null;
  }
});

// payload.config.ts
var payload_config_exports = {};
__export(payload_config_exports, {
  default: () => payload_config_default
});
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path4 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var filename, dirname, payload_config_default;
var init_payload_config = __esm({
  "payload.config.ts"() {
    "use strict";
    filename = fileURLToPath2(import.meta.url);
    dirname = path4.dirname(filename);
    payload_config_default = buildConfig({
      // Payload v3 uses Next.js for admin UI, no bundler config needed
      editor: lexicalEditor({}),
      db: postgresAdapter({
        pool: {
          connectionString: process.env.DATABASE_URL || ""
        },
        // Disable automatic drizzle-kit push on startup — avoids TTY prompt errors
        // when running via `tsx watch`. Run `payload migrate` manually if schema changes.
        push: false,
        migrationDir: "./drizzle/payload-migrations"
      }),
      collections: [
        {
          slug: "cms-users",
          auth: true,
          fields: [
            {
              name: "role",
              type: "select",
              options: ["admin", "super_admin"],
              defaultValue: "admin",
              required: true
            }
          ]
        },
        {
          slug: "categories",
          admin: {
            useAsTitle: "name"
          },
          fields: [
            { name: "name", type: "text", required: true },
            { name: "slug", type: "text", required: true, unique: true },
            { name: "description", type: "textarea" },
            { name: "icon", type: "text" },
            {
              name: "sector",
              type: "select",
              options: ["marketplace", "auction", "rental", "all"],
              defaultValue: "marketplace"
            }
          ]
        },
        {
          slug: "careers",
          admin: {
            useAsTitle: "title"
          },
          fields: [
            { name: "title", type: "text", required: true },
            { name: "department", type: "text", required: true },
            { name: "location", type: "text", required: true },
            { name: "salaryRange", type: "text", required: true },
            { name: "type", type: "text", required: true },
            { name: "description", type: "textarea", required: true },
            { name: "requirements", type: "textarea" },
            {
              name: "status",
              type: "select",
              options: ["active", "closed"],
              defaultValue: "active",
              required: true
            }
          ]
        },
        {
          slug: "manual-ads",
          admin: {
            useAsTitle: "title"
          },
          fields: [
            { name: "title", type: "text", required: true },
            { name: "description", type: "textarea" },
            { name: "imageUrl", type: "text", required: true },
            { name: "landingUrl", type: "text", required: true },
            { name: "adType", type: "text", required: true },
            { name: "placement", type: "text", required: true },
            {
              name: "status",
              type: "select",
              options: ["draft", "active", "completed"],
              defaultValue: "draft",
              required: true
            },
            { name: "dailyBudget", type: "number", required: true },
            { name: "totalBudget", type: "number", required: true }
          ]
        }
      ],
      globals: [
        {
          slug: "company-config",
          fields: [
            { name: "email", type: "text", required: true },
            { name: "phone", type: "text", required: true },
            { name: "location", type: "text", required: true },
            {
              name: "commissionRate",
              type: "number",
              defaultValue: 0,
              required: true
            }
          ]
        }
      ],
      secret: process.env.PAYLOAD_SECRET || "payload-default-secret-development-only",
      typescript: {
        outputFile: path4.resolve(dirname, "payload-types.ts")
      }
    });
  }
});

// api/_entry.ts
import "dotenv/config";

// backend/_core/createApp.ts
import express2 from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import rateLimit from "express-rate-limit";

// backend/routers/index.ts
import { TRPCError as TRPCError11 } from "@trpc/server";
import { z as z15 } from "zod";
import { nanoid } from "nanoid";

// backend/_core/systemRouter.ts
import { z } from "zod";

// backend/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// shared/const.ts
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// backend/_core/trpc.ts
init_debugLog();
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var logTrpcErrors = t.middleware(async (opts) => {
  const { ctx, next, path: path5, type } = opts;
  try {
    return await next();
  } catch (error) {
    writeDebugLog({
      sessionId: "90368c",
      runId: "debug_pre",
      hypothesisId: "H4_trpc_error",
      location: "backend/_core/trpc.ts:logTrpcErrors",
      message: "TRPC middleware caught error",
      data: {
        trpcPath: path5,
        trpcType: type,
        errorCode: error?.code ?? null,
        errorMessage: typeof error?.message === "string" ? error.message.slice(0, 200) : null,
        hasUser: Boolean(ctx?.user),
        userRole: ctx?.user?.role || null
      },
      timestamp: Date.now()
    });
    throw error;
  }
});
var publicProcedure = t.procedure.use(logTrpcErrors);
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(logTrpcErrors).use(requireUser);
var adminProcedure = t.procedure.use(logTrpcErrors).use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// backend/_core/systemRouter.ts
init_db();
init_schema();
import { count, eq as eq2 } from "drizzle-orm";
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  }),
  getCompanyConfig: publicProcedure.query(async () => {
    return getCompanyConfig();
  }),
  getCareers: publicProcedure.query(async () => {
    return getCareers();
  }),
  submitReport: publicProcedure.input(
    z.object({
      reporterName: z.string().optional(),
      reporterEmail: z.string().email(),
      subject: z.string(),
      description: z.string()
    })
  ).mutation(async ({ input }) => {
    return submitReport(input);
  }),
  getActivePaymentGateways: publicProcedure.query(async () => {
    return getActivePaymentGateways();
  }),
  // Real-time platform statistics for About and Help pages
  getPlatformStats: publicProcedure.query(async () => {
    try {
      const db3 = await getDb();
      const [totalUsersResult, activeListingsResult, totalTransactionsResult] = await Promise.all([
        db3.select({ count: count() }).from(users),
        db3.select({ count: count() }).from(listings).where(eq2(listings.status, "active")),
        db3.select({ count: count() }).from(transactions)
      ]);
      return {
        totalUsers: Number(totalUsersResult[0]?.count || 0),
        activeListings: Number(activeListingsResult[0]?.count || 0),
        totalTransactions: Number(totalTransactionsResult[0]?.count || 0)
      };
    } catch (error) {
      console.error("[systemRouter] getPlatformStats error:", error);
      return { totalUsers: 0, activeListings: 0, totalTransactions: 0 };
    }
  })
});

// backend/routers/index.ts
init_db();

// backend/_core/emailService.ts
init_db();
init_schema();
import { eq as eq3 } from "drizzle-orm";
var EmailService = class {
  apiKey;
  fromEmail = "noreply@sastobazaar.com";
  maxRetries = 3;
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    if (!this.apiKey) {
      console.warn("RESEND_API_KEY not configured. Email sending will be disabled.");
    }
  }
  /**
   * Queue an email for sending
   */
  async queueEmail(options) {
    const db3 = await getDb();
    const result = await db3.insert(emailQueue).values({
      userId: options.userId || 0,
      recipientEmail: options.to,
      subject: options.subject,
      template: options.template,
      templateData: options.templateData ? JSON.stringify(options.templateData) : null,
      status: "pending",
      attemptCount: 0
    }).returning();
    return result[0].id;
  }
  /**
   * Send email immediately
   */
  async sendEmail(options) {
    try {
      const template = this.getTemplate(options.template, options.templateData || {});
      if (!this.apiKey) {
        console.log(`[EMAIL] Would send to ${options.to}: ${template.subject}`);
        return true;
      }
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: options.to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      });
      if (!response.ok) {
        throw new Error(`Email API error: ${response.statusText}`);
      }
      await this.logEmail({
        recipientEmail: options.to,
        subject: options.subject,
        template: options.template,
        status: "sent"
      });
      return true;
    } catch (error) {
      console.error("Email send error:", error);
      return false;
    }
  }
  /**
   * Process pending emails from queue
   */
  async processPendingEmails() {
    const db3 = await getDb();
    const pending = await db3.select().from(emailQueue).where(eq3(emailQueue.status, "pending")).limit(10);
    for (const email of pending) {
      try {
        const templateData = email.templateData ? JSON.parse(email.templateData) : {};
        const template = this.getTemplate(email.template, templateData);
        if (!this.apiKey) {
          console.log(`[EMAIL] Would send to ${email.recipientEmail}: ${template.subject}`);
          await db3.update(emailQueue).set({ status: "sent", sentAt: /* @__PURE__ */ new Date() }).where(eq3(emailQueue.id, email.id));
          continue;
        }
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: email.recipientEmail,
            subject: template.subject,
            html: template.html,
            text: template.text
          })
        });
        if (response.ok) {
          await db3.update(emailQueue).set({ status: "sent", sentAt: /* @__PURE__ */ new Date() }).where(eq3(emailQueue.id, email.id));
          await this.logEmail({
            emailQueueId: email.id,
            recipientEmail: email.recipientEmail,
            subject: email.subject,
            template: email.template,
            status: "sent"
          });
        } else {
          const newAttemptCount = (email.attemptCount || 0) + 1;
          if (newAttemptCount >= this.maxRetries) {
            await db3.update(emailQueue).set({
              status: "failed",
              attemptCount: newAttemptCount,
              lastAttemptAt: /* @__PURE__ */ new Date(),
              errorMessage: `Failed after ${newAttemptCount} attempts`
            }).where(eq3(emailQueue.id, email.id));
          } else {
            await db3.update(emailQueue).set({
              attemptCount: newAttemptCount,
              lastAttemptAt: /* @__PURE__ */ new Date()
            }).where(eq3(emailQueue.id, email.id));
          }
        }
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        const newAttemptCount = (email.attemptCount || 0) + 1;
        await db3.update(emailQueue).set({
          attemptCount: newAttemptCount,
          lastAttemptAt: /* @__PURE__ */ new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error"
        }).where(eq3(emailQueue.id, email.id));
      }
    }
  }
  /**
   * Log email activity
   */
  async logEmail(data) {
    const db3 = await getDb();
    await db3.insert(emailLogs).values({
      emailQueueId: data.emailQueueId,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      template: data.template,
      status: data.status,
      failureReason: data.failureReason
    });
  }
  /**
   * Get email template
   */
  getTemplate(templateName, data) {
    const templates = {
      new_message: (data2) => ({
        subject: `New message from ${data2.senderName}`,
        html: `
          <h2>You have a new message</h2>
          <p>From: <strong>${data2.senderName}</strong></p>
          <p>${data2.messagePreview}</p>
          <a href="${data2.messageLink}">View Message</a>
        `,
        text: `New message from ${data2.senderName}: ${data2.messagePreview}`
      }),
      new_bid: (data2) => ({
        subject: `New bid on your listing: ${data2.listingTitle}`,
        html: `
          <h2>You have a new bid!</h2>
          <p>Listing: <strong>${data2.listingTitle}</strong></p>
          <p>Bid Amount: <strong>Rs. ${data2.bidAmount}</strong></p>
          <p>From: <strong>${data2.bidderName}</strong></p>
          <a href="${data2.listingLink}">View Bid</a>
        `,
        text: `New bid of Rs. ${data2.bidAmount} on ${data2.listingTitle}`
      }),
      booking_confirmation: (data2) => ({
        subject: `Booking Confirmation: ${data2.listingTitle}`,
        html: `
          <h2>Booking Confirmed</h2>
          <p>Listing: <strong>${data2.listingTitle}</strong></p>
          <p>Check-in: ${data2.checkInDate}</p>
          <p>Check-out: ${data2.checkOutDate}</p>
          <p>Total Price: <strong>Rs. ${data2.totalPrice}</strong></p>
          <a href="${data2.bookingLink}">View Booking</a>
        `,
        text: `Booking confirmed for ${data2.listingTitle}`
      }),
      listing_approved: (data2) => ({
        subject: `Your listing has been approved: ${data2.listingTitle}`,
        html: `
          <h2>Listing Approved!</h2>
          <p>Your listing <strong>${data2.listingTitle}</strong> has been approved and is now live.</p>
          <a href="${data2.listingLink}">View Listing</a>
        `,
        text: `Your listing ${data2.listingTitle} has been approved`
      }),
      listing_rejected: (data2) => ({
        subject: `Your listing was rejected: ${data2.listingTitle}`,
        html: `
          <h2>Listing Rejected</h2>
          <p>Your listing <strong>${data2.listingTitle}</strong> was rejected.</p>
          <p>Reason: ${data2.rejectionReason}</p>
          <a href="${data2.editLink}">Edit Listing</a>
        `,
        text: `Your listing ${data2.listingTitle} was rejected. Reason: ${data2.rejectionReason}`
      }),
      password_reset: (data2) => ({
        subject: "Reset your password",
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${data2.resetLink}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `,
        text: `Reset your password: ${data2.resetLink}`
      }),
      account_verification: (data2) => ({
        subject: "Verify your email address",
        html: `
          <h2>Verify Your Email</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${data2.verificationLink}">Verify Email</a>
        `,
        text: `Verify your email: ${data2.verificationLink}`
      }),
      weekly_digest: (data2) => ({
        subject: "Your weekly marketplace digest",
        html: `
          <h2>Weekly Digest</h2>
          <p>Here's what happened this week:</p>
          <p>New messages: ${data2.newMessagesCount}</p>
          <p>New bids: ${data2.newBidsCount}</p>
          <p>Bookings: ${data2.bookingsCount}</p>
          <a href="${data2.dashboardLink}">View Dashboard</a>
        `,
        text: `Weekly digest: ${data2.newMessagesCount} messages, ${data2.newBidsCount} bids`
      }),
      security_alert: (data2) => ({
        subject: "Security alert: Unusual activity",
        html: `
          <h2>Security Alert</h2>
          <p>We detected unusual activity on your account.</p>
          <p>Activity: ${data2.activityDescription}</p>
          <p>If this wasn't you, please change your password immediately.</p>
          <a href="${data2.securityLink}">Manage Security</a>
        `,
        text: `Security alert: ${data2.activityDescription}`
      }),
      welcome_email: (data2) => ({
        subject: "Welcome to Sasto Marketplace!",
        html: `
          <h2>Welcome to Sasto Marketplace, ${data2.userName}!</h2>
          <p>We're excited to have you on board. Start exploring the marketplace now!</p>
          <a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/marketplace">Browse Listings</a>
        `,
        text: `Welcome to Sasto Marketplace, ${data2.userName}!`
      }),
      order_buyer_confirmation: (data2) => ({
        subject: `Order Confirmed: ${data2.orderId}`,
        html: `
          <h2>Thank you for your order!</h2>
          <p>Order ID: <strong>${data2.orderId}</strong></p>
          <p>Product: <strong>${data2.listingTitle}</strong></p>
          <p>Amount Paid: <strong>NPR ${data2.amount}</strong></p>
          <p>Delivery Speed: <strong>${data2.deliverySpeed} Delivery</strong> (Fee: NPR ${data2.deliveryFee})</p>
          <p>Estimated Delivery: <strong>${data2.estDeliveryDate}</strong></p>
          <p>Deliver To: <strong>${data2.deliveryName}</strong>, ${data2.deliveryAddress} (${data2.deliveryPhone})</p>
          <p>Payment Method: <strong>${data2.paymentMethod}</strong></p>
          ${data2.statusUpdate ? `<p style="font-weight: bold; color: #16a34a; font-size: 16px;">Update: ${data2.statusUpdate}</p>` : ""}
          <br/>
          <a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/buyer/dashboard">Track Order in Buyer Dashboard</a>
        `,
        text: `Thank you for your order! Order ID: ${data2.orderId}, Product: ${data2.listingTitle}, Total: NPR ${data2.amount}. Estimated Delivery: ${data2.estDeliveryDate}.`
      }),
      order_seller_notification: (data2) => ({
        subject: `Product Sold: ${data2.orderId}`,
        html: `
          <h2>Your product has been purchased!</h2>
          <p>Order ID: <strong>${data2.orderId}</strong></p>
          <p>Product: <strong>${data2.listingTitle}</strong></p>
          <p>Amount: <strong>NPR ${data2.amount}</strong></p>
          <p>Delivery Speed: <strong>${data2.deliverySpeed} Delivery</strong></p>
          <p>Delivery Contact: <strong>${data2.deliveryName}</strong> (${data2.deliveryPhone})</p>
          <p>Delivery Address: <strong>${data2.deliveryAddress}</strong></p>
          <p>Payment Method Selected: <strong>${data2.paymentMethod}</strong></p>
          <br/>
          <a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/seller/dashboard">Manage Order in Seller Dashboard</a>
        `,
        text: `Your product has been purchased! Order ID: ${data2.orderId}, Product: ${data2.listingTitle}, Amount: NPR ${data2.amount}. Please prepare it for ${data2.deliverySpeed} Delivery to ${data2.deliveryAddress}.`
      })
    };
    const template = templates[templateName];
    if (!template) {
      return {
        subject: "Notification",
        html: "<p>You have a notification</p>",
        text: "You have a notification"
      };
    }
    return template(data);
  }
};
var emailService = new EmailService();

// backend/routers/index.ts
init_websocket();
init_db();
init_schema();
init_crypto();
import { eq as eq14, desc as desc9, and as and10 } from "drizzle-orm";

// backend/routers/seller.ts
init_schema();
init_db();
import { z as z2 } from "zod";
import { eq as eq4, and as and2, gte as gte2, lte as lte2, desc as desc2, count as count2, sum, avg } from "drizzle-orm";
import { TRPCError as TRPCError3 } from "@trpc/server";
var PROFESSIONAL_ROLES = ["seller", "dealer", "wholesaler", "distributor", "admin", "super_admin"];
function requireVerifiedSeller(ctx) {
  const isAdmin2 = ctx.user.role === "admin" || ctx.user.role === "super_admin";
  if (!PROFESSIONAL_ROLES.includes(ctx.user.role)) {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Only professional seller accounts can perform this action." });
  }
  if (!ctx.user.isVerified && !isAdmin2) {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Your account must be verified to perform this action. Please complete KYC/KYB verification." });
  }
}
var sellerRouter = router({
  // Get seller dashboard overview metrics
  getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const totalListings = await db3.select({ count: count2() }).from(listings).where(eq4(listings.userId, userId));
    const activeListings = await db3.select({ count: count2() }).from(listings).where(and2(eq4(listings.userId, userId), eq4(listings.status, "active")));
    const totalSales = await db3.select({ count: count2() }).from(bookings).innerJoin(listings, eq4(bookings.listingId, listings.id)).where(
      and2(
        eq4(listings.userId, userId),
        eq4(bookings.status, "completed")
      )
    );
    const revenue = await db3.select({ total: sum(bookings.totalPrice) }).from(bookings).innerJoin(listings, eq4(bookings.listingId, listings.id)).where(
      and2(
        eq4(listings.userId, userId),
        eq4(bookings.status, "completed")
      )
    );
    const avgRating = await db3.select({ average: avg(reviews.rating) }).from(reviews).where(eq4(reviews.toUserId, userId));
    const totalReviews = await db3.select({ count: count2() }).from(reviews).where(eq4(reviews.toUserId, userId));
    return {
      totalListings: totalListings[0]?.count || 0,
      activeListings: activeListings[0]?.count || 0,
      totalSales: totalSales[0]?.count || 0,
      totalRevenue: revenue[0]?.total || 0,
      averageRating: avgRating[0]?.average || 0,
      totalReviews: totalReviews[0]?.count || 0
    };
  }),
  // Get seller's listings with pagination
  getListings: protectedProcedure.input(
    z2.object({
      page: z2.number().default(1),
      limit: z2.number().default(10),
      status: z2.enum(["active", "inactive", "sold"]).optional()
    })
  ).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const offset = (input.page - 1) * input.limit;
    const whereConditions = [eq4(listings.userId, userId)];
    if (input.status) {
      whereConditions.push(eq4(listings.status, input.status));
    }
    const userListings = await db3.select().from(listings).where(and2(...whereConditions)).orderBy(desc2(listings.createdAt)).limit(input.limit).offset(offset);
    const totalCount = await db3.select({ count: count2() }).from(listings).where(and2(...whereConditions));
    return {
      listings: userListings,
      total: totalCount[0]?.count || 0,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil((totalCount[0]?.count || 0) / input.limit)
    };
  }),
  // Get auction bids for seller's listings
  getAuctionBids: protectedProcedure.input(
    z2.object({
      listingId: z2.coerce.number()
    })
  ).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const listing = await db3.select().from(listings).where(
      and2(
        eq4(listings.id, input.listingId),
        eq4(listings.userId, userId)
      )
    );
    if (!listing.length) {
      throw new Error("Listing not found or unauthorized");
    }
    const auctionDetails = await db3.select().from(auctions).where(eq4(auctions.listingId, input.listingId));
    return auctionDetails;
  }),
  // Get sales history
  getSalesHistory: protectedProcedure.input(
    z2.object({
      page: z2.number().default(1),
      limit: z2.number().default(10),
      startDate: z2.date().optional(),
      endDate: z2.date().optional()
    })
  ).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const offset = (input.page - 1) * input.limit;
    const sales = await db3.select().from(bookings).innerJoin(listings, eq4(bookings.listingId, listings.id)).where(
      and2(
        eq4(listings.userId, userId),
        input.startDate ? gte2(bookings.createdAt, input.startDate) : void 0,
        input.endDate ? lte2(bookings.createdAt, input.endDate) : void 0
      )
    ).orderBy(desc2(bookings.createdAt)).limit(input.limit).offset(offset);
    const totalCount = await db3.select({ count: count2() }).from(bookings).innerJoin(listings, eq4(bookings.listingId, listings.id)).where(
      and2(
        eq4(listings.userId, userId),
        input.startDate ? gte2(bookings.createdAt, input.startDate) : void 0,
        input.endDate ? lte2(bookings.createdAt, input.endDate) : void 0
      )
    );
    return {
      sales,
      total: totalCount[0]?.count || 0,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil((totalCount[0]?.count || 0) / input.limit)
    };
  }),
  // Get seller reviews
  getReviews: protectedProcedure.input(
    z2.object({
      page: z2.number().default(1),
      limit: z2.number().default(10)
    })
  ).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const offset = (input.page - 1) * input.limit;
    const sellerReviews = await db3.select().from(reviews).where(eq4(reviews.toUserId, userId)).orderBy(desc2(reviews.createdAt)).limit(input.limit).offset(offset);
    const totalCount = await db3.select({ count: count2() }).from(reviews).where(eq4(reviews.toUserId, userId));
    return {
      reviews: sellerReviews,
      total: totalCount[0]?.count || 0,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil((totalCount[0]?.count || 0) / input.limit)
    };
  }),
  // Update listing status
  updateListingStatus: protectedProcedure.input(
    z2.object({
      listingId: z2.coerce.number(),
      status: z2.enum(["active", "inactive", "sold"])
    })
  ).mutation(async ({ ctx, input }) => {
    requireVerifiedSeller(ctx);
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const listing = await db3.select().from(listings).where(
      and2(
        eq4(listings.id, input.listingId),
        eq4(listings.userId, userId)
      )
    );
    if (!listing.length) {
      throw new Error("Listing not found or unauthorized");
    }
    await db3.update(listings).set({ status: input.status }).where(eq4(listings.id, input.listingId));
    return { success: true };
  }),
  // Update listing price / deal
  updateListingPrice: protectedProcedure.input(
    z2.object({
      listingId: z2.coerce.number(),
      price: z2.coerce.number(),
      originalPrice: z2.coerce.number().nullable().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    requireVerifiedSeller(ctx);
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const listing = await db3.select().from(listings).where(
      and2(
        eq4(listings.id, input.listingId),
        eq4(listings.userId, userId)
      )
    );
    if (!listing.length) {
      throw new Error("Listing not found or unauthorized");
    }
    let discount = null;
    if (input.originalPrice && input.originalPrice > input.price) {
      discount = Math.round((input.originalPrice - input.price) / input.originalPrice * 100);
    }
    await db3.update(listings).set({
      price: input.price,
      originalPrice: input.originalPrice,
      discount,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(listings.id, input.listingId));
    return { success: true };
  }),
  // Delete listing
  deleteListing: protectedProcedure.input(z2.object({ listingId: z2.coerce.number() })).mutation(async ({ ctx, input }) => {
    requireVerifiedSeller(ctx);
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const listing = await db3.select().from(listings).where(and2(eq4(listings.id, input.listingId), eq4(listings.userId, userId)));
    if (!listing.length) {
      throw new Error("Listing not found or unauthorized");
    }
    await db3.delete(listings).where(eq4(listings.id, input.listingId));
    return { success: true };
  }),
  // Get sales analytics
  getSalesAnalytics: protectedProcedure.input(
    z2.object({
      days: z2.number().default(30)
    })
  ).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - input.days);
    const dailySales = await db3.select({
      createdAt: bookings.createdAt,
      totalPrice: bookings.totalPrice
    }).from(bookings).innerJoin(listings, eq4(bookings.listingId, listings.id)).where(
      and2(
        eq4(listings.userId, userId),
        gte2(bookings.createdAt, startDate)
      )
    ).orderBy(bookings.createdAt);
    const groupedData = dailySales.reduce(
      (acc, sale) => {
        const dateKey = sale.createdAt.toISOString().split("T")[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, revenue: 0, count: 0 };
        }
        acc[dateKey].revenue += sale.totalPrice || 0;
        acc[dateKey].count += 1;
        return acc;
      },
      {}
    );
    return Object.values(groupedData);
  }),
  // Get listing performance metrics
  getListingPerformance: protectedProcedure.input(z2.object({ listingId: z2.coerce.number() })).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const listing = await db3.select().from(listings).where(
      and2(
        eq4(listings.id, input.listingId),
        eq4(listings.userId, userId)
      )
    );
    if (!listing.length) {
      throw new Error("Listing not found or unauthorized");
    }
    const views = Math.floor(Math.random() * 1e3);
    const favorites2 = Math.floor(Math.random() * 100);
    const inquiries = Math.floor(Math.random() * 50);
    return {
      listingId: input.listingId,
      views,
      favorites: favorites2,
      inquiries,
      conversionRate: (inquiries / views * 100).toFixed(2)
    };
  })
});

// backend/routers/admin.ts
import { z as z3 } from "zod";
init_crypto();
init_db();
init_schema();
import { TRPCError as TRPCError4 } from "@trpc/server";
import { eq as eq5, desc as desc3, sql as sql2, gte as gte3, and as and3, or as or2 } from "drizzle-orm";
var adminRouter = router({
  // User Management
  getAllUsers: adminProcedure.input(
    z3.object({
      page: z3.number().default(1),
      limit: z3.number().default(10),
      status: z3.enum(["active", "suspended", "banned", "unverified"]).optional()
    })
  ).query(async ({ input }) => {
    const db3 = await getDb();
    const offset = (input.page - 1) * input.limit;
    const query = db3.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      verificationStatus: users.verificationStatus,
      createdAt: users.createdAt,
      lastLogin: users.lastLogin
    }).from(users);
    if (input.status) {
      query.where(eq5(users.status, input.status));
    }
    const allUsers = await query.orderBy(desc3(users.createdAt)).limit(input.limit).offset(offset);
    return { users: allUsers, total: allUsers.length };
  }),
  // Listing Moderation
  getPendingListings: adminProcedure.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(10) })).query(async ({ input }) => {
    const db3 = await getDb();
    const offset = (input.page - 1) * input.limit;
    const pendingListings = await db3.select().from(listings).where(eq5(listings.status, "pending")).orderBy(desc3(listings.createdAt)).limit(input.limit).offset(offset);
    return { listings: pendingListings, total: pendingListings.length };
  }),
  // Dispute Resolution
  getDisputes: adminProcedure.input(
    z3.object({
      page: z3.number().default(1),
      limit: z3.number().default(10),
      status: z3.enum(["open", "in_progress", "resolved", "closed"]).optional()
    })
  ).query(async ({ input }) => {
    const db3 = await getDb();
    const offset = (input.page - 1) * input.limit;
    const query = db3.select().from(disputes).orderBy(desc3(disputes.createdAt)).limit(input.limit).offset(offset);
    if (input.status) {
      query.where(eq5(disputes.status, input.status));
    }
    const allDisputes = await query;
    return { disputes: allDisputes, total: allDisputes.length };
  }),
  updateDisputeStatus: adminProcedure.input(
    z3.object({
      disputeId: z3.string(),
      status: z3.enum(["open", "in_progress", "resolved", "closed"]),
      resolution: z3.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    await db3.update(disputes).set({
      status: input.status,
      resolution: input.resolution,
      resolvedAt: input.status === "resolved" ? /* @__PURE__ */ new Date() : void 0
    }).where(eq5(disputes.id, parseInt(input.disputeId)));
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: "dispute_updated",
      targetDisputeId: parseInt(input.disputeId),
      details: `Status changed to ${input.status}`,
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Platform Analytics
  getAnalytics: adminProcedure.query(async () => {
    const db3 = await getDb();
    const totalUsers = await db3.select().from(users);
    const totalListings = await db3.select().from(listings);
    const activeListings = await db3.select().from(listings).where(eq5(listings.status, "active"));
    const verifiedUsers = totalUsers.filter((u) => u.verificationStatus === "verified");
    return {
      totalUsers: totalUsers.length,
      verifiedUsers: verifiedUsers.length,
      totalListings: totalListings.length,
      activeListings: activeListings.length,
      pendingListings: totalListings.filter((l) => l.status === "pending").length,
      rejectedListings: totalListings.filter((l) => l.status === "rejected").length
    };
  }),
  // Advanced Analytics — supports both preset timeframe AND custom date range
  getAdvancedAnalytics: adminProcedure.input(z3.object({
    timeframe: z3.enum(["daily", "weekly", "bi_weekly", "monthly", "quarterly", "half_year", "yearly", "custom"]).default("monthly"),
    startDate: z3.string().optional(),
    // ISO date string for custom range
    endDate: z3.string().optional()
    // ISO date string for custom range
  })).query(async ({ input }) => {
    const db3 = await getDb();
    const allUsers = await db3.select().from(users);
    const allListings = await db3.select().from(listings);
    const allTransactions = await db3.select().from(transactions).where(eq5(transactions.status, "completed"));
    const now = /* @__PURE__ */ new Date();
    let rangeStart = /* @__PURE__ */ new Date();
    let rangeEnd = now;
    if (input.timeframe === "custom" && input.startDate && input.endDate) {
      rangeStart = new Date(input.startDate);
      rangeEnd = new Date(input.endDate);
      rangeEnd.setHours(23, 59, 59, 999);
    } else {
      switch (input.timeframe) {
        case "daily":
          rangeStart.setDate(now.getDate() - 30);
          break;
        case "weekly":
          rangeStart.setDate(now.getDate() - 90);
          break;
        case "bi_weekly":
          rangeStart.setDate(now.getDate() - 180);
          break;
        case "monthly":
          rangeStart.setMonth(now.getMonth() - 12);
          break;
        case "quarterly":
          rangeStart.setFullYear(now.getFullYear() - 3);
          break;
        case "half_year":
          rangeStart.setFullYear(now.getFullYear() - 5);
          break;
        case "yearly":
          rangeStart.setFullYear(now.getFullYear() - 10);
          break;
      }
    }
    const diffDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 864e5);
    const getGroupKey = (date) => {
      if (diffDays <= 60 || input.timeframe === "daily") return date.toISOString().split("T")[0];
      if (diffDays <= 180 || input.timeframe === "weekly") {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 864e5;
        return `${date.getFullYear()}-W${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
      }
      if (input.timeframe === "yearly") return `${date.getFullYear()}`;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    };
    const chartData = {};
    allTransactions.forEach((t2) => {
      if (!t2.createdAt) return;
      const d = new Date(t2.createdAt);
      if (d < rangeStart || d > rangeEnd) return;
      const key = getGroupKey(d);
      if (!chartData[key]) chartData[key] = { revenue: 0, newUsers: 0, newListings: 0 };
      chartData[key].revenue += Number(t2.amount);
    });
    allUsers.forEach((u) => {
      if (!u.createdAt) return;
      const d = new Date(u.createdAt);
      if (d < rangeStart || d > rangeEnd) return;
      const key = getGroupKey(d);
      if (!chartData[key]) chartData[key] = { revenue: 0, newUsers: 0, newListings: 0 };
      chartData[key].newUsers += 1;
    });
    allListings.forEach((l) => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (d < rangeStart || d > rangeEnd) return;
      const key = getGroupKey(d);
      if (!chartData[key]) chartData[key] = { revenue: 0, newUsers: 0, newListings: 0 };
      chartData[key].newListings += 1;
    });
    const sortedChartData = Object.keys(chartData).sort().map((key) => ({
      date: key,
      ...chartData[key]
    }));
    const periodRevenue = allTransactions.filter((t2) => t2.createdAt && new Date(t2.createdAt) >= rangeStart && new Date(t2.createdAt) <= rangeEnd).reduce((sum2, t2) => sum2 + Number(t2.amount), 0);
    const periodTransactions = allTransactions.filter((t2) => t2.createdAt && new Date(t2.createdAt) >= rangeStart && new Date(t2.createdAt) <= rangeEnd).length;
    const periodNewUsers = allUsers.filter((u) => u.createdAt && new Date(u.createdAt) >= rangeStart && new Date(u.createdAt) <= rangeEnd).length;
    const periodNewListings = allListings.filter((l) => l.createdAt && new Date(l.createdAt) >= rangeStart && new Date(l.createdAt) <= rangeEnd).length;
    const avgOrderValue = periodTransactions > 0 ? Math.round(periodRevenue / periodTransactions) : 0;
    const categoryBreakdown = {};
    allListings.forEach((l) => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (d < rangeStart || d > rangeEnd) return;
      const catId = String(l.categoryId);
      categoryBreakdown[catId] = (categoryBreakdown[catId] || 0) + 1;
    });
    const sellerStats = {};
    allTransactions.forEach((t2) => {
      if (!t2.createdAt) return;
      const d = new Date(t2.createdAt);
      if (d < rangeStart || d > rangeEnd) return;
      if (t2.sellerId) {
        if (!sellerStats[t2.sellerId]) sellerStats[t2.sellerId] = { revenue: 0, sales: 0 };
        sellerStats[t2.sellerId].revenue += Number(t2.amount);
        sellerStats[t2.sellerId].sales += 1;
      }
    });
    const topSellersIds = Object.keys(sellerStats).sort((a, b) => sellerStats[Number(b)].revenue - sellerStats[Number(a)].revenue).slice(0, 10).map(Number);
    const topSellers = allUsers.filter((u) => topSellersIds.includes(u.id)).map((u) => ({
      ...u,
      revenue: sellerStats[u.id]?.revenue ?? 0,
      sales: sellerStats[u.id]?.sales ?? 0
    })).sort((a, b) => b.revenue - a.revenue);
    const productStats = {};
    allTransactions.forEach((t2) => {
      if (!t2.createdAt) return;
      const d = new Date(t2.createdAt);
      if (d < rangeStart || d > rangeEnd) return;
      if (t2.listingId) {
        if (!productStats[t2.listingId]) productStats[t2.listingId] = { revenue: 0, sales: 0 };
        productStats[t2.listingId].revenue += Number(t2.amount);
        productStats[t2.listingId].sales += 1;
      }
    });
    const topProductIds = Object.keys(productStats).sort((a, b) => productStats[Number(b)].revenue - productStats[Number(a)].revenue).slice(0, 10).map(Number);
    const topProducts = allListings.filter((l) => topProductIds.includes(l.id)).map((l) => ({
      ...l,
      revenue: productStats[l.id]?.revenue ?? 0,
      sales: productStats[l.id]?.sales ?? 0
    })).sort((a, b) => b.revenue - a.revenue);
    const suspiciousUserIds = allUsers.filter((u) => u.verificationStatus === "rejected" && u.status === "active").map((u) => u.id).slice(0, 5);
    return {
      chartData: sortedChartData,
      topSellers,
      topProducts,
      summary: { periodRevenue, periodTransactions, periodNewUsers, periodNewListings, avgOrderValue },
      suspiciousUserIds
    };
  }),
  // Listing Search for Admin
  searchListingsAdmin: adminProcedure.input(z3.object({ query: z3.string() })).query(async ({ input }) => {
    const db3 = await getDb();
    const allListings = await db3.select().from(listings);
    const q = input.query.toLowerCase();
    return allListings.filter(
      (l) => l.id.toString() === q || l.title && l.title.toLowerCase().includes(q)
    ).slice(0, 50);
  }),
  // Admin Logs
  getAdminLogs: adminProcedure.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(20) })).query(async ({ input }) => {
    const db3 = await getDb();
    const offset = (input.page - 1) * input.limit;
    const logs = await db3.select().from(adminLogs).orderBy(desc3(adminLogs.timestamp)).limit(input.limit).offset(offset);
    return { logs, total: logs.length };
  }),
  // Update user role
  updateUserRole: adminProcedure.input(z3.object({
    userId: z3.number(),
    role: z3.enum(["user", "seller", "csr", "sub_moderator", "moderator", "admin", "super_admin"])
  })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    await db3.update(users).set({ role: input.role, updatedAt: /* @__PURE__ */ new Date() }).where(eq5(users.id, input.userId));
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: "user_role_updated",
      targetUserId: input.userId,
      details: `Role updated to ${input.role}`,
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Verify user
  verifyUser: adminProcedure.input(z3.object({ userId: z3.number() })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    await db3.update(users).set({ isVerified: true, verificationStatus: "verified", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(users.id, input.userId));
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: "user_verified",
      targetUserId: input.userId,
      details: "User verified manually by admin",
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Suspend user
  suspendUser: adminProcedure.input(z3.object({ userId: z3.number(), reason: z3.string() })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    await db3.update(users).set({ status: "suspended", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(users.id, input.userId));
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: "user_suspended",
      targetUserId: input.userId,
      details: `Suspended: ${input.reason}`,
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Ban user
  banUser: adminProcedure.input(z3.object({ userId: z3.number(), reason: z3.string() })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    await db3.update(users).set({ status: "banned", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(users.id, input.userId));
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: "user_banned",
      targetUserId: input.userId,
      details: `Banned: ${input.reason}`,
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Unban user
  unbanUser: adminProcedure.input(z3.object({ userId: z3.number() })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    await db3.update(users).set({ status: "active", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(users.id, input.userId));
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: "user_unbanned",
      targetUserId: input.userId,
      details: "User unbanned",
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Get flagged listings (listings that have been reported)
  getFlaggedListings: adminProcedure.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(10) })).query(async ({ input }) => {
    const db3 = await getDb();
    const offset = (input.page - 1) * input.limit;
    const flagged = await db3.select({
      flagId: flaggedListings.id,
      reason: flaggedListings.reason,
      description: flaggedListings.description,
      flagStatus: flaggedListings.status,
      listingId: listings.id,
      title: listings.title,
      status: listings.status,
      userId: listings.userId,
      price: listings.price,
      images: listings.images,
      createdAt: flaggedListings.createdAt
    }).from(flaggedListings).innerJoin(listings, eq5(flaggedListings.listingId, listings.id)).where(eq5(flaggedListings.status, "pending")).orderBy(desc3(flaggedListings.createdAt)).limit(input.limit).offset(offset);
    return { listings: flagged, total: flagged.length };
  }),
  // Approve a listing
  approveListing: adminProcedure.input(z3.object({ listingId: z3.string() })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    const lid = parseInt(input.listingId);
    await db3.update(listings).set({ status: "active", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(listings.id, lid));
    await db3.update(flaggedListings).set({
      status: "resolved",
      resolvedAt: /* @__PURE__ */ new Date(),
      reviewedByAdminId: ctx.user.id,
      adminNotes: "Approved by admin"
    }).where(eq5(flaggedListings.listingId, lid));
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: "listing_approved",
      targetListingId: lid,
      details: "Listing approved and flags resolved",
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Reject a listing
  rejectListing: adminProcedure.input(z3.object({ listingId: z3.string(), reason: z3.string() })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    const lid = parseInt(input.listingId);
    await db3.update(listings).set({ status: "rejected", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(listings.id, lid));
    await db3.update(flaggedListings).set({
      status: "resolved",
      resolvedAt: /* @__PURE__ */ new Date(),
      reviewedByAdminId: ctx.user.id,
      adminNotes: `Rejected: ${input.reason}`
    }).where(eq5(flaggedListings.listingId, lid));
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: "listing_rejected",
      targetListingId: lid,
      details: `Rejected: ${input.reason}`,
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Update payment gateway config
  updatePaymentGateway: adminProcedure.input(z3.object({ gatewayName: z3.string(), config: z3.any() })).mutation(async ({ input, ctx }) => {
    try {
      await updatePaymentGateway(input.gatewayName, input.config);
      const db3 = await getDb();
      if (db3) {
        await db3.insert(adminLogs).values({
          adminId: ctx.user.id,
          action: `update_payment_gateway`,
          details: `Updated config for ${input.gatewayName}`
        });
      }
      return { success: true };
    } catch (err) {
      throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: err.message });
    }
  }),
  // Feature / unfeature a listing
  setListingFeatured: adminProcedure.input(z3.object({
    listingId: z3.number(),
    isFeatured: z3.boolean(),
    durationDays: z3.number().default(7)
  })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    const featuredUntil = input.isFeatured ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1e3) : null;
    await db3.update(listings).set({ isFeatured: input.isFeatured, featuredUntil, updatedAt: /* @__PURE__ */ new Date() }).where(eq5(listings.id, input.listingId));
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: input.isFeatured ? "listing_featured" : "listing_unfeatured",
      targetListingId: input.listingId,
      details: input.isFeatured ? `Featured for ${input.durationDays} days` : "Removed from featured",
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Get financial stats
  getFinancialStats: adminProcedure.query(async () => {
    const db3 = await getDb();
    const allListings = await db3.select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      status: listings.status,
      isFeatured: listings.isFeatured,
      createdAt: listings.createdAt
    }).from(listings).orderBy(desc3(listings.createdAt));
    const totalListings = allListings.length;
    const activeListings = allListings.filter((l) => l.status === "active").length;
    const featuredListings = allListings.filter((l) => l.isFeatured).length;
    const totalValue = allListings.reduce((sum2, l) => sum2 + (l.price || 0), 0);
    const promotionRevenue = featuredListings * 999;
    return {
      totalListings,
      activeListings,
      featuredListings,
      totalValue,
      promotionRevenue,
      allListings
    };
  }),
  // Verification Management
  getPendingVerifications: adminProcedure.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(10) })).query(async ({ input }) => {
    const db3 = await getDb();
    const offset = (input.page - 1) * input.limit;
    const submissions = await db3.select({
      id: verificationSubmissions.id,
      userId: verificationSubmissions.userId,
      userName: users.name,
      userEmail: users.email,
      type: verificationSubmissions.type,
      data: verificationSubmissions.data,
      status: verificationSubmissions.status,
      createdAt: verificationSubmissions.createdAt
    }).from(verificationSubmissions).innerJoin(users, eq5(verificationSubmissions.userId, users.id)).where(eq5(verificationSubmissions.status, "pending")).orderBy(desc3(verificationSubmissions.createdAt)).limit(input.limit).offset(offset);
    return { submissions, total: submissions.length };
  }),
  reviewVerification: adminProcedure.input(z3.object({
    submissionId: z3.number(),
    status: z3.enum(["approved", "rejected"]),
    adminNotes: z3.string().optional()
  })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    const submission = await db3.select().from(verificationSubmissions).where(eq5(verificationSubmissions.id, input.submissionId)).limit(1);
    if (submission.length === 0) throw new TRPCError4({ code: "NOT_FOUND", message: "Submission not found" });
    await db3.update(verificationSubmissions).set({
      status: input.status,
      adminNotes: input.adminNotes,
      reviewedBy: ctx.user.id,
      reviewedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(verificationSubmissions.id, input.submissionId));
    if (input.status === "approved") {
      const currentUser = await db3.select({ role: users.role }).from(users).where(eq5(users.id, submission[0].userId)).limit(1);
      const currentRole = currentUser[0]?.role;
      await db3.update(users).set({
        isVerified: true,
        verificationLevel: submission[0].type === "kyb" ? "pro" : "basic",
        verificationStatus: "verified",
        // Automatically upgrade 'user' role to 'seller' upon verification
        role: currentRole === "user" ? "seller" : currentRole,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(users.id, submission[0].userId));
    } else {
      await db3.update(users).set({ verificationStatus: "rejected", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(users.id, submission[0].userId));
    }
    await db3.insert(adminLogs).values({
      adminId: ctx.user.id,
      action: `verification_${input.status}`,
      targetUserId: submission[0].userId,
      details: `Verification ${input.status}. Notes: ${input.adminNotes || "N/A"}`,
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Advanced Financial Reporting (Amazon-style)
  getAdvancedFinancials: adminProcedure.input(z3.object({
    startDate: z3.date().optional(),
    endDate: z3.date().optional()
  })).query(async ({ input }) => {
    const db3 = await getDb();
    const now = /* @__PURE__ */ new Date();
    const start = input.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = input.endDate || now;
    const allTransactions = await db3.select().from(transactions).where(and3(
      gte3(transactions.createdAt, start)
      // lte(transactions.createdAt, end)
    )).orderBy(desc3(transactions.createdAt));
    const totalRevenue = allTransactions.reduce((sum2, t2) => sum2 + t2.amount, 0);
    const totalFees = allTransactions.reduce((sum2, t2) => sum2 + t2.platformFee, 0);
    const totalNet = allTransactions.reduce((sum2, t2) => sum2 + t2.netAmount, 0);
    const revenueByType = allTransactions.reduce((acc, t2) => {
      acc[t2.transactionType] = (acc[t2.transactionType] || 0) + t2.amount;
      return acc;
    }, {});
    const categoryStats = await db3.select({
      categoryName: categories.name,
      count: sql2`count(${listings.id})`,
      totalSales: sql2`sum(${transactions.amount})`
    }).from(transactions).innerJoin(listings, eq5(transactions.listingId, listings.id)).innerJoin(categories, eq5(listings.categoryId, categories.id)).groupBy(categories.name).orderBy(desc3(sql2`sum(${transactions.amount})`));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    const dailyTrends = await db3.select({
      date: sql2`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql2`sum(${transactions.amount})`,
      orders: sql2`count(${transactions.id})`
    }).from(transactions).where(gte3(transactions.createdAt, thirtyDaysAgo)).groupBy(sql2`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`).orderBy(sql2`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`);
    return {
      summary: {
        totalRevenue,
        totalFees,
        totalNet,
        orderCount: allTransactions.length
      },
      revenueByType,
      categoryStats,
      dailyTrends,
      recentTransactions: allTransactions.slice(0, 50)
    };
  }),
  // ── User Profile & Documents (Admin) ──────────────────────────────────────
  /** Full profile of any user including business details */
  getUserProfile: adminProcedure.input(z3.object({ userId: z3.number() })).query(async ({ input }) => {
    const db3 = await getDb();
    const [user] = await db3.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      location: users.location,
      bio: users.bio,
      avatar: users.avatar,
      role: users.role,
      status: users.status,
      isVerified: users.isVerified,
      verificationLevel: users.verificationLevel,
      verificationStatus: users.verificationStatus,
      businessName: users.businessName,
      businessLicense: users.businessLicense,
      experienceYears: users.experienceYears,
      specialties: users.specialties,
      socialLinks: users.socialLinks,
      bannerImage: users.bannerImage,
      createdAt: users.createdAt,
      lastLogin: users.lastLogin
    }).from(users).where(eq5(users.id, input.userId)).limit(1);
    if (!user) throw new TRPCError4({ code: "NOT_FOUND", message: "User not found" });
    const verifications = await db3.select().from(verificationSubmissions).where(eq5(verificationSubmissions.userId, input.userId)).orderBy(desc3(verificationSubmissions.createdAt));
    const userListings = await db3.select().from(listings).where(eq5(listings.userId, input.userId)).orderBy(desc3(listings.createdAt)).limit(20);
    return { user, verifications, listings: userListings };
  }),
  /** All KYC/KYB submissions across the platform */
  getAllVerifications: adminProcedure.input(z3.object({
    status: z3.enum(["pending", "approved", "rejected"]).optional(),
    page: z3.number().default(1),
    limit: z3.number().default(20)
  })).query(async ({ input }) => {
    const db3 = await getDb();
    const offset = (input.page - 1) * input.limit;
    const query = db3.select({
      id: verificationSubmissions.id,
      userId: verificationSubmissions.userId,
      type: verificationSubmissions.type,
      data: verificationSubmissions.data,
      status: verificationSubmissions.status,
      adminNotes: verificationSubmissions.adminNotes,
      reviewedBy: verificationSubmissions.reviewedBy,
      reviewedAt: verificationSubmissions.reviewedAt,
      createdAt: verificationSubmissions.createdAt,
      updatedAt: verificationSubmissions.updatedAt,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      userAvatar: users.avatar
    }).from(verificationSubmissions).leftJoin(users, eq5(verificationSubmissions.userId, users.id)).orderBy(desc3(verificationSubmissions.createdAt)).limit(input.limit).offset(offset);
    const allSubs = await query;
    const pendingCount = allSubs.filter((s) => s.status === "pending").length;
    return { submissions: allSubs, total: allSubs.length, pendingCount };
  }),
  // Global Company Settings
  getCompanyConfig: publicProcedure.query(async () => {
    const db3 = await getDb();
    if (!db3) return { commissionRate: 0 };
    const config = await db3.select().from(companyConfigs).limit(1);
    return config.length > 0 ? { commissionRate: config[0].commissionRate } : { commissionRate: 0 };
  }),
  updateCompanyConfig: adminProcedure.input(
    z3.object({
      email: z3.string().email().optional(),
      phone: z3.string().optional(),
      location: z3.string().optional(),
      commissionRate: z3.number().optional()
    })
  ).mutation(async ({ input }) => {
    return updateCompanyConfig(input);
  }),
  // Complaints / Reports
  getAllReports: adminProcedure.query(async () => {
    return getAllReports();
  }),
  resolveReport: adminProcedure.input(
    z3.object({
      id: z3.number(),
      adminNotes: z3.string().optional()
    })
  ).mutation(async ({ input }) => {
    return resolveReport(input.id, input.adminNotes);
  }),
  // Careers Management
  createCareerOpening: adminProcedure.input(
    z3.object({
      title: z3.string(),
      department: z3.string(),
      location: z3.string(),
      salaryRange: z3.string(),
      type: z3.string(),
      description: z3.string(),
      requirements: z3.string().optional()
    })
  ).mutation(async ({ input }) => {
    return createCareerOpening(input);
  }),
  archiveCareerOpening: adminProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
    return archiveCareerOpening(input.id);
  }),
  // CSR support live chat queue
  getSupportConversations: adminProcedure.query(async () => {
    const db3 = await getDb();
    if (!db3) return [];
    const allSupportMessages = await db3.select({
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      content: messages.content,
      createdAt: messages.createdAt,
      attachmentUrl: messages.attachmentUrl,
      attachmentType: messages.attachmentType
    }).from(messages).where(or2(eq5(messages.senderId, 1), eq5(messages.recipientId, 1))).orderBy(desc3(messages.createdAt));
    const partnerIds = /* @__PURE__ */ new Set();
    const conversations = [];
    for (const msg of allSupportMessages) {
      const partnerId = msg.senderId === 1 ? msg.recipientId : msg.senderId;
      if (partnerId === 1) continue;
      if (partnerIds.has(partnerId)) continue;
      partnerIds.add(partnerId);
      const [partnerUser] = await db3.select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar
      }).from(users).where(eq5(users.id, partnerId)).limit(1);
      if (partnerUser) {
        conversations.push({
          id: partnerId,
          user: partnerUser,
          lastMessage: {
            content: decryptMessage(msg.content),
            createdAt: msg.createdAt,
            senderId: msg.senderId,
            attachmentUrl: msg.attachmentUrl,
            attachmentType: msg.attachmentType
          }
        });
      }
    }
    return conversations;
  }),
  getSupportMessages: adminProcedure.input(z3.object({ userId: z3.number() })).query(async ({ input }) => {
    const db3 = await getDb();
    if (!db3) return [];
    const rows = await db3.select().from(messages).where(
      or2(
        and3(eq5(messages.senderId, 1), eq5(messages.recipientId, input.userId)),
        and3(eq5(messages.senderId, input.userId), eq5(messages.recipientId, 1))
      )
    ).orderBy(messages.createdAt);
    return rows.map((row) => ({ ...row, content: decryptMessage(row.content) }));
  }),
  sendSupportReply: adminProcedure.input(z3.object({
    userId: z3.number(),
    content: z3.string(),
    attachmentUrl: z3.string().optional(),
    attachmentType: z3.string().optional()
  })).mutation(async ({ input }) => {
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const result = await db3.insert(messages).values({
      senderId: 1,
      // Sent as Support
      recipientId: input.userId,
      content: encryptMessage(input.content),
      attachmentUrl: input.attachmentUrl || null,
      attachmentType: input.attachmentType || null,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    try {
      const { getWebSocketManager: getWebSocketManager2 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
      const wsManager2 = getWebSocketManager2();
      wsManager2.notifyMessage({
        id: result[0].id,
        senderId: 1,
        recipientId: input.userId,
        content: input.content,
        timestamp: /* @__PURE__ */ new Date(),
        conversationId: [1, input.userId].sort().join("-"),
        attachmentUrl: input.attachmentUrl || void 0,
        attachmentType: input.attachmentType || void 0
      });
    } catch (e) {
      console.error("Failed to broadcast support reply via WebSocket:", e);
    }
    return result[0];
  }),
  // Payment Gateways Management
  getPaymentGateways: adminProcedure.query(async () => {
    return getPaymentGateways();
  }),
  // Logistics Partners
  getLogisticsPartners: adminProcedure.query(async () => {
    const db3 = await getDb();
    if (!db3) return [];
    return db3.select().from(logisticsPartners);
  }),
  addLogisticsPartner: adminProcedure.input(z3.object({
    name: z3.string(),
    displayName: z3.string(),
    webhookUrl: z3.string().optional(),
    trackingUrlFormat: z3.string().optional()
  })).mutation(async ({ input }) => {
    const db3 = await getDb();
    if (!db3) throw new Error("DB not available");
    await db3.insert(logisticsPartners).values({
      name: input.name,
      displayName: input.displayName,
      webhookUrl: input.webhookUrl,
      trackingUrlFormat: input.trackingUrlFormat,
      isActive: false
    });
    return { success: true };
  }),
  updateLogisticsPartner: adminProcedure.input(z3.object({
    id: z3.number(),
    displayName: z3.string().optional(),
    isActive: z3.boolean().optional(),
    webhookUrl: z3.string().optional(),
    apiKey: z3.string().optional(),
    apiSecret: z3.string().optional(),
    trackingUrlFormat: z3.string().optional()
  })).mutation(async ({ input }) => {
    const db3 = await getDb();
    if (!db3) throw new Error("DB not available");
    await db3.update(logisticsPartners).set({
      ...input,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(logisticsPartners.id, input.id));
    return { success: true };
  }),
  deleteLogisticsPartner: adminProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
    const db3 = await getDb();
    if (!db3) throw new Error("DB not available");
    await db3.delete(logisticsPartners).where(eq5(logisticsPartners.id, input.id));
    return { success: true };
  })
});

// backend/routers/rbac.ts
import { z as z4 } from "zod";

// backend/_core/rbac.ts
import { TRPCError as TRPCError5 } from "@trpc/server";
var ROLE_LEVELS = {
  user: 0,
  seller: 1,
  csr: 2,
  sub_moderator: 3,
  moderator: 4,
  admin: 5,
  super_admin: 6
};
function hasRole(ctx, role) {
  if (!ctx.user) return false;
  const userRole = ctx.user.role;
  return userRole === role || (ROLE_LEVELS[userRole] ?? -1) >= ROLE_LEVELS[role];
}
function hasMinimumRole(ctx, minRole) {
  if (!ctx.user) return false;
  const userRole = ctx.user.role;
  return (ROLE_LEVELS[userRole] ?? -1) >= ROLE_LEVELS[minRole];
}
function isSuperAdmin(ctx) {
  return hasRole(ctx, "super_admin");
}
function isAdmin(ctx) {
  return hasMinimumRole(ctx, "admin");
}
function requireSuperAdmin(ctx) {
  if (!isSuperAdmin(ctx)) {
    throw new TRPCError5({
      code: "FORBIDDEN",
      message: "This action requires Super Admin role"
    });
  }
}
function requireAdmin(ctx) {
  if (!isAdmin(ctx)) {
    throw new TRPCError5({
      code: "FORBIDDEN",
      message: "This action requires Admin role or higher"
    });
  }
}

// backend/routers/rbac.ts
init_db();
init_schema();
import { eq as eq6, and as and4 } from "drizzle-orm";
var rbacRouter = router({
  // Get all roles with their permissions
  getRoles: publicProcedure.query(async () => {
    const db3 = await getDb();
    const allRoles = await db3.select().from(roles);
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (role) => {
        const perms = await db3.select({ name: permissions.name, description: permissions.description, category: permissions.category }).from(rolePermissions).innerJoin(permissions, eq6(rolePermissions.permissionId, permissions.id)).where(eq6(rolePermissions.roleId, role.id));
        return {
          ...role,
          permissions: perms
        };
      })
    );
    return rolesWithPermissions;
  }),
  // Get user's roles and permissions
  getUserRoles: protectedProcedure.input(z4.object({ userId: z4.number().optional() })).query(async ({ ctx, input }) => {
    const db3 = await getDb();
    const targetUserId = input.userId || ctx.user.id;
    const user = await db3.select().from(users).where(eq6(users.id, targetUserId)).limit(1);
    if (!user.length) throw new Error("User not found");
    const assignedRoles = await db3.select({
      roleId: userRoles.roleId,
      roleName: roles.name,
      roleDescription: roles.description,
      assignedAt: userRoles.assignedAt,
      expiresAt: userRoles.expiresAt
    }).from(userRoles).innerJoin(roles, eq6(userRoles.roleId, roles.id)).where(eq6(userRoles.userId, targetUserId));
    const primaryRolePerms = await db3.select({ name: permissions.name, description: permissions.description, category: permissions.category }).from(rolePermissions).innerJoin(permissions, eq6(rolePermissions.permissionId, permissions.id)).innerJoin(roles, eq6(rolePermissions.roleId, roles.id)).where(eq6(roles.name, user[0].role));
    return {
      primaryRole: user[0].role,
      assignedRoles,
      permissions: primaryRolePerms
    };
  }),
  // Assign role to user (Super Admin only)
  assignRole: protectedProcedure.input(z4.object({ userId: z4.number(), roleId: z4.number(), expiresAt: z4.date().optional() })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx);
    const db3 = await getDb();
    const role = await db3.select().from(roles).where(eq6(roles.id, input.roleId)).limit(1);
    if (!role.length) throw new Error("Role not found");
    await db3.insert(userRoles).values({
      userId: input.userId,
      roleId: input.roleId,
      assignedBy: ctx.user.id,
      expiresAt: input.expiresAt
    });
    await db3.insert(roleAuditLogs).values({
      userId: ctx.user.id,
      action: "assign_role",
      targetUserId: input.userId,
      details: JSON.stringify({ roleId: input.roleId, roleName: role[0].name })
    });
    return { success: true };
  }),
  // Remove role from user (Super Admin only)
  removeRole: protectedProcedure.input(z4.object({ userId: z4.number(), roleId: z4.number() })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx);
    const db3 = await getDb();
    await db3.delete(userRoles).where(
      and4(eq6(userRoles.userId, input.userId), eq6(userRoles.roleId, input.roleId))
    );
    await db3.insert(roleAuditLogs).values({
      userId: ctx.user.id,
      action: "remove_role",
      targetUserId: input.userId,
      details: JSON.stringify({ roleId: input.roleId })
    });
    return { success: true };
  }),
  // Update user's primary role (Super Admin only)
  updateUserRole: protectedProcedure.input(z4.object({ userId: z4.number(), newRole: z4.enum(["user", "seller", "csr", "sub_moderator", "moderator", "admin", "super_admin"]) })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx);
    const db3 = await getDb();
    const oldUser = await db3.select().from(users).where(eq6(users.id, input.userId)).limit(1);
    if (!oldUser.length) throw new Error("User not found");
    await db3.update(users).set({ role: input.newRole }).where(eq6(users.id, input.userId));
    await db3.insert(roleAuditLogs).values({
      userId: ctx.user.id,
      action: "update_role",
      targetUserId: input.userId,
      details: JSON.stringify({ oldRole: oldUser[0].role, newRole: input.newRole })
    });
    return { success: true };
  }),
  // Get all permissions
  getPermissions: publicProcedure.query(async () => {
    const db3 = await getDb();
    return await db3.select().from(permissions);
  }),
  // Get audit logs (Admin only)
  getAuditLogs: protectedProcedure.input(z4.object({ limit: z4.number().default(50), offset: z4.number().default(0) })).query(async ({ ctx, input }) => {
    requireAdmin(ctx);
    const db3 = await getDb();
    return await db3.select({
      id: roleAuditLogs.id,
      userId: roleAuditLogs.userId,
      userName: users.name,
      action: roleAuditLogs.action,
      targetUserId: roleAuditLogs.targetUserId,
      details: roleAuditLogs.details,
      createdAt: roleAuditLogs.createdAt
    }).from(roleAuditLogs).leftJoin(users, eq6(roleAuditLogs.userId, users.id)).orderBy(roleAuditLogs.createdAt).limit(input.limit).offset(input.offset);
  }),
  // Get role statistics (Admin only)
  getRoleStatistics: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    const db3 = await getDb();
    const stats = await db3.select({
      role: users.role,
      count: users.id
    }).from(users).groupBy(users.role);
    return stats;
  }),
  // Toggle permission for a role (Super Admin only)
  togglePermission: protectedProcedure.input(z4.object({ roleId: z4.number(), permissionId: z4.number(), active: z4.boolean() })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx);
    const db3 = await getDb();
    if (input.active) {
      await db3.insert(rolePermissions).values({
        roleId: input.roleId,
        permissionId: input.permissionId
      });
    } else {
      await db3.delete(rolePermissions).where(
        and4(
          eq6(rolePermissions.roleId, input.roleId),
          eq6(rolePermissions.permissionId, input.permissionId)
        )
      );
    }
    await db3.insert(roleAuditLogs).values({
      userId: ctx.user.id,
      action: input.active ? "add_permission" : "remove_permission",
      details: JSON.stringify({ roleId: input.roleId, permissionId: input.permissionId })
    });
    return { success: true };
  })
});

// backend/routers/ads.ts
import { z as z5 } from "zod";
import { sql as sql3 } from "drizzle-orm";
init_db();
init_schema();
import { TRPCError as TRPCError6 } from "@trpc/server";
import { eq as eq7, and as and5, gte as gte4, lte as lte3, desc as desc4, gt as gt2 } from "drizzle-orm";
var adsRouter = router({
  // ─────────────────────────────────────────────
  // FEATURED LISTINGS (Sponsored Carousel)
  // ─────────────────────────────────────────────
  /** Public — returns all isFeatured=true listings whose featuredUntil > now */
  getFeaturedListings: publicProcedure.query(async () => {
    const db3 = await getDb();
    const now = /* @__PURE__ */ new Date();
    const rows = await db3.select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      originalPrice: listings.originalPrice,
      images: listings.images,
      location: listings.location,
      district: listings.district,
      condition: listings.condition,
      type: listings.type,
      views: listings.views,
      featuredUntil: listings.featuredUntil,
      sellerName: users.name,
      sellerAvatar: users.avatar
    }).from(listings).leftJoin(users, eq7(listings.userId, users.id)).where(
      and5(
        eq7(listings.isFeatured, true),
        eq7(listings.status, "active"),
        gt2(listings.featuredUntil, now)
      )
    ).orderBy(desc4(listings.featuredUntil)).limit(10);
    return rows;
  }),
  /** Public — get sponsored pricing tiers */
  getSponsoredPricing: publicProcedure.query(async () => {
    const db3 = await getDb();
    const tiers = await db3.select().from(sponsoredAdPricing).where(eq7(sponsoredAdPricing.isActive, true)).orderBy(sponsoredAdPricing.priceNPR);
    if (tiers.length === 0) {
      await db3.insert(sponsoredAdPricing).values([
        { tier: "basic", durationDays: 7, priceNPR: 299, description: "7 days \u2014 Basic visibility boost", maxSlots: 20, isActive: true },
        { tier: "standard", durationDays: 15, priceNPR: 499, description: "15 days \u2014 Standard featured placement", maxSlots: 10, isActive: true },
        { tier: "premium", durationDays: 30, priceNPR: 999, description: "30 days \u2014 Premium top-of-page spotlight", maxSlots: 5, isActive: true }
      ]);
      return db3.select().from(sponsoredAdPricing).where(eq7(sponsoredAdPricing.isActive, true)).orderBy(sponsoredAdPricing.priceNPR);
    }
    return tiers;
  }),
  /** Public — get active payment gateways */
  getActiveGateways: publicProcedure.query(async () => {
    return getActivePaymentGateways();
  }),
  /** Protected — seller submits a promotion request */
  promoteListing: protectedProcedure.input(z5.object({
    listingId: z5.number(),
    tier: z5.enum(["basic", "standard", "premium"]),
    paymentMethod: z5.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db3 = await getDb();
    const [listing] = await db3.select().from(listings).where(and5(eq7(listings.id, input.listingId), eq7(listings.userId, ctx.user.id))).limit(1);
    if (!listing) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Listing not found or not yours" });
    }
    const [existing] = await db3.select().from(promotionRequests).where(and5(
      eq7(promotionRequests.listingId, input.listingId),
      eq7(promotionRequests.status, "pending")
    )).limit(1);
    if (existing) {
      throw new TRPCError6({ code: "CONFLICT", message: "A promotion request is already pending for this listing" });
    }
    const [pricing] = await db3.select().from(sponsoredAdPricing).where(and5(eq7(sponsoredAdPricing.tier, input.tier), eq7(sponsoredAdPricing.isActive, true))).limit(1);
    if (!pricing) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Pricing tier not found" });
    }
    let paymentUrl = "";
    let paymentProviderId = "";
    if (input.paymentMethod) {
      const gateways = await getActivePaymentGateways();
      const gateway = gateways.find((g) => g.name === input.paymentMethod);
      if (!gateway) {
        throw new TRPCError6({ code: "BAD_REQUEST", message: "Selected payment gateway is not active or invalid" });
      }
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      paymentProviderId = transactionId;
      paymentUrl = `/wallet-checkout?amount=${pricing.priceNPR}&transactionId=${transactionId}&gateway=${gateway.name}`;
    }
    const result = await db3.insert(promotionRequests).values({
      listingId: input.listingId,
      userId: ctx.user.id,
      tier: input.tier,
      durationDays: pricing.durationDays,
      priceNPR: pricing.priceNPR,
      status: "pending",
      paymentStatus: "unpaid",
      paymentProviderId: paymentProviderId || void 0,
      paymentUrl: paymentUrl || void 0
    }).returning();
    return {
      success: true,
      requestId: result[0].id,
      price: pricing.priceNPR,
      paymentUrl: paymentUrl || void 0
    };
  }),
  /** Public — Webhook to handle payment success from wallet providers */
  walletWebhook: publicProcedure.input(z5.object({
    transactionId: z5.string(),
    status: z5.string()
  })).mutation(async ({ input }) => {
    const db3 = await getDb();
    if (input.status === "SUCCESS" || input.status === "COMPLETED" || input.status === "paid") {
      const [request] = await db3.select().from(promotionRequests).where(eq7(promotionRequests.paymentProviderId, input.transactionId)).limit(1);
      if (!request) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Promotion request not found for this transaction" });
      }
      await db3.update(promotionRequests).set({
        paymentStatus: "paid",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(promotionRequests.id, request.id));
      return { success: true };
    }
    return { success: false, message: "Payment not successful" };
  }),
  // ─────────────────────────────────────────────
  // ADMIN — Sponsored Ads Management
  // ─────────────────────────────────────────────
  /** Admin — get all promotion requests with listing details */
  adminGetPromotionRequests: protectedProcedure.input(z5.object({ status: z5.string().optional() })).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError6({ code: "FORBIDDEN" });
    }
    const db3 = await getDb();
    const rows = await db3.select({
      id: promotionRequests.id,
      listingId: promotionRequests.listingId,
      listingTitle: listings.title,
      listingImages: listings.images,
      listingType: listings.type,
      userId: promotionRequests.userId,
      sellerName: users.name,
      tier: promotionRequests.tier,
      durationDays: promotionRequests.durationDays,
      priceNPR: promotionRequests.priceNPR,
      status: promotionRequests.status,
      paymentStatus: promotionRequests.paymentStatus,
      adminNotes: promotionRequests.adminNotes,
      featuredUntil: promotionRequests.featuredUntil,
      createdAt: promotionRequests.createdAt
    }).from(promotionRequests).leftJoin(listings, eq7(promotionRequests.listingId, listings.id)).leftJoin(users, eq7(promotionRequests.userId, users.id)).orderBy(desc4(promotionRequests.createdAt));
    if (input.status) {
      return rows.filter((r) => r.status === input.status);
    }
    return rows;
  }),
  /** Admin — approve or reject a promotion request */
  adminReviewPromotion: protectedProcedure.input(z5.object({
    requestId: z5.number(),
    action: z5.enum(["approve", "reject"]),
    adminNotes: z5.string().optional()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError6({ code: "FORBIDDEN" });
    }
    const db3 = await getDb();
    const [request] = await db3.select().from(promotionRequests).where(eq7(promotionRequests.id, input.requestId)).limit(1);
    if (!request) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Request not found" });
    }
    if (input.action === "approve") {
      const featuredUntil = /* @__PURE__ */ new Date();
      featuredUntil.setDate(featuredUntil.getDate() + request.durationDays);
      await db3.update(promotionRequests).set({
        status: "approved",
        adminNotes: input.adminNotes,
        approvedBy: ctx.user.id,
        approvedAt: /* @__PURE__ */ new Date(),
        featuredUntil,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(promotionRequests.id, input.requestId));
      await db3.update(listings).set({
        isFeatured: true,
        featuredUntil,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(listings.id, request.listingId));
      return { success: true, message: "Listing is now featured!" };
    } else {
      await db3.update(promotionRequests).set({
        status: "rejected",
        adminNotes: input.adminNotes,
        approvedBy: ctx.user.id,
        approvedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(promotionRequests.id, input.requestId));
      return { success: true, message: "Request rejected" };
    }
  }),
  /** Admin — manually toggle isFeatured on any listing */
  adminSetFeatured: protectedProcedure.input(z5.object({
    listingId: z5.number(),
    isFeatured: z5.boolean(),
    durationDays: z5.number().default(7)
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError6({ code: "FORBIDDEN" });
    }
    const db3 = await getDb();
    const featuredUntil = input.isFeatured ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1e3) : null;
    await db3.update(listings).set({
      isFeatured: input.isFeatured,
      featuredUntil,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(listings.id, input.listingId));
    return { success: true };
  }),
  /** Admin — set or update a pricing tier */
  adminSetSponsoredPricing: protectedProcedure.input(z5.object({
    tier: z5.enum(["basic", "standard", "premium"]),
    durationDays: z5.number().int().positive(),
    priceNPR: z5.number().positive(),
    description: z5.string().optional(),
    maxSlots: z5.number().int().positive().optional(),
    isActive: z5.boolean().optional()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError6({ code: "FORBIDDEN" });
    }
    const db3 = await getDb();
    const [existing] = await db3.select().from(sponsoredAdPricing).where(eq7(sponsoredAdPricing.tier, input.tier)).limit(1);
    if (existing) {
      await db3.update(sponsoredAdPricing).set({
        durationDays: input.durationDays,
        priceNPR: input.priceNPR,
        description: input.description,
        maxSlots: input.maxSlots ?? existing.maxSlots,
        isActive: input.isActive ?? existing.isActive,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(sponsoredAdPricing.tier, input.tier));
    } else {
      await db3.insert(sponsoredAdPricing).values({
        tier: input.tier,
        durationDays: input.durationDays,
        priceNPR: input.priceNPR,
        description: input.description,
        maxSlots: input.maxSlots ?? 10,
        isActive: input.isActive ?? true
      });
    }
    return { success: true };
  }),
  /** Admin — get all currently featured listings */
  adminGetFeaturedListings: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError6({ code: "FORBIDDEN" });
    }
    const db3 = await getDb();
    return db3.select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      images: listings.images,
      type: listings.type,
      isFeatured: listings.isFeatured,
      featuredUntil: listings.featuredUntil,
      sellerName: users.name
    }).from(listings).leftJoin(users, eq7(listings.userId, users.id)).where(eq7(listings.isFeatured, true)).orderBy(desc4(listings.featuredUntil));
  }),
  // ─────────────────────────────────────────────
  // ORIGINAL PROCEDURES (kept as-is)
  // ─────────────────────────────────────────────
  registerAdvertiser: protectedProcedure.input(z5.object({
    businessName: z5.string().min(1),
    businessUrl: z5.string().url().optional(),
    contactEmail: z5.string().email(),
    contactPhone: z5.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db3 = await getDb();
    const existing = await db3.select().from(advertisers).where(eq7(advertisers.userId, ctx.user.id)).limit(1);
    if (existing.length > 0) throw new TRPCError6({ code: "CONFLICT", message: "Advertiser account already exists" });
    const result = await db3.insert(advertisers).values({
      userId: ctx.user.id,
      businessName: input.businessName,
      businessUrl: input.businessUrl,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      status: "pending",
      accountBalance: 0
    }).returning();
    return { success: true, id: result[0].id };
  }),
  getAdvertiserProfile: protectedProcedure.query(async ({ ctx }) => {
    const db3 = await getDb();
    const profile = await db3.select().from(advertisers).where(eq7(advertisers.userId, ctx.user.id)).limit(1);
    return profile[0] || null;
  }),
  createManualAd: protectedProcedure.input(z5.object({
    title: z5.string().min(1),
    description: z5.string().optional(),
    imageUrl: z5.string().url(),
    landingUrl: z5.string().url(),
    adType: z5.enum(["banner", "sidebar", "featured", "popup"]),
    placement: z5.enum(["homepage_top", "homepage_middle", "homepage_bottom", "sidebar_left", "sidebar_right", "category_page", "listing_detail", "search_results"]),
    startDate: z5.date().optional(),
    endDate: z5.date().optional(),
    dailyBudget: z5.number().positive(),
    totalBudget: z5.number().positive(),
    costPerImpression: z5.number().positive(),
    costPerClick: z5.number().positive(),
    targetAudience: z5.record(z5.string(), z5.any()).optional()
  })).mutation(async ({ ctx, input }) => {
    const db3 = await getDb();
    const advertiser = await db3.select().from(advertisers).where(eq7(advertisers.userId, ctx.user.id)).limit(1);
    if (!advertiser.length) throw new TRPCError6({ code: "NOT_FOUND", message: "Advertiser profile not found" });
    const result = await db3.insert(manualAds).values({
      advertiserId: advertiser[0].id,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      landingUrl: input.landingUrl,
      adType: input.adType,
      placement: input.placement,
      startDate: input.startDate,
      endDate: input.endDate,
      dailyBudget: input.dailyBudget,
      totalBudget: input.totalBudget,
      costPerImpression: input.costPerImpression,
      costPerClick: input.costPerClick,
      targetAudience: input.targetAudience ? JSON.stringify(input.targetAudience) : null,
      status: "pending"
    }).returning();
    return { success: true, id: result[0].id };
  }),
  getAdvertiserAds: protectedProcedure.query(async ({ ctx }) => {
    const db3 = await getDb();
    const advertiser = await db3.select().from(advertisers).where(eq7(advertisers.userId, ctx.user.id)).limit(1);
    if (!advertiser.length) return [];
    return db3.select().from(manualAds).where(eq7(manualAds.advertiserId, advertiser[0].id)).orderBy(desc4(manualAds.createdAt));
  }),
  getActiveAds: publicProcedure.input(z5.object({ placement: z5.string().optional() })).query(async ({ input }) => {
    const db3 = await getDb();
    const now = /* @__PURE__ */ new Date();
    const conditions = [eq7(manualAds.status, "active"), lte3(manualAds.startDate, now), gte4(manualAds.endDate, now)];
    if (input.placement) conditions.push(eq7(manualAds.placement, input.placement));
    return db3.select().from(manualAds).where(and5(...conditions)).limit(10);
  }),
  recordAdImpression: publicProcedure.input(z5.object({ adId: z5.number() })).mutation(async ({ input }) => {
    const db3 = await getDb();
    await db3.update(manualAds).set({ impressions: sql3`${manualAds.impressions} + 1` }).where(eq7(manualAds.id, input.adId));
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const existing = await db3.select().from(adAnalytics).where(and5(eq7(adAnalytics.adId, input.adId), eq7(adAnalytics.date, today))).limit(1);
    if (existing.length) {
      await db3.update(adAnalytics).set({ impressions: sql3`${adAnalytics.impressions} + 1` }).where(eq7(adAnalytics.id, existing[0].id));
    } else {
      await db3.insert(adAnalytics).values({ adId: input.adId, date: today, impressions: 1, clicks: 0, conversions: 0, spend: 0, revenue: 0 });
    }
    return { success: true };
  }),
  recordAdClick: publicProcedure.input(z5.object({ adId: z5.number() })).mutation(async ({ input }) => {
    const db3 = await getDb();
    await db3.update(manualAds).set({ clicks: sql3`${manualAds.clicks} + 1` }).where(eq7(manualAds.id, input.adId));
    return { success: true };
  }),
  getAdsensePlacements: publicProcedure.query(async () => {
    const db3 = await getDb();
    return db3.select().from(adsensePlacements).where(eq7(adsensePlacements.status, "active"));
  }),
  getAdAnalytics: protectedProcedure.input(z5.object({ adId: z5.number() })).query(async ({ ctx, input }) => {
    const db3 = await getDb();
    const ad = await db3.select().from(manualAds).where(eq7(manualAds.id, input.adId)).limit(1);
    if (!ad.length) throw new TRPCError6({ code: "NOT_FOUND" });
    const advertiser = await db3.select().from(advertisers).where(eq7(advertisers.id, ad[0].advertiserId)).limit(1);
    if (!advertiser.length || advertiser[0].userId !== ctx.user.id) throw new TRPCError6({ code: "FORBIDDEN" });
    return db3.select().from(adAnalytics).where(eq7(adAnalytics.adId, input.adId)).orderBy(desc4(adAnalytics.date));
  }),
  addFunds: protectedProcedure.input(z5.object({
    amount: z5.number().positive(),
    paymentMethod: z5.enum(["stripe", "bank_transfer", "paypal", "wallet"])
  })).mutation(async ({ ctx, input }) => {
    const db3 = await getDb();
    const advertiser = await db3.select().from(advertisers).where(eq7(advertisers.userId, ctx.user.id)).limit(1);
    if (!advertiser.length) throw new TRPCError6({ code: "NOT_FOUND", message: "Advertiser profile not found" });
    const result = await db3.insert(adPayments).values({
      advertiserId: advertiser[0].id,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      status: "pending",
      description: "Add funds to advertising account"
    }).returning();
    return { success: true, id: result[0].id };
  }),
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db3 = await getDb();
    const advertiser = await db3.select().from(advertisers).where(eq7(advertisers.userId, ctx.user.id)).limit(1);
    if (!advertiser.length) return [];
    return db3.select().from(adPayments).where(eq7(adPayments.advertiserId, advertiser[0].id)).orderBy(desc4(adPayments.createdAt));
  })
});

// backend/routers/emails.ts
init_db();
init_schema();
import { z as z6 } from "zod";
import { eq as eq8 } from "drizzle-orm";
var emailsRouter = router({
  // Get user's email notification preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db3 = await getDb();
    const prefs = await db3.select().from(emailNotificationPreferences).where(eq8(emailNotificationPreferences.userId, ctx.user.id)).limit(1);
    if (prefs.length === 0) {
      await db3.insert(emailNotificationPreferences).values({
        userId: ctx.user.id,
        newMessages: true,
        newBids: true,
        bookingConfirmation: true,
        listingApproval: true,
        listingRejection: true,
        weeklyDigest: true,
        promotionalEmails: false,
        securityAlerts: true
      });
      return {
        userId: ctx.user.id,
        newMessages: true,
        newBids: true,
        bookingConfirmation: true,
        listingApproval: true,
        listingRejection: true,
        weeklyDigest: true,
        promotionalEmails: false,
        securityAlerts: true
      };
    }
    return prefs[0];
  }),
  // Update email notification preferences
  updatePreferences: protectedProcedure.input(
    z6.object({
      newMessages: z6.boolean().optional(),
      newBids: z6.boolean().optional(),
      bookingConfirmation: z6.boolean().optional(),
      listingApproval: z6.boolean().optional(),
      listingRejection: z6.boolean().optional(),
      weeklyDigest: z6.boolean().optional(),
      promotionalEmails: z6.boolean().optional(),
      securityAlerts: z6.boolean().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db3 = await getDb();
    const existing = await db3.select().from(emailNotificationPreferences).where(eq8(emailNotificationPreferences.userId, ctx.user.id)).limit(1);
    if (existing.length === 0) {
      await db3.insert(emailNotificationPreferences).values({
        userId: ctx.user.id,
        ...input
      });
    } else {
      await db3.update(emailNotificationPreferences).set(input).where(eq8(emailNotificationPreferences.userId, ctx.user.id));
    }
    return { success: true };
  }),
  // Get email queue status
  getQueueStatus: protectedProcedure.query(async ({ ctx }) => {
    const db3 = await getDb();
    const stats = await db3.select().from(emailQueue).where(eq8(emailQueue.userId, ctx.user.id));
    return {
      total: stats.length,
      pending: stats.filter((e) => e.status === "pending").length,
      sent: stats.filter((e) => e.status === "sent").length,
      failed: stats.filter((e) => e.status === "failed").length,
      bounced: stats.filter((e) => e.status === "bounced").length
    };
  }),
  // Get email logs
  getLogs: protectedProcedure.input(
    z6.object({
      limit: z6.number().default(20),
      offset: z6.number().default(0)
    })
  ).query(async ({ ctx, input }) => {
    const db3 = await getDb();
    const logs = await db3.select().from(emailLogs).where(eq8(emailLogs.recipientEmail, ctx.user.email || "")).orderBy((t2) => t2.createdAt).limit(input.limit).offset(input.offset);
    return logs;
  }),
  // Send test email
  sendTestEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const success = await emailService.sendEmail({
      to: ctx.user.email || "",
      subject: "Test Email from Sasto Marketplace",
      template: "test_email",
      templateData: {
        userName: ctx.user.name || "User"
      },
      userId: ctx.user.id
    });
    return { success };
  }),
  // Unsubscribe from all emails
  unsubscribeAll: protectedProcedure.mutation(async ({ ctx }) => {
    const db3 = await getDb();
    await db3.update(emailNotificationPreferences).set({
      newMessages: false,
      newBids: false,
      bookingConfirmation: false,
      listingApproval: false,
      listingRejection: false,
      weeklyDigest: false,
      promotionalEmails: false,
      securityAlerts: false
    }).where(eq8(emailNotificationPreferences.userId, ctx.user.id));
    return { success: true };
  }),
  // Resubscribe to emails
  resubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    const db3 = await getDb();
    await db3.update(emailNotificationPreferences).set({
      newMessages: true,
      newBids: true,
      bookingConfirmation: true,
      listingApproval: true,
      listingRejection: true,
      weeklyDigest: true,
      promotionalEmails: false,
      securityAlerts: true
    }).where(eq8(emailNotificationPreferences.userId, ctx.user.id));
    return { success: true };
  })
});

// backend/routers/index.ts
import "dotenv/config";

// backend/routers/reviews.ts
import { z as z7 } from "zod";
init_db();
var reviewsRouter = router({
  // Submit a new review
  submit: protectedProcedure.input(z7.object({
    toUserId: z7.number(),
    listingId: z7.number().optional(),
    transactionId: z7.number().optional(),
    rating: z7.number().min(1).max(5),
    title: z7.string().max(255).optional(),
    comment: z7.string().max(5e3).optional(),
    isVerifiedPurchase: z7.boolean().optional()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return submitReview(ctx.user.id, input.toUserId, {
      listingId: input.listingId,
      transactionId: input.transactionId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      isVerifiedPurchase: input.isVerifiedPurchase
    });
  }),
  // Get reviews received by a user
  getReceivedReviews: publicProcedure.input(z7.object({
    userId: z7.number(),
    limit: z7.number().default(20),
    offset: z7.number().default(0)
  })).query(async ({ input }) => {
    return getUserReceivedReviews(input.userId, input.limit, input.offset);
  }),
  // Get reviews given by a user
  getGivenReviews: publicProcedure.input(z7.object({
    userId: z7.number(),
    limit: z7.number().default(20),
    offset: z7.number().default(0)
  })).query(async ({ input }) => {
    return getUserGivenReviews(input.userId, input.limit, input.offset);
  }),
  // Get a specific review
  getById: publicProcedure.input(z7.number()).query(async ({ input }) => {
    return getReviewById(input);
  }),
  // Get user's review analytics
  getAnalytics: publicProcedure.input(z7.number()).query(async ({ input }) => {
    return getUserReviewAnalytics(input);
  }),
  // Add seller response to a review
  addResponse: protectedProcedure.input(z7.object({
    reviewId: z7.number(),
    response: z7.string().max(2e3)
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    const review = await getReviewById(input.reviewId);
    if (!review) throw new Error("Review not found");
    if (review.toUserId !== ctx.user.id) {
      throw new Error("Only the seller can respond to reviews");
    }
    return addSellerResponse(input.reviewId, input.response);
  }),
  // Mark review as helpful/unhelpful
  markHelpful: protectedProcedure.input(z7.object({
    reviewId: z7.number(),
    isHelpful: z7.boolean()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return markReviewHelpful(input.reviewId, ctx.user.id, input.isHelpful);
  }),
  // Flag a review for moderation
  flag: protectedProcedure.input(z7.object({
    reviewId: z7.number(),
    reason: z7.enum(["inappropriate", "spam", "fake", "offensive"]),
    description: z7.string().max(1e3).optional()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return flagReview(input.reviewId, ctx.user.id, input.reason, input.description);
  }),
  // Get flagged reviews (admin only)
  getFlaggedReviews: adminProcedure.input(z7.object({
    limit: z7.number().default(20),
    offset: z7.number().default(0)
  })).query(async ({ input }) => {
    return getFlaggedReviews(input.limit, input.offset);
  }),
  // Resolve flagged review (admin only)
  resolveFlagged: adminProcedure.input(z7.object({
    flaggedReviewId: z7.number(),
    status: z7.enum(["dismissed", "removed"]),
    adminNotes: z7.string().max(1e3).optional()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return resolveFlaggedReview(
      input.flaggedReviewId,
      ctx.user.id,
      input.status,
      input.adminNotes
    );
  }),
  // Delete a review (owner or admin)
  delete: protectedProcedure.input(z7.number()).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    const review = await getReviewById(input);
    if (!review) throw new Error("Review not found");
    if (review.fromUserId !== ctx.user.id && ctx.user.role !== "admin") {
      throw new Error("Not authorized to delete this review");
    }
    return deleteReview(input);
  }),
  // Approve review (admin only)
  approve: adminProcedure.input(z7.number()).mutation(async ({ input }) => {
    return updateReviewStatus(input, "approved");
  }),
  // Reject review (admin only)
  reject: adminProcedure.input(z7.number()).mutation(async ({ input }) => {
    return updateReviewStatus(input, "rejected");
  }),
  // Aliases for backward compatibility
  getUserReviews: publicProcedure.input(z7.number()).query(async ({ input }) => {
    return getUserReceivedReviews(input);
  }),
  create: protectedProcedure.input(z7.object({
    toUserId: z7.number(),
    rating: z7.number().min(1).max(5),
    comment: z7.string().optional(),
    listingId: z7.number().optional()
  })).mutation(async ({ input, ctx }) => {
    return submitReview(ctx.user.id, input.toUserId, {
      listingId: input.listingId,
      rating: input.rating,
      comment: input.comment
    });
  })
});

// backend/routers/rentals.ts
import { z as z8 } from "zod";
init_db();
var rentalsRouter = router({
  list: publicProcedure.input(z8.object({
    category: z8.string().optional(),
    searchQuery: z8.string().optional(),
    limit: z8.number().default(20),
    offset: z8.number().default(0)
  })).query(async ({ input }) => {
    const listings3 = await getListings(100, 0);
    let rentals = listings3.filter((l) => l.type === "rental");
    if (input.category && input.category !== "all") {
      rentals = rentals.filter((r) => r.category === input.category);
    }
    if (input.searchQuery) {
      const query = input.searchQuery.toLowerCase();
      rentals = rentals.filter(
        (r) => r.title.toLowerCase().includes(query) || r.description?.toLowerCase().includes(query)
      );
    }
    return rentals.slice(input.offset, input.offset + input.limit);
  }),
  getById: publicProcedure.input(z8.number()).query(async ({ input }) => {
    const listings3 = await getListings(100, 0);
    return listings3.find((l) => l.id === input && l.type === "rental");
  })
});

// backend/routers/search.ts
init_db();
import { z as z9 } from "zod";
import { sql as sql4 } from "drizzle-orm";
var searchRouter = router({
  // Search autocomplete for listings and categories
  autocomplete: publicProcedure.input(z9.object({
    query: z9.string().min(1).max(100),
    limit: z9.number().int().positive().max(20).default(10)
  })).query(async ({ input }) => {
    const { query, limit } = input;
    const searchTerm = `%${query}%`;
    try {
      const db3 = await getDb();
      const listings3 = await db3.query.listings.findMany({
        where: (listings4, { like: like2, and: and12, eq: eq18 }) => and12(
          like2(listings4.title, searchTerm),
          eq18(listings4.status, "active")
        ),
        columns: {
          id: true,
          title: true,
          price: true,
          location: true,
          images: true
        },
        limit: Math.floor(limit * 0.6)
      });
      const categories3 = await db3.query.categories.findMany({
        where: (categories4, { like: like2 }) => like2(categories4.name, searchTerm),
        columns: {
          id: true,
          name: true,
          slug: true,
          icon: true
        },
        limit: Math.floor(limit * 0.4)
      });
      return {
        listings: listings3.map((l) => ({
          type: "listing",
          id: l.id,
          title: l.title,
          price: l.price,
          location: l.location,
          image: typeof l.images === "string" ? JSON.parse(l.images)[0] : l.images?.[0]
        })),
        categories: categories3.map((c) => ({
          type: "category",
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon
        }))
      };
    } catch (error) {
      console.error("Search autocomplete error:", error);
      return { listings: [], categories: [] };
    }
  }),
  // Advanced search with filters
  advanced: publicProcedure.input(z9.object({
    query: z9.string().optional(),
    category: z9.number().optional(),
    minPrice: z9.number().optional(),
    maxPrice: z9.number().optional(),
    location: z9.string().optional(),
    district: z9.string().optional(),
    brand: z9.string().optional(),
    model: z9.string().optional(),
    color: z9.string().optional(),
    condition: z9.enum(["new", "like-new", "good", "fair"]).optional(),
    sortBy: z9.enum(["newest", "price-low", "price-high", "popular"]).default("newest"),
    page: z9.number().int().positive().default(1),
    limit: z9.number().int().positive().max(50).default(20)
  })).query(async ({ input }) => {
    const { query, category, minPrice, maxPrice, location, district, brand, model, color, condition, sortBy, page, limit } = input;
    const offset = (page - 1) * limit;
    try {
      const db3 = await getDb();
      const listings3 = await db3.query.listings.findMany({
        where: (listings4, { like: like2, and: and12, eq: eq18, gte: gte6, lte: lte5 }) => {
          const conditions = [eq18(listings4.status, "active")];
          if (query) {
            conditions.push(like2(listings4.title, `%${query}%`));
          }
          if (category) {
            conditions.push(eq18(listings4.categoryId, category));
          }
          if (minPrice !== void 0) {
            conditions.push(gte6(listings4.price, minPrice));
          }
          if (maxPrice !== void 0) {
            conditions.push(lte5(listings4.price, maxPrice));
          }
          if (location) {
            conditions.push(like2(listings4.location, `%${location}%`));
          }
          if (district) {
            conditions.push(eq18(listings4.district, district));
          }
          if (brand) {
            conditions.push(like2(listings4.brand, `%${brand}%`));
          }
          if (model) {
            conditions.push(like2(listings4.model, `%${model}%`));
          }
          if (color) {
            conditions.push(eq18(listings4.color, color));
          }
          if (condition) {
            conditions.push(eq18(listings4.condition, condition));
          }
          return and12(...conditions);
        },
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        limit,
        offset,
        orderBy: (listings4, { desc: desc11, asc: asc2 }) => {
          switch (sortBy) {
            case "price-low":
              return asc2(listings4.price);
            case "price-high":
              return desc11(listings4.price);
            case "popular":
              return desc11(listings4.views);
            case "newest":
            default:
              return desc11(listings4.createdAt);
          }
        }
      });
      return {
        results: listings3,
        page,
        limit,
        total: listings3.length
      };
    } catch (error) {
      console.error("Advanced search error:", error);
      return { results: [], page, limit, total: 0 };
    }
  }),
  // Get trending searches
  trending: publicProcedure.query(async () => {
    try {
      const trendingSearches = [
        "iPhone",
        "MacBook",
        "Apartment",
        "Honda",
        "Designer Handbag",
        "Furniture",
        "Electronics"
      ];
      return trendingSearches;
    } catch (error) {
      console.error("Trending searches error:", error);
      return [];
    }
  }),
  // Get trending locations from real listings — single GROUP BY query, no full-table scan in JS
  trendingLocations: publicProcedure.query(async () => {
    try {
      const db3 = await getDb();
      const rows = await db3.execute(sql4`
          SELECT location, COUNT(*) AS cnt
          FROM listings
          WHERE status = 'active' AND location IS NOT NULL AND location <> ''
          GROUP BY location
          ORDER BY cnt DESC
          LIMIT 5
        `);
      return rows.map((r) => ({
        name: r.location,
        count: Number(r.cnt),
        rating: 4.5
      }));
    } catch (error) {
      console.error("Trending locations error:", error);
      return [];
    }
  }),
  // Get top sellers — single JOIN+GROUP BY query instead of N+1 per seller
  topSellers: publicProcedure.query(async () => {
    try {
      const db3 = await getDb();
      const rows = await db3.execute(sql4`
          SELECT u.id, u.name, u.is_verified,
                 COUNT(l.id) AS total_listings
          FROM users u
          LEFT JOIN listings l ON l.user_id = u.id
          WHERE u.role IN ('seller', 'dealer', 'wholesaler', 'distributor')
          GROUP BY u.id, u.name, u.is_verified
          HAVING COUNT(l.id) > 0
          ORDER BY total_listings DESC
          LIMIT 5
        `);
      return rows.map((r) => ({
        id: String(r.id),
        name: r.name || "Anonymous Seller",
        totalListings: Number(r.total_listings),
        verificationStatus: r.is_verified ? "verified" : "unverified"
      }));
    } catch (error) {
      console.error("Top sellers error:", error);
      return [];
    }
  })
});

// backend/routers/seller-analytics.ts
init_db();
init_schema();
import { z as z10 } from "zod";
import { eq as eq9, gte as gte5, and as and6, desc as desc5 } from "drizzle-orm";
var sellerAnalyticsRouter = router({
  // Get seller dashboard overview
  overview: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db3 = await getDb();
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");
      const totalListings = await db3.query.listings.findMany({
        where: eq9(listings.userId, userId),
        columns: { id: true }
      });
      const activeListings = await db3.query.listings.findMany({
        where: and6(
          eq9(listings.userId, userId),
          eq9(listings.status, "active")
        ),
        columns: { id: true }
      });
      const completedBookings = await db3.query.bookings.findMany({
        where: and6(
          eq9(bookings.userId, userId),
          eq9(bookings.status, "completed")
        ),
        columns: { totalPrice: true }
      });
      const sellerReviews = await db3.query.reviews.findMany({
        where: eq9(reviews.toUserId, userId),
        columns: { rating: true }
      });
      const totalRevenue = completedBookings.reduce((sum2, b) => sum2 + (b.totalPrice || 0), 0);
      const avgRating = sellerReviews.length > 0 ? sellerReviews.reduce((sum2, r) => sum2 + r.rating, 0) / sellerReviews.length : 0;
      return {
        totalListings: totalListings.length,
        activeListings: activeListings.length,
        totalSales: completedBookings.length,
        totalRevenue,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: sellerReviews.length
      };
    } catch (error) {
      console.error("Seller overview error:", error);
      throw error;
    }
  }),
  // Get sales trends (last 30 days)
  salesTrends: protectedProcedure.input(z10.object({
    days: z10.number().int().positive().max(365).default(30)
  })).query(async ({ ctx, input }) => {
    try {
      const db3 = await getDb();
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");
      const startDate = /* @__PURE__ */ new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const bookingsData = await db3.query.bookings.findMany({
        where: and6(
          eq9(bookings.userId, userId),
          gte5(bookings.createdAt, startDate),
          eq9(bookings.status, "completed")
        ),
        columns: {
          createdAt: true,
          totalPrice: true
        }
      });
      const trendsByDate = {};
      bookingsData.forEach((booking) => {
        const date = new Date(booking.createdAt).toISOString().split("T")[0];
        if (!trendsByDate[date]) {
          trendsByDate[date] = { sales: 0, revenue: 0 };
        }
        trendsByDate[date].sales += 1;
        trendsByDate[date].revenue += booking.totalPrice || 0;
      });
      const trends = Object.entries(trendsByDate).map(([date, data]) => ({
        date,
        sales: data.sales,
        revenue: data.revenue
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return trends;
    } catch (error) {
      console.error("Sales trends error:", error);
      throw error;
    }
  }),
  // Get top performing listings
  topListings: protectedProcedure.input(z10.object({
    limit: z10.number().int().positive().max(20).default(10)
  })).query(async ({ ctx, input }) => {
    try {
      const db3 = await getDb();
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");
      const topListings = await db3.query.listings.findMany({
        where: eq9(listings.userId, userId),
        columns: {
          id: true,
          title: true,
          price: true,
          views: true,
          images: true,
          createdAt: true
        },
        limit: input.limit,
        orderBy: desc5(listings.views)
      });
      const listingsWithReviews = await Promise.all(
        topListings.map(async (listing) => {
          const reviewCount = await db3.query.reviews.findMany({
            where: eq9(reviews.listingId, listing.id),
            columns: { id: true }
          });
          return {
            ...listing,
            reviewCount: reviewCount.length
          };
        })
      );
      return listingsWithReviews;
    } catch (error) {
      console.error("Top listings error:", error);
      throw error;
    }
  }),
  // Get revenue breakdown by category
  revenueByCategory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db3 = await getDb();
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");
      const sellerListings = await db3.query.listings.findMany({
        where: eq9(listings.userId, userId),
        with: {
          category: {
            columns: { name: true }
          }
        },
        columns: {
          id: true,
          categoryId: true
        }
      });
      const revenueByCategory = {};
      for (const listing of sellerListings) {
        const categoryName = listing.category?.name || "Other";
        const completedBookings = await db3.query.bookings.findMany({
          where: and6(
            eq9(bookings.listingId, listing.id),
            eq9(bookings.status, "completed")
          ),
          columns: { totalPrice: true }
        });
        const categoryRevenue = completedBookings.reduce((sum2, b) => sum2 + (b.totalPrice || 0), 0);
        if (!revenueByCategory[categoryName]) {
          revenueByCategory[categoryName] = 0;
        }
        revenueByCategory[categoryName] += categoryRevenue;
      }
      return Object.entries(revenueByCategory).map(([category, revenue]) => ({
        category,
        revenue
      }));
    } catch (error) {
      console.error("Revenue by category error:", error);
      throw error;
    }
  }),
  // Get customer reviews and ratings
  reviews: protectedProcedure.input(z10.object({
    limit: z10.number().int().positive().max(50).default(10),
    page: z10.number().int().positive().default(1)
  })).query(async ({ ctx, input }) => {
    try {
      const db3 = await getDb();
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");
      const offset = (input.page - 1) * input.limit;
      const sellerReviews = await db3.query.reviews.findMany({
        where: eq9(reviews.toUserId, userId),
        with: {
          fromUser: {
            columns: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        limit: input.limit,
        offset,
        orderBy: desc5(reviews.createdAt)
      });
      return sellerReviews;
    } catch (error) {
      console.error("Seller reviews error:", error);
      throw error;
    }
  }),
  // Get auction performance
  auctionStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db3 = await getDb();
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");
      const sellerAuctions = await db3.query.auctions.findMany({
        with: {
          listing: {
            where: eq9(listings.userId, userId),
            columns: { title: true, price: true }
          }
        }
      });
      const sellerAuctionsList = sellerAuctions.filter((a) => a.listing);
      const totalAuctions = sellerAuctionsList.length;
      const activeAuctions = sellerAuctionsList.filter((a) => a.endTime > /* @__PURE__ */ new Date()).length;
      const totalBids = await db3.query.bids.findMany({
        with: {
          auction: {
            with: {
              listing: {
                where: eq9(listings.userId, userId)
              }
            }
          }
        }
      });
      const totalBidsCount = totalBids.filter((b) => b.auction?.listing).length;
      const avgBidsPerAuction = totalAuctions > 0 ? totalBidsCount / totalAuctions : 0;
      return {
        totalAuctions,
        activeAuctions,
        totalBids: totalBidsCount,
        avgBidsPerAuction: parseFloat(avgBidsPerAuction.toFixed(2))
      };
    } catch (error) {
      console.error("Auction stats error:", error);
      throw error;
    }
  })
});

// backend/routers/deals.ts
import { z as z11 } from "zod";
init_db();
init_schema();
import { TRPCError as TRPCError7 } from "@trpc/server";
import { eq as eq10, and as and7, desc as desc6, isNotNull as isNotNull2 } from "drizzle-orm";
var dealsRouter = router({
  // Get live deals for homepage and deals page
  getLiveDeals: publicProcedure.input(z11.object({
    limit: z11.number().min(1).max(50).default(24),
    sortBy: z11.enum(["discount", "popular", "newest", "price-low", "price-high"]).default("discount"),
    category: z11.string().optional()
  })).query(async ({ input }) => {
    try {
      const db3 = await getDb();
      if (!db3) return [];
      const orderBy = input.sortBy === "discount" ? desc6(listings.discount) : input.sortBy === "popular" ? desc6(listings.views) : input.sortBy === "price-low" ? listings.price : input.sortBy === "price-high" ? desc6(listings.price) : desc6(listings.createdAt);
      const results = await db3.select({
        id: listings.id,
        title: listings.title,
        currentPrice: listings.price,
        originalPrice: listings.originalPrice,
        discount: listings.discount,
        image: listings.images,
        createdAt: listings.createdAt,
        location: listings.location,
        condition: listings.condition,
        views: listings.views,
        seller: {
          id: users.id,
          name: users.name,
          rating: users.id,
          // placeholder for rating logic if needed
          verified: users.isVerified
        },
        category: categories.name
      }).from(listings).leftJoin(users, eq10(listings.userId, users.id)).leftJoin(categories, eq10(listings.categoryId, categories.id)).where(
        and7(
          eq10(listings.status, "active"),
          isNotNull2(listings.originalPrice)
        )
      ).orderBy(orderBy).limit(input.limit);
      return results.map((r) => ({
        ...r,
        currentPrice: Number(r.currentPrice),
        originalPrice: r.originalPrice ? Number(r.originalPrice) : void 0,
        discount: r.discount || 0,
        interested: (r.views || 0) + Math.floor(Math.random() * 50),
        // Mock interested for UI
        timeLeft: "2d 5h",
        // Mock time left
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1e3),
        image: typeof r.image === "string" ? JSON.parse(r.image)[0] : Array.isArray(r.image) ? r.image[0] : "https://picsum.photos/seed/deal/600/400",
        seller: {
          name: r.seller?.name || "Seller",
          rating: 4.5,
          verified: !!r.seller?.verified
        }
      }));
    } catch (error) {
      console.error("Error fetching deals:", error);
      return [];
    }
  }),
  getDealById: publicProcedure.input(z11.object({ id: z11.number() })).query(async ({ input }) => {
    const db3 = await getDb();
    if (!db3) throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR" });
    const [result] = await db3.select({
      id: listings.id,
      title: listings.title,
      description: listings.description,
      currentPrice: listings.price,
      originalPrice: listings.originalPrice,
      discount: listings.discount,
      images: listings.images,
      createdAt: listings.createdAt,
      location: listings.location,
      condition: listings.condition,
      views: listings.views,
      seller: {
        id: users.id,
        name: users.name,
        rating: users.id,
        avatar: users.avatar,
        verified: users.isVerified
      },
      category: categories.name
    }).from(listings).leftJoin(users, eq10(listings.userId, users.id)).leftJoin(categories, eq10(listings.categoryId, categories.id)).where(eq10(listings.id, input.id)).limit(1);
    if (!result) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Deal not found" });
    }
    return {
      ...result,
      currentPrice: Number(result.currentPrice),
      originalPrice: result.originalPrice ? Number(result.originalPrice) : void 0,
      discount: result.discount || 0,
      interested: (result.views || 0) + 20,
      timeLeft: "2d 5h",
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1e3),
      image: Array.isArray(result.images) && result.images[0] ? result.images[0] : "https://picsum.photos/seed/deal/600/400",
      seller: {
        ...result.seller,
        rating: 4.5
      }
    };
  })
});

// backend/routers/verification.ts
import { z as z12 } from "zod";
init_db();
init_schema();
import { eq as eq11, desc as desc7 } from "drizzle-orm";
import { TRPCError as TRPCError8 } from "@trpc/server";
var verificationRouter = router({
  submit: protectedProcedure.input(z12.object({
    type: z12.enum(["kyc", "kyb"]),
    data: z12.record(z12.string(), z12.any())
    // Contains doc URLs, ID numbers, etc.
  })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    const existing = await db3.select().from(verificationSubmissions).where(eq11(verificationSubmissions.userId, ctx.user.id)).orderBy(desc7(verificationSubmissions.createdAt)).limit(1);
    if (existing.length > 0 && existing[0].status === "pending") {
      throw new TRPCError8({
        code: "BAD_REQUEST",
        message: "You already have a pending verification request."
      });
    }
    const result = await db3.insert(verificationSubmissions).values({
      userId: ctx.user.id,
      type: input.type,
      data: input.data,
      status: "pending"
    }).returning();
    return { success: true, submission: result[0] };
  }),
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db3 = await getDb();
    const submissions = await db3.select().from(verificationSubmissions).where(eq11(verificationSubmissions.userId, ctx.user.id)).orderBy(desc7(verificationSubmissions.createdAt));
    return submissions;
  }),
  // Admin Procedures
  getAllSubmissions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError8({ code: "FORBIDDEN", message: "Only admins can view all submissions" });
    }
    const db3 = await getDb();
    return db3.select().from(verificationSubmissions).orderBy(desc7(verificationSubmissions.createdAt));
  }),
  approve: protectedProcedure.input(z12.object({
    submissionId: z12.number(),
    status: z12.enum(["approved", "rejected"]),
    adminNotes: z12.string().optional()
  })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError8({ code: "FORBIDDEN", message: "Only admins can approve submissions" });
    }
    const db3 = await getDb();
    const [submission] = await db3.select().from(verificationSubmissions).where(eq11(verificationSubmissions.id, input.submissionId)).limit(1);
    if (!submission) throw new TRPCError8({ code: "NOT_FOUND", message: "Submission not found" });
    await db3.update(verificationSubmissions).set({
      status: input.status,
      adminNotes: input.adminNotes,
      reviewedBy: ctx.user.id,
      reviewedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq11(verificationSubmissions.id, input.submissionId));
    if (input.status === "approved") {
      await db3.update(users).set({
        isVerified: true,
        verificationLevel: submission.type === "kyb" ? "pro" : "basic",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq11(users.id, submission.userId));
    }
    return { success: true };
  })
});

// backend/routers/cart.ts
import { z as z13 } from "zod";
import { TRPCError as TRPCError9 } from "@trpc/server";
init_db();
init_schema();
import { eq as eq12, and as and8 } from "drizzle-orm";
var cartRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    let activeCart = await db3.query.carts.findFirst({
      where: and8(eq12(carts.userId, ctx.user.id), eq12(carts.status, "active")),
      with: {
        items: {
          with: {
            listing: {
              with: {
                user: true
                // seller
              }
            }
          }
        }
      }
    });
    if (!activeCart) {
      const [newCart] = await db3.insert(carts).values({
        userId: ctx.user.id,
        status: "active"
      }).returning();
      activeCart = await db3.query.carts.findFirst({
        where: eq12(carts.id, newCart.id),
        with: { items: { with: { listing: { with: { user: true } } } } }
      });
    }
    return activeCart;
  }),
  addItem: protectedProcedure.input(z13.object({
    listingId: z13.number(),
    quantity: z13.number().default(1)
  })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const listing = await db3.query.listings.findFirst({
      where: eq12(listings.id, input.listingId)
    });
    if (!listing || listing.status !== "active" || (listing.stock ?? 0) <= 0) {
      throw new TRPCError9({ code: "NOT_FOUND", message: "Listing not available or out of stock" });
    }
    if (listing.userId === ctx.user.id) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "Cannot add your own listing to cart" });
    }
    let cart = await db3.query.carts.findFirst({
      where: and8(eq12(carts.userId, ctx.user.id), eq12(carts.status, "active"))
    });
    if (!cart) {
      const [newCart] = await db3.insert(carts).values({
        userId: ctx.user.id,
        status: "active"
      }).returning();
      cart = newCart;
    }
    const existingItem = await db3.query.cartItems.findFirst({
      where: and8(eq12(cartItems.cartId, cart.id), eq12(cartItems.listingId, input.listingId))
    });
    if (existingItem) {
      const newQuantity = existingItem.quantity + input.quantity;
      if (newQuantity > listing.stock) {
        throw new TRPCError9({ code: "BAD_REQUEST", message: "Not enough stock available" });
      }
      await db3.update(cartItems).set({ quantity: newQuantity, updatedAt: /* @__PURE__ */ new Date() }).where(eq12(cartItems.id, existingItem.id));
    } else {
      if (input.quantity > listing.stock) {
        throw new TRPCError9({ code: "BAD_REQUEST", message: "Not enough stock available" });
      }
      await db3.insert(cartItems).values({
        cartId: cart.id,
        listingId: input.listingId,
        quantity: input.quantity,
        priceAtAddition: listing.price
      });
    }
    return { success: true };
  }),
  updateQuantity: protectedProcedure.input(z13.object({
    itemId: z13.number(),
    quantity: z13.number().min(1)
  })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const item = await db3.query.cartItems.findFirst({
      where: eq12(cartItems.id, input.itemId),
      with: { cart: true, listing: true }
    });
    if (!item || item.cart.userId !== ctx.user.id) {
      throw new TRPCError9({ code: "FORBIDDEN", message: "Unauthorized" });
    }
    if (input.quantity > item.listing.stock) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "Not enough stock available" });
    }
    await db3.update(cartItems).set({ quantity: input.quantity, updatedAt: /* @__PURE__ */ new Date() }).where(eq12(cartItems.id, input.itemId));
    return { success: true };
  }),
  removeItem: protectedProcedure.input(z13.object({
    itemId: z13.number()
  })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const item = await db3.query.cartItems.findFirst({
      where: eq12(cartItems.id, input.itemId),
      with: { cart: true }
    });
    if (!item || item.cart.userId !== ctx.user.id) {
      throw new TRPCError9({ code: "FORBIDDEN", message: "Unauthorized" });
    }
    await db3.delete(cartItems).where(eq12(cartItems.id, input.itemId));
    return { success: true };
  }),
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const db3 = await getDb();
    if (!db3) throw new Error("Database not available");
    const cart = await db3.query.carts.findFirst({
      where: and8(eq12(carts.userId, ctx.user.id), eq12(carts.status, "active"))
    });
    if (cart) {
      await db3.delete(cartItems).where(eq12(cartItems.cartId, cart.id));
    }
    return { success: true };
  })
});

// backend/routers/returns.ts
import { z as z14 } from "zod";
init_db();
init_schema();
import { TRPCError as TRPCError10 } from "@trpc/server";
import { eq as eq13, desc as desc8, sql as sql6 } from "drizzle-orm";
var returnsRouter = router({
  requestReturn: protectedProcedure.input(z14.object({
    transactionId: z14.number(),
    reason: z14.string(),
    description: z14.string().optional(),
    images: z14.array(z14.string()).optional()
  })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    if (!db3) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const txRes = await db3.select().from(transactions).where(eq13(transactions.id, input.transactionId));
    if (!txRes.length) throw new TRPCError10({ code: "NOT_FOUND", message: "Transaction not found" });
    const tx = txRes[0];
    if (tx.buyerId !== ctx.user.id) {
      throw new TRPCError10({ code: "FORBIDDEN", message: "Not authorized to return this transaction" });
    }
    if (tx.status !== "completed" && tx.status !== "delivered") {
      throw new TRPCError10({ code: "BAD_REQUEST", message: "Can only return completed or delivered items" });
    }
    const existing = await db3.select().from(returns).where(eq13(returns.transactionId, tx.id));
    if (existing.length > 0) {
      throw new TRPCError10({ code: "BAD_REQUEST", message: "Return already requested for this transaction" });
    }
    const newReturn = await db3.insert(returns).values({
      transactionId: tx.id,
      buyerId: tx.buyerId,
      sellerId: tx.sellerId,
      reason: input.reason,
      description: input.description,
      images: input.images || [],
      status: "pending",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    const listingRes = await db3.select({ title: listings.title }).from(listings).where(eq13(listings.id, tx.listingId));
    const listingTitle = listingRes.length ? listingRes[0].title : "Product";
    await db3.insert(notifications).values({
      userId: tx.sellerId,
      type: "return_request",
      title: "New Return Request",
      content: `A return has been requested for "${listingTitle}" by the buyer. Reason: ${input.reason}`,
      relatedId: newReturn[0].id,
      isRead: false,
      createdAt: /* @__PURE__ */ new Date()
    });
    return { success: true, returnRequest: newReturn[0] };
  }),
  getBuyerReturns: protectedProcedure.query(async ({ ctx }) => {
    const db3 = await getDb();
    if (!db3) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    const seller = db3.select().from(users).as("seller");
    const res = await db3.select({
      id: returns.id,
      transactionId: returns.transactionId,
      reason: returns.reason,
      description: returns.description,
      status: returns.status,
      images: returns.images,
      adminNotes: returns.adminNotes,
      createdAt: returns.createdAt,
      updatedAt: returns.updatedAt,
      listingTitle: listings.title,
      listingImage: listings.images,
      sellerName: sql6`seller.name`,
      sellerBusinessName: sql6`seller."businessName"`
    }).from(returns).leftJoin(transactions, eq13(transactions.id, returns.transactionId)).leftJoin(listings, eq13(listings.id, transactions.listingId)).leftJoin(seller, eq13(sql6`seller.id`, transactions.sellerId)).where(eq13(returns.buyerId, ctx.user.id)).orderBy(desc8(returns.createdAt));
    return res;
  }),
  getSellerReturns: protectedProcedure.query(async ({ ctx }) => {
    const db3 = await getDb();
    if (!db3) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    const buyer = db3.select().from(users).as("buyer");
    const res = await db3.select({
      id: returns.id,
      transactionId: returns.transactionId,
      reason: returns.reason,
      description: returns.description,
      status: returns.status,
      images: returns.images,
      adminNotes: returns.adminNotes,
      createdAt: returns.createdAt,
      updatedAt: returns.updatedAt,
      listingTitle: listings.title,
      listingImage: listings.images,
      buyerName: sql6`buyer.name`,
      buyerEmail: sql6`buyer.email`
    }).from(returns).leftJoin(transactions, eq13(transactions.id, returns.transactionId)).leftJoin(listings, eq13(listings.id, transactions.listingId)).leftJoin(buyer, eq13(sql6`buyer.id`, transactions.buyerId)).where(eq13(returns.sellerId, ctx.user.id)).orderBy(desc8(returns.createdAt));
    return res;
  }),
  updateStatus: protectedProcedure.input(z14.object({
    returnId: z14.number(),
    status: z14.enum(["approved", "rejected", "refunded"]),
    adminNotes: z14.string().optional()
  })).mutation(async ({ input, ctx }) => {
    const db3 = await getDb();
    if (!db3) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    const returnReqRes = await db3.select().from(returns).where(eq13(returns.id, input.returnId));
    if (!returnReqRes.length) throw new TRPCError10({ code: "NOT_FOUND", message: "Return not found" });
    const returnReq = returnReqRes[0];
    const isSeller = returnReq.sellerId === ctx.user.id;
    const isAdmin2 = ctx.user.role === "admin" || ctx.user.role === "super_admin";
    if (!isSeller && !isAdmin2) {
      throw new TRPCError10({ code: "FORBIDDEN", message: "Not authorized" });
    }
    if (input.status === "refunded" && !isAdmin2) {
      throw new TRPCError10({ code: "FORBIDDEN", message: "Only admin can process refunds" });
    }
    await db3.update(returns).set({
      status: input.status,
      adminNotes: input.adminNotes || returnReq.adminNotes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq13(returns.id, input.returnId));
    if (input.status === "refunded") {
      await db3.update(transactions).set({ status: "refunded", updatedAt: /* @__PURE__ */ new Date() }).where(eq13(transactions.id, returnReq.transactionId));
    }
    const statusText = input.status === "approved" ? "approved" : input.status === "rejected" ? "rejected" : "refunded";
    await db3.insert(notifications).values({
      userId: returnReq.buyerId,
      type: "return_update",
      title: `Return Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      content: `Your return request for transaction #${returnReq.transactionId} has been ${statusText}.`,
      relatedId: returnReq.id,
      isRead: false,
      createdAt: /* @__PURE__ */ new Date()
    });
    return { success: true };
  })
});

// backend/inngest/client.ts
import { Inngest } from "inngest";
var inngest = new Inngest({ id: "sasto-marketplace" });

// backend/routers/index.ts
var appRouter = router({
  system: systemRouter,
  cart: cartRouter,
  search: searchRouter,
  sellerAnalytics: sellerAnalyticsRouter,
  verification: verificationRouter,
  auth: router({
    me: publicProcedure.query((opts) => {
      console.log(`[Auth] me query called, User: ${opts.ctx.user?.email || "Guest"}`);
      return opts.ctx.user;
    }),
    updateProfile: protectedProcedure.input(z15.object({
      name: z15.string().optional(),
      email: z15.string().email().optional(),
      phone: z15.string().optional(),
      location: z15.string().optional(),
      bio: z15.string().optional(),
      avatar: z15.string().optional(),
      businessName: z15.string().optional(),
      businessLicense: z15.string().optional(),
      experienceYears: z15.number().optional(),
      specialties: z15.string().optional(),
      socialLinks: z15.string().optional(),
      bannerImage: z15.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      await db3.update(users).set({
        ...input,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq14(users.id, ctx.user.id));
      return { success: true };
    })
  }),
  // Listings
  listings: router({
    list: publicProcedure.input(z15.object({
      limit: z15.number().default(20),
      offset: z15.number().default(0),
      type: z15.enum(["marketplace", "auction", "rental"]).optional()
    })).query(async ({ input }) => {
      return getListings(input.limit, input.offset);
    }),
    getById: publicProcedure.input(z15.number()).query(async ({ input }) => {
      return getListingById(input);
    }),
    search: publicProcedure.input(z15.object({
      searchQuery: z15.string().optional(),
      query: z15.string().optional(),
      limit: z15.number().default(20),
      category: z15.string().optional(),
      condition: z15.string().optional()
    })).query(async ({ input }) => {
      const q = input.searchQuery || input.query || "";
      return searchListings(q, input.limit);
    }),
    myListings: protectedProcedure.query(async ({ ctx }) => {
      return getUserListings(ctx.user.id);
    }),
    getByUserId: publicProcedure.input(z15.number()).query(async ({ input }) => {
      return getUserListings(input);
    }),
    getFeatured: publicProcedure.input(z15.object({ limit: z15.number().default(8) })).query(async ({ input }) => {
      const db3 = await getDb();
      if (!db3) return [];
      const now = /* @__PURE__ */ new Date();
      const featured = await db3.select().from(listings).where(eq14(listings.isFeatured, true)).orderBy(desc9(listings.createdAt)).limit(input.limit);
      return featured;
    }),
    promoteListing: protectedProcedure.input(z15.object({
      listingId: z15.number(),
      durationDays: z15.number().default(7)
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const [listing] = await db3.select().from(listings).where(eq14(listings.id, input.listingId));
      if (!listing || listing.userId !== ctx.user.id) {
        throw new TRPCError11({ code: "FORBIDDEN", message: "Not your listing" });
      }
      const featuredUntil = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1e3);
      await db3.update(listings).set({ isFeatured: true, featuredUntil, updatedAt: /* @__PURE__ */ new Date() }).where(eq14(listings.id, input.listingId));
      return { success: true, featuredUntil };
    }),
    create: protectedProcedure.input(z15.object({
      title: z15.string(),
      description: z15.string(),
      categoryId: z15.number(),
      type: z15.enum(["marketplace", "auction", "rental"]),
      price: z15.number().optional(),
      originalPrice: z15.number().optional(),
      images: z15.array(z15.string()).optional(),
      location: z15.string().optional(),
      district: z15.string().optional(),
      brand: z15.string().optional(),
      model: z15.string().optional(),
      color: z15.string().optional(),
      condition: z15.enum(["new", "like-new", "good", "fair"]).optional(),
      videoUrl: z15.string().optional(),
      length: z15.number().optional(),
      width: z15.number().optional(),
      height: z15.number().optional(),
      weight: z15.number().optional()
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const allowedRoles = ["seller", "dealer", "wholesaler", "distributor"];
      const isAdmin2 = ctx.user.role === "admin" || ctx.user.role === "super_admin";
      const isAllowedRole = allowedRoles.includes(ctx.user.role);
      if (!isAdmin2 && (!isAllowedRole || !ctx.user.isVerified)) {
        throw new TRPCError11({
          code: "FORBIDDEN",
          message: "Only verified Sellers, Dealers, Wholesalers, and Distributors can post listings."
        });
      }
      const result = await db3.insert(listings).values({
        userId: ctx.user.id,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        type: input.type,
        price: input.price ?? null,
        originalPrice: input.originalPrice ?? null,
        discount: input.originalPrice && input.price && input.originalPrice > input.price ? Math.round((input.originalPrice - input.price) / input.originalPrice * 100) : null,
        images: input.images,
        videoUrl: input.videoUrl,
        length: input.length ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        weight: input.weight ?? null,
        location: input.location,
        district: input.district,
        brand: input.brand,
        model: input.model,
        color: input.color,
        condition: input.condition,
        status: "active"
      }).returning();
      const newListing = result[0];
      if (newListing) {
        await inngest.send({
          name: "listing/change",
          data: { action: "created", listingId: newListing.id, title: newListing.title, userId: ctx.user.id }
        });
        await inngest.send({
          name: "email/queued",
          data: { reason: "listing_created", listingId: newListing.id }
        });
        if (newListing.type === "auction") {
          const startingPrice = newListing.price ? Number(newListing.price) : 0;
          const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
          const [newAuction] = await db3.insert(auctions).values({
            listingId: newListing.id,
            startingPrice: startingPrice.toString(),
            currentBid: startingPrice.toString(),
            endTime,
            status: "active"
          }).returning();
          if (newAuction) {
            await inngest.send({
              name: "auction/created",
              data: { auctionId: newAuction.id, endTime: endTime.toISOString() }
            });
          }
        }
      }
      return result;
    }),
    update: protectedProcedure.input(z15.object({
      id: z15.number(),
      title: z15.string().optional(),
      description: z15.string().optional(),
      price: z15.number().optional(),
      status: z15.enum(["active", "sold", "expired", "closed"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const listing = await getListingById(input.id);
      if (!listing || listing.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      const result = await db3.update(listings).set({
        title: input.title || listing.title,
        description: input.description || listing.description,
        price: input.price || listing.price,
        status: input.status || listing.status,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq14(listings.id, input.id));
      await inngest.send({
        name: "listing/change",
        data: { action: "updated", listingId: input.id, title: input.title || listing.title, userId: ctx.user.id }
      });
      return result;
    }),
    delete: protectedProcedure.input(z15.number()).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const listing = await getListingById(input);
      if (!listing || listing.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      await db3.delete(listings).where(eq14(listings.id, input));
      await inngest.send({
        name: "listing/change",
        data: { action: "deleted", listingId: input, title: listing.title, userId: ctx.user.id }
      });
      return { success: true };
    })
  }),
  // Users
  users: router({
    getProfile: publicProcedure.input(z15.object({ userId: z15.union([z15.number(), z15.string()]) })).query(async ({ input }) => {
      const idNum = typeof input.userId === "string" ? parseInt(input.userId, 10) : input.userId;
      if (isNaN(idNum)) return null;
      return getUserById(idNum);
    })
  }),
  // Categories
  categories: router({
    list: publicProcedure.input(z15.object({ sector: z15.string().optional() }).optional()).query(async ({ input }) => {
      return getCategories(input?.sector);
    }),
    getSubcategories: publicProcedure.input(z15.object({
      parentId: z15.number(),
      sector: z15.string().optional()
    })).query(async ({ input }) => {
      return getSubcategories(input.parentId, input.sector);
    })
  }),
  // Auctions
  auctions: router({
    list: publicProcedure.input(z15.object({ limit: z15.number().default(20) })).query(async ({ input }) => {
      return getAuctions(input.limit);
    }),
    getById: publicProcedure.input(z15.number()).query(async ({ input }) => {
      return getAuctionById(input);
    }),
    getByListingId: publicProcedure.input(z15.number()).query(async ({ input }) => {
      return getAuctionByListingId(input);
    }),
    getBids: publicProcedure.input(z15.number()).query(async ({ input }) => {
      return getBidsForAuction(input);
    }),
    placeBid: protectedProcedure.input(z15.object({
      auctionId: z15.number(),
      amount: z15.number()
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const auction = await getAuctionById(input.auctionId);
      if (!auction) throw new TRPCError11({ code: "NOT_FOUND", message: "Auction not found" });
      const result = await db3.insert(bids).values({
        auctionId: input.auctionId,
        bidderId: ctx.user.id,
        amount: input.amount
      }).returning();
      try {
        const wsManager2 = getWebSocketManager();
        wsManager2.broadcastBid({
          auctionId: input.auctionId,
          listingId: auction.listingId,
          currentBid: input.amount,
          highestBidderId: ctx.user.id,
          bidderId: ctx.user.id,
          bidderName: ctx.user.name || "A user",
          timestamp: /* @__PURE__ */ new Date()
        });
      } catch (e) {
        console.error("Failed to broadcast bid via WebSocket:", e);
      }
      return result;
    }),
    myBids: protectedProcedure.query(async ({ ctx }) => {
      const { getUserBids: getUserBids2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return getUserBids2(ctx.user.id);
    })
  }),
  // Returns
  returns: returnsRouter,
  // Messages
  messages: router({
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      return getConversations(ctx.user.id);
    }),
    getMessages: protectedProcedure.input(z15.number()).query(async ({ input, ctx }) => {
      return getMessages(ctx.user.id, input);
    }),
    send: protectedProcedure.input(z15.object({
      recipientId: z15.number(),
      content: z15.string(),
      listingId: z15.number().optional(),
      attachmentUrl: z15.string().optional(),
      attachmentType: z15.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const result = await db3.insert(messages).values({
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        content: encryptMessage(input.content),
        listingId: input.listingId,
        attachmentUrl: input.attachmentUrl || null,
        attachmentType: input.attachmentType || null,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      try {
        const wsManager2 = getWebSocketManager();
        wsManager2.notifyMessage({
          id: result[0].id,
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          content: input.content,
          timestamp: /* @__PURE__ */ new Date(),
          conversationId: [ctx.user.id, input.recipientId].sort().join("-"),
          attachmentUrl: input.attachmentUrl || void 0,
          attachmentType: input.attachmentType || void 0
        });
      } catch (e) {
        console.error("Failed to broadcast message via WebSocket:", e);
      }
      try {
        const recipient = await getUserById(input.recipientId);
        if (recipient && recipient.email) {
          await emailService.sendEmail({
            to: recipient.email,
            subject: `New message from ${ctx.user.name}`,
            template: "new_message",
            templateData: {
              senderName: ctx.user.name || "A user",
              messagePreview: input.content.substring(0, 50) + (input.content.length > 50 ? "..." : ""),
              messageLink: `${process.env.VITE_APP_URL || "http://localhost:3000"}/messages`
            },
            userId: recipient.id
          });
        }
      } catch (e) {
        console.error("Failed to send message notification email:", e);
      }
      return result;
    })
  }),
  // Favorites
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserFavorites(ctx.user.id);
    }),
    isFavorited: protectedProcedure.input(z15.number()).query(async ({ input, ctx }) => {
      return isFavorited(ctx.user.id, input);
    }),
    add: protectedProcedure.input(z15.number()).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const result = await db3.insert(favorites).values({
        userId: ctx.user.id,
        listingId: input
      });
      return result;
    }),
    remove: protectedProcedure.input(z15.number()).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      return db3.delete(favorites).where(eq14(favorites.listingId, input));
    })
  }),
  // Bookings
  bookings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserBookings(ctx.user.id);
    }),
    getListingBookings: protectedProcedure.input(z15.number()).query(async ({ input, ctx }) => {
      const booking = await getListingBookings(input);
      return booking;
    }),
    create: protectedProcedure.input(z15.object({
      listingId: z15.number(),
      startDate: z15.date(),
      endDate: z15.date(),
      totalPrice: z15.number()
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const result = await db3.insert(bookings).values({
        listingId: input.listingId,
        userId: ctx.user.id,
        startDate: input.startDate,
        endDate: input.endDate,
        totalPrice: input.totalPrice,
        status: "pending"
      });
      return result;
    })
  }),
  // Transactions (Orders)
  transactions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserTransactions(ctx.user.id);
    }),
    listSellerOrders: protectedProcedure.query(async ({ ctx }) => {
      return getSellerTransactions(ctx.user.id);
    }),
    updateStatus: protectedProcedure.input(z15.object({
      orderId: z15.string(),
      status: z15.string()
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const existing = await db3.select().from(transactions).where(eq14(transactions.orderId, input.orderId));
      if (existing.length === 0) throw new Error("Order not found");
      const order = existing[0];
      if (order.sellerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      if (!order.buyerId || !order.listingId) {
        throw new Error("Invalid order data");
      }
      const now = /* @__PURE__ */ new Date();
      const statusTimestamps = {
        processedAt: input.status === "processing" ? now : void 0,
        shippedAt: input.status === "shipped" ? now : void 0,
        deliveredAt: input.status === "delivered" ? now : void 0
      };
      const timestampUpdate = { status: input.status, updatedAt: now };
      if (statusTimestamps.processedAt) timestampUpdate.processedAt = statusTimestamps.processedAt;
      if (statusTimestamps.shippedAt) timestampUpdate.shippedAt = statusTimestamps.shippedAt;
      if (statusTimestamps.deliveredAt) timestampUpdate.deliveredAt = statusTimestamps.deliveredAt;
      const result = await db3.update(transactions).set(timestampUpdate).where(eq14(transactions.orderId, input.orderId)).returning();
      const listing = await db3.select().from(listings).where(eq14(listings.id, order.listingId));
      const listingTitle = listing[0]?.title || "Product";
      await db3.insert(notifications).values({
        userId: order.buyerId,
        type: "sale",
        title: `Delivery Update: ${input.status.toUpperCase()}`,
        content: `Your order for "${listingTitle}" (ID: ${order.orderId}) is now ${input.status}.`,
        relatedId: order.id,
        isRead: false
      });
      try {
        const wsManager2 = getWebSocketManager();
        wsManager2.notifyOrder(order.buyerId, {
          type: "order-status-update",
          orderId: order.orderId,
          status: input.status,
          title: `Order Status: ${input.status}`,
          content: `Your order for "${listingTitle}" is now ${input.status}.`
        });
      } catch (e) {
        console.error("Failed to emit order status WS:", e);
      }
      try {
        const buyer = await getUserById(order.buyerId);
        if (buyer && buyer.email) {
          await emailService.sendEmail({
            to: buyer.email,
            subject: `Order Update: ${input.status} - ${order.orderId}`,
            template: "order_buyer_confirmation",
            // fallback template name
            templateData: {
              orderId: order.orderId,
              listingTitle,
              amount: (order.amount + (order.deliveryFee || 0)).toLocaleString(),
              deliverySpeed: order.deliverySpeed,
              deliveryFee: order.deliveryFee || 0,
              estDeliveryDate: order.estDeliveryDate,
              deliveryName: order.deliveryName,
              deliveryAddress: order.deliveryAddress,
              deliveryPhone: order.deliveryPhone,
              paymentMethod: order.paymentMethod,
              statusUpdate: `Status changed to: ${input.status}`
            },
            userId: buyer.id
          });
        }
      } catch (e) {
        console.error("Failed to send tracking update email:", e);
      }
      return result;
    }),
    checkoutCart: protectedProcedure.input(z15.object({
      paymentMethod: z15.string(),
      deliveryName: z15.string(),
      deliveryAddress: z15.string(),
      deliveryPhone: z15.string(),
      deliveryEmail: z15.string(),
      deliverySpeed: z15.string(),
      deliveryFee: z15.number(),
      estDeliveryDate: z15.string()
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const cart = await db3.query.carts.findFirst({
        where: and10(eq14(carts.userId, ctx.user.id), eq14(carts.status, "active")),
        with: { items: { with: { listing: true } } }
      });
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new TRPCError11({ code: "BAD_REQUEST", message: "Cart is empty" });
      }
      const configResult = await db3.select().from(companyConfigs).limit(1);
      const commissionRate = configResult.length > 0 ? configResult[0].commissionRate : 0;
      const createdTransactions = [];
      const wsManager2 = getWebSocketManager();
      for (const item of cart.items) {
        const orderId = `ORD-${nanoid(8).toUpperCase()}`;
        const amount = item.priceAtAddition * item.quantity;
        const platformFee = amount * commissionRate / 100;
        const netAmount = amount - platformFee;
        const [tx] = await db3.insert(transactions).values({
          orderId,
          cartId: cart.id,
          buyerId: ctx.user.id,
          sellerId: item.listing.userId,
          listingId: item.listing.id,
          amount,
          platformFee,
          tax: 0,
          netAmount,
          currency: "NPR",
          status: "placed",
          paymentMethod: input.paymentMethod,
          transactionType: "sale",
          deliveryName: input.deliveryName,
          deliveryAddress: input.deliveryAddress,
          deliveryPhone: input.deliveryPhone,
          deliveryEmail: input.deliveryEmail,
          deliverySpeed: input.deliverySpeed,
          deliveryFee: input.deliveryFee,
          // Simplified fee logic for cart
          estDeliveryDate: input.estDeliveryDate,
          placedAt: /* @__PURE__ */ new Date()
        }).returning();
        createdTransactions.push(tx);
        if (item.listing.stock) {
          await db3.update(listings).set({ stock: Math.max(0, item.listing.stock - item.quantity) }).where(eq14(listings.id, item.listing.id));
        }
        const listingTitle = item.listing.title || "Product";
        await db3.insert(notifications).values([
          {
            userId: ctx.user.id,
            type: "sale",
            title: "Order Placed Successfully",
            content: `Your order for "${listingTitle}" (ID: ${orderId}) has been placed.`,
            relatedId: tx.id,
            isRead: false
          },
          {
            userId: item.listing.userId,
            type: "sale",
            title: "Product Sold",
            content: `Your product "${listingTitle}" has been purchased (Order ID: ${orderId}) for NPR ${amount}.`,
            relatedId: tx.id,
            isRead: false
          }
        ]);
        try {
          wsManager2.notifyOrder(ctx.user.id, {
            type: "order-placed",
            orderId,
            title: "Order Placed",
            content: `Your order for "${listingTitle}" has been placed.`
          });
          wsManager2.notifyOrder(item.listing.userId, {
            type: "order-placed",
            orderId,
            title: "Product Sold",
            content: `Your product "${listingTitle}" was purchased.`
          });
        } catch (e) {
          console.error("WS notify error", e);
        }
        try {
          await emailService.sendEmail({
            to: ctx.user.email || input.deliveryEmail,
            subject: `Order Confirmed: ${orderId}`,
            template: "order_buyer_confirmation",
            templateData: {
              orderId,
              listingTitle,
              amount: (amount + input.deliveryFee).toLocaleString(),
              deliverySpeed: input.deliverySpeed,
              deliveryFee: input.deliveryFee,
              estDeliveryDate: input.estDeliveryDate,
              deliveryName: input.deliveryName,
              deliveryAddress: input.deliveryAddress,
              deliveryPhone: input.deliveryPhone,
              paymentMethod: input.paymentMethod
            },
            userId: ctx.user.id
          });
        } catch (e) {
          console.error("Email error", e);
        }
      }
      await db3.update(carts).set({ status: "checked_out", updatedAt: /* @__PURE__ */ new Date() }).where(eq14(carts.id, cart.id));
      return { success: true, transactions: createdTransactions };
    }),
    create: protectedProcedure.input(z15.object({
      listingId: z15.number(),
      sellerId: z15.number(),
      amount: z15.number(),
      paymentMethod: z15.string(),
      deliveryName: z15.string(),
      deliveryAddress: z15.string(),
      deliveryPhone: z15.string(),
      deliveryEmail: z15.string(),
      deliverySpeed: z15.string(),
      deliveryFee: z15.number(),
      estDeliveryDate: z15.string()
    })).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      const orderId = `ORD-${nanoid(8).toUpperCase()}`;
      const listing = await db3.query.listings.findFirst({
        where: eq14(listings.id, input.listingId)
      });
      if (listing && listing.stock) {
        await db3.update(listings).set({ stock: Math.max(0, listing.stock - 1) }).where(eq14(listings.id, input.listingId));
      }
      const result = await db3.insert(transactions).values({
        orderId,
        buyerId: ctx.user.id,
        sellerId: input.sellerId,
        listingId: input.listingId,
        amount: input.amount,
        platformFee: 0,
        tax: 0,
        netAmount: input.amount,
        currency: "NPR",
        status: "placed",
        // Default to "placed" status for live tracking progress
        paymentMethod: input.paymentMethod,
        transactionType: "sale",
        deliveryName: input.deliveryName,
        deliveryAddress: input.deliveryAddress,
        deliveryPhone: input.deliveryPhone,
        deliveryEmail: input.deliveryEmail,
        deliverySpeed: input.deliverySpeed,
        deliveryFee: input.deliveryFee,
        estDeliveryDate: input.estDeliveryDate,
        placedAt: /* @__PURE__ */ new Date()
      }).returning();
      const listingRes = await db3.select().from(listings).where(eq14(listings.id, input.listingId));
      const listingData = listingRes[0];
      const listingTitle = listingData?.title || "Product";
      await db3.insert(notifications).values({
        userId: ctx.user.id,
        type: "sale",
        title: "Order Placed Successfully",
        content: `Your order for "${listingTitle}" (ID: ${orderId}) has been placed with ${input.deliverySpeed} Delivery.`,
        relatedId: result[0].id,
        isRead: false
      });
      await db3.insert(notifications).values({
        userId: input.sellerId,
        type: "sale",
        title: "Product Sold",
        content: `Your product "${listingTitle}" has been purchased by ${input.deliveryName} (Order ID: ${orderId}) for NPR ${input.amount}.`,
        relatedId: result[0].id,
        isRead: false
      });
      try {
        const wsManager2 = getWebSocketManager();
        wsManager2.notifyOrder(ctx.user.id, {
          type: "order-placed",
          orderId,
          title: "Order Placed",
          content: `Your order for "${listingTitle}" (ID: ${orderId}) has been placed.`
        });
        wsManager2.notifyOrder(input.sellerId, {
          type: "order-placed",
          orderId,
          title: "Product Sold",
          content: `Your product "${listingTitle}" has been purchased (Order ID: ${orderId}).`
        });
      } catch (e) {
        console.error("Failed to broadcast order notifications via WS:", e);
      }
      try {
        await emailService.sendEmail({
          to: ctx.user.email || input.deliveryEmail,
          subject: `Order Confirmed: ${orderId}`,
          template: "order_buyer_confirmation",
          templateData: {
            orderId,
            listingTitle,
            amount: (input.amount + input.deliveryFee).toLocaleString(),
            deliverySpeed: input.deliverySpeed,
            deliveryFee: input.deliveryFee,
            estDeliveryDate: input.estDeliveryDate,
            deliveryName: input.deliveryName,
            deliveryAddress: input.deliveryAddress,
            deliveryPhone: input.deliveryPhone,
            paymentMethod: input.paymentMethod
          },
          userId: ctx.user.id
        });
      } catch (e) {
        console.error("Failed to send buyer confirmation email:", e);
      }
      try {
        const seller = await getUserById(input.sellerId);
        if (seller && seller.email) {
          await emailService.sendEmail({
            to: seller.email,
            subject: `Product Sold: ${orderId}`,
            template: "order_seller_notification",
            templateData: {
              orderId,
              listingTitle,
              amount: input.amount.toLocaleString(),
              deliverySpeed: input.deliverySpeed,
              deliveryName: input.deliveryName,
              deliveryAddress: input.deliveryAddress,
              deliveryPhone: input.deliveryPhone,
              paymentMethod: input.paymentMethod
            },
            userId: seller.id
          });
        }
      } catch (e) {
        console.error("Failed to send seller confirmation email:", e);
      }
      return result;
    })
  }),
  // Notifications
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserNotifications(ctx.user.id);
    }),
    markAsRead: protectedProcedure.input(z15.number()).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      await db3.update(notifications).set({ isRead: true }).where(and10(eq14(notifications.id, input), eq14(notifications.userId, ctx.user.id)));
      return { success: true };
    }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      await db3.update(notifications).set({ isRead: true }).where(eq14(notifications.userId, ctx.user.id));
      return { success: true };
    }),
    delete: protectedProcedure.input(z15.number()).mutation(async ({ input, ctx }) => {
      const db3 = await getDb();
      if (!db3) throw new Error("Database not available");
      await db3.delete(notifications).where(and10(eq14(notifications.id, input), eq14(notifications.userId, ctx.user.id)));
      return { success: true };
    })
  }),
  // Seller Dashboard
  seller: sellerRouter,
  // Admin Dashboard
  admin: adminRouter,
  // RBAC Management
  rbac: rbacRouter,
  // Ads & Monetization
  ads: adsRouter,
  // Email Notifications
  emails: emailsRouter,
  // Reviews & Ratings
  reviews: reviewsRouter,
  // Rentals
  rentals: rentalsRouter,
  // Deals & Offers - ADD THIS SECTION
  deals: dealsRouter
});

// backend/_core/clerk.ts
init_db();
import { createClerkClient, verifyToken } from "@clerk/backend";
var secretKey = process.env.CLERK_SECRET_KEY || "";
if (!secretKey && process.env.NODE_ENV === "production") {
  console.warn("CLERK_SECRET_KEY is not configured! Authentication will fail.");
}
var clerkClient = createClerkClient({ secretKey });
async function authenticateClerkUser(token) {
  try {
    console.log("[Clerk Auth] Verifying incoming Clerk token...");
    const claims = await verifyToken(token, { secretKey });
    const clerkId = claims.sub;
    if (!clerkId) {
      throw new Error("Clerk token missing subject claim (sub)");
    }
    console.log(`[Clerk Auth] Token verified successfully. subject (clerkId): ${clerkId}`);
    let user = await getUserByOpenId(clerkId);
    console.log(`[Clerk Auth] Local user lookup: ${user ? "Found (" + user.email + ")" : "Not Found"}`);
    if (!user) {
      console.log(`[Clerk Auth] Syncing new user profile for clerkId: ${clerkId}`);
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || null;
      const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email?.split("@")[0] || "User";
      const avatar = clerkUser.imageUrl || null;
      let role = clerkUser.privateMetadata?.role || "user";
      if (email === "bibekshrestha66@gmail.com" || email === process.env.OWNER_OPEN_ID) {
        role = "super_admin";
      }
      await upsertUser({
        openId: clerkId,
        name,
        email,
        avatar,
        role,
        loginMethod: "clerk",
        isVerified: role !== "user",
        // verify automatically if role has changed
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      user = await getUserByOpenId(clerkId);
    } else {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      let newRole = clerkUser.privateMetadata?.role || "user";
      if (user.email === "bibekshrestha66@gmail.com" || user.email === process.env.OWNER_OPEN_ID) {
        newRole = "super_admin";
      }
      if (user.role !== newRole || user.name !== `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()) {
        console.log(`[Clerk Auth] Updating role/metadata locally to: ${newRole} for ${clerkId}`);
        await upsertUser({
          openId: clerkId,
          role: newRole,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          avatar: clerkUser.imageUrl,
          lastSignedIn: /* @__PURE__ */ new Date()
        });
        user = await getUserByOpenId(clerkId);
      }
    }
    if (!user) {
      throw new Error("Failed to resolve user locally after Clerk sync");
    }
    return user;
  } catch (error) {
    console.error("[Clerk Auth] Failed to authenticate user:", error);
    throw error;
  }
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// backend/_core/authService.ts
var AuthService = class {
  /**
   * Authenticate a request using Clerk and return the user object from the local DB.
   */
  async authenticateRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ForbiddenError("Missing or invalid Authorization header");
    }
    const token = authHeader.substring(7);
    const user = await authenticateClerkUser(token);
    return user;
  }
};
var authService = new AuthService();

// backend/_core/context.ts
init_debugLog();
async function createContext(opts) {
  let user = null;
  const authHeader = opts.req.headers.authorization;
  const authHeaderLen = typeof authHeader === "string" ? authHeader.length : 0;
  let authErrorName = null;
  let authOk = false;
  try {
    user = await authService.authenticateRequest(opts.req);
    authOk = true;
  } catch (error) {
    authOk = false;
    authErrorName = error instanceof Error ? error.name : "Error";
    user = null;
  }
  writeDebugLog({
    sessionId: "90368c",
    runId: "debug_pre",
    hypothesisId: "H2_auth",
    location: "backend/_core/context.ts:createContext",
    message: "TRPC context auth result",
    data: {
      hasBearerHeader: typeof authHeader === "string" && authHeader.startsWith("Bearer "),
      authHeaderLen,
      authOk,
      authErrorName
    },
    timestamp: Date.now()
  });
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// backend/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path3 from "path";
import { createServer as createViteServer, loadEnv } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var plugins = [react(), tailwindcss(), jsxLocPlugin()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "frontend", "src"),
      "@shared": path2.resolve(__dirname, "shared"),
      "@assets": path2.resolve(__dirname, "attached_assets")
    }
  },
  envDir: path2.resolve(__dirname),
  root: path2.resolve(__dirname, "frontend"),
  publicDir: path2.resolve(__dirname, "frontend", "public"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "192.168.101.5"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// backend/_core/vite.ts
async function setupVite(app2, server) {
  const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        process.cwd(),
        "frontend",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// backend/_core/createApp.ts
init_websocket();
init_debugLog();
init_db();
init_schema();

// backend/seeds/categories.seed.ts
init_schema();
init_db();
import { eq as eq15 } from "drizzle-orm";
var CATEGORIES_DATA = [
  {
    name: "Electronics",
    slug: "electronics-appliances",
    icon: "\u{1F4F1}",
    description: "Mobiles, computers, TVs, and home appliances",
    sector: "marketplace",
    subcategories: [
      { name: "Accessories", slug: "accessories" },
      { name: "Audio Devices", slug: "audio-devices" },
      { name: "Cameras", slug: "cameras" },
      { name: "Gaming", slug: "gaming" },
      { name: "Laptops", slug: "laptops" },
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Tablets", slug: "tablets" },
      { name: "TV & Video", slug: "tv-video" }
    ]
  },
  {
    name: "Vehicles",
    slug: "vehicles",
    icon: "\u{1F697}",
    description: "Cars, motorcycles, bicycles, and auto parts",
    subcategories: [
      { name: "Bicycles", slug: "bicycles" },
      { name: "Cars", slug: "cars" },
      { name: "Electric Vehicles", slug: "electric-vehicles" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Scooters", slug: "scooters" },
      { name: "Spare Parts", slug: "spare-parts" },
      { name: "SUVs", slug: "suvs" },
      { name: "Trucks", slug: "trucks" }
    ]
  },
  {
    name: "Property",
    slug: "property",
    icon: "\u{1F3E0}",
    description: "Apartments, houses, land, and commercial space",
    subcategories: [
      { name: "Apartment", slug: "apartment" },
      { name: "Commercial", slug: "commercial" },
      { name: "House", slug: "house" },
      { name: "Land", slug: "land" },
      { name: "Office Space", slug: "property-office-space" },
      { name: "Others", slug: "property-others" },
      { name: "Shop", slug: "shop" }
    ]
  },
  {
    name: "Fashion",
    slug: "fashion-beauty",
    icon: "\u{1F457}",
    description: "Clothing, shoes, jewelry, and beauty products",
    subcategories: [
      { name: "Accessories", slug: "fashion-accessories-sub" },
      { name: "Bags", slug: "bags" },
      { name: "Jewelry", slug: "jewelry" },
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Watches", slug: "watches" },
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Footwear", slug: "footwear" }
    ]
  },
  {
    name: "Furniture",
    slug: "furniture-household",
    icon: "\u{1F6CB}\uFE0F",
    description: "Furniture, bedding, kitchenware, and home decor",
    subcategories: [
      { name: "Beds", slug: "beds" },
      { name: "Chairs", slug: "chairs" },
      { name: "Decor", slug: "decor" },
      { name: "Garden Furniture", slug: "garden-furniture" },
      { name: "Office Furniture", slug: "office-furniture" },
      { name: "Sofas", slug: "sofas" },
      { name: "Tables", slug: "tables" },
      { name: "Wardrobes", slug: "wardrobes" }
    ]
  },
  {
    name: "Sports",
    slug: "sports-leisure",
    icon: "\u26BD",
    description: "Sports equipment, outdoor gear, and hobbies",
    subcategories: [
      { name: "Camping", slug: "camping" },
      { name: "Cycling", slug: "cycling" },
      { name: "Fitness", slug: "fitness" },
      { name: "Gym Equipment", slug: "gym-equipment" },
      { name: "Outdoor Gear", slug: "outdoor-gear" },
      { name: "Swimming", slug: "swimming" },
      { name: "Team Sports", slug: "team-sports" },
      { name: "Yoga", slug: "yoga" }
    ]
  },
  {
    name: "Books",
    slug: "books-education",
    icon: "\u{1F4DA}",
    description: "Books, educational materials, and courses",
    subcategories: [
      { name: "Books", slug: "books" },
      { name: "Textbooks", slug: "textbooks" },
      { name: "E-Books", slug: "e-books" },
      { name: "Educational Materials", slug: "educational-materials" },
      { name: "Courses & Training", slug: "courses-training" },
      { name: "Online Courses", slug: "online-courses" },
      { name: "Tutoring Services", slug: "tutoring-services" }
    ]
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    icon: "\u{1F33E}",
    description: "Farming supplies, seeds, livestock, and agricultural tools",
    sector: "marketplace",
    subcategories: [
      { name: "Fertilizer", slug: "fertilizer" },
      { name: "Livestock", slug: "livestock" },
      { name: "Poultry", slug: "poultry" },
      { name: "Seeds", slug: "seeds" },
      { name: "Tools", slug: "tools" }
    ]
  },
  {
    name: "Digital",
    slug: "digital",
    icon: "\u{1F4BB}",
    description: "Software, digital services, and online goods",
    sector: "marketplace",
    subcategories: [
      { name: "Digital Art", slug: "digital-art" },
      { name: "Games", slug: "games" },
      { name: "Projects", slug: "projects" },
      { name: "Software", slug: "software" },
      { name: "Web Services", slug: "web-services" }
    ]
  },
  {
    name: "Groceries",
    slug: "groceries",
    icon: "\u{1F6D2}",
    description: "Food, beverages, and everyday essentials",
    sector: "marketplace",
    subcategories: [
      { name: "Fresh Produce", slug: "fresh-produce" },
      { name: "Packaged Foods", slug: "packaged-foods" },
      { name: "Beverages", slug: "beverages" },
      { name: "Snacks & Sweets", slug: "snacks-sweets" },
      { name: "Household Essentials", slug: "household-essentials" }
    ]
  },
  {
    name: "Medical",
    slug: "medical",
    icon: "\u{1FA7A}",
    description: "Medical supplies, equipment, and healthcare services",
    sector: "marketplace",
    subcategories: [
      { name: "First Aid", slug: "first-aid" },
      { name: "Herbal", slug: "herbal" },
      { name: "Medical Accessories", slug: "medical-accessories" },
      { name: "Medicines", slug: "medicines" },
      { name: "Wellness", slug: "wellness" }
    ]
  },
  {
    name: "Rooms",
    slug: "rooms",
    icon: "\u{1F6CF}\uFE0F",
    description: "Individual rooms, shared accommodations, and flats",
    sector: "marketplace",
    subcategories: [
      { name: "Bachelor Pad", slug: "bachelor-pad" },
      { name: "Entire Apartment", slug: "entire-apartment" },
      { name: "PG / Hostel", slug: "pg-hostel" },
      { name: "Private Room", slug: "private-room" },
      { name: "Shared Room", slug: "shared-room" },
      { name: "Studio", slug: "studio" }
    ]
  },
  {
    name: "Kids",
    slug: "kids-babies",
    icon: "\u{1F476}",
    description: "Clothing, toys, and products for children and infants",
    sector: "marketplace",
    subcategories: [
      { name: "Baby Clothing", slug: "baby-clothing" },
      { name: "Diapering", slug: "diapering" },
      { name: "Feeding", slug: "feeding" },
      { name: "Maternity", slug: "maternity" },
      { name: "Nursery Furniture", slug: "nursery-furniture" },
      { name: "Strollers", slug: "strollers" },
      { name: "Toys", slug: "toys" }
    ]
  },
  {
    name: "Pets",
    slug: "pets-animals",
    icon: "\u{1F43E}",
    description: "Dogs, cats, pets, and pet accessories",
    subcategories: [
      { name: "Dogs & Puppies", slug: "dogs-puppies" },
      { name: "Cats & Kittens", slug: "cats-kittens" },
      { name: "Birds", slug: "birds" },
      { name: "Fish & Aquarium", slug: "fish-aquarium" },
      { name: "Rabbits & Rodents", slug: "rabbits-rodents" },
      { name: "Pet Accessories", slug: "pet-accessories" },
      { name: "Pet Food & Supplies", slug: "pet-food-supplies" },
      { name: "Pet Grooming", slug: "pet-grooming" },
      { name: "Veterinary Services", slug: "veterinary-services" }
    ]
  },
  {
    name: "Services",
    slug: "services",
    icon: "\u{1F527}",
    description: "Home services, professional services, and repairs",
    subcategories: [
      { name: "Carpentry", slug: "carpentry" },
      { name: "Cleaning", slug: "cleaning" },
      { name: "Consulting", slug: "consulting" },
      { name: "Design", slug: "services-design" },
      { name: "Electrical", slug: "electrical" },
      { name: "Painting", slug: "painting" },
      { name: "Plumbing", slug: "plumbing" },
      { name: "Web Development", slug: "web-development" }
    ]
  },
  {
    name: "Commercial",
    slug: "business-industrial",
    icon: "\u{1F3ED}",
    description: "Commercial spaces and industrial property listings",
    subcategories: [
      { name: "Building", slug: "building" },
      { name: "Co-working", slug: "co-working" },
      { name: "Industrial", slug: "industrial" },
      { name: "Land", slug: "land-commercial" },
      { name: "Office Space", slug: "commercial-office-space" },
      { name: "Restaurant Space", slug: "restaurant-space" },
      { name: "Retail Shop", slug: "commercial-retail-shop" },
      { name: "Warehouse", slug: "commercial-warehouse" }
    ]
  },
  {
    name: "Jobs",
    slug: "jobs",
    icon: "\u{1F4BC}",
    description: "Full-time, part-time, and freelance jobs",
    subcategories: [
      { name: "Accounting & Finance", slug: "accounting-finance" },
      { name: "Blue Collar/Labor", slug: "blue-collar-labor" },
      { name: "Customer Service", slug: "customer-service" },
      { name: "Education", slug: "education" },
      { name: "Engineering", slug: "engineering" },
      { name: "Healthcare", slug: "healthcare" },
      { name: "IT & Software", slug: "it-software" },
      { name: "Sales & Marketing", slug: "sales-marketing" }
    ]
  },
  {
    name: "Property",
    slug: "property-auctions",
    icon: "\u{1F3E0}",
    description: "Auction listings for homes, land, and commercial property",
    sector: "auction",
    subcategories: [
      { name: "Residential Auctions", slug: "residential-auctions" },
      { name: "Commercial Auctions", slug: "commercial-auctions" },
      { name: "Land Auctions", slug: "land-auctions" },
      { name: "Industrial Auctions", slug: "industrial-auctions" }
    ]
  },
  {
    name: "Vehicle",
    slug: "vehicle-auctions",
    icon: "\u{1F697}",
    description: "Cars, motorcycles, trucks and parts sold by auction",
    sector: "auction",
    subcategories: [
      { name: "Cars & SUVs", slug: "cars-suvs" },
      { name: "Motorcycles", slug: "auction-motorcycles" },
      { name: "Buses & Trucks", slug: "buses-trucks" },
      { name: "Spare Parts", slug: "auction-spare-parts" }
    ]
  },
  {
    name: "Collectibles & Luxury",
    slug: "collectibles-luxury-auctions",
    icon: "\u{1F48E}",
    description: "Art, jewelry, antiques and high-value auction items",
    sector: "auction",
    subcategories: [
      { name: "Art & Antiques", slug: "art-antiques" },
      { name: "Jewelry & Watches", slug: "jewelry-watches" },
      { name: "Fashion & Accessories", slug: "fashion-accessories" },
      { name: "Rare Collectibles", slug: "rare-collectibles" }
    ]
  },
  {
    name: "Electronics",
    slug: "electronics-auctions",
    icon: "\u{1F4BB}",
    description: "Electronics, gadgets, and devices sold through auction",
    sector: "auction",
    subcategories: [
      { name: "Mobile Phones", slug: "auction-mobile-phones" },
      { name: "Laptops & Computers", slug: "auction-laptops-computers" },
      { name: "Cameras & Photography", slug: "auction-cameras-photography" },
      { name: "TVs & Audio", slug: "auction-tvs-audio" },
      { name: "Gaming & Gadgets", slug: "auction-gaming-gadgets" }
    ]
  },
  {
    name: "Property",
    slug: "property-rentals",
    icon: "\u{1F3D8}\uFE0F",
    description: "Homes, apartments and rooms available for rent",
    sector: "rental",
    subcategories: [
      { name: "Apartments", slug: "rental-apartments-flats" },
      { name: "Houses", slug: "rental-houses" },
      { name: "Rooms", slug: "rental-rooms" }
    ]
  },
  {
    name: "Commercial",
    slug: "commercial-rentals",
    icon: "\u{1F3E2}",
    description: "Commercial spaces and business rentals for offices, retail, and warehousing",
    sector: "rental",
    subcategories: [
      { name: "Office Space", slug: "rental-office-space" },
      { name: "Retail Shop", slug: "rental-retail-shop" },
      { name: "Warehouse", slug: "rental-warehouse" }
    ]
  },
  {
    name: "Vehicles",
    slug: "vehicle-rentals",
    icon: "\u{1F698}",
    description: "Cars, bikes and heavy vehicles rented by the day or week",
    sector: "rental",
    subcategories: [
      { name: "Cars", slug: "rent-cars-suvs" },
      { name: "Bikes", slug: "rent-motorcycles-scooters" },
      { name: "Heavy Vehicles", slug: "rent-vans-trucks" }
    ]
  },
  {
    name: "Equipment",
    slug: "equipment-rentals",
    icon: "\u{1F6E0}\uFE0F",
    description: "Tools, machinery and event gear for short-term rental",
    sector: "rental",
    subcategories: [
      { name: "Camera Gear", slug: "party-event-gear" },
      { name: "Construction", slug: "construction-equipment" },
      { name: "Medical", slug: "furniture-rentals" },
      { name: "Tools", slug: "audio-visual" },
      { name: "Gears", slug: "rent-gaming-gear" }
    ]
  },
  {
    name: "Electronics",
    slug: "electronics-rentals",
    icon: "\u{1F4BB}",
    description: "Laptops, cameras, audio, and smart devices available for rent",
    sector: "rental",
    subcategories: [
      { name: "Laptops", slug: "rent-laptops-computers" },
      { name: "Cameras", slug: "rent-cameras-photography" },
      { name: "Audio", slug: "rent-audio-visual" }
    ]
  },
  {
    name: "Skills",
    slug: "skills-rentals",
    icon: "\u{1F9D1}\u200D\u{1F3EB}",
    description: "Skilled professionals and service providers available for hire",
    sector: "rental",
    subcategories: [
      { name: "Auto Mechanic", slug: "auto-mechanic" },
      { name: "Carpenter", slug: "carpenter" },
      { name: "Demolition", slug: "demolition" },
      { name: "Design", slug: "skills-design" },
      { name: "Drywaller/Sheetrocking", slug: "drywaller" },
      { name: "Electrician", slug: "electrician" },
      { name: "Flooring Installer", slug: "flooring" },
      { name: "General Labor", slug: "labor" },
      { name: "Housekeeping/Janitorial", slug: "housekeeping" },
      { name: "HVAC Technician", slug: "hvac" },
      { name: "Landscaper/Gardener", slug: "landscaper" },
      { name: "Mason", slug: "mason" },
      { name: "Painter", slug: "painter" },
      { name: "Plumber", slug: "plumber" },
      { name: "Programming", slug: "programming" },
      { name: "Repair & Maintenance", slug: "repair" },
      { name: "Roofer", slug: "roofer" },
      { name: "Tutoring", slug: "tutoring" },
      { name: "Warehouse/Forklift Operator", slug: "skills-warehouse" },
      { name: "Welder", slug: "welder" },
      { name: "AI Skills", slug: "ai-skills" },
      { name: "Others", slug: "skills-others" }
    ]
  }
];
async function seedCategories() {
  try {
    console.log("Seeding categories...");
    const db3 = await getDb();
    if (!db3) {
      throw new Error("Database not available");
    }
    for (const category of CATEGORIES_DATA) {
      const sector = category.sector ?? "marketplace";
      const existingCategory = await db3.select().from(categories).where(eq15(categories.slug, category.slug)).limit(1);
      let mainCatId;
      if (existingCategory.length === 0) {
        await db3.insert(categories).values({
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          description: category.description,
          sector,
          parentId: null
        });
        const inserted = await db3.select().from(categories).where(eq15(categories.slug, category.slug)).limit(1);
        mainCatId = inserted[0]?.id;
        console.log(`\u2713 Created category: ${category.name}`);
      } else {
        mainCatId = existingCategory[0].id;
        const updates = {};
        if (existingCategory[0].parentId !== null) {
          updates.parentId = null;
        }
        if (existingCategory[0].sector !== sector) {
          updates.sector = sector;
        }
        if (existingCategory[0].name !== category.name) {
          updates.name = category.name;
        }
        if (existingCategory[0].description !== category.description) {
          updates.description = category.description;
        }
        if (existingCategory[0].icon !== category.icon) {
          updates.icon = category.icon;
        }
        if (Object.keys(updates).length > 0) {
          await db3.update(categories).set(updates).where(eq15(categories.id, mainCatId));
          console.log(`\u21BA Updated category metadata for: ${category.name}`);
        }
      }
      if (!mainCatId) {
        continue;
      }
      if (category.subcategories && category.subcategories.length > 0) {
        let addedCount = 0;
        for (const subcategory of category.subcategories) {
          const existingSubcategory = await db3.select().from(categories).where(eq15(categories.slug, subcategory.slug)).limit(1);
          if (existingSubcategory.length === 0) {
            await db3.insert(categories).values({
              name: subcategory.name,
              slug: subcategory.slug,
              icon: subcategory.icon ?? "\u{1F4CC}",
              description: subcategory.description ?? `${subcategory.name} in ${category.name}`,
              sector,
              parentId: mainCatId
            });
            addedCount += 1;
          } else {
            const existing = existingSubcategory[0];
            const subUpdates = {};
            if (existing.parentId !== mainCatId) {
              subUpdates.parentId = mainCatId;
            }
            if (existing.sector !== sector) {
              subUpdates.sector = sector;
            }
            if (existing.name !== subcategory.name) {
              subUpdates.name = subcategory.name;
            }
            const expectedDescription = subcategory.description ?? `${subcategory.name} in ${category.name}`;
            if (existing.description !== expectedDescription) {
              subUpdates.description = expectedDescription;
            }
            const expectedIcon = subcategory.icon ?? "\u{1F4CC}";
            if (existing.icon !== expectedIcon) {
              subUpdates.icon = expectedIcon;
            }
            if (Object.keys(subUpdates).length > 0) {
              await db3.update(categories).set(subUpdates).where(eq15(categories.id, existing.id));
              console.log(`\u21BA Updated subcategory metadata for: ${subcategory.name}`);
            }
          }
        }
        if (addedCount > 0) {
          console.log(`  \u2713 Added ${addedCount} subcategories to ${category.name}`);
        }
      }
    }
    console.log("\u2713 Categories seeding completed!");
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
}

// backend/upload.ts
import { Router } from "express";
import multer from "multer";
import { ObjectId as ObjectId2 } from "mongodb";
import crypto2 from "crypto";

// backend/mongoStorage.ts
import { MongoClient, GridFSBucket } from "mongodb";
import { Readable } from "stream";
var mongoClient = null;
var gridFSBucket = null;
async function initMongoStorage() {
  if (gridFSBucket) return gridFSBucket;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  const db3 = mongoClient.db();
  gridFSBucket = new GridFSBucket(db3, {
    bucketName: "uploads"
  });
  return gridFSBucket;
}
async function getGridFSBucket() {
  if (!gridFSBucket) {
    return await initMongoStorage();
  }
  return gridFSBucket;
}
async function uploadToGridFS(filename2, buffer, contentType) {
  const bucket = await getGridFSBucket();
  return new Promise((resolve, reject) => {
    const readableTrackStream = new Readable();
    readableTrackStream.push(buffer);
    readableTrackStream.push(null);
    const uploadStream = bucket.openUploadStream(filename2, {
      metadata: { contentType }
    });
    readableTrackStream.pipe(uploadStream).on("error", (error) => {
      reject(error);
    }).on("finish", () => {
      resolve(uploadStream.id.toString());
    });
  });
}

// backend/upload.ts
var uploadRouter = Router();
var storage = multer.memoryStorage();
var upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
  // 50MB max
});
uploadRouter.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const isVideo = req.file.mimetype.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: `File too large. Max size for ${isVideo ? "videos is 50MB" : "images is 5MB"}` });
    }
    const fileExtension = req.file.originalname.split(".").pop() || "jpg";
    const randomHash = crypto2.randomBytes(16).toString("hex");
    const key = `uploads/${Date.now()}-${randomHash}.${fileExtension}`;
    const fileId = await uploadToGridFS(key, req.file.buffer, req.file.mimetype);
    const publicUrl = `/api/upload/image/${fileId}`;
    res.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});
uploadRouter.get("/image/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!ObjectId2.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }
    const bucket = await getGridFSBucket();
    const _id = new ObjectId2(fileId);
    const files = await bucket.find({ _id }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    const file = files[0];
    const contentType = file.metadata?.contentType || "application/octet-stream";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end();
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: error.message || "Failed to download image" });
  }
});

// backend/inngest/index.ts
import { serve } from "inngest/express";

// backend/inngest/functions.ts
init_db();
init_schema();
init_websocket();
import { eq as eq16 } from "drizzle-orm";
var sendQueuedEmail = inngest.createFunction(
  { id: "send-queued-email", triggers: [{ event: "email/queued" }] },
  async ({ event, step }) => {
    await step.run("process-queue", async () => {
      console.log("[Inngest] Triggering email queue processing...");
      await emailService.processPendingEmails();
    });
  }
);
var handleListingChange = inngest.createFunction(
  { id: "handle-listing-change", triggers: [{ event: "listing/change" }] },
  async ({ event, step }) => {
    const { action, listingId, title } = event.data;
    await step.run("log-change", async () => {
      console.log(`[Inngest] Listing change background job: ${action} for Listing ID: ${listingId} (${title})`);
    });
  }
);
var scheduleAuctionClose = inngest.createFunction(
  { id: "schedule-auction-close", triggers: [{ event: "auction/created" }] },
  async ({ event, step }) => {
    const { auctionId, endTime } = event.data;
    console.log(`[Inngest] Scheduling close for Auction ID: ${auctionId} at ${endTime}`);
    await step.sleepUntil("wait-for-auction-end", new Date(endTime));
    await step.run("finalize-auction", async () => {
      const db3 = await getDb();
      const [auction] = await db3.select().from(auctions).where(eq16(auctions.id, auctionId));
      if (!auction) return;
      console.log(`[Inngest] Finalizing Auction ID: ${auctionId}`);
      if (auction.highestBidderId && auction.currentBid) {
        await db3.insert(notifications).values({
          userId: auction.highestBidderId,
          type: "auction",
          title: "Auction Won!",
          content: `Congratulations! You won the auction for Listing ID: ${auction.listingId} with a bid of NPR ${auction.currentBid}.`,
          relatedId: auction.id,
          isRead: false
        });
        try {
          const wsManager2 = getWebSocketManager();
          wsManager2.notifyOrder(auction.highestBidderId, {
            type: "auction-won",
            orderId: `AUC-${auctionId}`,
            status: "won",
            title: "Auction Won!",
            content: `You won the auction with a bid of NPR ${auction.currentBid}.`
          });
        } catch (e) {
          console.error("Failed to emit WebSocket for auction win", e);
        }
      }
    });
  }
);

// backend/inngest/index.ts
var inngestHandler = serve({
  client: inngest,
  functions: [
    sendQueuedEmail,
    handleListingChange,
    scheduleAuctionClose
  ]
});

// backend/rest.ts
init_db();
init_crypto();
import { Router as Router2 } from "express";
import multer2 from "multer";
import crypto3 from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and as and11, desc as desc10, eq as eq17, or as or5, sql as sql7 } from "drizzle-orm";
init_debugLog();

// backend/r2.ts
import { S3Client } from "@aws-sdk/client-s3";
var R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
var R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
var R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
var R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "sasto";
var R2_PUBLIC_CUSTOM_DOMAIN = process.env.R2_PUBLIC_CUSTOM_DOMAIN;
function getR2PublicBaseUrl() {
  if (R2_PUBLIC_CUSTOM_DOMAIN) return R2_PUBLIC_CUSTOM_DOMAIN.replace(/\/$/, "");
  if (!R2_ACCOUNT_ID) return null;
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}
function getR2Client() {
  if (!R2_ACCOUNT_ID) return null;
  return new S3Client({
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID || "",
      secretAccessKey: R2_SECRET_ACCESS_KEY || ""
    },
    region: "auto"
  });
}

// backend/rest.ts
init_schema();
var storage2 = multer2.memoryStorage();
var upload2 = multer2({
  storage: storage2,
  limits: { fileSize: 20 * 1024 * 1024 }
  // 20MB
});
function sanitizeFilename(name) {
  return name.replace(/[^\w.\-() ]+/g, "_").replace(/\s+/g, "-").slice(0, 120);
}
async function requireUser2(req) {
  const user = await authService.authenticateRequest(req);
  return user;
}
var restRouter = Router2();
restRouter.post("/upload-url", async (req, res) => {
  try {
    const { filename: filename2, contentType } = req.body ?? {};
    if (!filename2 || typeof filename2 !== "string") {
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
    const safeName = sanitizeFilename(filename2);
    const key = `uploads/${Date.now()}-${crypto3.randomUUID()}-${safeName}`;
    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });
    const url = await getSignedUrl(r2, cmd, { expiresIn: 3600 });
    const fileId = `${publicBase}/${key}`;
    return res.json({ url, fileId });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Failed to create presigned url" });
  }
});
restRouter.post("/verification/upload", upload2.single("file"), async (req, res) => {
  try {
    const authed = await requireUser2(req);
    const stepId = String(req.body?.stepId ?? "");
    const sellerIdRaw = String(req.body?.sellerId ?? "");
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
    const key = `verification/${authed.id}/${stepId}/${Date.now()}-${crypto3.randomUUID()}.${ext}`;
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      })
    );
    const documentUrl = `${publicBase}/${key}`;
    const db3 = await getDb();
    if (!db3) return res.status(500).json({ error: "Database not available" });
    await db3.insert(verificationSubmissions).values({
      userId: authed.id,
      type: "kyc",
      data: { stepId, documentUrl, filename: req.file.originalname, contentType: req.file.mimetype },
      status: "pending"
    });
    await db3.update(users).set({ verificationStatus: "pending" }).where(eq17(users.id, authed.id));
    return res.json({ documentUrl });
  } catch (e) {
    const msg = e?.message || "Upload failed";
    const status = msg.includes("Authorization") ? 401 : 500;
    return res.status(status).json({ error: msg });
  }
});
restRouter.post("/recommendations", async (req, res) => {
  try {
    const { userId, currentListingId, limit } = req.body ?? {};
    const take = Math.min(Math.max(Number(limit) || 6, 1), 24);
    const db3 = await getDb();
    if (!db3) return res.status(500).json({ error: "Database not available" });
    let categoryId = null;
    if (typeof currentListingId === "number") {
      const current = await db3.select().from(listings).where(eq17(listings.id, currentListingId)).limit(1);
      categoryId = current[0]?.categoryId ?? null;
    }
    const whereParts = [eq17(listings.status, "active")];
    if (typeof currentListingId === "number") whereParts.push(sql7`${listings.id} <> ${currentListingId}`);
    if (categoryId) whereParts.push(eq17(listings.categoryId, categoryId));
    const rows = await db3.select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      images: listings.images,
      categoryId: listings.categoryId,
      sellerName: users.name,
      sellerId: users.id,
      categoryName: categories.name
    }).from(listings).leftJoin(users, eq17(listings.userId, users.id)).leftJoin(categories, eq17(listings.categoryId, categories.id)).where(and11(...whereParts)).orderBy(desc10(listings.createdAt)).limit(take);
    const recs = rows.map((r, idx) => ({
      id: r.id,
      title: r.title,
      price: Number(r.price || 0),
      image: (Array.isArray(r.images) ? r.images[0] : "") || "",
      rating: 4.6,
      seller: r.sellerName || "Seller",
      category: r.categoryName || "Category",
      reason: categoryId ? "Similar Category Match" : "Trending Now",
      relevanceScore: categoryId ? 0.9 - idx * 0.03 : 0.75 - idx * 0.02
    }));
    if (recs.length === 0) {
      const fallback = await db3.select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        images: listings.images,
        sellerName: users.name,
        categoryName: categories.name
      }).from(listings).leftJoin(users, eq17(listings.userId, users.id)).leftJoin(categories, eq17(listings.categoryId, categories.id)).where(eq17(listings.status, "active")).orderBy(sql7`RANDOM()`).limit(take);
      return res.json({
        recommendations: fallback.map((r, idx) => ({
          id: r.id,
          title: r.title,
          price: Number(r.price || 0),
          image: (Array.isArray(r.images) ? r.images[0] : "") || "",
          rating: 4.5,
          seller: r.sellerName || "Seller",
          category: r.categoryName || "Category",
          reason: "Popular on Sasto",
          relevanceScore: 0.7 - idx * 0.02
        }))
      });
    }
    return res.json({ recommendations: recs });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Failed to fetch recommendations" });
  }
});
restRouter.get("/disputes/:disputeId", async (req, res) => {
  try {
    const disputeId = Number.parseInt(req.params.disputeId, 10);
    if (!Number.isFinite(disputeId)) return res.status(400).json({ error: "Invalid disputeId" });
    const db3 = await getDb();
    if (!db3) return res.status(500).json({ error: "Database not available" });
    const [d] = await db3.select().from(disputes).where(eq17(disputes.id, disputeId)).limit(1);
    if (!d) return res.status(404).json({ error: "Dispute not found" });
    const msgRows = await db3.select({
      id: messages.id,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      content: messages.content,
      createdAt: messages.createdAt,
      attachmentUrl: messages.attachmentUrl,
      senderName: users.name
    }).from(messages).leftJoin(users, eq17(messages.senderId, users.id)).where(
      and11(
        eq17(messages.listingId, d.listingId),
        or5(
          and11(eq17(messages.senderId, d.buyerId), eq17(messages.recipientId, d.sellerId)),
          and11(eq17(messages.senderId, d.sellerId), eq17(messages.recipientId, d.buyerId))
        )
      )
    ).orderBy(messages.createdAt);
    const mapped = {
      id: d.id,
      orderId: d.listingId,
      // frontend expects orderId; we map listingId here
      buyerId: d.buyerId,
      sellerId: d.sellerId,
      reason: d.title,
      status: d.status || "open",
      createdAt: d.createdAt,
      resolution: d.resolution || void 0,
      messages: msgRows.map((m) => ({
        id: m.id,
        userId: m.senderId,
        userName: m.senderName || "User",
        message: decryptMessage(String(m.content || "")),
        timestamp: m.createdAt,
        attachments: m.attachmentUrl ? [m.attachmentUrl] : []
      }))
    };
    return res.json(mapped);
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Failed to fetch dispute" });
  }
});
restRouter.post("/disputes/:disputeId/messages", async (req, res) => {
  try {
    const user = await requireUser2(req);
    const disputeId = Number.parseInt(req.params.disputeId, 10);
    if (!Number.isFinite(disputeId)) return res.status(400).json({ error: "Invalid disputeId" });
    const { message } = req.body ?? {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }
    const db3 = await getDb();
    if (!db3) return res.status(500).json({ error: "Database not available" });
    const [d] = await db3.select().from(disputes).where(eq17(disputes.id, disputeId)).limit(1);
    if (!d) return res.status(404).json({ error: "Dispute not found" });
    const isBuyer = user.id === d.buyerId;
    const isSeller = user.id === d.sellerId;
    if (!isBuyer && !isSeller) return res.status(403).json({ error: "Forbidden" });
    const recipientId = isBuyer ? d.sellerId : d.buyerId;
    const [inserted] = await db3.insert(messages).values({
      senderId: user.id,
      recipientId,
      listingId: d.listingId,
      content: encryptMessage(message),
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    try {
      const ws = global.wsManager;
      if (ws?.notifyMessage) {
        ws.notifyMessage({
          id: inserted?.id,
          senderId: user.id,
          recipientId,
          content: message,
          timestamp: /* @__PURE__ */ new Date(),
          conversationId: [user.id, recipientId].sort().join("-")
        });
      }
    } catch {
    }
    return res.json({ success: true });
  } catch (e) {
    const msg = e?.message || "Failed to send message";
    const status = msg.includes("Authorization") ? 401 : 500;
    return res.status(status).json({ error: msg });
  }
});
restRouter.post("/disputes/:disputeId/resolve", async (req, res) => {
  try {
    const user = await requireUser2(req);
    const disputeId = Number.parseInt(req.params.disputeId, 10);
    if (!Number.isFinite(disputeId)) return res.status(400).json({ error: "Invalid disputeId" });
    const { resolution } = req.body ?? {};
    if (!resolution || typeof resolution !== "string" || !resolution.trim()) {
      return res.status(400).json({ error: "resolution is required" });
    }
    const db3 = await getDb();
    if (!db3) return res.status(500).json({ error: "Database not available" });
    const [d] = await db3.select().from(disputes).where(eq17(disputes.id, disputeId)).limit(1);
    if (!d) return res.status(404).json({ error: "Dispute not found" });
    if (user.id !== d.buyerId && user.id !== d.sellerId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await db3.update(disputes).set({ status: "resolved", resolution, resolvedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq17(disputes.id, disputeId));
    return res.json({ success: true });
  } catch (e) {
    const msg = e?.message || "Failed to resolve dispute";
    const status = msg.includes("Authorization") ? 401 : 500;
    return res.status(status).json({ error: msg });
  }
});
restRouter.get("/analytics", async (req, res) => {
  const t0 = Date.now();
  const range = String(req.query.range || "month");
  writeDebugLog({
    sessionId: "90368c",
    runId: "debug_pre",
    hypothesisId: "H_analytics_entry_local",
    location: "backend/rest.ts:GET /api/analytics",
    message: "analytics entry (local file)",
    data: { range, method: req.method, path: req.originalUrl || req.url },
    timestamp: Date.now()
  });
  fetch("http://127.0.0.1:7884/ingest/4eb48921-d438-46ea-8ea8-0991e31d49ad", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "90368c" }, body: JSON.stringify({ sessionId: "90368c", runId: "debug_pre", hypothesisId: "H_analytics_entry", location: "backend/rest.ts:GET /api/analytics", message: "analytics entry", data: { range, method: req.method, path: req.originalUrl || req.url }, timestamp: Date.now() }) }).catch(() => {
  });
  try {
    const db3 = await getDb();
    if (!db3) return res.status(500).json({ error: "Database not available" });
    const [{ totalUsers } = { totalUsers: 0 }] = await db3.select({ totalUsers: sql7`count(*)` }).from(users);
    const [{ totalTransactions } = { totalTransactions: 0 }] = await db3.select({ totalTransactions: sql7`count(*)` }).from(transactions);
    const [{ totalRevenue } = { totalRevenue: 0 }] = await db3.select({ totalRevenue: sql7`coalesce(sum(${transactions.amount}), 0)` }).from(transactions);
    const avg2 = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const topCats = await db3.select({
      name: categories.name,
      count: sql7`count(*)`
    }).from(listings).innerJoin(categories, eq17(listings.categoryId, categories.id)).groupBy(categories.name).orderBy(sql7`count(*) desc`).limit(6);
    const points = range === "week" ? 7 : range === "year" ? 12 : 30;
    const userGrowth = Array.from({ length: points }, () => 0);
    const revenueGrowth = Array.from({ length: points }, () => 0);
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
        topCatsCount: topCats.length
      },
      timestamp: Date.now()
    });
    fetch("http://127.0.0.1:7884/ingest/4eb48921-d438-46ea-8ea8-0991e31d49ad", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "90368c" }, body: JSON.stringify({ sessionId: "90368c", runId: "debug_pre", hypothesisId: "H_analytics_ok", location: "backend/rest.ts:GET /api/analytics", message: "analytics success", data: { range, ms: Date.now() - t0, totalUsers: Number(totalUsers || 0), totalTransactions: Number(totalTransactions || 0), totalRevenue: Number(totalRevenue || 0), topCatsCount: topCats.length }, timestamp: Date.now() }) }).catch(() => {
    });
    return res.json({
      totalRevenue: Number(totalRevenue || 0),
      totalUsers: Number(totalUsers || 0),
      totalTransactions: Number(totalTransactions || 0),
      averageOrderValue: Number(avg2 || 0),
      conversionRate: 0,
      userGrowth,
      revenueGrowth,
      topCategories: topCats.map((c) => ({ name: c.name, count: Number(c.count) })),
      userRetention: 0,
      customerSatisfaction: 4.6
    });
  } catch (e) {
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
        errorMessage: e instanceof Error ? String(e.message).slice(0, 200) : null
      },
      timestamp: Date.now()
    });
    fetch("http://127.0.0.1:7884/ingest/4eb48921-d438-46ea-8ea8-0991e31d49ad", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "90368c" }, body: JSON.stringify({ sessionId: "90368c", runId: "debug_pre", hypothesisId: "H_analytics_err", location: "backend/rest.ts:GET /api/analytics", message: "analytics error", data: { range, ms: Date.now() - t0, errorName: e instanceof Error ? e.name : null, errorMessage: e instanceof Error ? String(e.message).slice(0, 200) : null }, timestamp: Date.now() }) }).catch(() => {
    });
    return res.status(500).json({ error: e?.message || "Failed to fetch analytics" });
  }
});

// backend/_core/createApp.ts
async function createApp(options) {
  const { mode, httpServer } = options;
  const app2 = express2();
  app2.set("trust proxy", 1);
  app2.use("/socket.io", (req, res, next) => {
  });
  app2.use(cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://sasto-ochre.vercel.app",
      "https://sasto-yqdw.onrender.com"
    ],
    credentials: true
  }));
  const isDev = mode === "development";
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
      VERCEL: !!process.env.VERCEL
    },
    timestamp: Date.now()
  });
  app2.use((_req, res, next) => {
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
      ...isDev ? [] : ["upgrade-insecure-requests"]
    ];
    res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
    next();
  });
  app2.use((req, _res, next) => {
    writeDebugLog({
      sessionId: "90368c",
      runId: "debug_pre",
      hypothesisId: "H6_request_path",
      location: "backend/_core/createApp.ts:request_entry",
      message: "Incoming request",
      data: {
        method: req.method,
        path: req.originalUrl || req.url
      },
      timestamp: Date.now()
    });
    next();
  });
  if (mode !== "serverless" && httpServer) {
    const wsManager2 = initializeWebSocket(httpServer);
    global.wsManager = wsManager2;
    console.log("[WebSocket] Initialized");
  } else {
    console.log("[WebSocket] Skipped (serverless / no HTTP server)");
  }
  app2.use("/api/inngest", inngestHandler);
  app2.use("/api", restRouter);
  if (mode !== "serverless") {
    try {
      const { getPayload } = await import("payload");
      const payloadConfigModule = await Promise.resolve().then(() => (init_payload_config(), payload_config_exports));
      const payloadInstance = await getPayload({ config: payloadConfigModule.default });
      app2.locals.payload = payloadInstance;
      console.info("[CMS] Payload CMS v3 Local API initialized successfully");
    } catch (err) {
      console.warn("[CMS] Payload CMS failed to initialize (non-fatal):", err.message);
    }
  } else {
    console.log("[CMS] Payload CMS skipped in serverless mode.");
  }
  app2.use(express2.json({ limit: "50mb" }));
  app2.use(express2.urlencoded({ limit: "50mb", extended: true }));
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1e3,
    max: isDev ? 1e3 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 1 minute"
  });
  app2.use("/api/trpc", limiter);
  app2.use("/api/upload", uploadRouter);
  app2.use((req, res, next) => {
    if (req.path.includes("cart.") || req.path.includes("transactions.") || req.path.includes("auth.")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });
  const checkoutLimiter = rateLimit({
    windowMs: 1 * 60 * 1e3,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many checkout attempts, please try again later."
  });
  app2.use("/api/trpc/*checkoutCart*", checkoutLimiter);
  app2.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/webhooks/logistics", async (req, res) => {
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
        const updateData = { status: mappedStatus, updatedAt: /* @__PURE__ */ new Date() };
        if (mappedStatus === "delivered") updateData.deliveredAt = /* @__PURE__ */ new Date();
        if (mappedStatus === "shipped") updateData.shippedAt = /* @__PURE__ */ new Date();
        const { eq: eq18 } = __require("drizzle-orm");
        await db.update(transactions).set(updateData).where(eq18(transactions.trackingNumber, trackingNumber));
      }
      res.status(200).send("Webhook received");
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).send("Webhook processing failed");
    }
  });
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  app2.get("/api/dev/force-login", async (_req, res) => {
    res.status(500).send("Force login disabled \u2014 Clerk login required");
  });
  app2.get("/api/debug/config", (_req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ error: "Not available in production" });
    }
    res.json({
      NODE_ENV: process.env.NODE_ENV,
      VITE_APP_URL: process.env.VITE_APP_URL,
      VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || "NOT SET",
      VITE_APP_ID: process.env.VITE_APP_ID
    });
  });
  app2.get("/api/debug/me", async (_req, res) => {
    return res.json({ message: "Clerk-based authentication debug" });
  });
  app2.get("/api/debug/verify-token", async (_req, res) => {
    return res.json({ message: "Clerk token verification required via Authorization header" });
  });
  app2.use((err, req, _res, next) => {
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
        errorMessage: err instanceof Error && typeof err.message === "string" ? err.message.slice(0, 200) : null
      },
      timestamp: Date.now()
    });
    next(err);
  });
  if (mode === "development" && httpServer) {
    await setupVite(app2, httpServer);
  }
  app2.get("/", (_req, res) => {
    res.send("Sasto Marketplace API Server Running\n\nAPI Status: Online\nTime: " + (/* @__PURE__ */ new Date()).toISOString());
  });
  app2.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "sasto-api",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const ready2 = (async () => {
    try {
      console.log("[Startup] Ensuring category taxonomy is seeded.");
      await seedCategories();
    } catch (err) {
      console.warn("[Startup] Category seeding failed:", err);
    }
  })();
  return { app: app2, ready: ready2 };
}

// api/_entry.ts
var app = null;
var ready = null;
async function getApp() {
  if (!app) {
    const created = await createApp({ mode: "serverless" });
    app = created.app;
    ready = created.ready;
    await ready;
  } else if (ready) {
    await ready;
  }
  return app;
}
async function handler(req, res) {
  try {
    const application = await getApp();
    application(req, res);
  } catch (err) {
    console.error("[Vercel Handler] Fatal error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Server initialization failed", detail: String(err) }));
  }
}
export {
  handler as default
};
