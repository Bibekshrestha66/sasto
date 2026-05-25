import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";

const CATEGORIES = [
  { id: 1, name: "Mobile Phones", icon: "📱", count: "2,450+" },
  { id: 2, name: "Electronics & Appliances", icon: "📺", count: "1,890+" },
  { id: 3, name: "Vehicles", icon: "🚗", count: "3,200+" },
  { id: 4, name: "Property", icon: "🏠", count: "1,560+" },
  { id: 5, name: "Groceries", icon: "🛒", count: "4,100+" },
  { id: 6, name: "Medical", icon: "💊", count: "1,200+" },
  { id: 7, name: "Digital & Tech", icon: "💻", count: "950+" },
  { id: 8, name: "Agriculture", icon: "🌾", count: "780+" },
  { id: 9, name: "Sports & Fitness", icon: "⚽", count: "1,100+" },
  { id: 10, name: "Books & Education", icon: "📚", count: "890+" },
  { id: 11, name: "Fashion & Beauty", icon: "👗", count: "1,200+" },
  { id: 12, name: "Furniture & Household", icon: "🛋️", count: "780+" },
  { id: 13, name: "Jobs", icon: "💼", count: "890+" },
  { id: 14, name: "Services", icon: "🔧", count: "670+" },
  { id: 15, name: "Pets & Animals", icon: "🐕", count: "340+" },
  { id: 16, name: "Kids & Babies", icon: "👶", count: "450+" },
];

export default function Categories() {
  const [, navigate] = useLocation();

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/marketplace?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-accent to-accent/80 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse All Categories</h1>
            <p className="text-lg md:text-xl opacity-90">
              Explore thousands of listings across all categories
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className="p-4 border-2 border-dashed border-accent rounded-lg hover:bg-accent/5 transition text-center"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <p className="font-semibold text-sm mb-1">{cat.name}</p>
                <p className="text-xs text-accent font-medium">{cat.count} ads</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Don't see what you're looking for?</h2>
          <p className="text-lg opacity-90 mb-8">
            Post your own ad and connect with buyers
          </p>
          <Button className="bg-white text-accent hover:bg-gray-100 font-semibold px-8 py-3">
            Post an Ad
          </Button>
        </div>
      </section>
    </div>
  );
}
