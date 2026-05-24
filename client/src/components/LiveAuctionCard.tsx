import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { TrendingUp, Clock, Users } from "lucide-react";

interface LiveAuctionCardProps {
  auctionId: number;
  listingId: number;
  title: string;
  currentBid: number;
  startingPrice: number;
  timeRemaining: string;
  bidCount: number;
  viewerCount?: number;
}

export function LiveAuctionCard({
  auctionId,
  listingId,
  title,
  currentBid,
  startingPrice,
  timeRemaining,
  bidCount,
  viewerCount = 0,
}: LiveAuctionCardProps) {
  const [displayBid, setDisplayBid] = useState(currentBid);
  const [displayBidCount, setDisplayBidCount] = useState(bidCount);
  const [isLive, setIsLive] = useState(true);
  const { subscribeToAuction, unsubscribeFromAuction, onBidPlaced, offBidPlaced } = useWebSocket();

  useEffect(() => {
    // Subscribe to auction updates
    subscribeToAuction(auctionId);

    // Listen for new bids
    const handleBidPlaced = (update: any) => {
      if (update.auctionId === auctionId) {
        setDisplayBid(update.currentBid);
        setDisplayBidCount((prev) => prev + 1);
        
        // Show a subtle animation
        const element = document.getElementById(`bid-${auctionId}`);
        if (element) {
          element.classList.add("animate-pulse");
          setTimeout(() => {
            element.classList.remove("animate-pulse");
          }, 1000);
        }
      }
    };

    onBidPlaced(handleBidPlaced);

    return () => {
      unsubscribeFromAuction(auctionId);
      offBidPlaced();
    };
  }, [auctionId, subscribeToAuction, unsubscribeFromAuction, onBidPlaced, offBidPlaced]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition">
      <div className="h-48 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center relative">
        <TrendingUp className="w-12 h-12 text-accent" />
        {isLive && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white animate-pulse">
            LIVE
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2">{title}</h3>
        
        {/* Bid Information */}
        <div className="border-t pt-3 mb-3">
          <p className="text-xs text-muted-foreground mb-1">Current Bid</p>
          <p
            id={`bid-${auctionId}`}
            className="text-2xl font-bold text-accent transition-all duration-300"
          >
            NPR {displayBid.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Starting: NPR {startingPrice.toLocaleString()}
          </p>
        </div>

        {/* Auction Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{timeRemaining}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{displayBidCount} bids</span>
          </div>
        </div>

        {/* Viewer Count */}
        {viewerCount > 0 && (
          <div className="mb-3 text-xs text-muted-foreground">
            {viewerCount} watching
          </div>
        )}

        {/* Action Button */}
        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          Place Bid
        </Button>
      </div>
    </Card>
  );
}
