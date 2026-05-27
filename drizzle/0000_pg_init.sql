CREATE TABLE "ad_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"adId" integer NOT NULL,
	"date" text NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"spend" real DEFAULT 0 NOT NULL,
	"revenue" real DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"advertiserId" integer NOT NULL,
	"amount" real NOT NULL,
	"paymentMethod" text NOT NULL,
	"transactionId" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_payments_transactionId_unique" UNIQUE("transactionId")
);
--> statement-breakpoint
CREATE TABLE "adminLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminId" integer NOT NULL,
	"action" text NOT NULL,
	"targetUserId" integer,
	"targetListingId" integer,
	"targetDisputeId" integer,
	"details" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adsense_placements" (
	"id" serial PRIMARY KEY NOT NULL,
	"slotId" text NOT NULL,
	"placement" text NOT NULL,
	"adFormat" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"width" integer,
	"height" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "adsense_placements_slotId_unique" UNIQUE("slotId")
);
--> statement-breakpoint
CREATE TABLE "advertisers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"businessName" text NOT NULL,
	"businessUrl" text,
	"contactEmail" text NOT NULL,
	"contactPhone" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"verificationDocuments" text,
	"accountBalance" real DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auctions" (
	"id" serial PRIMARY KEY NOT NULL,
	"listingId" integer NOT NULL,
	"startingPrice" real NOT NULL,
	"currentBid" real,
	"highestBidderId" integer,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"auctionId" integer NOT NULL,
	"bidderId" integer NOT NULL,
	"amount" real NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"listingId" integer NOT NULL,
	"userId" integer NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"totalPrice" real NOT NULL,
	"status" text DEFAULT 'pending',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "careers" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"location" text NOT NULL,
	"salaryRange" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"cartId" integer NOT NULL,
	"listingId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"priceAtAddition" real,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"parentId" integer,
	"sector" text DEFAULT 'marketplace',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"location" text NOT NULL,
	"commissionRate" real DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyerId" integer NOT NULL,
	"sellerId" integer NOT NULL,
	"listingId" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"emailQueueId" integer,
	"recipientEmail" text NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"status" text NOT NULL,
	"openedAt" timestamp,
	"clickedAt" timestamp,
	"failureReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"newMessages" boolean DEFAULT true NOT NULL,
	"newBids" boolean DEFAULT true NOT NULL,
	"bookingConfirmation" boolean DEFAULT true NOT NULL,
	"listingApproval" boolean DEFAULT true NOT NULL,
	"listingRejection" boolean DEFAULT true NOT NULL,
	"weeklyDigest" boolean DEFAULT true NOT NULL,
	"promotionalEmails" boolean DEFAULT false NOT NULL,
	"securityAlerts" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"recipientEmail" text NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"templateData" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"lastAttemptAt" timestamp,
	"sentAt" timestamp,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"listingId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flagged_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"listingId" integer NOT NULL,
	"flaggedByUserId" integer NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewedByAdminId" integer,
	"adminNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "flagged_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewId" integer NOT NULL,
	"flaggedByUserId" integer NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewedByAdminId" integer,
	"adminNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"categoryId" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"price" real,
	"images" jsonb,
	"location" text,
	"district" text,
	"brand" text,
	"model" text,
	"color" text,
	"condition" text,
	"status" text DEFAULT 'active',
	"views" integer DEFAULT 0,
	"stock" integer DEFAULT 1,
	"isFeatured" boolean DEFAULT false,
	"featuredUntil" timestamp,
	"originalPrice" real,
	"discount" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "logistics_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"displayName" text NOT NULL,
	"isActive" boolean DEFAULT false NOT NULL,
	"webhookUrl" text,
	"apiKey" text,
	"apiSecret" text,
	"trackingUrlFormat" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "logistics_partners_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "manual_ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"advertiserId" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"imageUrl" text NOT NULL,
	"landingUrl" text NOT NULL,
	"adType" text NOT NULL,
	"placement" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"startDate" timestamp,
	"endDate" timestamp,
	"dailyBudget" real NOT NULL,
	"totalBudget" real NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"costPerImpression" real NOT NULL,
	"costPerClick" real NOT NULL,
	"targetAudience" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"senderId" integer NOT NULL,
	"recipientId" integer NOT NULL,
	"listingId" integer,
	"content" text NOT NULL,
	"isRead" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"attachmentUrl" text,
	"attachmentType" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"relatedId" integer,
	"isRead" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_gateways" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"displayName" text NOT NULL,
	"isActive" boolean DEFAULT false NOT NULL,
	"apiKey" text,
	"apiSecret" text,
	"merchantId" text,
	"endpoint" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_gateways_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "promotion_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"listingId" integer NOT NULL,
	"userId" integer NOT NULL,
	"tier" text NOT NULL,
	"durationDays" integer NOT NULL,
	"priceNPR" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paymentStatus" text DEFAULT 'unpaid' NOT NULL,
	"paymentProviderId" text,
	"paymentUrl" text,
	"adminNotes" text,
	"approvedBy" integer,
	"approvedAt" timestamp,
	"featuredUntil" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporterName" text,
	"reporterEmail" text NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"adminNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"transactionId" integer NOT NULL,
	"buyerId" integer NOT NULL,
	"sellerId" integer NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"images" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"adminNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"totalReviews" integer DEFAULT 0 NOT NULL,
	"averageRating" real DEFAULT 0 NOT NULL,
	"fiveStarCount" integer DEFAULT 0 NOT NULL,
	"fourStarCount" integer DEFAULT 0 NOT NULL,
	"threeStarCount" integer DEFAULT 0 NOT NULL,
	"twoStarCount" integer DEFAULT 0 NOT NULL,
	"oneStarCount" integer DEFAULT 0 NOT NULL,
	"verifiedPurchaseCount" integer DEFAULT 0 NOT NULL,
	"lastReviewDate" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_helpful_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewId" integer NOT NULL,
	"userId" integer NOT NULL,
	"isHelpful" boolean NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"fromUserId" integer NOT NULL,
	"toUserId" integer NOT NULL,
	"listingId" integer,
	"transactionId" integer,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"isVerifiedPurchase" boolean DEFAULT false NOT NULL,
	"helpfulCount" integer DEFAULT 0 NOT NULL,
	"unhelpfulCount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'approved' NOT NULL,
	"sellerResponse" text,
	"sellerResponseAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"action" text NOT NULL,
	"targetUserId" integer,
	"details" text,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"roleId" integer NOT NULL,
	"permissionId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"level" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sponsored_ad_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier" text NOT NULL,
	"durationDays" integer NOT NULL,
	"priceNPR" real NOT NULL,
	"description" text,
	"maxSlots" integer DEFAULT 10 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" text,
	"cartId" integer,
	"buyerId" integer,
	"sellerId" integer,
	"listingId" integer,
	"amount" real NOT NULL,
	"platformFee" real DEFAULT 0 NOT NULL,
	"tax" real DEFAULT 0 NOT NULL,
	"netAmount" real NOT NULL,
	"currency" text DEFAULT 'NPR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paymentMethod" text,
	"transactionType" text NOT NULL,
	"trackingNumber" text,
	"logisticsPartnerId" integer,
	"deliveryName" text,
	"deliveryAddress" text,
	"deliveryPhone" text,
	"deliveryEmail" text,
	"deliverySpeed" text,
	"deliveryFee" real,
	"estDeliveryDate" text,
	"placedAt" timestamp,
	"processedAt" timestamp,
	"shippedAt" timestamp,
	"deliveredAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"roleId" integer NOT NULL,
	"assignedBy" integer,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" text NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"location" text,
	"bio" text,
	"avatar" text,
	"loginMethod" text,
	"password" text,
	"role" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"verificationStatus" text DEFAULT 'unverified' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"lastLogin" timestamp,
	"isVerified" boolean DEFAULT false NOT NULL,
	"verificationLevel" text DEFAULT 'basic' NOT NULL,
	"resetToken" text,
	"resetTokenExpires" timestamp,
	"businessName" text,
	"businessLicense" text,
	"experienceYears" integer,
	"specialties" text,
	"socialLinks" text,
	"bannerImage" text,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "verification_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" text NOT NULL,
	"data" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"adminNotes" text,
	"reviewedBy" integer,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_analytics" ADD CONSTRAINT "ad_analytics_adId_manual_ads_id_fk" FOREIGN KEY ("adId") REFERENCES "public"."manual_ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_payments" ADD CONSTRAINT "ad_payments_advertiserId_advertisers_id_fk" FOREIGN KEY ("advertiserId") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertisers" ADD CONSTRAINT "advertisers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_carts_id_fk" FOREIGN KEY ("cartId") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_emailQueueId_email_queue_id_fk" FOREIGN KEY ("emailQueueId") REFERENCES "public"."email_queue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notification_preferences" ADD CONSTRAINT "email_notification_preferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_listings" ADD CONSTRAINT "flagged_listings_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_listings" ADD CONSTRAINT "flagged_listings_flaggedByUserId_users_id_fk" FOREIGN KEY ("flaggedByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_listings" ADD CONSTRAINT "flagged_listings_reviewedByAdminId_users_id_fk" FOREIGN KEY ("reviewedByAdminId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_reviews" ADD CONSTRAINT "flagged_reviews_reviewId_reviews_id_fk" FOREIGN KEY ("reviewId") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_reviews" ADD CONSTRAINT "flagged_reviews_flaggedByUserId_users_id_fk" FOREIGN KEY ("flaggedByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_reviews" ADD CONSTRAINT "flagged_reviews_reviewedByAdminId_users_id_fk" FOREIGN KEY ("reviewedByAdminId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_ads" ADD CONSTRAINT "manual_ads_advertiserId_advertisers_id_fk" FOREIGN KEY ("advertiserId") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_requests" ADD CONSTRAINT "promotion_requests_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_requests" ADD CONSTRAINT "promotion_requests_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_transactionId_transactions_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_buyerId_users_id_fk" FOREIGN KEY ("buyerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_sellerId_users_id_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_analytics" ADD CONSTRAINT "review_analytics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_reviewId_reviews_id_fk" FOREIGN KEY ("reviewId") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_fromUserId_users_id_fk" FOREIGN KEY ("fromUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_toUserId_users_id_fk" FOREIGN KEY ("toUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_audit_logs" ADD CONSTRAINT "role_audit_logs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_audit_logs" ADD CONSTRAINT "role_audit_logs_targetUserId_users_id_fk" FOREIGN KEY ("targetUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_permissions_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyerId_users_id_fk" FOREIGN KEY ("buyerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sellerId_users_id_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assignedBy_users_id_fk" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_submissions" ADD CONSTRAINT "verification_submissions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_submissions" ADD CONSTRAINT "verification_submissions_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;