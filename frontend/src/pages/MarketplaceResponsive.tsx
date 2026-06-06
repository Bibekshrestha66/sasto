import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Grid, List, MapPin, Heart, BadgeCheck, SlidersHorizontal, Eye,
  TrendingUp, Star, Home, Car, Smartphone, Sofa, Shirt, BookOpen, Bike,
  Sparkles, Bell, Repeat2, X, ChevronDown, Briefcase, Wrench, Dog, Baby, Building,
  MoreHorizontal, Share2, Flag, Mail, ShoppingCart, Stethoscope, Laptop, Sprout,
  Dumbbell, GraduationCap, ExternalLink, Bed, Shield, Users
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { NEPAL_DISTRICTS, COLORS } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { FeaturedAdCarousel } from "@/components/FeaturedAdCarousel";

// ==================== TYPES ====================
interface Listing {
  id: string | number;
  title: string;
  price: string | number | null;
  location?: string | null;
  images?: any;
  condition?: string | null;
  views?: number | null;
  createdAt: Date | string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  seller?: {
    id: string | number;
    name: string;
    rating?: number | null;
    verificationStatus?: 'verified' | 'unverified' | null;
  } | null;
}

interface Ad {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  landingUrl: string;
  adType: 'banner' | 'sidebar' | 'featured' | 'popup';
  placement: string;
}

interface SavedSearch {
  id: number;
  query: string;
  filters: {
    category: string;
    subcategory: string;
    condition: string;
    district: string;
    brand: string;
    model: string;
    color: string;
    priceMin: number;
    priceMax: number;
    sortBy: string;
  };
  createdAt: string;
}

interface TrendingLocation {
  name: string;
  count: number;
  rating: number;
}

interface TopSeller {
  id: string;
  name: string;
  totalListings: number;
  verificationStatus: 'verified' | 'unverified';
}

// ==================== CONSTANTS ====================
const FILTER_TABS = [
  { id: "all", label: "All Listings" },
  { id: "newest", label: "Newest" },
  { id: "price_low", label: "Price Low → High" },
  { id: "price_high", label: "Price High → Low" },
  { id: "popular", label: "Most Viewed" },
] as const;

// Subcategories are loaded live from the database — no static map needed

const ALL_CATEGORIES_SORTED = [
  { id: "agriculture", name: "Agriculture", icon: Sprout, hasSub: true },
  { id: "books", name: "Books", icon: BookOpen, hasSub: true },
  { id: "commercial", name: "Commercial", icon: Building, hasSub: true },
  { id: "digital", name: "Digital", icon: Laptop, hasSub: true },
  { id: "electronics", name: "Electronics", icon: Smartphone, hasSub: true },
  { id: "fashion", name: "Fashion", icon: Shirt, hasSub: true },
  { id: "furniture", name: "Furniture", icon: Sofa, hasSub: true },
  { id: "groceries", name: "Groceries", icon: ShoppingCart, hasSub: true },
  { id: "jobs", name: "Jobs", icon: Briefcase, hasSub: true },
  { id: "kids", name: "Kids & Babies", icon: Baby, hasSub: true },
  { id: "medical", name: "Medical", icon: Stethoscope, hasSub: true },
  { id: "pets", name: "Pets", icon: Dog, hasSub: true },
  { id: "property", name: "Property", icon: Home, hasSub: true },
  { id: "rooms", name: "Rooms", icon: Bed, hasSub: true },
  { id: "services", name: "Services", icon: Wrench, hasSub: true },
  { id: "sports", name: "Sports", icon: Bike, hasSub: true },
  { id: "vehicles", name: "Vehicles", icon: Car, hasSub: true },
];

const CATEGORIES_ROW1 = [
  { id: "all", name: "All Categories", icon: Sparkles, hasSub: false },
  ...ALL_CATEGORIES_SORTED.slice(0, 17)
] as const;

const conditionColor: Record<string, string> = {
  new: "bg-emerald-500",
  "like-new": "bg-blue-500",
  good: "bg-amber-500",
  fair: "bg-orange-500"
};

const conditionLabel: Record<string, string> = {
  new: "New",
  "like-new": "Like New",
  good: "Good",
  fair: "Fair"
};

