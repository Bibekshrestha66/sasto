import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { listings, auctions, bookings, reviews } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, count, sum, avg } from "drizzle-orm";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

const PROFESSIONAL_ROLES = ["seller", "dealer", "wholesaler", "distributor", "admin", "super_admin"];

function requireVerifiedSeller(ctx: any) {
  const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin";
  if (!PROFESSIONAL_ROLES.includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only professional seller accounts can perform this action." });
  }
  if (!ctx.user.isVerified && !isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your account must be verified to perform this action. Please complete KYC/KYB verification." });
  }
}


export const sellerRouter = router({
  // Get seller dashboard overview metrics
  getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get total listings count
    const totalListings = await db
      .select({ count: count() })
      .from(listings)
      .where(eq(listings.userId, userId));

    // Get active listings count
    const activeListings = await db
      .select({ count: count() })
      .from(listings)
      .where(and(eq(listings.userId, userId), eq(listings.status, "active")));

    // Get total sales (completed bookings/auctions)
    const totalSales = await db
      .select({ count: count() })
      .from(bookings)
      .innerJoin(listings, eq(bookings.listingId, listings.id))
      .where(
        and(
          eq(listings.userId, userId),
          eq(bookings.status, "completed")
        )
      );

    // Get total revenue
    const revenue = await db
      .select({ total: sum(bookings.totalPrice) })
      .from(bookings)
      .innerJoin(listings, eq(bookings.listingId, listings.id))
      .where(
        and(
          eq(listings.userId, userId),
          eq(bookings.status, "completed")
        )
      );

    // Get average rating
    const avgRating = await db
      .select({ average: avg(reviews.rating) })
      .from(reviews)
      .where(eq(reviews.toUserId, userId));

    // Get total reviews count
    const totalReviews = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.toUserId, userId));

    return {
      totalListings: totalListings[0]?.count || 0,
      activeListings: activeListings[0]?.count || 0,
      totalSales: totalSales[0]?.count || 0,
      totalRevenue: revenue[0]?.total || 0,
      averageRating: avgRating[0]?.average || 0,
      totalReviews: totalReviews[0]?.count || 0,
    };
  }),

  // Get seller's listings with pagination
  getListings: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        status: z.enum(["active", "inactive", "sold"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.limit;

      const whereConditions = [eq(listings.userId, userId)];
      if (input.status) {
        whereConditions.push(eq(listings.status, input.status));
      }

      const userListings = await db
        .select()
        .from(listings)
        .where(and(...whereConditions))
        .orderBy(desc(listings.createdAt))
        .limit(input.limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: count() })
        .from(listings)
        .where(and(...whereConditions));

      return {
        listings: userListings,
        total: totalCount[0]?.count || 0,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / input.limit),
      };
    }),

  // Get auction bids for seller's listings
  getAuctionBids: protectedProcedure
    .input(
      z.object({
        listingId: z.coerce.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the listing belongs to the seller
      const listing = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.userId, userId)
          )
        );

      if (!listing.length) {
        throw new Error("Listing not found or unauthorized");
      }

      // Get auction details
      const auctionDetails = await db
        .select()
        .from(auctions)
        .where(eq(auctions.listingId, input.listingId));

      return auctionDetails;
    }),

  // Get sales history
  getSalesHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.limit;

      const sales = await db
        .select()
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .where(
          and(
            eq(listings.userId, userId),
            input.startDate ? gte(bookings.createdAt, input.startDate) : undefined,
            input.endDate ? lte(bookings.createdAt, input.endDate) : undefined
          )
        )
        .orderBy(desc(bookings.createdAt))
        .limit(input.limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: count() })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .where(
          and(
            eq(listings.userId, userId),
            input.startDate ? gte(bookings.createdAt, input.startDate) : undefined,
            input.endDate ? lte(bookings.createdAt, input.endDate) : undefined
          )
        );

      return {
        sales,
        total: totalCount[0]?.count || 0,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / input.limit),
      };
    }),

  // Get seller reviews
  getReviews: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.limit;

      const sellerReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.toUserId, userId))
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: count() })
        .from(reviews)
        .where(eq(reviews.toUserId, userId));

      return {
        reviews: sellerReviews,
        total: totalCount[0]?.count || 0,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / input.limit),
      };
    }),

  // Update listing status
  updateListingStatus: protectedProcedure
    .input(
      z.object({
        listingId: z.coerce.number(),
        status: z.enum(["active", "inactive", "sold"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedSeller(ctx);
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the listing belongs to the seller
      const listing = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.userId, userId)
          )
        );

      if (!listing.length) {
        throw new Error("Listing not found or unauthorized");
      }

      await db
        .update(listings)
        .set({ status: input.status })
        .where(eq(listings.id, input.listingId));

      return { success: true };
    }),

  // Update listing price / deal
  updateListingPrice: protectedProcedure
    .input(
      z.object({
        listingId: z.coerce.number(),
        price: z.coerce.number(),
        originalPrice: z.coerce.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedSeller(ctx);
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the listing belongs to the seller
      const listing = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.userId, userId)
          )
        );

      if (!listing.length) {
        throw new Error("Listing not found or unauthorized");
      }

      let discount = null;
      if (input.originalPrice && input.originalPrice > input.price) {
        discount = Math.round(((input.originalPrice - input.price) / input.originalPrice) * 100);
      }

      await db
        .update(listings)
        .set({
          price: input.price,
          originalPrice: input.originalPrice,
          discount: discount,
          updatedAt: new Date()
        })
        .where(eq(listings.id, input.listingId));

      return { success: true };
    }),


  // Delete listing
  deleteListing: protectedProcedure
    .input(z.object({ listingId: z.coerce.number() }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedSeller(ctx);
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the listing belongs to the seller
      const listing = await db
        .select()
        .from(listings)
        .where(and(eq(listings.id, input.listingId), eq(listings.userId, userId)));

      if (!listing.length) {
        throw new Error("Listing not found or unauthorized");
      }

      await db.delete(listings).where(eq(listings.id, input.listingId));
      return { success: true };
    }),

  // Get sales analytics
  getSalesAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get daily sales data
      const dailySales = await db
        .select({
          createdAt: bookings.createdAt,
          totalPrice: bookings.totalPrice
        })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .where(
          and(
            eq(listings.userId, userId),
            gte(bookings.createdAt, startDate)
          )
        )
        .orderBy(bookings.createdAt);

      // Group by date and calculate totals
      const groupedData = dailySales.reduce(
        (acc: Record<string, { date: string; revenue: number; count: number }>, sale) => {
          const dateKey = sale.createdAt.toISOString().split("T")[0];
          if (!acc[dateKey]) {
            acc[dateKey] = { date: dateKey, revenue: 0, count: 0 };
          }
          acc[dateKey].revenue += sale.totalPrice || 0;
          acc[dateKey].count += 1;
          return acc;
        },
        {}
      );

      return Object.values(groupedData);
    }),

  // Get listing performance metrics
  getListingPerformance: protectedProcedure
    .input(z.object({ listingId: z.coerce.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the listing belongs to the seller
      const listing = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.userId, userId)
          )
        );

      if (!listing.length) {
        throw new Error("Listing not found or unauthorized");
      }

      // Get views count (mock - would need to track this)
      const views = Math.floor(Math.random() * 1000);

      // Get favorites count
      const favorites = Math.floor(Math.random() * 100);

      // Get inquiries count
      const inquiries = Math.floor(Math.random() * 50);

      return {
        listingId: input.listingId,
        views,
        favorites,
        inquiries,
        conversionRate: ((inquiries / views) * 100).toFixed(2),
      };
    }),
});
