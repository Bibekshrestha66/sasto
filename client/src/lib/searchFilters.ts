// Search and filtering utilities for marketplace listings

export interface SearchFilters {
  query: string;
  category: string;
  minPrice: number | null;
  maxPrice: number | null;
  condition: string;
  location: string;
  sortBy: "newest" | "price_low" | "price_high" | "popular";
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  views: number;
  createdAt: Date;
  seller?: {
    name: string;
    rating: number;
  };
}

export function filterListings(listings: Listing[], filters: SearchFilters): Listing[] {
  let filtered = listings;

  // Text search
  if (filters.query.trim()) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(
      (listing) =>
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query)
    );
  }

  // Category filter
  if (filters.category) {
    filtered = filtered.filter((listing) => listing.category === filters.category);
  }

  // Price range filter
  if (filters.minPrice !== null) {
    filtered = filtered.filter((listing) => listing.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== null) {
    filtered = filtered.filter((listing) => listing.price <= filters.maxPrice!);
  }

  // Condition filter
  if (filters.condition) {
    filtered = filtered.filter((listing) => listing.condition === filters.condition);
  }

  // Location filter
  if (filters.location.trim()) {
    const location = filters.location.toLowerCase();
    filtered = filtered.filter((listing) =>
      listing.location.toLowerCase().includes(location)
    );
  }

  // Sorting
  switch (filters.sortBy) {
    case "price_low":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price_high":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "popular":
      filtered.sort((a, b) => b.views - a.views);
      break;
    case "newest":
    default:
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  return filtered;
}

export function getDefaultFilters(): SearchFilters {
  return {
    query: "",
    category: "",
    minPrice: null,
    maxPrice: null,
    condition: "",
    location: "",
    sortBy: "newest",
  };
}
