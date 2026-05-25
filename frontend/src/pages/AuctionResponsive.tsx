import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
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

// Static auction data with reliable images
const AUCTIONS_DATA: Auction[] = [
  {
    id: 1,
    title: "Vintage Royal Enfield 1965",
    startingPrice: 350000,
    currentPrice: 450000,
    bids: 23,
    timeLeftSeconds: 9900,
    location: "Kathmandu, Bagmati",
    seller: "ClassicBikes",
    sellerName: "Classic Bikes Nepal",
    verified: true,
    rating: 4.8,
    image: "https://picsum.photos/id/111/600/400",
    category: "vehicles",
    subcategory: "bike",
    description: "Beautifully maintained 1965 Royal Enfield Bullet. Single owner, garage kept. Perfect for collectors and enthusiasts.",
    views: 1245,
  },
  {
    id: 2,
    title: "Land in Kathmandu Valley",
    startingPrice: 5000000,
    currentPrice: 8500000,
    bids: 45,
    timeLeftSeconds: 129600,
    location: "Kathmandu, Bagmati",
    seller: "PropertyAuctions",
    sellerName: "Property Auctions Nepal",
    verified: true,
    rating: 4.9,
    image: "https://picsum.photos/id/104/600/400",
    category: "property",
    subcategory: "land",
    description: "Prime commercial land located in the heart of Kathmandu Valley. Perfect for development.",
    views: 2341,
  },
  {
    id: 3,
    title: "Antique Buddha Statue",
    startingPrice: 50000,
    currentPrice: 75000,
    bids: 12,
    timeLeftSeconds: 19200,
    location: "Bhaktapur, Bagmati",
    seller: "AntiquesNepal",
    sellerName: "Antiques Nepal",
    verified: false,
    rating: 4.7,
    image: "https://picsum.photos/id/119/600/400",
    category: "antiques",
    subcategory: "statue",
    description: "Rare 18th century Buddha statue from Bhaktapur. Exceptional craftsmanship and historical value.",
    views: 567,
  },
  {
    id: 4,
    title: "Gold Jewelry Collection",
    startingPrice: 100000,
    currentPrice: 250000,
    bids: 34,
    timeLeftSeconds: 86400,
    location: "Lalitpur, Bagmati",
    seller: "JewelryHub",
    sellerName: "Jewelry Hub",
    verified: true,
    rating: 4.6,
    image: "https://picsum.photos/id/20/600/400",
    category: "antiques",
    subcategory: "jewelry",
    description: "Authentic 22k gold jewelry set including necklace, earrings, and bangles. Hallmarked.",
    views: 987,
  },
  {
    id: 5,
    title: "MacBook Pro M3 Max",
    startingPrice: 250000,
    currentPrice: 320000,
    bids: 56,
    timeLeftSeconds: 43200,
    location: "Kathmandu, Bagmati",
    seller: "TechHub",
    sellerName: "Tech Hub Nepal",
    verified: true,
    rating: 4.9,
    image: "https://picsum.photos/id/0/600/400",
    category: "electronics",
    subcategory: "laptop",
    description: "Latest MacBook Pro M3 Max, 36GB RAM, 1TB SSD. Like new condition with warranty.",
    views: 3456,
  },
  {
    id: 6,
    title: "Modern 3BHK Apartment",
    startingPrice: 15000000,
    currentPrice: 18500000,
    bids: 28,
    timeLeftSeconds: 172800,
    location: "Lalitpur, Bagmati",
    seller: "UrbanLiving",
    sellerName: "Urban Living Realty",
    verified: true,
    rating: 4.8,
    image: "https://picsum.photos/id/106/600/400",
    category: "property",
    subcategory: "apartment",
    description: "Luxury apartment with modern amenities, parking, and stunning city views.",
    views: 876,
  },
];

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
  const [loading, setLoading] = useState(true);
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

  // Simulate API fetch
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setAuctions(AUCTIONS_DATA);
      } catch (err) {
        console.error("Failed to load auctions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading auctions...</p>
        </div>
      </div>
    );
  }

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

            {/* Category Pills - EXACTLY as original but with flex-wrap instead of scrollbar */}
            <div className="mb-6 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const hasSubcategories = SUBCATEGORIES[cat.id] !== undefined;
                const isActive = selectedCategory === cat.id;

                const buttonClass = `flex items-center px-3 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition ${isActive
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
                          <Icon className="w-4 h-4 inline mr-1" />
                          {cat.name}
                          <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
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
                    <Icon className="w-4 h-4 inline mr-1" />
                    {cat.name}
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
              {filteredAuctions.length > 0 ? (
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
