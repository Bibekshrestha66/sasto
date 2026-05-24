import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

export interface AuctionUpdate {
  auctionId: number;
  listingId: number;
  currentBid: number;
  highestBidderId: number;
  bidderId: number;
  bidderName: string;
  timestamp: Date;
}

export interface MessageEvent {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: Date;
  conversationId: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface UserStatusEvent {
  userId: number;
  status: "online" | "offline";
  timestamp: Date;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private userSockets: Map<number, Set<string>> = new Map();
  private auctionSubscribers: Map<number, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[WebSocket] User connected: ${socket.id}`);

      // Handle user authentication
      socket.on("authenticate", (userId: number) => {
        this.registerUserSocket(userId, socket.id);
        socket.emit("authenticated", { userId, socketId: socket.id });
        this.broadcastUserStatus(userId, "online");
        socket.join(`messages:${userId}`);
        console.log(`[WebSocket] User ${userId} joined room messages:${userId}`);
      });

      // Handle auction subscription
      socket.on("subscribe-auction", (auctionId: number) => {
        this.subscribeToAuction(auctionId, socket.id);
        socket.join(`auction:${auctionId}`);
      });

      // Handle auction unsubscription
      socket.on("unsubscribe-auction", (auctionId: number) => {
        this.unsubscribeFromAuction(auctionId, socket.id);
        socket.leave(`auction:${auctionId}`);
      });

      // Handle message subscription
      socket.on("subscribe-messages", (userId: number) => {
        socket.join(`messages:${userId}`);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`[WebSocket] User disconnected: ${socket.id}`);
        this.unregisterUserSocket(socket.id);
      });
    });
  }

  private registerUserSocket(userId: number, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private unregisterUserSocket(socketId: string) {
    for (const [userId, sockets] of Array.from(this.userSockets.entries())) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        this.broadcastUserStatus(userId, "offline");
      }
    }
  }

  private subscribeToAuction(auctionId: number, socketId: string) {
    if (!this.auctionSubscribers.has(auctionId)) {
      this.auctionSubscribers.set(auctionId, new Set());
    }
    this.auctionSubscribers.get(auctionId)!.add(socketId);
  }

  private unsubscribeFromAuction(auctionId: number, socketId: string) {
    const subscribers = this.auctionSubscribers.get(auctionId);
    if (subscribers) {
      subscribers.delete(socketId);
      if (subscribers.size === 0) {
        this.auctionSubscribers.delete(auctionId);
      }
    }
  }

  /**
   * Broadcast a new bid to all users watching an auction
   */
  public broadcastBid(auctionUpdate: AuctionUpdate) {
    this.io.to(`auction:${auctionUpdate.auctionId}`).emit("bid-placed", {
      auctionId: auctionUpdate.auctionId,
      listingId: auctionUpdate.listingId,
      currentBid: auctionUpdate.currentBid,
      highestBidderId: auctionUpdate.highestBidderId,
      bidderName: auctionUpdate.bidderName,
      timestamp: auctionUpdate.timestamp,
    });

    console.log(
      `[WebSocket] Broadcast bid for auction ${auctionUpdate.auctionId}: NPR ${auctionUpdate.currentBid}`
    );
  }

  /**
   * Send a message notification to a specific user
   */
  public notifyMessage(event: MessageEvent) {
    const payload = {
      id: event.id,
      senderId: event.senderId,
      recipientId: event.recipientId,
      content: event.content,
      timestamp: event.timestamp,
      attachmentUrl: event.attachmentUrl,
      attachmentType: event.attachmentType,
    };

    // Notify recipient
    this.io.to(`messages:${event.recipientId}`).emit("new-message", payload);
    
    // Notify sender (for multi-tab sync)
    this.io.to(`messages:${event.senderId}`).emit("new-message", payload);

    console.log(
      `[WebSocket] Message notification sent to users ${event.senderId} and ${event.recipientId}`
    );
  }

  /**
   * Broadcast user online/offline status
   */
  private broadcastUserStatus(userId: number, status: "online" | "offline") {
    this.io.emit("user-status", {
      userId,
      status,
      timestamp: new Date(),
    });

    console.log(`[WebSocket] User ${userId} is now ${status}`);
  }

  /**
   * Notify auction end
   */
  public notifyAuctionEnd(auctionId: number, winnerId: number, finalPrice: number) {
    this.io.to(`auction:${auctionId}`).emit("auction-ended", {
      auctionId,
      winnerId,
      finalPrice,
      timestamp: new Date(),
    });

    console.log(`[WebSocket] Auction ${auctionId} ended`);
  }

  /**
   * Get the number of users watching an auction
   */
  public getAuctionViewerCount(auctionId: number): number {
    return this.auctionSubscribers.get(auctionId)?.size || 0;
  }

  /**
   * Check if a user is online
   */
  public isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Send an order notification to a specific user
   */
  public notifyOrder(userId: number, payload: any) {
    this.io.to(`messages:${userId}`).emit("new-notification", payload);
    console.log(`[WebSocket] Order notification sent to user ${userId}`);
  }

  /**
   * Get the Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

let wsManager: WebSocketManager | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(httpServer);
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    throw new Error("WebSocket manager not initialized");
  }
  return wsManager;
}
