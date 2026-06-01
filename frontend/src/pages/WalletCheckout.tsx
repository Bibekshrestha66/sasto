import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, Wallet, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const GATEWAY_LOGOS: Record<string, { icon: string; color: string; bg: string }> = {
  esewa: { icon: "🟢", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  khalti: { icon: "💜", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  fonepay: { icon: "🔵", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  visa: { icon: "💳", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
};

export default function WalletCheckout() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const amount = params.get("amount");
  const transactionId = params.get("transactionId");
  const gateway = params.get("gateway") || "esewa";

  const [step, setStep] = useState<"confirm" | "processing" | "success" | "failed">("confirm");
  const [pin, setPin] = useState("");

  const webhookMutation = trpc.ads.walletWebhook.useMutation();

  const handleConfirm = () => {
    if (pin.length < 4) {
      toast.error("Please enter your wallet PIN (min 4 digits)");
      return;
    }
    setStep("processing");
    // Simulate a brief processing delay, then call the webhook
    setTimeout(() => {
      if (transactionId) {
        webhookMutation.mutate({ transactionId, status: "SUCCESS" }, {
          onSuccess: () => {
            setStep("success");
          },
          onError: () => {
            setStep("failed");
          },
        });
      } else {
        setStep("failed");
      }
    }, 2000);
  };

  const gwInfo = GATEWAY_LOGOS[gateway] || GATEWAY_LOGOS.esewa;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {step === "confirm" && (
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <div className={`p-8 text-center border-b-2 ${gwInfo.bg}`}>
              <div className="text-5xl mb-3">{gwInfo.icon}</div>
              <h1 className={`text-2xl font-black ${gwInfo.color} tracking-tight capitalize`}>{gateway} Payment</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Secure Wallet Gateway</p>
            </div>

            {/* Payment Details */}
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Amount to Pay</p>
                <p className="text-4xl font-black text-slate-900">NPR {Number(amount || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Sponsored Ad Promotion Fee</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
                <p className="text-xs text-slate-600 font-mono font-bold break-all">{transactionId}</p>
              </div>

              {/* PIN Entry */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">
                  Wallet PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter 4-6 digit PIN"
                  className="w-full h-14 text-center text-2xl font-black tracking-[0.5em] border-2 border-slate-200 rounded-2xl focus:border-green-500 focus:outline-none transition-colors bg-slate-50 placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-sm placeholder:font-medium"
                />
              </div>

              <Button
                onClick={handleConfirm}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black text-base rounded-2xl shadow-xl shadow-green-100 transition-all active:scale-95"
              >
                Confirm Payment <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <button
                onClick={() => setLocation("/seller/dashboard")}
                className="w-full text-center text-sm text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Cancel & go back
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                256-bit SSL Encrypted
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-2xl animate-in fade-in duration-300">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Processing Payment</h2>
            <p className="text-slate-500 font-medium">Please wait while we verify your payment...</p>
            <div className="flex items-center justify-center gap-1 mt-6">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h2>
            <p className="text-slate-500 font-medium mb-2">
              NPR {Number(amount || 0).toLocaleString()} paid via <span className="font-black capitalize">{gateway}</span>
            </p>
            <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
              Your promotion request is now awaiting admin verification. You'll be notified once it goes live.
            </p>
            <Button
              onClick={() => setLocation("/seller/dashboard")}
              className="w-full h-13 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl shadow-green-100"
            >
              Back to Dashboard
            </Button>
          </div>
        )}

        {step === "failed" && (
          <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-2xl animate-in fade-in duration-300">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Failed</h2>
            <p className="text-slate-500 font-medium mb-8">
              We couldn't process your payment. Please check your PIN and try again.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setStep("confirm")}
                className="w-full h-13 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl"
              >
                Try Again
              </Button>
              <button
                onClick={() => setLocation("/seller/dashboard")}
                className="w-full text-center text-sm text-slate-400 font-bold hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
