import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebSocketManager } from "./websocket";
import { createServer } from "http";

describe("WebSocketManager", () => {
  let wsManager: WebSocketManager;
  let httpServer: any;

  beforeEach(() => {
    httpServer = createServer();
    wsManager = new WebSocketManager(httpServer);
  });

  afterEach(() => {
    httpServer.close();
  });

  it("should initialize WebSocket manager", () => {
    expect(wsManager).toBeDefined();
    expect(wsManager.getIO()).toBeDefined();
  });

  it("should track user online status", () => {
    const userId = 1;
    wsManager["registerUserSocket"](userId, "socket-1");
    expect(wsManager.isUserOnline(userId)).toBe(true);
  });

  it("should track user offline status", () => {
    const userId = 1;
    wsManager["registerUserSocket"](userId, "socket-1");
    wsManager["unregisterUserSocket"]("socket-1");
    expect(wsManager.isUserOnline(userId)).toBe(false);
  });

  it("should track auction subscribers", () => {
    const auctionId = 1;
    wsManager["subscribeToAuction"](auctionId, "socket-1");
    expect(wsManager.getAuctionViewerCount(auctionId)).toBe(1);
  });

  it("should remove auction subscribers", () => {
    const auctionId = 1;
    wsManager["subscribeToAuction"](auctionId, "socket-1");
    wsManager["unsubscribeFromAuction"](auctionId, "socket-1");
    expect(wsManager.getAuctionViewerCount(auctionId)).toBe(0);
  });

  it("should handle multiple subscribers for same auction", () => {
    const auctionId = 1;
    wsManager["subscribeToAuction"](auctionId, "socket-1");
    wsManager["subscribeToAuction"](auctionId, "socket-2");
    expect(wsManager.getAuctionViewerCount(auctionId)).toBe(2);
  });

  it("should broadcast bid updates", () => {
    const broadcastSpy = vi.spyOn(wsManager.getIO(), "to");
    
    wsManager.broadcastBid({
      auctionId: 1,
      listingId: 1,
      currentBid: 5000,
      highestBidderId: 1,
      bidderId: 1,
      bidderName: "Test User",
      timestamp: new Date(),
    });

    expect(broadcastSpy).toHaveBeenCalledWith("auction:1");
  });

  it("should notify messages to recipient", () => {
    const emitSpy = vi.spyOn(wsManager.getIO(), "to");
    
    wsManager.notifyMessage({
      id: 1,
      senderId: 1,
      recipientId: 2,
      content: "Test message",
      timestamp: new Date(),
    });

    expect(emitSpy).toHaveBeenCalledWith("messages:2");
  });

  it("should notify auction end", () => {
    const emitSpy = vi.spyOn(wsManager.getIO(), "to");
    
    wsManager.notifyAuctionEnd(1, 2, 10000);

    expect(emitSpy).toHaveBeenCalledWith("auction:1");
  });
});
