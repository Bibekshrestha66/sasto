import { useState, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Star,
  TrendingUp,
  Search,
  Home,
  Car,
  Laptop,
  Wrench,
  Building,
  Heart,
  Eye,
  BadgeCheck,
  MoreHorizontal,
  Share2,
  Flag,
  Mail,
  Calendar,
  Users,
  Shield,
  Sparkles,
  Grid,
  List,
  ChevronDown,
  Briefcase
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FeaturedAdCarousel } from "@/components/FeaturedAdCarousel";

// No mock data — production mode uses live database only

const CATEGORIES = [
  { id: "all", name: "All Categories", icon: Sparkles },
  { id: "commercial", name: "Commercial", icon: Building },
  { id: "electronics", name: "Electronics", icon: Laptop },
  { id: "equipment", name: "Equipment", icon: Wrench },
  { id: "property", name: "Property", icon: Home },
  { id: "skills", name: "Skills", icon: Briefcase },
  { id: "vehicles", name: "Vehicles", icon: Car },
];

const SUBCATEGORIES: Record<string, { id: string, name: string }[]> = {
  property: [
    { id: "apartment", name: "Apartments" },
    { id: "house", name: "Houses" },
    { id: "room", name: "Rooms" },
  ],
  vehicles: [
    { id: "car", name: "Cars" },
    { id: "bike", name: "Bikes" },
    { id: "heavy", name: "Heavy Vehicles" },
  ],
  electronics: [
    { id: "laptop", name: "Laptops" },
    { id: "camera", name: "Cameras" },
    { id: "audio", name: "Audio" },
  ],
  equipment: [
    { id: "camera", name: "Camera Gear" },
    { id: "construction", name: "Construction" },
    { id: "medical", name: "Medical" },
    { id: "tools", name: "Tools" },
    { id: "gears", name: "Gears" },
  ],
  commercial: [
    { id: "office", name: "Office Space" },
    { id: "retail", name: "Retail Shop" },
    { id: "warehouse", name: "Warehouse" },
  ],
  skills: [
    { id: "auto_mechanic", name: "Auto Mechanic" },
    { id: "carpenter", name: "Carpenter" },
    { id: "demolition", name: "Demolition" },
    { id: "design", name: "Design" },
    { id: "drywaller", name: "Drywaller/Sheetrocking" },
    { id: "electrician", name: "Electrician" },
    { id: "flooring", name: "Flooring Installer" },
    { id: "labor", name: "General Labor" },
    { id: "housekeeping", name: "Housekeeping/Janitorial" },
    { id: "hvac", name: "HVAC Technician" },
    { id: "landscaper", name: "Landscaper/Gardener" },
    { id: "mason", name: "Mason" },
    { id: "painter", name: "Painter" },
    { id: "plumber", name: "Plumber" },
    { id: "programming", name: "Programming" },
    { id: "repair", name: "Repair & Maintenance" },
    { id: "roofer", name: "Roofer" },
    { id: "tutoring", name: "Tutoring" },
    { id: "warehouse", name: "Warehouse/Forklift Operator" },
    { id: "welder", name: "Welder" },
    { id: "ai_skills", name: "AI Skills" },
    { id: "others", name: "Others" },
  ]
};

const FILTER_TABS = [
  { id: "all", label: "All Rentals" },
  { id: "newest", label: "Newest" },
  { id: "price_low", label: "Price Low → High" },
  { id: "price_high", label: "Price High → Low" },
  { id: "rating", label: "Top Rated" },
];

