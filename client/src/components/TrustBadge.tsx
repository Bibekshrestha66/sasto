import { Shield, CheckCircle, Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";

interface TrustBadgeProps {
  userId: number;
  compact?: boolean;
}

export function TrustBadge({ userId, compact = false }: TrustBadgeProps) {
  const { data: analytics, isLoading } = trpc.reviews.getAnalytics.useQuery(userId);

  if (isLoading || !analytics) {
    return null;
  }

  const { totalReviews, averageRating, verifiedPurchaseCount } = analytics;

  if (totalReviews === 0) {
    return null;
  }

  const badges = [];

  // Verified Seller Badge
  if (verifiedPurchaseCount >= 5) {
    badges.push({
      icon: CheckCircle,
      label: "Verified Seller",
      color: "bg-green-100 text-green-800",
      tooltip: `${verifiedPurchaseCount} verified purchases`,
    });
  }

  // Trusted Seller Badge
  if (averageRating >= 4.5 && totalReviews >= 10) {
    badges.push({
      icon: Award,
      label: "Trusted Seller",
      color: "bg-blue-100 text-blue-800",
      tooltip: `${averageRating.toFixed(1)} rating with ${totalReviews} reviews`,
    });
  }

  // Top Rated Badge
  if (averageRating === 5 && totalReviews >= 20) {
    badges.push({
      icon: TrendingUp,
      label: "Top Rated",
      color: "bg-purple-100 text-purple-800",
      tooltip: "Perfect 5-star rating",
    });
  }

  // Reliable Seller Badge
  if (averageRating >= 4 && totalReviews >= 5) {
    badges.push({
      icon: Shield,
      label: "Reliable",
      color: "bg-amber-100 text-amber-800",
      tooltip: `${averageRating.toFixed(1)} average rating`,
    });
  }

  if (badges.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex gap-1 flex-wrap">
        {badges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${badge.color} text-xs cursor-help`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {badge.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{badge.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {badges.map((badge, idx) => {
        const Icon = badge.icon;
        return (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-2 p-2 rounded ${badge.color} cursor-help`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{badge.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
