import { NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/services/email-service"
import { ReminderService } from "@/lib/services/reminder-service"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  // 1. Basic Security: Check for Cron Secret
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const results = {
      emailsProcessed: 0,
      remindersProcessed: 0,
      tasksOverdueUpdated: 0,
    }

    // 2. Fetch users with scheduled emails
    const pendingEmails = await (prisma as any).email.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() }
      },
      select: { userId: true },
      distinct: ['userId']
    })

    const userIds = pendingEmails.map((e: any) => e.userId)
    
    if (userIds.length > 0) {
      const usersWithScheduled = await prisma.user.findMany({
        where: { id: { in: userIds } },
        include: {
          accounts: {
            where: { provider: "google" },
            take: 1
          }
        }
      })

      // Process emails
      for (const user of usersWithScheduled as any[]) {
        const accessToken = user.accounts[0]?.access_token
        if (accessToken) {
          const processed = await EmailService.processScheduledEmails(accessToken)
          results.emailsProcessed += processed.length
        }
      }
    }

    // 3. Process pending reminders globally
    // We update missed reminders
    const updatedReminders = await (prisma as any).reminder.updateMany({
      where: {
        status: "UPCOMING",
        scheduledAt: { lt: new Date() },
      },
      data: { status: "MISSED" },
    })
    results.remindersProcessed = updatedReminders.count

    // 4. Delayed tasks processing
    // Update tasks that are past due and not completed
    const overdueTasks = await prisma.task.updateMany({
      where: {
        status: { notIn: ["COMPLETED", "OVERDUE"] },
        dueDate: { lt: new Date() }
      },
      data: { status: "OVERDUE" }
    })
    results.tasksOverdueUpdated = overdueTasks.count

    return NextResponse.json({ 
      success: true, 
      results
    })
  } catch (error) {
    console.error("Cron failed:", error)
    return NextResponse.json({ error: "Cron processing failed" }, { status: 500 })
  }
}
