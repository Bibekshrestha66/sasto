import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/RatingStars";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface ReviewFormProps {
  toUserId: number;
  listingId?: number;
  transactionId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  toUserId,
  listingId,
  transactionId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReviewMutation = trpc.reviews.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || rating === 0) {
      alert("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitReviewMutation.mutateAsync({
        toUserId,
        listingId,
        transactionId,
        rating,
        title: title || undefined,
        comment: comment || undefined,
        isVerifiedPurchase: isVerified,
      });

      alert("Review submitted successfully!");
      setRating(0);
      setTitle("");
      setComment("");
      setIsVerified(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          Please log in to submit a review.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-l-4 border-l-green-500">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-2">Rating *</label>
          <RatingStars value={rating} onChange={setRating} size="lg" />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title (optional)
          </label>
          <Input
            id="title"
            placeholder="Summarize your experience"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            className="border-gray-300"
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/255 characters
          </p>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Your Review (optional)
          </label>
          <Textarea
            id="comment"
            placeholder="Share your detailed experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={5000}
            rows={4}
            className="border-gray-300"
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/5000 characters
          </p>
        </div>

        {/* Verified Purchase */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="verified"
            checked={isVerified}
            onChange={(e) => setIsVerified(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="verified" className="text-sm">
            This is a verified purchase
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
