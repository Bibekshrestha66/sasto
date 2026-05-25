import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, MessageSquare, Award, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ReviewAnalyticsDashboardProps {
  userId: number;
}

export function ReviewAnalyticsDashboard({ userId }: ReviewAnalyticsDashboardProps) {
  const { data: analytics } = trpc.reviews.getAnalytics.useQuery(userId);
  // const { data: trends } = trpc.reviews.getTrends.useQuery(userId);
  // const { data: keywords } = trpc.reviews.getKeywords.useQuery(userId);

  // Mock data for charts (replace with real data from API)
  const ratingTrendData = [
    { month: "Jan", avg: 4.2 },
    { month: "Feb", avg: 4.3 },
    { month: "Mar", avg: 4.1 },
    { month: "Apr", avg: 4.5 },
    { month: "May", avg: 4.4 },
    { month: "Jun", avg: 4.6 },
  ];

  const ratingDistribution = [
    { name: "5 Stars", value: analytics?.fiveStarCount || 0, color: "#fbbf24" },
    { name: "4 Stars", value: analytics?.fourStarCount || 0, color: "#60a5fa" },
    { name: "3 Stars", value: analytics?.threeStarCount || 0, color: "#34d399" },
    { name: "2 Stars", value: analytics?.twoStarCount || 0, color: "#f87171" },
    { name: "1 Star", value: analytics?.oneStarCount || 0, color: "#ef4444" },
  ];

  const topKeywords = [
    { word: "Fast shipping", count: 45 },
    { word: "Good quality", count: 38 },
    { word: "Excellent service", count: 32 },
    { word: "Reliable seller", count: 28 },
    { word: "Highly recommended", count: 25 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Review Analytics</h1>
        <p className="text-gray-600">Track your seller performance and customer feedback trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-3xl font-bold">{analytics?.averageRating?.toFixed(1) || "N/A"}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reviews</p>
              <p className="text-3xl font-bold">{analytics?.totalReviews || 0}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Positive Reviews</p>
              <p className="text-3xl font-bold">{((analytics?.fiveStarCount || 0) + (analytics?.fourStarCount || 0))}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Response Rate</p>
              <p className="text-3xl font-bold">{((analytics as any)?.responseRate)?.toFixed(1) || "0"}%</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Rating Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="keywords">Top Keywords</TabsTrigger>
        </TabsList>

        {/* Rating Trends Chart */}
        <TabsContent value="trends">
          <Card className="p-6 border-2 border-dashed border-accent">
            <h3 className="text-lg font-semibold mb-4">Average Rating Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ratingTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" stroke="#f97316" strokeWidth={2} name="Average Rating" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Rating Distribution Chart */}
        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-6 border-2 border-dashed border-accent">
              <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={ratingDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 border-2 border-dashed border-accent">
              <h3 className="text-lg font-semibold mb-4">Rating Breakdown</h3>
              <div className="space-y-3">
                {ratingDistribution.map((rating) => (
                  <div key={rating.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rating.color }} />
                      <span className="text-sm">{rating.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            backgroundColor: rating.color,
                            width: `${(rating.value / (analytics?.totalReviews || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{rating.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Top Keywords */}
        <TabsContent value="keywords">
          <Card className="p-6 border-2 border-dashed border-accent">
            <h3 className="text-lg font-semibold mb-4">Most Mentioned Keywords</h3>
            <div className="space-y-3">
              {topKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{keyword.word}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${(keyword.count / 45) * 100}%` }} />
                    </div>
                    <Badge variant="secondary">{keyword.count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      <Card className="p-6 border-2 border-dashed border-green-300 bg-green-50">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Recommendations to Improve Your Rating
        </h3>
        <ul className="space-y-2 text-sm">
          <li>✓ Respond to all reviews within 24 hours to show customer care</li>
          <li>✓ Focus on improving shipping speed - mentioned in negative reviews</li>
          <li>✓ Maintain consistent product quality - your strength is reliability</li>
          <li>✓ Consider offering a loyalty program for repeat customers</li>
        </ul>
      </Card>
    </div>
  );
}
