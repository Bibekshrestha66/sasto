import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Star, Grid, List } from "lucide-react";
import ImprovedSearchFilters from "@/components/ImprovedSearchFilters";
import ImprovedAdSlot from "@/components/ImprovedAdSlot";

const LISTINGS = [
  {
    id: 1,
    title: "iPhone 14 Pro Max 256GB",
    price: 150000,
    location: "Kathmandu, Bagmati",
    seller: "TechStore KTM",
    rating: 4.8,
    image: "placeholder",
    category: "Mobile Phones",
    condition: "Like New",
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 2,
    title: "Honda City 2020 Model",
    price: 3200000,
    location: "Lalitpur, Bagmati",
    seller: "AutoDealer Pro",
    rating: 4.6,
    image: "placeholder",
    category: "Vehicles",
    condition: "Good",
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    id: 3,
    title: "2 BHK Apartment for Rent",
    price: 25000,
    location: "Pokhara, Gandaki",
    seller: "Property Plus",
    rating: 4.7,
    image: "placeholder",
    category: "Property",
    condition: "Furnished",
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    id: 4,
    title: "Gaming PC RTX 4070",
    price: 180000,
    location: "Bhaktapur, Bagmati",
    seller: "Gaming Hub",
    rating: 4.9,
    image: "placeholder",
    category: "Electronics",
    condition: "New",
    postedDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 5,
    title: "Royal Enfield Classic 350",
    price: 280000,
    location: "Chitwan, Bagmati",
    seller: "Bike World",
    rating: 4.5,
    image: "placeholder",
    category: "Vehicles",
    condition: "Good",
    postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  },
  {
    id: 6,
    title: "MacBook Air M2 2023",
    price: 195000,
    location: "Kathmandu, Bagmati",
    seller: "Apple Store Nepal",
    rating: 4.8,
    image: "placeholder",
    category: "Electronics",
    condition: "New",
    postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  },
  {
    id: 7,
    title: "Samsung 55\" 4K Smart TV",
    price: 95000,
    location: "Kathmandu, Bagmati",
    seller: "Electronics Store",
    rating: 4.4,
    image: "placeholder",
    category: "Electronics",
    condition: "Like New",
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  },
  {
    id: 8,
    title: "Sofa Set 3+1",
    price: 35000,
    location: "Lalitpur, Bagmati",
    seller: "Furniture World",
    rating: 4.3,
    image: "placeholder",
    category: "Furniture",
    condition: "Good",
    postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
  },
];

const CATEGORIES = [
  "All Categories",
  "Mobile Phones",
  "Electronics",
  "Vehicles",
  "Property",
  "Fashion",
  "Furniture",
  "Groceries",
  "Medical",
  "Digital & Tech",
  "Agriculture",
  "Sports & Fitness",
  "Books & Education",
  "Services",
];

const LOCATIONS = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
  "Chitwan",
  "Biratnagar",
  "Janakpur",
  "Dharan",
];

const SUBCATEGORIES: Record<string, string[]> = {
  "Medical": ["Medicines", "Herbal", "Medical Accessories"],
  "Digital & Tech": ["Software", "Projects", "Web Services", "Games"],
  "Groceries": ["Fruits & Veg", "Dairy", "Pantry", "Meat"],
  "Agriculture": ["Tools", "Seeds", "Livestock", "Fertilizer"],
};

interface SearchFiltersState {
  priceMin: number;
  priceMax: number;
  conditions: string[];
  location: string;
  category: string;
  subcategory?: string;
  dateRange: string;
}

