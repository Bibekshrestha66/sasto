import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { 
  ArrowLeft, ShoppingCart, Truck, CreditCard, User, MapPin, Phone, Mail, Calendar, ShieldCheck 
} from "lucide-react";

interface CartItem {
  id: number;
  title: string;
  price: number;
  image: string;
  sellerId: number;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: cartData, isLoading: isLoadingCart } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated
  });

  const cart = cartData?.items || [];

  // Delivery Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliverySpeed, setDeliverySpeed] = useState<"normal" | "express">("normal");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: activeGateways, isLoading: isLoadingGateways } = trpc.system.getActivePaymentGateways.useQuery();
  const checkoutCartMutation = trpc.transactions.checkoutCart.useMutation();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setAddress(user.location || "");
    }
  }, [user]);

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (isLoadingCart) {
    return <div className="p-8 text-center text-slate-500">Loading checkout...</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <div className="w-24 h-24 bg-orange-50 rounded-[2.5rem] flex items-center justify-center text-orange-500 mx-auto">
            <ShoppingCart className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Your Cart is Empty</h2>
          <p className="text-slate-400 font-medium leading-relaxed">
            Add items from the marketplace first to proceed to checkout.
          </p>
          <Button 
            onClick={() => setLocation("/")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-100"
          >
            Go to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  // Cost calculation
  const subtotal = cart.reduce((acc, item) => acc + ((item.listing.price ?? 0) * item.quantity), 0);
  const deliveryFee = deliverySpeed === "express" ? 500 : 150;
  const total = subtotal + deliveryFee;

  // Delivery estimation logic
  const getDeliveryEstimate = () => {
    if (deliverySpeed === "express") {
      return "Delivered today (within that day)";
    } else {
      const today = new Date();
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 3);
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 7);
      
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)} (arrives after 3 to 7 days)`;
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim() || !email.trim()) {
      toast.error("Please fill in all delivery details");
      return;
    }

    setIsSubmitting(true);
    try {
      await checkoutCartMutation.mutateAsync({
        paymentMethod,
        deliveryName: name,
        deliveryAddress: address,
        deliveryPhone: phone,
        deliveryEmail: email,
        deliverySpeed,
        deliveryFee,
        estDeliveryDate: getDeliveryEstimate(),
      });

      toast.success("Checkout successful! Your order has been placed.");
      setLocation("/buyer/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Checkout failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" /> Checkout
          </h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Delivery Details & Payment */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Delivery Details */}
            <Card className="p-8 border-none shadow-xl rounded-[2rem] bg-white">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="p-2.5 bg-orange-50 text-orange-500 rounded-xl"><User className="w-5 h-5" /></span>
                Delivery Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-500 font-bold text-xs uppercase">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <Input 
                      id="name" 
                      placeholder="Receiver's name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-12 h-13 rounded-xl bg-slate-50/50 border-slate-100 font-bold" 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-500 font-bold text-xs uppercase">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <Input 
                      id="phone" 
                      placeholder="98XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-12 h-13 rounded-xl bg-slate-50/50 border-slate-100 font-bold" 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-slate-500 font-bold text-xs uppercase">Delivery Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <Input 
                      id="address" 
                      placeholder="Street, City, District"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-12 h-13 rounded-xl bg-slate-50/50 border-slate-100 font-bold" 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email" className="text-slate-500 font-bold text-xs uppercase">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-13 rounded-xl bg-slate-50/50 border-slate-100 font-bold" 
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Logistics/Delivery Method */}
            <Card className="p-8 border-none shadow-xl rounded-[2rem] bg-white">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="p-2.5 bg-orange-50 text-orange-500 rounded-xl"><Truck className="w-5 h-5" /></span>
                Logistics & Speed
              </h3>

              <RadioGroup 
                value={deliverySpeed} 
                onValueChange={(val: any) => setDeliverySpeed(val)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  deliverySpeed === "normal" 
                    ? "border-orange-500 bg-orange-50/30" 
                    : "border-slate-100 hover:border-slate-200"
                }`} onClick={() => setDeliverySpeed("normal")}>
                  <RadioGroupItem value="normal" id="speed-normal" className="mt-1" />
                  <div>
                    <Label htmlFor="speed-normal" className="font-black text-slate-900 block cursor-pointer">
                      Normal Delivery
                    </Label>
                    <span className="text-xs font-black text-orange-600 block mt-0.5">NPR 150</span>
                    <span className="text-xs text-slate-400 font-medium block mt-2">
                      Arrives in 3 to 7 days.
                    </span>
                  </div>
                </div>

                <div className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  deliverySpeed === "express" 
                    ? "border-orange-500 bg-orange-50/30" 
                    : "border-slate-100 hover:border-slate-200"
                }`} onClick={() => setDeliverySpeed("express")}>
                  <RadioGroupItem value="express" id="speed-express" className="mt-1" />
                  <div>
                    <Label htmlFor="speed-express" className="font-black text-slate-900 block cursor-pointer">
                      Express Delivery
                    </Label>
                    <span className="text-xs font-black text-orange-600 block mt-0.5">NPR 500</span>
                    <span className="text-xs text-slate-400 font-medium block mt-2">
                      Arrives within that day (same day delivery).
                    </span>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Payment Method */}
            <Card className="p-8 border-none shadow-xl rounded-[2rem] bg-white">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="p-2.5 bg-orange-50 text-orange-500 rounded-xl"><CreditCard className="w-5 h-5" /></span>
                Payment Method
              </h3>

              <RadioGroup 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                className="space-y-3"
              >
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === "cod" ? "border-orange-500 bg-orange-50/20" : "border-slate-100"
                }`} onClick={() => setPaymentMethod("cod")}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="cod" id="pay-cod" />
                    <Label htmlFor="pay-cod" className="font-bold text-slate-800 cursor-pointer">Cash on Delivery (COD)</Label>
                  </div>
                </div>

                {isLoadingGateways ? (
                  <div className="p-4 text-center text-sm text-slate-400">Loading payment gateways...</div>
                ) : (
                  activeGateways?.map((gw) => (
                    <div 
                      key={gw.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        paymentMethod === gw.name ? "border-orange-500 bg-orange-50/20" : "border-slate-100"
                      }`} 
                      onClick={() => setPaymentMethod(gw.name)}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={gw.name} id={`pay-${gw.name}`} />
                        <Label htmlFor={`pay-${gw.name}`} className="font-bold text-slate-800 cursor-pointer">{gw.displayName}</Label>
                      </div>
                      {gw.name === 'esewa' || gw.name === 'khalti' || gw.name === 'fonepay' ? (
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-md uppercase">Instant</span>
                      ) : null}
                    </div>
                  ))
                )}
              </RadioGroup>
            </Card>
          </div>

          {/* Right Side: Order Summary & Checkout Button */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Cart Items */}
            <Card className="p-8 border-none shadow-xl rounded-[2rem] bg-white">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
                <span>Order Items</span>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-lg text-slate-600 font-black">{cart.length} Item(s)</span>
              </h3>

              <div className="divide-y divide-slate-50 max-h-[220px] overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-50">
                      {Array.isArray(item.listing.images) && item.listing.images.length > 0 ? (
                        <img src={(item.listing.images as any[])[0]} className="w-full h-full object-cover" alt={item.listing.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{item.listing.title} <span className="text-slate-400 font-normal">x{item.quantity}</span></h4>
                      <p className="font-black text-orange-600 text-sm mt-0.5">NPR {((item.listing.price ?? 0) * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Calculations & Submit */}
            <Card className="p-8 border-none shadow-2xl rounded-[2rem] bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
              
              <h3 className="text-xl font-black mb-6">Payment Summary</h3>

              <div className="space-y-4 text-slate-300">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">NPR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Speed ({deliverySpeed === "express" ? "Express" : "Normal"})</span>
                  <span className="font-bold text-white">NPR {deliveryFee.toLocaleString()}</span>
                </div>
                <hr className="border-slate-800" />
                <div className="flex justify-between items-end">
                  <span className="text-sm">Total Price</span>
                  <span className="text-2xl font-black text-orange-400">NPR {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-slate-800/40 p-3.5 rounded-xl border border-slate-800/60">
                  <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Estimated: {getDeliveryEstimate()}</span>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 text-white font-black py-4.5 h-auto text-base rounded-2xl shadow-xl shadow-orange-500/10 transition-transform active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    "Confirm & Place Order"
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest mt-4 font-black">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                Secure Checkout
              </div>
            </Card>
          </div>
          
        </form>
      </div>
    </div>
  );
}
