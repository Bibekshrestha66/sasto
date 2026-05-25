// backend/routers/deals.ts
import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { listings, users, categories } from "../../drizzle/schema";
import { eq, and, gt, desc, or, isNotNull } from "drizzle-orm";

export const dealsRouter = router({
  // Get live deals for homepage and deals page
  getLiveDeals: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(24),
      sortBy: z.enum(["discount", "popular", "newest", "price-low", "price-high"]).default("discount"),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        // Base query: only show active listings with an originalPrice (meaning it's a deal)
        // Sorting
        const orderBy = input.sortBy === "discount" 
          ? desc(listings.discount) 
          : input.sortBy === "popular" 
            ? desc(listings.views) 
            : input.sortBy === "price-low"
              ? listings.price
              : input.sortBy === "price-high"
                ? desc(listings.price)
                : desc(listings.createdAt);

        const results = await db.select({
          id: listings.id,
          title: listings.title,
          currentPrice: listings.price,
          originalPrice: listings.originalPrice,
          discount: listings.discount,
          image: listings.images,
          createdAt: listings.createdAt,
          location: listings.location,
          condition: listings.condition,
          views: listings.views,
          seller: {
            id: users.id,
            name: users.name,
            rating: users.id, // placeholder for rating logic if needed
            verified: users.isVerified,
          },
          category: categories.name,
        })
        .from(listings)
        .leftJoin(users, eq(listings.userId, users.id))
        .leftJoin(categories, eq(listings.categoryId, categories.id))
        .where(
          and(
            eq(listings.status, "active"),
            isNotNull(listings.originalPrice)
          )
        )
        .orderBy(orderBy as any)
        .limit(input.limit);

        return results.map(r => ({
          ...r,
          currentPrice: Number(r.currentPrice),
          originalPrice: r.originalPrice ? Number(r.originalPrice) : undefined,
          discount: r.discount || 0,
          interested: (r.views || 0) + Math.floor(Math.random() * 50), // Mock interested for UI
          timeLeft: "2d 5h", // Mock time left
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          image: typeof r.image === 'string' ? (JSON.parse(r.image as string))[0] : (Array.isArray(r.image) ? r.image[0] : "https://picsum.photos/seed/deal/600/400"),
          seller: {
            name: r.seller?.name || "Seller",
            rating: 4.5,
            verified: !!r.seller?.verified
          }
        }));
      } catch (error) {
        console.error("Error fetching deals:", error);
        return [];
      }
    }),

  getDealById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [result] = await db.select({
        id: listings.id,
        title: listings.title,
        description: listings.description,
        currentPrice: listings.price,
        originalPrice: listings.originalPrice,
        discount: listings.discount,
        images: listings.images,
        createdAt: listings.createdAt,
        location: listings.location,
        condition: listings.condition,
        views: listings.views,
        seller: {
          id: users.id,
          name: users.name,
          rating: users.id,
          avatar: users.avatar,
          verified: users.isVerified,
        },
        category: categories.name,
      })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .where(eq(listings.id, input.id))
      .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      return {
        ...result,
        currentPrice: Number(result.currentPrice),
        originalPrice: result.originalPrice ? Number(result.originalPrice) : undefined,
        discount: result.discount || 0,
        interested: (result.views || 0) + 20,
        timeLeft: "2d 5h",
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        image: Array.isArray(result.images) && result.images[0] ? result.images[0] : "https://picsum.photos/seed/deal/600/400",
        seller: {
          ...result.seller,
          rating: 4.5,
        }
      };
    })
});
