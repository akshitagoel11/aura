"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnalytics } from "@/lib/hooks"
import { formatDuration } from "@/lib/utils"

const COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"]

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState("7d")
  const { data, isLoading } = useAnalytics(period)

  const metrics = data?.metrics

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const categoryData = Object.entries(metrics.categoryDistribution || {}).map(
    ([name, value]) => ({ name, value })
  )

  const weeklyData = metrics.weeklyTrend || []

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-aura-500" />
            <CardTitle className="text-lg font-semibold">Analytics</CardTitle>
          </div>
          <Tabs value={period} onValueChange={setPeriod} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-xs px-2">
                7D
              </TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-2">
                30D
              </TabsTrigger>
              <TabsTrigger value="90d" className="text-xs px-2">
                90D
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-aura-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-aura-700 mb-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Productivity Score</span>
            </div>
            <div className="text-3xl font-bold text-aura-900">
              {metrics.productivityScore}
            </div>
            <Progress
              value={metrics.productivityScore}
              className="h-2 mt-2"
            />
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Completion Rate</span>
            </div>
            <div className="text-3xl font-bold text-green-900">
              {metrics.completionRate}%
            </div>
            <Progress value={metrics.completionRate} className="h-2 mt-2" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-semibold">
              {formatDuration(metrics.focusTime)}
            </div>
            <div className="text-xs text-muted-foreground">Focus Time</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-orange-500" />
            <div className="text-lg font-semibold">
              {formatDuration(metrics.meetingTime)}
            </div>
            <div className="text-xs text-muted-foreground">Meeting Time</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="h-4 w-4 mx-auto mb-1 rounded-full bg-green-500" />
            <div className="text-lg font-semibold">
              {formatDuration(metrics.breakTime)}
            </div>
            <div className="text-xs text-muted-foreground">Break Time</div>
          </div>
        </div>

        {weeklyData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Weekly Trend</h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ fill: "#0ea5e9", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {categoryData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Category Distribution</h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
