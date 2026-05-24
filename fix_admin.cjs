const fs = require('fs');
const path = 'server/routers/admin.ts';
let content = fs.readFileSync(path, 'utf8');

const bad_block = `      // Broadcast via WebSocket
      try {
        const { getWebSocketManager } = await import("../websocket");
        webhookUrl: input.webhookUrl,
        trackingUrlFormat: input.trackingUrlFormat,
        isActive: false,
      });
      return { success: true };
    }),`;

const good_block = `      // Broadcast via WebSocket
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

  updatePaymentGateway: adminProcedure
    .input(z.object({
      gatewayName: z.string(),
      config: z.any()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await updatePaymentGateway(input.gatewayName, input.config);
        
        const db = await getDb();
        if (db) {
           await db.insert(adminLogs).values({
            adminId: ctx.user.id,
            action: \`update_payment_gateway\`,
            details: \`Updated config for \${input.gatewayName}\`,
          });
        }
        
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || "Failed to update payment gateway config"
        });
      }
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
    }),`;

const regex = /      \/\/ Broadcast via WebSocket[\s\S]*?return \{ success: true \};\r?\n    \}\),/;

if (regex.test(content)) {
    content = content.replace(regex, good_block);
    fs.writeFileSync(path, content, 'utf8');
    console.log('SUCCESS');
} else {
    console.log('NOT FOUND');
}
