import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const AdvertiserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: profile } = trpc.ads.getAdvertiserProfile.useQuery();
  const { data: ads } = trpc.ads.getAdvertiserAds.useQuery();
  const { data: paymentHistory } = trpc.ads.getPaymentHistory.useQuery();

  if (!user) {
    return <div>Please log in to access advertiser dashboard</div>;
  }

  if (!profile) {
    return <RegisterAdvertiserForm />;
  }

  const totalSpend = ads?.reduce((sum, ad) => sum + Number(ad.totalBudget || 0), 0) || 0;
  const totalImpressions = ads?.reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0;
  const totalClicks = ads?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Advertiser Dashboard</h1>
          <p className="text-gray-600">Manage your ads, track performance, and grow your business</p>
        </div>

        {/* Account Balance Card */}
        <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader>
            <CardTitle className="text-green-900">Account Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-4xl font-bold text-green-600">
                  Rs. {Number(profile.accountBalance || 0).toFixed(2)}
                </p>
                <p className="text-green-700 mt-2">Available for advertising</p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">Add Funds</Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Total Spend" value={`Rs. ${totalSpend.toFixed(2)}`} />
          <MetricCard title="Impressions" value={totalImpressions.toLocaleString()} />
          <MetricCard title="Clicks" value={totalClicks.toLocaleString()} />
          <MetricCard title="CTR" value={`${ctr}%`} />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ads">My Ads</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={generateChartData(ads || [])}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="impressions" stroke="#00AA44" />
                      <Line type="monotone" dataKey="clicks" stroke="#FFA500" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Ad Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Ad Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={generateStatusData(ads || [])}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#00AA44" />
                        <Cell fill="#FFA500" />
                        <Cell fill="#FF6B6B" />
                        <Cell fill="#4ECDC4" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Your Ads</h3>
              <Button className="bg-green-600 hover:bg-green-700">Create New Ad</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads?.map((ad) => (
                <Card key={ad.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{ad.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ad.status)}`}>
                        {ad.status}
                      </span>
                      <span className="text-xs">{ad.adType}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Impressions:</span>
                      <span className="font-semibold">{ad.impressions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Clicks:</span>
                      <span className="font-semibold">{ad.clicks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-semibold">Rs. {ad.totalBudget}</span>
                    </div>
                    <div className="pt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">Edit</Button>
                      <Button size="sm" variant="outline" className="flex-1">View</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>Track your ad performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ads?.map((ad) => (
                    <div key={ad.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <h4 className="font-semibold mb-2">{ad.title}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Impressions</p>
                          <p className="font-semibold">{ad.impressions}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Clicks</p>
                          <p className="font-semibold">{ad.clicks}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">CTR</p>
                          <p className="font-semibold">
                            {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0'}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">CPC</p>
                          <p className="font-semibold">Rs. {ad.costPerClick}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Budget</p>
                          <p className="font-semibold">Rs. {ad.totalBudget}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View your transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {paymentHistory?.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-semibold">Rs. {payment.amount}</p>
                        <p className="text-sm text-gray-600">{payment.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </CardContent>
  </Card>
);

const RegisterAdvertiserForm: React.FC = () => {
  const registerMutation = trpc.ads.registerAdvertiser.useMutation();
  const [formData, setFormData] = React.useState({
    businessName: '',
    businessUrl: '',
    contactEmail: '',
    contactPhone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Register as Advertiser</CardTitle>
          <CardDescription>Create an advertiser account to start running ads</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Business Name"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="url"
              placeholder="Business URL (optional)"
              value={formData.businessUrl}
              onChange={(e) => setFormData({ ...formData, businessUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="email"
              placeholder="Contact Email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="tel"
              placeholder="Contact Phone (optional)"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper Functions
function generateChartData(ads: any[]) {
  const data: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: Math.floor(Math.random() * 1000),
      clicks: Math.floor(Math.random() * 100),
    });
  }
  return data;
}

function generateStatusData(ads: any[]) {
  const statusCounts = ads.reduce((acc, ad) => {
    acc[ad.status] = (acc[ad.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    paused: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'text-green-600',
    pending: 'text-yellow-600',
    failed: 'text-red-600',
    refunded: 'text-gray-600',
  };
  return colors[status] || 'text-gray-600';
}

export default AdvertiserDashboard;