export default function Marketplace() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFiltersState>({
    priceMin: 0,
    priceMax: 5000000,
    conditions: [],
    location: "",
    category: "All Categories",
    subcategory: "All",
    dateRange: "any",
  });

  // Calculate date range for filtering
  const getDateRangeStart = (range: string) => {
    const now = new Date();
    switch (range) {
      case "today":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "month":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0); // All time
    }
  };

  const filteredListings = LISTINGS.filter((listing) => {
    // Category filter
    const matchesCategory =
      filters.category === "All Categories" || listing.category === filters.category;

    // Subcategory filter (placeholder logic since LISTINGS doesn't have subcategories yet)
    const matchesSubcategory = 
      filters.subcategory === "All" || (listing as any).subcategory === filters.subcategory;

    // Search filter
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Price filter
    const matchesPrice = listing.price >= filters.priceMin && listing.price <= filters.priceMax;

    // Condition filter
    const matchesCondition =
      filters.conditions.length === 0 || filters.conditions.includes(listing.condition);

    // Location filter
    const matchesLocation =
      !filters.location || listing.location.toLowerCase().includes(filters.location.toLowerCase());

    // Date range filter
    const dateRangeStart = getDateRangeStart(filters.dateRange);
    const matchesDateRange = listing.postedDate >= dateRangeStart;

    return (
      matchesCategory &&
      matchesSubcategory &&
      matchesSearch &&
      matchesPrice &&
      matchesCondition &&
      matchesLocation &&
      matchesDateRange
    );
  });

  const formatPrice = (price: number) => {
    return `NPR ${price.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Search Section */}
      <section className="bg-white border-b border-border py-6">
        <div className="container">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            {/* Category Quick Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={filters.category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setFilters((prev: any) => ({
                      ...prev,
                      category: cat,
                      subcategory: "All",
                    }))
                  }
                  className={
                    filters.category === cat
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "border-green-200 text-gray-700 hover:border-green-400"
                  }
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Subcategory Filter Row */}
            {filters.category !== "All Categories" && SUBCATEGORIES[filters.category] && (
              <div className="flex gap-2 overflow-x-auto pb-2 animate-in slide-in-from-top-2 duration-300">
                <Button
                  variant={filters.subcategory === "All" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilters((prev: any) => ({ ...prev, subcategory: "All" }))}
                  className="text-[10px] h-7 px-3 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                >
                  All {filters.category}
                </Button>
                {SUBCATEGORIES[filters.category].map((sub) => (
                  <Button
                    key={sub}
                    variant={filters.subcategory === sub ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFilters((prev: any) => ({
                        ...prev,
                        subcategory: sub,
                      }))
                    }
                    className={`text-[10px] h-7 px-3 ${
                      filters.subcategory === sub
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "border-green-100 text-gray-600 hover:border-green-300"
                    }`}
                  >
                    {sub}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <ImprovedSearchFilters
              onSearch={setSearchQuery}
              onFilterChange={(newFilters) => {
                setFilters((prev: any) => ({
                  ...prev,
                  priceMin: newFilters.priceMin,
                  priceMax: newFilters.priceMax,
                  conditions: newFilters.condition,
                  location: newFilters.location,
                  dateRange: 'any'
                }));
              }}
              onReset={() => {
                setSearchQuery('');
                setFilters({
                  priceMin: 0,
                  priceMax: 5000000,
                  conditions: [],
                  location: '',
                  category: 'All Categories',
                  dateRange: 'any',
                });
              }}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-gray-900">{filteredListings.length}</span>{" "}
                results
              </p>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={
                    viewMode === "grid"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "border-green-200 text-gray-700"
                  }
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "border-green-200 text-gray-700"
                  }
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Listings Grid/List */}
            {filteredListings.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredListings.map((listing) => (
                    <Card
                      key={listing.id}
                      className="hover:shadow-lg transition overflow-hidden group cursor-pointer border-2 border-green-100 hover:border-green-300"
                    >
                      <div className="aspect-video bg-muted flex items-center justify-center relative">
                        <p className="text-muted-foreground">Image Placeholder</p>
                        <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          {listing.condition}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 group-hover:text-green-600 transition line-clamp-2">
                          {listing.title}
                        </h3>
                        <p className="text-lg font-bold text-green-600 mb-2">
                          {formatPrice(listing.price)}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4" />
                          {listing.location}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-green-100">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">{listing.seller}</span>
                            <span className="text-xs text-gray-500">{formatDate(listing.postedDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">{listing.rating}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredListings.map((listing) => (
                    <Card
                      key={listing.id}
                      className="hover:shadow-md transition overflow-hidden group cursor-pointer border-2 border-green-100 hover:border-green-300"
                    >
                      <div className="flex gap-4 p-4">
                        <div className="w-24 h-24 bg-muted flex items-center justify-center flex-shrink-0 relative">
                          <p className="text-xs text-muted-foreground text-center">Image</p>
                          <span className="absolute top-1 right-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded">
                            {listing.condition}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 group-hover:text-green-600 transition">
                            {listing.title}
                          </h3>
                          <p className="text-lg font-bold text-green-600 mb-2">
                            {formatPrice(listing.price)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {listing.location}
                            </span>
                            <span className="text-xs">{formatDate(listing.postedDate)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">{listing.rating}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{listing.seller}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No listings found matching your filters</p>
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() =>
                    setFilters({
                      priceMin: 0,
                      priceMax: 5000000,
                      conditions: [],
                      location: "",
                      category: "All Categories",
                      dateRange: "any",
                    })
                  }
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
