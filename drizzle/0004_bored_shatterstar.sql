CREATE TABLE `ad_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adId` int NOT NULL,
	`date` date NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`spend` decimal(10,2) NOT NULL DEFAULT '0',
	`revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`advertiserId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('stripe','bank_transfer','paypal','wallet') NOT NULL,
	`transactionId` varchar(255),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `ad_payments_transactionId_unique` UNIQUE(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `adsense_placements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slotId` varchar(100) NOT NULL,
	`placement` varchar(100) NOT NULL,
	`adFormat` enum('responsive','fixed_size','link_ads','native') NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`width` int,
	`height` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adsense_placements_id` PRIMARY KEY(`id`),
	CONSTRAINT `adsense_placements_slotId_unique` UNIQUE(`slotId`)
);
--> statement-breakpoint
CREATE TABLE `advertisers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`businessUrl` text,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`verificationDocuments` text,
	`accountBalance` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advertisers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailQueueId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`template` varchar(100) NOT NULL,
	`status` enum('sent','failed','bounced','opened','clicked') NOT NULL,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newMessages` boolean NOT NULL DEFAULT true,
	`newBids` boolean NOT NULL DEFAULT true,
	`bookingConfirmation` boolean NOT NULL DEFAULT true,
	`listingApproval` boolean NOT NULL DEFAULT true,
	`listingRejection` boolean NOT NULL DEFAULT true,
	`weeklyDigest` boolean NOT NULL DEFAULT true,
	`promotionalEmails` boolean NOT NULL DEFAULT false,
	`securityAlerts` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_notification_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`template` varchar(100) NOT NULL,
	`templateData` text,
	`status` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastAttemptAt` timestamp,
	`sentAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manual_ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`advertiserId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text NOT NULL,
	`landingUrl` text NOT NULL,
	`adType` enum('banner','sidebar','featured','popup') NOT NULL,
	`placement` enum('homepage_top','homepage_middle','homepage_bottom','sidebar_left','sidebar_right','category_page','listing_detail','search_results') NOT NULL,
	`status` enum('draft','pending','approved','active','paused','rejected','expired') NOT NULL DEFAULT 'draft',
	`startDate` timestamp,
	`endDate` timestamp,
	`dailyBudget` decimal(10,2) NOT NULL,
	`totalBudget` decimal(10,2) NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`costPerImpression` decimal(10,4) NOT NULL,
	`costPerClick` decimal(10,4) NOT NULL,
	`targetAudience` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manual_ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ad_analytics` ADD CONSTRAINT `ad_analytics_adId_manual_ads_id_fk` FOREIGN KEY (`adId`) REFERENCES `manual_ads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ad_payments` ADD CONSTRAINT `ad_payments_advertiserId_advertisers_id_fk` FOREIGN KEY (`advertiserId`) REFERENCES `advertisers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `advertisers` ADD CONSTRAINT `advertisers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_logs` ADD CONSTRAINT `email_logs_emailQueueId_email_queue_id_fk` FOREIGN KEY (`emailQueueId`) REFERENCES `email_queue`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_notification_preferences` ADD CONSTRAINT `email_notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_queue` ADD CONSTRAINT `email_queue_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manual_ads` ADD CONSTRAINT `manual_ads_advertiserId_advertisers_id_fk` FOREIGN KEY (`advertiserId`) REFERENCES `advertisers`(`id`) ON DELETE cascade ON UPDATE no action;