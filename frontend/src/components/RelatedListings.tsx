import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star } from "lucide-react";
import { useState } from "react";

export interface RelatedListing {
  id: string;
  title: string;
  price: number;
  image: string;
  location: string;
  seller: {
    name: string;
    rating: number;
  };
  isFavorite?: boolean;
  condition?: string;
  views?: number;
}

interface RelatedListingsProps {
  listings: RelatedListing[];
  onListingClick: (id: string) => void;
  onFavoriteToggle: (id: string) => void;
}

export default function RelatedListings({
  listings,
  onListingClick,
  onFavoriteToggle,
}: RelatedListingsProps) {
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(listings.filter((l) => l.isFavorite).map((l) => l.id))
  );

  const handleFavoriteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
    onFavoriteToggle(id);
  };

  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Related Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <Card
            key={listing.id}
            className="overflow-hidden hover:shadow-lg transition cursor-pointer border-2 border-green-200 hover:border-green-400"
            onClick={() => onListingClick(listing.id)}
          >
            {/* Image */}
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              <img
                src={listing.image}
                alt={listing.title}
                className="w-full h-full object-cover hover:scale-105 transition"
              />
              <button
                onClick={(e) => handleFavoriteClick(listing.id, e)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
              >
                <Heart
                  className={`h-5 w-5 ${
                    favorites.has(listing.id)
                      ? "fill-red-500 text-red-500"
                      : "text-gray-400"
                  }`}
                />
              </button>
              {listing.condition && (
                <Badge className="absolute bottom-2 left-2 bg-orange-500">
                  {listing.condition}
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="p-3">
              <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                {listing.title}
              </h3>

              {/* Price */}
              <p className="text-lg font-bold text-green-600 mt-2">
                NPR {listing.price.toLocaleString()}
              </p>

              {/* Location */}
              <div className="flex items-center gap-1 text-gray-600 text-xs mt-2">
                <MapPin className="h-3 w-3" />
                <span>{listing.location}</span>
              </div>

              {/* Seller Info */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-600">{listing.seller.name}</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{listing.seller.rating}</span>
                </div>
              </div>

              {/* Views */}
              {listing.views && (
                <p className="text-xs text-gray-500 mt-2">{listing.views} views</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
