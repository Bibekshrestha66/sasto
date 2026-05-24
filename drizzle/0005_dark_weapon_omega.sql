CREATE TABLE `flagged_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` int NOT NULL,
	`flaggedByUserId` int NOT NULL,
	`reason` varchar(100) NOT NULL,
	`description` text,
	`status` enum('pending','reviewed','dismissed','removed') NOT NULL DEFAULT 'pending',
	`reviewedByAdminId` int,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `flagged_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalReviews` int NOT NULL DEFAULT 0,
	`averageRating` decimal(3,2) NOT NULL DEFAULT '0',
	`fiveStarCount` int NOT NULL DEFAULT 0,
	`fourStarCount` int NOT NULL DEFAULT 0,
	`threeStarCount` int NOT NULL DEFAULT 0,
	`twoStarCount` int NOT NULL DEFAULT 0,
	`oneStarCount` int NOT NULL DEFAULT 0,
	`verifiedPurchaseCount` int NOT NULL DEFAULT 0,
	`lastReviewDate` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_helpful_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` int NOT NULL,
	`userId` int NOT NULL,
	`isHelpful` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_helpful_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reviews` ADD `transactionId` int;--> statement-breakpoint
ALTER TABLE `reviews` ADD `title` varchar(255);--> statement-breakpoint
ALTER TABLE `reviews` ADD `isVerifiedPurchase` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `helpfulCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `unhelpfulCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `status` enum('pending','approved','rejected','flagged') DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `sellerResponse` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `sellerResponseAt` timestamp;--> statement-breakpoint
ALTER TABLE `flagged_reviews` ADD CONSTRAINT `flagged_reviews_reviewId_reviews_id_fk` FOREIGN KEY (`reviewId`) REFERENCES `reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flagged_reviews` ADD CONSTRAINT `flagged_reviews_flaggedByUserId_users_id_fk` FOREIGN KEY (`flaggedByUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flagged_reviews` ADD CONSTRAINT `flagged_reviews_reviewedByAdminId_users_id_fk` FOREIGN KEY (`reviewedByAdminId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_analytics` ADD CONSTRAINT `review_analytics_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_helpful_votes` ADD CONSTRAINT `review_helpful_votes_reviewId_reviews_id_fk` FOREIGN KEY (`reviewId`) REFERENCES `reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_helpful_votes` ADD CONSTRAINT `review_helpful_votes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_fromUserId_users_id_fk` FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_toUserId_users_id_fk` FOREIGN KEY (`toUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;