import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, X, ChevronDown } from "lucide-react";

export interface SearchFiltersState {
  priceMin: number;
  priceMax: number;
  conditions: string[];
  location: string;
  category: string;
  subcategory?: string;
  dateRange: "any" | "today" | "week" | "month";
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFiltersState) => void;
  categories?: string[];
  locations?: string[];
  conditions?: string[];
}

const DEFAULT_CONDITIONS = ["New", "Like New", "Good", "Fair"];
const DEFAULT_LOCATIONS = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
  "Chitwan",
  "Biratnagar",
  "Janakpur",
  "Dharan",
];
const DEFAULT_CATEGORIES = [
  "All Categories",
  "Mobile Phones",
  "Electronics",
  "Vehicles",
  "Property",
  "Fashion",
  "Furniture",
  "Services",
];

export default function SearchFilters({
  onFiltersChange,
  categories = DEFAULT_CATEGORIES,
  locations = DEFAULT_LOCATIONS,
  conditions = DEFAULT_CONDITIONS,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFiltersState>({
    priceMin: 0,
    priceMax: 5000000,
    conditions: [],
    location: "",
    category: "All Categories",
    subcategory: "All",
    dateRange: "any",
  });

  const [expandedSections, setExpandedSections] = useState({
    price: true,
    condition: true,
    location: true,
    category: true,
    date: false,
  });

  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Update filter count
  useEffect(() => {
    let count = 0;
    if (filters.priceMin > 0 || filters.priceMax < 5000000) count++;
    if (filters.conditions.length > 0) count++;
    if (filters.location) count++;
    if (filters.category !== "All Categories") count++;
    if (filters.dateRange !== "any") count++;
    setActiveFilterCount(count);
  }, [filters]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  const handlePriceChange = (type: "min" | "max", value: number) => {
    if (type === "min") {
      setFilters((prev) => ({
        ...prev,
        priceMin: Math.min(value, prev.priceMax),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        priceMax: Math.max(value, prev.priceMin),
      }));
    }
  };

  const handleConditionToggle = (condition: string) => {
    setFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const handleLocationChange = (location: string) => {
    setFilters((prev) => ({
      ...prev,
      location: prev.location === location ? "" : location,
    }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category,
    }));
  };

  const handleDateRangeChange = (range: "any" | "today" | "week" | "month") => {
    setFilters((prev) => ({
      ...prev,
      dateRange: range,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      priceMin: 0,
      priceMax: 5000000,
      conditions: [],
      location: "",
      category: "All Categories",
      subcategory: "All",
      dateRange: "any",
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge className="bg-green-600 text-white">{activeFilterCount}</Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Reset All
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <Card className="p-4 border-2 border-green-200">
        <button
          onClick={() => toggleSection("category")}
          className="w-full flex items-center justify-between mb-3 hover:text-green-600 transition"
        >
          <label className="text-sm font-medium cursor-pointer">Category</label>
          <ChevronDown
            className={`w-4 h-4 transition ${expandedSections.category ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.category && (
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat}
                  onChange={() => handleCategoryChange(cat)}
                  className="w-4 h-4 accent-green-600"
                />
                {cat}
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Price Range Filter */}
      <Card className="p-4 border-2 border-green-200">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between mb-3 hover:text-green-600 transition"
        >
          <label className="text-sm font-medium cursor-pointer">Price Range</label>
          <ChevronDown
            className={`w-4 h-4 transition ${expandedSections.price ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.price && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Minimum (NPR)</label>
              <Input
                type="number"
                value={filters.priceMin}
                onChange={(e) => handlePriceChange("min", parseInt(e.target.value) || 0)}
                className="text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Maximum (NPR)</label>
              <Input
                type="number"
                value={filters.priceMax}
                onChange={(e) => handlePriceChange("max", parseInt(e.target.value) || 5000000)}
                className="text-sm"
                placeholder="5000000"
              />
            </div>
            <div className="text-xs text-gray-600 pt-2 border-t">
              NPR {filters.priceMin.toLocaleString()} - NPR {filters.priceMax.toLocaleString()}
            </div>
          </div>
        )}
      </Card>

      {/* Condition Filter */}
      <Card className="p-4 border-2 border-green-200">
        <button
          onClick={() => toggleSection("condition")}
          className="w-full flex items-center justify-between mb-3 hover:text-green-600 transition"
        >
          <label className="text-sm font-medium cursor-pointer">Condition</label>
          <ChevronDown
            className={`w-4 h-4 transition ${expandedSections.condition ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.condition && (
          <div className="space-y-2">
            {conditions.map((condition) => (
              <label key={condition} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.conditions.includes(condition)}
                  onChange={() => handleConditionToggle(condition)}
                  className="w-4 h-4 accent-green-600"
                />
                {condition}
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Location Filter */}
      <Card className="p-4 border-2 border-green-200">
        <button
          onClick={() => toggleSection("location")}
          className="w-full flex items-center justify-between mb-3 hover:text-green-600 transition"
        >
          <label className="text-sm font-medium cursor-pointer">Location</label>
          <ChevronDown
            className={`w-4 h-4 transition ${expandedSections.location ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.location && (
          <div className="space-y-2">
            {locations.map((loc) => (
              <label key={loc} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="location"
                  checked={filters.location === loc}
                  onChange={() => handleLocationChange(loc)}
                  className="w-4 h-4 accent-green-600"
                />
                {loc}
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Date Range Filter */}
      <Card className="p-4 border-2 border-green-200">
        <button
          onClick={() => toggleSection("date")}
          className="w-full flex items-center justify-between mb-3 hover:text-green-600 transition"
        >
          <label className="text-sm font-medium cursor-pointer">Posted Date</label>
          <ChevronDown
            className={`w-4 h-4 transition ${expandedSections.date ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.date && (
          <div className="space-y-2">
            {["any", "today", "week", "month"].map((range) => (
              <label key={range} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="dateRange"
                  checked={filters.dateRange === range}
                  onChange={() => handleDateRangeChange(range as any)}
                  className="w-4 h-4 accent-green-600"
                />
                {range === "any"
                  ? "Any Time"
                  : range === "today"
                    ? "Today"
                    : range === "week"
                      ? "This Week"
                      : "This Month"}
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2 font-medium">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.category !== "All Categories" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.category}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleCategoryChange("All Categories")}
                />
              </Badge>
            )}
            {(filters.priceMin > 0 || filters.priceMax < 5000000) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                NPR {filters.priceMin.toLocaleString()}-{filters.priceMax.toLocaleString()}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      priceMin: 0,
                      priceMax: 5000000,
                    }));
                  }}
                />
              </Badge>
            )}
            {filters.conditions.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.conditions.join(", ")}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters((prev) => ({ ...prev, conditions: [] }))}
                />
              </Badge>
            )}
            {filters.location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.location}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters((prev) => ({ ...prev, location: "" }))}
                />
              </Badge>
            )}
            {filters.dateRange !== "any" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.dateRange === "today"
                  ? "Today"
                  : filters.dateRange === "week"
                    ? "This Week"
                    : "This Month"}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters((prev) => ({ ...prev, dateRange: "any" }))}
                />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
