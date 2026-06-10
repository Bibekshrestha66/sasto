import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, Heart, Gavel, Package, Trash2, Plus, Search, Filter, Download, ArrowRight, Clock, MapPin, TrendingUp, ShieldAlert
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { exportBuyerPurchaseHistory, exportBuyerSavedItems, exportBuyerActiveBids } from "@/lib/csvExport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function BuyerDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "purchases" | "saved" | "bids" | "returns">("overview");

  // Fetch real data
  const { data: favorites = [] } = trpc.favorites.list.useQuery();
  const { data: bookings = [] } = trpc.bookings.list.useQuery();
  const { data: myBids = [] } = (trpc.auctions as any).myBids.useQuery();
  const { data: transactions = [] } = trpc.transactions.list.useQuery();
  const { data: returnsData = [], refetch: refetchReturns } = (trpc as any).returns.getBuyerReturns.useQuery(undefined, { enabled: isAuthenticated });
  
  const [purchaseSubTab, setPurchaseSubTab] = useState<"orders" | "bookings">("orders");
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTxId, setReturnTxId] = useState<number | null>(null);
  const [returnReason, setReturnReason] = useState("damaged");
  const [returnDescription, setReturnDescription] = useState("");

  const requestReturnMutation = (trpc as any).returns.requestReturn.useMutation();
  useEffect(() => {
    if (requestReturnMutation.isSuccess) { toast.success("Return requested successfully"); setReturnModalOpen(false); refetchReturns(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestReturnMutation.isSuccess]);
  useEffect(() => {
    if (requestReturnMutation.isError) { toast.error((requestReturnMutation.error as any)?.message || "Failed to request return"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestReturnMutation.isError]);

  const handleRequestReturn = (txId: number) => {
    setReturnTxId(txId);
    setReturnReason("damaged");
    setReturnDescription("");
    setReturnModalOpen(true);
  };

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // Unverified users can still buy but see a prompt to verify
  const showVerificationBanner = !user?.isVerified && user?.role !== "admin" && user?.role !== "super_admin";

  // Statistics for Overview
  const totalSpent = bookings.reduce((acc, b) => acc + Number(b.totalPrice), 0) +
                     transactions.reduce((acc, t) => acc + Number(t.amount) + Number(t.deliveryFee || 0), 0);

  const stats = [
    { label: "Bookings", value: bookings.length, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Orders", value: transactions.length, icon: ShoppingCart, color: "text-green-600", bg: "bg-green-50" },
    { label: "Favorites", value: favorites.length, icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
    { 
      label: "Total Spent", 
      value: "NPR " + totalSpent.toLocaleString(), 
      icon: ShoppingCart, 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
    { label: "Returns", value: returnsData.length, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Buyer Dashboard</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">Welcome back, {user?.name || "Shopper"}!</p>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button 
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl md:rounded-2xl h-10 md:h-12 px-4 md:px-6 shadow-lg shadow-green-100 text-xs md:text-sm" 
                onClick={() => setLocation("/")}
              >
                <Search className="w-4 h-4 mr-2" />
                Browse Items
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Banner for unverified users */}
      {showVerificationBanner && (
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-amber-700">
                Your account is <span className="font-black">unverified</span>. You can browse and buy, but to sell or post ads you must complete KYC/KYB verification.
              </p>
            </div>
            <Link href="/verification">
              <button className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors">
                Get Verified
              </button>
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-2 mb-6 md:mb-10 p-2 md:p-2 bg-white rounded-2xl md:rounded-full border border-gray-200/60 shadow-sm w-full md:w-max">
          {(["overview", "purchases", "saved", "bids", "returns"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-4 md:px-10 py-3 md:py-3.5 rounded-xl md:rounded-full font-black text-[11px] md:text-sm capitalize transition-all duration-300 ${
                activeTab === tab
                  ? "bg-gray-900 text-white shadow-md md:shadow-xl"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={idx} className="p-4 md:p-8 border-none shadow-md md:shadow-xl rounded-2xl md:rounded-3xl bg-white group hover:scale-[1.02] transition-all cursor-default">
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color}`}>
                          <Icon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-gray-200 group-hover:text-green-500 transition-colors" />
                      </div>
                      <p className="text-gray-400 font-black text-[10px] md:text-xs uppercase tracking-widest truncate">{stat.label}</p>
                      <p className="text-xl md:text-3xl font-black text-gray-900 mt-1 tracking-tight truncate">{stat.value}</p>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Orders & Bookings */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Recent Orders</h3>
                    <Button variant="ghost" className="font-bold text-green-500" onClick={() => { setActiveTab("purchases"); setPurchaseSubTab("orders"); }}>
                      View All <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {transactions.slice(0, 3).map((item) => (
                      <Card key={item.id} className="p-6 border-none shadow-lg rounded-3xl bg-white flex items-center gap-6">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                          {item.image ? (
                            <img src={item.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-slate-50">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-900 text-lg leading-tight mb-1 truncate">{item.title}</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Ordered {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-black uppercase w-fit mt-1.5">
                            {item.deliverySpeed} Delivery
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-green-600 text-lg">NPR {Number(item.amount + (item.deliveryFee || 0)).toLocaleString()}</p>
                          <Badge className="bg-green-50 text-green-600 border-none rounded-lg uppercase text-[10px] font-black mt-1">
                            {item.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                    {transactions.length === 0 && (
                      <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No recent orders</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Bids Preview */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Active Bids</h3>
                    <Button variant="ghost" className="font-bold text-green-500" onClick={() => setActiveTab("bids")}>
                      View All <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {myBids.slice(0, 3).map((bid: any) => (
                      <Card key={bid.id} className="p-6 border-none shadow-lg rounded-3xl bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-black text-gray-900 truncate">{bid.auctionTitle}</h4>
                          <Badge className="bg-green-50 text-green-600 border-none rounded-lg uppercase text-[10px] font-black">
                            Live
                          </Badge>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Bid</p>
                            <p className="font-black text-gray-900">NPR {Number(bid.amount).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Highest</p>
                            <p className="font-black text-green-600">NPR {Number(bid.currentHighestBid || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {myBids.length === 0 && (
                      <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <Gavel className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No active bids</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "purchases" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-sm w-fit">
                  <button
                    onClick={() => setPurchaseSubTab("orders")}
                    className={`px-5 py-2 rounded-xl font-bold text-xs uppercase transition-all ${
                      purchaseSubTab === "orders" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Marketplace Orders ({transactions.length})
                  </button>
                  <button
                    onClick={() => setPurchaseSubTab("bookings")}
                    className={`px-5 py-2 rounded-xl font-bold text-xs uppercase transition-all ${
                      purchaseSubTab === "bookings" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Rental Bookings ({bookings.length})
                  </button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="h-11 rounded-xl border-gray-200 font-bold px-4 text-xs w-full sm:w-auto"
                    onClick={() => {
                      if (purchaseSubTab === "orders") {
                        exportBuyerPurchaseHistory(transactions as any);
                      } else {
                        exportBuyerPurchaseHistory(bookings as any);
                      }
                    }}
                  >
                    <Download className="w-3.5 h-3.5 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {purchaseSubTab === "orders" ? (
                <div className="grid grid-cols-1 gap-4">
                  {transactions.map((item: any) => (
                    <Card key={item.id} className="p-6 border border-slate-100 shadow-xl rounded-3xl bg-white hover:scale-[1.005] transition-transform">
                      <div className="flex flex-col md:flex-row md:items-start gap-6">
                        <div className="w-28 h-28 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                          {item.image ? (
                            <img src={item.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID: {item.orderId}</span>
                              <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5 truncate">{item.title}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-50 text-green-700 border-none rounded-lg uppercase text-[10px] font-black px-2.5 py-1">
                                {item.status}
                              </Badge>
                              <Badge className="bg-green-50 text-green-700 border-none rounded-lg uppercase text-[10px] font-black px-2.5 py-1">
                                {item.deliverySpeed} Delivery
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 mt-4 text-xs font-semibold text-slate-600">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ordered Date</p>
                              <p className="font-bold text-slate-900">{new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deliver To</p>
                              <p className="font-bold text-slate-900 truncate">{item.deliveryName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{item.deliveryAddress}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                              <p className="font-black text-green-600 text-sm">NPR {Number(item.amount + (item.deliveryFee || 0)).toLocaleString()}</p>
                              <p className="text-[10px] text-slate-400 uppercase">via {item.paymentMethod}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                              <p className="font-bold text-green-600">{item.estDeliveryDate}</p>
                            </div>
                          </div>

                          {['delivered', 'completed'].includes(item.status?.toLowerCase()) && (
                            <div className="mt-4 flex justify-end">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50" 
                                onClick={() => handleRequestReturn(item.id)}
                              >
                                Request Return
                              </Button>
                            </div>
                          )}

                          {/* Live Tracking Progress Bar */}
                          <div className="mt-6 pt-6 border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Delivery Tracking</p>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
                              {[
                                { key: "placed", label: "Ordered", ts: item.placedAt || item.createdAt },
                                { key: "processing", label: "Processing", ts: (item as any).processedAt },
                                { key: "shipped", label: "Shipped", ts: (item as any).shippedAt },
                                { key: "delivered", label: "Delivered", ts: (item as any).deliveredAt },
                              ].map((step, index, arr) => {
                                const statusList = ["placed", "processing", "shipped", "delivered"];
                                const currentStatusIndex = statusList.indexOf(item.status?.toLowerCase() || "placed");
                                const stepIndex = index;
                                const isCompleted = stepIndex <= currentStatusIndex;
                                const isActive = stepIndex === currentStatusIndex;

                                const formatStepTime = (ts: any) => {
                                  if (!ts) return null;
                                  const d = new Date(ts);
                                  return d.toLocaleString("en-NP", {
                                    month: "short", day: "numeric",
                                    hour: "2-digit", minute: "2-digit", hour12: true
                                  });
                                };

                                return (
                                  <div key={step.key} className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 flex-1 w-full">
                                    <div className="flex items-center w-full">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                                        isCompleted
                                          ? "bg-green-600 text-white shadow-lg shadow-green-100"
                                          : "bg-slate-100 text-slate-400"
                                      } ${isActive ? "ring-4 ring-green-100 animate-pulse" : ""}`}>
                                        {isCompleted ? "✓" : index + 1}
                                      </div>
                                      {index < arr.length - 1 && (
                                        <div className={`hidden sm:block h-1 flex-1 mx-2 rounded-full transition-all ${
                                          stepIndex < currentStatusIndex ? "bg-green-600" : "bg-slate-100"
                                        }`} />
                                      )}
                                    </div>
                                    <div className="text-left sm:text-center shrink-0">
                                      <p className={`text-xs font-black transition-all ${
                                        isCompleted ? "text-slate-900" : "text-slate-400"
                                      }`}>
                                        {step.label}
                                      </p>
                                      {step.ts ? (
                                        <p className="text-[10px] text-green-600 font-bold leading-tight mt-0.5">
                                          {formatStepTime(step.ts)}
                                        </p>
                                      ) : (
                                        <p className="text-[10px] text-slate-300 leading-tight mt-0.5">
                                          {isCompleted ? "—" : "Pending"}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {transactions.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                      <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No orders yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {bookings.map((item) => (
                    <Card key={item.id} className="p-6 border-none shadow-xl rounded-3xl bg-white hover:scale-[1.01] transition-transform">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="w-32 h-32 bg-gray-100 rounded-3xl overflow-hidden shadow-inner">
                          <img src={item.image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xl font-black text-gray-900 tracking-tight">{item.title}</h4>
                            <Badge className="bg-blue-50 text-blue-600 border-none rounded-xl uppercase text-[10px] font-black px-3 py-1">
                              {item.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Start Date</p>
                              <p className="font-bold text-gray-900">{new Date(item.startDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">End Date</p>
                              <p className="font-bold text-gray-900">{new Date(item.endDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                              <p className="font-black text-green-600">NPR {Number(item.totalPrice).toLocaleString()}</p>
                            </div>
                            <div className="flex items-end">
                              <Button size="sm" variant="ghost" className="text-blue-500 font-black text-xs uppercase tracking-widest p-0 h-auto hover:bg-transparent">
                                View Receipt
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {bookings.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                      <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No rental bookings yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Saved Items ({favorites.length})</h3>
                <Button 
                  variant="outline" 
                  className="rounded-2xl font-bold border-gray-200"
                  onClick={() => exportBuyerSavedItems(favorites as any)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-3xl bg-white overflow-hidden group hover:scale-[1.03] transition-all">
                    <div className="relative aspect-square bg-gray-100">
                      <img src={item.image} className="w-full h-full object-cover" alt="" />
                      <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-rose-500 shadow-lg hover:scale-110 transition-transform">
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                    <div className="p-6">
                      <h4 className="font-black text-gray-900 text-lg mb-1 truncate">{item.title}</h4>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-green-500" />
                        {item.location}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-black text-green-600">NPR {Number(item.price || 0).toLocaleString()}</p>
                        <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-4 font-bold h-10">
                          View Item
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {favorites.length === 0 && (
                  <div className="col-span-full text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                    <Heart className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                    <h4 className="text-xl font-black text-gray-900 mb-2">Your wishlist is empty</h4>
                    <p className="text-gray-400 font-medium mb-8">Save items you like and they'll show up here.</p>
                    <Button 
                      className="bg-green-500 hover:bg-green-600 text-white font-bold h-12 px-8 rounded-2xl"
                      onClick={() => setLocation("/")}
                    >
                      Start Exploring
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "bids" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Active Bids ({myBids.length})</h3>
                <Button 
                  variant="outline" 
                  className="rounded-2xl font-bold border-gray-200"
                  onClick={() => exportBuyerActiveBids(myBids as any)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="space-y-4">
                {myBids.map((bid: any) => (
                  <Card key={bid.id} className="p-6 border-none shadow-xl rounded-3xl bg-white group hover:border-green-200 border-2 border-transparent transition-all">
                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                      <div className="w-32 h-32 bg-gray-100 rounded-3xl overflow-hidden shrink-0">
                        <img src={bid.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="sm:col-span-1">
                          <h4 className="text-xl font-black text-gray-900 tracking-tight mb-2">{bid.auctionTitle}</h4>
                          <Badge className="bg-green-50 text-green-600 border-none rounded-xl uppercase text-[10px] font-black px-3 py-1">
                            Live Auction
                          </Badge>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Last Bid</p>
                          <p className="text-xl font-black text-gray-900">NPR {parseFloat(bid.amount).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                            Placed {new Date(bid.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Highest</p>
                          <p className="text-xl font-black text-green-600">NPR {parseFloat(bid.currentHighestBid || "0").toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                            Ends in {Math.ceil((new Date(bid.endTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Button 
                          className="w-full md:w-auto bg-gray-900 text-white hover:bg-gray-800 rounded-2xl h-14 px-8 font-black shadow-xl"
                          onClick={() => setLocation(`/auction/${bid.auctionId}`)}
                        >
                          View Live
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "returns" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">My Returns ({returnsData.length})</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {returnsData.map((ret: any) => (
                  <Card key={ret.id} className="p-6 border border-slate-100 shadow-xl rounded-3xl bg-white hover:scale-[1.005] transition-transform">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xl font-black text-slate-900 truncate">Transaction #{ret.transactionId}</h4>
                          <Badge className={`border-none rounded-lg uppercase text-[10px] font-black px-2.5 py-1 ${
                            ret.status === "approved" ? "bg-green-50 text-green-700" :
                            ret.status === "rejected" ? "bg-red-50 text-red-700" :
                            ret.status === "refunded" ? "bg-purple-50 text-purple-700" :
                            "bg-green-50 text-green-700"
                          }`}>
                            {ret.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-500 mb-4">Product: {ret.transaction?.listing?.title}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 text-xs text-slate-600">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason</p>
                            <p className="font-bold text-slate-900 capitalize">{ret.reason.replace("_", " ")}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested On</p>
                            <p className="font-bold text-slate-900">{new Date(ret.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seller</p>
                            <p className="font-bold text-slate-900">{ret.transaction?.seller?.businessName || ret.transaction?.seller?.name || "Seller"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Details</p>
                            <p className="font-medium text-slate-700 truncate">{ret.description || "N/A"}</p>
                          </div>
                        </div>
                        
                        {ret.adminNotes && (
                          <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                            <p className="text-xs font-black text-blue-800 uppercase tracking-widest mb-1">Admin/Seller Notes</p>
                            <p className="text-sm text-blue-900">{ret.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                
                {returnsData.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No returns requested</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Request Return Modal */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>
              Please provide details for returning this item.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Return</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Damaged or Defective</SelectItem>
                  <SelectItem value="wrong_item">Received Wrong Item</SelectItem>
                  <SelectItem value="wrong_size">Wrong Size</SelectItem>
                  <SelectItem value="wrong_color">Wrong Color</SelectItem>
                  <SelectItem value="seller_error">Seller Error</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description & Details</Label>
              <Textarea 
                id="description" 
                placeholder="Please describe the issue..." 
                value={returnDescription} 
                onChange={(e) => setReturnDescription(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>
            {/* Note: Photo upload can be added here if needed */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-rose-600 hover:bg-rose-700 text-white" 
              onClick={() => requestReturnMutation.mutate({ transactionId: returnTxId!, reason: returnReason, description: returnDescription })}
              disabled={requestReturnMutation.isPending}
            >
              Submit Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
