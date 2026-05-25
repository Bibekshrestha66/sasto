import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Heart, MessageSquare, Share2, MapPin, Clock, Star, Phone, Mail, BadgeCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { ReviewsList } from "@/components/ReviewsList";
import { ReviewForm } from "@/components/ReviewForm";
import { UserRatingBadge } from "@/components/UserRatingBadge";
import { Button } from "@/components/ui/button";
import { MapComponent } from "@/components/MapComponent";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const professionalRoles = ["seller", "dealer", "wholesaler", "distributor", "admin", "super_admin"];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bookingDates, setBookingDates] = useState({ startDate: "", endDate: "" });
  const [showBidForm, setShowBidForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  const listingId = id ? parseInt(id, 10) : 0;
  const { data: listing, isLoading: listingLoading } = trpc.listings.getById.useQuery(
    listingId,
    { enabled: !!listingId }
  );

  const { data: seller } = trpc.users.getProfile.useQuery(
    { userId: listing?.userId || "" },
    { enabled: !!listing?.userId }
  );

  const { data: reviews } = trpc.reviews.getUserReviews.useQuery(
    listing?.userId || 0,
    { enabled: !!listing?.userId }
  );

  const { data: favorites } = trpc.favorites.list.useQuery();

  const placeBidMutation = trpc.auctions.placeBid.useMutation({
    onSuccess: () => { toast.success("Bid placed!"); setBidAmount(""); setShowBidForm(false); },
    onError: (e) => toast.error(e.message || "Failed to place bid"),
  });

  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: () => { toast.success("Booking created!"); setBookingDates({ startDate: "", endDate: "" }); setShowBookingForm(false); },
    onError: (e) => toast.error(e.message || "Failed to create booking"),
  });

  const toggleFavoriteMutation = (trpc.favorites as any).toggle?.useMutation({
    onSuccess: () => { setIsFavorite(!isFavorite); toast.success(isFavorite ? "Removed from favorites" : "Saved!"); },
    onError: () => toast.error("Failed to update favorites"),
  }) || { mutateAsync: async () => { } };

  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => { toast.success("Message sent!"); setContactMessage(""); setShowContactForm(false); },
    onError: (e) => toast.error(e.message || "Failed to send message"),
  });

  const addToCartMutation = trpc.cart.addItem.useMutation({
    onSuccess: () => { 
      toast.success("Added to cart!"); 
      setLocation("/cart"); 
    },
    onError: (e) => toast.error(e.message || "Failed to add to cart"),
  });

  useEffect(() => {
    if (favorites && listing) {
      setIsFavorite(favorites.some((fav: any) => fav.listingId === listing.id));
    }
  }, [favorites, listing]);

  const handlePlaceBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) { toast.error("Enter a valid bid amount"); return; }
    if (!isAuthenticated) { toast.error("Please login to bid"); return; }
    await placeBidMutation.mutateAsync({ auctionId: listing!.id, amount: parseFloat(bidAmount) });
  };

  const handleCreateBooking = async () => {
    if (!bookingDates.startDate || !bookingDates.endDate) { toast.error("Select both dates"); return; }
    if (!isAuthenticated) { toast.error("Please login to book"); return; }
    await createBookingMutation.mutateAsync({
      listingId: listing!.id,
      startDate: new Date(bookingDates.startDate),
      endDate: new Date(bookingDates.endDate),
      totalPrice: listing!.price || 0,
    } as any);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) { toast.error("Please login to save"); return; }
    await toggleFavoriteMutation.mutateAsync({ listingId: listing!.id });
  };

  const checkCanTransact = () => {
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      return false;
    }

    if (user?.role === "super_admin" || user?.role === "admin") return true;

    if (!professionalRoles.includes(user?.role || "")) {
      toast.error("Only professional accounts (Seller, Dealer, etc.) can buy or bid");
      return false;
    }

    if (!user?.isVerified) {
      toast.error("Please verify your account to buy or bid");
      setLocation("/verification");
      return false;
    }

    return true;
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim()) { toast.error("Enter a message"); return; }
    if (!isAuthenticated) { toast.error("Please login"); return; }
    await sendMessageMutation.mutateAsync({ recipientId: listing!.userId, content: contactMessage });
  };

  const images = listing?.images && Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : [
      `https://picsum.photos/seed/${listingId}a/800/600`,
      `https://picsum.photos/seed/${listingId}b/800/600`,
      `https://picsum.photos/seed/${listingId}c/800/600`,
    ];

  if (listingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Loading listing…</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">😕</div>
          <h2 className="text-xl font-bold text-gray-700">Listing not found</h2>
          <p className="text-gray-400">This listing may have been removed or expired.</p>
          <Button onClick={() => setLocation("/marketplace")} className="bg-green-600 hover:bg-green-700 text-white">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const conditionColor: Record<string, string> = {
    new: "bg-emerald-500",
    "like-new": "bg-blue-500",
    good: "bg-amber-500",
    fair: "bg-orange-500",
  };
  const conditionLabel: Record<string, string> = {
    new: "New", "like-new": "Like New", good: "Good", fair: "Fair",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Breadcrumb Bar */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <button
            onClick={() => setLocation("/marketplace")}
            className="text-gray-500 hover:text-green-600 font-medium transition"
          >
            ← Marketplace
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-semibold truncate max-w-xs">{listing.title}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative w-full bg-gray-50 flex items-center justify-center min-h-[300px]">
                <img
                  src={images[selectedImageIndex]}
                  alt={listing.title}
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                />
                <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  {listing.type === "auction" ? "🔨 Auction" : listing.type === "rental" ? "🏠 Rental" : "🛍️ For Sale"}
                </span>
                <button
                  onClick={handleToggleFavorite}
                  className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full shadow transition ${isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-gray-500 hover:bg-white"}`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-white" : ""}`} />
                </button>
              </div>
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${selectedImageIndex === idx ? "border-green-500" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Price */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{listing.title}</h1>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center border border-gray-200 rounded-full text-gray-400 hover:text-green-600 hover:border-green-300 transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span className="text-3xl font-extrabold text-green-600">
                  NPR {(listing.price ?? 0).toLocaleString()}
                </span>
                {listing.condition && (
                  <span className={`text-xs font-semibold text-white px-2.5 py-1 rounded-full ${conditionColor[listing.condition] || "bg-gray-500"}`}>
                    {conditionLabel[listing.condition] || listing.condition}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                {listing.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{listing.location}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(listing.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-800 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                {listing.description || "No description provided."}
              </p>

              {(listing.location || listing.district) && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Item Location
                  </h3>
                  <MapComponent location={listing.location || ""} district={listing.district || ""} />
                </div>
              )}
            </div>

            {/* Auction Details */}
            {listing.type === "auction" && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h2 className="text-base font-bold text-amber-800 mb-3">🔨 Auction Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-amber-600 text-xs font-semibold uppercase mb-1">Starting Price</p>
                    <p className="font-bold text-amber-900">NPR {(listing.price ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-amber-600 text-xs font-semibold uppercase mb-1">Current Bid</p>
                    <p className="font-bold text-amber-900">NPR {((listing.price ?? 0) * 1.2).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rental Details */}
            {listing.type === "rental" && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h2 className="text-base font-bold text-blue-800 mb-3">🏠 Rental Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 text-xs font-semibold uppercase mb-1">Daily Rate</p>
                    <p className="font-bold text-blue-900">NPR {(listing.price ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-semibold uppercase mb-1">Availability</p>
                    <p className="font-bold text-green-700">Available</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4">Reviews & Ratings</h2>
              {seller && <div className="mb-4"><UserRatingBadge userId={seller.id} showDetails={true} /></div>}
              {isAuthenticated && user?.id !== listing?.userId && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-sm text-green-800 mb-3">Leave a Review</h4>
                  <ReviewForm toUserId={listing?.userId || 0} listingId={Number(id) || 0} onSuccess={() => toast.success("Review submitted!")} />
                </div>
              )}
              {seller && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Customer Reviews</h4>
                  <ReviewsList userId={seller.id} limit={10} showEmpty={true} />
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">

            {/* Seller Card */}
            {seller && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Seller</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-extrabold text-lg flex-shrink-0">
                    {(seller.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900">{seller.name}</p>
                      {seller.verificationStatus === "verified" && (
                        <span title="Verified Seller"><BadgeCheck className="w-4 h-4 text-blue-500" /></span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round((seller as any).rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">({(seller as any).rating?.toFixed(1) || "0.0"})</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  {(seller as any).phone && (
                    <a href={`tel:${(seller as any).phone}`} className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition">
                      <Phone className="w-4 h-4" />{(seller as any).phone}
                    </a>
                  )}
                  {(seller as any).email && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail className="w-4 h-4" />{(seller as any).email}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setLocation(`/profile/${seller.id}`)}
                  className="w-full py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-600 transition"
                >
                  View Profile
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              {listing.type === "auction" && (
                <>
                  <button onClick={() => {
                    if (checkCanTransact()) setShowBidForm(!showBidForm);
                  }} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition text-sm">
                    🔨 Place a Bid
                  </button>
                  {showBidForm && (
                    <div className="space-y-2">
                      <input type="number" placeholder="Bid amount (NPR)" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                      <button onClick={handlePlaceBid} disabled={placeBidMutation.isPending}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60">
                        {placeBidMutation.isPending ? "Placing…" : "Confirm Bid"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {listing.type === "rental" && (
                <>
                  <button onClick={() => {
                    if (checkCanTransact()) setShowBookingForm(!showBookingForm);
                  }} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm">
                    📅 Book Now
                  </button>
                  {showBookingForm && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Start Date</label>
                        <input type="date" value={bookingDates.startDate} onChange={(e) => setBookingDates({ ...bookingDates, startDate: e.target.value })}
                          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">End Date</label>
                        <input type="date" value={bookingDates.endDate} onChange={(e) => setBookingDates({ ...bookingDates, endDate: e.target.value })}
                          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      </div>
                      <button onClick={handleCreateBooking} disabled={createBookingMutation.isPending}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60">
                        {createBookingMutation.isPending ? "Booking…" : "Confirm Booking"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {(!listing.type || listing.type === "marketplace") && (
                <button
                  onClick={() => {
                    if (checkCanTransact()) {
                      addToCartMutation.mutate({ listingId: listing.id, quantity: 1 });
                    }
                  }}
                  disabled={addToCartMutation.isPending}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition text-sm shadow-md disabled:opacity-60"
                >
                  {addToCartMutation.isPending ? "Adding..." : "🛍️ Add to Cart"}
                </button>
              )}

              <button onClick={() => setShowContactForm(!showContactForm)}
                className="w-full py-2.5 border-2 border-green-200 text-green-700 font-semibold rounded-xl text-sm hover:bg-green-50 transition flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Contact Seller
              </button>

              <button onClick={handleToggleFavorite}
                className={`w-full py-2.5 border-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${isFavorite ? "border-red-300 text-red-600 bg-red-50" : "border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500"}`}>
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                {isFavorite ? "Saved" : "Save to Favorites"}
              </button>
            </div>

            {/* Contact Form */}
            {showContactForm && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Message to Seller</h4>
                <textarea placeholder="Hi, I'm interested in this item…" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)}
                  rows={4} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" />
                <button onClick={handleSendMessage} disabled={sendMessageMutation.isPending}
                  className="mt-2 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60">
                  {sendMessageMutation.isPending ? "Sending…" : "Send Message"}
                </button>
              </div>
            )}

            {/* Safety Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <h4 className="text-sm font-bold text-amber-800 mb-2">⚠️ Safety Tips</h4>
              <ul className="text-xs text-amber-700 space-y-1.5">
                <li>✓ Meet in a safe public location</li>
                <li>✓ Inspect the item before payment</li>
                <li>✓ Use secure payment methods</li>
                <li>✓ Don't share sensitive information</li>
                <li>✓ Report suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
