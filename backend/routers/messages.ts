import { protectedProcedure } from "../_core/trpc";
import { getConversations, getMessages } from "../db";
import { getDb } from "../db";
import { messages } from "../../drizzle/schema";
import { getWebSocketManager } from "../websocket";
import { encryptMessage } from "../_core/crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const messagesRouter = {
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
      content: z.string().min(1).max(1000),
      listingId: z.number().nullish(),
      attachmentUrl: z.string().optional(),
      attachmentType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Validate recipient exists
      if (input.recipientId === ctx.user.id) {
        throw new Error("Cannot send message to yourself");
      }

      // Insert message — content is encrypted at rest
      const result = await db.insert(messages).values({
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        content: encryptMessage(input.content),
        listingId: input.listingId,
        attachmentUrl: input.attachmentUrl || null,
        attachmentType: input.attachmentType || null,
        isRead: false,
        createdAt: new Date(),
      }).returning();

      // Notify recipient via WebSocket
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
      } catch (error) {
        console.error("Failed to notify message:", error);
        // Don't fail the mutation if WebSocket notification fails
      }

      return result;
    }),

  markAsRead: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Mark message as read
      return db.update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, input));
    }),
};
