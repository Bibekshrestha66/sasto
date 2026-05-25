import { useState, useCallback } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";

interface FilterState {
  priceMin: number;
  priceMax: number;
  condition: string[];
  location: string;
  sortBy: string;
}

interface ImprovedSearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];
const LOCATIONS = ["Kathmandu", "Bhaktapur", "Lalitpur", "Pokhara", "Chitwan", "Janakpur"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export default function ImprovedSearchFilters({
  onSearch,
  onFilterChange,
  onReset,
}: ImprovedSearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 1000000,
    condition: [],
    location: "",
    sortBy: "newest",
  });

  const handleSearch = useCallback(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  const handlePriceChange = (type: "min" | "max", value: number) => {
    const newFilters = {
      ...filters,
      [type === "min" ? "priceMin" : "priceMax"]: value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleConditionToggle = (condition: string) => {
    const newConditions = filters.condition.includes(condition)
      ? filters.condition.filter((c) => c !== condition)
      : [...filters.condition, condition];
    const newFilters = { ...filters, condition: newConditions };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleLocationChange = (location: string) => {
    const newFilters = { ...filters, location };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (sortBy: string) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setSearchQuery("");
    setFilters({
      priceMin: 0,
      priceMax: 1000000,
      condition: [],
      location: "",
      sortBy: "newest",
    });
    onReset();
  };

  const activeFiltersCount =
    (filters.condition.length > 0 ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.priceMin > 0 || filters.priceMax < 1000000 ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          Search
        </button>
      </div>

      {/* Filter Toggle and Sort */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
        >
          <Filter size={18} />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <select
          value={filters.sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <X size={18} />
            Reset
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t-2 border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price Range
            </label>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin}
                onChange={(e) => handlePriceChange("min", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax}
                onChange={(e) => handlePriceChange("max", parseInt(e.target.value) || 1000000)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Condition
            </label>
            <div className="space-y-2">
              {CONDITIONS.map((condition) => (
                <label key={condition} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.condition.includes(condition)}
                    onChange={() => handleConditionToggle(condition)}
                    className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{condition}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <select
              value={filters.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm font-semibold text-green-700 mb-2">Active Filters:</p>
              <div className="space-y-1 text-xs text-gray-700">
                {filters.priceMin > 0 || filters.priceMax < 1000000 && (
                  <p>💰 Rs {filters.priceMin} - Rs {filters.priceMax}</p>
                )}
                {filters.condition.length > 0 && (
                  <p>📦 {filters.condition.join(", ")}</p>
                )}
                {filters.location && (
                  <p>📍 {filters.location}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
