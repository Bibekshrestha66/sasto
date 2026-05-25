import { useState } from "react";
import { ThumbsUp, ThumbsDown, Flag, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface ReviewCardProps {
  review: {
    id: number;
    fromUserId: number;
    toUserId: number;
    rating: number;
    title?: string;
    comment?: string;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    sellerResponse?: string;
    sellerResponseAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  fromUserName?: string;
  onReplyClick?: () => void;
  showSellerResponse?: boolean;
}

export function ReviewCard({
  review,
  fromUserName = "Anonymous",
  onReplyClick,
  showSellerResponse = true,
}: ReviewCardProps) {
  const { user } = useAuth();
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpfulCount);

  const markHelpfulMutation = trpc.reviews.markHelpful.useMutation();
  const flagReviewMutation = trpc.reviews.flag.useMutation();

  const handleMarkHelpful = async (helpful: boolean) => {
    if (!user) return;

    setIsHelpful(helpful);
    if (helpful) {
      setHelpfulCount(helpfulCount + 1);
      if (isHelpful === false) setUnhelpfulCount(unhelpfulCount - 1);
    } else {
      setUnhelpfulCount(unhelpfulCount + 1);
      if (isHelpful === true) setHelpfulCount(helpfulCount - 1);
    }

    try {
      await markHelpfulMutation.mutateAsync({
        reviewId: review.id,
        isHelpful: helpful,
      });
    } catch (error) {
      console.error("Failed to mark review:", error);
      // Revert on error
      if (helpful) {
        setHelpfulCount(helpfulCount);
        if (isHelpful === false) setUnhelpfulCount(unhelpfulCount);
      } else {
        setUnhelpfulCount(unhelpfulCount);
        if (isHelpful === true) setHelpfulCount(helpfulCount);
      }
    }
  };

  const handleFlag = async () => {
    if (!user) return;

    try {
      await flagReviewMutation.mutateAsync({
        reviewId: review.id,
        reason: "inappropriate",
        description: "User flagged this review",
      });
      alert("Review flagged for moderation");
    } catch (error) {
      console.error("Failed to flag review:", error);
      alert("Failed to flag review");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full ${
              i < rating ? "bg-yellow-400" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="p-4 border-l-4 border-l-green-500">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm">{fromUserName}</span>
              {review.isVerifiedPurchase && (
                <Badge variant="outline" className="text-xs">
                  ✓ Verified Purchase
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {user && user.id !== review.fromUserId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlag}
              className="text-red-500 hover:text-red-700"
            >
              <Flag className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Title */}
        {review.title && (
          <h4 className="font-medium text-sm">{review.title}</h4>
        )}

        {/* Comment */}
        {review.comment && (
          <p className="text-sm text-gray-700 leading-relaxed">
            {review.comment}
          </p>
        )}

        {/* Seller Response */}
        {showSellerResponse && review.sellerResponse && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">
              Seller's Response
            </p>
            <p className="text-sm text-blue-800">{review.sellerResponse}</p>
            {review.sellerResponseAt && (
              <p className="text-xs text-blue-600 mt-1">
                {new Date(review.sellerResponseAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Footer - Helpful/Unhelpful */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkHelpful(true)}
              className={`flex items-center gap-1 ${
                isHelpful === true ? "text-green-600" : "text-gray-500"
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs">{helpfulCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkHelpful(false)}
              className={`flex items-center gap-1 ${
                isHelpful === false ? "text-red-600" : "text-gray-500"
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="text-xs">{unhelpfulCount}</span>
            </Button>
          </div>

          {user && user.id === review.toUserId && !review.sellerResponse && onReplyClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReplyClick}
              className="flex items-center gap-1"
            >
              <MessageSquare className="w-4 h-4" />
              Reply
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
