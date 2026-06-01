import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Gavel, Clock, MapPin, Star,
  Smartphone, Tv, Car, House, Briefcase, Wrench,
  Shirt, PawPrint, Book, Sofa, Baby, Building2,
  Image as ImageIcon, ChevronRight, ShoppingCart, Stethoscope, Laptop,
  Sprout, Dumbbell, GraduationCap, TrendingUp, Flame, Zap, RefreshCw,
  Bed, Dog, Bike, Sparkles, Layers
} from "lucide-react";
import SEO from "@/components/SEO";
import { toast } from "sonner";

// ==================== TYPES ====================
interface LiveDeal {
  id: number;
  title: string;
  currentPrice: number;
  originalPrice?: number;
  discount?: number;
  interested: number;
  timeLeft: string;
  image: string;
  createdAt: string;
  type: "deal";
  endTime: Date;
  views?: number;
  rating?: number;
}

// ==================== FULL CATEGORY LIST (excluding "All Categories") ====================
const CATEGORIES = [
  { id: "all", name: "All Categories", icon: Layers },
  { id: "agriculture", name: "Agriculture", icon: Sprout },
  { id: "books", name: "Books", icon: Book },
  { id: "commercial", name: "Commercial", icon: Building2 },
  { id: "digital", name: "Digital", icon: Laptop },
  { id: "electronics", name: "Electronics", icon: Smartphone },
  { id: "fashion", name: "Fashion", icon: Shirt },
  { id: "furniture", name: "Furniture", icon: Sofa },
  { id: "groceries", name: "Groceries", icon: ShoppingCart },
  { id: "jobs", name: "Jobs", icon: Briefcase },
  { id: "kids", name: "Kids & Babies", icon: Baby },
  { id: "medical", name: "Medical", icon: Stethoscope },
  { id: "pets", name: "Pets", icon: Dog },
  { id: "property", name: "Property", icon: House },
  { id: "rooms", name: "Rooms", icon: Bed },
  { id: "services", name: "Services", icon: Wrench },
  { id: "sports", name: "Sports", icon: Bike },
  { id: "vehicles", name: "Vehicles", icon: Car },
];
export default function HomePage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch REAL featured listings from the database
  const { data: featuredListings = [], isLoading: featuredLoading } = (trpc.listings as any).getFeatured?.useQuery({ limit: 8 }) || { data: [], isLoading: false };
  const { data: marketplaceListings = [], isLoading: marketplaceLoading } = trpc.listings.list.useQuery({
    limit: 10, offset: 0,
  });

  const utils = trpc.useContext();
  const addToCartMutation = trpc.cart.addItem.useMutation();
  useEffect(() => {
    if (addToCartMutation.isSuccess) { toast.success("Added to cart!"); utils.cart.get.invalidate(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToCartMutation.isSuccess]);
  useEffect(() => {
    if (addToCartMutation.isError) { toast.error((addToCartMutation.error as any)?.message || "Failed to add to cart"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToCartMutation.isError]);

  const handleBuyNow = (e: React.MouseEvent, listingId: number) => {
    e.stopPropagation();
    addToCartMutation.mutate({ listingId, quantity: 1 }, {
      onSuccess: () => navigate("/checkout")
    });
  };

  const handleAddToCart = (e: React.MouseEvent, listingId: number) => {
    e.stopPropagation();
    addToCartMutation.mutate({ listingId, quantity: 1 });
  };

  // Fetch REAL deals from the database
  const {
    data: liveDealsData = [],
    isLoading: dealsLoading,
    refetch: refetchDeals
  } = (trpc as any).deals?.getLiveDeals?.useQuery(
    { limit: 4 },
    { refetchInterval: 300000, refetchOnWindowFocus: true }
  ) || { data: [], isLoading: false, refetch: () => { } };

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchDeals();
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, [refetchDeals]);

  const calculateTimeLeft = useCallback((endTime: Date): string => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  const [liveDeals, setLiveDeals] = useState<LiveDeal[]>([]);

  useEffect(() => {
    if (liveDealsData && liveDealsData.length > 0) {
      setLiveDeals(liveDealsData);
    } else if (liveDealsData && liveDealsData.length === 0) {
      setLiveDeals([]);
    }
  }, [liveDealsData]);

  useEffect(() => {
    if (liveDeals.length === 0) return;
    const timer = setInterval(() => {
      setLiveDeals(prevDeals =>
        prevDeals.map(deal => ({
          ...deal,
          timeLeft: calculateTimeLeft(deal.endTime)
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [liveDeals.length, calculateTimeLeft]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
  };

  // Updated: navigate using category ID (e.g., "electronics", "vehicles")
  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === "all") {
      navigate("/marketplace");
    } else {
      navigate(`/marketplace?category=${encodeURIComponent(categoryId)}`);
    }
  };

  const handleAdClick = (adId: number, type: string) => {
    if (type === 'deal') {
      navigate(`/deal/${adId}`);
    } else {
      navigate(`/listing/${adId}`);
    }
  };

  const handleDealClick = (dealId: number) => navigate(`/deal/${dealId}`);
  const handleViewAllDeals = () => navigate("/deals-and-offers");

  const heroCategories = ["Mobile Phones", "Cars & Vehicles", "Property", "Electronics"];

  const getImageUrl = (listing: any) => listing.imageUrl || listing.images?.[0] || listing.mainImage || null;

  const getLatestMarketplaceListings = () => {
    const marketplaceItems = (marketplaceListings || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price || 0,
      location: item.location || "Kathmandu",
      image: item.imageUrl || item.images?.[0] || null,
      createdAt: item.createdAt || new Date().toISOString(),
      type: "marketplace"
    }));
    marketplaceItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return marketplaceItems.slice(0, 6);
  };

  const latestMarketplaceListings = getLatestMarketplaceListings();
  const isLoading = marketplaceLoading;

  const ImageWithFallback = ({ src, alt, className }: { src?: string | null; alt: string; className?: string }) => {
    const [imgError, setImgError] = useState(false);
    if (!src || imgError) return <div className={`bg-gray-100 ${className}`} />;
    return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setImgError(true)} />;
  };

  const InterestedCounter = ({ count }: { count: number }) => {
    const [displayCount, setDisplayCount] = useState(count);
    useEffect(() => {
      if (count > displayCount) {
        const timer = setTimeout(() => setDisplayCount(displayCount + 1), 50);
        return () => clearTimeout(timer);
      }
    }, [count, displayCount]);
    return <span>{displayCount}</span>;
  };

  const getLastUpdatedText = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes === 1) return "1 minute ago";
    return `${minutes} minutes ago`;
  };

  const showLoadingSkeleton = dealsLoading && liveDeals.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Sasto Marketplace - Nepal's Largest Online Buying & Selling Hub"
        description="Discover the best deals on electronics, vehicles, property, and more in Nepal. Grab live deals and join the Sasto Marketplace community."
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-500 py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Nepal's Cheapest Marketplace</h1>
          <p className="text-white/90 text-base mb-6">Buy, Sell - Everything you need in one place</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/deals-and-offers")}
              className="bg-white/20 hover:bg-white/30 rounded-full px-6 py-2.5 text-base font-medium text-white transition-all duration-200"
            >
              Deals & Offers
            </button>
            <button
              onClick={() => navigate("/marketplace")}
              className="bg-white/20 hover:bg-white/30 rounded-full px-6 py-2.5 text-base font-medium text-white transition-all duration-200"
            >
              Marketplace
            </button>
            <button
              onClick={() => navigate("/auctions")}
              className="bg-white/20 hover:bg-white/30 rounded-full px-6 py-2.5 text-base font-medium text-white transition-all duration-200"
            >
              Auctions
            </button>
            <button
              onClick={() => navigate("/rentals")}
              className="bg-white/20 hover:bg-white/30 rounded-full px-6 py-2.5 text-base font-medium text-white transition-all duration-200"
            >
              Rentals
            </button>
          </div>
        </div>
      </section>

      {/* Live Deals & Offers Section */}
      <section className="py-8 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-semibold">TOP DEALS</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Deals & Offers</h2>
              <TrendingUp className="w-5 h-5 text-green-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500 bg-white/80 px-2 py-0.5 rounded-full">
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Updated {getLastUpdatedText()}</span>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleViewAllDeals}
                className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center"
              >
                View All <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>
          <p className="text-gray-500 text-xs mb-4">🔥 Top deals updated every 5 minutes - Grab the best offers!</p>

          {showLoadingSkeleton && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-t-lg" />
                  <div className="p-2 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showLoadingSkeleton && liveDeals.length === 0 && (
            <div className="text-center py-8 bg-white rounded-lg">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-gray-500 text-sm">No active deals at the moment</p>
              <p className="text-gray-400 text-xs mt-1">Check back in 5 minutes for new offers!</p>
            </div>
          )}

          {!showLoadingSkeleton && liveDeals.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {liveDeals.slice(0, 4).map((deal, index) => (
                  <div
                    key={deal.id}
                    onClick={() => handleDealClick(deal.id)}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden border-2 border-red-200 hover:border-red-400 group relative"
                  >
                    {index === 0 && (
                      <div className="absolute top-0 left-0 z-10">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[8px] px-2 py-0.5 rounded-br-lg font-bold">
                          🔥 #1 TOP DEAL
                        </div>
                      </div>
                    )}
                    {(deal.discount ?? 0) > 0 && (
                      <div className="absolute top-0 right-0 z-10">
                        <div className="bg-gradient-to-l from-red-500 to-orange-500 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-bold">
                          {deal.discount}% OFF
                        </div>
                      </div>
                    )}
                    <div className="relative h-24 bg-gray-200">
                      <img
                        src={deal.image}
                        alt={deal.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = `https://picsum.photos/seed/${deal.id}/400/400`;
                        }}
                      />
                      <div className="absolute top-1 left-1 flex gap-1">
                        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">SALE</span>
                        <span className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">LIMITED</span>
                      </div>
                      {(deal.views ?? 0) > 0 && (
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1 py-0.5 rounded">
                          👁 {deal.views}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="bg-red-500 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">Limited Time</span>
                        <div className="flex items-center text-red-500 text-[9px] font-mono bg-red-50 px-1 py-0.5 rounded">
                          <Clock className="w-2.5 h-2.5 mr-0.5" />
                          <span className="font-bold">{deal.timeLeft}</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-xs mb-0.5 line-clamp-1 group-hover:text-red-500 transition-colors">
                        {deal.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-xs font-bold text-red-500">
                          NPR {deal.currentPrice.toLocaleString()}
                        </p>
                        {deal.originalPrice && (
                          <p className="text-[9px] text-gray-400 line-through">
                            NPR {deal.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5 text-orange-500" />
                          <p className="text-[9px] text-gray-600">
                            <InterestedCounter count={deal.interested} /> interested
                          </p>
                        </div>
                        {(deal.discount ?? 0) > 40 && (
                          <div className="bg-green-100 text-green-700 text-[8px] px-1 py-0.5 rounded font-bold">
                            BEST DEAL
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={(e) => handleBuyNow(e, deal.id)}
                          disabled={addToCartMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] py-1.5 rounded-full font-medium transition-colors"
                        >
                          Buy
                        </button>
                        <button
                          onClick={(e) => handleAddToCart(e, deal.id)}
                          disabled={addToCartMutation.isPending}
                          className="flex-1 bg-white border border-green-600 text-green-600 hover:bg-green-50 text-[10px] py-1.5 rounded-full font-medium transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-[10px] text-gray-500 bg-white px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Auto-refreshes every 5 minutes • Next update in {5 - (new Date().getMinutes() % 5)} min</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Browse Categories Section - FULL LIST (excluding "All Categories") */}
<section className="py-8 bg-white">
  <div className="max-w-7xl mx-auto px-4">
    <h2 className="text-xl font-bold text-center mb-6">Browse Categories</h2>
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleCategoryClick(cat.id)}
          className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 text-center group border border-gray-100 transition-all hover:shadow-sm"
        >
          <cat.icon className="w-6 h-6 mx-auto mb-1 text-green-600" />
          <h3 className="font-medium text-gray-800 text-xs mb-0.5">{cat.name}</h3>
        </button>
      ))}
    </div>
  </div>
</section>

      {/* Featured Ads Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Featured Ads</h2>
            <button onClick={() => navigate("/marketplace?featured=true")} className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center">
              View All <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          {featuredLoading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featuredListings.slice(0, 4).map((listing: any) => (
                <div key={listing.id} onClick={() => handleAdClick(listing.id, 'marketplace')} className="bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer group overflow-hidden border border-gray-100">
                  <div className="relative h-24 bg-gray-100">
                    <ImageWithFallback src={getImageUrl(listing)} alt={listing.title} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">Featured</span>
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-800 text-xs mb-0.5 line-clamp-1 group-hover:text-green-600">{listing.title}</h3>
                    <p className="text-xs font-bold text-green-600">NPR {(listing.price || 0).toLocaleString()}</p>
                    <div className="flex items-center text-gray-400 text-[9px] mt-1 mb-2"><MapPin className="w-2.5 h-2.5 mr-0.5" />{listing.location || "Kathmandu"}</div>
                    <div className="flex gap-1 mt-auto pt-2 border-t border-gray-100">
                      <button onClick={(e) => handleBuyNow(e, listing.id)} disabled={addToCartMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[9px] py-1 rounded-full font-medium transition-colors">
                        Buy
                      </button>
                      <button onClick={(e) => handleAddToCart(e, listing.id)} disabled={addToCartMutation.isPending} className="flex-1 bg-white border border-green-600 text-green-600 hover:bg-green-50 text-[9px] py-1 rounded-full font-medium transition-colors">
                        Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Latest Listings Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Latest Listings</h2>
            <button onClick={() => navigate("/marketplace")} className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center">
              View All <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <p className="text-gray-500 text-xs mb-4">Newest items from our marketplace</p>

          {isLoading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {latestMarketplaceListings.map((item: any) => (
                <div
                  key={`marketplace-${item.id}`}
                  onClick={() => handleAdClick(item.id, 'marketplace')}
                  className="bg-gray-50 rounded-lg hover:shadow-md cursor-pointer group overflow-hidden border border-gray-100"
                >
                  <div className="h-24 bg-gray-100 relative">
                    <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                      For Sale
                    </span>
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-gray-800 text-xs line-clamp-1 group-hover:text-green-600">{item.title}</h3>
                    <p className="text-xs font-bold text-green-600 mt-0.5">
                      NPR {item.price.toLocaleString()}
                    </p>
                    <div className="flex items-center text-gray-400 text-[9px] mt-1 mb-2">
                      <MapPin className="w-2.5 h-2.5 mr-0.5" />
                      {item.location?.split(',')[0]}
                    </div>
                    <div className="flex gap-1 mt-auto pt-2 border-t border-gray-100">
                      <button onClick={(e) => handleBuyNow(e, item.id)} disabled={addToCartMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[9px] py-1 rounded-full font-medium transition-colors">
                        Buy
                      </button>
                      <button onClick={(e) => handleAddToCart(e, item.id)} disabled={addToCartMutation.isPending} className="flex-1 bg-white border border-green-600 text-green-600 hover:bg-green-50 text-[9px] py-1 rounded-full font-medium transition-colors">
                        Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}