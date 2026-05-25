import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { eq, gte, lte, and, sql, desc, asc } from 'drizzle-orm';
import { listings, reviews, bookings, bids, auctions } from '../../drizzle/schema';

export const sellerAnalyticsRouter = router({
  // Get seller dashboard overview
  overview: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        const userId = ctx.user?.id;

        if (!userId) throw new Error('User not authenticated');

        // Total listings
        const totalListings = await db.query.listings.findMany({
          where: eq(listings.userId, userId),
          columns: { id: true },
        });

        // Active listings
        const activeListings = await db.query.listings.findMany({
          where: and(
            eq(listings.userId, userId),
            eq(listings.status, 'active')
          ),
          columns: { id: true },
        });

        // Total sales (completed bookings + sold auctions)
        const completedBookings = await db.query.bookings.findMany({
          where: and(
            eq(bookings.userId, userId),
            eq(bookings.status, 'completed')
          ),
          columns: { totalPrice: true },
        });

        // Get seller reviews
        const sellerReviews = await db.query.reviews.findMany({
          where: eq(reviews.toUserId, userId),
          columns: { rating: true },
        });

        const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const avgRating = sellerReviews.length > 0
          ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
          : 0;

        return {
          totalListings: totalListings.length,
          activeListings: activeListings.length,
          totalSales: completedBookings.length,
          totalRevenue,
          avgRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: sellerReviews.length,
        };
      } catch (error) {
        console.error('Seller overview error:', error);
        throw error;
      }
    }),

  // Get sales trends (last 30 days)
  salesTrends: protectedProcedure
    .input(z.object({
      days: z.number().int().positive().max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        const userId = ctx.user?.id;

        if (!userId) throw new Error('User not authenticated');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        // Get bookings within date range
        const bookingsData = await db.query.bookings.findMany({
          where: and(
            eq(bookings.userId, userId),
            gte(bookings.createdAt, startDate),
            eq(bookings.status, 'completed')
          ),
          columns: {
            createdAt: true,
            totalPrice: true,
          },
        });

        // Group by date
        const trendsByDate: Record<string, { sales: number; revenue: number }> = {};

        bookingsData.forEach((booking) => {
          const date = new Date(booking.createdAt).toISOString().split('T')[0];
          if (!trendsByDate[date]) {
            trendsByDate[date] = { sales: 0, revenue: 0 };
          }
          trendsByDate[date].sales += 1;
          trendsByDate[date].revenue += booking.totalPrice || 0;
        });

        // Convert to array sorted by date
        const trends = Object.entries(trendsByDate)
          .map(([date, data]) => ({
            date,
            sales: data.sales,
            revenue: data.revenue,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return trends;
      } catch (error) {
        console.error('Sales trends error:', error);
        throw error;
      }
    }),

  // Get top performing listings
  topListings: protectedProcedure
    .input(z.object({
      limit: z.number().int().positive().max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        const userId = ctx.user?.id;

        if (!userId) throw new Error('User not authenticated');

        const topListings = await db.query.listings.findMany({
          where: eq(listings.userId, userId),
          columns: {
            id: true,
            title: true,
            price: true,
            views: true,
            images: true,
            createdAt: true,
          },
          limit: input.limit,
          orderBy: desc(listings.views),
        });

        // Get review count for each listing
        const listingsWithReviews = await Promise.all(
          topListings.map(async (listing) => {
            const reviewCount = await db.query.reviews.findMany({
              where: eq(reviews.listingId, listing.id),
              columns: { id: true },
            });

            return {
              ...listing,
              reviewCount: reviewCount.length,
            };
          })
        );

        return listingsWithReviews;
      } catch (error) {
        console.error('Top listings error:', error);
        throw error;
      }
    }),

  // Get revenue breakdown by category
  revenueByCategory: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        const userId = ctx.user?.id;

        if (!userId) throw new Error('User not authenticated');

        // Get seller's listings with categories and bookings
        const sellerListings = await db.query.listings.findMany({
          where: eq(listings.userId, userId),
          with: {
            category: {
              columns: { name: true },
            },
          },
          columns: {
            id: true,
            categoryId: true,
          },
        });

        // Group revenue by category
        const revenueByCategory: Record<string, number> = {};

        for (const listing of sellerListings) {
          const categoryName = listing.category?.name || 'Other';

          const completedBookings = await db.query.bookings.findMany({
            where: and(
              eq(bookings.listingId, listing.id),
              eq(bookings.status, 'completed')
            ),
            columns: { totalPrice: true },
          });

          const categoryRevenue = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

          if (!revenueByCategory[categoryName]) {
            revenueByCategory[categoryName] = 0;
          }
          revenueByCategory[categoryName] += categoryRevenue;
        }

        return Object.entries(revenueByCategory).map(([category, revenue]) => ({
          category,
          revenue,
        }));
      } catch (error) {
        console.error('Revenue by category error:', error);
        throw error;
      }
    }),

  // Get customer reviews and ratings
  reviews: protectedProcedure
    .input(z.object({
      limit: z.number().int().positive().max(50).default(10),
      page: z.number().int().positive().default(1),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        const userId = ctx.user?.id;

        if (!userId) throw new Error('User not authenticated');

        const offset = (input.page - 1) * input.limit;

        const sellerReviews = await db.query.reviews.findMany({
          where: eq(reviews.toUserId, userId),
          with: {
            fromUser: {
              columns: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          limit: input.limit,
          offset,
          orderBy: desc(reviews.createdAt),
        });

        return sellerReviews;
      } catch (error) {
        console.error('Seller reviews error:', error);
        throw error;
      }
    }),

  // Get auction performance
  auctionStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        const userId = ctx.user?.id;

        if (!userId) throw new Error('User not authenticated');

        // Get seller's auctions
        const sellerAuctions = await db.query.auctions.findMany({
          with: {
            listing: {
              where: eq(listings.userId, userId),
              columns: { title: true, price: true },
            },
          },
        });

        // Filter only auctions for this seller's listings
        const sellerAuctionsList = sellerAuctions.filter(a => a.listing);

        const totalAuctions = sellerAuctionsList.length;
        const activeAuctions = sellerAuctionsList.filter(a => a.endTime > new Date()).length;
        const totalBids = await db.query.bids.findMany({
          with: {
            auction: {
              with: {
                listing: {
                  where: eq(listings.userId, userId),
                },
              },
            },
          },
        });

        const totalBidsCount = totalBids.filter((b: any) => b.auction?.listing).length;
        const avgBidsPerAuction = totalAuctions > 0 ? totalBidsCount / totalAuctions : 0;

        return {
          totalAuctions,
          activeAuctions,
          totalBids: totalBidsCount,
          avgBidsPerAuction: parseFloat(avgBidsPerAuction.toFixed(2)),
        };
      } catch (error) {
        console.error('Auction stats error:', error);
        throw error;
      }
    }),
});
