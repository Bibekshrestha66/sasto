import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewsList } from "@/components/ReviewsList";
import { UserRatingBadge } from "@/components/UserRatingBadge";
import { TrustBadge } from "@/components/TrustBadge";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Award } from "lucide-react";

interface SellerProfileReviewsProps {
  sellerId: number;
  sellerName?: string;
}

export function SellerProfileReviews({ sellerId, sellerName }: SellerProfileReviewsProps) {
  const { data: analytics } = trpc.reviews.getAnalytics.useQuery(sellerId);

  return (
    <div className="space-y-6">
      {/* Rating Summary Card */}
      <Card className="p-6 border-2 border-dashed border-accent bg-gradient-to-br from-green-50 to-blue-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">Seller Ratings & Reviews</h3>
            <p className="text-gray-600">See what customers say about {sellerName || "this seller"}</p>
          </div>
          <Award className="w-8 h-8 text-accent" />
        </div>

        {/* Rating Badge */}
        {analytics && (
          <div className="mb-6">
            <UserRatingBadge userId={sellerId} showDetails={true} />
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold mb-3 text-sm">Trust Indicators</h4>
          <div className="flex flex-wrap gap-2">
            <TrustBadge userId={sellerId} compact={true} />
          </div>
        </div>
      </Card>

      {/* Reviews Statistics */}
      {analytics && (
        <Card className="p-6 border-2 border-dashed border-accent">
          <h4 className="font-semibold mb-4">Review Breakdown</h4>
          <div className="grid grid-cols-5 gap-4">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = analytics[`${stars}StarCount` as keyof typeof analytics] as number || 0;
              const percentage = analytics.totalReviews > 0 ? (count / analytics.totalReviews) * 100 : 0;

              return (
                <div key={stars} className="text-center">
                  <div className="text-lg font-bold text-accent">{count}</div>
                  <div className="text-xs text-gray-600">{stars}★</div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Customer Reviews Section */}
      <Card className="p-6 border-2 border-dashed border-accent">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-accent" />
          <h4 className="text-lg font-semibold">Customer Reviews</h4>
          {analytics && (
            <Badge variant="secondary" className="ml-auto">
              {analytics.totalReviews} Reviews
            </Badge>
          )}
        </div>

        {/* Reviews List */}
        <ReviewsList userId={sellerId} limit={10} showEmpty={true} />
      </Card>

      {/* Seller Info Card */}
      <Card className="p-4 bg-blue-50 border-2 border-blue-200">
        <h5 className="font-semibold mb-2 text-sm">About These Reviews</h5>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>✓ Reviews are from verified purchases only</li>
          <li>✓ Ratings are calculated from all reviews received</li>
          <li>✓ Sellers can respond to reviews to address concerns</li>
          <li>✓ Inappropriate reviews are moderated by our team</li>
        </ul>
      </Card>
    </div>
  );
}
