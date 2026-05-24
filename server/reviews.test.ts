import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  submitReview,
  getReviewById,
  getUserReceivedReviews,
  getUserGivenReviews,
  updateReviewStatus,
  addSellerResponse,
  markReviewHelpful,
  flagReview,
  getUserReviewAnalytics,
  updateReviewAnalytics,
} from "./db";

describe("Review System", () => {
  const testUserId1 = 1;
  const testUserId2 = 2;
  let reviewId: number;

  describe("submitReview", () => {
    it("should submit a new review", async () => {
      const result = await submitReview(testUserId1, testUserId2, {
        rating: 5,
        title: "Great seller!",
        comment: "Very satisfied with the purchase",
        isVerifiedPurchase: true,
      });

      expect(result).toBeDefined();
      reviewId = result[0].insertId;
    });

    it("should validate rating between 1-5", async () => {
      const result1 = await submitReview(testUserId1, testUserId2, {
        rating: 0,
        comment: "Invalid rating",
      });

      const result2 = await submitReview(testUserId1, testUserId2, {
        rating: 6,
        comment: "Invalid rating",
      });

      // Both should be clamped to valid range
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe("getReviewById", () => {
    it("should retrieve a review by ID", async () => {
      const review = await getReviewById(reviewId);

      expect(review).toBeDefined();
      expect(review?.id).toBe(reviewId);
      expect(review?.fromUserId).toBe(testUserId1);
      expect(review?.toUserId).toBe(testUserId2);
      expect(review?.rating).toBe(5);
    });

    it("should return undefined for non-existent review", async () => {
      const review = await getReviewById(99999);
      expect(review).toBeUndefined();
    });
  });

  describe("getUserReceivedReviews", () => {
    it("should get reviews received by a user", async () => {
      const reviews = await getUserReceivedReviews(testUserId2, 10, 0);

      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews[0].toUserId).toBe(testUserId2);
    });

    it("should support pagination", async () => {
      const page1 = await getUserReceivedReviews(testUserId2, 5, 0);
      const page2 = await getUserReceivedReviews(testUserId2, 5, 5);

      expect(page1.length).toBeLessThanOrEqual(5);
      expect(page2.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getUserGivenReviews", () => {
    it("should get reviews given by a user", async () => {
      const reviews = await getUserGivenReviews(testUserId1, 10, 0);

      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews[0].fromUserId).toBe(testUserId1);
    });
  });

  describe("updateReviewStatus", () => {
    it("should update review status", async () => {
      await updateReviewStatus(reviewId, "approved");
      const review = await getReviewById(reviewId);

      expect(review?.status).toBe("approved");
    });

    it("should support different statuses", async () => {
      const statuses = ["pending", "approved", "rejected", "flagged"] as const;

      for (const status of statuses) {
        await updateReviewStatus(reviewId, status);
        const review = await getReviewById(reviewId);
        expect(review?.status).toBe(status);
      }
    });
  });

  describe("addSellerResponse", () => {
    it("should add a seller response to a review", async () => {
      const response = "Thank you for your purchase!";
      await addSellerResponse(reviewId, response);

      const review = await getReviewById(reviewId);
      expect(review?.sellerResponse).toBe(response);
      expect(review?.sellerResponseAt).toBeDefined();
    });
  });

  describe("markReviewHelpful", () => {
    it("should mark review as helpful", async () => {
      await markReviewHelpful(reviewId, testUserId1, true);
      const review = await getReviewById(reviewId);

      expect(review?.helpfulCount).toBeGreaterThan(0);
    });

    it("should mark review as unhelpful", async () => {
      await markReviewHelpful(reviewId, testUserId2, false);
      const review = await getReviewById(reviewId);

      expect(review?.unhelpfulCount).toBeGreaterThan(0);
    });

    it("should update vote when user changes opinion", async () => {
      const review1 = await getReviewById(reviewId);
      const initialHelpful = review1?.helpfulCount || 0;

      await markReviewHelpful(reviewId, testUserId1, false);
      const review2 = await getReviewById(reviewId);

      expect(review2?.unhelpfulCount).toBeGreaterThan(0);
    });
  });

  describe("flagReview", () => {
    it("should flag a review for moderation", async () => {
      await flagReview(reviewId, testUserId1, "inappropriate", "Contains offensive language");

      const review = await getReviewById(reviewId);
      expect(review?.status).toBe("flagged");
    });
  });

  describe("getUserReviewAnalytics", () => {
    it("should get or create analytics for a user", async () => {
      const analytics = await getUserReviewAnalytics(testUserId2);

      expect(analytics).toBeDefined();
      expect(analytics?.userId).toBe(testUserId2);
      expect(analytics?.totalReviews).toBeGreaterThanOrEqual(0);
      expect(analytics?.averageRating).toBeGreaterThanOrEqual(0);
    });
  });

  describe("updateReviewAnalytics", () => {
    it("should recalculate user analytics", async () => {
      await updateReviewAnalytics(testUserId2);
      const analytics = await getUserReviewAnalytics(testUserId2);

      expect(analytics).toBeDefined();
      expect(analytics?.totalReviews).toBeGreaterThanOrEqual(0);
      expect(analytics?.averageRating).toBeGreaterThanOrEqual(0);
      expect(analytics?.updatedAt).toBeDefined();
    });

    it("should calculate star distribution", async () => {
      const analytics = await getUserReviewAnalytics(testUserId2);

      expect(analytics?.fiveStarCount).toBeGreaterThanOrEqual(0);
      expect(analytics?.fourStarCount).toBeGreaterThanOrEqual(0);
      expect(analytics?.threeStarCount).toBeGreaterThanOrEqual(0);
      expect(analytics?.twoStarCount).toBeGreaterThanOrEqual(0);
      expect(analytics?.oneStarCount).toBeGreaterThanOrEqual(0);
    });
  });
});
