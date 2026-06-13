import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { Star, Sparkles, Rocket, Crown, PlusCircle, ExternalLink, ArrowRight } from "lucide-react";
import { DefaultImage } from "@/components/ui/default-image";

export default function PromoteAds() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"existing" | "new" | "third_party">("existing");
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteListingItem, setPromoteListingItem] = useState<any>(null);
  
  // Package Selection State
  const [selectedTier, setSelectedTier] = useState<"basic" | "standard" | "premium">("basic");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  // 3rd Party Ad Form State
  const [thirdPartyForm, setThirdPartyForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    landingUrl: "",
  });

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // Data Fetching
  const utils = trpc.useUtils();
  const { data: listings = [], isLoading: listingsLoading } = trpc.seller.getListings.useQuery({ page: 1, limit: 100 });
  const { data: pricingTiers = [], isLoading: pricingLoading } = trpc.ads.getSponsoredPricing.useQuery(undefined);
  const { data: gateways = [], isLoading: gatewaysLoading } = trpc.ads.getActiveGateways.useQuery(undefined);

  // Mutations
  const promoteListingMutation = trpc.ads.promoteListing.useMutation();
  const promoteThirdPartyMutation = trpc.ads.promoteThirdPartyAd.useMutation();

  const handleThirdPartySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentMethod && gateways.length > 0) {
      toast.error("Please select a payment method");
      return;
    }
    
    promoteThirdPartyMutation.mutate({
      ...thirdPartyForm,
      tier: selectedTier,
      paymentMethod: selectedPaymentMethod || undefined,
    }, {
      onSuccess: (data: any) => {
        toast.success(`3rd Party Ad submitted! Price: NPR ${data.price}`);
        if (data.paymentUrl) {
          setLocation(data.paymentUrl);
        } else {
          setLocation("/seller/dashboard");
        }
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to submit promotion request");
      }
    });
  };

  const renderTierSelection = () => (
    <div className="space-y-4">
      <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Choose a Promotion Tier</p>
      {pricingLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {pricingTiers.map((tier: any) => {
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
                type="button"
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
          })}
        </div>
      )}

      {/* Payment Methods */}
      {!gatewaysLoading && gateways.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Payment Method</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {gateways.map((gw: any) => (
              <button
                type="button"
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
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Boost Your Reach 🚀</h1>
          <p className="text-lg text-gray-500 font-medium">Promote your listings or 3rd party ads to thousands of daily visitors.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex gap-1 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("existing")}
              className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === "existing" ? "bg-green-500 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              My Listings
            </button>
            <button
              onClick={() => setActiveTab("new")}
              className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "new" ? "bg-green-500 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <PlusCircle className="w-4 h-4" /> New Ad
            </button>
            <button
              onClick={() => setActiveTab("third_party")}
              className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "third_party" ? "bg-green-500 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <ExternalLink className="w-4 h-4" /> 3rd Party Ad
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          
          {/* TAB: EXISTING LISTINGS */}
          {activeTab === "existing" && (
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40">
              <h2 className="text-xl font-black text-gray-900 mb-6">Select a listing to promote</h2>
              
              {listingsLoading ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl" />)}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">No active listings</h3>
                  <p className="text-gray-500 mt-1 mb-4">You need an active listing before you can promote it.</p>
                  <Button onClick={() => setLocation("/post-listing")} className="bg-green-500 hover:bg-green-600 rounded-full font-bold">
                    Post a Listing
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {listings.map((item: any) => (
                    <div key={item.id} className="group relative border border-gray-100 rounded-2xl overflow-hidden bg-white hover:border-green-500 hover:shadow-lg transition-all">
                      <div className="aspect-video w-full overflow-hidden bg-gray-100">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <DefaultImage className="w-full h-full" />
                        )}
                        {item.isFeatured && (
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" /> Featured
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-black text-gray-900 truncate mb-1">{item.title}</h3>
                        <p className="text-sm font-bold text-green-600 mb-4">NPR {item.price?.toLocaleString()}</p>
                        
                        <Button 
                          onClick={() => {
                            setPromoteListingItem(item);
                            setSelectedTier("basic");
                            setPromoteModalOpen(true);
                          }}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl"
                        >
                          Promote ✨
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: NEW LISTING */}
          {activeTab === "new" && (
            <div className="max-w-2xl mx-auto bg-white p-8 sm:p-12 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <PlusCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Create a new Ad</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                First, you'll need to post your item or service on Sasto. Once published, you can promote it directly from here or your dashboard!
              </p>
              <Button 
                onClick={() => setLocation("/post-listing")}
                className="h-14 px-8 text-lg bg-green-500 hover:bg-green-600 text-white rounded-full font-black shadow-lg shadow-green-200 flex items-center gap-2 mx-auto"
              >
                Go to Post Ad <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* TAB: 3RD PARTY AD */}
          {activeTab === "third_party" && (
            <form onSubmit={handleThirdPartySubmit} className="max-w-4xl mx-auto grid md:grid-cols-[1fr_400px] gap-8">
              
              {/* Left Column: Form Details */}
              <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">Ad Details</h2>
                  <p className="text-sm text-gray-500">Provide the content and links for your external advertisement.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Ad Title</Label>
                    <Input 
                      required 
                      value={thirdPartyForm.title}
                      onChange={e => setThirdPartyForm(prev => ({...prev, title: e.target.value}))}
                      placeholder="e.g., Learn React Native in 30 Days" 
                      className="bg-gray-50 border-gray-200 h-12 rounded-xl focus-visible:ring-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Description (Optional)</Label>
                    <Textarea 
                      value={thirdPartyForm.description}
                      onChange={e => setThirdPartyForm(prev => ({...prev, description: e.target.value}))}
                      placeholder="Briefly describe what you're promoting..." 
                      className="bg-gray-50 border-gray-200 rounded-xl resize-none min-h-[100px] focus-visible:ring-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Banner Image URL</Label>
                    <Input 
                      required type="url"
                      value={thirdPartyForm.imageUrl}
                      onChange={e => setThirdPartyForm(prev => ({...prev, imageUrl: e.target.value}))}
                      placeholder="https://example.com/my-banner.jpg" 
                      className="bg-gray-50 border-gray-200 h-12 rounded-xl focus-visible:ring-green-500"
                    />
                    <p className="text-xs text-gray-400">Please provide a direct URL to a high-quality landscape image.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Target URL (Landing Page)</Label>
                    <Input 
                      required type="url"
                      value={thirdPartyForm.landingUrl}
                      onChange={e => setThirdPartyForm(prev => ({...prev, landingUrl: e.target.value}))}
                      placeholder="https://yourwebsite.com/offer" 
                      className="bg-gray-50 border-gray-200 h-12 rounded-xl focus-visible:ring-green-500"
                    />
                    <p className="text-xs text-gray-400">Where should users go when they click your ad?</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Packages & Checkout */}
              <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 h-fit space-y-6">
                {renderTierSelection()}

                <Button 
                  type="submit"
                  disabled={promoteThirdPartyMutation.isPending || pricingLoading}
                  className="w-full h-14 rounded-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-xl shadow-orange-100/50 mt-4"
                >
                  {promoteThirdPartyMutation.isPending ? "Processing..." : "Pay & Submit Ad ✨"}
                </Button>
                <p className="text-center text-xs text-gray-400 mt-3">Your ad will be reviewed by our team before going live.</p>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* ── EXISING LISTING MODAL (Reused from Dashboard) ── */}
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
                <p className="text-orange-100 text-sm font-medium">Boost visibility across all pages</p>
              </div>
            </div>
            {promoteListingItem && (
              <div className="mt-4 bg-white/20 rounded-2xl px-4 py-3">
                <p className="text-white font-black text-sm truncate">{promoteListingItem.title}</p>
                <p className="text-orange-100 text-xs">NPR {(promoteListingItem.price ?? 0).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Tier & Payment Selection */}
          <div className="p-6 space-y-4">
            {renderTierSelection()}

            <div className="pt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl font-black border-gray-200 text-gray-600"
                onClick={() => setPromoteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-14 rounded-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-xl shadow-orange-100"
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
                      toast.success(`Promotion request submitted! Price: NPR ${data.price}.`);
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

    </div>
  );
}
