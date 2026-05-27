import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronDown,
  Search,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

// Format raw DB count into short readable form
function formatCount(n?: number): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K+`;
  return String(n);
}

// ─────────────────────────────────────────────────────────────
// FAQ DATA
// ─────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "How do I post an ad on Sasto?",
    answer:
      "Click on 'Post Ad', fill in item details, upload photos, and publish your listing. Your ad usually goes live within minutes.",
  },
  {
    question: "Is it safe to buy and sell on Sasto?",
    answer:
      "Yes. Sasto includes verified profiles, secure messaging, seller ratings, and moderation tools. Always meet in public places.",
  },
  {
    question: "How do I contact a seller?",
    answer:
      "Open the listing and click the message button to chat directly with the seller through Sasto Messages.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "Cash on delivery, mobile wallets, and bank transfers are commonly supported depending on the seller.",
  },
  {
    question: "Can I edit my listing after posting?",
    answer:
      "Yes. You can edit your listing title, description, images, and pricing anytime from your dashboard.",
  },
  {
    question: "How do auctions work on Sasto?",
    answer:
      "Set a starting price and auction duration. Buyers place bids and the highest bidder wins after the timer ends.",
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const [, navigate] = useLocation();

  // ───────────────────────────────────────────────────────────
  // Company Config
  // ───────────────────────────────────────────────────────────

  const { data: config } =
    trpc.system.getCompanyConfig.useQuery(undefined, {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });

  const { data: stats, isLoading: statsLoading } =
    trpc.system.getPlatformStats.useQuery(undefined, {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });

  const supportPhone =
    config?.phone || "+977-1-4123456";

  const supportEmail =
    config?.email || "support@sasto.com";

  const liveUsers = statsLoading ? "…" : formatCount(stats?.totalUsers);
  const liveFAQs  = FAQ_ITEMS.length.toString();

  // ───────────────────────────────────────────────────────────
  // Optimized Search
  // ───────────────────────────────────────────────────────────

  const filteredFAQ = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (!q) return FAQ_ITEMS;

    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // ───────────────────────────────────────────────────────────
  // Toggle FAQ
  // ───────────────────────────────────────────────────────────

  const toggleFAQ = (index: number) => {
    setExpandedIndex((prev) =>
      prev === index ? null : index
    );
  };

  // ───────────────────────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      {/* HERO - EXACT ORIGINAL STYLES */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Help Center
          </h1>

          <p className="text-green-100 text-base mb-6 max-w-2xl mx-auto">
            Find answers, get support, and learn how to safely buy and sell on Sasto.
          </p>

          {/* STATS – live data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              ["24/7",      "Support"],
              ["100%",      "Secure"],
              [liveUsers,   "Registered Users"],
              [liveFAQs,    "FAQs Available"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="bg-white/20 rounded-lg p-2"
              >
                <p className="text-xl font-bold">
                  {value}
                </p>
                <p className="text-xs">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ SECTION */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all"
                />
              </div>
            </div>

            {/* Title */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-black text-gray-900">
                Frequently Asked Questions
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                {filteredFAQ.length} Results
              </span>
            </div>

            {/* FAQ LIST */}
            <div className="space-y-3">
              {filteredFAQ.length === 0 ? (
                <Card className="p-8 text-center border border-gray-200">
                  <p className="text-sm text-gray-500">
                    No results found. Try a different keyword.
                  </p>
                </Card>
              ) : (
                filteredFAQ.map((item, index) => {
                  const isExpanded =
                    expandedIndex === index;

                  return (
                    <Card
                      key={index}
                      className="overflow-hidden border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all"
                    >
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                      >
                        <h3 className="font-semibold text-sm md:text-base text-gray-900 pr-4">
                          {item.question}
                        </h3>
                        <ChevronDown
                          className={`w-5 h-5 text-green-600 transition-transform duration-200 flex-shrink-0 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50/50">
                          <p className="text-sm text-gray-600 leading-relaxed pt-4">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="bg-gray-50 py-8 md:py-12 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-center mb-8">
              Need More Help?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* EMAIL */}
              <Card className="p-5 text-center border border-gray-200 rounded-2xl hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">
                  Email Support
                </h3>
                <p className="text-xs text-gray-500 mb-5 break-all">
                  {supportEmail}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = `mailto:${supportEmail}`;
                  }}
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                >
                  Send Email
                </Button>
              </Card>

              {/* PHONE */}
              <Card className="p-5 text-center border border-gray-200 rounded-2xl hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">
                  Phone Support
                </h3>
                <p className="text-xs text-gray-500 mb-5">
                  {supportPhone}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = `tel:${supportPhone}`;
                  }}
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                >
                  Call Now
                </Button>
              </Card>

              {/* CHAT */}
              <Card className="p-5 text-center border border-gray-200 rounded-2xl hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">
                  Live Chat
                </h3>
                <p className="text-xs text-gray-500 mb-5">
                  Chat directly with our support team
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate("/messages?partnerId=1");
                  }}
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                >
                  Start Chat
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY TIPS SECTION */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black mb-6">
              Safety Tips
            </h2>

            <div className="space-y-4">
              {[
                {
                  title: "Meet in Safe Places",
                  desc: "Always meet buyers and sellers in public, well-lit locations whenever possible.",
                },
                {
                  title: "Verify Before Paying",
                  desc: "Inspect products carefully before making payment or confirming delivery.",
                },
                {
                  title: "Use Secure Payment",
                  desc: "Avoid risky payment methods for expensive items and keep proof of payment.",
                },
                {
                  title: "Check Seller Ratings",
                  desc: "Review seller ratings and previous buyer feedback before purchasing.",
                },
                {
                  title: "Report Suspicious Activity",
                  desc: "Immediately report scams, fake listings, or suspicious behavior to Sasto support.",
                },
              ].map((tip, index) => (
                <Card
                  key={index}
                  className="p-5 border border-gray-200 rounded-2xl hover:shadow-sm transition-all"
                >
                  <h3 className="font-bold text-sm md:text-base text-gray-900 mb-2">
                    ✓ {tip.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {tip.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}