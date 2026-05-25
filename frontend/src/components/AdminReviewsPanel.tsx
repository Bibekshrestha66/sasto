import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { exportFlaggedReviewsToCsv } from "@/lib/csvExport";
import { Download, AlertCircle, CheckCircle, Trash2 } from "lucide-react";

export function AdminReviewsPanel() {
  const [selectedFlagId, setSelectedFlagId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: flaggedReviews, isLoading, refetch } = trpc.reviews.getFlaggedReviews.useQuery({
    limit: 50,
  });

  const resolveFlaggedMutation = trpc.reviews.resolveFlagged.useMutation();

  const handleResolve = async (flaggedReviewId: number, action: "dismissed" | "removed") => {
    setIsProcessing(true);

    try {
      await resolveFlaggedMutation.mutateAsync({
        flaggedReviewId,
        status: action,
        adminNotes: adminNotes || undefined,
      });

      alert(`Review ${action === "removed" ? "removed" : "dismissed"} successfully!`);
      setSelectedFlagId(null);
      setAdminNotes("");
      refetch();
    } catch (error) {
      console.error("Failed to resolve flagged review:", error);
      alert("Failed to resolve flagged review");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedFlag = flaggedReviews?.find((f) => f.id === selectedFlagId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Review Moderation</h2>
          <p className="text-gray-600">
            Manage flagged reviews and ensure platform quality
          </p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => flaggedReviews && exportFlaggedReviewsToCsv(flaggedReviews)}
          disabled={!flaggedReviews || flaggedReviews.length === 0}
        >
          <Download className="w-4 h-4" />
          Export Flagged
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Loading flagged reviews...</p>
        </Card>
      ) : !flaggedReviews || flaggedReviews.length === 0 ? (
        <Card className="p-8 text-center bg-green-50 border-green-200">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <p className="text-green-900 font-medium">All reviews are approved!</p>
          <p className="text-green-700 text-sm">No flagged reviews to moderate</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {flaggedReviews.map((flagged) => (
            <Card
              key={flagged.id}
              className={`p-4 border-l-4 ${
                selectedFlagId === flagged.id
                  ? "border-l-blue-500 bg-blue-50"
                  : "border-l-red-500"
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold">Flagged Review #{flagged.reviewId}</span>
                      <Badge variant="destructive" className="text-xs">
                        {flagged.reason}
                      </Badge>
                    </div>
                    {flagged.description && (
                      <p className="text-sm text-gray-700 ml-7">
                        {flagged.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(flagged.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Flagged By */}
                <div className="text-sm text-gray-600 ml-7">
                  <p>Flagged by: User #{flagged.flaggedByUserId}</p>
                </div>

                {/* Action Buttons */}
                {selectedFlagId !== flagged.id ? (
                  <div className="flex gap-2 ml-7 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFlagId(flagged.id)}
                    >
                      Review Details
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 ml-7 pt-2 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Admin Notes
                      </label>
                      <Textarea
                        placeholder="Add notes about your decision..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="border-gray-300"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {adminNotes.length}/1000 characters
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFlagId(null);
                          setAdminNotes("");
                        }}
                        disabled={isProcessing}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(flagged.id, "dismissed")}
                        disabled={isProcessing}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        {isProcessing ? "Processing..." : "Dismiss Flag"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleResolve(flagged.id, "removed")}
                        disabled={isProcessing}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Review
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
