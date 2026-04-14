import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AnalyticsService } from "@/lib/services/analytics-service"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const stats = await AnalyticsService.getUserAnalytics(session.user.id)
    
    return NextResponse.json({
      metrics: {
        ...stats,
        completionRate: stats.productivityScore,
        categoryDistribution: {} // Simplified for now
      }
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
