import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Clock, MapPin, Star, Gavel, Users, Shield, TrendingUp,
  Search, ChevronDown, Grid3x3, List, Home, Car, Tv, Gem, Sparkles,
  Heart, Eye, BadgeCheck, MoreHorizontal, Share2, Flag, Mail, Loader2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FeaturedAdCarousel } from "@/components/FeaturedAdCarousel";

// Types
interface Auction {
  id: number;
  title: string;
  startingPrice: number;
  currentPrice: number;
  bids: number;
  timeLeftSeconds: number;
  location: string;
  seller: string;
  sellerName: string;
  verified: boolean;
  rating: number;
  image: string;
  category: string;
  subcategory: string;
  description: string;
  views: number;
}

// No mock data — production mode uses live database only

const CATEGORIES = [
  { id: "all", name: "All Categories", icon: Sparkles },
  { id: "antiques", name: "Antiques & Collectibles", icon: Gem },
  { id: "electronics", name: "Electronics", icon: Tv },
  { id: "property", name: "Property", icon: Home },
  { id: "vehicles", name: "Vehicle", icon: Car },
];

const SUBCATEGORIES: Record<string, { id: string, name: string }[]> = {
  property: [
    { id: "land", name: "Land" },
    { id: "apartment", name: "Apartments" },
    { id: "house", name: "Houses" },
  ],
  vehicles: [
    { id: "bike", name: "Bikes" },
    { id: "car", name: "Cars" },
    { id: "heavy", name: "Heavy Vehicles" },
  ],
  electronics: [
    { id: "mobile", name: "Mobile Phones" },
    { id: "laptop", name: "Laptops" },
    { id: "camera", name: "Cameras" },
  ],
  antiques: [
    { id: "statue", name: "Statues" },
    { id: "jewelry", name: "Jewelry" },
    { id: "art", name: "Art & Paintings" },
    { id: "coins", name: "Coins" },
  ]
};

// Global timer for TimeRemaining components
let globalTimer: number | null = null;
let subscribers: Array<() => void> = [];

function notifySubscribers() {
  subscribers.forEach(cb => cb());
}

function startGlobalTimer() {
  if (globalTimer) return;
  globalTimer = window.setInterval(() => {
    notifySubscribers();
  }, 1000);
}

function stopGlobalTimer() {
  if (globalTimer && subscribers.length === 0) {
    clearInterval(globalTimer);
    globalTimer = null;
  }
}

// Compact TimeRemaining component with fixed memory leak
function TimeRemaining({ seconds }: { seconds: number }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
    const update = () => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    };
    subscribers.push(update);
    startGlobalTimer();
    return () => {
      subscribers = subscribers.filter(fn => fn !== update);
      stopGlobalTimer();
    };
  }, [seconds]);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  let text = "";
  let colorClass = "bg-orange-100 text-orange-700";
  if (timeLeft < 3600) colorClass = "bg-red-100 text-red-700";
  else if (timeLeft < 86400) colorClass = "bg-yellow-100 text-yellow-700";

  if (days > 0) text = `${days}d ${hours}h`;
  else if (hours > 0) text = `${hours}h ${minutes}m`;
  else if (minutes > 0) text = `${minutes}m ${secs}s`;
  else text = `${secs}s`;

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${colorClass} px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
      <Clock className="w-2.5 h-2.5" /> {text}
    </span>
  );
}

