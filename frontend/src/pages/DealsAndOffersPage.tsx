import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock, MapPin, TrendingUp, Flame, Zap,
  ChevronRight, Filter, Search, X,
  ShoppingBag, Eye, Heart, Share2,
  AlertCircle, ChevronDown, Grid, List,
  ArrowUpDown, Tag, Timer, Users, Percent,
  BadgeCheck, Star, MoreHorizontal, Flag, Mail,
  Shield, ExternalLink
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { FeaturedAdCarousel } from "@/components/FeaturedAdCarousel";
// ==================== TYPES ====================
interface Deal {
  id: number;
  title: string;
  currentPrice: number;
  originalPrice?: number;
  discount?: number;
  interested: number;
  timeLeft: string;
  image: string;
  createdAt: string;
  endTime: Date;
  location: string;
  seller: {
    name: string;
    rating: number;
    verified: boolean;
  };
  category: string;
  condition: "new" | "like-new" | "good" | "fair";
  views: number;
  saves: number;
}

type SortOption = "ending-soon" | "newest" | "price-low" | "price-high" | "popular";
type ViewMode = "grid" | "list";
type FilterState = {
  minPrice: number;
  maxPrice: number;
  category: string;
  minDiscount: number;
  condition: string;
};

interface Ad {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  landingUrl: string;
  adType: string;
  placement: string;
}

// ==================== AD CARD COMPONENT ====================
function AdCard({ ad, onClose }: { ad: any; onClose?: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group border border-blue-200 relative">
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm"
          aria-label="Close ad"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      )}

      <a href={ad.landingUrl} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative bg-gray-50" style={{ aspectRatio: '4/3' }}>
          <img
            src={imageError ? `https://picsum.photos/seed/ad${ad.id}/400/300` : ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            Sponsored
          </div>
        </div>

        <div className="p-3">
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
            {ad.title}
          </h4>
          {ad.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ad.description}</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
            <ExternalLink className="w-2.5 h-2.5" />
            <span>External link</span>
          </div>
          <Button
            size="sm"
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 rounded-full text-xs py-1.5 transition-all duration-300"
          >
            Learn More →
          </Button>
        </div>
      </a>
    </div>
  );
}

// ==================== FILTER TABS ====================
const FILTER_TABS = [
  { id: "all", label: "All Deals" },
  { id: "ending-soon", label: "Ending Soon" },
  { id: "big-discount", label: "Big Discount" },
  { id: "trending", label: "Trending" },
] as const;

// ==================== COMPONENTS ====================
const InterestedCounter = ({ count }: { count: number }) => {
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    if (count > displayCount) {
      const timer = setTimeout(() => setDisplayCount(displayCount + 1), 30);
      return () => clearTimeout(timer);
    }
  }, [count, displayCount]);

  return <span>{displayCount}</span>;
};

const ImageWithFallback = ({ src, alt, className }: { src?: string | null; alt: string; className?: string }) => {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) return <div className={`bg-gradient-to-br from-gray-100 to-gray-200 ${className}`} />;
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setImgError(true)} />;
};

const DiscountBadge = ({ discount }: { discount: number }) => {
  const getBadgeColor = () => {
    if (discount >= 50) return "bg-red-600";
    if (discount >= 30) return "bg-orange-500";
    return "bg-yellow-500";
  };

  return (
    <div className={`absolute top-2 right-2 z-10 ${getBadgeColor()} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg`}>
      <div className="flex items-center gap-0.5">
        <Percent className="w-2.5 h-2.5" />
        <span>{discount}% OFF</span>
      </div>
    </div>
  );
};

