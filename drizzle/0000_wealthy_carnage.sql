CREATE TABLE `ad_analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`adId` integer NOT NULL,
	`date` text NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`conversions` integer DEFAULT 0 NOT NULL,
	`spend` real DEFAULT 0 NOT NULL,
	`revenue` real DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`adId`) REFERENCES `manual_ads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ad_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`advertiserId` integer NOT NULL,
	`amount` real NOT NULL,
	`paymentMethod` text NOT NULL,
	`transactionId` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`description` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`advertiserId`) REFERENCES `advertisers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ad_payments_transactionId_unique` ON `ad_payments` (`transactionId`);--> statement-breakpoint
CREATE TABLE `adminLogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`adminId` integer NOT NULL,
	`action` text NOT NULL,
	`targetUserId` integer,
	`targetListingId` integer,
	`targetDisputeId` integer,
	`details` text,
	`timestamp` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `adsense_placements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slotId` text NOT NULL,
	`placement` text NOT NULL,
	`adFormat` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`width` integer,
	`height` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `adsense_placements_slotId_unique` ON `adsense_placements` (`slotId`);--> statement-breakpoint
CREATE TABLE `advertisers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`businessName` text NOT NULL,
	`businessUrl` text,
	`contactEmail` text NOT NULL,
	`contactPhone` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`verificationDocuments` text,
	`accountBalance` real DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `auctions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listingId` integer NOT NULL,
	`startingPrice` real NOT NULL,
	`currentBid` real,
	`highestBidderId` integer,
	`startTime` integer NOT NULL,
	`endTime` integer NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bids` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`auctionId` integer NOT NULL,
	`bidderId` integer NOT NULL,
	`amount` real NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listingId` integer NOT NULL,
	`userId` integer NOT NULL,
	`startDate` integer NOT NULL,
	`endDate` integer NOT NULL,
	`totalPrice` real NOT NULL,
	`status` text DEFAULT 'pending',
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`parentId` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`buyerId` integer NOT NULL,
	`sellerId` integer NOT NULL,
	`listingId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`resolvedAt` integer,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`emailQueueId` integer,
	`recipientEmail` text NOT NULL,
	`subject` text NOT NULL,
	`template` text NOT NULL,
	`status` text NOT NULL,
	`openedAt` integer,
	`clickedAt` integer,
	`failureReason` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`emailQueueId`) REFERENCES `email_queue`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `email_notification_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`newMessages` integer DEFAULT true NOT NULL,
	`newBids` integer DEFAULT true NOT NULL,
	`bookingConfirmation` integer DEFAULT true NOT NULL,
	`listingApproval` integer DEFAULT true NOT NULL,
	`listingRejection` integer DEFAULT true NOT NULL,
	`weeklyDigest` integer DEFAULT true NOT NULL,
	`promotionalEmails` integer DEFAULT false NOT NULL,
	`securityAlerts` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `email_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`recipientEmail` text NOT NULL,
	`subject` text NOT NULL,
	`template` text NOT NULL,
	`templateData` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`attemptCount` integer DEFAULT 0 NOT NULL,
	`lastAttemptAt` integer,
	`sentAt` integer,
	`errorMessage` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`listingId` integer NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `flagged_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reviewId` integer NOT NULL,
	`flaggedByUserId` integer NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewedByAdminId` integer,
	`adminNotes` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`resolvedAt` integer,
	FOREIGN KEY (`reviewId`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`flaggedByUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedByAdminId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`categoryId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`price` real,
	`images` text,
	`location` text,
	`condition` text,
	`status` text DEFAULT 'active',
	`views` integer DEFAULT 0,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`expiresAt` integer
);
--> statement-breakpoint
CREATE TABLE `manual_ads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`advertiserId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`imageUrl` text NOT NULL,
	`landingUrl` text NOT NULL,
	`adType` text NOT NULL,
	`placement` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`startDate` integer,
	`endDate` integer,
	`dailyBudget` real NOT NULL,
	`totalBudget` real NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`conversions` integer DEFAULT 0 NOT NULL,
	`costPerImpression` real NOT NULL,
	`costPerClick` real NOT NULL,
	`targetAudience` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`advertiserId`) REFERENCES `advertisers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`senderId` integer NOT NULL,
	`recipientId` integer NOT NULL,
	`listingId` integer,
	`content` text NOT NULL,
	`isRead` integer DEFAULT false,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`relatedId` integer,
	`isRead` integer DEFAULT false,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_name_unique` ON `permissions` (`name`);--> statement-breakpoint
CREATE TABLE `review_analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`totalReviews` integer DEFAULT 0 NOT NULL,
	`averageRating` real DEFAULT 0 NOT NULL,
	`fiveStarCount` integer DEFAULT 0 NOT NULL,
	`fourStarCount` integer DEFAULT 0 NOT NULL,
	`threeStarCount` integer DEFAULT 0 NOT NULL,
	`twoStarCount` integer DEFAULT 0 NOT NULL,
	`oneStarCount` integer DEFAULT 0 NOT NULL,
	`verifiedPurchaseCount` integer DEFAULT 0 NOT NULL,
	`lastReviewDate` integer,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `review_helpful_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reviewId` integer NOT NULL,
	`userId` integer NOT NULL,
	`isHelpful` integer NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`reviewId`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fromUserId` integer NOT NULL,
	`toUserId` integer NOT NULL,
	`listingId` integer,
	`transactionId` integer,
	`rating` integer NOT NULL,
	`title` text,
	`comment` text,
	`isVerifiedPurchase` integer DEFAULT false NOT NULL,
	`helpfulCount` integer DEFAULT 0 NOT NULL,
	`unhelpfulCount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`sellerResponse` text,
	`sellerResponseAt` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`toUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `role_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`action` text NOT NULL,
	`targetUserId` integer,
	`details` text,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`roleId` integer NOT NULL,
	`permissionId` integer NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`level` integer NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`roleId` integer NOT NULL,
	`assignedBy` integer,
	`assignedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`expiresAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`phone` text,
	`location` text,
	`bio` text,
	`avatar` text,
	`loginMethod` text,
	`password` text,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`verificationStatus` text DEFAULT 'unverified' NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`lastSignedIn` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`lastLogin` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);