import { useQuery } from "@tanstack/react-query"
import { ProductivityMetrics } from "@/types"

interface AnalyticsResponse {
  metrics: ProductivityMetrics
  recentAnalytics: any[]
  todayAnalytics: any
}

async function fetchAnalytics(period: string = "7d"): Promise<AnalyticsResponse> {
  const response = await fetch(`/api/analytics?period=${period}`)
  if (!response.ok) {
    throw new Error("Failed to fetch analytics")
  }
  return response.json()
}

export function useAnalytics(period: string = "7d") {
  return useQuery({
    queryKey: ["analytics", period],
    queryFn: () => fetchAnalytics(period),
  })
}
