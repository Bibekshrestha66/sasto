import { Card } from "@/components/ui/card";
import { ShieldAlert, CheckCircle, HelpCircle, Eye, AlertTriangle } from "lucide-react";

export default function SafetyTips() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section – EXACT SAME AS OTHER STATIC PAGES */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Safety Tips</h1>
          <p className="text-green-100 text-base mb-6 max-w-2xl mx-auto">
            Stay secure while trading. Essential safety guidelines for buyers and sellers on Sasto.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Public</p>
              <p className="text-xs">Meeting Spots</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Secure</p>
              <p className="text-xs">Escrows</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Verify</p>
              <p className="text-xs">First</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">100%</p>
              <p className="text-xs">Safe Trade</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left column: Buyers Safety */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <CheckCircle className="w-8 h-8 text-emerald-600 animate-pulse" />
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider">Guidelines for Buyers</h2>
          </div>

          <Card className="p-6 rounded-3xl border-none shadow-md bg-white space-y-4">
            <div className="flex gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold rounded-full text-xs shrink-0 mt-0.5">1</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">Meet in Public Spaces</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Always choose public, crowded places like shopping centers, cafes, or highly recognized landmarks to meet the seller. Never go to remote or private spots alone.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-md bg-white space-y-4">
            <div className="flex gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold rounded-full text-xs shrink-0 mt-0.5">2</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">Inspect Before You Pay</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Carefully examine and test the item (power it on, check labels, verify serial numbers, check for physical defects) before handing over any payment.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-md bg-white space-y-4">
            <div className="flex gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold rounded-full text-xs shrink-0 mt-0.5">3</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">Beware of Unrealistically Low Prices</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  If an advertisement has a price tag that is way below market value (e.g. an iPhone 15 Pro Max for NPR 30,000), treat it with suspicion. It could be a scam or counterfeit replica.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: Sellers Safety */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider">Guidelines for Sellers</h2>
          </div>

          <Card className="p-6 rounded-3xl border-none shadow-md bg-white space-y-4">
            <div className="flex gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-700 font-bold rounded-full text-xs shrink-0 mt-0.5">1</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">Verify Payment Integrity</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  If accepting digital payments (eSewa, Fonepay, Prabhu Bank transfer), check your account balance directly in your bank application. Do not rely solely on screenshot evidence shown by the buyer.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-md bg-white space-y-4">
            <div className="flex gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-700 font-bold rounded-full text-xs shrink-0 mt-0.5">2</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">Avoid Advanced Deliveries Without Escrow</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Do not ship products to the buyer before receiving complete, verified payment, or utilize a reliable third-party logistics escrow delivery solution.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-md bg-white space-y-4">
            <div className="flex gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-700 font-bold rounded-full text-xs shrink-0 mt-0.5">3</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">Keep Communication on Sasto</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Leverage the Sasto Marketplace chat room for discussions. Keep all logs of agreement inside the platform to back up any dispute resolution claims.
                </p>
              </div>
            </div>
          </Card>
        </div>

      </main>
    </div>
  );
}