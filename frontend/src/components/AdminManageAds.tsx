import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Edit2, Loader2, User, Package, X, Save } from "lucide-react";
import { toast } from "sonner";

export function AdminManageAds() {
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedAdSearch(adSearchQuery), 400);
    return () => clearTimeout(t);
  }, [adSearchQuery]);

  const searchQuery = trpc.admin.searchListingsAdmin.useQuery(
    { query: debouncedAdSearch || " ", status: adStatusFilter === "all" ? undefined : adStatusFilter, limit: 50 }
  );

  const editListingMutation = trpc.admin.adminEditListing.useMutation();
  useEffect(() => {
    if (editListingMutation.isSuccess) {
      toast.success("Listing updated successfully");
      searchQuery.refetch();
      setEditingAd(null);
    }
  }, [editListingMutation.isSuccess]);
  useEffect(() => {
    if (editListingMutation.isError) {
      toast.error((editListingMutation.error as any)?.message || "Failed to update listing");
    }
  }, [editListingMutation.isError]);

  const createListingMutation = trpc.admin.adminCreateListingForUser.useMutation();
  useEffect(() => {
    if (createListingMutation.isSuccess) {
      toast.success("Listing created successfully");
      searchQuery.refetch();
      setShowCreateAdDialog(false);
      setCreateAdForm({ userId: "", title: "", description: "", price: "", type: "marketplace", categoryId: "1", location: "", condition: "new", stock: "1", brand: "", model: "", status: "active" });
    }
  }, [createListingMutation.isSuccess]);
  useEffect(() => {
    if (createListingMutation.isError) {
      toast.error((createListingMutation.error as any)?.message || "Failed to create listing");
    }
  }, [createListingMutation.isError]);

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

  const statusBadge = (s: string) => {
    switch (s) {
      case "active": return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Active</span>;
      case "pending": return <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase">Pending</span>;
      case "rejected": return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">Rejected</span>;
      case "inactive": return <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full uppercase">Inactive</span>;
      case "sold": return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Sold</span>;
      default: return <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full uppercase">{s}</span>;
    }
  };

  return (
    <div className="space-y-5">
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

      {!searchQuery.isLoading && (
        <p className="text-sm text-gray-500">
          {debouncedAdSearch ? (
            <><span className="font-bold text-gray-800">{searchQuery.data?.length ?? 0}</span> result(s) for "{debouncedAdSearch}"</>
          ) : (
            <>Showing latest <span className="font-bold text-gray-800">{searchQuery.data?.length ?? 0}</span> listings — search to filter</>
          )}
        </p>
      )}

      {searchQuery.isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      )}

      <div className="space-y-3">
        {(searchQuery.data ?? []).map((listing: any) => (
          <Card key={listing.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4 items-start">
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
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
                <div className="flex gap-3 mt-2 flex-wrap text-[11px] text-gray-400">
                  {listing.condition && <span>Condition: <b className="text-gray-600">{listing.condition}</b></span>}
                  {listing.location && <span>📍 {listing.location}</span>}
                  {listing.stock != null && <span>Stock: <b className="text-gray-600">{listing.stock}</b></span>}
                  <span>Created: <b className="text-gray-600">{new Date(listing.createdAt).toLocaleDateString()}</b></span>
                </div>
              </div>
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

        {!searchQuery.isLoading && (searchQuery.data?.length ?? 0) === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-bold">No listings found</p>
            <p className="text-gray-300 text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>

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
    </div>
  );
}
