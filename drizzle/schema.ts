import { pgTable, text, integer, real, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
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
  specialties: text("specialties"), // Comma separated list of categories
  socialLinks: text("socialLinks"), // JSON string
  bannerImage: text("bannerImage"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  parentId: integer("parentId"),
  sector: text("sector").default("marketplace"), // marketplace, auction, rental, all
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Listings table
export const listings = pgTable("listings", {
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
  length: real("length"), // Logistics: Length in cm
  width: real("width"),   // Logistics: Width in cm
  height: real("height"), // Logistics: Height in cm
  weight: real("weight"), // Logistics: Weight in kg
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

// Auction listings (extends listings)
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  listingId: integer("listingId").notNull(),
  startingPrice: real("startingPrice").notNull(),
  currentBid: real("currentBid"),
  highestBidderId: integer("highestBidderId"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = typeof auctions.$inferInsert;

// Bids table
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auctionId").notNull(),
  bidderId: integer("bidderId").notNull(),
  amount: real("amount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

// Rental bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  listingId: integer("listingId").notNull(),
  userId: integer("userId").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  totalPrice: real("totalPrice").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// Favorites/Watchlist table
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  listingId: integer("listingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("senderId").notNull(),
  recipientId: integer("recipientId").notNull(),
  listingId: integer("listingId"),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentType: text("attachmentType"),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Reviews table
export const reviews = pgTable("reviews", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  relatedId: integer("relatedId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Disputes table
export const disputes = pgTable("disputes", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

// Admin Logs table
export const adminLogs = pgTable("adminLogs", {
  id: serial("id").primaryKey(),
  adminId: integer("adminId").notNull(),
  action: text("action").notNull(),
  targetUserId: integer("targetUserId"),
  targetListingId: integer("targetListingId"),
  targetDisputeId: integer("targetDisputeId"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;

// Roles table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  level: integer("level").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

// Permissions table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// Role-Permission mapping table
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: integer("permissionId").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

// User-Role mapping table (for users with multiple roles)
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
  assignedBy: integer("assignedBy").references(() => users.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

// Role audit log table
export const roleAuditLogs = pgTable("role_audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetUserId: integer("targetUserId").references(() => users.id, { onDelete: "set null" }),
  details: text("details"),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoleAuditLog = typeof roleAuditLogs.$inferSelect;
export type InsertRoleAuditLog = typeof roleAuditLogs.$inferInsert;

// Advertisers table for manual ad management
export const advertisers = pgTable("advertisers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: text("businessName").notNull(),
  businessUrl: text("businessUrl"),
  contactEmail: text("contactEmail").notNull(),
  contactPhone: text("contactPhone"),
  status: text("status").default("pending").notNull(),
  verificationDocuments: text("verificationDocuments"), // JSON array of document URLs
  accountBalance: real("accountBalance").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Advertiser = typeof advertisers.$inferSelect;
export type InsertAdvertiser = typeof advertisers.$inferInsert;

// Manual ads table
export const manualAds = pgTable("manual_ads", {
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
  targetAudience: text("targetAudience"), // JSON object with targeting criteria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ManualAd = typeof manualAds.$inferSelect;
export type InsertManualAd = typeof manualAds.$inferInsert;

// Ad analytics table
export const adAnalytics = pgTable("ad_analytics", {
  id: serial("id").primaryKey(),
  adId: integer("adId").notNull().references(() => manualAds.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  spend: real("spend").default(0).notNull(),
  revenue: real("revenue").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdAnalytic = typeof adAnalytics.$inferSelect;
export type InsertAdAnalytic = typeof adAnalytics.$inferInsert;

// Google AdSense placements table
export const adsensePlacements = pgTable("adsense_placements", {
  id: serial("id").primaryKey(),
  slotId: text("slotId").notNull().unique(),
  placement: text("placement").notNull(),
  adFormat: text("adFormat").notNull(),
  status: text("status").default("active").notNull(),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AdsensePlacement = typeof adsensePlacements.$inferSelect;
export type InsertAdsensePlacement = typeof adsensePlacements.$inferInsert;

// Ad payments table
export const adPayments = pgTable("ad_payments", {
  id: serial("id").primaryKey(),
  advertiserId: integer("advertiserId").notNull().references(() => advertisers.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  paymentMethod: text("paymentMethod").notNull(),
  transactionId: text("transactionId").unique(),
  status: text("status").default("pending").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AdPayment = typeof adPayments.$inferSelect;
export type InsertAdPayment = typeof adPayments.$inferInsert;

// Sponsored ad pricing tiers (admin-configurable)
export const sponsoredAdPricing = pgTable("sponsored_ad_pricing", {
  id: serial("id").primaryKey(),
  tier: text("tier").notNull(), // "basic" | "standard" | "premium"
  durationDays: integer("durationDays").notNull(),
  priceNPR: real("priceNPR").notNull(),
  description: text("description"),
  maxSlots: integer("maxSlots").default(10).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SponsoredAdPricing = typeof sponsoredAdPricing.$inferSelect;
export type InsertSponsoredAdPricing = typeof sponsoredAdPricing.$inferInsert;

// Promotion requests — sellers request to feature their listings
export const promotionRequests = pgTable("promotion_requests", {
  id: serial("id").primaryKey(),
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
  approvedAt: timestamp("approvedAt"),
  featuredUntil: timestamp("featuredUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PromotionRequest = typeof promotionRequests.$inferSelect;
export type InsertPromotionRequest = typeof promotionRequests.$inferInsert;

// Email notification preferences table
export const emailNotificationPreferences = pgTable("email_notification_preferences", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailNotificationPreference = typeof emailNotificationPreferences.$inferSelect;
export type InsertEmailNotificationPreference = typeof emailNotificationPreferences.$inferInsert;

// Email notification queue table
export const emailQueue = pgTable("email_queue", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientEmail: text("recipientEmail").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  templateData: text("templateData"), // JSON data for template rendering
  status: text("status").default("pending").notNull(),
  attemptCount: integer("attemptCount").default(0).notNull(),
  lastAttemptAt: timestamp("lastAttemptAt"),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailQueueItem = typeof emailQueue.$inferSelect;
export type InsertEmailQueueItem = typeof emailQueue.$inferInsert;

// Email notification logs table
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  emailQueueId: integer("emailQueueId").references(() => emailQueue.id, { onDelete: "cascade" }),
  recipientEmail: text("recipientEmail").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  status: text("status").notNull(),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

// Review helpful votes table
export const reviewHelpfulVotes = pgTable("review_helpful_votes", {
  id: serial("id").primaryKey(),
  reviewId: integer("reviewId").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  isHelpful: boolean("isHelpful").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;
export type InsertReviewHelpfulVote = typeof reviewHelpfulVotes.$inferInsert;

// Review analytics table
export const reviewAnalytics = pgTable("review_analytics", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReviewAnalytic = typeof reviewAnalytics.$inferSelect;
export type InsertReviewAnalytic = typeof reviewAnalytics.$inferInsert;

// Flagged reviews table
export const flaggedReviews = pgTable("flagged_reviews", {
  id: serial("id").primaryKey(),
  reviewId: integer("reviewId").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  flaggedByUserId: integer("flaggedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(),
  reviewedByAdminId: integer("reviewedByAdminId").references(() => users.id, { onDelete: "set null" }),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

// Flagged listings table
export const flaggedListings = pgTable("flagged_listings", {
  id: serial("id").primaryKey(),
  listingId: integer("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
  flaggedByUserId: integer("flaggedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(),
  reviewedByAdminId: integer("reviewedByAdminId").references(() => users.id, { onDelete: "set null" }),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type FlaggedListing = typeof flaggedListings.$inferSelect;
export type InsertFlaggedListing = typeof flaggedListings.$inferInsert;

// Verification Submissions table
export const verificationSubmissions = pgTable("verification_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'kyc' or 'kyb'
  data: jsonb("data").notNull(), // Documents and details
  status: text("status").default("pending").notNull(),
  adminNotes: text("adminNotes"),
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VerificationSubmission = typeof verificationSubmissions.$inferSelect;
export type InsertVerificationSubmission = typeof verificationSubmissions.$inferInsert;

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
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
  placedAt: timestamp("placedAt"),
  processedAt: timestamp("processedAt"),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Carts table
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("active").notNull(), // active, checked_out, abandoned
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Cart = typeof carts.$inferSelect;
export type InsertCart = typeof carts.$inferInsert;

// Cart Items table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cartId").notNull().references(() => carts.id, { onDelete: "cascade" }),
  listingId: integer("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1).notNull(),
  priceAtAddition: real("priceAtAddition"), // Snapshot price when added
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// Logistics Partners table
export const logisticsPartners = pgTable("logistics_partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'upaya', 'pathao', 'ncm'
  displayName: text("displayName").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  webhookUrl: text("webhookUrl"),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  trackingUrlFormat: text("trackingUrlFormat"), // e.g., 'https://upaya.com/track/{trackingNumber}'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LogisticsPartner = typeof logisticsPartners.$inferSelect;
export type InsertLogisticsPartner = typeof logisticsPartners.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  transactions: many(transactions, { relationName: "buyerTransactions" }),
  sales: many(transactions, { relationName: "sellerTransactions" }),
  verifications: many(verificationSubmissions),
  reviewsWritten: many(reviews, { relationName: "writtenReviews" }),
  reviewsReceived: many(reviews, { relationName: "receivedReviews" }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  fromUser: one(users, {
    fields: [reviews.fromUserId],
    references: [users.id],
    relationName: "writtenReviews",
  }),
  toUser: one(users, {
    fields: [reviews.toUserId],
    references: [users.id],
    relationName: "receivedReviews",
  }),
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
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
export const companyConfigs = pgTable("company_configs", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  commissionRate: real("commissionRate").default(0).notNull(), // Platform commission percentage
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CompanyConfig = typeof companyConfigs.$inferSelect;
export type InsertCompanyConfig = typeof companyConfigs.$inferInsert;

// Payment Gateways configuration table
export const paymentGateways = pgTable("payment_gateways", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. 'esewa', 'khalti', 'fonepay', 'visa'
  displayName: text("displayName").notNull(), // e.g. 'eSewa', 'Khalti'
  isActive: boolean("isActive").default(false).notNull(),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  merchantId: text("merchantId"),
  endpoint: text("endpoint"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type InsertPaymentGateway = typeof paymentGateways.$inferInsert;

// Reports table
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterName: text("reporterName"),
  reporterEmail: text("reporterEmail").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").default("pending").notNull(), // pending, resolved
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type ReportTicket = typeof reports.$inferSelect;
export type InsertReportTicket = typeof reports.$inferInsert;

// Careers table
export const careers = pgTable("careers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  salaryRange: text("salaryRange").notNull(),
  type: text("type").notNull(), // Full-Time, Part-Time, Hybrid, etc.
  description: text("description").notNull(),
  requirements: text("requirements"), // newline separated
  status: text("status").default("active").notNull(), // active, closed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CareerOpening = typeof careers.$inferSelect;
export type InsertCareerOpening = typeof careers.$inferInsert;

// Returns table
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  transactionId: integer("transactionId").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  buyerId: integer("buyerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: integer("sellerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description"),
  images: jsonb("images"), // Array of URLs
  status: text("status").default("pending").notNull(), // pending, approved, rejected, refunded
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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

export const auctionsRelations = relations(auctions, ({ one, many }) => ({
  listing: one(listings, {
    fields: [auctions.listingId],
    references: [listings.id],
  }),
  highestBidder: one(users, {
    fields: [auctions.highestBidderId],
    references: [users.id],
  }),
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  auction: one(auctions, {
    fields: [bids.auctionId],
    references: [auctions.id],
  }),
  bidder: one(users, {
    fields: [bids.bidderId],
    references: [users.id],
  }),
}));
