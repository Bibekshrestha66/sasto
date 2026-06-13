import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Eye, ShoppingCart, TrendingUp, Star, AlertCircle, Edit2, Trash2,
  MoreVertical, Plus, Filter, Download, Calendar, ArrowUpRight, ArrowDownRight, Layers,
  Search, Zap, Truck, CheckCircle2, Clock, UserCheck, MapPin, Phone, Mail, Package, MessageSquare,
  Sparkles, Crown, Rocket, X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { exportSellerSalesData, exportSellerListingsData } from "@/lib/csvExport";

export default function SellerDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "orders" | "analytics" | "reviews" | "returns">("overview");
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteListingItem, setPromoteListingItem] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<"basic" | "standard" | "premium">("basic");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [dealModal, setDealModal] = useState<{ id: number; currentPrice: number; title: string } | null>(null);
  const [dealPrice, setDealPrice] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // ── ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS (Rules of Hooks) ──
  const professionalRoles = ["seller", "dealer", "wholesaler", "distributor", "admin", "super_admin"];
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isProfessional = professionalRoles.includes(user?.role || "");
  const canAccess = isAuthenticated && (isProfessional) && (user?.isVerified || isAdmin);

  // Fetch dashboard data — always call hooks, use enabled flag to skip when not ready
  const { data: metrics, isLoading: metricsLoading } = trpc.sellerAnalytics.overview.useQuery(undefined, { enabled: canAccess });
  const { data: listings, isLoading: listingsLoading } = trpc.seller.getListings.useQuery({ page: 1, limit: 10 }, { enabled: canAccess });
  const { data: analytics } = trpc.sellerAnalytics.salesTrends.useQuery({ days: 30 }, { enabled: canAccess });
  const { data: reviews } = trpc.sellerAnalytics.reviews.useQuery({ page: 1, limit: 5 }, { enabled: canAccess });
  const { data: topListings } = trpc.sellerAnalytics.topListings.useQuery({ limit: 5 }, { enabled: canAccess });
  const { data: revenueByCategory } = trpc.sellerAnalytics.revenueByCategory.useQuery(undefined, { enabled: canAccess });
  const { data: auctionStats } = trpc.sellerAnalytics.auctionStats.useQuery(undefined, { enabled: canAccess });
  const { data: orders = [], isLoading: ordersLoading } = trpc.transactions.listSellerOrders.useQuery(undefined, { enabled: canAccess });
  const { data: returnsData = [], refetch: refetchReturns } = (trpc as any).returns.getSellerReturns.useQuery(undefined, { enabled: canAccess });

  const utils = trpc.useUtils();
  const deleteListingMutation = trpc.seller.deleteListing.useMutation();

  const { data: pricingTiers = [], isLoading: pricingLoading } = trpc.ads.getSponsoredPricing.useQuery(undefined, { enabled: canAccess });
  const { data: gateways = [], isLoading: gatewaysLoading } = trpc.ads.getActiveGateways.useQuery(undefined, { enabled: canAccess });

  const promoteListingMutation = trpc.ads.promoteListing.useMutation();
  const createDealMutation = trpc.seller.updateListingPrice.useMutation();
  const updateStatusMutation = trpc.transactions.updateStatus.useMutation();
  const updateReturnStatusMutation = (trpc as any).returns.updateStatus.useMutation();

  const COLORS = ["#00AA44", "#FFA500", "#FF6B6B", "#4ECDC4"];

  // ── EARLY RETURNS AFTER ALL HOOKS ──

  // Wait for Clerk to finish initializing before redirecting
  // This prevents the refresh-to-homepage bug
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // Only verified professional accounts can access seller dashboard
  if (!isProfessional) {
    setLocation("/become-seller");
    return null;
  }

  if (!user?.isVerified && !isAdmin) {
    setLocation("/verification");
    return null;
  }



  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">Seller Dashboard</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium mt-1">Manage your business and track performance.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="rounded-xl md:rounded-2xl h-10 md:h-12 px-4 md:px-6 font-bold border-gray-200 hover:bg-gray-50 text-xs md:text-sm"
                onClick={() => exportSellerSalesData([])}
              >
                <Download className="w-4 h-4 mr-1 md:mr-2" />
                Export
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white font-black rounded-xl md:rounded-2xl h-10 md:h-12 px-4 md:px-8 shadow-md md:shadow-xl shadow-green-100 transition-all active:scale-95 text-xs md:text-sm"
                onClick={() => setLocation("/post-listing")}
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                New Listing
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-10">
        {/* Modern Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-2 mb-6 md:mb-12 p-2 md:p-2 bg-white rounded-2xl md:rounded-full border border-gray-200/60 shadow-sm w-full md:w-max">
          {(["overview", "listings", "orders", "returns", "analytics", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-3 md:px-10 py-3 md:py-3.5 rounded-xl md:rounded-full font-black text-[11px] md:text-sm capitalize transition-all duration-300 whitespace-nowrap ${
                activeTab === tab
                  ? "bg-gray-900 text-white shadow-md md:shadow-2xl scale-100 md:scale-[1.02]"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab === "orders" ? "Sales & Orders" : tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* High-Impact Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { label: "Revenue", value: "NPR " + (metrics?.totalRevenue || 0).toLocaleString(), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", trend: "+12.5%", positive: true },
                { label: "Total Sales", value: metrics?.totalSales || 0, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50", trend: "+8.2%", positive: true },
                { label: "Listings", value: metrics?.activeListings || 0, icon: Layers, color: "text-green-600", bg: "bg-green-50", trend: "+2 new", positive: true },
                { label: "Rating", value: (metrics?.avgRating || 0).toFixed(1), icon: Star, color: "text-yellow-600", bg: "bg-yellow-50", trend: "from 234", positive: true },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <Card key={idx} className="p-4 md:p-8 border-none shadow-md md:shadow-2xl rounded-2xl md:rounded-[40px] bg-white group hover:scale-[1.05] transition-all duration-500">
                    <div className="flex items-center justify-between mb-3 md:mb-6">
                      <div className={`p-3 md:p-5 rounded-xl md:rounded-3xl ${stat.bg} ${stat.color} shadow-inner`}>
                        <Icon className="w-5 h-5 md:w-8 md:h-8" />
                      </div>
                      <div className={`hidden sm:flex items-center gap-1 text-[10px] md:text-xs font-black px-2 md:px-3 py-1 rounded-full ${stat.positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                        {stat.positive ? <ArrowUpRight className="w-2 h-2 md:w-3 md:h-3" /> : <ArrowDownRight className="w-2 h-2 md:w-3 md:h-3" />}
                        {stat.trend}
                      </div>
                    </div>
                    <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
                    <p className="text-xl md:text-4xl font-black text-gray-900 mt-1 md:mt-2 tracking-tighter truncate">{stat.value}</p>
                  </Card>
                );
              })}
            </div>

            {/* Performance Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Sales Chart */}
              <Card className="lg:col-span-8 p-10 border-none shadow-2xl rounded-[48px] bg-white">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Sales Analytics</h3>
                    <p className="text-gray-400 font-bold text-sm">Revenue trends over the last 30 days.</p>
                  </div>
                  <Badge className="bg-gray-100 text-gray-500 border-none px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest">
                    Last 30 Days
                  </Badge>
                </div>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics || []}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-10} />
                      <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '20px'}}
                        itemStyle={{fontWeight: 900, fontSize: '14px'}}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={5} dot={{ r: 6, fill: '#16a34a', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 10, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Side Panels */}
              <div className="lg:col-span-4 space-y-10">
                <Card className="p-10 border-none shadow-2xl rounded-[48px] bg-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16" />
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-8">Top Listings</h3>
                  <div className="space-y-6">
                    {topListings?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-green-50 transition-colors">
                          <Eye className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 truncate">{item.title}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.views} Views</p>
                        </div>
                        <p className="font-black text-green-600">NPR {(item.price ?? 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-10 border-none shadow-2xl rounded-[48px] bg-gray-900 text-white relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-green-500" />
                  <h3 className="text-xl font-black mb-6">Auction Status</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Active</p>
                      <p className="text-3xl font-black">{auctionStats?.activeAuctions || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Bids</p>
                      <p className="text-3xl font-black">{auctionStats?.totalBids || 0}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-8 bg-white/10 hover:bg-white/20 text-white border-none rounded-2xl font-black py-6"
                    onClick={() => setLocation("/auctions")}
                  >
                    View Auctions
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search your listings..."
                  value={listingSearch}
                  onChange={e => setListingSearch(e.target.value)}
                  className="h-16 pl-16 pr-6 rounded-[24px] bg-white border-none shadow-xl font-bold text-lg"
                />
              </div>
              <div className="relative">
                <Button
                  variant="outline"
                  className={`h-16 px-8 rounded-[24px] border-none bg-white shadow-xl font-black w-full md:w-auto transition-all ${
                    statusFilter !== "all" ? "text-green-600 ring-2 ring-green-400" : "text-gray-500"
                  }`}
                  onClick={() => setShowFilterMenu(v => !v)}
                >
                  <Filter className="w-5 h-5 mr-3" />
                  {statusFilter === "all" ? "Filters" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Button>
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    {["all", "active", "pending", "inactive", "sold", "rejected"].map(s => (
                      <button
                        key={s}
                        className={`w-full text-left px-5 py-3 font-bold text-sm capitalize transition-colors ${
                          statusFilter === s ? "bg-green-50 text-green-700" : "hover:bg-gray-50 text-gray-700"
                        }`}
                        onClick={() => { setStatusFilter(s); setShowFilterMenu(false); }}
                      >
                        {s === "all" ? "All Statuses" : s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {listings?.listings
                .filter((item: any) => {
                  const matchSearch = !listingSearch || item.title.toLowerCase().includes(listingSearch.toLowerCase());
                  const matchStatus = statusFilter === "all" || item.status === statusFilter;
                  return matchSearch && matchStatus;
                })
                .map((item: any) => (
                <Card key={item.id} className="p-8 border-none shadow-xl rounded-[40px] bg-white hover:scale-[1.01] transition-all group">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                    <div className="w-40 h-40 bg-gray-100 rounded-[32px] overflow-hidden shadow-inner shrink-0 relative">
                      <img src={item.images?.[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 backdrop-blur-md text-gray-900 border-none font-black text-[10px] uppercase px-3 py-1 rounded-lg">
                          {(item as any).listingType || item.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight truncate">{item.title}</h4>
                        <Badge className={`border-none rounded-full px-4 py-1 text-[10px] font-black uppercase ${
                          item.status === "active" ? "bg-green-50 text-green-600" : "bg-green-50 text-green-600"
                        }`}>
                          {item.status}
                        </Badge>
                        {item.isFeatured && (
                          <Badge className="bg-yellow-50 text-yellow-600 border-none rounded-full px-4 py-1 text-[10px] font-black uppercase flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-yellow-600" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 font-medium mb-6 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-10">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
                          <p className="text-xl font-black text-green-600">NPR {(item.price ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Views</p>
                          <p className="text-xl font-black text-gray-900">{item.views || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Created</p>
                          <p className="text-xl font-black text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 shrink-0 lg:w-40">
                      {!item.isFeatured ? (
                        <Button
                          className="lg:w-40 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-2xl h-12 lg:h-14 font-black shadow-xl shadow-green-100 transition-all text-sm"
                          onClick={() => { setPromoteListingItem(item); setSelectedTier("basic"); setPromoteModalOpen(true); }}
                        >
                          <Star className="w-4 h-4 mr-2 fill-white" />
                          Promote
                        </Button>
                      ) : (
                        <div className="lg:w-40 h-12 lg:h-14 flex items-center justify-center bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
                          <Zap className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
                          <span className="text-yellow-600 font-black text-sm">Featured</span>
                        </div>
                      )}
                      <Button
                        className="lg:w-40 bg-gray-900 text-white rounded-2xl h-12 lg:h-14 font-black shadow-xl text-sm"
                        onClick={() => setLocation(`/edit-listing/${item.id}`)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="lg:w-40 border-green-200 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-2xl h-12 lg:h-14 font-black transition-all text-sm"
                        onClick={() => setDealModal({ id: item.id, currentPrice: item.price ?? 0, title: item.title })}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Make Deal
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="lg:w-40 border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl h-12 lg:h-14 font-black transition-all text-sm"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[32px] sm:rounded-[32px] p-8 border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-gray-900">Delete Listing?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base text-gray-500 font-medium">
                              Are you sure you want to delete <span className="font-bold text-gray-800">"{item.title}"</span>? This action cannot be undone and you will lose all views and potential buyers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel className="h-12 rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-50 px-6">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteListingMutation.mutate({ listingId: item.id }, {
                                onSuccess: () => {
                                  toast.success("Listing deleted!");
                                  utils.seller.getListings.invalidate();
                                },
                                onError: (error: any) => {
                                  toast.error(error.message || "Failed to delete listing");
                                },
                              })}
                              className="h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white px-6"
                            >
                              Yes, Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ─── PROMOTE MODAL ─── */}
        <Dialog open={promoteModalOpen} onOpenChange={setPromoteModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Star className="w-6 h-6 fill-white text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-white">Promote Listing</DialogTitle>
                  <p className="text-green-100 text-sm font-medium">Boost visibility across all pages</p>
                </div>
              </div>
              {promoteListingItem && (
                <div className="mt-4 bg-white/20 rounded-2xl px-4 py-3">
                  <p className="text-white font-black text-sm truncate">{promoteListingItem.title}</p>
                  <p className="text-green-100 text-xs">NPR {(promoteListingItem.price ?? 0).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Tier Cards */}
            <div className="p-6 space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Choose a Promotion Tier</p>

              {pricingLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                pricingTiers.map((tier: any) => {
                  const icons: Record<string, any> = { basic: Sparkles, standard: Rocket, premium: Crown };
                  const colors: Record<string, string> = {
                    basic: "border-blue-200 bg-blue-50 text-blue-600",
                    standard: "border-purple-200 bg-purple-50 text-purple-600",
                    premium: "border-amber-200 bg-amber-50 text-amber-600",
                  };
                  const activeColors: Record<string, string> = {
                    basic: "border-blue-500 bg-blue-50 ring-2 ring-blue-400",
                    standard: "border-purple-500 bg-purple-50 ring-2 ring-purple-400",
                    premium: "border-amber-500 bg-amber-50 ring-2 ring-amber-400",
                  };
                  const TierIcon = icons[tier.tier] || Sparkles;
                  const isSelected = selectedTier === tier.tier;
                  return (
                    <button
                      key={tier.tier}
                      onClick={() => setSelectedTier(tier.tier)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected ? activeColors[tier.tier] : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[tier.tier]}`}>
                        <TierIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-gray-900 capitalize">{tier.tier}</p>
                          {tier.tier === "premium" && (
                            <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Best</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{tier.description || `${tier.durationDays} days featured`}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-black text-gray-900">NPR {(tier.priceNPR ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{tier.durationDays} days</p>
                      </div>
                    </button>
                  );
                })
              )}

              {/* Payment Methods */}
              {!gatewaysLoading && gateways.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Payment Method</p>
                  <div className="grid grid-cols-2 gap-2">
                    {gateways.map((gw: any) => (
                      <button
                        key={gw.name}
                        onClick={() => setSelectedPaymentMethod(gw.name)}
                        className={`p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                          selectedPaymentMethod === gw.name
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        {gw.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl font-black border-gray-200"
                  onClick={() => setPromoteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-14 rounded-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-xl shadow-green-100"
                  onClick={() => {
                    if (!promoteListingItem) return;
                    if (!selectedPaymentMethod && gateways.length > 0) {
                      toast.error("Please select a payment method");
                      return;
                    }
                    promoteListingMutation.mutate({ 
                      listingId: promoteListingItem.id, 
                      tier: selectedTier,
                      paymentMethod: selectedPaymentMethod || undefined
                    }, {
                      onSuccess: (data: any) => {
                        toast.success(`Promotion request submitted! Price: NPR ${data.price}. Await admin approval.`);
                        setPromoteModalOpen(false);
                        utils.seller.getListings.invalidate();
                        if (data.paymentUrl) {
                          setLocation(data.paymentUrl);
                        }
                      },
                      onError: (error: any) => {
                        toast.error(error.message || "Failed to submit promotion request");
                      },
                    });
                  }}
                  disabled={promoteListingMutation.isPending || pricingLoading}
                >
                  {promoteListingMutation.isPending ? "Processing..." : "Pay & Promote ✨"}
                </Button>
              </div>
              <p className="text-center text-xs text-gray-400">Your listing will go live once admin approves the request.</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* ─── MAKE DEAL MODAL ─── */}
        <Dialog open={!!dealModal} onOpenChange={(open) => { if (!open) { setDealModal(null); setDealPrice(""); } }}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create a Deal / Drop Price</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Set a discounted price for <strong>{dealModal?.title}</strong>.
                The original price (Rs. {dealModal?.currentPrice.toLocaleString()}) will be shown with a strikethrough.
              </p>
              <div>
                <Label>New Deal Price (NPR)</Label>
                <Input
                  type="number"
                  placeholder="Enter discounted price"
                  value={dealPrice}
                  onChange={e => setDealPrice(e.target.value)}
                  className="mt-1"
                />
                {dealPrice && parseFloat(dealPrice) > 0 && dealModal && parseFloat(dealPrice) < dealModal.currentPrice && (
                  <p className="text-xs text-green-600 mt-1">
                    Discount: {Math.round(((dealModal.currentPrice - parseFloat(dealPrice)) / dealModal.currentPrice) * 100)}% off
                  </p>
                )}
                {dealPrice && dealModal && parseFloat(dealPrice) >= dealModal.currentPrice && (
                  <p className="text-xs text-red-500 mt-1">Deal price must be lower than current price</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setDealModal(null); setDealPrice(""); }}
                >Cancel</Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={!dealPrice || parseFloat(dealPrice) <= 0 || (dealModal ? parseFloat(dealPrice) >= dealModal.currentPrice : true) || createDealMutation.isPending}
                  onClick={() => {
                    if (!dealModal || !dealPrice) return;
                    createDealMutation.mutate({
                      listingId: dealModal.id,
                      originalPrice: dealModal.currentPrice,
                      price: parseFloat(dealPrice),
                    }, {
                      onSuccess: () => {
                        toast.success("Deal created! Your listing now appears in Deals & Offers.");
                        setDealModal(null);
                        setDealPrice("");
                        utils.seller.getListings.invalidate();
                      },
                      onError: (e: any) => toast.error(e.message || "Failed to create deal")
                    });
                  }}
                >
                  {createDealMutation.isPending ? "Creating..." : "Make Deal 🎉"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Customer Reviews</h3>
                <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-6 py-3 rounded-2xl">
                  <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                  <span className="text-2xl font-black">4.8</span>
                  <span className="text-xs font-bold uppercase tracking-widest ml-2 text-yellow-600/50">Overall Rating</span>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-6">
                {(reviews as any)?.reviews?.map((review: any) => (
                  <Card key={review.id} className="p-10 border-none shadow-xl rounded-[48px] bg-white">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-[24px] flex items-center justify-center text-2xl font-black text-gray-400 uppercase">
                          {review.reviewer?.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-lg font-black text-gray-900">{review.reviewer?.name || "Verified Buyer"}</p>
                          <div className="flex gap-1 mt-1">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-4 h-4 ${i <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                      "{review.comment}"
                    </p>
                  </Card>
                ))}
             </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Order Fulfillment</h3>
                <p className="text-gray-500 mt-1">Manage and update order tracking statuses.</p>
              </div>
              <Badge className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-black uppercase text-xs">
                {orders.length} Total Orders
              </Badge>
            </div>

            {ordersLoading ? (
              <div className="p-12 text-center text-gray-500 font-bold">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-16 text-center bg-white border border-gray-100 rounded-[40px] shadow-sm">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold text-lg">No marketplace orders received yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {orders.map((order: any) => (
                  <Card key={order.id} className="p-8 border-none shadow-xl rounded-[40px] bg-white group">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Product thumbnail */}
                      <div className="w-32 h-32 bg-gray-100 rounded-[28px] overflow-hidden shrink-0 border border-gray-100">
                        <img src={order.image} className="w-full h-full object-cover" alt="" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-xl font-black text-gray-900">{order.title}</h4>
                          <Badge className="bg-slate-100 text-slate-700 border-none font-bold px-3 py-1 rounded-full text-xs">
                            {order.orderId}
                          </Badge>
                          <Badge className={`border-none rounded-full px-3 py-1 text-xs font-black uppercase ${
                            order.status === "delivered" 
                              ? "bg-green-50 text-green-600" 
                              : order.status === "shipped"
                              ? "bg-blue-50 text-blue-600"
                              : order.status === "processing"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-50 text-slate-600"
                          }`}>
                            {order.status}
                          </Badge>
                        </div>

                        {/* Customer & Delivery metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</p>
                            <div className="flex items-center gap-1.5 font-bold text-gray-800">
                              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                              <span>{order.deliveryName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{order.deliveryPhone}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fulfillment Speed</p>
                            <div className="flex items-center gap-1.5 font-bold text-gray-800">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span>{order.deliverySpeed} Delivery</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Est: {order.estDeliveryDate}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipping Address</p>
                            <div className="flex items-start gap-1.5 font-medium text-gray-700">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{order.deliveryAddress}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                          <div className="flex gap-8">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Sale Value</p>
                              <p className="text-lg font-black text-green-600">NPR {order.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Payment</p>
                              <p className="text-sm font-black text-gray-700 capitalize">{order.paymentMethod}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Purchased On</p>
                              <p className="text-sm font-bold text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {/* Action update buttons */}
                          <div className="flex items-center gap-2">
                            {order.buyerId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl"
                                onClick={() => window.location.href = `/messages?partnerId=${order.buyerId}`}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Message Buyer
                              </Button>
                            )}
                            {order.status === "placed" && (
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                                onClick={() => updateStatusMutation.mutate({ orderId: order.orderId, status: "processing" }, {
                                  onSuccess: () => {
                                    toast.success("Order status updated!");
                                    utils.transactions.listSellerOrders.invalidate();
                                  },
                                  onError: (error: any) => {
                                    toast.error(error.message || "Failed to update order status");
                                  },
                                })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Accept & Process
                              </Button>
                            )}
                            {order.status === "processing" && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                                onClick={() => updateStatusMutation.mutate({ orderId: order.orderId, status: "shipped" }, {
                                  onSuccess: () => {
                                    toast.success("Order status updated!");
                                    utils.transactions.listSellerOrders.invalidate();
                                  },
                                  onError: (error: any) => {
                                    toast.error(error.message || "Failed to update order status");
                                  },
                                })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <Truck className="w-4 h-4 mr-1.5" /> Mark Shipped
                              </Button>
                            )}
                            {order.status === "shipped" && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                                onClick={() => updateStatusMutation.mutate({ orderId: order.orderId, status: "delivered" }, {
                                  onSuccess: () => {
                                    toast.success("Order status updated!");
                                    utils.transactions.listSellerOrders.invalidate();
                                  },
                                  onError: (error: any) => {
                                    toast.error(error.message || "Failed to update order status");
                                  },
                                })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark Delivered
                              </Button>
                            )}
                            {order.status === "delivered" && (
                              <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-xl">
                                <CheckCircle2 className="w-4 h-4" /> Fulfilled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Returns Tab */}
        {activeTab === "returns" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Returns Management</h3>
                <p className="text-gray-500 mt-1">Review and process return requests from buyers.</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-black uppercase text-xs">
                {returnsData.length} Total Requests
              </Badge>
            </div>

            {returnsData.length === 0 ? (
              <div className="p-16 text-center bg-white border border-gray-100 rounded-[40px] shadow-sm">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold text-lg">No return requests found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {returnsData.map((ret: any) => (
                  <Card key={ret.id} className="p-8 border-none shadow-xl rounded-[40px] bg-white group">
                    <div className="flex flex-col lg:flex-row gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-xl font-black text-gray-900">Return Request #{ret.id}</h4>
                          <Badge className="bg-slate-100 text-slate-700 border-none font-bold px-3 py-1 rounded-full text-xs">
                            Order: {ret.transactionId}
                          </Badge>
                          <Badge className={`border-none rounded-full px-3 py-1 text-xs font-black uppercase ${
                            ret.status === "approved" ? "bg-green-50 text-green-600" :
                            ret.status === "rejected" ? "bg-red-50 text-red-600" :
                            ret.status === "refunded" ? "bg-purple-50 text-purple-600" :
                            "bg-green-50 text-green-600"
                          }`}>
                            {ret.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Buyer Details</p>
                            <p className="font-bold text-gray-800">{ret.transaction?.buyer?.name}</p>
                            <p className="text-xs text-gray-500">{ret.transaction?.buyer?.email}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason</p>
                            <p className="font-bold text-gray-800 capitalize">{ret.reason.replace("_", " ")}</p>
                            <p className="text-xs text-gray-600">"{ret.description || "No description provided."}"</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                          {ret.transaction?.buyer?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl"
                              onClick={() => window.location.href = `/messages?partnerId=${ret.transaction.buyer.id}`}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message Buyer
                            </Button>
                          )}
                          {ret.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                                onClick={() => updateReturnStatusMutation.mutate({ returnId: ret.id, status: "rejected" })}
                                disabled={updateReturnStatusMutation.isPending}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                                onClick={() => updateReturnStatusMutation.mutate({ returnId: ret.id, status: "approved" })}
                                disabled={updateReturnStatusMutation.isPending}
                              >
                                Approve Return
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
