import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Grid,
  List,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  Home,
  Car,
  Laptop,
  Wrench,
  Building,
} from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";

// ---------- MOCK DATA (fallback – real data will override) ----------
const MOCK_RENTALS = [
  {
    id: 1,
    title: "Luxury 2BHK Apartment in Thamel",
    pricePerDay: "25000",
    location: "Kathmandu, Bagmati",
    landlord: { name: "PropertyPlus" },
    rating: 4.8,
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"],
    features: ["WiFi", "Parking"],
    category: "property",
    createdAt: "2025-05-01",
  },
  {
    id: 2,
    title: "Honda City 2022 - Self Drive",
    pricePerDay: "4500",
    location: "Lalitpur, Bagmati",
    landlord: { name: "DriveEasy" },
    rating: 4.7,
    images: ["https://images.unsplash.com/photo-1568605117036-5fe5e7fa0ac7?w=400&h=300&fit=crop"],
    features: ["AC", "Automatic"],
    category: "vehicles",
    createdAt: "2025-05-10",
  },
  {
    id: 3,
    title: "MacBook Pro M2 2023",
    pricePerDay: "1500",
    location: "Kathmandu, Bagmati",
    landlord: { name: "TechRent" },
    rating: 4.9,
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=400&h=300&fit=crop"],
    features: ["M2 Chip", "16GB RAM"],
    category: "electronics",
    createdAt: "2025-05-15",
  },
  {
    id: 4,
    title: "Professional Camera Kit",
    pricePerDay: "800",
    location: "Pokhara, Gandaki",
    landlord: { name: "GearRental" },
    rating: 4.6,
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop"],
    features: ["Canon 5D", "Lenses"],
    category: "equipment",
    createdAt: "2025-05-20",
  },
  {
    id: 5,
    title: "Commercial Space in New Road",
    pricePerDay: "55000",
    location: "Kathmandu, Bagmati",
    landlord: { name: "BizSpace" },
    rating: 4.7,
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop"],
    features: ["High Ceiling"],
    category: "commercial",
    createdAt: "2025-05-25",
  },
  {
    id: 6,
    title: "Modern Studio in Jhamsikhel",
    pricePerDay: "18000",
    location: "Lalitpur, Bagmati",
    landlord: { name: "UrbanRentals" },
    rating: 4.6,
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop"],
    features: ["Balcony"],
    category: "property",
    createdAt: "2025-05-10",
  },
];

const CATEGORIES = [
  { id: "all", name: "All Categories", icon: null },
  { id: "property", name: "Property Rentals", icon: Home },
  { id: "vehicles", name: "Vehicle Rentals", icon: Car },
  { id: "electronics", name: "Electronics Rentals", icon: Laptop },
  { id: "equipment", name: "Equipment Rentals", icon: Wrench },
  { id: "commercial", name: "Commercial Rentals", icon: Building },
];

// Featured rental data (you can replace with dynamic data from API)
const FEATURED_RENTAL = {
  title: "Modern Luxury Villa",
  price: "NPR 12,500/day",
  location: "Pokhara Lakeside",
  image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=300&fit=crop",
  rating: 4.9,
};

const TRENDING_LOCATIONS = [
  { name: "Kathmandu, Bagmati", count: 124, rating: 4.8 },
  { name: "Lalitpur, Bagmati", count: 89, rating: 4.6 },
  { name: "Pokhara, Gandaki", count: 67, rating: 4.9 },
  { name: "Bhaktapur, Bagmati", count: 54, rating: 4.7 },
];

const TOP_PROPERTIES = [
  { id: 101, title: "Lakeview Apartment", price: "NPR 45,000/mo", location: "Pokhara", rating: 4.9 },
  { id: 102, title: "Downtown Studio", price: "NPR 20,000/mo", location: "Kathmandu", rating: 4.7 },
  { id: 103, title: "Garden House", price: "NPR 38,000/mo", location: "Bhaktapur", rating: 4.8 },
];

