import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getCompanyConfig, getCareers, submitReport, getActivePaymentGateways } from "../db";

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
});
