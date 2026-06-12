import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { carts, cartItems, listings, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const cartRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get active cart
    let activeCart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, ctx.user.id), eq(carts.status, "active")),
      with: {
        items: {
          with: {
            listing: {
              with: {
                user: true, // seller
              }
            }
          }
        }
      }
    });

    if (!activeCart) {
      const [newCart] = await db.insert(carts).values({
        userId: ctx.user.id,
        status: "active",
      }).returning();
      
      activeCart = await db.query.carts.findFirst({
        where: eq(carts.id, newCart.id),
        with: { items: { with: { listing: { with: { user: true } } } } }
      });
    }

    return activeCart;
  }),

  addItem: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      quantity: z.number().default(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify listing exists and is active
      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, input.listingId)
      });

      if (!listing || listing.status !== "active" || (listing.stock ?? 1) <= 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not available or out of stock" });
      }

      // Cannot add own listing
      if (listing.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot add your own listing to cart" });
      }

      // Get or create active cart
      let cart = await db.query.carts.findFirst({
        where: and(eq(carts.userId, ctx.user.id), eq(carts.status, "active"))
      });

      if (!cart) {
        const [newCart] = await db.insert(carts).values({
          userId: ctx.user.id,
          status: "active",
        }).returning();
        cart = newCart;
      }

      // Check if item already exists in cart
      const existingItem = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.cartId, cart.id), eq(cartItems.listingId, input.listingId))
      });

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + input.quantity;
        if (newQuantity > (listing.stock ?? 1)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough stock available" });
        }
        await db.update(cartItems)
          .set({ quantity: newQuantity, updatedAt: new Date() })
          .where(eq(cartItems.id, existingItem.id));
      } else {
        if (input.quantity > (listing.stock ?? 1)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough stock available" });
        }
        // Insert new item
        await db.insert(cartItems).values({
          cartId: cart.id,
          listingId: input.listingId,
          quantity: input.quantity,
          priceAtAddition: listing.price,
        });
      }

      return { success: true };
    }),

  updateQuantity: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      quantity: z.number().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const item = await db.query.cartItems.findFirst({
        where: eq(cartItems.id, input.itemId),
        with: { cart: true, listing: true }
      });

      if (!item || item.cart.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      }

      if (input.quantity > (item.listing.stock ?? 1)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough stock available" });
      }

      await db.update(cartItems)
        .set({ quantity: input.quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, input.itemId));

      return { success: true };
    }),

  removeItem: protectedProcedure
    .input(z.object({
      itemId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify cart ownership
      const item = await db.query.cartItems.findFirst({
        where: eq(cartItems.id, input.itemId),
        with: { cart: true }
      });

      if (!item || item.cart.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      }

      await db.delete(cartItems).where(eq(cartItems.id, input.itemId));
      return { success: true };
    }),

  clear: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const cart = await db.query.carts.findFirst({
        where: and(eq(carts.userId, ctx.user.id), eq(carts.status, "active"))
      });

      if (cart) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }

      return { success: true };
    }),
});
