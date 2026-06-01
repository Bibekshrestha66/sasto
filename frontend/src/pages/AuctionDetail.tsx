import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Gavel, ArrowLeft, MapPin, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";

function TimeRemaining({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const end = new Date(endTime).getTime();
    const update = () => {
      const now = new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (timeLeft <= 0) return <span className="text-red-600 font-bold">Ended</span>;

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  if (days > 0) return <>{days}d {hours}h {minutes}m</>;
  if (hours > 0) return <>{hours}h {minutes}m {secs}s</>;
  return <>{minutes}m {secs}s</>;
}

export default function AuctionDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState("");
  const auctionId = parseInt(id || "");

  const utils = trpc.useUtils();
  const { subscribeToAuction, unsubscribeFromAuction, onBidPlaced, offBidPlaced } = useWebSocket();

  const { data: auction, isLoading } = trpc.auctions.getById.useQuery(auctionId, {
    enabled: !!auctionId,
  });

  const { data: bids = [] } = trpc.auctions.getBids.useQuery(auctionId, {
    enabled: !!auctionId,
  });

  // WebSocket for live updates
  useEffect(() => {
    if (auctionId) {
      subscribeToAuction(auctionId);
      onBidPlaced((update) => {
        if (update.auctionId === auctionId) {
          utils.auctions.getById.invalidate(auctionId);
          utils.auctions.getBids.invalidate(auctionId);
          toast.info(`New bid placed: NPR ${update.currentBid.toLocaleString()}`);
        }
      });
    }
    return () => {
      if (auctionId) {
        unsubscribeFromAuction(auctionId);
        offBidPlaced();
      }
    };
  }, [auctionId]);

  const placeBidMutation = trpc.auctions.placeBid.useMutation();
  useEffect(() => {
    if (placeBidMutation.isSuccess) {
      toast.success("Your bid has been placed successfully!");
      setBidAmount("");
      utils.auctions.getById.invalidate(auctionId);
      utils.auctions.getBids.invalidate(auctionId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeBidMutation.isSuccess]);
  useEffect(() => {
    if (placeBidMutation.isError) { toast.error((placeBidMutation.error as any)?.message); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeBidMutation.isError]);

  const handlePlaceBid = () => {
    if (!user) {
      toast.error("Please log in to place a bid");
      navigate("/login");
      return;
    }

    const bid = parseFloat(bidAmount);
    const currentPrice = auction?.currentBid ? auction.currentBid : (auction?.startingPrice ? auction.startingPrice : 0);
    
    if (isNaN(bid) || bid <= currentPrice) {
      toast.error(`Your bid must be higher than NPR ${currentPrice.toLocaleString()}`);
      return;
    }

    placeBidMutation.mutate({
      auctionId,
      amount: bid,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading auction details...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Auction Not Found</h1>
        <Button onClick={() => navigate("/auctions")} className="bg-orange-500 hover:bg-orange-600">
          Back to Auctions
        </Button>
      </div>
    );
  }

  const currentPrice = auction.currentBid ? auction.currentBid : auction.startingPrice;

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => navigate("/auctions")}
          className="flex items-center gap-2 text-gray-500 hover:text-orange-500 mb-8 transition-all font-semibold group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Live Auctions
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="overflow-hidden border-none shadow-2xl rounded-3xl bg-white">
              <div className="relative w-full bg-gray-50 flex items-center justify-center min-h-[300px] group">
                <img
                  src={auction.image}
                  alt={auction.title}
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/id/10/800/500";
                  }}
                />
                <div className="absolute top-6 right-6 bg-orange-600/90 backdrop-blur-md text-white px-5 py-2 rounded-2xl text-sm font-black tracking-widest uppercase shadow-xl flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  Live Now
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">{auction.title}</h1>
                    <div className="flex items-center gap-4 text-gray-500 font-semibold">
                      <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-xl">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        {auction.location}
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-xl">
                        <Users className="w-4 h-4 text-blue-500" />
                        24 Watching
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="prose prose-orange max-w-none mb-8">
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {auction.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Starting Bid</p>
                    <p className="font-black text-gray-900">NPR {auction.startingPrice?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Bids</p>
                    <p className="font-black text-gray-900">{bids.length} bids</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bid Increment</p>
                    <p className="font-black text-gray-900">NPR 1,000</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="font-black text-green-600">Active</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bid History */}
            <Card className="p-8 border-none shadow-xl rounded-3xl bg-white">
              <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                Live Bid History
              </h3>
              <div className="space-y-4">
                {bids.length > 0 ? (
                  bids.map((bid: any, idx: number) => (
                    <div key={bid.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${idx === 0 ? "bg-orange-50 border border-orange-100 scale-[1.02]" : "bg-gray-50"}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${idx === 0 ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{idx === 0 ? "Highest Bidder" : `Bidder #${bid.bidderId}`}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase">{new Date(bid.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${idx === 0 ? "text-orange-600" : "text-gray-900"}`}>
                          NPR {parseFloat(bid.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase tracking-widest">No bids placed yet</p>
                    <p className="text-sm text-gray-500 mt-2">Be the first one to bid!</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 border-none shadow-2xl rounded-3xl bg-white sticky top-12 border-t-8 border-t-orange-500">
              <div className="text-center mb-8">
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Current Highest Bid</p>
                <p className="text-5xl font-black text-orange-500 tracking-tight mb-4">
                  <span className="text-2xl mr-1">NPR</span>
                  {currentPrice.toLocaleString()}
                </p>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-red-50 text-red-600 rounded-2xl font-black text-sm uppercase tracking-wider">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <TimeRemaining endTime={auction.endTime?.toString()} />
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Your Bid Amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">NPR</span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={(currentPrice + 1000).toLocaleString()}
                      className="w-full pl-16 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-black text-xl"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 mt-3 px-1 uppercase tracking-widest leading-relaxed">
                    By placing a bid, you agree to pay NPR {parseFloat(bidAmount || "0").toLocaleString()} if you win.
                  </p>
                </div>

                <Button
                  onClick={handlePlaceBid}
                  disabled={placeBidMutation.isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white h-16 rounded-2xl text-xl font-black shadow-xl shadow-orange-200 transition-all active:scale-95 group"
                >
                  {placeBidMutation.isPending ? "Placing Bid..." : "Place Bid Now"}
                  <Gavel className="w-6 h-6 ml-3 group-hover:rotate-12 transition-transform" />
                </Button>
              </div>

              <div className="pt-6 border-t flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 text-2xl shadow-inner uppercase">
                  {auction.sellerName?.[0]}
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Seller</p>
                  <p className="font-black text-gray-900 text-lg leading-none mb-1">{auction.sellerName}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="text-orange-500 text-xs">★</span>
                    ))}
                    <span className="text-[10px] font-black text-gray-400 uppercase ml-2">Trusted</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl border-none shadow-xl">
              <h4 className="font-black text-xl mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Auction Tip
              </h4>
              <p className="text-blue-100 text-sm font-medium leading-relaxed">
                Bid in the last 10 minutes to increase your chances of winning! Stay tuned to the live updates.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}