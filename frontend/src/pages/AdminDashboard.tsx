import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, FileText, AlertCircle, BarChart3, LogOut, Star, Megaphone,
  CheckCircle, XCircle, Sparkles, Crown, Rocket, Settings2,
  Search, Edit2, Plus, Package, User, X, Save, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { AdminReviewsPanel } from "@/components/AdminReviewsPanel";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "listings" | "manage-ads" | "disputes" | "reviews" | "logs" | "sponsored">("overview");
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

  // Manage Ads state
  const [adSearchQuery, setAdSearchQuery] = useState("");
  const [adStatusFilter, setAdStatusFilter] = useState("all");
  const [debouncedAdSearch, setDebouncedAdSearch] = useState("");
  const [editingAd, setEditingAd] = useState<any>(null);
  const [editAdForm, setEditAdForm] = useState<any>({});
  const [showCreateAdDialog, setShowCreateAdDialog] = useState(false);
  const [createAdForm, setCreateAdForm] = useState({
    userId: "",
    title: "",
    description: "",
    price: "",
    type: "marketplace",
    categoryId: "1",
    location: "",
    condition: "new",
    stock: "1",
    brand: "",
    model: "",
    status: "active",
  });

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [disputePage, setDisputePage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const PAGE_SIZE = 20;

  // Debounce ad search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAdSearch(adSearchQuery), 400);
    return () => clearTimeout(t);
  }, [adSearchQuery]);

  // Determine role early (no hooks called yet, just reading state)
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // ── ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS (Rules of Hooks) ──

  // Fetch admin data — only fire when user is confirmed admin
  const analyticsQuery = trpc.admin.getAnalytics.useQuery(undefined, { enabled: isAdmin });
  const usersQuery = trpc.admin.getAllUsers.useQuery({ page: userPage, limit: PAGE_SIZE }, { enabled: isAdmin });
  const listingsQuery = trpc.admin.getPendingListings.useQuery({ page: listingPage, limit: PAGE_SIZE }, { enabled: isAdmin });
  const disputesQuery = trpc.admin.getDisputes.useQuery({ page: disputePage, limit: PAGE_SIZE }, { enabled: isAdmin });
  const logsQuery = trpc.admin.getAdminLogs.useQuery({ page: logPage, limit: PAGE_SIZE }, { enabled: isAdmin });

  // Manage Ads queries
  const adSearchQuery2 = trpc.admin.searchListingsAdmin.useQuery(
    { query: debouncedAdSearch || " ", status: adStatusFilter === "all" ? undefined : adStatusFilter, limit: 50 },
    { enabled: isAdmin && activeTab === "manage-ads" }
  );

  // Sponsored Ads queries
  const promotionRequestsQuery = trpc.ads.adminGetPromotionRequests.useQuery(
    { status: promotionStatusFilter || undefined },
    { enabled: isAdmin && activeTab === "sponsored" }
  );
  const pricingQuery = trpc.ads.getSponsoredPricing.useQuery(undefined, { enabled: isAdmin && activeTab === "sponsored" });
  const featuredListingsQuery = trpc.ads.adminGetFeaturedListings.useQuery(undefined, { enabled: isAdmin && activeTab === "sponsored" });

  // Mutations
  const verifyUserMutation = trpc.admin.verifyUser.useMutation();
  useEffect(() => {
    if (verifyUserMutation.isSuccess) { toast.success("User verified successfully"); usersQuery.refetch(); setShowActionDialog(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyUserMutation.isSuccess]);
  useEffect(() => {
    if (verifyUserMutation.isError) { toast.error((verifyUserMutation.error as any)?.message || "Failed to verify user"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyUserMutation.isError]);

  const suspendUserMutation = trpc.admin.suspendUser.useMutation();
  useEffect(() => {
    if (suspendUserMutation.isSuccess) { toast.success("User suspended successfully"); usersQuery.refetch(); setShowActionDialog(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suspendUserMutation.isSuccess]);
  useEffect(() => {
    if (suspendUserMutation.isError) { toast.error((suspendUserMutation.error as any)?.message || "Failed to suspend user"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suspendUserMutation.isError]);

  const banUserMutation = trpc.admin.banUser.useMutation();
  useEffect(() => {
    if (banUserMutation.isSuccess) { toast.success("User banned successfully"); usersQuery.refetch(); setShowActionDialog(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banUserMutation.isSuccess]);
  useEffect(() => {
    if (banUserMutation.isError) { toast.error((banUserMutation.error as any)?.message || "Failed to ban user"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banUserMutation.isError]);

  const approveListingMutation = trpc.admin.approveListing.useMutation();
  useEffect(() => {
    if (approveListingMutation.isSuccess) { toast.success("Listing approved"); listingsQuery.refetch(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveListingMutation.isSuccess]);
  useEffect(() => {
    if (approveListingMutation.isError) { toast.error((approveListingMutation.error as any)?.message || "Failed to approve listing"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveListingMutation.isError]);

  const rejectListingMutation = trpc.admin.rejectListing.useMutation();
  useEffect(() => {
    if (rejectListingMutation.isSuccess) { toast.success("Listing rejected"); listingsQuery.refetch(); setShowActionDialog(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectListingMutation.isSuccess]);
  useEffect(() => {
    if (rejectListingMutation.isError) { toast.error((rejectListingMutation.error as any)?.message || "Failed to reject listing"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectListingMutation.isError]);

  const updateDisputeMutation = trpc.admin.updateDisputeStatus.useMutation();
  useEffect(() => {
    if (updateDisputeMutation.isSuccess) { toast.success("Dispute updated"); disputesQuery.refetch(); setShowActionDialog(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateDisputeMutation.isSuccess]);
  useEffect(() => {
    if (updateDisputeMutation.isError) { toast.error((updateDisputeMutation.error as any)?.message || "Failed to update dispute"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateDisputeMutation.isError]);

  // Admin ads mutations
  const editListingMutation = trpc.admin.adminEditListing.useMutation();
  useEffect(() => {
    if (editListingMutation.isSuccess) {
      toast.success("Listing updated successfully");
      adSearchQuery2.refetch();
      setEditingAd(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editListingMutation.isSuccess]);
  useEffect(() => {
    if (editListingMutation.isError) { toast.error((editListingMutation.error as any)?.message || "Failed to update listing"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editListingMutation.isError]);

  const createListingMutation = trpc.admin.adminCreateListingForUser.useMutation();
  useEffect(() => {
    if (createListingMutation.isSuccess) {
      toast.success("Listing created successfully");
      adSearchQuery2.refetch();
      setShowCreateAdDialog(false);
      setCreateAdForm({ userId: "", title: "", description: "", price: "", type: "marketplace", categoryId: "1", location: "", condition: "new", stock: "1", brand: "", model: "", status: "active" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createListingMutation.isSuccess]);
  useEffect(() => {
    if (createListingMutation.isError) { toast.error((createListingMutation.error as any)?.message || "Failed to create listing"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createListingMutation.isError]);

  // Sponsored ads mutations
  const reviewPromotionMutation = trpc.ads.adminReviewPromotion.useMutation();
  useEffect(() => {
    if (reviewPromotionMutation.isSuccess && reviewPromotionMutation.data) {
      toast.success((reviewPromotionMutation.data as any).message);
      promotionRequestsQuery.refetch();
      featuredListingsQuery.refetch();
      setRejectModalOpen(false);
      setRejectNotes("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPromotionMutation.isSuccess]);
  useEffect(() => {
    if (reviewPromotionMutation.isError) toast.error((reviewPromotionMutation.error as any)?.message || "Action failed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPromotionMutation.isError]);

  const setPricingMutation = trpc.ads.adminSetSponsoredPricing.useMutation();
  useEffect(() => {
    if (setPricingMutation.isSuccess) { toast.success("Pricing updated!"); pricingQuery.refetch(); setEditingPricing({}); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPricingMutation.isSuccess]);
  useEffect(() => {
    if (setPricingMutation.isError) toast.error((setPricingMutation.error as any)?.message || "Failed to update pricing");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPricingMutation.isError]);

  // ── EARLY RETURNS AFTER ALL HOOKS ──

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Access check
  if (!isAdmin) {
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

  const handleEditAdSave = () => {
    if (!editingAd) return;
    editListingMutation.mutate({
      listingId: editingAd.id,
      title: editAdForm.title,
      description: editAdForm.description,
      price: editAdForm.price ? parseFloat(editAdForm.price) : undefined,
      status: editAdForm.status,
      stock: editAdForm.stock ? parseInt(editAdForm.stock) : undefined,
      condition: editAdForm.condition,
      location: editAdForm.location,
      brand: editAdForm.brand,
      model: editAdForm.model,
    });
  };

  const handleCreateAd = () => {
    if (!createAdForm.userId || !createAdForm.title) {
      toast.error("User ID and title are required");
      return;
    }
    createListingMutation.mutate({
      userId: parseInt(createAdForm.userId),
      categoryId: parseInt(createAdForm.categoryId),
      title: createAdForm.title,
      description: createAdForm.description || undefined,
      type: createAdForm.type,
      price: createAdForm.price ? parseFloat(createAdForm.price) : undefined,
      location: createAdForm.location || undefined,
      condition: createAdForm.condition || undefined,
      stock: createAdForm.stock ? parseInt(createAdForm.stock) : 1,
      brand: createAdForm.brand || undefined,
      model: createAdForm.model || undefined,
      status: createAdForm.status,
    });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      rejected: "bg-red-100 text-red-700",
      inactive: "bg-gray-100 text-gray-600",
      sold: "bg-blue-100 text-blue-700",
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${colors[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  // Helper to render pagination controls
  const PaginationControls = ({ page, setPage, hasMore }: { page: number; setPage: (p: number) => void; hasMore: boolean }) => (
    <div className="flex justify-between items-center mt-4">
      <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</Button>
      <span className="text-sm text-gray-500">Page {page}</span>
      <Button variant="outline" onClick={() => setPage(page + 1)} disabled={!hasMore}>Next</Button>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "listings", label: "Pending Ads", icon: FileText },
    { id: "manage-ads", label: "Manage Ads", icon: Package },
    { id: "disputes", label: "Disputes", icon: AlertCircle },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "sponsored", label: "Sponsored", icon: Megaphone },
    { id: "logs", label: "Logs", icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header with horizontal scrollable tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Admin Dashboard</h1>
          <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium text-xs whitespace-nowrap transition flex-shrink-0 ${
                    activeTab === tab.id
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsQuery.data && (
              <>
                <Card className="p-5 border-2 border-green-200">
                  <p className="text-gray-500 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{analyticsQuery.data.totalUsers}</p>
                  <p className="text-xs text-gray-400 mt-1">{analyticsQuery.data.verifiedUsers} verified</p>
                </Card>
                <Card className="p-5 border-2 border-blue-200">
                  <p className="text-gray-500 text-sm">Total Listings</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{analyticsQuery.data.totalListings}</p>
                  <p className="text-xs text-gray-400 mt-1">{analyticsQuery.data.activeListings} active</p>
                </Card>
                <Card className="p-5 border-2 border-orange-200">
                  <p className="text-gray-500 text-sm">Pending Listings</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{analyticsQuery.data.pendingListings}</p>
                </Card>
                <Card className="p-5 border-2 border-red-200">
                  <p className="text-gray-500 text-sm">Rejected Listings</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{analyticsQuery.data.rejectedListings}</p>
                </Card>
              </>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div className="space-y-3">
            {usersQuery.isLoading && <div className="text-center py-8">Loading users...</div>}
            {usersQuery.data?.users.map((u: any) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                      <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant={u.status === "active" ? "default" : "destructive"} className="text-[10px]">
                        {u.status}
                      </Badge>
                      <Badge variant={u.verificationStatus === "verified" ? "default" : "secondary"} className="text-[10px]">
                        {u.verificationStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {u.verificationStatus !== "verified" && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-8"
                        onClick={() => { setSelectedUser(u); setActionType("verify"); setShowActionDialog(true); }}
                        disabled={verifyUserMutation.isPending}
                      >Verify</Button>
                    )}
                    {u.status === "active" && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs h-8"
                          onClick={() => { setSelectedUser(u); setActionType("suspend"); setShowActionDialog(true); }}
                          disabled={suspendUserMutation.isPending}
                        >Suspend</Button>
                        <Button size="sm" variant="destructive" className="text-xs h-8"
                          onClick={() => { setSelectedUser(u); setActionType("ban"); setShowActionDialog(true); }}
                          disabled={banUserMutation.isPending}
                        >Ban</Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            <PaginationControls page={userPage} setPage={setUserPage} hasMore={usersQuery.data ? usersQuery.data.users.length === PAGE_SIZE : false} />
          </div>
        )}

        {/* ── PENDING LISTINGS TAB ── */}
        {activeTab === "listings" && (
          <div className="space-y-3">
            {listingsQuery.isLoading && <div className="text-center py-8">Loading listings...</div>}
            {listingsQuery.data?.listings.map((listing: any) => (
              <Card key={listing.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex gap-3 flex-1 min-w-0">
                    {listing.images?.[0] && (
                      <img src={listing.images[0]} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" alt="" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">#{listing.id} — {listing.title}</p>
                      <p className="text-sm text-green-700 font-bold">NPR {(listing.price || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{listing.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-8"
                      onClick={() => approveListingMutation.mutateAsync({ listingId: listing.id })}
                      disabled={approveListingMutation.isPending}
                    >Approve</Button>
                    <Button size="sm" variant="destructive" className="text-xs h-8"
                      onClick={() => { setSelectedListing(listing); setActionType("reject"); setShowActionDialog(true); }}
                      disabled={rejectListingMutation.isPending}
                    >Reject</Button>
                  </div>
                </div>
              </Card>
            ))}
            <PaginationControls page={listingPage} setPage={setListingPage} hasMore={listingsQuery.data ? listingsQuery.data.listings.length === PAGE_SIZE : false} />
          </div>
        )}

        {/* ── MANAGE ADS TAB ── */}
        {activeTab === "manage-ads" && (
          <div className="space-y-5">
            {/* Search Bar & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9 h-11 rounded-xl border-gray-200"
                  placeholder="Search by title, ad ID, or user email/name..."
                  value={adSearchQuery}
                  onChange={e => setAdSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 w-full sm:w-auto"
                value={adStatusFilter}
                onChange={e => setAdStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
                <option value="sold">Sold</option>
              </select>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white h-11 px-5 rounded-xl font-bold flex-shrink-0"
                onClick={() => setShowCreateAdDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Ad for User
              </Button>
            </div>

            {/* Results count */}
            {!adSearchQuery2.isLoading && (
              <p className="text-sm text-gray-500">
                {debouncedAdSearch ? (
                  <><span className="font-bold text-gray-800">{adSearchQuery2.data?.length ?? 0}</span> result(s) for "{debouncedAdSearch}"</>
                ) : (
                  <>Showing latest <span className="font-bold text-gray-800">{adSearchQuery2.data?.length ?? 0}</span> listings — search to filter</>
                )}
              </p>
            )}

            {/* Loading */}
            {adSearchQuery2.isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              </div>
            )}

            {/* Listings Grid */}
            <div className="space-y-3">
              {(adSearchQuery2.data ?? []).map((listing: any) => (
                <Card key={listing.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4 items-start">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-gray-400 font-mono">ID:{listing.id}</span>
                            {statusBadge(listing.status)}
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{listing.type}</span>
                          </div>
                          <p className="font-bold text-gray-900 mt-0.5 truncate max-w-xs">{listing.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" /> {listing.sellerName} · {listing.sellerEmail}
                          </p>
                        </div>
                        <p className="font-black text-green-700 text-sm flex-shrink-0">
                          NPR {(listing.price || 0).toLocaleString()}
                        </p>
                      </div>

                      {/* Meta row */}
                      <div className="flex gap-3 mt-2 flex-wrap text-[11px] text-gray-400">
                        {listing.condition && <span>Condition: <b className="text-gray-600">{listing.condition}</b></span>}
                        {listing.location && <span>📍 {listing.location}</span>}
                        {listing.stock != null && <span>Stock: <b className="text-gray-600">{listing.stock}</b></span>}
                        <span>Created: <b className="text-gray-600">{new Date(listing.createdAt).toLocaleDateString()}</b></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0 h-8 text-xs border-gray-200 hover:border-green-400 hover:text-green-700"
                      onClick={() => {
                        setEditingAd(listing);
                        setEditAdForm({
                          title: listing.title || "",
                          description: listing.description || "",
                          price: listing.price?.toString() || "",
                          status: listing.status || "active",
                          stock: listing.stock?.toString() || "1",
                          condition: listing.condition || "",
                          location: listing.location || "",
                          brand: listing.brand || "",
                          model: listing.model || "",
                        });
                      }}
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                </Card>
              ))}

              {!adSearchQuery2.isLoading && (adSearchQuery2.data?.length ?? 0) === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                  <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-bold">No listings found</p>
                  <p className="text-gray-300 text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DISPUTES TAB ── */}
        {activeTab === "disputes" && (
          <div className="space-y-3">
            {disputesQuery.isLoading && <div className="text-center py-8">Loading disputes...</div>}
            {disputesQuery.data?.disputes.map((dispute: any) => (
              <Card key={dispute.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{dispute.title}</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dispute.description}</p>
                    <Badge className="mt-2 text-[10px]">{dispute.status}</Badge>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-8"
                    onClick={() => { setSelectedDispute(dispute); setActionType("resolve"); setShowActionDialog(true); }}
                    disabled={updateDisputeMutation.isPending}
                  >Resolve</Button>
                </div>
              </Card>
            ))}
            <PaginationControls page={disputePage} setPage={setDisputePage} hasMore={disputesQuery.data ? disputesQuery.data.disputes.length === PAGE_SIZE : false} />
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <AdminReviewsPanel />
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {activeTab === "logs" && (
          <div className="space-y-2">
            {logsQuery.isLoading && <div className="text-center py-8">Loading logs...</div>}
            {logsQuery.data?.logs.map((log: any) => (
              <Card key={log.id} className="p-3">
                <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-500">{log.details}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </Card>
            ))}
            <PaginationControls page={logPage} setPage={setLogPage} hasMore={logsQuery.data ? logsQuery.data.logs.length === PAGE_SIZE : false} />
          </div>
        )}

        {/* ── SPONSORED ADS TAB ── */}
        {activeTab === "sponsored" && (
          <div className="space-y-8">
            {/* Pricing Tiers */}
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
                          onClick={() => { if (!editing) return; setPricingMutation.mutate({ tier: tier.tier, ...editing }); }}
                        >
                          {setPricingMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Promotion Requests */}
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
                    >{s}</button>
                  ))}
                </div>
              </div>
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
                        </div>
                        {req.status === "pending" && (
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs"
                              disabled={reviewPromotionMutation.isPending}
                              onClick={() => reviewPromotionMutation.mutate({ requestId: req.id, action: "approve" })}
                            ><CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve</Button>
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs"
                              onClick={() => { setRejectRequestId(req.id); setRejectModalOpen(true); }}
                            ><XCircle className="w-3.5 h-3.5 mr-1" /> Reject</Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
                {!promotionRequestsQuery.isLoading && (promotionRequestsQuery.data ?? []).length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                    <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 font-medium">No promotion requests found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Featured Listings */}
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
                {(featuredListingsQuery.data ?? []).map((item: any) => (
                  <Card key={item.id} className="p-4 border border-yellow-200 bg-yellow-50/30 rounded-2xl">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                        {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gray-200 rounded-xl" />}
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
                {!featuredListingsQuery.isLoading && (featuredListingsQuery.data ?? []).length === 0 && (
                  <p className="text-gray-400 text-sm col-span-full text-center py-8">No active featured listings</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT AD DIALOG ── */}
      <Dialog open={!!editingAd} onOpenChange={open => !open && setEditingAd(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-gray-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-green-600" />
              Edit Listing #{editingAd?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pb-2">
            <div>
              <Label>Title</Label>
              <Input value={editAdForm.title} onChange={e => setEditAdForm((f: any) => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={editAdForm.description} onChange={e => setEditAdForm((f: any) => ({ ...f, description: e.target.value }))} className="mt-1 resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (NPR)</Label>
                <Input type="number" value={editAdForm.price} onChange={e => setEditAdForm((f: any) => ({ ...f, price: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={editAdForm.stock} onChange={e => setEditAdForm((f: any) => ({ ...f, stock: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <select
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={editAdForm.status}
                  onChange={e => setEditAdForm((f: any) => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                  <option value="rejected">Rejected</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div>
                <Label>Condition</Label>
                <select
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={editAdForm.condition}
                  onChange={e => setEditAdForm((f: any) => ({ ...f, condition: e.target.value }))}
                >
                  <option value="">Select</option>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={editAdForm.location} onChange={e => setEditAdForm((f: any) => ({ ...f, location: e.target.value }))} className="mt-1" placeholder="e.g. Kathmandu, Nepal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Brand</Label>
                <Input value={editAdForm.brand} onChange={e => setEditAdForm((f: any) => ({ ...f, brand: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={editAdForm.model} onChange={e => setEditAdForm((f: any) => ({ ...f, model: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingAd(null)}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                onClick={handleEditAdSave}
                disabled={editListingMutation.isPending}
              >
                {editListingMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CREATE AD FOR USER DIALOG ── */}
      <Dialog open={showCreateAdDialog} onOpenChange={setShowCreateAdDialog}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Create Ad for User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pb-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 font-medium">You are creating a listing on behalf of a user. Make sure to use their correct User ID.</p>
            </div>
            <div>
              <Label>User ID <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                placeholder="Enter the numeric User ID"
                value={createAdForm.userId}
                onChange={e => setCreateAdForm(f => ({ ...f, userId: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ad title"
                value={createAdForm.title}
                onChange={e => setCreateAdForm(f => ({ ...f, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the item..."
                value={createAdForm.description}
                onChange={e => setCreateAdForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (NPR)</Label>
                <Input type="number" value={createAdForm.price} onChange={e => setCreateAdForm(f => ({ ...f, price: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={createAdForm.stock} onChange={e => setCreateAdForm(f => ({ ...f, stock: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={createAdForm.type} onChange={e => setCreateAdForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="marketplace">Marketplace</option>
                  <option value="auction">Auction</option>
                  <option value="rental">Rental</option>
                </select>
              </div>
              <div>
                <Label>Condition</Label>
                <select className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={createAdForm.condition} onChange={e => setCreateAdForm(f => ({ ...f, condition: e.target.value }))}>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="e.g. Kathmandu, Nepal" value={createAdForm.location} onChange={e => setCreateAdForm(f => ({ ...f, location: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Brand</Label>
                <Input value={createAdForm.brand} onChange={e => setCreateAdForm(f => ({ ...f, brand: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={createAdForm.model} onChange={e => setCreateAdForm(f => ({ ...f, model: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Initial Status</Label>
              <select className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={createAdForm.status} onChange={e => setCreateAdForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active (Live immediately)</option>
                <option value="pending">Pending (Needs review)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateAdDialog(false)}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                onClick={handleCreateAd}
                disabled={createListingMutation.isPending}
              >
                {createListingMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Create Listing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Promotion Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900">Reject Promotion Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Reason for rejection..." rows={3} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={reviewPromotionMutation.isPending}
                onClick={() => { if (!rejectRequestId) return; reviewPromotionMutation.mutate({ requestId: rejectRequestId, action: "reject", adminNotes: rejectNotes }); }}>
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
                <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Enter reason for this action" rows={4} />
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAction}
              disabled={
                (actionType !== "verify" && !actionReason.trim()) ||
                verifyUserMutation.isPending || suspendUserMutation.isPending ||
                banUserMutation.isPending || rejectListingMutation.isPending || updateDisputeMutation.isPending
              }
            >Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}