// Auction Card Component
function AuctionCard({ auction, viewMode, isFavorite, onToggleFavorite, onNavigate }: {
  auction: Auction;
  viewMode: "grid" | "list";
  isFavorite: boolean;
  onToggleFavorite: (id: number, e: React.MouseEvent) => void;
  onNavigate: (id: number) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const imageSrc = imgError ? `https://picsum.photos/seed/fallback_${auction.id}/400/400` : auction.image;

  const handleImageError = () => {
    setImgError(true);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(`${window.location.origin}/auction/${auction.id}`);
  };

  if (viewMode === "grid") {
    return (
      <div
        key={auction.id}
        onClick={() => onNavigate(auction.id)}
        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="relative aspect-square bg-gray-100">
          <img
            src={imageSrc}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
          <div className="absolute top-2 left-2">
            <TimeRemaining seconds={auction.timeLeftSeconds} />
          </div>
          <button
            onClick={(e) => onToggleFavorite(auction.id, e)}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
          </button>
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            <Gavel className="w-2.5 h-2.5" />
            {auction.bids} bids
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-orange-600 transition-colors">
            {auction.title}
          </h3>
          <p className="text-orange-600 font-bold text-lg mt-1">
            NPR {auction.currentPrice.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{auction.location}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                {auction.sellerName[0].toUpperCase()}
              </div>
              <span className="text-xs truncate max-w-[100px]">{auction.sellerName}</span>
              {auction.verified && (
                <BadgeCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{auction.rating}</span>
            </div>
          </div>
          <Button
            className="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-sm py-2 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(auction.id);
            }}
          >
            Place Bid
          </Button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      key={auction.id}
      onClick={() => onNavigate(auction.id)}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer group transition-all duration-200 flex"
    >
      <div className="relative w-36 sm:w-48 flex-shrink-0 bg-gray-100">
        <img
          src={imageSrc}
          alt={auction.title}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
        <div className="absolute top-2 left-2">
          <TimeRemaining seconds={auction.timeLeftSeconds} />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 group-hover:text-orange-600 transition-colors mb-1">
          {auction.title}
        </h3>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-orange-600 font-bold text-lg">
            NPR {auction.currentPrice.toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">Current bid</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <MapPin className="w-3 h-3" />
          <span>{auction.location}</span>
          <span className="mx-1">•</span>
          <Gavel className="w-3 h-3" />
          <span>{auction.bids} bids</span>
        </div>
        <p className="text-gray-500 text-xs line-clamp-2 mb-3 hidden sm:block">
          {auction.description}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
              {auction.sellerName[0].toUpperCase()}
            </div>
            <span className="text-xs text-gray-600 font-medium truncate max-w-[120px]">{auction.sellerName}</span>
            {auction.verified && (
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
            )}
            <div className="flex items-center gap-0.5 ml-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{auction.rating}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="w-3 h-3" />{auction.views}
            </span>
            <button
              onClick={(e) => onToggleFavorite(auction.id, e)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button onClick={(e) => e.stopPropagation()} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100" aria-label="More options">
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onNavigate(auction.id); }}>
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
      </div>
    </div>
  );
}

// Main AuctionResponsive Component
export function AuctionResponsive() {
  const [, navigate] = useLocation();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [activeFilterTab, setActiveFilterTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"endingSoon" | "priceLow" | "priceHigh">("endingSoon");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const touchStartRef = useRef<{ y: number; id: string } | null>(null);
  const [favoriteItems, setFavoriteItems] = useState<number[]>(() => {
    const saved = localStorage.getItem("auctionFavorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch auctions from live backend TRPC endpoint
  const { data: liveAuctionsData, isLoading } = trpc.auctions.list.useQuery({ limit: 50 }, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 min cache — no re-fetch on every visit
  });

  const { data: trendingLocationsData } = trpc.search.trendingLocations.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10, // 10 min — slow-changing data
  });

  const { data: topSellersData } = trpc.search.topSellers.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  });

  // Map live database auctions — no mock fallback
  const auctionsList = useMemo(() => {
    if (!liveAuctionsData || liveAuctionsData.length === 0) {
      return [];
    }
    return liveAuctionsData.map((a: any) => ({
      id: Number(a.id),
      title: a.title || a.listing?.title || "",
      startingPrice: Number(a.startingPrice || a.listing?.price || 0),
      currentPrice: Number(a.currentPrice || a.listing?.price || 0),
      bids: Number(a.bidsCount || a.bids?.length || 0),
      timeLeftSeconds: a.endTime ? Math.max(0, Math.floor((new Date(a.endTime).getTime() - Date.now()) / 1000)) : 86400,
      location: a.listing?.location || "Nepal",
      seller: a.listing?.seller?.name || "Seller",
      sellerName: a.listing?.seller?.name || "Seller",
      verified: !!a.listing?.seller?.isVerified,
      rating: Number(a.listing?.seller?.rating || 4.5),
      image: a.listing?.images?.[0] || "",
      category: a.listing?.category || "other",
      subcategory: a.listing?.subcategory || "",
      description: a.listing?.description || "",
      views: Number(a.listing?.views || 0)
    }));
  }, [liveAuctionsData]);

  useEffect(() => {
    if (auctionsList) {
      setAuctions(auctionsList);
    }
  }, [auctionsList]);

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem("auctionFavorites", JSON.stringify(favoriteItems));
  }, [favoriteItems]);

  const toggleFavorite = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleNavigate = useCallback((id: number) => {
    navigate(`/auction/${id}`);
  }, [navigate]);

  // Filter and sort auctions with useMemo
  const filteredAuctions = useMemo(() => {
    let filtered = auctions.filter(a =>
      (selectedCategory === "all" || a.category === selectedCategory) &&
      (selectedSubcategory === "all" || a.subcategory === selectedSubcategory)
    );

    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilterTab === "endingSoon") {
      filtered = filtered.filter(a => a.timeLeftSeconds < 3600);
    } else if (activeFilterTab === "justStarted") {
      filtered = filtered.filter(a => a.timeLeftSeconds > 86400);
    } else if (activeFilterTab === "highBids") {
      filtered = filtered.filter(a => a.bids > 20);
    }

    const sorted = [...filtered];
    if (sortBy === "endingSoon") sorted.sort((a, b) => a.timeLeftSeconds - b.timeLeftSeconds);
    if (sortBy === "priceLow") sorted.sort((a, b) => a.currentPrice - b.currentPrice);
    if (sortBy === "priceHigh") sorted.sort((a, b) => b.currentPrice - a.currentPrice);

    return sorted;
  }, [auctions, selectedCategory, selectedSubcategory, searchTerm, activeFilterTab, sortBy]);

  const totalBids = auctions.reduce((s, a) => s + a.bids, 0);
  const activeAuctions = auctions.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Live Auctions</h1>
          <p className="text-orange-100 text-base mb-6 max-w-2xl mx-auto">
            Bid on exclusive items and win amazing deals
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">{activeAuctions}</p>
              <p className="text-xs">Active</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">{totalBids}</p>
              <p className="text-xs">Bids</p>
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
            {/* Search Bar */}
            <div className="relative w-full mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Search auctions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border-gray-200 rounded-full h-10 w-full"
              />
            </div>

            {/* Category Pills */}
            <div className="mb-6 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const hasSubcategories = SUBCATEGORIES[cat.id] !== undefined;
                const isActive = selectedCategory === cat.id;

                const buttonClass = `w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[12px] font-medium transition overflow-hidden ${isActive
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-orange-50"
                  }`;

                if (hasSubcategories) {
                  return (
                    <DropdownMenu 
                      key={cat.id} 
                      modal={false}
                      open={openDropdown === cat.id}
                      onOpenChange={(isOpen) => setOpenDropdown(isOpen ? cat.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <button 
                          className={buttonClass}
                          onPointerDown={(e) => {
                            if (e.pointerType === 'touch') {
                              // Block Radix from auto-opening; record start position for tap-detection
                              e.preventDefault();
                              touchStartRef.current = { y: e.clientY, id: cat.id };
                            }
                          }}
                          onPointerUp={(e) => {
                            if (e.pointerType === 'touch' && touchStartRef.current?.id === cat.id) {
                              const moved = Math.abs(e.clientY - touchStartRef.current.y);
                              touchStartRef.current = null;
                              // Only open if finger barely moved (tap, not scroll)
                              if (moved < 8) {
                                setOpenDropdown(prev => prev === cat.id ? null : cat.id);
                              }
                            }
                          }}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{cat.name}</span>
                          <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-70" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-white min-w-[150px]">
                        <DropdownMenuItem
                          className={`cursor-pointer ${isActive && selectedSubcategory === "all" ? "bg-orange-50 font-semibold" : ""}`}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedSubcategory("all");
                            setOpenDropdown(null);
                          }}
                        >
                          All {cat.name}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {SUBCATEGORIES[cat.id].map((sub) => (
                          <DropdownMenuItem
                            key={sub.id}
                            className={`cursor-pointer ${isActive && selectedSubcategory === sub.id ? "bg-orange-50 font-semibold" : ""}`}
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setSelectedSubcategory(sub.id);
                              setOpenDropdown(null);
                            }}
                          >
                            {sub.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedSubcategory("all");
                    }}
                    className={buttonClass}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-5 border-b pb-2">
              {[
                { id: "all", label: "All Auctions" },
                { id: "endingSoon", label: "Ending Soon" },
                { id: "justStarted", label: "Just Started" },
                { id: "highBids", label: "High Bids" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilterTab(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${activeFilterTab === tab.id
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-orange-50 border border-gray-200"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Count and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-5">
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">
                  {filteredAuctions.length} auctions found
                </span>
                {searchTerm && <span> for "<span className="text-orange-600 font-medium">{searchTerm}</span>"</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-white border border-gray-200 rounded-full p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-full transition ${viewMode === "grid" ? "bg-orange-500 text-white" : "text-gray-500"}`}
                  >
                    <Grid3x3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-full transition ${viewMode === "list" ? "bg-orange-500 text-white" : "text-gray-500"}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* Auction Cards */}
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {isLoading ? (
                // Skeleton grid — renders instantly, no full-page spinner
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : filteredAuctions.length > 0 ? (
                filteredAuctions.map((auction) => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    viewMode={viewMode}
                    isFavorite={favoriteItems.includes(auction.id)}
                    onToggleFavorite={toggleFavorite}
                    onNavigate={handleNavigate}
                  />
                ))
              ) : auctionsList.length === 0 ? (
                <div className="text-center py-12 col-span-full">
                  <div className="text-5xl mb-4">🔨</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No auctions listed yet</h3>
                  <p className="text-gray-400 text-sm mb-6">Be the first to create an auction listing!</p>
                </div>
              ) : (
                <div className="text-center py-12 col-span-full">
                  <div className="text-5xl mb-4">🔨</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No auctions match your filters</h3>
                  <p className="text-gray-400 text-sm mb-6">Try changing your search or filters</p>
                  <button
                    onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setActiveFilterTab("all"); }}
                    className="px-5 py-2 bg-orange-600 text-white rounded-full text-sm font-medium hover:bg-orange-700 transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR - Fixed width */}
          <div className="w-[65%] mx-auto lg:w-80 flex-shrink-0 space-y-6">

            {/* Featured Auctions Carousel — real sponsored data */}
            <FeaturedAdCarousel title="Featured Auctions" accentColor="orange" />

            {/* Trending Bids */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Trending Bids</h3>
              <div className="space-y-4">
                {[...auctions]
                  .sort((a, b) => b.bids - a.bids)
                  .slice(0, 4)
                  .map((auction) => (
                    <div
                      key={auction.id}
                      className="flex gap-3 items-center p-2 rounded hover:bg-gray-50 cursor-pointer transition-all border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                      onClick={() => handleNavigate(auction.id)}
                    >
                      <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden shrink-0">
                        <img src={auction.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate mb-1">{auction.title}</p>
                        <p className="text-xs text-orange-600 font-bold">NPR {auction.currentPrice.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-500">{auction.bids} bids</span>
                          <TimeRemaining seconds={auction.timeLeftSeconds} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Trending Locations - Shows real locations from database */}
            {trendingLocationsData && trendingLocationsData.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  Trending Locations
                </h3>
                <div className="space-y-3">
                  {trendingLocationsData.map((loc, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                      onClick={() => setSearchTerm(loc.name)}
                    >
                      <div>
                        <p className="font-semibold text-xs text-gray-800">{loc.name}</p>
                        <p className="text-[10px] text-gray-500">{loc.count} auctions</p>
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
            {topSellersData && topSellersData.length > 0 && (
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  Top Rated Sellers
                </h3>
                <div className="space-y-3">
                  {topSellersData.slice(0, 4).map((seller) => (
                    <div
                      key={seller.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                      onClick={() => navigate(`/seller/${seller.id}`)}
                    >
                      <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {seller.name?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{seller.name}</p>
                        <p className="text-[10px] text-orange-600">{seller.totalListings} auctions</p>
                      </div>
                      {seller.verificationStatus === "verified" && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Why Bid With Us?</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-gray-600">100% Secure Transactions</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-gray-600">Verified Sellers Only</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-gray-600">Best Deals Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Sponsored */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-2">Sponsored</p>
              <div className="bg-orange-50 rounded-lg p-4 flex flex-col items-center">
                <p className="text-orange-600 font-bold text-sm">Want to see your auction here?</p>
                <p className="text-gray-500 text-[10px] mt-1 mb-3">Reach 50,000+ potential bidders daily</p>
                <Button variant="outline" size="sm" className="h-7 text-[10px] border-orange-400 text-orange-600 rounded-full">
                  Promote Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuctionResponsive;
