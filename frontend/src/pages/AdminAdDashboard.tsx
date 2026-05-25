import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart3, TrendingUp, Eye, MousePointer, AlertCircle, Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminAdDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "ads" | "advertisers" | "analytics">("overview");
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [showAdvertiserDialog, setShowAdvertiserDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    adType: "banner",
    placement: "homepage",
    status: "active",
    budget: 0,
    startDate: "",
    endDate: "",
  });

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access the admin dashboard.</p>
        </Card>
      </div>
    );
  }

  // Mock data for demonstration
  const adStats = {
    totalAds: 24,
    activeAds: 18,
    totalImpressions: 125420,
    totalClicks: 3842,
    averageCTR: 3.06,
    totalRevenue: 15240.50,
  };

  const ads = [
    {
      id: 1,
      title: "Premium Electronics Store",
      advertiser: "TechHub Nepal",
      type: "banner",
      placement: "homepage",
      status: "active",
      impressions: 5420,
      clicks: 142,
      ctr: 2.62,
      budget: 500,
      spent: 342.50,
      startDate: "2026-01-15",
      endDate: "2026-02-15",
    },
    {
      id: 2,
      title: "Real Estate Investment",
      advertiser: "Property Nepal",
      type: "sidebar",
      placement: "marketplace",
      status: "active",
      impressions: 3200,
      clicks: 85,
      ctr: 2.66,
      budget: 300,
      spent: 198.75,
      startDate: "2026-01-20",
      endDate: "2026-02-20",
    },
    {
      id: 3,
      title: "Car Rental Services",
      advertiser: "Drive Nepal",
      type: "featured",
      placement: "auctions",
      status: "paused",
      impressions: 2100,
      clicks: 52,
      ctr: 2.48,
      budget: 250,
      spent: 125.00,
      startDate: "2026-01-10",
      endDate: "2026-02-10",
    },
  ];

  const advertisers = [
    {
      id: 1,
      name: "TechHub Nepal",
      email: "contact@techhub.np",
      status: "verified",
      balance: 1250.50,
      totalSpent: 3420.75,
      activeAds: 3,
      joinDate: "2025-12-01",
    },
    {
      id: 2,
      name: "Property Nepal",
      email: "info@propertynepal.np",
      status: "verified",
      balance: 850.25,
      totalSpent: 2100.00,
      activeAds: 2,
      joinDate: "2025-11-15",
    },
    {
      id: 3,
      name: "Drive Nepal",
      email: "support@drivenepal.np",
      status: "pending",
      balance: 0,
      totalSpent: 125.00,
      activeAds: 1,
      joinDate: "2026-01-10",
    },
  ];

  const handleApproveAd = (adId: number) => {
    toast.success("Ad approved successfully");
  };

  const handleRejectAd = (adId: number) => {
    toast.error("Ad rejected");
  };

  const handleVerifyAdvertiser = (advertiserId: number) => {
    toast.success("Advertiser verified successfully");
  };

  const handleSaveAd = () => {
    toast.success("Ad saved successfully");
    setShowAdDialog(false);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      adType: "banner",
      placement: "homepage",
      status: "active",
      budget: 0,
      startDate: "",
      endDate: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ad Management Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage advertisements, track analytics, and control advertiser accounts</p>
            </div>
            <Dialog open={showAdDialog} onOpenChange={setShowAdDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Ad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Advertisement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ad Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter ad title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter ad description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ad Type</label>
                      <Select value={formData.adType} onValueChange={(value) => setFormData({ ...formData, adType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="banner">Banner</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                          <SelectItem value="featured">Featured</SelectItem>
                          <SelectItem value="popup">Popup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Placement</label>
                      <Select value={formData.placement} onValueChange={(value) => setFormData({ ...formData, placement: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homepage">Homepage</SelectItem>
                          <SelectItem value="marketplace">Marketplace</SelectItem>
                          <SelectItem value="auctions">Auctions</SelectItem>
                          <SelectItem value="rentals">Rentals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button onClick={handleSaveAd} className="bg-green-600 hover:bg-green-700">
                      Create Ad
                    </Button>
                    <Button onClick={() => setShowAdDialog(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
            {["overview", "ads", "advertisers", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Ads</p>
                    <p className="text-3xl font-bold mt-2">{adStats.totalAds}</p>
                    <p className="text-green-600 text-xs mt-1">Active: {adStats.activeAds}</p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Impressions</p>
                    <p className="text-3xl font-bold mt-2">{adStats.totalImpressions.toLocaleString()}</p>
                    <p className="text-blue-600 text-xs mt-1">This month</p>
                  </div>
                  <Eye className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Clicks</p>
                    <p className="text-3xl font-bold mt-2">{adStats.totalClicks.toLocaleString()}</p>
                    <p className="text-purple-600 text-xs mt-1">CTR: {adStats.averageCTR}%</p>
                  </div>
                  <MousePointer className="w-12 h-12 text-purple-500 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold mt-2">NPR {adStats.totalRevenue.toLocaleString()}</p>
                    <p className="text-green-600 text-xs mt-1">+12% from last month</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Active Advertisers</p>
                    <p className="text-3xl font-bold mt-2">{advertisers.filter((a) => a.status === "verified").length}</p>
                    <p className="text-orange-600 text-xs mt-1">Pending: {advertisers.filter((a) => a.status === "pending").length}</p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-orange-500 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Average CTR</p>
                    <p className="text-3xl font-bold mt-2">{adStats.averageCTR}%</p>
                    <p className="text-blue-600 text-xs mt-1">Industry avg: 2.5%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Ad Activity</h3>
              <div className="space-y-3">
                {ads.slice(0, 3).map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{ad.title}</p>
                      <p className="text-sm text-gray-600">{ad.advertiser}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{ad.impressions.toLocaleString()} impressions</p>
                        <p className="text-xs text-gray-600">{ad.clicks} clicks</p>
                      </div>
                      <Badge variant={ad.status === "active" ? "default" : "secondary"}>{ad.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === "ads" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Advertisements</h2>
              <Input placeholder="Search ads..." className="w-64" />
            </div>

            <div className="space-y-3">
              {ads.map((ad) => (
                <Card key={ad.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{ad.title}</h3>
                        <Badge variant={ad.status === "active" ? "default" : "secondary"}>{ad.status}</Badge>
                        <Badge variant="outline">{ad.type}</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="text-xs text-gray-500">Advertiser</p>
                          <p className="font-medium text-gray-900">{ad.advertiser}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Impressions</p>
                          <p className="font-medium text-gray-900">{ad.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Clicks</p>
                          <p className="font-medium text-gray-900">{ad.clicks}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">CTR</p>
                          <p className="font-medium text-gray-900">{ad.ctr}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Advertisers Tab */}
        {activeTab === "advertisers" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Advertisers</h2>
              <Input placeholder="Search advertisers..." className="w-64" />
            </div>

            <div className="space-y-3">
              {advertisers.map((advertiser) => (
                <Card key={advertiser.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{advertiser.name}</h3>
                        <Badge variant={advertiser.status === "verified" ? "default" : "secondary"}>{advertiser.status}</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{advertiser.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Balance</p>
                          <p className="font-medium text-gray-900">NPR {advertiser.balance.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Spent</p>
                          <p className="font-medium text-gray-900">NPR {advertiser.totalSpent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Active Ads</p>
                          <p className="font-medium text-gray-900">{advertiser.activeAds}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {advertiser.status === "pending" && (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerifyAdvertiser(advertiser.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Impressions Trend</p>
                  <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart placeholder</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Click Through Rate</p>
                  <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart placeholder</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Revenue by Placement</p>
                  <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart placeholder</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Revenue by Advertiser</p>
                  <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart placeholder</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
