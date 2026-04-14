import { prisma } from "@/lib/prisma"
import { GmailService } from "./google-services"
import * as chrono from "chrono-node"

export class EmailService {
  /**
   * Send an email immediately and log to DB
   */
  static async sendEmail(params: {
    userId: string
    to: string
    subject: string
    body: string
    accessToken: string
    scheduledAt?: string // Optional for future sending
  }) {
    const scheduledDate = params.scheduledAt ? chrono.parseDate(params.scheduledAt) : null

    // 1. Log to Database
    const emailRecord = await prisma.email.create({
      data: {
        userId: params.userId,
        to: params.to,
        subject: params.subject,
        body: params.body,
        status: scheduledDate ? "SCHEDULED" : "SENT",
        scheduledAt: scheduledDate,
      },
    })

    // 2. Send immediately if not scheduled
    if (!scheduledDate) {
      const sent = await GmailService.sendNotification(params.accessToken, {
        to: params.to,
        subject: params.subject,
        body: params.body,
      })

      if (!sent) {
        // Update status to failed or pending
        await prisma.email.update({
          where: { id: emailRecord.id },
          data: { status: "FAILED" },
        })
        throw new Error("Failed to send email via Gmail API")
      }
    }

    return emailRecord
  }

  /**
   * List emails for a user
   */
  static async listEmails(userId: string, status?: string) {
    return await prisma.email.findMany({
      where: {
        userId,
        ...(status && status !== "ALL" ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Process pending scheduled emails (Cron Job Logic)
   */
  static async processScheduledEmails(accessToken: string) {
    const now = new Date()
    const pending = await prisma.email.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
    })

    const results = []
    for (const email of pending) {
      const sent = await GmailService.sendNotification(accessToken, {
        to: email.to,
        subject: email.subject,
        body: email.body,
      })

      if (sent) {
        const updated = await prisma.email.update({
          where: { id: email.id },
          data: { status: "SENT" },
        })
        results.push(updated)
      }
    }

    return results
  }
}
