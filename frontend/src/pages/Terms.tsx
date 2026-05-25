import { Card } from "@/components/ui/card";
import { Shield, Info, Scale, AlertTriangle, Lock, Key, Server } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section – EXACT SAME AS HELP & ABOUT PAGES */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-green-100 text-base mb-6 max-w-2xl mx-auto">
            Please read these terms carefully before using Sasto Marketplace services.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">2026</p>
              <p className="text-xs">Edition</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">100%</p>
              <p className="text-xs">Transparent</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Verified</p>
              <p className="text-xs">Ads Only</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Fair</p>
              <p className="text-xs">Bidding</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Card className="p-6 md:p-8 rounded-[2rem] border-none shadow-xl bg-white space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Scale className="w-8 h-8 text-emerald-600" />
            <h2 className="text-xl md:text-2xl font-black text-slate-800">User Agreement</h2>
          </div>
          
          <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              Welcome to <strong>Sasto Marketplace</strong>. By accessing or using our platform, website, or mobile application, you agree to be bound by these terms. If you do not agree, please do not use our services.
            </p>
            <p>
              Sasto is a platform connecting buyers, sellers, renters, and bidders across Nepal. We facilitate these interactions but are not a party to the actual transactions between users unless explicitly stated.
            </p>
          </div>
        </Card>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              <h3 className="font-black text-lg text-slate-800">1. Account Security</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Users must provide accurate, current information when registering. You are fully responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. All private messages are encrypted at rest using AES-256-CBC.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="font-black text-lg text-slate-800">2. Prohibited Content</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sellers are strictly forbidden from listing illegal goods, weapons, prescription drugs, stolen property, offensive content, or counterfeit replicas. Violations will result in immediate termination of account services.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-6 h-6 text-emerald-600" />
              <h3 className="font-black text-lg text-slate-800">3. Auctions & Bidding</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bids placed on Sasto Auctions are legally binding. Winning bidders are obligated to fulfill transactions. Shill bidding (bidding on one's own listing) is prohibited.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-500" />
              <h3 className="font-black text-lg text-slate-800">4. Limitation of Liability</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sasto is not liable for transactions made, products sold, quality representations, shipping delivery, or safety of meetings. We advise meeting in public spots and inspecting goods first.
            </p>
          </Card>
        </div>

        {/* Encryption & Security Section */}
        <div className="border-t border-slate-100 pt-8">
          <div className="text-center mb-8">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              Platform Security
            </span>
            <h2 className="text-xl font-black text-slate-800 mt-3">
              5. Data Encryption &amp; Security Obligations
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-2">
              Sasto Marketplace employs state-of-the-art cryptographic systems to protect all user communications and data stored on our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm space-y-3 group hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">AES-256 Message Encryption</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every private message exchanged between users — including buyer-seller negotiations and support chats — is encrypted in the database using AES-256-CBC before storage. Raw message text is never stored in plain form.
              </p>
            </Card>

            <Card className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm space-y-3 group hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Dynamic Cryptographic Salts</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A unique 16-byte Initialization Vector (IV) is generated per message, ensuring two identical texts produce entirely different ciphertexts. This prevents statistical pattern attacks on stored communication data.
              </p>
            </Card>

            <Card className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm space-y-3 group hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">SSL/TLS Transport Security</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                All data exchanged between your browser and our servers — including real-time WebSocket messages — is protected by industry-standard SSL/TLS transport encryption. No third party can intercept your communications in transit.
              </p>
            </Card>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 pt-6">
          Last updated: May 18, 2026. For questions, contact support@sasto.com.
        </div>
      </main>
    </div>
  );
}