export function RentalResponsive() {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [activeFilterTab, setActiveFilterTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteItems, setFavoriteItems] = useState<number[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const touchStartRef = useRef<{ y: number; id: string } | null>(null);

  // Fetch real-time rentals from backend database
  const { data: liveRentalsData } = trpc.rentals.list.useQuery({ limit: 50 }, {
    refetchOnWindowFocus: false,
  });

  const { data: trendingLocationsData, isLoading: trendingLoading } = trpc.search.trendingLocations.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Map live database rentals — no mock fallback
  const rentalsList = useMemo(() => {
    if (!liveRentalsData || liveRentalsData.length === 0) {
      return [];
    }
    return liveRentalsData.map((r: any) => ({
      id: Number(r.id),
      title: r.title || "",
      pricePerDay: Number(r.price || 0),
      location: r.location || "Nepal",
      sellerName: r.seller?.name || "Owner",
      verified: !!r.seller?.isVerified,
      rating: Number(r.seller?.rating || 4.5),
      images: r.images && r.images.length > 0 ? r.images : [],
      category: r.category || "other",
      subcategory: r.subcategory || "",
      createdAt: r.createdAt || new Date().toISOString(),
      views: Number(r.views || 0),
      description: r.description || "",
    }));
  }, [liveRentalsData]);

  let filteredRentals = rentalsList.filter(r =>
    (selectedCategory === "all" || r.category === selectedCategory) &&
    (selectedSubcategory === "all" || r.subcategory === selectedSubcategory)
  );
  filteredRentals = filteredRentals.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  switch (activeFilterTab) {
    case "newest":
      filteredRentals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "price_low":
      filteredRentals.sort((a, b) => a.pricePerDay - b.pricePerDay);
      break;
    case "price_high":
      filteredRentals.sort((a, b) => b.pricePerDay - a.pricePerDay);
      break;
    case "rating":
      filteredRentals.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default:
      break;
  }

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleShare = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(`${window.location.origin}/rentals/${id}`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackId?: string) => {
    e.currentTarget.src = `https://picsum.photos/seed/${fallbackId || Date.now()}/400/400`;
  };

  const totalRentals = rentalsList.length;
  const totalViews = rentalsList.reduce((sum, r) => sum + (r.views || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Rent Anything, Anytime</h1>
          <p className="text-purple-100 text-base mb-6 max-w-2xl mx-auto">
            From apartments to cars, laptops to cameras – rent what you need, when you need it
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">{totalRentals}</p>
              <p className="text-xs">Active Rentals</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">{totalViews.toLocaleString()}+</p>
              <p className="text-xs">Total Views</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">24/7</p>
              <p className="text-xs">Support</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">100%</p>
              <p className="text-xs">Verified</p>
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
                placeholder="Search rentals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border-gray-200 rounded-full h-10 w-full"
              />
            </div>

            {/* Horizontal Category Pills */}
            <div className="mb-6 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const hasSubcategories = SUBCATEGORIES[cat.id] !== undefined;
                const isActive = selectedCategory === cat.id;

                const buttonClass = `w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[12px] font-medium transition overflow-hidden ${isActive
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-purple-50"
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
                          className={`cursor-pointer ${isActive && selectedSubcategory === "all" ? "bg-purple-50 font-semibold" : ""}`}
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
                            className={`cursor-pointer ${isActive && selectedSubcategory === sub.id ? "bg-purple-50 font-semibold" : ""}`}
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
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilterTab(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${activeFilterTab === tab.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-purple-50 border border-gray-200"
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
                  {filteredRentals.length} rentals found
                </span>
                {searchTerm && <span> for "<span className="text-purple-600 font-medium">{searchTerm}</span>"</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-white border border-gray-200 rounded-full p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-full transition ${viewMode === "grid" ? "bg-purple-600 text-white" : "text-gray-500"}`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-full transition ${viewMode === "list" ? "bg-purple-600 text-white" : "text-gray-500"}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Rental Cards - EXACT dimensions as Auction */}
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {filteredRentals.length > 0 ? (
                filteredRentals.map((rental) => (
                  viewMode === "grid" ? (
                    /* Grid Card - EXACT dimensions as Auction */
                    <div
                      key={rental.id}
                      onClick={() => navigate(`/rentals/${rental.id}`)}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className="relative aspect-square bg-gray-100">
                        <img
                          src={rental.images?.[0] || "/placeholder.jpg"}
                          alt={rental.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => handleImageError(e, rental.id.toString())}
                        />
                        <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          For Rent
                        </span>
                        <button
                          onClick={(e) => toggleFavorite(rental.id, e)}
                          className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition"
                        >
                          <Heart className={`w-3.5 h-3.5 ${favoriteItems.includes(rental.id) ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
                        </button>
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          <Eye className="w-2.5 h-2.5" />
                          {rental.views || 0}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-purple-600 transition-colors">
                          {rental.title}
                        </h3>
                        <div className="mt-1">
                          <span className="text-purple-600 font-bold text-lg">
                            NPR {rental.pricePerDay.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">/day</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{rental.location}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                              {rental.sellerName[0].toUpperCase()}
                            </div>
                            <span className="text-xs truncate max-w-[100px]">{rental.sellerName}</span>
                            {rental.verified && (
                              <BadgeCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{rental.rating}</span>
                          </div>
                        </div>
                        <Button
                          className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-sm py-2 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rentals/${rental.id}`);
                          }}
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* List Card - EXACT dimensions as Auction */
                    <div
                      key={rental.id}
                      onClick={() => navigate(`/rentals/${rental.id}`)}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer group transition-all duration-200 flex"
                    >
                      <div className="relative w-36 sm:w-48 flex-shrink-0 bg-gray-100">
                        <img
                          src={rental.images?.[0] || "/placeholder.jpg"}
                          alt={rental.title}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, rental.id.toString())}
                        />
                        <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          For Rent
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 group-hover:text-purple-600 transition-colors mb-1">
                          {rental.title}
                        </h3>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-purple-600 font-bold text-lg">
                            NPR {rental.pricePerDay.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">/day</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{rental.location}</span>
                        </div>
                        <p className="text-gray-500 text-xs line-clamp-2 mb-3 hidden sm:block">
                          {rental.description}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                              {rental.sellerName[0].toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-600 font-medium truncate max-w-[120px]">{rental.sellerName}</span>
                            {rental.verified && (
                              <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                            )}
                            <div className="flex items-center gap-0.5 ml-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{rental.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Eye className="w-3 h-3" />{rental.views || 0}
                            </span>
                            <button
                              onClick={(e) => toggleFavorite(rental.id, e)}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                              <Heart className={`w-3.5 h-3.5 ${favoriteItems.includes(rental.id) ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button onClick={(e) => e.stopPropagation()} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
                                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={(e) => handleShare(rental.id, e)}>
                                  <Share2 className="w-4 h-4 mr-2" /> Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/rentals/${rental.id}`); }}>
                                  <Mail className="w-4 h-4 mr-2" /> Contact Owner
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
                  )
                ))
              ) : rentalsList.length === 0 ? (
                <div className="text-center py-12 col-span-full">
                  <div className="text-5xl mb-4">🏠</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No rentals listed yet</h3>
                  <p className="text-gray-400 text-sm mb-6">Be the first to list a rental property or item!</p>
                </div>
              ) : (
                <div className="text-center py-12 col-span-full">
                  <div className="text-5xl mb-4">🏠</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No rentals match your filters</h3>
                  <p className="text-gray-400 text-sm mb-6">Try changing your search or filters</p>
                  <button
                    onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setActiveFilterTab("all"); }}
                    className="px-5 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            {/* Featured Rentals Carousel — real sponsored data */}
            <FeaturedAdCarousel title="Featured Rentals" accentColor="purple" />

            {/* Trending Locations - Shows real locations from database */}
            {!trendingLoading && trendingLocationsData && trendingLocationsData.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Trending Locations</h3>
                <div className="space-y-4">
                  {trendingLocationsData.map((loc, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-center p-2 rounded hover:bg-gray-50 cursor-pointer transition-all border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                      onClick={() => setSearchTerm(loc.name)}
                    >
                      <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-purple-500" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate mb-1">{loc.name}</p>
                        <p className="text-xs text-purple-600 font-bold">{loc.count} listings</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px] text-gray-500">{loc.rating.toFixed(1)} ★</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Why Rent With Us?</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-gray-600">Secure Payments</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-gray-600">Verified Landlords</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-gray-600">Flexible Terms</span>
                </div>
              </div>
            </div>

            {/* Sponsored */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-2">Sponsored</p>
              <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-center">
                <p className="text-purple-600 font-bold text-sm">Want to see your ad here?</p>
                <p className="text-gray-500 text-[10px] mt-1 mb-3">Reach 50,000+ potential renters daily</p>
                <Button variant="outline" size="sm" className="h-7 text-[10px] border-purple-400 text-purple-600 rounded-full" onClick={() => navigate("/promote")}>
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
