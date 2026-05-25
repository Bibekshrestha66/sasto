import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReviewCard } from "@/components/ReviewCard";
import { UserRatingBadge } from "@/components/UserRatingBadge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MessageSquare, X } from "lucide-react";

interface SellerReviewsTabProps {
  sellerId: number;
}

export function SellerReviewsTab({ sellerId }: SellerReviewsTabProps) {
  const { user } = useAuth();
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const { data: reviews, isLoading, refetch } = trpc.reviews.getReceivedReviews.useQuery({
    userId: sellerId,
    limit: 50,
  });

  const addResponseMutation = trpc.reviews.addResponse.useMutation();

  const handleAddResponse = async (reviewId: number) => {
    if (!responseText.trim()) {
      alert("Please enter a response");
      return;
    }

    setIsSubmittingResponse(true);

    try {
      await addResponseMutation.mutateAsync({
        reviewId,
        response: responseText,
      });

      alert("Response added successfully!");
      setResponseText("");
      setSelectedReviewId(null);
      refetch();
    } catch (error) {
      console.error("Failed to add response:", error);
      alert("Failed to add response");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const selectedReview = reviews?.find((r) => r.id === selectedReviewId);

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Your Rating Summary</h3>
        <UserRatingBadge userId={sellerId} showDetails compact={false} />
      </div>

      {/* Reviews List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Customer Reviews</h3>

        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Loading reviews...</p>
          </Card>
        ) : !reviews || reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No reviews yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="relative">
                <ReviewCard
                  review={{
                    ...review,
                    title: review.title || undefined,
                    comment: review.comment || undefined,
                    sellerResponse: review.sellerResponse || undefined,
                    sellerResponseAt: review.sellerResponseAt || undefined,
                  }}
                  showSellerResponse={true}
                  onReplyClick={() => setSelectedReviewId(review.id)}
                />

                {/* Response Form */}
                {selectedReviewId === review.id && !review.sellerResponse && (
                  <Card className="mt-3 p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">Respond to this review</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReviewId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <Textarea
                      placeholder="Share your response to this review..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      className="border-blue-300 mb-2"
                    />

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {responseText.length}/2000 characters
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReviewId(null)}
                          disabled={isSubmittingResponse}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddResponse(review.id)}
                          disabled={isSubmittingResponse || !responseText.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isSubmittingResponse ? "Submitting..." : "Submit Response"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
