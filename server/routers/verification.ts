import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { verificationSubmissions, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const verificationRouter = router({
  submit: protectedProcedure
    .input(z.object({
      type: z.enum(["kyc", "kyb"]),
      data: z.record(z.string(), z.any()), // Contains doc URLs, ID numbers, etc.
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Check if there's already a pending submission
      const existing = await db
        .select()
        .from(verificationSubmissions)
        .where(eq(verificationSubmissions.userId, ctx.user.id))
        .orderBy(desc(verificationSubmissions.createdAt))
        .limit(1);

      if (existing.length > 0 && existing[0].status === "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending verification request.",
        });
      }

      const result = await db.insert(verificationSubmissions).values({
        userId: ctx.user.id,
        type: input.type,
        data: input.data,
        status: "pending",
      }).returning();

      return { success: true, submission: result[0] };
    }),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const submissions = await db
      .select()
      .from(verificationSubmissions)
      .where(eq(verificationSubmissions.userId, ctx.user.id))
      .orderBy(desc(verificationSubmissions.createdAt));

    return submissions;
  }),

  // Admin Procedures
  getAllSubmissions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view all submissions" });
    }
    const db = await getDb();
    return db.select().from(verificationSubmissions).orderBy(desc(verificationSubmissions.createdAt));
  }),

  approve: protectedProcedure
    .input(z.object({
      submissionId: z.number(),
      status: z.enum(["approved", "rejected"]),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can approve submissions" });
      }

      const db = await getDb();
      
      const [submission] = await db
        .select()
        .from(verificationSubmissions)
        .where(eq(verificationSubmissions.id, input.submissionId))
        .limit(1);

      if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });

      await db.update(verificationSubmissions)
        .set({
          status: input.status,
          adminNotes: input.adminNotes,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(verificationSubmissions.id, input.submissionId));

      if (input.status === "approved") {
        await db.update(users)
          .set({
            isVerified: true,
            verificationLevel: submission.type === "kyb" ? "pro" : "basic",
            updatedAt: new Date(),
          })
          .where(eq(users.id, submission.userId));
      }

      return { success: true };
    }),
});
