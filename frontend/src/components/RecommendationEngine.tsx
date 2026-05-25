import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Zap } from 'lucide-react';

interface Recommendation {
  id: number;
  title: string;
  price: number;
  image: string;
  rating: number;
  seller: string;
  category: string;
  reason: string;
  relevanceScore: number;
}

interface RecommendationEngineProps {
  userId?: number;
  currentListingId?: number;
  limit?: number;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  userId,
  currentListingId,
  limit = 6,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [userId, currentListingId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call AI recommendation API
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentListingId,
          limit,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading recommendations');
      console.error('Recommendation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Recommended for You</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-bold">Recommended for You</h3>
        <Zap className="w-5 h-5 text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((item) => (
          <Card
            key={item.id}
            className="border-2 border-dashed border-green-300 hover:shadow-lg transition-shadow overflow-hidden group"
          >
            {/* Image Container */}
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                {Math.round(item.relevanceScore * 100)}% Match
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                {item.reason}
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                {item.title}
              </h4>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(item.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600">({item.rating.toFixed(1)})</span>
              </div>

              {/* Price */}
              <div className="mb-2">
                <p className="text-2xl font-bold text-green-600">
                  Rs. {item.price.toLocaleString()}
                </p>
              </div>

              {/* Seller Info */}
              <p className="text-xs text-gray-600 mb-3">{item.seller}</p>

              {/* Action Button */}
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecommendationEngine;
