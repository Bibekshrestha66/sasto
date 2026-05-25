import { z } from "zod";
import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";

import {
  submitReview,
  getReviewById,
  getUserReceivedReviews,
  getUserGivenReviews,
  updateReviewStatus,
  addSellerResponse,
  markReviewHelpful,
  flagReview,
  getFlaggedReviews,
  resolveFlaggedReview,
  getUserReviewAnalytics,
  deleteReview,
} from "../db";

export const reviewsRouter = router({
  // Submit a new review
  submit: protectedProcedure
    .input(z.object({
      toUserId: z.number(),
      listingId: z.number().optional(),
      transactionId: z.number().optional(),
      rating: z.number().min(1).max(5),
      title: z.string().max(255).optional(),
      comment: z.string().max(5000).optional(),
      isVerifiedPurchase: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      return submitReview(ctx.user.id, input.toUserId, {
        listingId: input.listingId,
        transactionId: input.transactionId,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        isVerifiedPurchase: input.isVerifiedPurchase,
      });
    }),

  // Get reviews received by a user
  getReceivedReviews: publicProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return getUserReceivedReviews(input.userId, input.limit, input.offset);
    }),

  // Get reviews given by a user
  getGivenReviews: publicProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return getUserGivenReviews(input.userId, input.limit, input.offset);
    }),

  // Get a specific review
  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return getReviewById(input);
    }),

  // Get user's review analytics
  getAnalytics: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return getUserReviewAnalytics(input);
    }),

  // Add seller response to a review
  addResponse: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      response: z.string().max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      const review = await getReviewById(input.reviewId);
      if (!review) throw new Error("Review not found");

      // Only the seller (toUserId) can respond
      if (review.toUserId !== ctx.user.id) {
        throw new Error("Only the seller can respond to reviews");
      }

      return addSellerResponse(input.reviewId, input.response);
    }),

  // Mark review as helpful/unhelpful
  markHelpful: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      isHelpful: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      return markReviewHelpful(input.reviewId, ctx.user.id, input.isHelpful);
    }),

  // Flag a review for moderation
  flag: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      reason: z.enum(["inappropriate", "spam", "fake", "offensive"]),
      description: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      return flagReview(input.reviewId, ctx.user.id, input.reason, input.description);
    }),

  // Get flagged reviews (admin only)
  getFlaggedReviews: adminProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return getFlaggedReviews(input.limit, input.offset);
    }),

  // Resolve flagged review (admin only)
  resolveFlagged: adminProcedure
    .input(z.object({
      flaggedReviewId: z.number(),
      status: z.enum(["dismissed", "removed"]),
      adminNotes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      return resolveFlaggedReview(
        input.flaggedReviewId,
        ctx.user.id,
        input.status,
        input.adminNotes
      );
    }),

  // Delete a review (owner or admin)
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      const review = await getReviewById(input);
      if (!review) throw new Error("Review not found");

      // Only the review author or admin can delete
      if (review.fromUserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Not authorized to delete this review");
      }

      return deleteReview(input);
    }),

  // Approve review (admin only)
  approve: adminProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return updateReviewStatus(input, "approved");
    }),

  // Reject review (admin only)
  reject: adminProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return updateReviewStatus(input, "rejected");
    }),

  // Aliases for backward compatibility
  getUserReviews: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return getUserReceivedReviews(input);
    }),
    
  create: protectedProcedure
    .input(z.object({
      toUserId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      listingId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return submitReview(ctx.user.id, input.toUserId, {
        listingId: input.listingId,
        rating: input.rating,
        comment: input.comment,
      });
    }),
});
