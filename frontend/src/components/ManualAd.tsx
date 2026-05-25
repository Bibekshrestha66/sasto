import { useState } from "react";
import { X } from "lucide-react";

export interface ManualAdData {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  advertiserName: string;
  ctr?: number;
  impressions?: number;
  clicks?: number;
  status: "active" | "paused" | "expired";
  startDate: Date;
  endDate: Date;
}

interface ManualAdProps {
  ad: ManualAdData;
  onClose?: () => void;
  className?: string;
  showCloseButton?: boolean;
}

/**
 * ManualAd Component for displaying manual/custom advertisements
 * Can be used for sponsored content, partner ads, or premium listings
 */
export function ManualAd({
  ad,
  onClose,
  className = "",
  showCloseButton = true,
}: ManualAdProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, "_blank");
      // Track click (would be sent to backend)
    }
  };

  if (ad.status !== "active") {
    return null;
  }

  return (
    <div
      className={`relative bg-white border-2 border-dashed border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Close Button */}
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
          aria-label="Close ad"
        >
          <X size={16} className="text-gray-500" />
        </button>
      )}

      {/* Ad Container */}
      <div
        onClick={handleClick}
        className="cursor-pointer group"
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleClick();
        }}
      >
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '4/3' }}>
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className={`w-full h-full object-contain transition-transform duration-300 ${
              isHovered ? "scale-105" : "scale-100"
            }`}
          />
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
            SPONSORED
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {ad.title}
          </h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {ad.description}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            By: <span className="font-semibold">{ad.advertiserName}</span>
          </p>

          {/* CTA Button */}
          <button className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1 px-2 rounded transition-colors">
            Learn More
          </button>
        </div>
      </div>

      {/* Analytics (optional - shown on hover) */}
      {isHovered && ad.impressions && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-80 text-white text-xs p-2 flex justify-between">
          <span>{ad.impressions} impressions</span>
          <span>{ad.clicks} clicks</span>
          <span>{ad.ctr?.toFixed(2)}% CTR</span>
        </div>
      )}
    </div>
  );
}

/**
 * ManualAdGrid Component for displaying multiple manual ads
 */
interface ManualAdGridProps {
  ads: ManualAdData[];
  columns?: number;
  className?: string;
}

export function ManualAdGrid({
  ads,
  columns = 3,
  className = "",
}: ManualAdGridProps) {
  const [visibleAds, setVisibleAds] = useState(ads);

  const handleAdClose = (adId: number) => {
    setVisibleAds(visibleAds.filter((ad) => ad.id !== adId));
  };

  if (visibleAds.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid gap-4 ${
        columns === 1
          ? "grid-cols-1"
          : columns === 2
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      } ${className}`}
    >
      {visibleAds.map((ad) => (
        <ManualAd
          key={ad.id}
          ad={ad}
          onClose={() => handleAdClose(ad.id)}
          showCloseButton
        />
      ))}
    </div>
  );
}
