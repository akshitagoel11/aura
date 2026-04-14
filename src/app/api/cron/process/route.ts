import { NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/services/email-service"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  // 1. Basic Security: Check for Cron Secret
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 2. Process Scheduled Emails
    // Note: We need a valid Google Access Token for each user.
    // In a production app, we would use a Refresh Token to get a fresh Access Token.
    // For now, we'll process users who have active sessions or recent tokens.
    
    // 2. Fetch all unique user IDs who have pending scheduled emails
    const pendingEmails = await (prisma as any).email.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() }
      },
      select: { userId: true },
      distinct: ['userId']
    })

    const userIds = pendingEmails.map((e: any) => e.userId)
    
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, processedCount: 0 })
    }

    // 3. Fetch those users with their Google accounts
    const usersWithScheduled = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        accounts: {
          where: { provider: "google" },
          take: 1
        }
      }
    })

    const results = []
    let emailsProcessed = 0

    for (const user of usersWithScheduled as any[]) {
      try {
        const accessToken = user.accounts[0]?.access_token
        if (accessToken) {
          const processed = await EmailService.processScheduledEmails(accessToken)
          emailsProcessed += processed.length
        }
      } catch (err) {
        console.error(`Failed to process emails for user ${user.id}:`, err)
      }
    }

    // 4. Update missed reminders globally
    const now = new Date()
    let remindersProcessed = 0
    try {
      const updatedReminders = await (prisma as any).reminder.updateMany({
        where: {
          status: "UPCOMING",
          scheduledAt: { lt: now }
        },
        data: { status: "MISSED" }
      })
      remindersProcessed = updatedReminders.count
    } catch (err) {
      console.error("Failed to update missed reminders:", err)
    }

    return NextResponse.json({ 
      success: true, 
      emailsProcessed,
      remindersProcessed
    })
  } catch (error) {
    console.error("Cron failed:", error)
    return NextResponse.json({ error: "Cron processing failed" }, { status: 500 })
  }
}
