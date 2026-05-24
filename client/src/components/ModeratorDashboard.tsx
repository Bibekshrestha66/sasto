import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, XCircle, Flag, Eye, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function ModeratorDashboard() {
  const [selectedTab, setSelectedTab] = useState("listings");

  // Fetch flagged listings
  const { data: flaggedListings, isLoading: listingsLoading } = trpc.admin.getFlaggedListings.useQuery({});

  // Fetch flagged reviews
  const { data: flaggedReviews, isLoading: reviewsLoading } = trpc.reviews.getFlaggedReviews.useQuery({});

  // Fetch reported users
  // const { data: reportedUsers, isLoading: usersLoading } = trpc.admin.getReportedUsers.useQuery();
  const reportedUsers: any[] = [];
  const usersLoading = false;

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
        <h1 className="text-3xl font-bold mb-2">Moderation Dashboard</h1>
        <p className="text-gray-600">Review and moderate user-generated content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Flagged Listings</p>
              <p className="text-2xl font-bold">{flaggedListings?.listings?.length || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Flagged Reviews</p>
              <p className="text-2xl font-bold">{flaggedReviews?.length || 0}</p>
            </div>
            <Flag className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reported Users</p>
              <p className="text-2xl font-bold">{reportedUsers?.length || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Flagged Listings */}
        <TabsContent value="listings" className="space-y-4">
          {listingsLoading ? (
            <Card className="p-4">Loading...</Card>
          ) : flaggedListings?.listings?.length === 0 ? (
            <Card className="p-4 text-center text-gray-600">No flagged listings</Card>
          ) : (
            flaggedListings?.listings?.map((listing: any) => (
              <Card key={listing.listingId} className="p-4 border-2 border-dashed border-yellow-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{listing.reason}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{listing.category}</Badge>
                      <Badge variant="secondary">NPR {listing.price}</Badge>
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
                      onClick={() => rejectListing.mutate({ listingId: listing.listingId.toString(), reason: "Rejected by moderator" })}
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

        {/* Flagged Reviews */}
        <TabsContent value="reviews" className="space-y-4">
          {reviewsLoading ? (
            <Card className="p-4">Loading...</Card>
          ) : flaggedReviews?.length === 0 ? (
            <Card className="p-4 text-center text-gray-600">No flagged reviews</Card>
          ) : (
            flaggedReviews?.map((review: any) => (
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
                    <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
                    <p className="text-xs text-red-600">
                      <strong>Reason:</strong> {review.flagReason}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveReview.mutate({ flaggedReviewId: review.id, status: "dismissed" })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Keep
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => resolveReview.mutate({ flaggedReviewId: review.id, status: "removed" })}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Reported Users */}
        <TabsContent value="users" className="space-y-4">
          {usersLoading ? (
            <Card className="p-4">Loading...</Card>
          ) : reportedUsers?.length === 0 ? (
            <Card className="p-4 text-center text-gray-600">No reported users</Card>
          ) : (
            reportedUsers?.map((user: any) => (
              <Card key={user.id} className="p-4 border-2 border-dashed border-orange-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Reports:</strong> {user.reportCount}
                    </p>
                    <p className="text-sm text-orange-600 mt-2">{user.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                    <Button size="sm" variant="destructive">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Suspend
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
