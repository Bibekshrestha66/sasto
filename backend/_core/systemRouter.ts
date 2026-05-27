import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getCompanyConfig, getCareers, submitReport, getActivePaymentGateways, getDb } from "../db";
import { count, eq } from "drizzle-orm";
import { users, listings, transactions } from "../../drizzle/schema";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  getCompanyConfig: publicProcedure.query(async () => {
    return getCompanyConfig();
  }),

  getCareers: publicProcedure.query(async () => {
    return getCareers();
  }),

  submitReport: publicProcedure
    .input(
      z.object({
        reporterName: z.string().optional(),
        reporterEmail: z.string().email(),
        subject: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return submitReport(input);
    }),

  getActivePaymentGateways: publicProcedure.query(async () => {
    return getActivePaymentGateways();
  }),

  // Real-time platform statistics for About and Help pages
  getPlatformStats: publicProcedure.query(async () => {
    try {
      const db = await getDb();

      const [totalUsersResult, activeListingsResult, totalTransactionsResult] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(listings).where(eq(listings.status, "active")),
        db.select({ count: count() }).from(transactions),
      ]);

      return {
        totalUsers: Number(totalUsersResult[0]?.count || 0),
        activeListings: Number(activeListingsResult[0]?.count || 0),
        totalTransactions: Number(totalTransactionsResult[0]?.count || 0),
      };
    } catch (error) {
      console.error("[systemRouter] getPlatformStats error:", error);
      return { totalUsers: 0, activeListings: 0, totalTransactions: 0 };
    }
  }),
});

