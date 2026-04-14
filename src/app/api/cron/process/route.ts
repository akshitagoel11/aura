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
    for (const user of usersWithScheduled as any[]) {
      const accessToken = user.accounts[0]?.access_token
      if (accessToken) {
        const processed = await EmailService.processScheduledEmails(accessToken)
        results.push(...processed)
      }
    }

    return NextResponse.json({ 
      success: true, 
      processedCount: results.length 
    })
  } catch (error) {
    console.error("Cron failed:", error)
    return NextResponse.json({ error: "Cron processing failed" }, { status: 500 })
  }
}
