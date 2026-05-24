import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { 
  getListings, getListingById, getUserListings, searchListings,
  getCategories, getSubcategories, getAllCategories,
  getAuctions, getAuctionById, getAuctionByListingId, getBidsForAuction,
  getConversations, getMessages,
  getUserReviews, getUserFavorites, isFavorited,
  getUserBookings, getListingBookings,
  getUserNotifications, getUserByEmail, getUserById, getCompanyConfig
} from "./db";
import { getDb } from "./db";
import { listings, categories, auctions, bids, messages, reviews, bookings, favorites, notifications, adminLogs, transactions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { encryptMessage } from "./_core/crypto";
import { getWebSocketManager } from "./websocket";
import { sellerRouter } from "./routers/seller";
import { adminRouter } from "./routers/admin";
import { rbacRouter } from "./routers/rbac";
import { adsRouter } from "./routers/ads";
import { emailsRouter } from "./routers/emails";
import { reviewsRouter } from "./routers/reviews";
import { rentalsRouter } from "./routers/rentals";
import { searchRouter } from "./routers/search";
import { sellerAnalyticsRouter } from "./routers/seller-analytics";
import { verificationRouter } from "./routers/verification";
import { cartRouter } from "./routers/cart";
import { returnsRouter } from "./routers/returns";

export const appRouter = router({
  system: systemRouter,
  search: searchRouter,
  cart: cartRouter,
  returns: returnsRouter,
  sellerAnalytics: sellerAnalyticsRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        // In a real app, use bcrypt to hash passwords
        if (!user || user.password !== input.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        console.log(`[Auth] Manual login successful for ${user.email} (Role: ${user.role}, OpenID: ${user.openId})`);

        const token = await sdk.createSessionToken(user.openId, { name: user.name || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return user;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Listings
  listings: router({
    list: publicProcedure
      .input(z.object({ 
        limit: z.number().default(20),
        offset: z.number().default(0),
        type: z.enum(["marketplace", "auction", "rental"]).optional()
      }))
      .query(async ({ input }) => {
        return getListings(input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getListingById(input);
      }),

    search: publicProcedure
      .input(z.object({
        searchQuery: z.string().optional(),
        query: z.string().optional(),
        limit: z.number().default(20),
        category: z.string().optional(),
        condition: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const q = input.searchQuery || input.query || "";
        return searchListings(q, input.limit);
      }),

    myListings: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserListings(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        categoryId: z.number(),
        type: z.enum(["marketplace", "auction", "rental"]),
        price: z.number().optional(),
        stock: z.number().optional().default(1),
        images: z.array(z.string()).optional(),
        location: z.string().optional(),
        condition: z.enum(["new", "like-new", "good", "fair"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(listings).values({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          title: input.title,
          description: input.description,
          type: input.type,
          price: input.price || null,
          stock: input.stock,
          images: input.images,
          location: input.location,
          condition: input.condition,
          status: "active",
        });

        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        type: z.enum(["marketplace", "auction", "rental"]).optional(),
        price: z.number().optional(),
        stock: z.number().optional(),
        status: z.enum(["active", "sold", "expired", "closed"]).optional(),
        images: z.array(z.string()).optional(),
        location: z.string().optional(),
        condition: z.enum(["new", "like-new", "good", "fair"]).optional(),
        originalPrice: z.number().optional(),
        district: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const listing = await getListingById(input.id);
        if (!listing || listing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        const result = await db.update(listings)
          .set({
            title: input.title !== undefined ? input.title : listing.title,
            description: input.description !== undefined ? input.description : listing.description,
            categoryId: input.categoryId !== undefined ? input.categoryId : listing.categoryId,
            type: input.type !== undefined ? input.type : listing.type,
            price: input.price !== undefined ? input.price : listing.price,
            stock: input.stock !== undefined ? input.stock : listing.stock,
            status: input.status !== undefined ? input.status : listing.status,
            images: input.images !== undefined ? input.images : listing.images,
            location: input.location !== undefined ? input.location : listing.location,
            condition: input.condition !== undefined ? input.condition : listing.condition,
            originalPrice: input.originalPrice !== undefined ? input.originalPrice : listing.originalPrice,
            district: input.district !== undefined ? input.district : listing.district,
            brand: input.brand !== undefined ? input.brand : listing.brand,
            model: input.model !== undefined ? input.model : listing.model,
            color: input.color !== undefined ? input.color : listing.color,
            updatedAt: new Date(),
          })
          .where(eq(listings.id, input.id));

        return result;
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const listing = await getListingById(input);
        if (!listing || listing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        return db.delete(listings).where(eq(listings.id, input));
      }),
  }),

  // Users
  users: router({
    getProfile: publicProcedure
      .input(z.object({ userId: z.union([z.number(), z.string()]) }))
      .query(async ({ input }) => {
        const idNum = typeof input.userId === 'string' ? parseInt(input.userId, 10) : input.userId;
        if (isNaN(idNum)) return null;
        return getUserById(idNum);
      })
  }),

  // Categories
  categories: router({
    list: publicProcedure
      .input(z.object({ sector: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getCategories(input?.sector);
      }),

    getSubcategories: publicProcedure
      .input(z.object({ 
        parentId: z.number(),
        sector: z.string().optional()
      }))
      .query(async ({ input }) => {
        return getSubcategories(input.parentId, input.sector);
      }),

    getAll: publicProcedure
      .query(async () => {
        return getAllCategories();
      }),
  }),

  // Auctions
  auctions: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return getAuctions(input.limit);
      }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getAuctionById(input);
      }),

    getByListingId: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getAuctionByListingId(input);
      }),

    getBids: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getBidsForAuction(input);
      }),

    placeBid: protectedProcedure
      .input(z.object({
        auctionId: z.number(),
        amount: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const auction = await getAuctionById(input.auctionId);
        if (!auction) throw new Error("Auction not found");

        const result = await db.insert(bids).values({
          auctionId: input.auctionId,
          bidderId: ctx.user.id,
          amount: input.amount,
        }).returning();

        return result;
      }),

    myBids: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // We fetch the user's bids and join with the auction & listing details
        const res = await db.query.bids.findMany({
          where: eq(bids.bidderId, ctx.user.id),
          with: {
            auction: {
              with: {
                listing: true
              }
            }
          }
        });
        
        // Map the results to match the frontend expectations
        return res.map((bid: any) => ({
          id: bid.id,
          auctionId: bid.auctionId,
          auctionTitle: bid.auction?.listing?.title || "Unknown",
          image: bid.auction?.listing?.images?.[0] || "",
          amount: bid.amount,
          currentHighestBid: bid.auction?.currentHighestBid,
          endTime: bid.auction?.endTime,
          createdAt: bid.createdAt,
        }));
      }),
  }),

  // Messages
  messages: router({
    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        return getConversations(ctx.user.id);
      }),

    getMessages: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        return getMessages(ctx.user.id, input);
      }),

    send: protectedProcedure
      .input(z.object({
        recipientId: z.number(),
        content: z.string(),
        listingId: z.number().nullish(),
        attachmentUrl: z.string().nullish(),
        attachmentType: z.string().nullish(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(messages).values({
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          content: encryptMessage(input.content),
          listingId: input.listingId,
          attachmentUrl: input.attachmentUrl || null,
          attachmentType: input.attachmentType || null,
          createdAt: new Date(),
        }).returning();

        // Broadcast via WebSocket
        try {
          const wsManager = getWebSocketManager();
          wsManager.notifyMessage({
            id: result[0].id,
            senderId: ctx.user.id,
            recipientId: input.recipientId,
            content: input.content,
            timestamp: new Date(),
            conversationId: [ctx.user.id, input.recipientId].sort().join('-'),
            attachmentUrl: input.attachmentUrl || undefined,
            attachmentType: input.attachmentType || undefined,
          });
        } catch (e) {
          console.error("Failed to broadcast message via WebSocket:", e);
        }

        return result;
      }),
  }),

  // Inline reviews (simple)
  inlineReviews: router({
    getUserReviews: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getUserReviews(input);
      }),

    create: protectedProcedure
      .input(z.object({
        toUserId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        listingId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(reviews).values({
          fromUserId: ctx.user.id,
          toUserId: input.toUserId,
          rating: input.rating,
          comment: input.comment,
          listingId: input.listingId,
        });

        return result;
      }),
  }),

  // Favorites
  favorites: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserFavorites(ctx.user.id);
      }),

    isFavorited: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        return isFavorited(ctx.user.id, input);
      }),

    add: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(favorites).values({
          userId: ctx.user.id,
          listingId: input,
        });

        return result;
      }),

    remove: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        return db.delete(favorites)
          .where(eq(favorites.listingId, input));
      }),
  }),

  // Bookings
  bookings: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserBookings(ctx.user.id);
      }),

    getListingBookings: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const booking = await getListingBookings(input);
        return booking;
      }),

    create: protectedProcedure
      .input(z.object({
        listingId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        totalPrice: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(bookings).values({
          listingId: input.listingId,
          userId: ctx.user.id,
          startDate: input.startDate,
          endDate: input.endDate,
          totalPrice: input.totalPrice,
          status: "pending",
        }).returning({ id: bookings.id });

        const bookingId = result[0].id;

        // Fetch the listing to get the sellerId
        const listing = await getListingById(input.listingId);
        const sellerId = listing?.userId;

        // Fetch commission rate from company config
        const config = await getCompanyConfig();
        const rate = config.commissionRate || 0; // Default to 0 if not set

        // Record a transaction for financial reporting
        const amount = input.totalPrice;
        const platformFee = (amount * rate) / 100; // commission is a percentage
        await db.insert(transactions).values({
          buyerId: ctx.user.id,
          sellerId: sellerId,
          listingId: input.listingId,
          orderId: `BOOK-${bookingId}`,
          amount: amount,
          platformFee: platformFee,
          netAmount: amount - platformFee,
          status: "completed",
          transactionType: "rental",
        });

        return result;
      }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserNotifications(ctx.user.id);
      }),
  }),

  // Seller Dashboard
  seller: sellerRouter,

  // Admin Dashboard
  admin: adminRouter,

  // RBAC Management
  rbac: rbacRouter,

  // Ads & Monetization
  ads: adsRouter,

  // Email Notifications
  emails: emailsRouter,

  // Reviews & Ratings
  reviews: reviewsRouter,

  // Rentals
  rentals: rentalsRouter,
  
  // KYC/KYB Verification
  verification: verificationRouter,
});

export type AppRouter = typeof appRouter;
