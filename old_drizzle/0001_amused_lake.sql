CREATE TABLE `careers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`department` text NOT NULL,
	`location` text NOT NULL,
	`salaryRange` text NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`requirements` text,
	`status` text DEFAULT 'active' NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cartId` integer NOT NULL,
	`listingId` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`priceAtAddition` real,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`cartId`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `company_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`location` text NOT NULL,
	`commissionRate` real DEFAULT 0 NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `flagged_listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listingId` integer NOT NULL,
	`flaggedByUserId` integer NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewedByAdminId` integer,
	`adminNotes` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`resolvedAt` integer,
	FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`flaggedByUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedByAdminId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `logistics_partners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`displayName` text NOT NULL,
	`isActive` integer DEFAULT false NOT NULL,
	`webhookUrl` text,
	`apiKey` text,
	`apiSecret` text,
	`trackingUrlFormat` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `logistics_partners_name_unique` ON `logistics_partners` (`name`);--> statement-breakpoint
CREATE TABLE `payment_gateways` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`displayName` text NOT NULL,
	`isActive` integer DEFAULT false NOT NULL,
	`apiKey` text,
	`apiSecret` text,
	`merchantId` text,
	`endpoint` text,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_gateways_name_unique` ON `payment_gateways` (`name`);--> statement-breakpoint
CREATE TABLE `promotion_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listingId` integer NOT NULL,
	`userId` integer NOT NULL,
	`tier` text NOT NULL,
	`durationDays` integer NOT NULL,
	`priceNPR` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paymentStatus` text DEFAULT 'unpaid' NOT NULL,
	`paymentProviderId` text,
	`paymentUrl` text,
	`adminNotes` text,
	`approvedBy` integer,
	`approvedAt` integer,
	`featuredUntil` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reporterName` text,
	`reporterEmail` text NOT NULL,
	`subject` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`adminNotes` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`resolvedAt` integer
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transactionId` integer NOT NULL,
	`buyerId` integer NOT NULL,
	`sellerId` integer NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`images` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`adminNotes` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sponsored_ad_pricing` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tier` text NOT NULL,
	`durationDays` integer NOT NULL,
	`priceNPR` real NOT NULL,
	`description` text,
	`maxSlots` integer DEFAULT 10 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`orderId` text,
	`cartId` integer,
	`buyerId` integer,
	`sellerId` integer,
	`listingId` integer,
	`amount` real NOT NULL,
	`platformFee` real DEFAULT 0 NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`netAmount` real NOT NULL,
	`currency` text DEFAULT 'NPR' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paymentMethod` text,
	`transactionType` text NOT NULL,
	`trackingNumber` text,
	`logisticsPartnerId` integer,
	`deliveryName` text,
	`deliveryAddress` text,
	`deliveryPhone` text,
	`deliveryEmail` text,
	`deliverySpeed` text,
	`deliveryFee` real,
	`estDeliveryDate` text,
	`placedAt` integer,
	`processedAt` integer,
	`shippedAt` integer,
	`deliveredAt` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `verification_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`type` text NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`adminNotes` text,
	`reviewedBy` integer,
	`reviewedAt` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `sector` text DEFAULT 'marketplace';--> statement-breakpoint
ALTER TABLE `listings` ADD `district` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `brand` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `model` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `color` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `stock` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `listings` ADD `isFeatured` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `listings` ADD `featuredUntil` integer;--> statement-breakpoint
ALTER TABLE `listings` ADD `originalPrice` real;--> statement-breakpoint
ALTER TABLE `listings` ADD `discount` integer;--> statement-breakpoint
ALTER TABLE `listings` DROP COLUMN `videoUrl`;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentUrl` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentType` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isVerified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationLevel` text DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpires` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `businessName` text;--> statement-breakpoint
ALTER TABLE `users` ADD `businessLicense` text;--> statement-breakpoint
ALTER TABLE `users` ADD `experienceYears` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `specialties` text;--> statement-breakpoint
ALTER TABLE `users` ADD `socialLinks` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bannerImage` text;