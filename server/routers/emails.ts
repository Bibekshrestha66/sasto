import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { emailNotificationPreferences, emailQueue, emailLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { emailService } from "../_core/emailService";

export const emailsRouter = router({
  // Get user's email notification preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const prefs = await db
      .select()
      .from(emailNotificationPreferences)
      .where(eq(emailNotificationPreferences.userId, ctx.user.id))
      .limit(1);

    if (prefs.length === 0) {
      // Create default preferences
      await db.insert(emailNotificationPreferences).values({
        userId: ctx.user.id,
        newMessages: true,
        newBids: true,
        bookingConfirmation: true,
        listingApproval: true,
        listingRejection: true,
        weeklyDigest: true,
        promotionalEmails: false,
        securityAlerts: true,
      });

      return {
        userId: ctx.user.id,
        newMessages: true,
        newBids: true,
        bookingConfirmation: true,
        listingApproval: true,
        listingRejection: true,
        weeklyDigest: true,
        promotionalEmails: false,
        securityAlerts: true,
      };
    }

    return prefs[0];
  }),

  // Update email notification preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        newMessages: z.boolean().optional(),
        newBids: z.boolean().optional(),
        bookingConfirmation: z.boolean().optional(),
        listingApproval: z.boolean().optional(),
        listingRejection: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        promotionalEmails: z.boolean().optional(),
        securityAlerts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const existing = await db
        .select()
        .from(emailNotificationPreferences)
        .where(eq(emailNotificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(emailNotificationPreferences).values({
          userId: ctx.user.id,
          ...input,
        });
      } else {
        await db
          .update(emailNotificationPreferences)
          .set(input)
          .where(eq(emailNotificationPreferences.userId, ctx.user.id));
      }

      return { success: true };
    }),

  // Get email queue status
  getQueueStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const stats = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.userId, ctx.user.id));

    return {
      total: stats.length,
      pending: stats.filter((e) => e.status === "pending").length,
      sent: stats.filter((e) => e.status === "sent").length,
      failed: stats.filter((e) => e.status === "failed").length,
      bounced: stats.filter((e) => e.status === "bounced").length,
    };
  }),

  // Get email logs
  getLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const logs = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.recipientEmail, ctx.user.email || ""))
        .orderBy((t) => t.createdAt)
        .limit(input.limit)
        .offset(input.offset);

      return logs;
    }),

  // Send test email
  sendTestEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const success = await emailService.sendEmail({
      to: ctx.user.email || "",
      subject: "Test Email from Sasto Marketplace",
      template: "test_email",
      templateData: {
        userName: ctx.user.name || "User",
      },
      userId: ctx.user.id,
    });

    return { success };
  }),

  // Unsubscribe from all emails
  unsubscribeAll: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();

    await db
      .update(emailNotificationPreferences)
      .set({
        newMessages: false,
        newBids: false,
        bookingConfirmation: false,
        listingApproval: false,
        listingRejection: false,
        weeklyDigest: false,
        promotionalEmails: false,
        securityAlerts: false,
      })
      .where(eq(emailNotificationPreferences.userId, ctx.user.id));

    return { success: true };
  }),

  // Resubscribe to emails
  resubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();

    await db
      .update(emailNotificationPreferences)
      .set({
        newMessages: true,
        newBids: true,
        bookingConfirmation: true,
        listingApproval: true,
        listingRejection: true,
        weeklyDigest: true,
        promotionalEmails: false,
        securityAlerts: true,
      })
      .where(eq(emailNotificationPreferences.userId, ctx.user.id));

    return { success: true };
  }),
});
