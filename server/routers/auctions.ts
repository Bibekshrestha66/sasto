import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../_core/trpc";
import { getAuctionById, getAuctionByListingId, getBidsForAuction } from "../db";
import { getDb } from "../db";
import { auctions, bids } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getWebSocketManager } from "../websocket";

export const auctionsRouter = {
  list: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db.query.auctions.findMany({
        limit: input.limit,
        orderBy: (auctions, { desc }) => [desc(auctions.createdAt)],
      });
    }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return getAuctionById(input);
    }),

  getByListingId: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return getAuctionByListingId(input);
    }),

  getBids: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return getBidsForAuction(input);
    }),

  placeBid: protectedProcedure
    .input(z.object({
      auctionId: z.number(),
      amount: z.number().min(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get auction details
      const auction = await getAuctionById(input.auctionId);
      if (!auction) throw new Error("Auction not found");

      // Validate bid amount
      const currentBid = auction.currentBid || auction.startingPrice;
      if (input.amount <= currentBid) {
        throw new Error("Bid must be higher than current bid");
      }

      // Insert bid
      const result = await db.insert(bids).values({
        auctionId: input.auctionId,
        bidderId: ctx.user.id,
        amount: input.amount,
      }).returning();

      // Update auction with new highest bid
      await db.update(auctions)
        .set({
          currentBid: input.amount,
          highestBidderId: ctx.user.id,
        })
        .where(eq(auctions.id, input.auctionId));

      // Broadcast bid to all watching users via WebSocket
      try {
        const wsManager = getWebSocketManager();
        wsManager.broadcastBid({
          auctionId: input.auctionId,
          listingId: auction.listingId,
          currentBid: input.amount,
          highestBidderId: ctx.user.id,
          bidderId: ctx.user.id,
          bidderName: ctx.user.name || "Anonymous",
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Failed to broadcast bid:", error);
        // Don't fail the mutation if WebSocket broadcast fails
      }

      return result;
    }),
  myBids: protectedProcedure
    .query(async ({ ctx }) => {
      const { getUserBids } = await import("../db");
      return getUserBids(ctx.user.id);
    }),
};
