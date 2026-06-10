import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Star, MapPin, Phone, Mail, Edit2, LogOut, User, 
  Package, Tag, Settings, MessageSquare, ShieldCheck, 
  Briefcase, Camera, Trash2, ExternalLink,
  ChevronRight, ArrowUpRight, Loader2, ShoppingCart
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { authFetch } from "@/lib/authFetch";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface Listing {
  id: number;
  title: string;
  price: number;
  discount?: number;
  originalPrice?: number;
  location?: string;
  images?: string[];
  createdAt: string;
}

interface Review {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewerName?: string;
}

// ----------------------------------------------------------------------
// File upload helper (pre‑signed URL)
// ----------------------------------------------------------------------
const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const res = await authFetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { url, fileId } = await res.json();
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      return fileId;
    } finally {
      setIsUploading(false);
    }
  };
  return { uploadFile, isUploading };
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const utils = trpc.useUtils();
  
  const isProfessional = user ? ["seller", "dealer", "wholesaler", "distributor", "admin", "super_admin"].includes(user.role) : false;
  
  const [activeTab, setActiveTab] = useState(isProfessional ? "listings" : "settings");
  
  // Ensure the tab defaults to settings if user changes or loads and is not professional
  useEffect(() => {
    if (user) {
      const isProf = ["seller", "dealer", "wholesaler", "distributor", "admin", "super_admin"].includes(user.role);
      if (!isProf && activeTab !== "settings") {
        setActiveTab("settings");
      } else if (isProf && activeTab === "settings" && !window.location.hash.includes("settings")) {
        // Only switch back to listings automatically if they didn't explicitly want settings
        setActiveTab("listings");
      }
    }
  }, [user]);

  const [selectedDealListing, setSelectedDealListing] = useState<any | null>(null);
  const [dealPrice, setDealPrice] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFileUpload();
  const [, navigate] = useLocation();

  // Form state (synchronized with user)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    businessName: "",
    businessLicense: "",
    experienceYears: 0,
    specialties: "",
  });

  // Sync formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
        businessName: user.businessName || "",
        businessLicense: user.businessLicense || "",
        experienceYears: user.experienceYears || 0,
        specialties: user.specialties || "",
      });
    }
  }, [user]);

  // Queries
  const { data: myListings = [], isLoading: listingsLoading, refetch: refetchListings } = 
    trpc.listings.myListings.useQuery(undefined, { enabled: !!user });
  
  const { data: userReviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = 
    trpc.reviews.getUserReviews.useQuery(user?.id || 0, { enabled: !!user?.id });

  // Compute average rating
  const averageRating = useMemo(() => {
    if (!userReviews.length) return 0;
    const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / userReviews.length).toFixed(1);
  }, [userReviews]);

  // Deals filtered from listings (using discount)
  const myDeals = useMemo(() => {
    return myListings.filter(l => (l.discount || 0) > 0).map(l => ({
      ...l,
      originalPrice: l.originalPrice || (Number(l.price || 0) / (1 - (l.discount || 0) / 100))
    }));
  }, [myListings]);

  // Mutations
  const updateProfile = (trpc as any).auth.updateProfile.useMutation();

  const deleteListing = (trpc as any).seller.deleteListing.useMutation();

  const updateListingPrice = (trpc as any).seller.updateListingPrice.useMutation();

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSave = () => {
    updateProfile.mutate(formData, {
      onSuccess: () => {
        toast.success("Profile updated!");
        refresh();
        utils.auth.me.invalidate();
      },
      onError: (err: any) => toast.error(err.message || "Update failed"),
    });
  };

  const handleDeleteListing = (id: number) => {
    if (confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      deleteListing.mutate({ listingId: id }, {
        onSuccess: () => {
          toast.success("Listing deleted");
          refetchListings();
        },
        onError: (err: any) => toast.error(err.message || "Delete failed"),
      });
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const fileId = await uploadFile(file);
      updateProfile.mutate({ avatar: fileId }, {
        onSuccess: () => {
          toast.success("Profile updated!");
          refresh();
          utils.auth.me.invalidate();
        },
        onError: (err: any) => toast.error(err.message || "Update failed"),
      });
    } catch (error) {
      toast.error("Avatar upload failed");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    setIsUploadingBanner(true);
    try {
      const fileId = await uploadFile(file);
      updateProfile.mutate({ bannerImage: fileId }, {
        onSuccess: () => {
          toast.success("Profile updated!");
          refresh();
          utils.auth.me.invalidate();
        },
        onError: (err: any) => toast.error(err.message || "Update failed"),
      });
    } catch (error) {
      toast.error("Banner upload failed");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-10 text-center border-none shadow-2xl rounded-[2.5rem] bg-white max-w-md w-full">
          <div className="w-24 h-24 bg-green-50 rounded-[2rem] mx-auto flex items-center justify-center text-green-600 mb-8">
            <User className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">Login Required</h2>
          <p className="text-gray-500 font-medium mb-10">Access your premium profile dashboard.</p>
          <Button 
            onClick={() => navigate("/login")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black h-16 rounded-2xl shadow-xl"
          >
            Access My Profile
          </Button>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Banner Section with Upload */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden group/banner">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500">
          {user.bannerImage && (
            <img src={user.bannerImage} className="w-full h-full object-cover opacity-40 mix-blend-overlay" alt="Profile banner" />
          )}
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 transition-all z-10"
          aria-label="Upload banner image"
          disabled={isUploadingBanner}
        >
          {isUploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleBannerUpload(file);
          }}
        />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50/50 to-transparent" />
      </div>

      <div className="container -mt-32 relative z-10 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Identity Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white/80 backdrop-blur-xl overflow-hidden sticky top-8">
              <div className="p-8 text-center">
                <div className="relative inline-block mb-6 group">
                  <div className="w-32 h-32 bg-white rounded-[2.5rem] mx-auto flex items-center justify-center text-green-600 text-4xl font-black shadow-2xl border-8 border-white overflow-hidden transition-transform group-hover:rotate-3">
                    {user.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" alt={`${user.name || "User"}'s avatar`} />
                    ) : (
                      <span className="text-5xl">{user.name?.charAt(0).toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-green-600 p-2 rounded-full text-white shadow-lg hover:bg-green-700 transition-all"
                    aria-label="Upload avatar"
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                  {user.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 p-2 rounded-2xl shadow-lg border-4 border-white text-white">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-black text-slate-900 mb-1 flex items-center justify-center gap-2">
                  {user.businessName || user.name || "Sasto User"}
                  {user.isVerified && (
                    <span title="Verified" aria-label="Verified">
                      <ShieldCheck className="w-6 h-6 text-blue-500 inline" aria-hidden="true" />
                    </span>
                  )}
                </h2>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Badge className="bg-green-100 text-green-600 border-none px-3 py-1 rounded-lg font-black uppercase text-[10px]">
                    {user.role}
                  </Badge>
                  {isProfessional && (
                    <Badge className="bg-blue-100 text-blue-600 border-none px-3 py-1 rounded-lg font-black uppercase text-[10px]">
                      {user.verificationLevel || "Verified"}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-8">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Listings</p>
                    <p className="text-xl font-black text-slate-900">{myListings.length}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Deals</p>
                    <p className="text-xl font-black text-slate-900">{myDeals.length}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Rating</p>
                    <p className="text-xl font-black text-slate-900">{averageRating || "—"}</p>
                  </div>
                </div>

                <div className="space-y-3 text-left bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold">{user.phone || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold">{user.location || "Nepal"}</span>
                  </div>
                  {user.experienceYears && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Briefcase className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-bold">{user.experienceYears} Years Experience</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 mt-8">
                  <Button 
                    onClick={() => navigate("/buyer/dashboard")}
                    className="w-full bg-slate-900 hover:bg-black text-white rounded-2xl font-black py-6 shadow-lg shadow-slate-900/10"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buyer Dashboard
                  </Button>
                  {user && ["seller", "dealer", "wholesaler", "distributor", "admin", "super_admin"].includes(user.role || "") && (
                    <Button 
                      onClick={() => navigate("/seller/dashboard")}
                      className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black py-6 shadow-lg shadow-green-600/10"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Seller Dashboard
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("settings")}
                    className="w-full border-2 border-slate-100 hover:border-green-500 hover:bg-green-50 rounded-2xl font-black py-6"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full text-slate-400 hover:text-red-500 font-black"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Tabs */}
          <div className={`lg:col-span-8 ${!isProfessional ? "lg:col-start-3" : ""}`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
              <TabsList className={`w-full bg-white/50 backdrop-blur-md p-1.5 rounded-[2rem] h-auto grid gap-1 md:gap-2 shadow-xl ${isProfessional ? 'grid-cols-4' : 'grid-cols-1 max-w-md mx-auto'}`}>
                {isProfessional && (
                  <>
                    <TabsTrigger value="listings" className="rounded-2xl py-2 px-1 md:py-4 md:px-6 font-black text-[9px] md:text-xs uppercase tracking-normal md:tracking-widest data-[state=active]:bg-green-600 data-[state=active]:text-white flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0">
                      <Package className="w-4 h-4 md:mr-2" />
                      <span>Listings</span>
                    </TabsTrigger>
                    <TabsTrigger value="deals" className="rounded-2xl py-2 px-1 md:py-4 md:px-6 font-black text-[9px] md:text-xs uppercase tracking-normal md:tracking-widest data-[state=active]:bg-green-600 data-[state=active]:text-white flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0">
                      <Tag className="w-4 h-4 md:mr-2" />
                      <span>My Deals</span>
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="rounded-2xl py-2 px-1 md:py-4 md:px-6 font-black text-[9px] md:text-xs uppercase tracking-normal md:tracking-widest data-[state=active]:bg-green-600 data-[state=active]:text-white flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0">
                      <Star className="w-4 h-4 md:mr-2" />
                      <span>Reviews</span>
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="settings" className="rounded-2xl py-2 px-1 md:py-4 md:px-6 font-black text-[9px] md:text-xs uppercase tracking-normal md:tracking-widest data-[state=active]:bg-green-600 data-[state=active]:text-white flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0">
                  <Settings className="w-4 h-4 md:mr-2" />
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>

              {isProfessional && (
                <>
                  {/* Listings Tab */}
                  <TabsContent value="listings" className="mt-0">
                <Card className="p-8 border-none shadow-2xl rounded-[2.5rem] bg-white">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Active Listings</h3>
                      <p className="text-slate-400 font-bold text-sm">You have {myListings.length} items live.</p>
                    </div>
                    <Button onClick={() => navigate("/post-listing")} className="bg-slate-900 hover:bg-black text-white font-black px-6 py-6 rounded-2xl shadow-xl">
                      Post New Ad
                    </Button>
                  </div>
                  {listingsLoading ? (
                    <div className="py-20 text-center"><Loader2 className="animate-spin w-8 h-8 text-green-600 mx-auto" /></div>
                  ) : myListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myListings.map((listing) => (
                        <div key={listing.id} className="group/item relative overflow-hidden border-none bg-slate-50 p-4 rounded-3xl transition-all hover:bg-white hover:shadow-2xl">
                          <div className="flex gap-4">
                            <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                              {(listing.images as any)?.[0] ? (
                                <img src={(listing.images as any)[0]} className="w-full h-full object-cover" alt={listing.title} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100"><Package className="w-8 h-8" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-900 truncate group-hover/item:text-green-600">{listing.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg font-black text-slate-900">NPR {Number(listing.price || 0).toLocaleString()}</span>
                                {listing.discount && <Badge className="bg-green-100 text-green-600 text-[9px] font-black">-{listing.discount}%</Badge>}
                              </div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mt-2 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" /> {listing.location || "Nepal"}
                              </p>
                            </div>
                            <div className="flex flex-col justify-between">
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteListing(listing.id)} aria-label="Delete listing">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-300 hover:text-emerald-500 hover:bg-emerald-50" onClick={() => {
                                setSelectedDealListing(listing);
                                setDealPrice(String(listing.price || ""));
                                setOriginalPrice(String(listing.originalPrice || listing.price || ""));
                              }} aria-label="Manage deal price">
                                <Tag className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-300 hover:text-green-500 hover:bg-green-50" onClick={() => navigate(`/listing/${listing.id}`)} aria-label="View listing">
                                <ArrowUpRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase text-sm">No listings yet</p>
                      <Button variant="link" onClick={() => navigate("/post-listing")} className="text-green-600 font-black mt-2">Start Selling</Button>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Deals Tab */}
              <TabsContent value="deals" className="mt-0">
                <Card className="p-8 border-none shadow-2xl rounded-[2.5rem] bg-white">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">My Active Deals</h3>
                      <p className="text-slate-400 font-bold text-sm">Items with discounts.</p>
                    </div>
                    <Badge className="bg-green-50 text-green-600 border-none px-4 py-2 rounded-xl font-black uppercase text-xs">{myDeals.length} Active Deals</Badge>
                  </div>
                  {myDeals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {myDeals.map((listing) => (
                        <div key={listing.id} className="relative group/deal">
                          <div className="absolute -top-2 -right-2 z-20 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl animate-pulse">-{listing.discount}% OFF</div>
                          <Card className="overflow-hidden border-2 border-slate-50 hover:border-green-200 transition-all rounded-[2rem] bg-white">
                            <div className="relative h-40">
                              {(listing.images as any)?.[0] ? (
                                <img src={(listing.images as any)[0]} className="w-full h-full object-cover transition-transform group-hover/deal:scale-110" alt={listing.title} />
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><Tag className="w-12 h-12" /></div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-4 left-4"><h4 className="text-white font-black text-lg truncate">{listing.title}</h4></div>
                            </div>
                            <div className="p-6">
                              <div className="flex items-end gap-3 mb-4">
                                <span className="text-2xl font-black text-slate-900">NPR {Number(listing.price || 0).toLocaleString()}</span>
                                <span className="text-sm font-bold text-slate-400 line-through mb-1">NPR {Number(listing.originalPrice || 0).toLocaleString()}</span>
                              </div>
                              <Button className="w-full bg-slate-50 hover:bg-green-600 hover:text-white font-black rounded-xl" onClick={() => navigate(`/listing/${listing.id}`)}>View Deal</Button>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <Tag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase text-sm">No active deals</p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-0">
                <Card className="p-8 border-none shadow-2xl rounded-[2.5rem] bg-white">
                  <h3 className="text-2xl font-black text-slate-900 mb-8">Recent Feedback</h3>
                  {reviewsLoading ? (
                    <div className="py-20 text-center"><Loader2 className="animate-spin w-8 h-8 text-green-600 mx-auto" /></div>
                  ) : userReviews.length > 0 ? (
                    <div className="space-y-6">
                      {userReviews.map((review) => (
                        <div key={review.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 font-black shadow-sm">
                                {(review as any).reviewerName?.charAt(0).toUpperCase() || "A"}
                              </div>
                              <div>
                                <p className="font-black text-slate-900">{(review as any).reviewerName || "Anonymous Buyer"}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(review.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, j) => (
                                <Star key={j} className={`w-4 h-4 ${j < review.rating ? "fill-orange-500 text-green-500" : "text-slate-200"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 font-medium italic">"{review.comment || "No written review, but rated highly."}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase text-sm">No reviews yet</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
              </>
            )}

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-0">
                <Card className="p-10 border-none shadow-2xl rounded-[3rem] bg-white">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900">Profile Settings</h3>
                      <p className="text-slate-400 font-medium mt-1">Manage your account details.</p>
                    </div>
                    <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl">
                      <Settings className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-300 uppercase ml-1">Basic Identity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="name" value={formData.name} onChange={handleChange} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" placeholder="Full Name" />
                        <Input name="email" value={formData.email} onChange={handleChange} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" placeholder="Email" />
                        <Input name="phone" value={formData.phone} onChange={handleChange} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" placeholder="Phone" />
                        <Input name="location" value={formData.location} onChange={handleChange} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" placeholder="Location" />
                      </div>
                    </div>
                    {isProfessional && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-black text-blue-400 uppercase ml-1">Business Credentials</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input name="businessName" value={formData.businessName} onChange={handleChange} className="h-14 rounded-2xl bg-blue-50/50 border-none font-bold text-blue-900" placeholder="Business Name" />
                          <Input name="businessLicense" value={formData.businessLicense} onChange={handleChange} className="h-14 rounded-2xl bg-blue-50/50 border-none font-bold text-blue-900" placeholder="License #" />
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-2 block">Years of Experience</label>
                            <Input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="h-14 rounded-2xl bg-blue-50/50 border-none font-bold" placeholder="Years" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-black text-slate-300 uppercase ml-1">Bio</h4>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold min-h-[150px] focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="Tell buyers about yourself or your business..."
                      />
                    </div>
                    <div className="flex gap-4 pt-6">
                      <Button onClick={handleSave} disabled={updateProfile.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white h-16 rounded-[1.5rem] font-black shadow-xl text-lg">
                        {updateProfile.isPending ? "Saving..." : "Save All Changes"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Edit Price / Manage Deal Dialog */}
      <Dialog open={selectedDealListing !== null} onOpenChange={(open) => !open && setSelectedDealListing(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-6 h-6 text-emerald-500" />
              Manage Price & Deal
            </DialogTitle>
          </DialogHeader>

          {selectedDealListing && (
            <div className="space-y-6 mt-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Item Title</p>
                <p className="font-bold text-slate-800 line-clamp-1">{selectedDealListing.title}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Current Listed Price: <span className="font-extrabold text-slate-700">NPR {Number(selectedDealListing.price || 0).toLocaleString()}</span>
                  {selectedDealListing.discount && (
                    <span className="text-emerald-600 font-bold ml-2">({selectedDealListing.discount}% Discount active)</span>
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Original Baseline Price (NPR)
                  </Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    placeholder="e.g. 10000"
                  />
                  <p className="text-[10px] text-slate-400">
                    This represents the original, standard price of the listing before any discount is applied.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dealPrice" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Discounted Deal Price (NPR)
                  </Label>
                  <Input
                    id="dealPrice"
                    type="number"
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold border-2 border-emerald-500 focus-visible:ring-emerald-500"
                    placeholder="e.g. 8000"
                  />
                  <p className="text-[10px] text-slate-400">
                    Entering a price lower than the original price automatically creates a deal and surfaces it on the Deals & Offers page!
                  </p>
                </div>

                {/* Dynamic discount live preview */}
                {(() => {
                  const orig = parseFloat(originalPrice);
                  const deal = parseFloat(dealPrice);
                  if (orig > 0 && deal > 0 && orig > deal) {
                    const pct = Math.round(((orig - deal) / orig) * 100);
                    return (
                      <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl font-bold flex items-center justify-between border border-emerald-100 animate-pulse">
                        <span className="text-xs">Live Discount Preview:</span>
                        <span className="text-sm font-black bg-emerald-600 text-white px-2.5 py-1 rounded-lg">-{pct}% OFF</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    const priceVal = parseFloat(dealPrice);
                    const origVal = parseFloat(originalPrice);
                    if (isNaN(priceVal) || priceVal <= 0) {
                      toast.error("Please enter a valid price");
                      return;
                    }
                    updateListingPrice.mutate({
                      listingId: selectedDealListing.id,
                      price: priceVal,
                      originalPrice: !isNaN(origVal) && origVal > priceVal ? origVal : null,
                    }, {
                      onSuccess: () => {
                        toast.success("Price/Deal updated successfully!");
                        refetchListings();
                        setSelectedDealListing(null);
                      },
                      onError: (err: any) => toast.error(err.message || "Failed to update price/deal"),
                    });
                  }}
                  disabled={updateListingPrice.isPending}
                  className="flex-1 bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-black shadow-md"
                >
                  {updateListingPrice.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Save Changes"}
                </Button>

                {(selectedDealListing.discount || selectedDealListing.originalPrice) && (
                  <Button
                    onClick={() => {
                      const origVal = selectedDealListing.originalPrice || selectedDealListing.price;
                      updateListingPrice.mutate({
                        listingId: selectedDealListing.id,
                        price: origVal,
                        originalPrice: null,
                      }, {
                        onSuccess: () => {
                          toast.success("Price/Deal updated successfully!");
                          refetchListings();
                          setSelectedDealListing(null);
                        },
                        onError: (err: any) => toast.error(err.message || "Failed to update price/deal"),
                      });
                    }}
                    variant="outline"
                    disabled={updateListingPrice.isPending}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 rounded-xl font-black"
                  >
                    Clear Deal
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
