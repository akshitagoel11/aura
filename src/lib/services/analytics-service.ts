import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays } from "date-fns"

export class AnalyticsService {
  /**
   * Get dashboard analytics for a user
   */
  static async getUserAnalytics(userId: string) {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    // 1. Fetch counts
    const [tasksCompleted, tasksTotal, emailsSent, remindersCreated] = await Promise.all([
      prisma.task.count({ where: { userId, status: "COMPLETED", completedAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.task.count({ where: { userId, createdAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.email.count({ where: { userId, status: "SENT", createdAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.reminder.count({ where: { userId, createdAt: { gte: todayStart, lte: todayEnd } } }),
    ])

    // 2. Calculate Productivity Score
    // Formula: (tasksCompleted / max(1, tasksTotal)) * 100
    const productivityScore = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0

    // 3. Weekly Trend (last 7 days)
    const weeklyTrend = []
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i)
      const start = startOfDay(day)
      const end = endOfDay(day)

      const dailyCompleted = await prisma.task.count({
        where: { userId, status: "COMPLETED", completedAt: { gte: start, lte: end } }
      })
      const dailyTotal = await prisma.task.count({
        where: { userId, createdAt: { gte: start, lte: end } }
      })

      weeklyTrend.push({
        date: day.toLocaleDateString("en-US", { weekday: "short" }),
        score: dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0,
        completed: dailyCompleted
      })
    }

    return {
      tasksCompleted,
      tasksCreated: tasksTotal,
      emailsSent,
      remindersCreated,
      productivityScore,
      weeklyTrend,
    }
  }
}
