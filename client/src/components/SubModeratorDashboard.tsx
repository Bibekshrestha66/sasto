import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, XCircle, Flag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function SubModeratorDashboard() {
  const [selectedTab, setSelectedTab] = useState("listings");

  // Fetch flagged listings to moderate
  const { data: assignedListings, isLoading: listingsLoading } = trpc.admin.getFlaggedListings.useQuery({});

  // Fetch flagged reviews to moderate
  const { data: assignedReviews, isLoading: reviewsLoading } = trpc.reviews.getFlaggedReviews.useQuery({});

  const approveListing = trpc.admin.approveListing.useMutation({
    onSuccess: () => {
      toast.success("Listing approved");
    },
  });

  const rejectListing = trpc.admin.rejectListing.useMutation({
    onSuccess: () => {
      toast.success("Listing rejected");
    },
  });

  const resolveReview = trpc.reviews.resolveFlagged.useMutation({
    onSuccess: () => {
      toast.success("Review resolved");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Sub-Moderator Dashboard</h1>
        <p className="text-gray-600">Review and moderate assigned content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned Listings</p>
              <p className="text-2xl font-bold">{assignedListings?.listings?.length || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned Reviews</p>
              <p className="text-2xl font-bold">{assignedReviews?.length || 0}</p>
            </div>
            <Flag className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Moderation Level</p>
              <p className="text-2xl font-bold">Limited</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        {/* Assigned Listings */}
        <TabsContent value="listings" className="space-y-4">
          {listingsLoading ? (
            <Card className="p-4">Loading...</Card>
          ) : assignedListings?.listings?.length === 0 ? (
            <Card className="p-4 text-center text-gray-600">No assigned listings</Card>
          ) : (
            assignedListings?.listings?.map((listing: any) => (
              <Card key={listing.listingId} className="p-4 border-2 border-dashed border-yellow-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{listing.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{listing.category}</Badge>
                      <Badge variant="secondary">NPR {listing.price}</Badge>
                      <Badge>{listing.status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approveListing.mutate({ listingId: listing.listingId.toString() })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectListing.mutate({ listingId: listing.listingId.toString(), reason: "Rejected by sub-moderator" })}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Assigned Reviews */}
        <TabsContent value="reviews" className="space-y-4">
          {reviewsLoading ? (
            <Card className="p-4">Loading...</Card>
          ) : assignedReviews?.length === 0 ? (
            <Card className="p-4 text-center text-gray-600">No assigned reviews</Card>
          ) : (
            assignedReviews?.map((review: any) => (
              <Card key={review.id} className="p-4 border-2 border-dashed border-red-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{review.reviewer?.name}</h3>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveReview.mutate({ flaggedReviewId: review.id, status: "dismissed" })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => resolveReview.mutate({ flaggedReviewId: review.id, status: "removed" })}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Restrictions Notice */}
      <Card className="p-4 bg-blue-50 border-2 border-blue-200">
        <h4 className="font-semibold mb-2 text-sm">Sub-Moderator Restrictions</h4>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>✓ Can only moderate assigned listings and reviews</li>
          <li>✓ Cannot access user management or system settings</li>
          <li>✓ Cannot view other moderators' actions</li>
          <li>✓ All actions are logged for audit purposes</li>
        </ul>
      </Card>
    </div>
  );
}
