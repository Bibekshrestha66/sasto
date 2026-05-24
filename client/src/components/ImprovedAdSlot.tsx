import { useState } from "react";
import { X } from "lucide-react";

interface ImprovedAdSlotProps {
  position: "left" | "right";
  size?: "small" | "medium" | "large";
  onClose?: () => void;
}

// Sample ads with proper content
const SAMPLE_ADS = [
  {
    id: 1,
    title: "Premium Smartphones",
    description: "Best deals on latest phones",
    image: "🏪",
    color: "from-blue-500 to-blue-600",
    url: "/marketplace?category=Mobile%20Phones",
  },
  {
    id: 2,
    title: "Electronics Sale",
    description: "Up to 50% off",
    image: "📺",
    color: "from-purple-500 to-purple-600",
    url: "/marketplace?category=Electronics",
  },
  {
    id: 3,
    title: "Property Listings",
    description: "Find your dream home",
    image: "🏠",
    color: "from-orange-500 to-orange-600",
    url: "/marketplace?category=Property",
  },
  {
    id: 4,
    title: "Fashion & Beauty",
    description: "Latest trends available",
    image: "👗",
    color: "from-pink-500 to-pink-600",
    url: "/marketplace?category=Fashion",
  },
  {
    id: 5,
    title: "Vehicle Marketplace",
    description: "Browse all vehicles",
    image: "🚗",
    color: "from-red-500 to-red-600",
    url: "/marketplace?category=Vehicles",
  },
  {
    id: 6,
    title: "Services & Repairs",
    description: "Professional services",
    image: "🔧",
    color: "from-cyan-500 to-cyan-600",
    url: "/marketplace?category=Services",
  },
];

export default function ImprovedAdSlot({
  position,
  size = "medium",
  onClose,
}: ImprovedAdSlotProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(Math.floor(Math.random() * SAMPLE_ADS.length));

  if (!isVisible) return null;

  const ad = SAMPLE_ADS[currentAdIndex];

  const sizeClasses = {
    small: "w-24 h-40",
    medium: "w-28 h-48",
    large: "w-32 h-56",
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleNext = () => {
    setCurrentAdIndex((prev) => (prev + 1) % SAMPLE_ADS.length);
  };

  return (
    <div
      className={`fixed top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex ${
        position === "left" ? "left-2" : "right-2"
      }`}
    >
      <a
        href={ad.url}
        className={`flex flex-col items-center justify-center ${sizeClasses[size]} bg-gradient-to-br ${ad.color} rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-white/30 group relative overflow-hidden cursor-pointer`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full" />
          <div className="absolute bottom-2 left-2 w-6 h-6 bg-white rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            handleClose();
          }}
          className="absolute top-1 right-1 p-1 bg-white/20 hover:bg-white/40 rounded-full transition-all z-50"
        >
          <X size={14} className="text-white" />
        </button>

        {/* Ad Content */}
        <div className="relative z-10 text-center px-2 py-2 flex flex-col items-center justify-center h-full">
          {/* Ad Icon */}
          <div className="text-4xl mb-2">{ad.image}</div>

          {/* Ad Title */}
          <div className="text-white text-xs font-bold leading-tight mb-1 line-clamp-2">
            {ad.title}
          </div>

          {/* Ad Description */}
          <div className="text-white/80 text-[10px] leading-tight line-clamp-2">
            {ad.description}
          </div>

          {/* Next Ad Indicator */}
          <div className="mt-2 text-white/60 text-[9px]">
            {currentAdIndex + 1}/{SAMPLE_ADS.length}
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
      </a>

      {/* Navigation Button */}
      <button
        onClick={handleNext}
        className={`absolute top-1/2 transform -translate-y-1/2 ${
          position === "left" ? "-right-8" : "-left-8"
        } p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all opacity-0 group-hover:opacity-100`}
      >
        <div className="text-white text-xs">→</div>
      </button>
    </div>
  );
}
