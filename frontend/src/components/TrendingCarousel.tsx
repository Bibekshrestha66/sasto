import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useState } from "react";

interface TrendingItem {
  id: string;
  image: string;
  title: string;
  price: string;
  condition: "Used" | "Like New" | "Brand New";
  location?: string;
  time?: string;
}

interface TrendingCarouselProps {
  items: TrendingItem[];
  title?: string;
  accentColor?: "green" | "red" | "purple";
}

export default function TrendingCarousel({
  items,
  title = "Trending",
  accentColor = "green",
}: TrendingCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  const borderColorClasses = {
    green: "border-accent/30",
    red: "border-red-500/30",
    purple: "border-purple-500/30",
  };

  const conditionColorClasses = {
    Used: "bg-yellow-100 text-yellow-800",
    "Like New": "bg-blue-100 text-blue-800",
    "Brand New": "bg-green-100 text-green-800",
  };

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("trending-carousel");
    if (container) {
      const scrollAmount = 320;
      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        setScrollPosition(Math.max(0, scrollPosition - scrollAmount));
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        setScrollPosition(scrollPosition + scrollAmount);
      }
    }
  };

  return (
    <div className="w-full py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          {title}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        id="trending-carousel"
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex-shrink-0 w-80 border-2 dashed ${borderColorClasses[accentColor]} rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white group cursor-pointer`}
            style={{ borderStyle: "dashed" }}
          >
            {/* Image Container */}
            <div className="relative h-48 overflow-hidden bg-muted">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {/* Condition Badge */}
              <div
                className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${conditionColorClasses[item.condition]}`}
              >
                {item.condition}
              </div>
              {/* Favorite Button */}
              <button className="absolute top-3 left-3 p-2 bg-white/90 hover:bg-white rounded-full transition opacity-0 group-hover:opacity-100">
                <Heart className="w-5 h-5 text-red-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <h4 className="font-semibold text-sm text-foreground line-clamp-2 mb-2">
                {item.title}
              </h4>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-accent">
                  {item.price}
                </span>
              </div>
              {item.location && (
                <p className="text-xs text-muted-foreground mb-1">
                  📍 {item.location}
                </p>
              )}
              {item.time && (
                <p className="text-xs text-muted-foreground">⏱️ {item.time}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
