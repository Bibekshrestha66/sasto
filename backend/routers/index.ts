import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { getSessionCookieOptions } from "../_core/cookies";
import { systemRouter } from "../_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { 
  getListings, getListingById, getUserListings, searchListings,
  getCategories, getSubcategories,
  getAuctions, getAuctionById, getAuctionByListingId, getBidsForAuction,
  getConversations, getMessages,
  getUserReviews, getUserFavorites, isFavorited,
  getUserBookings, getListingBookings,
  getUserNotifications, getUserByEmail, getUserById,
  getUserTransactions, getSellerTransactions, createTransaction
} from "../db";
import { authService } from "../_core/authService";
import { emailService } from "../_core/emailService";
import { getWebSocketManager } from "../websocket";
import { getDb, db } from "../db";
import { users, listings, categories, auctions, bids, messages, reviews, bookings, favorites, notifications, adminLogs, transactions, carts, cartItems, companyConfigs } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { encryptMessage } from "../_core/crypto";
import { sellerRouter } from "./seller";
import { adminRouter } from "./admin";
import { rbacRouter } from "./rbac";
import { adsRouter } from "./ads";
import { emailsRouter } from "./emails";
import "dotenv/config";
import { reviewsRouter } from "./reviews";
import { rentalsRouter } from "./rentals";
import { searchRouter } from "./search";
import { sellerAnalyticsRouter } from "./seller-analytics";
import { dealsRouter } from "./deals";
import { verificationRouter } from "./verification";
import { cartRouter } from "./cart";
import { inngest } from "../inngest/client";