// ==================== UTILITIES ====================
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const toast = document.createElement("div");
  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${bgColor} animate-in fade-in slide-in-from-bottom-2 duration-300`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// ==================== SAFE LOCAL STORAGE HOOK ====================
function useLocalStorageSafe<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// FeaturedDealCard replaced by shared FeaturedAdCarousel component

// ==================== AD CARD COMPONENT ====================
function AdCard({ ad, onClose }: { ad: Ad; onClose?: () => void }) {
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

// ==================== COMPARE MODAL ====================
function CompareModal({ listings, onClose }: { listings: Listing[]; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Compare Listings ({listings.length}/4)</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {listings.map((listing) => (
            <div key={listing.id} className="border rounded-lg p-3 bg-white">
              <img
                src={listing.images?.[0] || "https://placehold.co/400x400?text=No+Image"}
                alt={listing.title}
                className="w-full h-40 object-cover rounded mb-3"
                loading="lazy"
              />
              <h4 className="font-semibold text-sm line-clamp-2">{listing.title}</h4>
              <p className="text-green-600 font-bold text-lg mt-1">NPR {parseFloat(String(listing.price)).toLocaleString()}</p>
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p>📍 {listing.location || "Nepal"}</p>
                <p>⭐ {listing.seller?.rating || "New"} rating</p>
                <p>👁️ {listing.views || 0} views</p>
              </div>
            </div>
          ))}
        </div>
        {listings.length < 2 && (
          <p className="text-center text-gray-500 mt-4">Add at least 2 listings to compare effectively</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== MAIN COMPONENT ====================
export function MarketplaceResponsive() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const touchStartRef = useRef<{ y: number; id: string } | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const itemsPerPage = 12;

  const [wishlist, setWishlist] = useLocalStorageSafe<string[]>("wishlist", []);
  const [compareListings, setCompareListings] = useLocalStorageSafe<Listing[]>("compare_listings", []);
  const [savedSearches, setSavedSearches] = useLocalStorageSafe<SavedSearch[]>("saved_searches", []);
  const [hiddenAds, setHiddenAds] = useLocalStorageSafe<number[]>("hidden_ads", []);

  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] = useState("");
  const [condition, setCondition] = useState("all");
  const [district, setDistrict] = useState("all");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("all");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1000000);
  const [sortBy, setSortBy] = useState("newest");

  // Real category IDs from the database — no hardcoded map
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);

  // Fetch real categories from DB to resolve slug → numeric ID
  const { data: dbCategories } = trpc.categories.list.useQuery(
    { sector: "marketplace" },
    { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false }
  );

  // Fetch real subcategories for the currently selected parent category
  const { data: dbSubcategories } = trpc.categories.getSubcategories.useQuery(
    { parentId: selectedCategoryId ?? 0, sector: "marketplace" },
    { enabled: !!selectedCategoryId, staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false }
  );

  // ---------- FIX #3: Replace top sellers data source ----------
  const { data: topSellersData, isLoading: topSellersLoading } = trpc.search.topSellers.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const utils = trpc.useContext();
  const addToCartMutation = trpc.cart.addItem.useMutation();

  const handleBuyNow = (e: React.MouseEvent, listingId: string | number) => {
    e.stopPropagation();
    addToCartMutation.mutate({ listingId: Number(listingId), quantity: 1 }, {
      onSuccess: () => {
        showToast("Added to cart!");
        utils.cart.get.invalidate();
        setLocation("/checkout");
      },
      onError: (e: any) => showToast(e.message || "Failed to add to cart", 'error')
    });
  };

  const handleAddToCart = (e: React.MouseEvent, listingId: string | number) => {
    e.stopPropagation();
    addToCartMutation.mutate({ listingId: Number(listingId), quantity: 1 }, {
      onSuccess: () => {
        showToast("Added to cart!");
        utils.cart.get.invalidate();
      },
      onError: (e: any) => showToast(e.message || "Failed to add to cart", 'error')
    });
  };

  // ---------- FIX #4 & #5: Trending locations from backend ----------
  const { data: trendingLocationsData, isLoading: trendingLoading } = trpc.search.trendingLocations.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // ---------- Main listings query ----------
  // Use subcategory ID first (most specific), then parent category ID, then no filter
  const activeCategoryId = selectedSubcategoryId ?? selectedCategoryId ?? undefined;

  const { data: searchResults, isLoading, error } = trpc.search.advanced.useQuery({
    query: searchQuery || undefined,
    category: activeCategoryId !== undefined ? activeCategoryId : undefined,
    minPrice: priceMin > 0 ? priceMin : undefined,
    maxPrice: priceMax < 1000000 ? priceMax : undefined,
    district: district !== "all" ? district : undefined,
    brand: brand || undefined,
    model: model || undefined,
    color: color !== "all" ? color : undefined,
    condition: condition === "all" ? undefined : condition as any,
    sortBy: sortBy === "newest" ? "newest" : sortBy === "price_low" ? "price-low" : sortBy === "price_high" ? "price-high" : "popular",
    page: currentPage,
    limit: itemsPerPage,
  });

  // admin.getAnalytics is an admin-only endpoint — never call it for guests to avoid 403 errors
  const { data: realAds } = trpc.ads.getActiveAds.useQuery({ placement: "sidebar_right" });

  // Listings are now filtered server-side by real numeric category/subcategory IDs
  const rawListings = searchResults?.results || [];
  const filteredListings = rawListings;

  // Pagination based on filtered listings
  const totalFilteredCount = filteredListings.length;
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage) || 1;
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredListings.slice(start, start + itemsPerPage);
  }, [filteredListings, currentPage, itemsPerPage]);

  // Featured listings now come from backend (isFeatured=true listings)

  const allAds = realAds || [];
  const visibleAds = allAds.filter((ad: any) => !hiddenAds.includes(ad.id));

  // Use public searchResults for stats (admin analytics removed — admin-only endpoint)
  const totalListings = searchResults?.total || 0;
  const totalViews = 0;
  const totalSellers = 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setCategory(cat);
    const search = params.get("search");
    if (search) setSearchQuery(search);
  }, []);

  // Sync scroll lock logic with auctions
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [category, subcategory, condition, searchQuery, sortBy, priceMin, priceMax]);

  if (error) {
    console.error("API Error:", error);
    showToast("Failed to load listings. Please try again.", 'error');
  }

  const toggleWishlist = useCallback((listingId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWishlist((prev) => {
      const isWishlisted = prev.includes(listingId);
      showToast(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
      return isWishlisted ? prev.filter(id => id !== listingId) : [...prev, listingId];
    });
  }, [setWishlist]);

  const toggleCompare = useCallback((listing: Listing, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCompareListings((prev) => {
      const isCompared = prev.find(l => l.id === listing.id);
      if (isCompared) {
        showToast("Removed from comparison");
        return prev.filter(l => l.id !== listing.id);
      }
      if (prev.length >= 4) {
        showToast("Can't compare more than 4 listings", 'error');
        return prev;
      }
      showToast("Added to comparison");
      return [...prev, listing];
    });
  }, [setCompareListings]);

  const saveCurrentSearch = useCallback(() => {
    const searchConfig: SavedSearch = {
      id: Date.now(),
      query: searchQuery,
      filters: { category, subcategory, condition, district, brand, model, color, priceMin, priceMax, sortBy },
      createdAt: new Date().toISOString()
    };
    setSavedSearches((prev) => [...prev, searchConfig]);
    showToast("Search saved!");
  }, [searchQuery, category, subcategory, condition, district, brand, model, color, priceMin, priceMax, sortBy, setSavedSearches]);

  const loadSavedSearch = useCallback((search: SavedSearch) => {
    setSearchQuery(search.query);
    setCategory(search.filters.category);
    setSubcategory(search.filters.subcategory || "");
    setCondition(search.filters.condition);
    setDistrict(search.filters.district || "all");
    setBrand(search.filters.brand || "");
    setModel(search.filters.model || "");
    setColor(search.filters.color || "all");
    setPriceMin(search.filters.priceMin);
    setPriceMax(search.filters.priceMax);
    setSortBy(search.filters.sortBy);
    setCurrentPage(1);
    showToast("Search loaded");
  }, []);

  const resetAllFilters = useCallback(() => {
    setCategory("all");
    setSubcategory("");
    setCondition("all");
    setDistrict("all");
    setBrand("");
    setModel("");
    setColor("all");
    setPriceMin(0);
    setPriceMax(1000000);
    setSortBy("newest");
    setSearchQuery("");
    setCurrentPage(1);
    showToast("All filters cleared");
  }, []);

  const handleSubscribe = useCallback(() => {
    if (newsletterEmail && newsletterEmail.includes("@")) {
      showToast("Subscribed successfully!");
      setNewsletterEmail("");
    } else {
      showToast("Please enter a valid email", 'error');
    }
  }, [newsletterEmail]);

  const handleHideAd = useCallback((adId: number) => {
    setHiddenAds((prev) => [...prev, adId]);
    showToast("Ad closed", 'info');
  }, [setHiddenAds]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackId?: string) => {
    e.currentTarget.src = `https://picsum.photos/seed/${fallbackId || Date.now()}/400/400`;
  }, []);

  const handleShare = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/listing/${id}`);
      showToast("Link copied to clipboard!");
    } catch (err) {
      showToast("Failed to copy link", 'error');
    }
  }, []);

  const pageTitle = useMemo(() => {
    if (searchQuery) return `Search results for "${searchQuery}" | Sasto Marketplace`;
    if (category !== "all") return `${category.charAt(0).toUpperCase() + category.slice(1)} Listings | Sasto Marketplace`;
    return "Marketplace - Buy & Sell in Nepal | Sasto Marketplace";
  }, [searchQuery, category]);

  const pageDescription = useMemo(() => {
    if (searchQuery) return `Browse the best results for ${searchQuery} in Nepal. Find great deals and connect with sellers instantly.`;
    return `Explore our ${category !== "all" ? category : "vast"} collection of items in Nepal. From electronics to property, find everything you need.`;
  }, [searchQuery, category]);

  const renderCategoryPills = useMemo(() => {
    return CATEGORIES_ROW1.map((cat) => {
      const Icon = cat.icon;
      const isActive = category === cat.id;

      const buttonClassName = `flex-shrink-0 min-w-[90px] max-w-[120px] flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[12px] font-medium transition overflow-hidden ${isActive
        ? "bg-green-600 text-white shadow-sm"
        : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"
        }`;

      // Resolve the real numeric DB ID for this category slug
      const resolveDbId = (slug: string) =>
        dbCategories?.find((c: any) => c.slug === slug || c.name.toLowerCase() === slug.toLowerCase())?.id ?? null;

      if (!cat.hasSub) {
        return (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat.id);
              setSubcategory("");
              setSelectedCategoryId(null);
              setSelectedSubcategoryId(null);
              setCurrentPage(1);
            }}
            className={buttonClassName}
            aria-label={`Filter by ${cat.name}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{cat.name}</span>
          </button>
        );
      }

      // Subcategories to show — only for the currently open dropdown, loaded from DB
      const liveSubs = openDropdown === cat.id ? dbSubcategories : [];

      return (
        <DropdownMenu
          key={cat.id}
          modal={false}
          open={openDropdown === cat.id}
          onOpenChange={(isOpen) => {
            const nextOpen = isOpen ? cat.id : null;
            setOpenDropdown(nextOpen);
            if (isOpen) {
              // When opening, resolve and set the parent category numeric ID so the subcategories query fires
              const dbId = resolveDbId(cat.id);
              setSelectedCategoryId(dbId);
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              className={`${buttonClassName} flex items-center gap-1`}
              aria-label={`${cat.name} categories dropdown`}
              onPointerDown={(e) => {
                if (e.pointerType === 'touch') {
                  e.preventDefault();
                  touchStartRef.current = { y: e.clientY, id: cat.id };
                }
              }}
              onPointerUp={(e) => {
                if (e.pointerType === 'touch' && touchStartRef.current?.id === cat.id) {
                  const moved = Math.abs(e.clientY - touchStartRef.current.y);
                  touchStartRef.current = null;
                  if (moved < 8) {
                    setOpenDropdown(prev => {
                      const next = prev === cat.id ? null : cat.id;
                      if (next) {
                        const dbId = resolveDbId(cat.id);
                        setSelectedCategoryId(dbId);
                      }
                      return next;
                    });
                  }
                }
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{cat.name}</span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={5}
            avoidCollisions={false}
            className="w-48 max-h-80 overflow-y-auto"
          >
            <DropdownMenuItem onClick={() => {
              const dbId = resolveDbId(cat.id);
              setCategory(cat.id);
              setSubcategory("");
              setSelectedCategoryId(dbId);
              setSelectedSubcategoryId(null);
              setCurrentPage(1);
              setOpenDropdown(null);
            }}>
              All {cat.name}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {openDropdown === cat.id && dbSubcategories === undefined ? (
              <DropdownMenuItem disabled className="text-gray-400 text-xs">
                Loading subcategories…
              </DropdownMenuItem>
            ) : liveSubs && liveSubs.length > 0 ? (
              liveSubs.map((sub: any) => (
                <DropdownMenuItem key={sub.id} onClick={() => {
                  setCategory(cat.id);
                  setSubcategory(sub.name);
                  setSelectedSubcategoryId(sub.id);  // real DB numeric ID
                  setCurrentPage(1);
                  setOpenDropdown(null);
                  showToast(`Showing: ${sub.name}`);
                }}>
                  {sub.name}
                  {subcategory === sub.name && <span className="ml-auto text-green-600">✓</span>}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="text-gray-400 text-xs">
                No subcategories available
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    });
  }, [category, subcategory, openDropdown, dbCategories, dbSubcategories]);

  // FIX #7: Removed priceAlert from UI – bell icon and related logic are gone
  const renderListingCard = useCallback((listing: Listing, isGridView: boolean) => {
    const isWishlisted = wishlist.includes(String(listing.id));
    const isCompared = compareListings.some(l => l.id === listing.id);

    if (isGridView) {
      return (
        <div
          key={listing.id}
          onClick={() => setLocation(`/listing/${listing.id}`)}
          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
          role="article"
          aria-label={`Listing: ${listing.title}`}
        >
          <div className="relative aspect-square bg-gray-100">
            <img
              src={listing.images?.[0] || `https://picsum.photos/seed/${listing.id}/400/400`}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => handleImageError(e, String(listing.id))}
            />
            {listing.condition && (
              <div className={`absolute top-2 left-2 text-white text-xs font-semibold px-2 py-0.5 rounded-full ${conditionColor[listing.condition] || "bg-gray-500"}`}>
                {conditionLabel[listing.condition] || listing.condition}
              </div>
            )}
            <button
              onClick={(e) => toggleWishlist(String(listing.id), e)}
              className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
            </button>
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              <Eye className="w-2.5 h-2.5" />
              {listing.views || 0}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-green-600 transition-colors">
              {listing.title}
            </h3>
            <p className="text-green-600 font-bold text-lg mt-1">
              NPR {parseFloat(String(listing.price || 0)).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <MapPin className="w-3 h-3" />
              {listing.location || "Nepal"}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                  {(listing.seller?.name || "S").charAt(0).toUpperCase()}
                </div>
                <span className="text-xs truncate max-w-[100px]">{listing.seller?.name || "Seller"}</span>
                {listing.seller?.verificationStatus === "verified" && (
                  <BadgeCheck className="w-3 h-3 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{listing.seller?.rating || "New"}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3 w-full">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-2 rounded-full h-8"
                onClick={(e) => handleBuyNow(e, listing.id)}
                disabled={addToCartMutation.isPending}
              >
                Buy
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-green-600 text-green-600 hover:bg-green-50 text-xs py-2 rounded-full h-8"
                onClick={(e) => handleAddToCart(e, listing.id)}
                disabled={addToCartMutation.isPending}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // List view (no price alert button)
    return (
      <div
        key={listing.id}
        onClick={() => setLocation(`/listing/${listing.id}`)}
        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer group transition-all duration-200 flex"
        role="article"
        aria-label={`Listing: ${listing.title}`}
      >
        <div className="relative w-36 sm:w-48 flex-shrink-0 bg-gray-100">
          <img
            src={listing.images?.[0] || `https://picsum.photos/seed/${listing.id}/400/400`}
            alt={listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => handleImageError(e, String(listing.id))}
          />
          {listing.condition && (
            <div className={`absolute top-2 left-2 text-white text-xs font-semibold px-2 py-0.5 rounded-full ${conditionColor[listing.condition] || "bg-gray-500"}`}>
              {conditionLabel[listing.condition] || listing.condition}
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 group-hover:text-green-600 transition-colors mb-1">
              {listing.title}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={(e) => toggleWishlist(String(listing.id), e)}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
              </button>
              <button
                onClick={(e) => toggleCompare(listing, e)}
                aria-label={isCompared ? "Remove from comparison" : "Add to comparison"}
              >
                <Repeat2 className={`w-4 h-4 ${isCompared ? "text-blue-500" : "text-gray-400"}`} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button onClick={(e) => e.stopPropagation()} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={(e) => handleShare(String(listing.id), e)}>
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/listing/${listing.id}`);
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
          <p className="text-green-600 font-bold text-lg mb-1">
            NPR {parseFloat(String(listing.price || 0)).toLocaleString()}
          </p>
          {listing.location && (
            <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
              <MapPin className="w-3 h-3" />
              {listing.location}
            </div>
          )}
          {listing.description && (
            <p className="text-gray-500 text-xs line-clamp-2 mb-3 hidden sm:block">{listing.description}</p>
          )}
          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-xs font-bold text-white">
                {(listing.seller?.name || "S").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-600 font-medium truncate max-w-[120px]">
                {listing.seller?.name || "Seller"}
              </span>
              {listing.seller?.verificationStatus === "verified" && (
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
              )}
              <div className="flex items-center gap-0.5 ml-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs">{listing.seller?.rating || "New"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {listing.views || 0}
              </span>
            </div>
            <div className="flex flex-col gap-2 min-w-[90px] border-l border-gray-50 pl-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-xs py-1 rounded-full h-7"
                onClick={(e) => handleBuyNow(e, listing.id)}
                disabled={addToCartMutation.isPending}
              >
                Buy
              </Button>
              <Button
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50 text-xs py-1 rounded-full h-7"
                onClick={(e) => handleAddToCart(e, listing.id)}
                disabled={addToCartMutation.isPending}
              >
                Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [wishlist, compareListings, toggleWishlist, toggleCompare, handleShare, handleImageError, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEO title={pageTitle} description={pageDescription} />
      {showCompare && compareListings.length > 0 && (
        <CompareModal listings={compareListings} onClose={() => setShowCompare(false)} />
      )}

      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Marketplace</h1>
            <p className="text-green-100 text-base mb-6">Discover great deals from verified sellers across Nepal</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">{totalListings.toLocaleString()}+</p>
                <p className="text-xs">Active Listings</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">{totalViews.toLocaleString()}+</p>
                <p className="text-xs">Total Views</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">{totalSellers.toLocaleString()}+</p>
                <p className="text-xs">Active Sellers</p>
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
                  placeholder="Search listings, products, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-24 py-1.5 text-sm border-gray-200 rounded-full h-10 w-full"
                  aria-label="Search listings"
                />
                <button
                  onClick={saveCurrentSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 transition"
                  aria-label="Save search"
                >
                  <Bell className="w-3.5 h-3.5 text-gray-400 hover:text-green-600" />
                </button>
              </div>

              {/* Category Pills */}
              <div className="mb-6">
                <div className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 w-full pb-1">{renderCategoryPills}</div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-5 border-b pb-2">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSortBy(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${sortBy === tab.id
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${showFilters
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"
                    }`}
                >
                  <SlidersHorizontal className="w-3 h-3" /> Filters
                </button>
                {compareListings.length > 0 && (
                  <button
                    onClick={() => setShowCompare(true)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white flex items-center gap-1"
                  >
                    <Repeat2 className="w-3 h-3" /> Compare ({compareListings.length})
                  </button>
                )}
                <DropdownMenu
                  open={openDropdown === "saved"}
                  onOpenChange={(isOpen) => setOpenDropdown(isOpen ? "saved" : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 flex items-center gap-1"
                      onPointerDown={(e) => {
                        if (e.pointerType === 'touch') {
                          e.preventDefault();
                          touchStartRef.current = { y: e.clientY, id: "saved" };
                        }
                      }}
                      onPointerUp={(e) => {
                        if (e.pointerType === 'touch' && touchStartRef.current?.id === "saved") {
                          const moved = Math.abs(e.clientY - touchStartRef.current.y);
                          touchStartRef.current = null;
                          if (moved < 8) {
                            setOpenDropdown(prev => prev === "saved" ? null : "saved");
                          }
                        }
                      }}
                    >
                      <BookOpen className="w-3 h-3" /> Saved
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {savedSearches.length === 0 ? (
                      <DropdownMenuItem disabled>No saved searches</DropdownMenuItem>
                    ) : (
                      savedSearches.map((search) => (
                        <DropdownMenuItem key={search.id} onClick={() => loadSavedSearch(search)}>
                          {search.query || "All listings"}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</Label>
                      <div className="space-y-2">
                        <Label htmlFor="district-select" className="text-sm font-medium">Nepal District</Label>
                        <Select value={district} onValueChange={setDistrict}>
                          <SelectTrigger id="district-select" className="bg-gray-50 border-gray-200">
                            <SelectValue placeholder="All Districts" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Districts</SelectItem>
                            {NEPAL_DISTRICTS.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Info</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="brand-input" className="text-sm font-medium">Brand</Label>
                          <Input
                            id="brand-input"
                            placeholder="e.g. Sony"
                            className="bg-gray-50 border-gray-200"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model-input" className="text-sm font-medium">Model</Label>
                          <Input
                            id="model-input"
                            placeholder="e.g. PS5"
                            className="bg-gray-50 border-gray-200"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Details</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="color-select" className="text-sm font-medium">Color</Label>
                          <Select value={color} onValueChange={setColor}>
                            <SelectTrigger id="color-select" className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any Color</SelectItem>
                              {COLORS.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="condition-select" className="text-sm font-medium">Condition</Label>
                          <Select value={condition} onValueChange={setCondition}>
                            <SelectTrigger id="condition-select" className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any</SelectItem>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="like-new">Like New</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                      <Label className="text-sm font-medium">Price Range (NPR)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          className="bg-gray-50 border-gray-200"
                          value={priceMin === 0 ? "" : priceMin}
                          onChange={(e) => setPriceMin(Number(e.target.value))}
                        />
                        <span className="text-gray-400">-</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          className="bg-gray-50 border-gray-200"
                          value={priceMax === 1000000 ? "" : priceMax}
                          onChange={(e) => setPriceMax(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" className="text-gray-500 hover:text-red-500" onClick={resetAllFilters}>
                      Clear All Filters
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white px-8"
                      onClick={() => {
                        setCurrentPage(1);
                        setShowFilters(false);
                        showToast("Filters applied!");
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Count and Sort */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-5">
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">
                    {isLoading ? "Loading..." : `${totalFilteredCount} listings found`}
                  </span>
                  {searchQuery && <span> for "<span className="text-green-600">{searchQuery}</span>"</span>}
                  {subcategory && <span className="ml-2 text-green-600">in {subcategory}</span>}
                  {condition !== "all" && <span className="ml-2 text-blue-600">({conditionLabel[condition]})</span>}
                  {totalPages > 1 && <span className="ml-2 text-xs">(Page {currentPage} of {totalPages})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white border border-gray-200 rounded-full p-0.5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-full transition ${viewMode === "grid" ? "bg-green-600 text-white" : "text-gray-500"
                        }`}
                      aria-label="Grid view"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-full transition ${viewMode === "list" ? "bg-green-600 text-white" : "text-gray-500"
                        }`}
                      aria-label="List view"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading Skeleton */}
              {isLoading && (
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

              {/* Listing Cards */}
              {!isLoading && viewMode === "grid" && (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                  {paginatedListings.map((listing) => renderListingCard(listing as any, true))}
                </div>
              )}
              {!isLoading && viewMode === "list" && (
                <div className="space-y-4">
                  {paginatedListings.map((listing) => renderListingCard(listing as any, false))}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-full text-xs border disabled:opacity-50 hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum =
                        totalPages <= 5
                          ? i + 1
                          : currentPage <= 3
                            ? i + 1
                            : currentPage >= totalPages - 2
                              ? totalPages - 4 + i
                              : currentPage - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-full text-xs font-medium transition ${currentPage === pageNum
                            ? "bg-green-600 text-white"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-full text-xs border disabled:opacity-50 hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && totalFilteredCount === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No listings found</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {subcategory ? `No listings found in "${subcategory}".` : "Try changing your search or filters"}
                  </p>
                  <button onClick={resetAllFilters} className="px-5 py-2 bg-green-600 text-white rounded-full">
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="w-[65%] mx-auto lg:w-80 flex-shrink-0 space-y-6">
              {visibleAds.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-500">Sponsored</h3>
                    <span className="text-[10px] text-gray-400">Advertisement</span>
                  </div>
                  {visibleAds.map((ad) => (
                    <AdCard key={ad.id} ad={ad as any} onClose={() => handleHideAd(ad.id)} />
                  ))}
                </div>
              )}

              <FeaturedAdCarousel title="Featured Deals" accentColor="green" />

              {/* Trending Ads */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Trending Ads
                </h3>
                <div className="space-y-4">
                  {[...rawListings]
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, 4)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 items-center p-2 rounded hover:bg-gray-50 cursor-pointer transition-all border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                        onClick={() => setLocation(`/listing/${item.id}`)}
                      >
                        <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden shrink-0 relative">
                          <img src={item.images?.[0] || `https://picsum.photos/seed/${item.id}/400/400`} className="w-full h-full object-cover" alt="" />
                          {(item as any).isFeatured && (
                            <div className="absolute top-0 left-0 bg-green-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-br-md">Featured</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-800 truncate mb-1">{item.title}</p>
                          <p className="text-xs text-green-600 font-bold">NPR {parseFloat(String(item.price || 0)).toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Eye className="w-3 h-3" /> {item.views || 0} views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Trust Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Why Buy With Us?</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-600">100% Secure Transactions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-600">Verified Sellers Only</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-600">Best Deals Guaranteed</span>
                  </div>
                </div>
              </div>

              {/* Sponsored */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-2">Sponsored</p>
                <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center">
                  <p className="text-green-600 font-bold text-sm">Want to see your ad here?</p>
                  <p className="text-gray-500 text-[10px] mt-1 mb-3">Reach 50,000+ potential buyers daily</p>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] border-green-400 text-green-600 rounded-full" onClick={() => setLocation("/post-listing")}>
                    Promote Now
                  </Button>
                </div>
              </div>

              {/* Trending Locations – now uses backend data */}
              {!trendingLoading && trendingLocationsData && trendingLocationsData.length > 0 && (
                <div className="bg-white border rounded-xl p-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    Trending Locations
                  </h3>
                  <div className="space-y-3">
                    {trendingLocationsData.map((loc, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{loc.name}</p>
                          <p className="text-xs text-gray-500">{loc.count} listings</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-semibold">{loc.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Rated Sellers – using new data source */}
              {!topSellersLoading && topSellersData && topSellersData.length > 0 && (
                <div className="bg-white border rounded-xl p-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    Top Rated Sellers
                  </h3>
                  <div className="space-y-3">
                    {topSellersData.slice(0, 5).map((seller) => (
                      <div
                        key={seller.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                        onClick={() => setLocation(`/seller/${seller.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setLocation(`/seller/${seller.id}`)}
                      >
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {seller.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{seller.name}</p>
                          <p className="text-xs text-green-600">{seller.totalListings} listings</p>
                        </div>
                        {seller.verificationStatus === "verified" && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter Subscription */}
              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-bold text-sm mb-2">Get Updates</h3>
                <p className="text-xs text-gray-500 mb-3">Get notified about new listings and deals</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full text-xs border rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  <Button size="sm" className="w-full sm:w-auto h-7 text-[10px] bg-green-600 rounded-full px-4 justify-center" onClick={handleSubscribe}>
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
