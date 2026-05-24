import { z } from "zod";
import { sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb, getActivePaymentGateways } from "../db";
import { 
  advertisers, 
  manualAds, 
  adAnalytics, 
  adsensePlacements, 
  adPayments,
  listings,
  users,
  sponsoredAdPricing,
  promotionRequests,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc, gt, isNotNull } from "drizzle-orm";

export const adsRouter = router({
  // ─────────────────────────────────────────────
  // FEATURED LISTINGS (Sponsored Carousel)
  // ─────────────────────────────────────────────

  /** Public — returns all isFeatured=true listings whose featuredUntil > now */
  getFeaturedListings: publicProcedure.query(async () => {
    const db = await getDb();
    const now = new Date();

    const rows = await db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        originalPrice: listings.originalPrice,
        images: listings.images,
        location: listings.location,
        district: listings.district,
        condition: listings.condition,
        type: listings.type,
        views: listings.views,
        featuredUntil: listings.featuredUntil,
        sellerName: users.name,
        sellerAvatar: users.avatar,
      })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .where(
        and(
          eq(listings.isFeatured, true),
          eq(listings.status, "active"),
          gt(listings.featuredUntil, now),
        )
      )
      .orderBy(desc(listings.featuredUntil))
      .limit(10);

    return rows;
  }),

  /** Public — get sponsored pricing tiers */
  getSponsoredPricing: publicProcedure.query(async () => {
    const db = await getDb();
    const tiers = await db
      .select()
      .from(sponsoredAdPricing)
      .where(eq(sponsoredAdPricing.isActive, true))
      .orderBy(sponsoredAdPricing.priceNPR);
    
    // Seed default tiers if none exist
    if (tiers.length === 0) {
      await db.insert(sponsoredAdPricing).values([
        { tier: "basic", durationDays: 7, priceNPR: 299, description: "7 days — Basic visibility boost", maxSlots: 20, isActive: true },
        { tier: "standard", durationDays: 15, priceNPR: 499, description: "15 days — Standard featured placement", maxSlots: 10, isActive: true },
        { tier: "premium", durationDays: 30, priceNPR: 999, description: "30 days — Premium top-of-page spotlight", maxSlots: 5, isActive: true },
      ]);
      return db.select().from(sponsoredAdPricing).where(eq(sponsoredAdPricing.isActive, true)).orderBy(sponsoredAdPricing.priceNPR);
    }
    return tiers;
  }),

  /** Public — get active payment gateways */
  getActiveGateways: publicProcedure.query(async () => {
    return getActivePaymentGateways();
  }),

  /** Protected — seller submits a promotion request */
  promoteListing: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      tier: z.enum(["basic", "standard", "premium"]),
      paymentMethod: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Verify listing belongs to this user
      const [listing] = await db.select().from(listings)
        .where(and(eq(listings.id, input.listingId), eq(listings.userId, ctx.user.id)))
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found or not yours" });
      }

      // Check for existing pending request
      const [existing] = await db.select().from(promotionRequests)
        .where(and(
          eq(promotionRequests.listingId, input.listingId),
          eq(promotionRequests.status, "pending")
        )).limit(1);

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "A promotion request is already pending for this listing" });
      }

      // Get pricing
      const [pricing] = await db.select().from(sponsoredAdPricing)
        .where(and(eq(sponsoredAdPricing.tier, input.tier), eq(sponsoredAdPricing.isActive, true)))
        .limit(1);

      if (!pricing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pricing tier not found" });
      }

      let paymentUrl = "";
      let paymentProviderId = "";

      if (input.paymentMethod) {
        const gateways = await getActivePaymentGateways();
        const gateway = gateways.find(g => g.name === input.paymentMethod);
        if (!gateway) {
           throw new TRPCError({ code: "BAD_REQUEST", message: "Selected payment gateway is not active or invalid" });
        }
        
        // Generate a mock payment URL using the configured API details
        // In a real scenario, this would make a server-to-server HTTP request to gateway.endpoint
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        paymentProviderId = transactionId;
        
        // Mock payment URL
        paymentUrl = `/wallet-checkout?amount=${pricing.priceNPR}&transactionId=${transactionId}&gateway=${gateway.name}`;
      }

      const result = await db.insert(promotionRequests).values({
        listingId: input.listingId,
        userId: ctx.user.id,
        tier: input.tier,
        durationDays: pricing.durationDays,
        priceNPR: pricing.priceNPR,
        status: "pending",
        paymentStatus: "unpaid",
        paymentProviderId: paymentProviderId || undefined,
        paymentUrl: paymentUrl || undefined,
      }).returning();

      return { 
        success: true, 
        requestId: result[0].id, 
        price: pricing.priceNPR,
        paymentUrl: paymentUrl || undefined
      };
    }),

  /** Public — Webhook to handle payment success from wallet providers */
  walletWebhook: publicProcedure
    .input(z.object({
      transactionId: z.string(),
      status: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // In a real scenario, we would verify the signature/secret of the webhook request here
      // using the apiSecret from the paymentGateways table.
      
      if (input.status === "SUCCESS" || input.status === "COMPLETED" || input.status === "paid") {
        const [request] = await db.select().from(promotionRequests)
          .where(eq(promotionRequests.paymentProviderId, input.transactionId))
          .limit(1);

        if (!request) {
           throw new TRPCError({ code: "NOT_FOUND", message: "Promotion request not found for this transaction" });
        }

        // Update the payment status but do NOT auto-feature it
        // The admin will verify and approve the ads manually
        await db.update(promotionRequests).set({
          paymentStatus: "paid",
          updatedAt: new Date(),
        }).where(eq(promotionRequests.id, request.id));
        
        return { success: true };
      }
      
      return { success: false, message: "Payment not successful" };
    }),

  // ─────────────────────────────────────────────
  // ADMIN — Sponsored Ads Management
  // ─────────────────────────────────────────────

  /** Admin — get all promotion requests with listing details */
  adminGetPromotionRequests: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();

      const rows = await db
        .select({
          id: promotionRequests.id,
          listingId: promotionRequests.listingId,
          listingTitle: listings.title,
          listingImages: listings.images,
          listingType: listings.type,
          userId: promotionRequests.userId,
          sellerName: users.name,
          tier: promotionRequests.tier,
          durationDays: promotionRequests.durationDays,
          priceNPR: promotionRequests.priceNPR,
          status: promotionRequests.status,
          paymentStatus: promotionRequests.paymentStatus,
          adminNotes: promotionRequests.adminNotes,
          featuredUntil: promotionRequests.featuredUntil,
          createdAt: promotionRequests.createdAt,
        })
        .from(promotionRequests)
        .leftJoin(listings, eq(promotionRequests.listingId, listings.id))
        .leftJoin(users, eq(promotionRequests.userId, users.id))
        .orderBy(desc(promotionRequests.createdAt));

      if (input.status) {
        return rows.filter(r => r.status === input.status);
      }
      return rows;
    }),

  /** Admin — approve or reject a promotion request */
  adminReviewPromotion: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      action: z.enum(["approve", "reject"]),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();

      const [request] = await db.select().from(promotionRequests)
        .where(eq(promotionRequests.id, input.requestId)).limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      if (input.action === "approve") {
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + request.durationDays);

        await db.update(promotionRequests).set({
          status: "approved",
          adminNotes: input.adminNotes,
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          featuredUntil,
          updatedAt: new Date(),
        }).where(eq(promotionRequests.id, input.requestId));

        // Set listing as featured
        await db.update(listings).set({
          isFeatured: true,
          featuredUntil: featuredUntil,
          updatedAt: new Date(),
        }).where(eq(listings.id, request.listingId));

        return { success: true, message: "Listing is now featured!" };
      } else {
        await db.update(promotionRequests).set({
          status: "rejected",
          adminNotes: input.adminNotes,
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(promotionRequests.id, input.requestId));

        return { success: true, message: "Request rejected" };
      }
    }),

  /** Admin — manually toggle isFeatured on any listing */
  adminSetFeatured: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      isFeatured: z.boolean(),
      durationDays: z.number().default(7),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();

      const featuredUntil = input.isFeatured
        ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
        : null;

      await db.update(listings).set({
        isFeatured: input.isFeatured,
        featuredUntil: featuredUntil,
        updatedAt: new Date(),
      }).where(eq(listings.id, input.listingId));

      return { success: true };
    }),

  /** Admin — set or update a pricing tier */
  adminSetSponsoredPricing: protectedProcedure
    .input(z.object({
      tier: z.enum(["basic", "standard", "premium"]),
      durationDays: z.number().int().positive(),
      priceNPR: z.number().positive(),
      description: z.string().optional(),
      maxSlots: z.number().int().positive().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();

      const [existing] = await db.select().from(sponsoredAdPricing)
        .where(eq(sponsoredAdPricing.tier, input.tier)).limit(1);

      if (existing) {
        await db.update(sponsoredAdPricing).set({
          durationDays: input.durationDays,
          priceNPR: input.priceNPR,
          description: input.description,
          maxSlots: input.maxSlots ?? existing.maxSlots,
          isActive: input.isActive ?? existing.isActive,
          updatedAt: new Date(),
        }).where(eq(sponsoredAdPricing.tier, input.tier));
      } else {
        await db.insert(sponsoredAdPricing).values({
          tier: input.tier,
          durationDays: input.durationDays,
          priceNPR: input.priceNPR,
          description: input.description,
          maxSlots: input.maxSlots ?? 10,
          isActive: input.isActive ?? true,
        });
      }

      return { success: true };
    }),

  /** Admin — get all currently featured listings */
  adminGetFeaturedListings: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const db = await getDb();

    return db.select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      images: listings.images,
      type: listings.type,
      isFeatured: listings.isFeatured,
      featuredUntil: listings.featuredUntil,
      sellerName: users.name,
    })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .where(eq(listings.isFeatured, true))
      .orderBy(desc(listings.featuredUntil));
  }),

  // ─────────────────────────────────────────────
  // ORIGINAL PROCEDURES (kept as-is)
  // ─────────────────────────────────────────────

  registerAdvertiser: protectedProcedure
    .input(z.object({
      businessName: z.string().min(1),
      businessUrl: z.string().url().optional(),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const existing = await db.select().from(advertisers).where(eq(advertisers.userId, ctx.user.id)).limit(1);
      if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Advertiser account already exists" });
      const result = await db.insert(advertisers).values({
        userId: ctx.user.id,
        businessName: input.businessName,
        businessUrl: input.businessUrl,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: "pending",
        accountBalance: 0,
      }).returning();
      return { success: true, id: result[0].id };
    }),

  getAdvertiserProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const profile = await db.select().from(advertisers).where(eq(advertisers.userId, ctx.user.id)).limit(1);
    return profile[0] || null;
  }),

  createManualAd: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      imageUrl: z.string().url(),
      landingUrl: z.string().url(),
      adType: z.enum(["banner", "sidebar", "featured", "popup"]),
      placement: z.enum(["homepage_top", "homepage_middle", "homepage_bottom", "sidebar_left", "sidebar_right", "category_page", "listing_detail", "search_results"]),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      dailyBudget: z.number().positive(),
      totalBudget: z.number().positive(),
      costPerImpression: z.number().positive(),
      costPerClick: z.number().positive(),
      targetAudience: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const advertiser = await db.select().from(advertisers).where(eq(advertisers.userId, ctx.user.id)).limit(1);
      if (!advertiser.length) throw new TRPCError({ code: "NOT_FOUND", message: "Advertiser profile not found" });
      const result = await db.insert(manualAds).values({
        advertiserId: advertiser[0].id,
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        landingUrl: input.landingUrl,
        adType: input.adType,
        placement: input.placement,
        startDate: input.startDate,
        endDate: input.endDate,
        dailyBudget: input.dailyBudget,
        totalBudget: input.totalBudget,
        costPerImpression: input.costPerImpression,
        costPerClick: input.costPerClick,
        targetAudience: input.targetAudience ? JSON.stringify(input.targetAudience) : null,
        status: "pending",
      }).returning();
      return { success: true, id: result[0].id };
    }),

  getAdvertiserAds: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const advertiser = await db.select().from(advertisers).where(eq(advertisers.userId, ctx.user.id)).limit(1);
    if (!advertiser.length) return [];
    return db.select().from(manualAds).where(eq(manualAds.advertiserId, advertiser[0].id)).orderBy(desc(manualAds.createdAt));
  }),

  getActiveAds: publicProcedure
    .input(z.object({ placement: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const now = new Date();
      const conditions = [eq(manualAds.status, "active"), lte(manualAds.startDate, now), gte(manualAds.endDate, now)];
      if (input.placement) conditions.push(eq(manualAds.placement, input.placement));
      return db.select().from(manualAds).where(and(...conditions)).limit(10);
    }),

  recordAdImpression: publicProcedure
    .input(z.object({ adId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(manualAds).set({ impressions: sql`${manualAds.impressions} + 1` }).where(eq(manualAds.id, input.adId));
      const today = new Date().toISOString().split("T")[0];
      const existing = await db.select().from(adAnalytics).where(and(eq(adAnalytics.adId, input.adId), eq(adAnalytics.date, today))).limit(1);
      if (existing.length) {
        await db.update(adAnalytics).set({ impressions: sql`${adAnalytics.impressions} + 1` }).where(eq(adAnalytics.id, existing[0].id));
      } else {
        await db.insert(adAnalytics).values({ adId: input.adId, date: today, impressions: 1, clicks: 0, conversions: 0, spend: 0, revenue: 0 });
      }
      return { success: true };
    }),

  recordAdClick: publicProcedure
    .input(z.object({ adId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(manualAds).set({ clicks: sql`${manualAds.clicks} + 1` }).where(eq(manualAds.id, input.adId));
      return { success: true };
    }),

  getAdsensePlacements: publicProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(adsensePlacements).where(eq(adsensePlacements.status, "active"));
  }),

  getAdAnalytics: protectedProcedure
    .input(z.object({ adId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const ad = await db.select().from(manualAds).where(eq(manualAds.id, input.adId)).limit(1);
      if (!ad.length) throw new TRPCError({ code: "NOT_FOUND" });
      const advertiser = await db.select().from(advertisers).where(eq(advertisers.id, ad[0].advertiserId)).limit(1);
      if (!advertiser.length || advertiser[0].userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return db.select().from(adAnalytics).where(eq(adAnalytics.adId, input.adId)).orderBy(desc(adAnalytics.date));
    }),

  addFunds: protectedProcedure
    .input(z.object({
      amount: z.number().positive(),
      paymentMethod: z.enum(["stripe", "bank_transfer", "paypal", "wallet"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const advertiser = await db.select().from(advertisers).where(eq(advertisers.userId, ctx.user.id)).limit(1);
      if (!advertiser.length) throw new TRPCError({ code: "NOT_FOUND", message: "Advertiser profile not found" });
      const result = await db.insert(adPayments).values({
        advertiserId: advertiser[0].id,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        status: "pending",
        description: "Add funds to advertising account",
      }).returning();
      return { success: true, id: result[0].id };
    }),

  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const advertiser = await db.select().from(advertisers).where(eq(advertisers.userId, ctx.user.id)).limit(1);
    if (!advertiser.length) return [];
    return db.select().from(adPayments).where(eq(adPayments.advertiserId, advertiser[0].id)).orderBy(desc(adPayments.createdAt));
  }),
});
