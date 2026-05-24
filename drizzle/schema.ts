import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = sqliteTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  lastLogin: integer("lastLogin", { mode: 'timestamp_ms' }),
  isVerified: integer("isVerified", { mode: 'boolean' }).default(false).notNull(),
  verificationLevel: text("verificationLevel").default("basic").notNull(),
  resetToken: text("resetToken"),
  resetTokenExpires: integer("resetTokenExpires", { mode: 'timestamp_ms' }),
  // Advanced business fields
  businessName: text("businessName"),
  businessLicense: text("businessLicense"),
  experienceYears: integer("experienceYears"),
  specialties: text("specialties"), // Comma separated list of categories
  socialLinks: text("socialLinks"), // JSON string
  bannerImage: text("bannerImage"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Categories table
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  parentId: integer("parentId"),
  sector: text("sector").default("marketplace"), // marketplace, auction, rental, all
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Listings table
export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  categoryId: integer("categoryId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  price: real("price"),
  images: text("images", { mode: 'json' }),
  location: text("location"),
  district: text("district"),
  brand: text("brand"),
  model: text("model"),
  color: text("color"),
  condition: text("condition"),
  status: text("status").default("active"),
  views: integer("views").default(0),
  stock: integer("stock").default(1),
  isFeatured: integer("isFeatured", { mode: 'boolean' }).default(false),
  featuredUntil: integer("featuredUntil", { mode: 'timestamp_ms' }),
  originalPrice: real("originalPrice"),
  discount: integer("discount"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  expiresAt: integer("expiresAt", { mode: 'timestamp_ms' }),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

// Auction listings (extends listings)
export const auctions = sqliteTable("auctions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listingId").notNull(),
  startingPrice: real("startingPrice").notNull(),
  currentBid: real("currentBid"),
  highestBidderId: integer("highestBidderId"),
  startTime: integer("startTime", { mode: 'timestamp_ms' }).notNull(),
  endTime: integer("endTime", { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = typeof auctions.$inferInsert;

// Bids table
export const bids = sqliteTable("bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  auctionId: integer("auctionId").notNull(),
  bidderId: integer("bidderId").notNull(),
  amount: real("amount").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

// Rental bookings table
export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listingId").notNull(),
  userId: integer("userId").notNull(),
  startDate: integer("startDate", { mode: 'timestamp_ms' }).notNull(),
  endDate: integer("endDate", { mode: 'timestamp_ms' }).notNull(),
  totalPrice: real("totalPrice").notNull(),
  status: text("status").default("pending"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// Favorites/Watchlist table
export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  listingId: integer("listingId").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// Messages table
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: integer("senderId").notNull(),
  recipientId: integer("recipientId").notNull(),
  listingId: integer("listingId"),
  content: text("content").notNull(),
  isRead: integer("isRead", { mode: 'boolean' }).default(false),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentType: text("attachmentType"),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Reviews table
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromUserId: integer("fromUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: integer("toUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listingId").references(() => listings.id, { onDelete: "cascade" }),
  transactionId: integer("transactionId"),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  isVerifiedPurchase: integer("isVerifiedPurchase", { mode: 'boolean' }).default(false).notNull(),
  helpfulCount: integer("helpfulCount").default(0).notNull(),
  unhelpfulCount: integer("unhelpfulCount").default(0).notNull(),
  status: text("status").default("approved").notNull(),
  sellerResponse: text("sellerResponse"),
  sellerResponseAt: integer("sellerResponseAt", { mode: 'timestamp_ms' }),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// Notifications table
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  relatedId: integer("relatedId"),
  isRead: integer("isRead", { mode: 'boolean' }).default(false),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Disputes table
export const disputes = sqliteTable("disputes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buyerId: integer("buyerId").notNull(),
  sellerId: integer("sellerId").notNull(),
  listingId: integer("listingId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("open").notNull(),
  resolution: text("resolution"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  resolvedAt: integer("resolvedAt", { mode: 'timestamp_ms' }),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

// Admin Logs table
export const adminLogs = sqliteTable("adminLogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminId: integer("adminId").notNull(),
  action: text("action").notNull(),
  targetUserId: integer("targetUserId"),
  targetListingId: integer("targetListingId"),
  targetDisputeId: integer("targetDisputeId"),
  details: text("details"),
  timestamp: integer("timestamp", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;

// Roles table
export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  level: integer("level").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

// Permissions table
export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// Role-Permission mapping table
export const rolePermissions = sqliteTable("role_permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roleId: integer("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: integer("permissionId").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

// User-Role mapping table (for users with multiple roles)
export const userRoles = sqliteTable("user_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
  assignedBy: integer("assignedBy").references(() => users.id),
  assignedAt: integer("assignedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  expiresAt: integer("expiresAt", { mode: 'timestamp_ms' }),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

// Role audit log table
export const roleAuditLogs = sqliteTable("role_audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetUserId: integer("targetUserId").references(() => users.id, { onDelete: "set null" }),
  details: text("details"),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type RoleAuditLog = typeof roleAuditLogs.$inferSelect;
export type InsertRoleAuditLog = typeof roleAuditLogs.$inferInsert;

// Advertisers table for manual ad management
export const advertisers = sqliteTable("advertisers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: text("businessName").notNull(),
  businessUrl: text("businessUrl"),
  contactEmail: text("contactEmail").notNull(),
  contactPhone: text("contactPhone"),
  status: text("status").default("pending").notNull(),
  verificationDocuments: text("verificationDocuments"), // JSON array of document URLs
  accountBalance: real("accountBalance").default(0).notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Advertiser = typeof advertisers.$inferSelect;
export type InsertAdvertiser = typeof advertisers.$inferInsert;

// Manual ads table
export const manualAds = sqliteTable("manual_ads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  advertiserId: integer("advertiserId").notNull().references(() => advertisers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  landingUrl: text("landingUrl").notNull(),
  adType: text("adType").notNull(),
  placement: text("placement").notNull(),
  status: text("status").default("draft").notNull(),
  startDate: integer("startDate", { mode: 'timestamp_ms' }),
  endDate: integer("endDate", { mode: 'timestamp_ms' }),
  dailyBudget: real("dailyBudget").notNull(),
  totalBudget: real("totalBudget").notNull(),
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  costPerImpression: real("costPerImpression").notNull(),
  costPerClick: real("costPerClick").notNull(),
  targetAudience: text("targetAudience"), // JSON object with targeting criteria
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type ManualAd = typeof manualAds.$inferSelect;
export type InsertManualAd = typeof manualAds.$inferInsert;

// Ad analytics table
export const adAnalytics = sqliteTable("ad_analytics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adId: integer("adId").notNull().references(() => manualAds.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  spend: real("spend").default(0).notNull(),
  revenue: real("revenue").default(0).notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type AdAnalytic = typeof adAnalytics.$inferSelect;
export type InsertAdAnalytic = typeof adAnalytics.$inferInsert;

// Google AdSense placements table
export const adsensePlacements = sqliteTable("adsense_placements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slotId: text("slotId").notNull().unique(),
  placement: text("placement").notNull(),
  adFormat: text("adFormat").notNull(),
  status: text("status").default("active").notNull(),
  width: integer("width"),
  height: integer("height"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type AdsensePlacement = typeof adsensePlacements.$inferSelect;
export type InsertAdsensePlacement = typeof adsensePlacements.$inferInsert;

// Ad payments table
export const adPayments = sqliteTable("ad_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  advertiserId: integer("advertiserId").notNull().references(() => advertisers.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  paymentMethod: text("paymentMethod").notNull(),
  transactionId: text("transactionId").unique(),
  status: text("status").default("pending").notNull(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type AdPayment = typeof adPayments.$inferSelect;
export type InsertAdPayment = typeof adPayments.$inferInsert;

// Sponsored ad pricing tiers (admin-configurable)
export const sponsoredAdPricing = sqliteTable("sponsored_ad_pricing", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tier: text("tier").notNull(), // "basic" | "standard" | "premium"
  durationDays: integer("durationDays").notNull(),
  priceNPR: real("priceNPR").notNull(),
  description: text("description"),
  maxSlots: integer("maxSlots").default(10).notNull(),
  isActive: integer("isActive", { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type SponsoredAdPricing = typeof sponsoredAdPricing.$inferSelect;
export type InsertSponsoredAdPricing = typeof sponsoredAdPricing.$inferInsert;

// Promotion requests — sellers request to feature their listings
export const promotionRequests = sqliteTable("promotion_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull(), // "basic" | "standard" | "premium"
  durationDays: integer("durationDays").notNull(),
  priceNPR: real("priceNPR").notNull(),
  status: text("status").default("pending").notNull(), // "pending" | "approved" | "rejected"
  paymentStatus: text("paymentStatus").default("unpaid").notNull(), // "unpaid" | "paid"
  paymentProviderId: text("paymentProviderId"),
  paymentUrl: text("paymentUrl"),
  adminNotes: text("adminNotes"),
  approvedBy: integer("approvedBy"),
  approvedAt: integer("approvedAt", { mode: 'timestamp_ms' }),
  featuredUntil: integer("featuredUntil", { mode: 'timestamp_ms' }),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type PromotionRequest = typeof promotionRequests.$inferSelect;
export type InsertPromotionRequest = typeof promotionRequests.$inferInsert;

// Email notification preferences table
export const emailNotificationPreferences = sqliteTable("email_notification_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  newMessages: integer("newMessages", { mode: 'boolean' }).default(true).notNull(),
  newBids: integer("newBids", { mode: 'boolean' }).default(true).notNull(),
  bookingConfirmation: integer("bookingConfirmation", { mode: 'boolean' }).default(true).notNull(),
  listingApproval: integer("listingApproval", { mode: 'boolean' }).default(true).notNull(),
  listingRejection: integer("listingRejection", { mode: 'boolean' }).default(true).notNull(),
  weeklyDigest: integer("weeklyDigest", { mode: 'boolean' }).default(true).notNull(),
  promotionalEmails: integer("promotionalEmails", { mode: 'boolean' }).default(false).notNull(),
  securityAlerts: integer("securityAlerts", { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type EmailNotificationPreference = typeof emailNotificationPreferences.$inferSelect;
export type InsertEmailNotificationPreference = typeof emailNotificationPreferences.$inferInsert;

// Email notification queue table
export const emailQueue = sqliteTable("email_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientEmail: text("recipientEmail").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  templateData: text("templateData"), // JSON data for template rendering
  status: text("status").default("pending").notNull(),
  attemptCount: integer("attemptCount").default(0).notNull(),
  lastAttemptAt: integer("lastAttemptAt", { mode: 'timestamp_ms' }),
  sentAt: integer("sentAt", { mode: 'timestamp_ms' }),
  errorMessage: text("errorMessage"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type EmailQueueItem = typeof emailQueue.$inferSelect;
export type InsertEmailQueueItem = typeof emailQueue.$inferInsert;

// Email notification logs table
export const emailLogs = sqliteTable("email_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailQueueId: integer("emailQueueId").references(() => emailQueue.id, { onDelete: "cascade" }),
  recipientEmail: text("recipientEmail").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  status: text("status").notNull(),
  openedAt: integer("openedAt", { mode: 'timestamp_ms' }),
  clickedAt: integer("clickedAt", { mode: 'timestamp_ms' }),
  failureReason: text("failureReason"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

// Review helpful votes table
export const reviewHelpfulVotes = sqliteTable("review_helpful_votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reviewId: integer("reviewId").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  isHelpful: integer("isHelpful", { mode: 'boolean' }).notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;
export type InsertReviewHelpfulVote = typeof reviewHelpfulVotes.$inferInsert;

// Review analytics table
export const reviewAnalytics = sqliteTable("review_analytics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalReviews: integer("totalReviews").default(0).notNull(),
  averageRating: real("averageRating").default(0).notNull(),
  fiveStarCount: integer("fiveStarCount").default(0).notNull(),
  fourStarCount: integer("fourStarCount").default(0).notNull(),
  threeStarCount: integer("threeStarCount").default(0).notNull(),
  twoStarCount: integer("twoStarCount").default(0).notNull(),
  oneStarCount: integer("oneStarCount").default(0).notNull(),
  verifiedPurchaseCount: integer("verifiedPurchaseCount").default(0).notNull(),
  lastReviewDate: integer("lastReviewDate", { mode: 'timestamp_ms' }),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type ReviewAnalytic = typeof reviewAnalytics.$inferSelect;
export type InsertReviewAnalytic = typeof reviewAnalytics.$inferInsert;

// Flagged reviews table
export const flaggedReviews = sqliteTable("flagged_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reviewId: integer("reviewId").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  flaggedByUserId: integer("flaggedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(),
  reviewedByAdminId: integer("reviewedByAdminId").references(() => users.id, { onDelete: "set null" }),
  adminNotes: text("adminNotes"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  resolvedAt: integer("resolvedAt", { mode: 'timestamp_ms' }),
});

// Flagged listings table
export const flaggedListings = sqliteTable("flagged_listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
  flaggedByUserId: integer("flaggedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(),
  reviewedByAdminId: integer("reviewedByAdminId").references(() => users.id, { onDelete: "set null" }),
  adminNotes: text("adminNotes"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  resolvedAt: integer("resolvedAt", { mode: 'timestamp_ms' }),
});

export type FlaggedListing = typeof flaggedListings.$inferSelect;
export type InsertFlaggedListing = typeof flaggedListings.$inferInsert;

// Verification Submissions table
export const verificationSubmissions = sqliteTable("verification_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'kyc' or 'kyb'
  data: text("data", { mode: 'json' }).notNull(), // Documents and details
  status: text("status").default("pending").notNull(),
  adminNotes: text("adminNotes"),
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewedAt: integer("reviewedAt", { mode: 'timestamp_ms' }),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type VerificationSubmission = typeof verificationSubmissions.$inferSelect;
export type InsertVerificationSubmission = typeof verificationSubmissions.$inferInsert;

// Transactions table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("orderId"), // Can be booking ID, auction ID, or ad payment ID
  cartId: integer("cartId"), // Added for multi-vendor checkout reference
  buyerId: integer("buyerId").references(() => users.id),
  sellerId: integer("sellerId").references(() => users.id),
  listingId: integer("listingId").references(() => listings.id),
  amount: real("amount").notNull(),
  platformFee: real("platformFee").default(0).notNull(),
  tax: real("tax").default(0).notNull(),
  netAmount: real("netAmount").notNull(),
  currency: text("currency").default("NPR").notNull(),
  status: text("status").default("pending").notNull(), // pending, completed, failed, refunded
  paymentMethod: text("paymentMethod"),
  transactionType: text("transactionType").notNull(), // 'sale', 'rental', 'ad_payment', 'featured_listing'
  trackingNumber: text("trackingNumber"), // Added for logistics webhook tracking
  logisticsPartnerId: integer("logisticsPartnerId"), // Reference to the partner
  deliveryName: text("deliveryName"),
  deliveryAddress: text("deliveryAddress"),
  deliveryPhone: text("deliveryPhone"),
  deliveryEmail: text("deliveryEmail"),
  deliverySpeed: text("deliverySpeed"),
  deliveryFee: real("deliveryFee"),
  estDeliveryDate: text("estDeliveryDate"),
  placedAt: integer("placedAt", { mode: 'timestamp_ms' }),
  processedAt: integer("processedAt", { mode: 'timestamp_ms' }),
  shippedAt: integer("shippedAt", { mode: 'timestamp_ms' }),
  deliveredAt: integer("deliveredAt", { mode: 'timestamp_ms' }),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Carts table
export const carts = sqliteTable("carts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("active").notNull(), // active, checked_out, abandoned
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type Cart = typeof carts.$inferSelect;
export type InsertCart = typeof carts.$inferInsert;

// Cart Items table
export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cartId: integer("cartId").notNull().references(() => carts.id, { onDelete: "cascade" }),
  listingId: integer("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1).notNull(),
  priceAtAddition: real("priceAtAddition"), // Snapshot price when added
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// Logistics Partners table
export const logisticsPartners = sqliteTable("logistics_partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // e.g., 'upaya', 'pathao', 'ncm'
  displayName: text("displayName").notNull(),
  isActive: integer("isActive", { mode: 'boolean' }).default(false).notNull(),
  webhookUrl: text("webhookUrl"),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  trackingUrlFormat: text("trackingUrlFormat"), // e.g., 'https://upaya.com/track/{trackingNumber}'
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type LogisticsPartner = typeof logisticsPartners.$inferSelect;
export type InsertLogisticsPartner = typeof logisticsPartners.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  transactions: many(transactions, { relationName: "buyerTransactions" }),
  sales: many(transactions, { relationName: "sellerTransactions" }),
  verifications: many(verificationSubmissions),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  user: one(users, {
    fields: [listings.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
  }),
  seller: one(users, {
    fields: [transactions.sellerId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [transactions.listingId],
    references: [listings.id],
  }),
  cart: one(carts, {
    fields: [transactions.cartId],
    references: [carts.id],
  }),
  logisticsPartner: one(logisticsPartners, {
    fields: [transactions.logisticsPartnerId],
    references: [logisticsPartners.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
  transactions: many(transactions),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  listing: one(listings, {
    fields: [cartItems.listingId],
    references: [listings.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  listings: many(listings),
}));

// Company config table
export const companyConfigs = sqliteTable("company_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  commissionRate: real("commissionRate").default(0).notNull(), // Platform commission percentage
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type CompanyConfig = typeof companyConfigs.$inferSelect;
export type InsertCompanyConfig = typeof companyConfigs.$inferInsert;

// Payment Gateways configuration table
export const paymentGateways = sqliteTable("payment_gateways", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // e.g. 'esewa', 'khalti', 'fonepay', 'visa'
  displayName: text("displayName").notNull(), // e.g. 'eSewa', 'Khalti'
  isActive: integer("isActive", { mode: 'boolean' }).default(false).notNull(),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  merchantId: text("merchantId"),
  endpoint: text("endpoint"),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type InsertPaymentGateway = typeof paymentGateways.$inferInsert;

// Reports table
export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reporterName: text("reporterName"),
  reporterEmail: text("reporterEmail").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").default("pending").notNull(), // pending, resolved
  adminNotes: text("adminNotes"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  resolvedAt: integer("resolvedAt", { mode: 'timestamp_ms' }),
});

export type ReportTicket = typeof reports.$inferSelect;
export type InsertReportTicket = typeof reports.$inferInsert;

// Careers table
export const careers = sqliteTable("careers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  salaryRange: text("salaryRange").notNull(),
  type: text("type").notNull(), // Full-Time, Part-Time, Hybrid, etc.
  description: text("description").notNull(),
  requirements: text("requirements"), // newline separated
  status: text("status").default("active").notNull(), // active, closed
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type CareerOpening = typeof careers.$inferSelect;
export type InsertCareerOpening = typeof careers.$inferInsert;

// Returns table
export const returns = sqliteTable("returns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transactionId").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  buyerId: integer("buyerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: integer("sellerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description"),
  images: text("images", { mode: 'json' }), // Array of URLs
  status: text("status").default("pending").notNull(), // pending, approved, rejected, refunded
  adminNotes: text("adminNotes"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

export type ReturnRequest = typeof returns.$inferSelect;
export type InsertReturnRequest = typeof returns.$inferInsert;

// Relations for returns
export const returnsRelations = relations(returns, ({ one }) => ({
  transaction: one(transactions, {
    fields: [returns.transactionId],
    references: [transactions.id],
  }),
  buyer: one(users, {
    fields: [returns.buyerId],
    references: [users.id],
  }),
  seller: one(users, {
    fields: [returns.sellerId],
    references: [users.id],
  }),
}));