const TimeRemaining = ({ timeLeft, isUrgent }: { timeLeft: string; isUrgent: boolean }) => (
  <div className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
    }`}>
    <Clock className="w-2.5 h-2.5" /> {timeLeft}
  </div>
);

const ConditionBadge = ({ condition }: { condition: string }) => {
  const badges = {
    "new": { text: "New", color: "bg-emerald-500" },
    "like-new": { text: "Like New", color: "bg-blue-500" },
    "good": { text: "Good", color: "bg-amber-500" },
    "fair": { text: "Fair", color: "bg-orange-500" }
  };
  const badge = badges[condition as keyof typeof badges] || badges.good;
  return <span className={`text-white text-[9px] px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.text}</span>;
};

// Grid View Card - EXACT same dimensions as Marketplace/Auction
const DealCardGrid = ({ deal, onClick, onToggleFavorite, isFavorited }: {
  deal: Deal;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  isFavorited: boolean;
}) => {
  const isUrgent = deal.timeLeft.includes('h') && parseInt(deal.timeLeft) < 3;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="relative aspect-square bg-gray-100">
        <ImageWithFallback src={deal.image} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <DiscountBadge discount={deal.discount || 0} />
        <div className="absolute top-2 left-2">
          <TimeRemaining timeLeft={deal.timeLeft} isUrgent={isUrgent} />
        </div>
        <button
          onClick={onToggleFavorite}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
        </button>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
          <Eye className="w-2.5 h-2.5" />
          {deal.views}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-500">{deal.category}</span>
          </div>
          <ConditionBadge condition={deal.condition} />
        </div>

        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-red-500 transition-colors">
          {deal.title}
        </h3>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-red-600 font-bold text-lg">
            NPR {deal.currentPrice.toLocaleString()}
          </span>
          {deal.originalPrice && (
            <span className="text-[10px] text-gray-400 line-through">
              NPR {deal.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{deal.location}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {deal.seller.name[0].toUpperCase()}
            </div>
            <span className="text-xs truncate max-w-[100px]">{deal.seller.name}</span>
            {deal.seller.verified && (
              <BadgeCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{deal.seller.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-0.5 flex-1">
            <Users className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] text-gray-600"><InterestedCounter count={deal.interested} /> watching</span>
          </div>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-xs py-1.5 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Grab Deal
          </Button>
        </div>
      </div>
    </div>
  );
};

// List View Card - EXACT same dimensions as Marketplace/Auction
const DealCardList = ({ deal, onClick, onToggleFavorite, isFavorited }: {
  deal: Deal;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  isFavorited: boolean;
}) => {
  const isUrgent = deal.timeLeft.includes('h') && parseInt(deal.timeLeft) < 3;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer group transition-all duration-200 flex"
    >
      <div className="relative w-36 sm:w-48 flex-shrink-0 bg-gray-100">
        <ImageWithFallback src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
        <DiscountBadge discount={deal.discount || 0} />
        <div className="absolute top-2 left-2">
          <TimeRemaining timeLeft={deal.timeLeft} isUrgent={isUrgent} />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 group-hover:text-red-500 transition-colors mb-1">
            {deal.title}
          </h3>
          <div className="flex gap-1">
            <button onClick={onToggleFavorite}>
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button onClick={(e) => e.stopPropagation()} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100">
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(`${window.location.origin}/deal/${deal.id}`);
                }}>
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}>
                  <Mail className="w-4 h-4 mr-2" /> Contact Seller
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500" onClick={(e) => e.stopPropagation()}>
                  <Flag className="w-4 h-4 mr-2" /> Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-red-600 font-bold text-lg">
            NPR {deal.currentPrice.toLocaleString()}
          </span>
          {deal.originalPrice && (
            <span className="text-[10px] text-gray-400 line-through">
              NPR {deal.originalPrice.toLocaleString()}
            </span>
          )}
          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
            -{deal.discount}%
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <MapPin className="w-3 h-3" />
          <span>{deal.location}</span>
          <span className="mx-1">•</span>
          <Users className="w-3 h-3" />
          <span><InterestedCounter count={deal.interested} /> watching</span>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
              {deal.seller.name[0].toUpperCase()}
            </div>
            <span className="text-xs text-gray-600 font-medium truncate max-w-[120px]">
              {deal.seller.name}
            </span>
            {deal.seller.verified && (
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
            )}
            <div className="flex items-center gap-0.5 ml-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{deal.seller.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="w-3 h-3" />{deal.views}
            </span>
            <ConditionBadge condition={deal.condition} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================
export default function DealsAndOffersPage() {
  const [, navigate] = useLocation();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("ending-soon");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [favoriteItems, setFavoriteItems] = useState<number[]>([]);
  const [activeFilterTab, setActiveFilterTab] = useState("all");

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 0,
    category: "",
    minDiscount: 0,
    condition: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  // trpc queries
  const { data: dealsData, isLoading: dealsLoading } = (trpc as any).deals.getLiveDeals.useQuery({
    limit: 50,
    sortBy: sortBy === "ending-soon" ? "discount" : sortBy === "popular" ? "popular" : sortBy === "newest" ? "newest" : sortBy === "price-low" ? "price-low" : "price-high"
  });

  const { data: trendingLocationsData, isLoading: trendingLoading } = (trpc as any).search.trendingLocations.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const { data: topSellersData, isLoading: topSellersLoading } = (trpc as any).search.topSellers.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const { data: realAds } = (trpc as any).ads.getActiveAds.useQuery({ placement: "sidebar_right" });
  const [hiddenAds, setHiddenAds] = useState<number[]>([]);
  const visibleAds = (realAds || []).filter((ad: any) => !hiddenAds.includes(ad.id));

  const handleHideAd = useCallback((adId: number) => {
    setHiddenAds((prev) => [...prev, adId]);
  }, []);

  useEffect(() => {
    if (dealsData) {
      setDeals(dealsData as any);
      setFilteredDeals(dealsData as any);
      setLoading(false);
    } else if (!dealsLoading) {
      setLoading(false);
    }
  }, [dealsData, dealsLoading]);

  const categories = Array.from(new Set(deals.map(deal => deal.category)));

  // Real-time countdown updates
  useEffect(() => {
    const timer = setInterval(() => {
      setDeals(prevDeals =>
        prevDeals.map(deal => {
          const now = new Date();
          const dealEndTime = new Date(deal.endTime);
          const diff = dealEndTime.getTime() - now.getTime();

          if (diff <= 0) return { ...deal, timeLeft: "Expired" };

          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          return {
            ...deal,
            timeLeft: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
          };
        })
      );
    }, 10000); // Update every 10 seconds to save performance

    return () => clearInterval(timer);
  }, [deals.length]);

  // Filter and sort deals
  useEffect(() => {
    let result = [...deals];

    // Search filter
    if (searchQuery) {
      result = result.filter(deal =>
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filter
    if (filters.minPrice > 0) {
      result = result.filter(deal => deal.currentPrice >= filters.minPrice);
    }
    if (filters.maxPrice > 0) {
      result = result.filter(deal => deal.currentPrice <= filters.maxPrice);
    }

    // Category filter
    if (filters.category) {
      result = result.filter(deal => deal.category === filters.category);
    }

    // Discount filter
    if (filters.minDiscount > 0) {
      result = result.filter(deal => (deal.discount || 0) >= filters.minDiscount);
    }

    // Condition filter
    if (filters.condition) {
      result = result.filter(deal => deal.condition === filters.condition);
    }

    // Tab filters
    if (activeFilterTab === "ending-soon") {
      result = result.filter(deal => {
        const hours = parseInt(deal.timeLeft);
        return !isNaN(hours) && hours < 6;
      });
    } else if (activeFilterTab === "big-discount") {
      result = result.filter(deal => (deal.discount || 0) >= 40);
    } else if (activeFilterTab === "trending") {
      result = result.filter(deal => deal.interested > 100);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "ending-soon":
          return a.endTime.getTime() - b.endTime.getTime();
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "price-low":
          return a.currentPrice - b.currentPrice;
        case "price-high":
          return b.currentPrice - a.currentPrice;
        case "popular":
          return b.interested - a.interested;
        default:
          return 0;
      }
    });

    setFilteredDeals(result);
  }, [deals, searchQuery, filters, sortBy, activeFilterTab]);

  const toggleFavorite = useCallback((dealId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteItems(prev =>
      prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
    );
  }, []);

  const handleDealClick = (dealId: number) => {
    navigate(`/deal/${dealId}`);
  };

  const resetAllFilters = () => {
    setFilters({ minPrice: 0, maxPrice: 0, category: "", minDiscount: 0, condition: "" });
    setSearchQuery("");
    setSortBy("ending-soon");
    setActiveFilterTab("all");
    setShowFilters(false);
  };

  const totalDeals = deals.length;
  const totalInterested = deals.reduce((sum, d) => sum + d.interested, 0);

  return (
    <>
      <SEO
        title="Live Deals & Offers - Sasto Marketplace"
        description="Grab the best live deals and offers on electronics, vehicles, property, and more. Limited time discounts updated in real-time!"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - EXACT same size as Marketplace/Auction/Rentals */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Live Deals & Offers</h1>
            <p className="text-red-100 text-base mb-6 max-w-2xl mx-auto">
              Limited time deals updated in real-time. Grab them before they're gone!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">{totalDeals}</p>
                <p className="text-xs">Active Deals</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">{totalInterested.toLocaleString()}+</p>
                <p className="text-xs">Interested</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">24/7</p>
                <p className="text-xs">Live</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">100%</p>
                <p className="text-xs">Secure</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* MAIN CONTENT */}
            <div className="flex-1">
              {/* Search Bar - matching Marketplace */}
              <div className="relative w-full mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border-gray-200 rounded-full h-10 w-full"
                />
              </div>

              {/* Filter Tabs - matching Marketplace style */}
              <div className="flex flex-wrap gap-2 mb-5 border-b pb-2">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilterTab(tab.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${activeFilterTab === tab.id
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-red-50 border border-gray-200"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${showFilters
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-red-50 border border-gray-200"
                    }`}
                >
                  <Filter className="w-3 h-3" /> Filters
                </button>
              </div>

              {/* Advanced Filters Panel */}
              {showFilters && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">Advanced Filters</h3>
                    <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Min Price (NPR)</label>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ''}
                        onChange={(e) => setFilters({ ...filters, minPrice: parseInt(e.target.value) || 0 })}
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Price (NPR)</label>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ''}
                        onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) || 0 })}
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Min Discount (%)</label>
                      <Input
                        type="number"
                        placeholder="Min Discount"
                        value={filters.minDiscount || ''}
                        onChange={(e) => setFilters({ ...filters, minDiscount: parseInt(e.target.value) || 0 })}
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
                      <select
                        value={filters.condition}
                        onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      >
                        <option value="">All</option>
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" className="text-gray-500 hover:text-red-500" onClick={resetAllFilters}>
                      Clear All Filters
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white px-8" onClick={() => setShowFilters(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Count and View Toggle - matching Marketplace */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-5">
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">
                    {loading ? "Loading..." : `${filteredDeals.length} deals found`}
                  </span>
                  {searchQuery && <span> for "<span className="text-red-600">{searchQuery}</span>"</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white border border-gray-200 rounded-full p-0.5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-full transition ${viewMode === "grid" ? "bg-red-600 text-white" : "text-gray-500"}`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-full transition ${viewMode === "list" ? "bg-red-600 text-white" : "text-gray-500"}`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                      <div className="bg-gray-200 aspect-square" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Deals Display - Grid View */}
              {!loading && viewMode === "grid" && filteredDeals.length > 0 && (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                  {filteredDeals.map((deal) => (
                    <DealCardGrid
                      key={deal.id}
                      deal={deal}
                      onClick={() => handleDealClick(deal.id)}
                      onToggleFavorite={(e) => toggleFavorite(deal.id, e)}
                      isFavorited={favoriteItems.includes(deal.id)}
                    />
                  ))}
                </div>
              )}

              {/* Deals Display - List View */}
              {!loading && viewMode === "list" && filteredDeals.length > 0 && (
                <div className="space-y-4">
                  {filteredDeals.map((deal) => (
                    <DealCardList
                      key={deal.id}
                      deal={deal}
                      onClick={() => handleDealClick(deal.id)}
                      onToggleFavorite={(e) => toggleFavorite(deal.id, e)}
                      isFavorited={favoriteItems.includes(deal.id)}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredDeals.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔥</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No deals found</h3>
                  <p className="text-gray-400 text-sm mb-6">Try changing your search or filters</p>
                  <button
                    onClick={resetAllFilters}
                    className="px-5 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
              {/* Featured Deals Carousel — real sponsored data */}
              <FeaturedAdCarousel title="Featured Deals" accentColor="rose" />

              {/* Trending Deals Card — real data from API */}
              <div className="bg-white border-2 border-red-500 rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">🔥 Trending Now</h3>
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">HOT</span>
                </div>
                <div className="space-y-3">
                  {deals.slice(0, 3).map((deal) => (
                    <div
                      key={deal.id}
                      className="flex gap-3 items-center p-2 rounded hover:bg-gray-50 cursor-pointer transition-all"
                      onClick={() => handleDealClick(deal.id)}
                    >
                      <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden shrink-0">
                        <img src={deal.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate mb-1">{deal.title}</p>
                        <p className="text-xs text-red-600 font-bold">NPR {deal.currentPrice.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users className="w-2.5 h-2.5 text-orange-500" />
                          <span className="text-[9px] text-gray-500">{deal.interested} watching</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Locations - Shows real locations from database */}
              {!trendingLoading && trendingLocationsData && trendingLocationsData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Trending Locations
                  </h3>
                  <div className="space-y-3">
                    {trendingLocationsData.map((loc, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                        onClick={() => setSearchQuery(loc.name)}
                      >
                        <div>
                          <p className="font-semibold text-xs text-gray-800">{loc.name}</p>
                          <p className="text-[10px] text-gray-500">{loc.count} deals</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold text-gray-700">{loc.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Rated Sellers */}
              {!topSellersLoading && topSellersData && topSellersData.length > 0 && (
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    Top Rated Sellers
                  </h3>
                  <div className="space-y-3">
                    {topSellersData.slice(0, 4).map((seller) => (
                      <div
                        key={seller.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                        onClick={() => navigate(`/seller/${seller.id}`)}
                      >
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {seller.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{seller.name}</p>
                          <p className="text-[10px] text-red-600">{seller.totalListings} deals</p>
                        </div>
                        {seller.verificationStatus === "verified" && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Why Shop With Us?</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-gray-600">Secure Payments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-gray-600">Verified Sellers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-gray-600">Best Deals Guaranteed</span>
                  </div>
                </div>
              </div>

              {/* Sponsored */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-2">Sponsored</p>
                <div className="bg-red-50 rounded-lg p-4 flex flex-col items-center">
                  <p className="text-red-600 font-bold text-sm">Want to see your deal here?</p>
                  <p className="text-gray-500 text-[10px] mt-1 mb-3">Reach 50,000+ potential buyers daily</p>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] border-red-400 text-red-600 rounded-full" onClick={() => navigate("/promote")}>
                    Promote Now
                  </Button>
                </div>
              </div>

              {/* Display Real Ads from Backend */}
              {visibleAds.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-500">Sponsored</h3>
                    <span className="text-[10px] text-gray-400">Advertisement</span>
                  </div>
                  {visibleAds.map((ad: any) => (
                    <AdCard key={ad.id} ad={ad} onClose={() => handleHideAd(ad.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
