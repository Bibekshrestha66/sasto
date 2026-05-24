import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewsList } from "@/components/ReviewsList";
import { MapPin, Phone, Mail, ShieldCheck, Star, ArrowLeft, Package, User } from "lucide-react";

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const userId = parseInt(id || "");

  const { data: profile, isLoading: isProfileLoading } = trpc.users.getProfile.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const { data: listings = [], isLoading: isListingsLoading } = trpc.listings.getByUserId.useQuery(
    userId,
    { enabled: !!userId }
  );

  const { data: reviews = [] } = trpc.reviews.getUserReviews.useQuery(
    userId,
    { enabled: !!userId }
  );

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-700">User not found</h2>
        <Button onClick={() => navigate("/")} className="bg-orange-500 hover:bg-orange-600 text-white">
          Return Home
        </Button>
      </div>
    );
  }

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Banner Section */}
      <div className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">
          {(profile as any).bannerImage && (
            <img src={(profile as any).bannerImage} className="w-full h-full object-cover opacity-40 mix-blend-overlay" alt="Profile banner" />
          )}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50/50 to-transparent" />
      </div>

      <div className="container -mt-32 relative z-10 max-w-6xl mx-auto px-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-white/90 hover:text-white mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Identity Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white/80 backdrop-blur-xl overflow-hidden sticky top-8 p-8 text-center">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 bg-white rounded-[2.5rem] mx-auto flex items-center justify-center text-orange-600 text-4xl font-black shadow-2xl border-8 border-white overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} className="w-full h-full object-cover" alt={`${profile.name || "User"}'s avatar`} />
                  ) : (
                    <span className="text-5xl">{profile.name?.charAt(0).toUpperCase() || "U"}</span>
                  )}
                </div>
                {profile.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 p-2 rounded-2xl shadow-lg border-4 border-white text-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-1 flex items-center justify-center gap-2">
                {profile.businessName || profile.name}
                {profile.isVerified && <ShieldCheck className="w-6 h-6 text-blue-500 inline" title="Verified" />}
              </h2>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge className="bg-orange-100 text-orange-600 border-none px-3 py-1 rounded-lg font-black uppercase text-[10px]">
                  {profile.role}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-8">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Listings</p>
                  <p className="text-xl font-black text-slate-900">{listings.length}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xl font-black text-slate-900">{averageRating}</p>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-left bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                {(profile as any).email && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold truncate">{(profile as any).email}</span>
                  </div>
                )}
                {(profile as any).phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold">{(profile as any).phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold">{(profile as any).location || "Not specified"}</span>
                </div>
              </div>

              {profile.bio && (
                <div className="mt-6 text-left p-5 bg-slate-50/50 rounded-3xl border border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase mb-2">About</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {profile.bio}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Listings and Reviews */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Seller's Listings */}
            <Card className="p-8 border-none shadow-2xl rounded-[2.5rem] bg-white">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Seller's Ads</h3>
                  <p className="text-slate-400 font-bold text-sm">All items currently listed by {profile.name}.</p>
                </div>
              </div>

              {isListingsLoading ? (
                <div className="py-12 text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listings.map((listing: any) => (
                    <div 
                      key={listing.id} 
                      className="group/item relative overflow-hidden border-2 border-slate-50 bg-white p-4 rounded-3xl transition-all hover:border-orange-200 hover:shadow-xl cursor-pointer"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform" alt={listing.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-8 h-8" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="font-black text-slate-900 truncate group-hover/item:text-orange-600 transition-colors">{listing.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-black text-slate-900">NPR {Number(listing.price || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 font-black uppercase text-sm">No active listings</p>
                </div>
              )}
            </Card>

            {/* Seller's Reviews */}
            <Card className="p-8 border-none shadow-2xl rounded-[2.5rem] bg-white">
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900">Customer Reviews</h3>
                <p className="text-slate-400 font-bold text-sm">What others are saying about {profile.name}.</p>
              </div>
              <ReviewsList userId={userId} limit={10} showEmpty={true} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
