import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Wallet, QrCode, CreditCard, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface PartnerInfo {
  name: string;
  tagline: string;
  desc: string;
  primaryColor: string;
  bgColor: string;
  icon: any;
  features: string[];
  bannerUrl: string;
}

const PARTNER_DATA: Record<string, PartnerInfo> = {
  "prabhu-bank": {
    name: "Prabhu Bank",
    tagline: "Grow Together. Secure Financing Options.",
    desc: "Prabhu Bank is Sasto Marketplace's premier banking partner in Nepal. Through our partnership, verified sellers can access direct seller credits, fast EMI options, and instant merchant deposits.",
    primaryColor: "bg-red-600 hover:bg-red-700 text-white",
    bgColor: "from-red-600 to-red-500",
    icon: CreditCard,
    features: [
      "Low-interest seller business loans up to NPR 10 Lakhs",
      "Instant checkout via Prabhu Bank direct account links",
      "Zero processing fees on Sasto marketplace EMI schemes",
      "Robust, bank-grade double escrow security layers"
    ],
    bannerUrl: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=1200&q=80"
  },
  "fonepay": {
    name: "Fonepay",
    tagline: "Instant QR Payments. Mobile Commerce.",
    desc: "Fonepay is the largest mobile payment network in Nepal, powering secure QR scan payments across Sasto listings. Pay with confidence using any banking app on your phone.",
    primaryColor: "bg-red-500 hover:bg-red-600 text-white",
    bgColor: "from-red-500 to-pink-500",
    icon: QrCode,
    features: [
      "Scan and pay seamlessly with any banking app in Nepal",
      "Instant seller notifications upon payment settlement",
      "Fonepay loyalty points on every Sasto purchase",
      "100% encrypted, secure cashless transaction flows"
    ],
    bannerUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80"
  },
  "esewa": {
    name: "eSewa",
    tagline: "Nepal's Pioneer Digital Wallet. Cashback & Rewards.",
    desc: "eSewa is Nepal's first and leading digital wallet, supporting instant payments, refund settlements, and cashback rewards directly integrated with Sasto Premium Ads.",
    primaryColor: "bg-green-600 hover:bg-green-700 text-white",
    bgColor: "from-green-600 to-emerald-500",
    icon: Wallet,
    features: [
      "10% Cashback on buying Sasto Premium and Highlight ad credits",
      "Instant one-tap digital wallet payments",
      "Instant refund processing for canceled transactions",
      "Comprehensive digital receipt logs for buyer assurance"
    ],
    bannerUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=1200&q=80"
  }
};

export default function PartnerDetail({ params }: { params: { partnerId: string } }) {
  const [, navigate] = useLocation();
  const partnerId = params.partnerId?.toLowerCase() || "";
  const partner = PARTNER_DATA[partnerId];

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <h2 className="text-2xl font-black text-slate-800">Partner Not Found</h2>
        <p className="text-slate-400 mt-2">The partner you are looking for is not listed.</p>
        <Button onClick={() => navigate("/")} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
          Back to Home
        </Button>
      </div>
    );
  }

  // No icon in hero – keep clean and consistent with other pages
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section – EXACT SAME STRUCTURE AS OTHER STATIC PAGES (no logo/icon) */}
      <div className={`bg-gradient-to-r ${partner.bgColor} text-white`}>
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{partner.name}</h1>
          <p className="text-white/90 text-base mb-6 max-w-2xl mx-auto">
            {partner.tagline}
          </p>

          {/* Stats Grid – identical styling */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">100%</p>
              <p className="text-xs">Integrated</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Secure</p>
              <p className="text-xs">Escrow</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Instant</p>
              <p className="text-xs">Checkout</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Nepal</p>
              <p className="text-xs">Wide Coverage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: About & Features */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 md:p-8 rounded-[2rem] border-none shadow-xl bg-white space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Sasto & {partner.name} Partnership
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {partner.desc}
            </p>
          </Card>

          {/* Features Checklist */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider pl-1">Key Integration Features</h3>
            <div className="grid grid-cols-1 gap-3">
              {partner.features.map((feature, idx) => (
                <Card key={idx} className="p-4 rounded-2xl border-none shadow-sm bg-white flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs md:text-sm font-semibold text-slate-700">{feature}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: CTA Card */}
        <div className="md:col-span-1">
          <Card className="p-6 rounded-[2rem] border-none shadow-xl bg-slate-900 text-white text-center space-y-6 flex flex-col justify-between min-h-[300px]">
            <div className="space-y-3">
              <h3 className="text-lg font-bold">Ready to check out securely?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your account now or select **{partner.name}** during checkout to secure your funds with our dual-stage escrow protection.
              </p>
            </div>

            <Button
              onClick={() => navigate("/marketplace")}
              className={`w-full h-12 rounded-xl font-black ${partner.primaryColor} flex items-center justify-center gap-2`}
            >
              Explore Listings
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </div>

      </main>
    </div>
  );
}