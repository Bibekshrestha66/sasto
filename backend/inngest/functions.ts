import { inngest } from "./client";
import { emailService } from "../_core/emailService";
import { getDb } from "../db";
import { auctions, listings, notifications, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getWebSocketManager } from "../websocket";

// 1. Send queued email immediately when triggered
export const sendQueuedEmail = inngest.createFunction(
  { id: "send-queued-email", triggers: [{ event: "email/queued" }] },
  async ({ event, step }) => {
    await step.run("process-queue", async () => {
      console.log("[Inngest] Triggering email queue processing...");
      await emailService.processPendingEmails();
    });
  }
);

// 2. Listing created/updated/deleted background handlers
export const handleListingChange = inngest.createFunction(
  { id: "handle-listing-change", triggers: [{ event: "listing/change" }] },
  async ({ event, step }) => {
    const { action, listingId, title } = event.data as any;

    await step.run("log-change", async () => {
      console.log(`[Inngest] Listing change background job: ${action} for Listing ID: ${listingId} (${title})`);
      // Here you could trigger full-text search reindexing, run image moderation, safety checks, etc.
    });
  }
);

// 3. Delayed job to close expired auctions automatically
export const scheduleAuctionClose = inngest.createFunction(
  { id: "schedule-auction-close", triggers: [{ event: "auction/created" }] },
  async ({ event, step }) => {
    const { auctionId, endTime } = event.data as any;

    console.log(`[Inngest] Scheduling close for Auction ID: ${auctionId} at ${endTime}`);
    
    // Wait until auction is complete
    await step.sleepUntil("wait-for-auction-end", new Date(endTime));

    await step.run("finalize-auction", async () => {
      const db = await getDb();
      const [auction] = await db.select().from(auctions).where(eq(auctions.id, auctionId));
      if (!auction) return;

      console.log(`[Inngest] Finalizing Auction ID: ${auctionId}`);
      
      // Determine winner
      if (auction.highestBidderId && auction.currentBid) {
        // Notify winner
        await db.insert(notifications).values({
          userId: auction.highestBidderId,
          type: "auction",
          title: "Auction Won!",
          content: `Congratulations! You won the auction for Listing ID: ${auction.listingId} with a bid of NPR ${auction.currentBid}.`,
          relatedId: auction.id,
          isRead: false,
        });

        // Notify via WebSocket if active
        try {
          const wsManager = getWebSocketManager();
          wsManager.notifyOrder(auction.highestBidderId, {
            type: "auction-won",
            orderId: `AUC-${auctionId}`,
            status: "won",
            title: "Auction Won!",
            content: `You won the auction with a bid of NPR ${auction.currentBid}.`,
          });
        } catch (e) {
          console.error("Failed to emit WebSocket for auction win", e);
        }
      }
    });
  }
);
