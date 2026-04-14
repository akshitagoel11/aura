import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { startOfDay, endOfDay, subDays, format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "7d"

    const now = new Date()
    let startDate: Date

    switch (period) {
      case "24h":
        startDate = subDays(now, 1)
        break
      case "7d":
        startDate = subDays(now, 7)
        break
      case "30d":
        startDate = subDays(now, 30)
        break
      case "90d":
        startDate = subDays(now, 90)
        break
      default:
        startDate = subDays(now, 7)
    }

    const [
      tasksStats,
      activitiesStats,
      categoryDistribution,
      dailyStats,
      recentAnalytics,
    ] = await Promise.all([
      prisma.task.groupBy({
        by: ["status"],
        where: {
          userId: session.user.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),
      prisma.activity.groupBy({
        by: ["type"],
        where: {
          userId: session.user.id,
          startedAt: { gte: startDate },
        },
        _count: { id: true },
        _sum: { duration: true },
      }),
      prisma.task.groupBy({
        by: ["category"],
        where: {
          userId: session.user.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),
      prisma.$queryRaw`
        SELECT 
          created_at::date as date,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
          COUNT(*) as created
        FROM tasks
        WHERE user_id = ${session.user.id}
          AND created_at >= ${startDate}
        GROUP BY created_at::date
        ORDER BY date DESC
        LIMIT 30
      `,
      prisma.analytics.findMany({
        where: {
          userId: session.user.id,
          date: { gte: startDate },
        },
        orderBy: { date: "desc" },
      }),
    ])

    const totalTasks = tasksStats.reduce((sum, s) => sum + s._count.id, 0)
    const completedTasks =
      tasksStats.find((s) => s.status === "COMPLETED")?._count.id || 0
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const focusTime =
      activitiesStats.find((s) => s.type === "FOCUS")?._sum.duration || 0
    const breakTime =
      activitiesStats.find((s) => s.type === "BREAK")?._sum.duration || 0
    const meetingTime =
      activitiesStats.find((s) => s.type === "MEETING")?._sum.duration || 0

    const categoryData: Record<string, number> = {}
    categoryDistribution.forEach((c) => {
      categoryData[c.category] = c._count.id
    })

    const weeklyTrend = (dailyStats as any[]).map((d) => ({
      date: format(new Date(d.date), "MMM dd"),
      score: Math.round((Number(d.completed) / Math.max(Number(d.created), 1)) * 100),
      tasksCompleted: Number(d.completed),
    }))

    const productivityScore = Math.min(
      Math.round(
        completionRate * 0.4 +
          Math.min(focusTime / 60, 40) +
          Math.min(completedTasks * 2, 20)
      ),
      100
    )

    const today = startOfDay(now)
    let todayAnalytics = await prisma.analytics.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    })

    const parseJSON = (str: any) => {
      if (!str) return null
      try {
        return typeof str === "string" ? JSON.parse(str) : str
      } catch (e) {
        return str
      }
    }

    if (!todayAnalytics) {
      todayAnalytics = await prisma.analytics.create({
        data: {
          userId: session.user.id,
          date: today,
          productivityScore,
          tasksCompleted: completedTasks,
          tasksCreated: totalTasks,
          focusTime,
          breakTime,
          meetingTime,
          categoryData: JSON.stringify(categoryData),
        },
      })
    } else {
      todayAnalytics = await prisma.analytics.update({
        where: { id: todayAnalytics.id },
        data: {
          productivityScore,
          tasksCompleted: completedTasks,
          tasksCreated: totalTasks,
          focusTime,
          breakTime,
          meetingTime,
          categoryData: JSON.stringify(categoryData),
        },
      })
    }

    return NextResponse.json({
      metrics: {
        productivityScore,
        tasksCompleted: completedTasks,
        tasksCreated: totalTasks,
        completionRate: Math.round(completionRate),
        focusTime,
        breakTime,
        meetingTime,
        categoryDistribution: categoryData,
        weeklyTrend,
      },
      recentAnalytics: recentAnalytics.map(a => ({
        ...a,
        categoryData: parseJSON(a.categoryData)
      })),
      todayAnalytics: {
        ...todayAnalytics,
        categoryData: parseJSON(todayAnalytics.categoryData)
      },
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { date, productivityScore, ...data } = body

    const analyticsDate = date ? new Date(date) : startOfDay(new Date())

    const analytics = await prisma.analytics.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: analyticsDate,
        },
      },
      update: {
        ...data,
        productivityScore,
      },
      create: {
        userId: session.user.id,
        date: analyticsDate,
        productivityScore: productivityScore || 0,
        ...data,
      },
    })

    return NextResponse.json(analytics, { status: 201 })
  } catch (error) {
    console.error("Error creating analytics:", error)
    return NextResponse.json(
      { error: "Failed to create analytics" },
      { status: 500 }
    )
  }
}
