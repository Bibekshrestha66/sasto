import { useEffect, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";

export interface AuctionUpdate {
  auctionId: number;
  listingId: number;
  currentBid: number;
  highestBidderId: number;
  bidderName: string;
  timestamp: Date;
}

export interface MessageEvent {
  id: number;
  senderId: number;
  content: string;
  timestamp: Date;
}

export interface UserStatus {
  userId: number;
  status: "online" | "offline";
  timestamp: Date;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user?.id) {
      return;
    }

    // Create socket connection
    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket.id);
      // Authenticate with server
      socket.emit("authenticate", user.id);
    });

    socket.on("authenticated", (data) => {
      console.log("[WebSocket] Authenticated:", data);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("[WebSocket] Connection error:", error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const subscribeToAuction = useCallback((auctionId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("subscribe-auction", auctionId);
      console.log(`[WebSocket] Subscribed to auction ${auctionId}`);
    }
  }, []);

  const unsubscribeFromAuction = useCallback((auctionId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("unsubscribe-auction", auctionId);
      console.log(`[WebSocket] Unsubscribed from auction ${auctionId}`);
    }
  }, []);

  const subscribeToMessages = useCallback((userId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("subscribe-messages", userId);
      console.log(`[WebSocket] Subscribed to messages for user ${userId}`);
    }
  }, []);

  const onBidPlaced = useCallback(
    (callback: (update: AuctionUpdate) => void) => {
      if (socketRef.current) {
        socketRef.current.on("bid-placed", callback);
      }
    },
    []
  );

  const onNewMessage = useCallback(
    (callback: (message: MessageEvent) => void) => {
      if (socketRef.current) {
        socketRef.current.on("new-message", callback);
      }
    },
    []
  );

  const onUserStatus = useCallback(
    (callback: (status: UserStatus) => void) => {
      if (socketRef.current) {
        socketRef.current.on("user-status", callback);
      }
    },
    []
  );

  const onAuctionEnded = useCallback(
    (callback: (data: { auctionId: number; winnerId: number; finalPrice: number }) => void) => {
      if (socketRef.current) {
        socketRef.current.on("auction-ended", callback);
      }
    },
    []
  );

  const offBidPlaced = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("bid-placed");
    }
  }, []);

  const offNewMessage = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("new-message");
    }
  }, []);

  const offUserStatus = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("user-status");
    }
  }, []);

  const offAuctionEnded = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("auction-ended");
    }
  }, []);

  const onNewNotification = useCallback(
    (callback: (notification: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("new-notification", callback);
      }
    },
    []
  );

  const offNewNotification = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("new-notification");
    }
  }, []);

  return {
    socket: socketRef.current,
    subscribeToAuction,
    unsubscribeFromAuction,
    subscribeToMessages,
    onBidPlaced,
    onNewMessage,
    onUserStatus,
    onAuctionEnded,
    onNewNotification,
    offBidPlaced,
    offNewMessage,
    offUserStatus,
    offAuctionEnded,
    offNewNotification,
  };
}
