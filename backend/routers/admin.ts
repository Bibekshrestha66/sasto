import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { encryptMessage, decryptMessage } from "../_core/crypto";
import { getDb, updateCompanyConfig, getAllReports, resolveReport, createCareerOpening, archiveCareerOpening, getPaymentGateways, updatePaymentGateway } from "../db";
import { users, listings, disputes, adminLogs, flaggedListings, verificationSubmissions, transactions, categories, messages, logisticsPartners, companyConfigs } from "../../drizzle/schema";
import { eq, desc, sql, gte, and, or } from "drizzle-orm";

export const adminRouter = router({
  // User Management
  getAllUsers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        status: z.enum(["active", "suspended", "banned", "unverified"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;

      const query = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          verificationStatus: users.verificationStatus,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
        })
        .from(users);

      if (input.status) {
        query.where(eq(users.status, input.status));
      }

      const allUsers = await query.orderBy(desc(users.createdAt)).limit(input.limit).offset(offset);
      return { users: allUsers, total: allUsers.length };
    }),


  // Listing Moderation
  getPendingListings: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;

      const pendingListings = await db
        .select()
        .from(listings)
        .where(eq(listings.status, "pending"))
        .orderBy(desc(listings.createdAt))
        .limit(input.limit)
        .offset(offset);

      return { listings: pendingListings, total: pendingListings.length };
    }),


  // Dispute Resolution
  getDisputes: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;

      const query = db
        .select()
        .from(disputes)
        .orderBy(desc(disputes.createdAt))
        .limit(input.limit)
        .offset(offset);

      if (input.status) {
        query.where(eq(disputes.status, input.status));
      }

      const allDisputes = await query;
      return { disputes: allDisputes, total: allDisputes.length };
    }),

  updateDisputeStatus: adminProcedure
    .input(
      z.object({
        disputeId: z.string(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      await db
        .update(disputes)
        .set({
          status: input.status,
          resolution: input.resolution,
          resolvedAt: input.status === "resolved" ? new Date() : undefined,
        })
        .where(eq(disputes.id, parseInt(input.disputeId)));

      // Log admin action
      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: "dispute_updated",
        targetDisputeId: parseInt(input.disputeId),
        details: `Status changed to ${input.status}`,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Platform Analytics
  getAnalytics: adminProcedure.query(async () => {
    const db = await getDb();

    const totalUsers = await db.select().from(users);
    const totalListings = await db.select().from(listings);
    const activeListings = await db
      .select()
      .from(listings)
      .where(eq(listings.status, "active"));

    const verifiedUsers = totalUsers.filter((u) => u.verificationStatus === "verified");

    return {
      totalUsers: totalUsers.length,
      verifiedUsers: verifiedUsers.length,
      totalListings: totalListings.length,
      activeListings: activeListings.length,
      pendingListings: totalListings.filter((l) => l.status === "pending").length,
      rejectedListings: totalListings.filter((l) => l.status === "rejected").length,
    };
  }),

  // Admin Logs
  getAdminLogs: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;

      const logs = await db
        .select()
        .from(adminLogs)
        .orderBy(desc(adminLogs.timestamp))
        .limit(input.limit)
        .offset(offset);

      return { logs, total: logs.length };
    }),

  // Update user role
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "seller", "csr", "sub_moderator", "moderator", "admin", "super_admin"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: "user_role_updated",
        targetUserId: input.userId,
        details: `Role updated to ${input.role}`,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Verify user
  verifyUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      await db.update(users)
        .set({ isVerified: true, verificationStatus: "verified", updatedAt: new Date() })
        .where(eq(users.id, input.userId));
      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: "user_verified",
        targetUserId: input.userId,
        details: "User verified manually by admin",
        timestamp: new Date(),
      });
      return { success: true };
    }),

  // Suspend user
  suspendUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      await db.update(users)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(eq(users.id, input.userId));
      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: "user_suspended",
        targetUserId: input.userId,
        details: `Suspended: ${input.reason}`,
        timestamp: new Date(),
      });
      return { success: true };
    }),

  // Ban user
  banUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      await db
        .update(users)
        .set({ status: "banned", updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: "user_banned",
        targetUserId: input.userId,
        details: `Banned: ${input.reason}`,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Unban user
  unbanUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      await db
        .update(users)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: "user_unbanned",
        targetUserId: input.userId,
        details: "User unbanned",
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Get flagged listings (listings that have been reported)
  getFlaggedListings: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;

      const flagged = await db
        .select({
          flagId: flaggedListings.id,
          reason: flaggedListings.reason,
          description: flaggedListings.description,
          flagStatus: flaggedListings.status,
          listingId: listings.id,
          title: listings.title,
          status: listings.status,
          userId: listings.userId,
          price: listings.price,
          images: listings.images,
          createdAt: flaggedListings.createdAt,
        })
        .from(flaggedListings)
        .innerJoin(listings, eq(flaggedListings.listingId, listings.id))
        .where(eq(flaggedListings.status, "pending"))
        .orderBy(desc(flaggedListings.createdAt))
        .limit(input.limit)
        .offset(offset);

      return { listings: flagged, total: flagged.length };
    }),

  // Approve a listing
  approveListing: adminProcedure
    .input(z.object({ listingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const lid = parseInt(input.listingId);

      await db
        .update(listings)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(listings.id, lid));

      // Resolve any pending flags for this listing
      await db
        .update(flaggedListings)
        .set({ 
          status: "resolved", 
          resolvedAt: new Date(), 
          reviewedByAdminId: ctx.user.id,
          adminNotes: "Approved by admin"
        })
        .where(eq(flaggedListings.listingId, lid));

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: "listing_approved",
        targetListingId: lid,
        details: "Listing approved and flags resolved",
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Reject a listing
  rejectListing: adminProcedure
    .input(z.object({ listingId: z.string(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const lid = parseInt(input.listingId);

      await db
        .update(listings)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(listings.id, lid));

      // Resolve any pending flags for this listing
      await db
        .update(flaggedListings)
        .set({ 
          status: "resolved", 
          resolvedAt: new Date(), 
          reviewedByAdminId: ctx.user.id,
          adminNotes: `Rejected: ${input.reason}`
        })
        .where(eq(flaggedListings.listingId, lid));

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: "listing_rejected",
        targetListingId: lid,
        details: `Rejected: ${input.reason}`,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Update payment gateway config
  updatePaymentGateway: adminProcedure
    .input(z.object({ gatewayName: z.string(), config: z.any() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await updatePaymentGateway(input.gatewayName, input.config);
        
        const db = await getDb();
        if (db) {
           await db.insert(adminLogs).values({
            adminId: ctx.user.id,
            action: `update_payment_gateway`,
            details: `Updated config for ${input.gatewayName}`,
          });
        }
        
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  // Feature / unfeature a listing
  setListingFeatured: adminProcedure
    .input(z.object({
      listingId: z.number(),
      isFeatured: z.boolean(),
      durationDays: z.number().default(7),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      const featuredUntil = input.isFeatured
        ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
        : null;

      await db
        .update(listings)
        .set({ isFeatured: input.isFeatured, featuredUntil, updatedAt: new Date() })
        .where(eq(listings.id, input.listingId));

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: input.isFeatured ? "listing_featured" : "listing_unfeatured",
        targetListingId: input.listingId,
        details: input.isFeatured ? `Featured for ${input.durationDays} days` : "Removed from featured",
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Get financial stats
  getFinancialStats: adminProcedure.query(async () => {
    const db = await getDb();

    const allListings = await db.select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      status: listings.status,
      isFeatured: listings.isFeatured,
      createdAt: listings.createdAt,
    }).from(listings).orderBy(desc(listings.createdAt));

    const totalListings = allListings.length;
    const activeListings = allListings.filter(l => l.status === "active").length;
    const featuredListings = allListings.filter(l => l.isFeatured).length;
    const totalValue = allListings.reduce((sum, l) => sum + (l.price || 0), 0);
    // Mock revenue: featured listings @ NPR 999 each
    const promotionRevenue = featuredListings * 999;

    return {
      totalListings,
      activeListings,
      featuredListings,
      totalValue,
      promotionRevenue,
      allListings,
    };
  }),

  // Verification Management
  getPendingVerifications: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;

      const submissions = await db
        .select({
          id: verificationSubmissions.id,
          userId: verificationSubmissions.userId,
          userName: users.name,
          userEmail: users.email,
          type: verificationSubmissions.type,
          data: verificationSubmissions.data,
          status: verificationSubmissions.status,
          createdAt: verificationSubmissions.createdAt,
        })
        .from(verificationSubmissions)
        .innerJoin(users, eq(verificationSubmissions.userId, users.id))
        .where(eq(verificationSubmissions.status, "pending"))
        .orderBy(desc(verificationSubmissions.createdAt))
        .limit(input.limit)
        .offset(offset);

      return { submissions, total: submissions.length };
    }),

  reviewVerification: adminProcedure
    .input(z.object({
      submissionId: z.number(),
      status: z.enum(["approved", "rejected"]),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      const submission = await db
        .select()
        .from(verificationSubmissions)
        .where(eq(verificationSubmissions.id, input.submissionId))
        .limit(1);

      if (submission.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });

      await db
        .update(verificationSubmissions)
        .set({
          status: input.status,
          adminNotes: input.adminNotes,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(verificationSubmissions.id, input.submissionId));

      if (input.status === "approved") {
        // Get the current user to check their role
        const currentUser = await db.select({ role: users.role }).from(users).where(eq(users.id, submission[0].userId)).limit(1);
        const currentRole = currentUser[0]?.role;
        
        await db.update(users)
          .set({
            isVerified: true,
            verificationLevel: submission[0].type === "kyb" ? "pro" : "basic",
            verificationStatus: "verified",
            // Automatically upgrade 'user' role to 'seller' upon verification
            role: currentRole === "user" ? "seller" : currentRole,
            updatedAt: new Date(),
          })
          .where(eq(users.id, submission[0].userId));
      } else {
        await db.update(users)
          .set({ verificationStatus: "rejected", updatedAt: new Date() })
          .where(eq(users.id, submission[0].userId));
      }

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: `verification_${input.status}`,
        targetUserId: submission[0].userId,
        details: `Verification ${input.status}. Notes: ${input.adminNotes || "N/A"}`,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Advanced Financial Reporting (Amazon-style)
  getAdvancedFinancials: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      const now = new Date();
      const start = input.startDate || new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
      const end = input.endDate || now;

      // 1. Total Revenue and Volume
      const allTransactions = await db
        .select()
        .from(transactions)
        .where(and(
          gte(transactions.createdAt, start),
          // lte(transactions.createdAt, end)
        ))
        .orderBy(desc(transactions.createdAt));

      const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalFees = allTransactions.reduce((sum, t) => sum + t.platformFee, 0);
      const totalNet = allTransactions.reduce((sum, t) => sum + t.netAmount, 0);

      // 2. Revenue by Type
      const revenueByType = allTransactions.reduce((acc: any, t) => {
        acc[t.transactionType] = (acc[t.transactionType] || 0) + t.amount;
        return acc;
      }, {});

      // 3. Category performance
      const categoryStats = await db
        .select({
          categoryName: categories.name,
          count: sql<number>`count(${listings.id})`,
          totalSales: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .innerJoin(listings, eq(transactions.listingId, listings.id))
        .innerJoin(categories, eq(listings.categoryId, categories.id))
        .groupBy(categories.name)
        .orderBy(desc(sql`sum(${transactions.amount})`));

      // 4. Daily trends (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dailyTrends = await db
        .select({
          date: sql<string>`date(${transactions.createdAt}, 'unixepoch')`,
          revenue: sql<number>`sum(${transactions.amount})`,
          orders: sql<number>`count(${transactions.id})`,
        })
        .from(transactions)
        .where(gte(transactions.createdAt, thirtyDaysAgo))
        .groupBy(sql`date(${transactions.createdAt}, 'unixepoch')`)
        .orderBy(sql`date(${transactions.createdAt}, 'unixepoch')`);

      return {
        summary: {
          totalRevenue,
          totalFees,
          totalNet,
          orderCount: allTransactions.length,
        },
        revenueByType,
        categoryStats,
        dailyTrends,
        recentTransactions: allTransactions.slice(0, 50),
      };
    }),

  // ── User Profile & Documents (Admin) ──────────────────────────────────────

  /** Full profile of any user including business details */
  getUserProfile: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          location: users.location,
          bio: users.bio,
          avatar: users.avatar,
          role: users.role,
          status: users.status,
          isVerified: users.isVerified,
          verificationLevel: users.verificationLevel,
          verificationStatus: users.verificationStatus,
          businessName: users.businessName,
          businessLicense: users.businessLicense,
          experienceYears: users.experienceYears,
          specialties: users.specialties,
          socialLinks: users.socialLinks,
          bannerImage: users.bannerImage,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      // Fetch all verification submissions for this user
      const verifications = await db
        .select()
        .from(verificationSubmissions)
        .where(eq(verificationSubmissions.userId, input.userId))
        .orderBy(desc(verificationSubmissions.createdAt));

      // Fetch their listings
      const userListings = await db
        .select()
        .from(listings)
        .where(eq(listings.userId, input.userId))
        .orderBy(desc(listings.createdAt))
        .limit(20);

      return { user, verifications, listings: userListings };
    }),

  /** All KYC/KYB submissions across the platform */
  getAllVerifications: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;

      const query = db
        .select({
          id: verificationSubmissions.id,
          userId: verificationSubmissions.userId,
          type: verificationSubmissions.type,
          data: verificationSubmissions.data,
          status: verificationSubmissions.status,
          adminNotes: verificationSubmissions.adminNotes,
          reviewedBy: verificationSubmissions.reviewedBy,
          reviewedAt: verificationSubmissions.reviewedAt,
          createdAt: verificationSubmissions.createdAt,
          updatedAt: verificationSubmissions.updatedAt,
          userName: users.name,
          userEmail: users.email,
          userRole: users.role,
          userAvatar: users.avatar,
        })
        .from(verificationSubmissions)
        .leftJoin(users, eq(verificationSubmissions.userId, users.id))
        .orderBy(desc(verificationSubmissions.createdAt))
        .limit(input.limit)
        .offset(offset);

      const allSubs = await query;

      const pendingCount = allSubs.filter(s => s.status === "pending").length;
      return { submissions: allSubs, total: allSubs.length, pendingCount };
    }),

  // Global Company Settings
  getCompanyConfig: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { commissionRate: 0 };
    const config = await db.select().from(companyConfigs).limit(1);
    return config.length > 0 ? { commissionRate: config[0].commissionRate } : { commissionRate: 0 };
  }),

  updateCompanyConfig: adminProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        commissionRate: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return updateCompanyConfig(input);
    }),

  // Complaints / Reports
  getAllReports: adminProcedure.query(async () => {
    return getAllReports();
  }),

  resolveReport: adminProcedure
    .input(
      z.object({
        id: z.number(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return resolveReport(input.id, input.adminNotes);
    }),

  // Careers Management
  createCareerOpening: adminProcedure
    .input(
      z.object({
        title: z.string(),
        department: z.string(),
        location: z.string(),
        salaryRange: z.string(),
        type: z.string(),
        description: z.string(),
        requirements: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createCareerOpening(input);
    }),

  archiveCareerOpening: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return archiveCareerOpening(input.id);
    }),

  // CSR support live chat queue
  getSupportConversations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    // Find all messages involving User ID 1 (Sasto Support)
    const allSupportMessages = await db
      .select({
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        content: messages.content,
        createdAt: messages.createdAt,
        attachmentUrl: messages.attachmentUrl,
        attachmentType: messages.attachmentType,
      })
      .from(messages)
      .where(or(eq(messages.senderId, 1), eq(messages.recipientId, 1)))
      .orderBy(desc(messages.createdAt));

    const partnerIds = new Set<number>();
    const conversations: any[] = [];

    for (const msg of allSupportMessages) {
      const partnerId = msg.senderId === 1 ? msg.recipientId : msg.senderId;
      if (partnerId === 1) continue;
      if (partnerIds.has(partnerId)) continue;
      partnerIds.add(partnerId);

      const [partnerUser] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        })
        .from(users)
        .where(eq(users.id, partnerId))
        .limit(1);

      if (partnerUser) {
        conversations.push({
          id: partnerId,
          user: partnerUser,
          lastMessage: {
            content: decryptMessage(msg.content),
            createdAt: msg.createdAt,
            senderId: msg.senderId,
            attachmentUrl: msg.attachmentUrl,
            attachmentType: msg.attachmentType,
          },
        });
      }
    }
    return conversations;
  }),

  getSupportMessages: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(messages)
        .where(
          or(
            and(eq(messages.senderId, 1), eq(messages.recipientId, input.userId)),
            and(eq(messages.senderId, input.userId), eq(messages.recipientId, 1))
          )
        )
        .orderBy(messages.createdAt);
      return rows.map(row => ({ ...row, content: decryptMessage(row.content) }));
    }),

  sendSupportReply: adminProcedure
    .input(z.object({
      userId: z.number(),
      content: z.string(),
      attachmentUrl: z.string().optional(),
      attachmentType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(messages).values({
        senderId: 1, // Sent as Support
        recipientId: input.userId,
        content: encryptMessage(input.content),
        attachmentUrl: input.attachmentUrl || null,
        attachmentType: input.attachmentType || null,
        createdAt: new Date(),
      }).returning();

      // Broadcast via WebSocket
      try {
        const { getWebSocketManager } = await import("../websocket");
        const wsManager = getWebSocketManager();
        wsManager.notifyMessage({
          id: result[0].id,
          senderId: 1,
          recipientId: input.userId,
          content: input.content,
          timestamp: new Date(),
          conversationId: [1, input.userId].sort().join('-'),
          attachmentUrl: input.attachmentUrl || undefined,
          attachmentType: input.attachmentType || undefined,
        });
      } catch (e) {
        console.error("Failed to broadcast support reply via WebSocket:", e);
      }

      return result[0];
    }),

  // Payment Gateways Management
  getPaymentGateways: adminProcedure.query(async () => {
    return getPaymentGateways();
  }),


  // Logistics Partners
  getLogisticsPartners: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(logisticsPartners);
  }),

  addLogisticsPartner: adminProcedure
    .input(z.object({
      name: z.string(),
      displayName: z.string(),
      webhookUrl: z.string().optional(),
      trackingUrlFormat: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.insert(logisticsPartners).values({
        name: input.name,
        displayName: input.displayName,
        webhookUrl: input.webhookUrl,
        trackingUrlFormat: input.trackingUrlFormat,
        isActive: false,
      });
      return { success: true };
    }),

  updateLogisticsPartner: adminProcedure
    .input(z.object({
      id: z.number(),
      displayName: z.string().optional(),
      isActive: z.boolean().optional(),
      webhookUrl: z.string().optional(),
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
      trackingUrlFormat: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.update(logisticsPartners)
        .set({
          ...input,
          updatedAt: new Date()
        })
        .where(eq(logisticsPartners.id, input.id));
      return { success: true };
    }),

  deleteLogisticsPartner: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(logisticsPartners).where(eq(logisticsPartners.id, input.id));
      return { success: true };
    })
});