export default function Rentals() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState("newest");
  const [filters, setFilters] = useFilterPersistence("rental_filters_auction", {
    category: "all",
    sortBy: "newest",
    priceMin: 0,
    priceMax: 100000,
  });

  const { data: apiRentals, isLoading } = trpc.rentals.list.useQuery({
    category: filters.category !== "all" ? filters.category : undefined,
    searchQuery: searchQuery || "",
  });

  const rentals: any[] = useMemo(() => {
    if (apiRentals && apiRentals.length > 0) return apiRentals as any[];
    return MOCK_RENTALS;
  }, [apiRentals]);

  const filteredRentals = useMemo(() => {
    let result = [...rentals];
    result = result.filter((r) => parseFloat(r.pricePerDay) >= filters.priceMin && parseFloat(r.pricePerDay) <= filters.priceMax);
    if (searchQuery) {
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.location || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filters.category !== "all") {
      result = result.filter((r) => r.category === filters.category);
    }
    switch (filters.sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "price_low":
        result.sort((a, b) => parseFloat(a.pricePerDay) - parseFloat(b.pricePerDay));
        break;
      case "price_high":
        result.sort((a, b) => parseFloat(b.pricePerDay) - parseFloat(a.pricePerDay));
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }
    return result;
  }, [rentals, filters, searchQuery]);

  const handleTabChange = (tab: string) => {
    setActiveFilterTab(tab);
    if (tab === "newest") setFilters({ ...filters, sortBy: "newest" });
    if (tab === "price_low") setFilters({ ...filters, sortBy: "price_low" });
    if (tab === "price_high") setFilters({ ...filters, sortBy: "price_high" });
    if (tab === "rating") setFilters({ ...filters, sortBy: "rating" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 text-white pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Live Rentals</h1>
          <p className="text-purple-100 text-base mb-4">Rent the best items from trusted landlords</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2"><p className="text-xl font-bold">{rentals.length}+</p><p className="text-xs">Active Rentals</p></div>
            <div className="bg-white/20 rounded-lg p-2"><p className="text-xl font-bold">24/7</p><p className="text-xs">Support</p></div>
            <div className="bg-white/20 rounded-lg p-2"><p className="text-xl font-bold">100%</p><p className="text-xs">Verified</p></div>
            <div className="bg-white/20 rounded-lg p-2"><p className="text-xl font-bold">★ 4.8</p><p className="text-xs">Avg Rating</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT SIDEBAR – Categories */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">All Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilters({ ...filters, category: cat.id })}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition flex items-center gap-2 ${
                      filters.category === cat.id
                        ? "bg-purple-100 text-purple-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {cat.icon && <cat.icon className="w-4 h-4" />}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN CONTENT – Rental grid */}
          <div className="lg:col-span-2">
            {/* Category Pills (Mobile Only) */}
            <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 p-2 bg-white rounded-2xl border border-gray-200/60 shadow-sm w-full">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = filters.category === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilters({ ...filters, category: cat.id })}
                    className={`flex-1 px-2 py-2.5 rounded-xl text-[11px] font-black transition-all duration-300 leading-tight flex items-center justify-center text-center ${
                      isActive 
                        ? "bg-purple-600 text-white shadow-md" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-purple-50"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 inline mr-1.5" />}
                    {cat.id === "all" ? "All" : cat.name.replace(" Rentals", "")}
                  </button>
                );
              })}
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-2 md:flex gap-2 mb-6 p-1.5 md:p-2 bg-white rounded-xl md:rounded-full border border-gray-100 shadow-sm w-full md:w-max">
              {[
                { id: "newest", label: "Newest" },
                { id: "price_low", label: "Price Low → High" },
                { id: "price_high", label: "Price High → Low" },
                { id: "rating", label: "Top Rated" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 md:flex-none px-2 md:px-5 py-2 rounded-lg md:rounded-full text-[10px] md:text-xs font-bold transition-all duration-300 leading-tight text-center ${
                    activeFilterTab === tab.id
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & view toggle */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Search rentals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border-gray-200 rounded-full h-9"
                />
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

            {/* Rental Cards */}
            {isLoading && !rentals.length ? (
              <div className="text-center py-20">Loading rentals...</div>
            ) : filteredRentals.length === 0 ? (
              <Card className="p-10 text-center">
                <p className="text-gray-500 mb-4">No rentals match your filters.</p>
                <Button variant="outline" onClick={() => setFilters({ category: "all", sortBy: "newest", priceMin: 0, priceMax: 100000 })}>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                {filteredRentals.map((rental) => (
                  <Card key={rental.id} className="cursor-pointer hover:shadow-md transition overflow-hidden">
                    <img src={rental.images?.[0] || "/placeholder.jpg"} alt={rental.title} className="w-full h-32 object-cover" />
                    <div className="p-3">
                      <div className="flex justify-between items-start gap-1">
                        <h3 className="font-semibold text-sm line-clamp-1">{rental.title}</h3>
                        <Badge variant="secondary" className="text-xs">For Rent</Badge>
                      </div>
                      <div className="mt-1"><span className="text-purple-600 font-bold text-base">NPR {rental.pricePerDay}</span><span className="text-xs text-gray-500">/day</span></div>
                      <div className="text-xs text-gray-500">{rental.features?.length || 0} amenities</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1"><MapPin className="w-3 h-3" />{rental.location}</div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">{rental.landlord?.name?.[0]}</div>
                        <span className="text-xs">{rental.landlord?.name}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs">{rental.rating}</span>
                      </div>
                      <Button className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-xs py-1.5 h-8">Book Now</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR – Sticky sections (no ads) */}
          <div className="hidden lg:flex flex-col gap-6">
            {/* Featured Rental (no TOPAD) */}
            <div className="sticky top-20 bg-white border-2 border-purple-500 rounded-xl p-4 shadow-md">
              <h3 className="font-bold text-purple-900 text-sm mb-2">Featured Rental</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                <img
                  src={FEATURED_RENTAL.image}
                  alt={FEATURED_RENTAL.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-white font-bold text-xs">{FEATURED_RENTAL.title}</p>
                  <p className="text-purple-300 text-[10px] font-bold">{FEATURED_RENTAL.price}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-white" />
                    <span className="text-[10px] text-white">{FEATURED_RENTAL.location}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 ml-1" />
                    <span className="text-[10px] text-white">{FEATURED_RENTAL.rating}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 rounded-full text-xs">
                Book Now
              </Button>
            </div>

            {/* Trending Locations */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-gray-900 text-sm">Trending Locations</h3>
              </div>
              <div className="space-y-4">
                {TRENDING_LOCATIONS.map((loc, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div><p className="font-medium text-sm">{loc.name}</p><p className="text-xs text-gray-500">{loc.count} properties</p></div>
                    <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /><span className="text-sm font-semibold">{loc.rating}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Properties */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Top Properties</h3>
              <div className="space-y-4">
                {TOP_PROPERTIES.map((prop) => (
                  <div key={prop.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={`https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=80&h=80&fit=crop&sig=${prop.id}`}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold line-clamp-1">{prop.title}</p>
                      <p className="text-xs text-purple-600 font-bold">{prop.price}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" /> {prop.location}
                        <Star className="w-3 h-3 fill-yellow-500 ml-1" /> {prop.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}