export const appRouter = router({
  system: systemRouter,
  cart: cartRouter,
  search: searchRouter,
  sellerAnalytics: sellerAnalyticsRouter,
  verification: verificationRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      console.log(`[Auth] me query called, User: ${opts.ctx.user?.email || 'Guest'}`);
      return opts.ctx.user;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
        businessName: z.string().optional(),
        businessLicense: z.string().optional(),
        experienceYears: z.number().optional(),
        specialties: z.string().optional(),
        socialLinks: z.string().optional(),
        bannerImage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(users)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
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

    getByUserId: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getUserListings(input);
      }),

    getFeatured: publicProcedure
      .input(z.object({ limit: z.number().default(8) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const now = new Date();
        const featured = await db
          .select()
          .from(listings)
          .where(eq(listings.isFeatured, true))
          .orderBy(desc(listings.createdAt))
          .limit(input.limit);
        return featured;
      }),

    promoteListing: protectedProcedure
      .input(z.object({
        listingId: z.number(),
        durationDays: z.number().default(7),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify ownership
        const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId));
        if (!listing || listing.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your listing" });
        }

        const featuredUntil = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);
        await db.update(listings).set({ isFeatured: true, featuredUntil, updatedAt: new Date() }).where(eq(listings.id, input.listingId));
        return { success: true, featuredUntil };
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        categoryId: z.number(),
        type: z.enum(["marketplace", "auction", "rental"]),
        price: z.number().optional(),
        originalPrice: z.number().optional(),
        images: z.array(z.string()).optional(),
        location: z.string().optional(),
        district: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        color: z.string().optional(),
        condition: z.enum(["new", "like-new", "good", "fair"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Permission check: only verified professional roles or admins
        const allowedRoles = ["seller", "dealer", "wholesaler", "distributor"];
        const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin";
        const isAllowedRole = allowedRoles.includes(ctx.user.role);
        
        if (!isAdmin && (!isAllowedRole || !ctx.user.isVerified)) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Only verified Sellers, Dealers, Wholesalers, and Distributors can post listings." 
          });
        }

        const result = await db.insert(listings).values({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          title: input.title,
          description: input.description,
          type: input.type,
          price: input.price ?? null,
          originalPrice: input.originalPrice ?? null,
          discount: (input.originalPrice && input.price && input.originalPrice > input.price) 
            ? Math.round(((input.originalPrice - input.price) / input.originalPrice) * 100) 
            : null,
          images: input.images,
          location: input.location,
          district: input.district,
          brand: input.brand,
          model: input.model,
          color: input.color,
          condition: input.condition,
          status: "active",
        }).returning();

        // Fire Inngest background job for listing created
        const newListing = result[0];
        if (newListing) {
          await inngest.send({
            name: "listing/change",
            data: { action: "created", listingId: newListing.id, title: newListing.title, userId: ctx.user.id },
          });
          // Also queue a welcome / listing-published email
          await inngest.send({
            name: "email/queued",
            data: { reason: "listing_created", listingId: newListing.id },
          });

          // If this is an auction listing, create the auction record and trigger the Inngest auction close scheduler
          if (newListing.type === "auction") {
            const startingPrice = newListing.price ? Number(newListing.price) : 0;
            // Default auction duration of 7 days if not specified
            const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const [newAuction] = await db.insert(auctions).values({
              listingId: newListing.id,
              startingPrice: startingPrice.toString(),
              currentBid: startingPrice.toString(),
              endTime,
              status: "active",
            }).returning();

            if (newAuction) {
              await inngest.send({
                name: "auction/created",
                data: { auctionId: newAuction.id, endTime: endTime.toISOString() },
              });
            }
          }
        }

        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        status: z.enum(["active", "sold", "expired", "closed"]).optional(),
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
            title: input.title || listing.title,
            description: input.description || listing.description,
            price: input.price || listing.price,
            status: input.status || listing.status,
            updatedAt: new Date(),
          })
          .where(eq(listings.id, input.id));

        // Fire Inngest background job for listing updated
        await inngest.send({
          name: "listing/change",
          data: { action: "updated", listingId: input.id, title: input.title || listing.title, userId: ctx.user.id },
        });

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

        await db.delete(listings).where(eq(listings.id, input));

        // Fire Inngest background job for listing deleted
        await inngest.send({
          name: "listing/change",
          data: { action: "deleted", listingId: input, title: listing.title, userId: ctx.user.id },
        });

        return { success: true };
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
        if (!auction) throw new TRPCError({ code: "NOT_FOUND", message: "Auction not found" });

        const result = await db.insert(bids).values({
          auctionId: input.auctionId,
          bidderId: ctx.user.id,
          amount: input.amount,
        }).returning();

        // Broadcast via WebSocket
        try {
          const wsManager = getWebSocketManager();
          wsManager.broadcastBid({
            auctionId: input.auctionId,
            listingId: auction.listingId,
            currentBid: input.amount,
            highestBidderId: ctx.user.id,
            bidderId: ctx.user.id,
            bidderName: ctx.user.name || "A user",
            timestamp: new Date(),
          });
        } catch (e) {
          console.error("Failed to broadcast bid via WebSocket:", e);
        }

        return result;
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
        listingId: z.number().optional(),
        attachmentUrl: z.string().optional(),
        attachmentType: z.string().optional(),
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

        // Send email notification to recipient
        try {
          const recipient = await getUserById(input.recipientId);
          if (recipient && recipient.email) {
            await emailService.sendEmail({
              to: recipient.email,
              subject: `New message from ${ctx.user.name}`,
              template: "new_message",
              templateData: {
                senderName: ctx.user.name || "A user",
                messagePreview: input.content.substring(0, 50) + (input.content.length > 50 ? "..." : ""),
                messageLink: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/messages`
              },
              userId: recipient.id
            });
          }
        } catch (e) {
          console.error("Failed to send message notification email:", e);
        }

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
        });

        return result;
      }),
  }),

  // Transactions (Orders)
  transactions: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserTransactions(ctx.user.id);
      }),

    listSellerOrders: protectedProcedure
      .query(async ({ ctx }) => {
        return getSellerTransactions(ctx.user.id);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        orderId: z.string(),
        status: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const existing = await db.select().from(transactions).where(eq(transactions.orderId, input.orderId));
        if (existing.length === 0) throw new Error("Order not found");
        const order = existing[0];

        // Ensure current user is the seller
        if (order.sellerId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        if (!order.buyerId || !order.listingId) {
          throw new Error("Invalid order data");
        }

        // Build status timestamp update
        const now = new Date();
        const statusTimestamps: Record<string, Date | undefined> = {
          processedAt: input.status === "processing" ? now : undefined,
          shippedAt: input.status === "shipped" ? now : undefined,
          deliveredAt: input.status === "delivered" ? now : undefined,
        };
        // Only include defined fields
        const timestampUpdate: any = { status: input.status, updatedAt: now };
        if (statusTimestamps.processedAt) timestampUpdate.processedAt = statusTimestamps.processedAt;
        if (statusTimestamps.shippedAt) timestampUpdate.shippedAt = statusTimestamps.shippedAt;
        if (statusTimestamps.deliveredAt) timestampUpdate.deliveredAt = statusTimestamps.deliveredAt;

        const result = await db.update(transactions)
          .set(timestampUpdate)
          .where(eq(transactions.orderId, input.orderId))
          .returning();

        // Get listing title for notification
        const listing = await db.select().from(listings).where(eq(listings.id, order.listingId));
        const listingTitle = listing[0]?.title || "Product";

        // Create notification for the buyer
        await db.insert(notifications).values({
          userId: order.buyerId,
          type: "sale",
          title: `Delivery Update: ${input.status.toUpperCase()}`,
          content: `Your order for "${listingTitle}" (ID: ${order.orderId}) is now ${input.status}.`,
          relatedId: order.id,
          isRead: false,
        });

        // Broadcast to buyer via websocket
        try {
          const wsManager = getWebSocketManager();
          wsManager.notifyOrder(order.buyerId, {
            type: "order-status-update",
            orderId: order.orderId,
            status: input.status,
            title: `Order Status: ${input.status}`,
            content: `Your order for "${listingTitle}" is now ${input.status}.`,
          });
        } catch (e) {
          console.error("Failed to emit order status WS:", e);
        }

        // Send tracking update email to buyer
        try {
          const buyer = await getUserById(order.buyerId);
          if (buyer && buyer.email) {
            await emailService.sendEmail({
              to: buyer.email,
              subject: `Order Update: ${input.status} - ${order.orderId}`,
              template: "order_buyer_confirmation", // fallback template name
              templateData: {
                orderId: order.orderId,
                listingTitle: listingTitle,
                amount: (order.amount + (order.deliveryFee || 0)).toLocaleString(),
                deliverySpeed: order.deliverySpeed,
                deliveryFee: order.deliveryFee || 0,
                estDeliveryDate: order.estDeliveryDate,
                deliveryName: order.deliveryName,
                deliveryAddress: order.deliveryAddress,
                deliveryPhone: order.deliveryPhone,
                paymentMethod: order.paymentMethod,
                statusUpdate: `Status changed to: ${input.status}`,
              },
              userId: buyer.id,
            });
          }
        } catch (e) {
          console.error("Failed to send tracking update email:", e);
        }

        return result;
      }),

    checkoutCart: protectedProcedure
      .input(z.object({
        paymentMethod: z.string(),
        deliveryName: z.string(),
        deliveryAddress: z.string(),
        deliveryPhone: z.string(),
        deliveryEmail: z.string(),
        deliverySpeed: z.string(),
        deliveryFee: z.number(),
        estDeliveryDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get active cart
        const cart = await db.query.carts.findFirst({
          where: and(eq(carts.userId, ctx.user.id), eq(carts.status, "active")),
          with: { items: { with: { listing: true } } }
        });

        if (!cart || !cart.items || cart.items.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
        }

        // Get company config for commission rate
        const configResult = await db.select().from(companyConfigs).limit(1);
        const commissionRate = configResult.length > 0 ? configResult[0].commissionRate : 0;

        const createdTransactions: any[] = [];
        const wsManager = getWebSocketManager();

        for (const item of cart.items) {
          const orderId = `ORD-${nanoid(8).toUpperCase()}`;
          const amount = item.priceAtAddition! * item.quantity;
          const platformFee = (amount * commissionRate) / 100;
          const netAmount = amount - platformFee;

          const [tx] = await db.insert(transactions).values({
            orderId,
            cartId: cart.id,
            buyerId: ctx.user.id,
            sellerId: item.listing.userId,
            listingId: item.listing.id,
            amount,
            platformFee,
            tax: 0,
            netAmount,
            currency: "NPR",
            status: "placed",
            paymentMethod: input.paymentMethod,
            transactionType: "sale",
            deliveryName: input.deliveryName,
            deliveryAddress: input.deliveryAddress,
            deliveryPhone: input.deliveryPhone,
            deliveryEmail: input.deliveryEmail,
            deliverySpeed: input.deliverySpeed,
            deliveryFee: input.deliveryFee, // Simplified fee logic for cart
            estDeliveryDate: input.estDeliveryDate,
            placedAt: new Date(),
          }).returning();

          createdTransactions.push(tx);

          // Decrement stock
          if (item.listing.stock) {
            await db.update(listings)
              .set({ stock: Math.max(0, item.listing.stock - item.quantity) })
              .where(eq(listings.id, item.listing.id));
          }

          // Notifications
          const listingTitle = item.listing.title || "Product";
          
          await db.insert(notifications).values([
            {
              userId: ctx.user.id,
              type: "sale",
              title: "Order Placed Successfully",
              content: `Your order for "${listingTitle}" (ID: ${orderId}) has been placed.`,
              relatedId: tx.id,
              isRead: false,
            },
            {
              userId: item.listing.userId,
              type: "sale",
              title: "Product Sold",
              content: `Your product "${listingTitle}" has been purchased (Order ID: ${orderId}) for NPR ${amount}.`,
              relatedId: tx.id,
              isRead: false,
            }
          ]);

          try {
            wsManager.notifyOrder(ctx.user.id, {
              type: "order-placed", orderId, title: "Order Placed", content: `Your order for "${listingTitle}" has been placed.`
            });
            wsManager.notifyOrder(item.listing.userId, {
              type: "order-placed", orderId, title: "Product Sold", content: `Your product "${listingTitle}" was purchased.`
            });
          } catch (e) {
            console.error("WS notify error", e);
          }
          
          // Send email to buyer
          try {
            await emailService.sendEmail({
              to: ctx.user.email || input.deliveryEmail,
              subject: `Order Confirmed: ${orderId}`,
              template: "order_buyer_confirmation",
              templateData: {
                orderId,
                listingTitle,
                amount: (amount + input.deliveryFee).toLocaleString(),
                deliverySpeed: input.deliverySpeed,
                deliveryFee: input.deliveryFee,
                estDeliveryDate: input.estDeliveryDate,
                deliveryName: input.deliveryName,
                deliveryAddress: input.deliveryAddress,
                deliveryPhone: input.deliveryPhone,
                paymentMethod: input.paymentMethod,
              },
              userId: ctx.user.id,
            });
          } catch (e) {
            console.error("Email error", e);
          }
        }

        // Mark cart as checked out
        await db.update(carts).set({ status: "checked_out", updatedAt: new Date() }).where(eq(carts.id, cart.id));

        return { success: true, transactions: createdTransactions };
      }),

    create: protectedProcedure
      .input(z.object({
        listingId: z.number(),
        sellerId: z.number(),
        amount: z.number(),
        paymentMethod: z.string(),
        deliveryName: z.string(),
        deliveryAddress: z.string(),
        deliveryPhone: z.string(),
        deliveryEmail: z.string(),
        deliverySpeed: z.string(),
        deliveryFee: z.number(),
        estDeliveryDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const orderId = `ORD-${nanoid(8).toUpperCase()}`;

        // Decrement stock
        const listing = await db.query.listings.findFirst({
          where: eq(listings.id, input.listingId)
        });
        if (listing && listing.stock) {
          await db.update(listings)
            .set({ stock: Math.max(0, listing.stock - 1) })
            .where(eq(listings.id, input.listingId));
        }

        const result = await db.insert(transactions).values({
          orderId: orderId,
          buyerId: ctx.user.id,
          sellerId: input.sellerId,
          listingId: input.listingId,
          amount: input.amount,
          platformFee: 0,
          tax: 0,
          netAmount: input.amount,
          currency: "NPR",
          status: "placed", // Default to "placed" status for live tracking progress
          paymentMethod: input.paymentMethod,
          transactionType: "sale",
          deliveryName: input.deliveryName,
          deliveryAddress: input.deliveryAddress,
          deliveryPhone: input.deliveryPhone,
          deliveryEmail: input.deliveryEmail,
          deliverySpeed: input.deliverySpeed,
          deliveryFee: input.deliveryFee,
          estDeliveryDate: input.estDeliveryDate,
          placedAt: new Date(),
        }).returning();

        // Fetch listing for titles and details
        const listingRes = await db.select().from(listings).where(eq(listings.id, input.listingId));
        const listingData = listingRes[0];
        const listingTitle = listingData?.title || "Product";

        // Insert in-app notification for Buyer
        await db.insert(notifications).values({
          userId: ctx.user.id,
          type: "sale",
          title: "Order Placed Successfully",
          content: `Your order for "${listingTitle}" (ID: ${orderId}) has been placed with ${input.deliverySpeed} Delivery.`,
          relatedId: result[0].id,
          isRead: false,
        });

        // Insert in-app notification for Seller
        await db.insert(notifications).values({
          userId: input.sellerId,
          type: "sale",
          title: "Product Sold",
          content: `Your product "${listingTitle}" has been purchased by ${input.deliveryName} (Order ID: ${orderId}) for NPR ${input.amount}.`,
          relatedId: result[0].id,
          isRead: false,
        });

        // Broadcast websocket notifications
        try {
          const wsManager = getWebSocketManager();
          // Notify buyer room
          wsManager.notifyOrder(ctx.user.id, {
            type: "order-placed",
            orderId: orderId,
            title: "Order Placed",
            content: `Your order for "${listingTitle}" (ID: ${orderId}) has been placed.`,
          });
          // Notify seller room
          wsManager.notifyOrder(input.sellerId, {
            type: "order-placed",
            orderId: orderId,
            title: "Product Sold",
            content: `Your product "${listingTitle}" has been purchased (Order ID: ${orderId}).`,
          });
        } catch (e) {
          console.error("Failed to broadcast order notifications via WS:", e);
        }

        // Send email to buyer
        try {
          await emailService.sendEmail({
            to: ctx.user.email || input.deliveryEmail,
            subject: `Order Confirmed: ${orderId}`,
            template: "order_buyer_confirmation",
            templateData: {
              orderId,
              listingTitle,
              amount: (input.amount + input.deliveryFee).toLocaleString(),
              deliverySpeed: input.deliverySpeed,
              deliveryFee: input.deliveryFee,
              estDeliveryDate: input.estDeliveryDate,
              deliveryName: input.deliveryName,
              deliveryAddress: input.deliveryAddress,
              deliveryPhone: input.deliveryPhone,
              paymentMethod: input.paymentMethod,
            },
            userId: ctx.user.id,
          });
        } catch (e) {
          console.error("Failed to send buyer confirmation email:", e);
        }

        // Send email to seller
        try {
          const seller = await getUserById(input.sellerId);
          if (seller && seller.email) {
            await emailService.sendEmail({
              to: seller.email,
              subject: `Product Sold: ${orderId}`,
              template: "order_seller_notification",
              templateData: {
                orderId,
                listingTitle,
                amount: input.amount.toLocaleString(),
                deliverySpeed: input.deliverySpeed,
                deliveryName: input.deliveryName,
                deliveryAddress: input.deliveryAddress,
                deliveryPhone: input.deliveryPhone,
                paymentMethod: input.paymentMethod,
              },
              userId: seller.id,
            });
          }
        } catch (e) {
          console.error("Failed to send seller confirmation email:", e);
        }

        return result;
      }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserNotifications(ctx.user.id);
      }),

    markAsRead: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(notifications)
          .set({ isRead: true })
          .where(and(eq(notifications.id, input), eq(notifications.userId, ctx.user.id)));
        return { success: true };
      }),

    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.userId, ctx.user.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(notifications)
          .where(and(eq(notifications.id, input), eq(notifications.userId, ctx.user.id)));
        return { success: true };
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

  // Deals & Offers - ADD THIS SECTION
  deals: dealsRouter,
});

export type AppRouter = typeof appRouter;