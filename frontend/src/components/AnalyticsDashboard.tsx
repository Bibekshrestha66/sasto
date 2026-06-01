import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, BarChart, PieChart, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

interface AnalyticsData {
  totalRevenue: number;
  totalUsers: number;
  totalTransactions: number;
  averageOrderValue: number;
  conversionRate: number;
  userGrowth: number[];
  revenueGrowth: number[];
  topCategories: { name: string; count: number }[];
  userRetention: number;
  customerSatisfaction: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`/api/analytics?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-red-600">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'year'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`Rs. ${analytics.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-8 h-8 text-green-600" />}
          trend={12}
        />
        <MetricCard
          title="Total Users"
          value={analytics.totalUsers.toLocaleString()}
          icon={<Users className="w-8 h-8 text-blue-600" />}
          trend={8}
        />
        <MetricCard
          title="Transactions"
          value={analytics.totalTransactions.toLocaleString()}
          icon={<ShoppingCart className="w-8 h-8 text-orange-600" />}
          trend={15}
        />
        <MetricCard
          title="Avg Order Value"
          value={`Rs. ${analytics.averageOrderValue.toLocaleString()}`}
          icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
          trend={5}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <Card className="p-6 border-2 border-dashed border-green-300">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Revenue Trend
          </h3>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-500">
            Revenue chart visualization
          </div>
        </Card>

        {/* Top Categories */}
        <Card className="p-6 border-2 border-dashed border-green-300">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Top Categories
          </h3>
          <div className="space-y-3">
            {analytics.topCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.name}</span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{
                        width: `${(category.count / Math.max(...analytics.topCategories.map(c => c.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                    {category.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PerformanceMetric
          title="Conversion Rate"
          value={`${analytics.conversionRate.toFixed(2)}%`}
          target="5%"
        />
        <PerformanceMetric
          title="User Retention"
          value={`${analytics.userRetention.toFixed(1)}%`}
          target="80%"
        />
        <PerformanceMetric
          title="Customer Satisfaction"
          value={`${analytics.customerSatisfaction.toFixed(1)}/5`}
          target="4.5/5"
        />
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend }) => (
  <Card className="p-4 border-2 border-dashed border-green-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className="text-xs text-green-600 mt-1">
            ↑ {trend}% from last period
          </p>
        )}
      </div>
      <div className="text-gray-400">{icon}</div>
    </div>
  </Card>
);

interface PerformanceMetricProps {
  title: string;
  value: string;
  target: string;
}

const PerformanceMetric: React.FC<PerformanceMetricProps> = ({ title, value, target }) => (
  <Card className="p-4 border-2 border-dashed border-green-300">
    <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
    <p className="text-3xl font-bold text-green-600 mb-1">{value}</p>
    <p className="text-xs text-gray-600">Target: {target}</p>
  </Card>
);

export default AnalyticsDashboard;
