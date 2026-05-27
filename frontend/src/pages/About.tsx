import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Users, Zap, Shield, Lock, Key, Server } from "lucide-react";
import { trpc } from "@/lib/trpc";

// ─────────────────────────────────────────────────────────────
// Utility – format raw DB count into readable short form
// ─────────────────────────────────────────────────────────────
function formatCount(n?: number): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K+`;
  return String(n);
}

export default function About() {
  // ───────────────────────────────────────────────────────────
  // Live platform stats
  // ───────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } =
    trpc.system.getPlatformStats.useQuery(undefined, {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });

  const totalUsers       = statsLoading ? "…" : formatCount(stats?.totalUsers);
  const activeListings   = statsLoading ? "…" : formatCount(stats?.activeListings);
  const totalTxns        = statsLoading ? "…" : formatCount(stats?.totalTransactions);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">About Sasto</h1>
          <p className="text-green-100 text-base mb-6 max-w-2xl mx-auto">
            Nepal's Cheapest Online Marketplace for buying, selling, renting, and auctioning items
          </p>

          {/* Live Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">{totalUsers}</p>
              <p className="text-xs">Registered Users</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">{activeListings}</p>
              <p className="text-xs">Active Listings</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">{totalTxns}</p>
              <p className="text-xs">Total Transactions</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">24/7</p>
              <p className="text-xs">Customer Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Our Mission</h2>
            <p className="text-sm text-muted-foreground mb-3">
              At Sasto, we believe in connecting buyers and sellers across Nepal through a safe, 
              transparent, and user-friendly platform. Our mission is to make buying and selling 
              as easy as possible for everyone.
            </p>
            <p className="text-sm text-muted-foreground">
              Whether you're looking to buy your next phone, sell your car, rent a property, or 
              bid on unique items, Sasto is your one-stop marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6 text-center">Why Choose Sasto?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border border-accent/30">
              <Zap className="w-8 h-8 text-accent mb-2" />
              <h3 className="text-base font-semibold mb-1">Fast &amp; Easy</h3>
              <p className="text-xs text-muted-foreground">
                Post an ad in minutes and reach thousands of buyers instantly.
              </p>
            </Card>

            <Card className="p-4 border border-accent/30">
              <Shield className="w-8 h-8 text-accent mb-2" />
              <h3 className="text-base font-semibold mb-1">Safe &amp; Secure</h3>
              <p className="text-xs text-muted-foreground">
                Verified users and secure messaging keep your transactions safe.
              </p>
            </Card>

            <Card className="p-4 border border-accent/30">
              <Users className="w-8 h-8 text-accent mb-2" />
              <h3 className="text-base font-semibold mb-1">Large Community</h3>
              <p className="text-xs text-muted-foreground">
                Connect with millions of users across Nepal every day.
              </p>
            </Card>

            <Card className="p-4 border border-accent/30">
              <CheckCircle className="w-8 h-8 text-accent mb-2" />
              <h3 className="text-base font-semibold mb-1">Trusted Platform</h3>
              <p className="text-xs text-muted-foreground">
                Ratings, reviews, and seller verification build trust.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Cryptographic Protection Section */}
      <section className="py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              Military-Grade Trust
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-3 tracking-tight">
              Cryptographically Secure Transactions &amp; Chats
            </h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto mt-2">
              Your security is our absolute priority. We deploy cutting-edge encryption to isolate and protect your personal information, chats, and marketplace bids.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border border-green-100 bg-green-50/10 shadow-sm hover:shadow-md transition-all rounded-2xl relative overflow-hidden group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-green-700 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AES-256 Symmetric Encryption</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                All message contents and support chats are symmetrically encrypted with 256-bit AES algorithms before hitting our database. Nobody else can intercept or read your conversations.
              </p>
            </Card>

            <Card className="p-6 border border-green-100 bg-green-50/10 shadow-sm hover:shadow-md transition-all rounded-2xl relative overflow-hidden group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-green-700 group-hover:scale-110 transition-transform">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Dynamic Initialization Vectors</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Every single message is packed with a dynamically randomized 16-byte cryptographic salt (IV). Even identical messages generate unique signatures, preventing pattern exploits.
              </p>
            </Card>

            <Card className="p-6 border border-green-100 bg-green-50/10 shadow-sm hover:shadow-md transition-all rounded-2xl relative overflow-hidden group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-green-700 group-hover:scale-110 transition-transform">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Real-Time SSL/TLS In-Transit</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Database entries and live WebSocket operations run inside secure SSL/TLS sockets. Transactions, verification submissions, and chats are sealed from third-party interception.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}