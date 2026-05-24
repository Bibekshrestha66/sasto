import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Users, FileText, AlertCircle, BarChart3, LogOut, Star, Megaphone, CheckCircle, XCircle, Sparkles, Crown, Rocket, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { AdminReviewsPanel } from "@/components/AdminReviewsPanel";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "listings" | "disputes" | "reviews" | "logs" | "sponsored">("overview");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [actionReason, setActionReason] = useState("");
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"suspend" | "ban" | "verify" | "reject" | "resolve">("suspend");
  // Sponsored ads state
  const [promotionStatusFilter, setPromotionStatusFilter] = useState("");
  const [editingPricing, setEditingPricing] = useState<Record<string, { priceNPR: number; durationDays: number; maxSlots: number }>>({});
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [disputePage, setDisputePage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const PAGE_SIZE = 20;

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access the admin dashboard.</p>
        </Card>
      </div>
    );
  }

  // Fetch admin data
  const analyticsQuery = trpc.admin.getAnalytics.useQuery();
  const usersQuery = trpc.admin.getAllUsers.useQuery({ page: userPage, limit: PAGE_SIZE });
  const listingsQuery = trpc.admin.getPendingListings.useQuery({ page: listingPage, limit: PAGE_SIZE });
  const disputesQuery = trpc.admin.getDisputes.useQuery({ page: disputePage, limit: PAGE_SIZE });
  const logsQuery = trpc.admin.getAdminLogs.useQuery({ page: logPage, limit: PAGE_SIZE });
  // Sponsored Ads queries
  const promotionRequestsQuery = trpc.ads.adminGetPromotionRequests.useQuery(
    { status: promotionStatusFilter || undefined },
    { enabled: activeTab === "sponsored" }
  );
  const pricingQuery = trpc.ads.getSponsoredPricing.useQuery(undefined, { enabled: activeTab === "sponsored" });
  const featuredListingsQuery = trpc.ads.adminGetFeaturedListings.useQuery(undefined, { enabled: activeTab === "sponsored" });

  // Mutations
  const verifyUserMutation = trpc.admin.verifyUser.useMutation({
    onSuccess: () => {
      toast.success("User verified successfully");
      usersQuery.refetch();
      setShowActionDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to verify user");
      console.error("Verify error:", error);
    },
  });

  const suspendUserMutation = trpc.admin.suspendUser.useMutation({
    onSuccess: () => {
      toast.success("User suspended successfully");
      usersQuery.refetch();
      setShowActionDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to suspend user");
      console.error("Suspend error:", error);
    },
  });

  const banUserMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      toast.success("User banned successfully");
      usersQuery.refetch();
      setShowActionDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to ban user");
      console.error("Ban error:", error);
    },
  });

  const approveListingMutation = trpc.admin.approveListing.useMutation({
    onSuccess: () => {
      toast.success("Listing approved");
      listingsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve listing");
      console.error("Approve error:", error);
    },
  });

  const rejectListingMutation = trpc.admin.rejectListing.useMutation({
    onSuccess: () => {
      toast.success("Listing rejected");
      listingsQuery.refetch();
      setShowActionDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject listing");
      console.error("Reject error:", error);
    },
  });

  const updateDisputeMutation = trpc.admin.updateDisputeStatus.useMutation({
    onSuccess: () => {
      toast.success("Dispute updated");
      disputesQuery.refetch();
      setShowActionDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update dispute");
      console.error("Dispute update error:", error);
    },
  });

  // Sponsored ads mutations
  const reviewPromotionMutation = trpc.ads.adminReviewPromotion.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      promotionRequestsQuery.refetch();
      featuredListingsQuery.refetch();
      setRejectModalOpen(false);
      setRejectNotes("");
    },
    onError: (err: any) => toast.error(err.message || "Action failed"),
  });

  const setPricingMutation = trpc.ads.adminSetSponsoredPricing.useMutation({
    onSuccess: () => {
      toast.success("Pricing updated!");
      pricingQuery.refetch();
      setEditingPricing({});
    },
    onError: (err: any) => toast.error(err.message || "Failed to update pricing"),
  });

  const handleAction = async () => {
    if (!actionReason.trim() && actionType !== "verify") {
      toast.error("Please provide a reason");
      return;
    }

    try {
      if (actionType === "verify" && selectedUser) {
        await verifyUserMutation.mutateAsync({ userId: selectedUser.id });
      } else if (actionType === "suspend" && selectedUser) {
        await suspendUserMutation.mutateAsync({ userId: selectedUser.id, reason: actionReason });
      } else if (actionType === "ban" && selectedUser) {
        await banUserMutation.mutateAsync({ userId: selectedUser.id, reason: actionReason });
      } else if (actionType === "reject" && selectedListing) {
        await rejectListingMutation.mutateAsync({ listingId: selectedListing.id, reason: actionReason });
      } else if (actionType === "resolve" && selectedDispute) {
        await updateDisputeMutation.mutateAsync({
          disputeId: selectedDispute.id,
          status: "resolved",
          resolution: actionReason,
        });
      }
    } catch (error) {
      // Error already handled by mutation callbacks
    }
  };

  // Helper to render pagination controls
  const PaginationControls = ({ page, setPage, hasMore }: { page: number; setPage: (p: number) => void; hasMore: boolean }) => (
    <div className="flex justify-between items-center mt-4">
      <Button
        variant="outline"
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
      >
        Previous
      </Button>
      <span className="text-sm text-gray-500">Page {page}</span>
      <Button
        variant="outline"
        onClick={() => setPage(page + 1)}
        disabled={!hasMore}
      >
        Next
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, listings, disputes, and platform analytics</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 flex-wrap">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "listings", label: "Listings", icon: FileText },
            { id: "disputes", label: "Disputes", icon: AlertCircle },
            { id: "reviews", label: "Reviews", icon: Star },
            { id: "sponsored", label: "Sponsored Ads", icon: Megaphone },
            { id: "logs", label: "Logs", icon: LogOut },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-green-600 text-green-600 font-medium"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsQuery.data && (
              <>
                <Card className="p-6 border-2 border-green-200">
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{analyticsQuery.data.totalUsers}</p>
                  <p className="text-xs text-gray-500 mt-2">{analyticsQuery.data.verifiedUsers} verified</p>
                </Card>
                <Card className="p-6 border-2 border-blue-200">
                  <p className="text-gray-600 text-sm">Total Listings</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{analyticsQuery.data.totalListings}</p>
                  <p className="text-xs text-gray-500 mt-2">{analyticsQuery.data.activeListings} active</p>
                </Card>
                <Card className="p-6 border-2 border-orange-200">
                  <p className="text-gray-600 text-sm">Pending Listings</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{analyticsQuery.data.pendingListings}</p>
                </Card>
                <Card className="p-6 border-2 border-red-200">
                  <p className="text-gray-600 text-sm">Rejected Listings</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{analyticsQuery.data.rejectedListings}</p>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {usersQuery.isLoading && <div className="text-center py-8">Loading users...</div>}
            {usersQuery.data?.users.map((user: any) => (
              <Card key={user.id} className="p-4 border-2 border-green-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant={user.status === "active" ? "default" : "destructive"}>
                        {user.status}
                      </Badge>
                      <Badge variant={user.verificationStatus === "verified" ? "default" : "secondary"}>
                        {user.verificationStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.verificationStatus !== "verified" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType("verify");
                          setShowActionDialog(true);
                        }}
                        disabled={verifyUserMutation.isPending}
                      >
                        Verify
                      </Button>
                    )}
                    {user.status === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("suspend");
                            setShowActionDialog(true);
                          }}
                          disabled={suspendUserMutation.isPending}
                        >
                          Suspend
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("ban");
                            setShowActionDialog(true);
                          }}
                          disabled={banUserMutation.isPending}
                        >
                          Ban
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            <PaginationControls
              page={userPage}
              setPage={setUserPage}
              hasMore={usersQuery.data ? usersQuery.data.users.length === PAGE_SIZE : false}
            />
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            {listingsQuery.isLoading && <div className="text-center py-8">Loading listings...</div>}
            {listingsQuery.data?.listings.map((listing: any) => (
              <Card key={listing.id} className="p-4 border-2 border-green-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                    <p className="text-sm text-gray-600">NPR {listing.price}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{listing.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => approveListingMutation.mutateAsync({ listingId: listing.id })}
                      disabled={approveListingMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedListing(listing);
                        setActionType("reject");
                        setShowActionDialog(true);
                      }}
                      disabled={rejectListingMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <PaginationControls
              page={listingPage}
              setPage={setListingPage}
              hasMore={listingsQuery.data ? listingsQuery.data.listings.length === PAGE_SIZE : false}
            />
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === "disputes" && (
          <div className="space-y-4">
            {disputesQuery.isLoading && <div className="text-center py-8">Loading disputes...</div>}
            {disputesQuery.data?.disputes.map((dispute: any) => (
              <Card key={dispute.id} className="p-4 border-2 border-green-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{dispute.title}</h3>
                    <p className="text-sm text-gray-600">{dispute.description}</p>
                    <Badge className="mt-2">{dispute.status}</Badge>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setActionType("resolve");
                      setShowActionDialog(true);
                    }}
                    disabled={updateDisputeMutation.isPending}
                  >
                    Resolve
                  </Button>
                </div>
              </Card>
            ))}
            <PaginationControls
              page={disputePage}
              setPage={setDisputePage}
              hasMore={disputesQuery.data ? disputesQuery.data.disputes.length === PAGE_SIZE : false}
            />
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <AdminReviewsPanel />
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="space-y-2">
            {logsQuery.isLoading && <div className="text-center py-8">Loading logs...</div>}
            {logsQuery.data?.logs.map((log: any) => (
              <Card key={log.id} className="p-3 border border-gray-200">
                <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-600">{log.details}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </Card>
            ))}
            <PaginationControls
              page={logPage}
              setPage={setLogPage}
              hasMore={logsQuery.data ? logsQuery.data.logs.length === PAGE_SIZE : false}
            />
          </div>
        )}

        {/* ──── SPONSORED ADS TAB ──── */}
        {activeTab === "sponsored" && (
          <div className="space-y-8">

            {/* Section 1: Pricing Tiers */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pricing Tiers</h2>
                  <p className="text-sm text-gray-500">Set the NPR price, duration, and slot count for each tier</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingQuery.isLoading && [1,2,3].map(i => (
                  <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
                {(pricingQuery.data ?? []).map((tier: any) => {
                  const icons: Record<string, any> = { basic: Sparkles, standard: Rocket, premium: Crown };
                  const gradients: Record<string, string> = {
                    basic: "from-blue-500 to-blue-600",
                    standard: "from-purple-500 to-purple-600",
                    premium: "from-amber-400 to-orange-500",
                  };
                  const TierIcon = icons[tier.tier] || Sparkles;
                  const editing = editingPricing[tier.tier];
                  return (
                    <Card key={tier.tier} className="border-none shadow-lg rounded-2xl overflow-hidden">
                      <div className={`bg-gradient-to-br ${gradients[tier.tier]} p-5 text-white`}>
                        <div className="flex items-center gap-2 mb-1">
                          <TierIcon className="w-5 h-5" />
                          <span className="font-black text-lg capitalize">{tier.tier}</span>
                        </div>
                        <p className="text-white/80 text-xs">{tier.description}</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (NPR)</label>
                          <Input
                            type="number"
                            value={editing?.priceNPR ?? tier.priceNPR}
                            onChange={e => setEditingPricing(prev => ({ ...prev, [tier.tier]: { priceNPR: parseInt(e.target.value)||0, durationDays: editing?.durationDays ?? tier.durationDays, maxSlots: editing?.maxSlots ?? tier.maxSlots } }))}
                            className="mt-1 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration (Days)</label>
                          <Input
                            type="number"
                            value={editing?.durationDays ?? tier.durationDays}
                            onChange={e => setEditingPricing(prev => ({ ...prev, [tier.tier]: { priceNPR: editing?.priceNPR ?? tier.priceNPR, durationDays: parseInt(e.target.value)||1, maxSlots: editing?.maxSlots ?? tier.maxSlots } }))}
                            className="mt-1 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Max Slots</label>
                          <Input
                            type="number"
                            value={editing?.maxSlots ?? tier.maxSlots}
                            onChange={e => setEditingPricing(prev => ({ ...prev, [tier.tier]: { priceNPR: editing?.priceNPR ?? tier.priceNPR, durationDays: editing?.durationDays ?? tier.durationDays, maxSlots: parseInt(e.target.value)||1 } }))}
                            className="mt-1 font-bold"
                          />
                        </div>
                        <Button
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold"
                          disabled={!editing || setPricingMutation.isPending}
                          onClick={() => {
                            if (!editing) return;
                            setPricingMutation.mutate({ tier: tier.tier, ...editing });
                          }}
                        >
                          {setPricingMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Promotion Requests */}
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Promotion Requests</h2>
                    <p className="text-sm text-gray-500">Approve or reject seller promotion requests</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["all", "pending", "approved", "rejected"].map(s => (
                    <button
                      key={s}
                      onClick={() => setPromotionStatusFilter(s === "all" ? "" : s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                        (promotionStatusFilter === "" && s === "all") || promotionStatusFilter === s
                          ? "bg-gray-900 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {promotionRequestsQuery.isLoading && (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              )}

              {!promotionRequestsQuery.isLoading && (promotionRequestsQuery.data ?? []).length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No promotion requests found</p>
                </div>
              )}

              <div className="space-y-3">
                {(promotionRequestsQuery.data ?? []).map((req: any) => {
                  const tierColors: Record<string, string> = {
                    basic: "bg-blue-50 text-blue-700 border-blue-200",
                    standard: "bg-purple-50 text-purple-700 border-purple-200",
                    premium: "bg-amber-50 text-amber-700 border-amber-200",
                  };
                  const statusColors: Record<string, string> = {
                    pending: "bg-yellow-100 text-yellow-700",
                    approved: "bg-green-100 text-green-700",
                    rejected: "bg-red-100 text-red-700",
                  };
                  return (
                    <Card key={req.id} className="p-4 border border-gray-200 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Listing image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                          {req.listingImages?.[0] ? (
                            <img src={req.listingImages[0]} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-bold text-gray-900 truncate">{req.listingTitle}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border capitalize ${tierColors[req.tier] || ""}`}>{req.tier}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${statusColors[req.status] || ""}`}>{req.status}</span>
                          </div>
                          <p className="text-sm text-gray-500">By <span className="font-semibold">{req.sellerName}</span> · NPR {(req.priceNPR ?? 0).toLocaleString()} · {req.durationDays} days</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                          {req.adminNotes && <p className="text-xs text-gray-500 mt-1 italic">"{req.adminNotes}"</p>}
                        </div>
                        {req.status === "pending" && (
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                              disabled={reviewPromotionMutation.isPending}
                              onClick={() => reviewPromotionMutation.mutate({ requestId: req.id, action: "approve" })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold"
                              onClick={() => { setRejectRequestId(req.id); setRejectModalOpen(true); }}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Active Featured Listings */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Active Featured Listings</h2>
                  <p className="text-sm text-gray-500">Currently live in the Featured Carousel</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredListingsQuery.isLoading && [1,2,3].map(i => (
                  <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
                {(featuredListingsQuery.data ?? []).length === 0 && !featuredListingsQuery.isLoading && (
                  <p className="text-gray-400 text-sm col-span-full text-center py-8">No active featured listings</p>
                )}
                {(featuredListingsQuery.data ?? []).map((item: any) => (
                  <Card key={item.id} className="p-4 border border-yellow-200 bg-yellow-50/30 rounded-2xl">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} className="w-full h-full object-cover" alt="" />
                        ) : <div className="w-full h-full bg-gray-200 rounded-xl" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500">NPR {(item.price ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-amber-600 font-semibold mt-1">
                          Expires: {item.featuredUntil ? new Date(item.featuredUntil).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900">Reject Promotion Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <Textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={reviewPromotionMutation.isPending}
                onClick={() => {
                  if (!rejectRequestId) return;
                  reviewPromotionMutation.mutate({ requestId: rejectRequestId, action: "reject", adminNotes: rejectNotes });
                }}
              >
                {reviewPromotionMutation.isPending ? "Rejecting..." : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "verify" && "Verify User"}
              {actionType === "suspend" && "Suspend User"}
              {actionType === "ban" && "Ban User"}
              {actionType === "reject" && "Reject Listing"}
              {actionType === "resolve" && "Resolve Dispute"}
            </DialogTitle>
          </DialogHeader>
          {actionType !== "verify" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action"
                  rows={4}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAction}
              disabled={
                (actionType !== "verify" && !actionReason.trim()) ||
                verifyUserMutation.isPending ||
                suspendUserMutation.isPending ||
                banUserMutation.isPending ||
                rejectListingMutation.isPending ||
                updateDisputeMutation.isPending
              }
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}