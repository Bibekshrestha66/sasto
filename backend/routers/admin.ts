import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { encryptMessage, decryptMessage } from "../_core/crypto";
import { getDb, updateCompanyConfig, getAllReports, resolveReport, createCareerOpening, archiveCareerOpening, getPaymentGateways, updatePaymentGateway } from "../db";
import { users, listings, disputes, adminLogs, flaggedListings, verificationSubmissions, transactions, categories, messages, logisticsPartners, companyConfigs, notifications } from "../../drizzle/schema";
import { eq, desc, sql, gte, and, or } from "drizzle-orm";
import { emailService } from "../_core/emailService";
import { clerkClient } from "../_core/clerk";

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

  // Advanced Analytics — supports both preset timeframe AND custom date range
  getAdvancedAnalytics: adminProcedure
    .input(z.object({
      timeframe: z.enum(["daily", "weekly", "bi_weekly", "monthly", "quarterly", "half_year", "yearly", "custom"]).default("monthly"),
      startDate: z.string().optional(), // ISO date string for custom range
      endDate: z.string().optional(),   // ISO date string for custom range
    }))
    .query(async ({ input }) => {
      const db = await getDb();

      const allUsers = await db.select().from(users);
      const allListings = await db.select().from(listings);
      const allTransactions = await db.select().from(transactions).where(eq(transactions.status, "completed"));

      const now = new Date();
      let rangeStart = new Date();
      let rangeEnd = now;

      if (input.timeframe === "custom" && input.startDate && input.endDate) {
        rangeStart = new Date(input.startDate);
        rangeEnd = new Date(input.endDate);
        rangeEnd.setHours(23, 59, 59, 999);
      } else {
        switch (input.timeframe) {
          case "daily":      rangeStart.setDate(now.getDate() - 30); break;
          case "weekly":     rangeStart.setDate(now.getDate() - 90); break;
          case "bi_weekly":  rangeStart.setDate(now.getDate() - 180); break;
          case "monthly":    rangeStart.setMonth(now.getMonth() - 12); break;
          case "quarterly":  rangeStart.setFullYear(now.getFullYear() - 3); break;
          case "half_year":  rangeStart.setFullYear(now.getFullYear() - 5); break;
          case "yearly":     rangeStart.setFullYear(now.getFullYear() - 10); break;
        }
      }

      const diffDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 86400000);

      const getGroupKey = (date: Date) => {
        if (diffDays <= 60 || input.timeframe === "daily") return date.toISOString().split("T")[0];
        if (diffDays <= 180 || input.timeframe === "weekly") {
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          return `${date.getFullYear()}-W${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
        }
        if (input.timeframe === "yearly") return `${date.getFullYear()}`;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      };

      const chartData: Record<string, { revenue: number; newUsers: number; newListings: number }> = {};

      allTransactions.forEach(t => {
        if (!t.createdAt) return;
        const d = new Date(t.createdAt);
        if (d < rangeStart || d > rangeEnd) return;
        const key = getGroupKey(d);
        if (!chartData[key]) chartData[key] = { revenue: 0, newUsers: 0, newListings: 0 };
        chartData[key].revenue += Number(t.amount);
      });

      allUsers.forEach(u => {
        if (!u.createdAt) return;
        const d = new Date(u.createdAt);
        if (d < rangeStart || d > rangeEnd) return;
        const key = getGroupKey(d);
        if (!chartData[key]) chartData[key] = { revenue: 0, newUsers: 0, newListings: 0 };
        chartData[key].newUsers += 1;
      });

      allListings.forEach(l => {
        if (!l.createdAt) return;
        const d = new Date(l.createdAt);
        if (d < rangeStart || d > rangeEnd) return;
        const key = getGroupKey(d);
        if (!chartData[key]) chartData[key] = { revenue: 0, newUsers: 0, newListings: 0 };
        chartData[key].newListings += 1;
      });

      const sortedChartData = Object.keys(chartData).sort().map(key => ({
        date: key,
        ...chartData[key]
      }));

      // Summary stats for the period
      const periodRevenue = allTransactions
        .filter(t => t.createdAt && new Date(t.createdAt) >= rangeStart && new Date(t.createdAt) <= rangeEnd)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const periodTransactions = allTransactions.filter(t => t.createdAt && new Date(t.createdAt) >= rangeStart && new Date(t.createdAt) <= rangeEnd).length;
      const periodNewUsers = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= rangeStart && new Date(u.createdAt) <= rangeEnd).length;
      const periodNewListings = allListings.filter(l => l.createdAt && new Date(l.createdAt) >= rangeStart && new Date(l.createdAt) <= rangeEnd).length;
      const avgOrderValue = periodTransactions > 0 ? Math.round(periodRevenue / periodTransactions) : 0;

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      allListings.forEach(l => {
        if (!l.createdAt) return;
        const d = new Date(l.createdAt);
        if (d < rangeStart || d > rangeEnd) return;
        const catId = String(l.categoryId);
        categoryBreakdown[catId] = (categoryBreakdown[catId] || 0) + 1;
      });

      // Top Sellers (within range)
      const sellerStats: Record<number, { revenue: number, sales: number }> = {};
      allTransactions.forEach(t => {
        if (!t.createdAt) return;
        const d = new Date(t.createdAt);
        if (d < rangeStart || d > rangeEnd) return;
        if (t.sellerId) {
          if (!sellerStats[t.sellerId]) sellerStats[t.sellerId] = { revenue: 0, sales: 0 };
          sellerStats[t.sellerId].revenue += Number(t.amount);
          sellerStats[t.sellerId].sales += 1;
        }
      });
      const topSellersIds = Object.keys(sellerStats).sort((a, b) => sellerStats[Number(b)].revenue - sellerStats[Number(a)].revenue).slice(0, 10).map(Number);
      const topSellers = allUsers.filter(u => topSellersIds.includes(u.id)).map(u => ({
        ...u,
        revenue: sellerStats[u.id]?.revenue ?? 0,
        sales: sellerStats[u.id]?.sales ?? 0
      })).sort((a, b) => b.revenue - a.revenue);

      // Top Products (within range)
      const productStats: Record<number, { revenue: number, sales: number }> = {};
      allTransactions.forEach(t => {
        if (!t.createdAt) return;
        const d = new Date(t.createdAt);
        if (d < rangeStart || d > rangeEnd) return;
        if (t.listingId) {
          if (!productStats[t.listingId]) productStats[t.listingId] = { revenue: 0, sales: 0 };
          productStats[t.listingId].revenue += Number(t.amount);
          productStats[t.listingId].sales += 1;
        }
      });
      const topProductIds = Object.keys(productStats).sort((a, b) => productStats[Number(b)].revenue - productStats[Number(a)].revenue).slice(0, 10).map(Number);
      const topProducts = allListings.filter(l => topProductIds.includes(l.id)).map(l => ({
        ...l,
        revenue: productStats[l.id]?.revenue ?? 0,
        sales: productStats[l.id]?.sales ?? 0
      })).sort((a, b) => b.revenue - a.revenue);

      // Recent suspicious activity — users with no listings but many failed verifications
      const suspiciousUserIds = allUsers
        .filter(u => u.verificationStatus === "rejected" && u.status === "active")
        .map(u => u.id)
        .slice(0, 5);

      return {
        chartData: sortedChartData,
        topSellers,
        topProducts,
        summary: { periodRevenue, periodTransactions, periodNewUsers, periodNewListings, avgOrderValue },
        suspiciousUserIds,
      };
    }),

  // Listing Search for Admin — search by title, ID, unique code, or user email
  searchListingsAdmin: adminProcedure
    .input(z.object({ 
      query: z.string(),
      status: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const q = input.query.toLowerCase().trim();
      
      // Get all users for email/name matching
      const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);
      const matchingUserIds = allUsers
        .filter(u => u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q))
        .map(u => u.id);
      
      const allListings = await db
        .select({
          id: listings.id,
          title: listings.title,
          description: listings.description,
          price: listings.price,
          status: listings.status,
          type: listings.type,
          images: listings.images,
          location: listings.location,
          condition: listings.condition,
          stock: listings.stock,
          categoryId: listings.categoryId,
          userId: listings.userId,
          isFeatured: listings.isFeatured,
          createdAt: listings.createdAt,
          brand: listings.brand,
          model: listings.model,
        })
        .from(listings)
        .orderBy(desc(listings.createdAt));
      
      let filtered = allListings.filter(l => {
        const idMatch = l.id.toString() === q;
        const titleMatch = l.title?.toLowerCase().includes(q);
        const userMatch = matchingUserIds.includes(l.userId);
        return idMatch || titleMatch || userMatch;
      });
      
      if (input.status && input.status !== 'all') {
        filtered = filtered.filter(l => l.status === input.status);
      }
      
      // Attach seller info
      const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));
      return filtered.slice(0, input.limit).map(l => ({
        ...l,
        sellerName: userMap[l.userId]?.name || 'Unknown',
        sellerEmail: userMap[l.userId]?.email || '',
      }));
    }),

  // Admin edit any listing
  adminEditListing: adminProcedure
    .input(z.object({
      listingId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      status: z.string().optional(),
      stock: z.number().optional(),
      condition: z.string().optional(),
      location: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { listingId, ...updateFields } = input;
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (updateFields.title !== undefined) updateData.title = updateFields.title;
      if (updateFields.description !== undefined) updateData.description = updateFields.description;
      if (updateFields.price !== undefined) updateData.price = updateFields.price;
      if (updateFields.status !== undefined) updateData.status = updateFields.status;
      if (updateFields.stock !== undefined) updateData.stock = updateFields.stock;
      if (updateFields.condition !== undefined) updateData.condition = updateFields.condition;
      if (updateFields.location !== undefined) updateData.location = updateFields.location;
      if (updateFields.brand !== undefined) updateData.brand = updateFields.brand;
      if (updateFields.model !== undefined) updateData.model = updateFields.model;
      if (updateFields.isFeatured !== undefined) updateData.isFeatured = updateFields.isFeatured;

      await db.update(listings).set(updateData).where(eq(listings.id, listingId));

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: 'admin_edit_listing',
        targetListingId: listingId,
        details: `Admin edited listing fields: ${Object.keys(updateFields).join(', ')}`,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Admin create a listing on behalf of any user
  adminCreateListingForUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      categoryId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      type: z.string().default('marketplace'),
      price: z.number().optional(),
      location: z.string().optional(),
      condition: z.string().optional(),
      stock: z.number().default(1),
      brand: z.string().optional(),
      model: z.string().optional(),
      status: z.string().default('active'),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      const result = await db.insert(listings).values({
        userId: input.userId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        type: input.type,
        price: input.price,
        location: input.location,
        condition: input.condition,
        stock: input.stock,
        brand: input.brand,
        model: input.model,
        status: input.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: 'admin_create_listing_for_user',
        targetUserId: input.userId,
        targetListingId: result[0]?.id,
        details: `Admin created listing "${input.title}" for user ID ${input.userId}`,
        timestamp: new Date(),
      });

      return { success: true, listing: result[0] };
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
      const targetUser = await db.select({ openId: users.openId }).from(users).where(eq(users.id, input.userId)).limit(1);

      await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      if (targetUser[0]?.openId) {
        await clerkClient.users.updateUserMetadata(targetUser[0].openId, {
          privateMetadata: { role: input.role }
        }).catch(console.error);
      }

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
      const targetUser = await db.select({ openId: users.openId, role: users.role }).from(users).where(eq(users.id, input.userId)).limit(1);
      const currentRole = targetUser[0]?.role;
      const newRole = currentRole === "user" ? "seller" : currentRole;

      await db.update(users)
        .set({ isVerified: true, verificationStatus: "verified", role: newRole as any, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      if (targetUser[0]?.openId && newRole !== currentRole) {
        await clerkClient.users.updateUserMetadata(targetUser[0].openId, {
          privateMetadata: { role: newRole }
        }).catch(console.error);
      }
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

      // Fetch the user's email and name for notifications
      const targetUser = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, submission[0].userId))
        .limit(1);
      const userEmail = targetUser[0]?.email || "";
      const userName = targetUser[0]?.name || "User";
      const verificationType = submission[0].type === "kyb" ? "KYB (Business)" : "KYC (Individual)";
      const appUrl = process.env.VITE_APP_URL || "https://sasto-ochre.vercel.app";

      if (input.status === "approved") {
        const currentUser = await db.select({ role: users.role, openId: users.openId }).from(users).where(eq(users.id, submission[0].userId)).limit(1);
        const currentRole = currentUser[0]?.role;
        const newRole = currentRole === "user" ? "seller" : currentRole;
        
        await db.update(users)
          .set({
            isVerified: true,
            verificationLevel: submission[0].type === "kyb" ? "pro" : "basic",
            verificationStatus: "verified",
            // Automatically upgrade 'user' role to 'seller' upon verification
            role: newRole as any,
            updatedAt: new Date(),
          })
          .where(eq(users.id, submission[0].userId));

        if (currentUser[0]?.openId && newRole !== currentRole) {
          await clerkClient.users.updateUserMetadata(currentUser[0].openId, {
            privateMetadata: { role: newRole }
          }).catch(console.error);
        }

        // In-app notification for approval
        await db.insert(notifications).values({
          userId: submission[0].userId,
          type: "verification_approved",
          title: "🎉 Verification Approved!",
          content: `Your ${verificationType} verification has been approved. You can now post listings and sell on Sasto Marketplace.`,
          isRead: false,
        });

        // Email notification for approval
        if (userEmail) {
          await emailService.sendEmail({
            to: userEmail,
            subject: "Verification Approved",
            template: "verification_approved",
            templateData: {
              userName,
              verificationType,
              marketplaceLink: `${appUrl}/marketplace`,
            },
            userId: submission[0].userId,
          });
        }
      } else {
        await db.update(users)
          .set({ verificationStatus: "rejected", updatedAt: new Date() })
          .where(eq(users.id, submission[0].userId));

        const rejectionReason = input.adminNotes || "Your documents did not meet our verification requirements.";

        // In-app notification for rejection
        await db.insert(notifications).values({
          userId: submission[0].userId,
          type: "verification_rejected",
          title: "❌ Verification Rejected",
          content: `Your ${verificationType} verification was rejected. Reason: ${rejectionReason}. Please re-submit your documents.`,
          isRead: false,
        });

        // Email notification for rejection
        if (userEmail) {
          await emailService.sendEmail({
            to: userEmail,
            subject: "Action Required: Verification Rejected",
            template: "verification_rejected",
            templateData: {
              userName,
              verificationType,
              rejectionReason,
              verificationLink: `${appUrl}/verify`,
            },
            userId: submission[0].userId,
          });
        }
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
          date: sql<string>`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`,
          revenue: sql<number>`sum(${transactions.amount})`,
          orders: sql<number>`count(${transactions.id})`,
        })
        .from(transactions)
        .where(gte(transactions.createdAt, thirtyDaysAgo))
        .groupBy(sql`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`);

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
