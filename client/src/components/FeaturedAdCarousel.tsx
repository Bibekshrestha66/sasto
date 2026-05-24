import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ChevronLeft, ChevronRight, Zap, MapPin, Eye, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedListing {
  id: number;
  title: string;
  price: number | null;
  originalPrice?: number | null;
  images: any;
  location?: string | null;
  district?: string | null;
  condition?: string | null;
  type?: string | null;
  views?: number | null;
  featuredUntil?: Date | number | null;
  sellerName?: string | null;
}

interface FeaturedAdCarouselProps {
  /** If set, only show featured listings of this type */
  filterType?: "marketplace" | "auction" | "rental";
  /** Title shown above the carousel */
  title?: string;
  accentColor?: string; // tailwind color prefix e.g. "green" | "orange" | "purple" | "rose"
}

export function FeaturedAdCarousel({
  filterType,
  title = "Featured Listings",
  accentColor = "green",
}: FeaturedAdCarouselProps) {
  const [, setLocation] = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: featuredListings, isLoading } = trpc.ads.getFeaturedListings.useQuery();

  // Filter by type if requested
  const listings: FeaturedListing[] = (featuredListings || []).filter((l: any) =>
    !filterType || !l.type || l.type === filterType
  );

  const count = listings.length;

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (count <= 1 || isPaused) return;
    intervalRef.current = setInterval(goNext, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [count, isPaused, goNext]);

  // Reset index if listings change
  useEffect(() => {
    setActiveIndex(0);
  }, [count]);

  if (isLoading) {
    return (
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm animate-pulse">
        <div className="h-40 bg-slate-100" />
        <div className="p-3 space-y-2">
          <div className="h-3 w-3/4 bg-slate-100 rounded" />
          <div className="h-3 w-1/2 bg-slate-100 rounded" />
          <div className="h-7 bg-slate-100 rounded-full mt-2" />
        </div>
      </div>
    );
  }

  if (!listings || count === 0) return null;

  const current = listings[activeIndex];
  const images = current.images as string[] | null;
  const firstImage = images?.[0];
  const hasImageError = imageErrors[current.id];
  const imgSrc = hasImageError || !firstImage
    ? `https://picsum.photos/seed/${current.id}/400/300`
    : firstImage;

  const discount = current.originalPrice && current.price && current.originalPrice > current.price
    ? Math.round(((current.originalPrice - current.price) / current.originalPrice) * 100)
    : null;

  const colorMap: Record<string, string> = {
    green: "from-green-600 to-emerald-500",
    orange: "from-orange-600 to-amber-500",
    purple: "from-purple-600 to-violet-500",
    rose: "from-rose-600 to-pink-500",
    blue: "from-blue-600 to-indigo-500",
  };
  const gradient = colorMap[accentColor] || colorMap.green;

  const btnColor: Record<string, string> = {
    green: "bg-green-600 hover:bg-green-700",
    orange: "bg-orange-600 hover:bg-orange-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    rose: "bg-rose-600 hover:bg-rose-700",
    blue: "bg-blue-600 hover:bg-blue-700",
  };
  const btnClass = btnColor[accentColor] || btnColor.green;

  const badgeColor: Record<string, string> = {
    green: "bg-green-600",
    orange: "bg-orange-600",
    purple: "bg-purple-600",
    rose: "bg-rose-600",
    blue: "bg-blue-600",
  };
  const badgeClass = badgeColor[accentColor] || badgeColor.green;

  return (
    <div
      className="bg-white border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} px-3 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-black tracking-wide">{title}</span>
        </div>
        <span className="text-white/80 text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full">
          Sponsored
        </span>
      </div>

      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <img
          key={current.id}
          src={imgSrc}
          alt={current.title}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          onError={() => setImageErrors(prev => ({ ...prev, [current.id]: true }))}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {current.condition && (
            <span className="bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize">
              {current.condition === "like-new" ? "Like New" : current.condition}
            </span>
          )}
        </div>

        {/* Views */}
        {current.views != null && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            <Eye className="w-2.5 h-2.5" />
            {current.views.toLocaleString()}
          </div>
        )}

        {/* Nav arrows (only if multiple) */}
        {count > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 mb-1">
          {current.title}
        </h4>

        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-green-600 font-black text-base">
              NPR {current.price ? parseFloat(String(current.price)).toLocaleString() : "N/A"}
            </span>
            {current.originalPrice && current.originalPrice > (current.price || 0) && (
              <span className="text-slate-400 line-through text-xs ml-1.5">
                NPR {parseFloat(String(current.originalPrice)).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {(current.location || current.district) && (
          <div className="flex items-center gap-1 text-slate-500 text-xs mb-2">
            <MapPin className="w-2.5 h-2.5" />
            <span className="truncate">{current.location || current.district}</span>
          </div>
        )}

        {current.sellerName && (
          <div className="flex items-center gap-1 text-slate-500 text-xs mb-2">
            <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-[8px]">
              {current.sellerName.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{current.sellerName}</span>
          </div>
        )}

        <Button
          size="sm"
          className={`w-full ${btnClass} rounded-full text-xs font-bold h-8 transition-all`}
          onClick={() => setLocation(`/listing/${current.id}`)}
        >
          View Details →
        </Button>
      </div>

      {/* Dot Indicators */}
      {count > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {listings.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? `w-5 h-1.5 ${badgeClass}`
                  : "w-1.5 h-1.5 bg-slate-200 hover:bg-slate-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FeaturedAdCarousel;
