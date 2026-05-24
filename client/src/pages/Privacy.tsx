import { Card } from "@/components/ui/card";
import { Lock, Eye, ShieldCheck, Database } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section – EXACT SAME AS OTHER STATIC PAGES */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-green-100 text-base mb-6 max-w-2xl mx-auto">
            Your trust is our priority. Learn how we collect, protect, and use your personal information.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Secure</p>
              <p className="text-xs">SSL</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">100%</p>
              <p className="text-xs">Compliant</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Private</p>
              <p className="text-xs">No Share</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Encrypted</p>
              <p className="text-xs">Passwords</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Card className="p-6 md:p-8 rounded-[2rem] border-none shadow-xl bg-white space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Lock className="w-8 h-8 text-emerald-600" />
            <h2 className="text-xl md:text-2xl font-black text-slate-800">Our Privacy Commitment</h2>
          </div>
          
          <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              At <strong>Sasto Marketplace</strong>, we are committed to maintaining the privacy and security of your personal data. This Privacy Policy details the types of information we collect when you use Sasto, how we utilize and protect this information, and your rights regarding it.
            </p>
            <p>
              By registering an account and utilizing Sasto Marketplace services, you consent to the collection and handling of your data in accordance with the terms outlined in this policy.
            </p>
          </div>
        </Card>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-600" />
              <h3 className="font-black text-lg text-slate-800">Information We Collect</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              - **Account Details**: Username, email address, password, profile verification details.
              - **Listings & Activity**: Pictures uploaded, description of listings, ratings left.
              - **Usage Data**: IP address, device specs, pages visited, and timestamps.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-500" />
              <h3 className="font-black text-lg text-slate-800">How We Use Information</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              - **Service Delivery**: Connecting you with other buyers/sellers, managing chats.
              - **Platform Trust**: Verifying seller identity documents.
              - **Security**: Monitoring active listings to detect and block scam patterns.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="font-black text-lg text-slate-800">Data Protection</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              We leverage advanced industry-standard encryption protocols (SSL/TLS) to secure database transactions. Passwords are securely hashed via bcrypt. Crucially, all private chat messages are encrypted at rest in our database using cryptographically secure **AES-256-CBC symmetric encryption** with dynamic Initialization Vectors (IVs) to safeguard your conversations.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-amber-500" />
              <h3 className="font-black text-lg text-slate-800">Cookies & Tracking</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              We leverage secure local session cookies to handle your authenticated state. These session markers are strictly functional and automatically expire in accordance with standard development lifecycle specs.
            </p>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 pt-6">
          Last updated: May 18, 2026. For questions, contact support@sasto.com.
        </div>
      </main>
    </div>
  );
}