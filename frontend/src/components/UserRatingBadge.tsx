import { Star, CheckCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

interface UserRatingBadgeProps {
  userId: number;
  showDetails?: boolean;
  compact?: boolean;
}

export function UserRatingBadge({
  userId,
  showDetails = false,
  compact = false,
}: UserRatingBadgeProps) {
  const { data: analytics, isLoading } = trpc.reviews.getAnalytics.useQuery(userId);

  if (isLoading || !analytics) {
    return <div className="h-8 bg-gray-200 rounded animate-pulse" />;
  }

  const { totalReviews, averageRating, verifiedPurchaseCount } = analytics;

  if (totalReviews === 0) {
    return (
      <Badge variant="outline" className="text-xs">
        No ratings yet
      </Badge>
    );
  }

  const getTrustLevel = (rating: number) => {
    if (rating >= 4.5) return { label: "Excellent", color: "bg-green-100 text-green-800" };
    if (rating >= 4) return { label: "Very Good", color: "bg-blue-100 text-blue-800" };
    if (rating >= 3) return { label: "Good", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Fair", color: "bg-orange-100 text-orange-800" };
  };

  const trust = getTrustLevel(averageRating);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < Math.round(averageRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-medium">{averageRating.toFixed(1)}</span>
        <span className="text-xs text-gray-500">({totalReviews})</span>
      </div>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
      <div className="space-y-3">
        {/* Main Rating */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600">Based on {totalReviews} reviews</p>
          </div>

          <Badge className={`${trust.color}`}>
            {trust.label}
          </Badge>
        </div>

        {showDetails && (
          <>
            {/* Rating Distribution */}
            <div className="space-y-2 pt-3 border-t border-gray-200">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = analytics[`${stars}StarCount` as keyof typeof analytics] as number || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-8">{stars}★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              {verifiedPurchaseCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                  <CheckCircle className="w-3 h-3" />
                  {verifiedPurchaseCount} Verified
                </div>
              )}
              {averageRating >= 4 && (
                <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                  <TrendingUp className="w-3 h-3" />
                  Trusted Seller
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
