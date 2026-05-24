import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, or } from "drizzle-orm";
import { getDb } from "../db";
import { transactions, returns, notifications, users, listings } from "../../drizzle/schema";

export const returnsRouter = router({
  requestReturn: protectedProcedure
    .input(z.object({
      transactionId: z.number(),
      reason: z.string(),
      description: z.string().optional(),
      images: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Find the transaction
      const txRes = await db.select().from(transactions).where(eq(transactions.id, input.transactionId));
      if (!txRes.length) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
      const tx = txRes[0];

      if (tx.buyerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to return this transaction" });
      }

      if (tx.status !== "completed" && tx.status !== "delivered") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only return completed or delivered items" });
      }

      // Check if return already exists
      const existing = await db.select().from(returns).where(eq(returns.transactionId, tx.id));
      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Return already requested for this transaction" });
      }

      const newReturn = await db.insert(returns).values({
        transactionId: tx.id,
        buyerId: tx.buyerId,
        sellerId: tx.sellerId!,
        reason: input.reason,
        description: input.description,
        images: input.images || [],
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Notify seller
      const listingRes = await db.select({ title: listings.title }).from(listings).where(eq(listings.id, tx.listingId!));
      const listingTitle = listingRes.length ? listingRes[0].title : "Product";

      await db.insert(notifications).values({
        userId: tx.sellerId!,
        type: "return_request",
        title: "New Return Request",
        content: `A return has been requested for "${listingTitle}" by the buyer. Reason: ${input.reason}`,
        relatedId: newReturn[0].id,
        isRead: false,
        createdAt: new Date(),
      });

      return { success: true, returnRequest: newReturn[0] };
    }),

  getBuyerReturns: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const res = await db.query.returns.findMany({
        where: eq(returns.buyerId, ctx.user.id),
        with: {
          transaction: {
            with: {
              listing: true,
              seller: { columns: { name: true, businessName: true, email: true } }
            }
          }
        },
        orderBy: [desc(returns.createdAt)],
      });
      return res;
    }),

  getSellerReturns: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const res = await db.query.returns.findMany({
        where: eq(returns.sellerId, ctx.user.id),
        with: {
          transaction: {
            with: {
              listing: true,
              buyer: { columns: { name: true, email: true } }
            }
          }
        },
        orderBy: [desc(returns.createdAt)],
      });
      return res;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      returnId: z.number(),
      status: z.enum(["approved", "rejected", "refunded"]),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const returnReqRes = await db.select().from(returns).where(eq(returns.id, input.returnId));
      if (!returnReqRes.length) throw new TRPCError({ code: "NOT_FOUND", message: "Return not found" });
      const returnReq = returnReqRes[0];

      // Seller can approve/reject, Admin can do everything including refund
      const isSeller = returnReq.sellerId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin";

      if (!isSeller && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      // Sellers cannot issue refund directly, they can just approve. 
      // Admins can mark as refunded.
      if (input.status === "refunded" && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admin can process refunds" });
      }

      await db.update(returns)
        .set({ 
          status: input.status, 
          adminNotes: input.adminNotes || returnReq.adminNotes,
          updatedAt: new Date() 
        })
        .where(eq(returns.id, input.returnId));

      // If refunded, update transaction status too
      if (input.status === "refunded") {
        await db.update(transactions)
          .set({ status: "refunded", updatedAt: new Date() })
          .where(eq(transactions.id, returnReq.transactionId));
      }

      // Notify Buyer
      const statusText = input.status === "approved" ? "approved" : input.status === "rejected" ? "rejected" : "refunded";
      await db.insert(notifications).values({
        userId: returnReq.buyerId,
        type: "return_update",
        title: `Return Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
        content: `Your return request for transaction #${returnReq.transactionId} has been ${statusText}.`,
        relatedId: returnReq.id,
        isRead: false,
        createdAt: new Date(),
      });

      return { success: true };
    }),
});
