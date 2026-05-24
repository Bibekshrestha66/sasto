import { useState } from "react";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface ReviewsListProps {
  userId: number;
  limit?: number;
  showEmpty?: boolean;
}

export function ReviewsList({
  userId,
  limit = 10,
  showEmpty = true,
}: ReviewsListProps) {
  const [offset, setOffset] = useState(0);

  const { data: reviews, isLoading } = trpc.reviews.getReceivedReviews.useQuery({
    userId,
    limit: limit + offset,
  });

  const allReviews = reviews || [];
  const hasNextPage = allReviews.length === limit + offset;

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </Card>
    );
  }

  if (allReviews.length === 0 && showEmpty) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No reviews yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {allReviews.map((review: any) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setOffset(offset + limit);
          }}
        >
          Load More Reviews
        </Button>
      )}
    </div>
  );
}
