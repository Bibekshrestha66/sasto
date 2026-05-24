import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Star, Gavel, Home, Car, Smartphone, Gem, Sparkles } from "lucide-react";

// Updated auction data with categories
const AUCTIONS = [
  {
    id: 1,
    title: "Vintage Royal Enfield 1965",
    startingPrice: "NPR 3,50,000",
    currentPrice: "NPR 4,50,000",
    bids: 23,
    timeLeft: 9900,
    location: "Kathmandu, Bagmati",
    seller: "ClassicBikes",
    rating: 4.8,
    image: "placeholder",
    category: "vehicles"
  },
  {
    id: 2,
    title: "Land in Kathmandu Valley",
    startingPrice: "NPR 50,00,000",
    currentPrice: "NPR 85,00,000",
    bids: 45,
    timeLeft: 129600,
    location: "Kathmandu, Bagmati",
    seller: "PropertyAuctions",
    rating: 4.9,
    image: "placeholder",
    category: "property"
  },
  {
    id: 3,
    title: "Antique Buddha Statue",
    startingPrice: "NPR 50,000",
    currentPrice: "NPR 75,000",
    bids: 12,
    timeLeft: 19200,
    location: "Bhaktapur, Bagmati",
    seller: "AntiquesNepal",
    rating: 4.7,
    image: "placeholder",
    category: "antiques"
  },
  {
    id: 4,
    title: "Gold Jewelry Collection",
    startingPrice: "NPR 1,00,000",
    currentPrice: "NPR 2,50,000",
    bids: 34,
    timeLeft: 86400,
    location: "Lalitpur, Bagmati",
    seller: "JewelryHub",
    rating: 4.6,
    image: "placeholder",
    category: "jewelry"
  },
  {
    id: 5,
    title: "iPhone 15 Pro Max - Brand New",
    startingPrice: "NPR 1,50,000",
    currentPrice: "NPR 1,80,000",
    bids: 18,
    timeLeft: 43200,
    location: "Kathmandu, Bagmati",
    seller: "TechAuctions",
    rating: 4.9,
    image: "placeholder",
    category: "electronics"
  },
  {
    id: 6,
    title: "Vintage Camera Collection",
    startingPrice: "NPR 80,000",
    currentPrice: "NPR 1,20,000",
    bids: 9,
    timeLeft: 7200,
    location: "Lalitpur, Bagmati",
    seller: "VintageGear",
    rating: 4.8,
    image: "placeholder",
    category: "electronics"
  },
];

// Category configuration
const CATEGORIES = [
  { id: "all", name: "All Categories", icon: Sparkles },
  { id: "property", name: "Property", icon: Home },
  { id: "vehicles", name: "Vehicle", icon: Car },
  { id: "electronics", name: "Electronics", icon: Smartphone },
  { id: "antiques", name: "Antiques & Collectibles", icon: Gem },
];

const FILTER_TABS = [
  { id: "all", label: "All Auctions" },
  { id: "ending_soon", label: "Ending Soon" },
  { id: "just_started", label: "Just Started" },
  { id: "high_bids", label: "High Bids" },
];

function TimeRemaining({ seconds }: { seconds: number }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <span className="text-sm font-semibold text-purple-600">
      {days > 0 && `${days}d `}
      {hours}h {minutes}m {secs}s
    </span>
  );
}

export default function Auctions() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeFilterTab, setActiveFilterTab] = useState("all");

  // Filter auctions by category
  let filteredAuctions = AUCTIONS.filter(auction => 
    selectedCategory === "all" || auction.category === selectedCategory
  );

  // Apply additional filters
  const now = Date.now() / 1000;
  switch (activeFilterTab) {
    case "ending_soon":
      filteredAuctions = filteredAuctions.filter(a => a.timeLeft < 86400); // Less than 24 hours
      break;
    case "just_started":
      filteredAuctions = filteredAuctions.filter(a => a.timeLeft > 86400 * 5); // More than 5 days left
      break;
    case "high_bids":
      filteredAuctions = [...filteredAuctions].sort((a, b) => b.bids - a.bids);
      break;
    default:
      break;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Gavel className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Live Auctions</h1>
          </div>
          <p className="text-purple-100">
            Bid on unique items and find amazing deals in real-time auctions
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-2 mb-6 p-2 bg-white rounded-2xl md:rounded-full border border-gray-200/60 shadow-sm w-full md:w-max">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-1 md:flex-none px-2 md:px-6 py-2.5 rounded-xl md:rounded-full text-[11px] md:text-sm font-black transition-all duration-300 leading-tight flex items-center justify-center text-center ${
                  isActive 
                    ? "bg-purple-600 text-white shadow-md md:shadow-lg" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-purple-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 inline mr-1.5" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <div className="grid grid-cols-2 md:flex gap-2 mb-8 p-1.5 md:p-2 bg-white rounded-xl md:rounded-full border border-gray-100 shadow-sm w-full md:w-max">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterTab(tab.id)}
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

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500">
          <span className="font-semibold text-gray-800">
            {filteredAuctions.length} auctions found
          </span>
        </div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => (
            <Card
              key={auction.id}
              className="border-2 border-purple-200 hover:border-purple-500 transition overflow-hidden group cursor-pointer"
            >
              {/* Image */}
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Live Auction
                </div>
                <p className="text-purple-400">Image Placeholder</p>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold mb-2 group-hover:text-purple-600 transition line-clamp-2">
                  {auction.title}
                </h3>

                {/* Prices */}
                <div className="mb-3 p-3 bg-purple-50 rounded">
                  <p className="text-xs text-gray-500 mb-1">Current Bid</p>
                  <p className="text-xl font-bold text-purple-600">{auction.currentPrice}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Starting: {auction.startingPrice}
                  </p>
                </div>

                {/* Bids and Time */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">{auction.bids} bids</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <TimeRemaining seconds={auction.timeLeft} />
                  </div>
                </div>

                {/* Location and Seller */}
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  {auction.location}
                </div>

                {/* Seller Info */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">{auction.seller}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-purple-500 text-purple-500" />
                    <span className="text-sm font-semibold">{auction.rating}</span>
                  </div>
                </div>

                {/* Bid Button */}
                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                  Place Bid
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAuctions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No auctions found</h3>
            <p className="text-gray-400 text-sm">Try changing your category or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}